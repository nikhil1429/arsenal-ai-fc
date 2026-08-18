#!/usr/bin/env node
// ============================================================================
// brain.mjs · ARSENAL AI FC — THE ORGANISM: THE BRAIN (hot runtime)
// ----------------------------------------------------------------------------
// WHAT:  The crown (ORGANISM_ANATOMY §5). A deterministic job runtime that
//        runs the organism's intelligence HOT — as many `claude -p` calls as
//        it takes to stay sharp around the clock, deliberately exhausting the
//        Max 5x plan (captain's standing order, 12 Jul 2026), weighted to the
//        overnight idle hours, while PROTECTING his study hours so he is
//        never locked out of his own plan. Two brains: Claude (judgment,
//        coaching, the hard reads) and Gemini CLI (visualization, long-context
//        — free on his Google account; flagged off until wired).
// HOW (the Manager tracking tokens, mechanically):
//   · every call logs usage to brain_ledger.jsonl; the rolling 5h window and
//     7d week are summed from the ledger — the budget is measured, not vibed.
//   · Anthropic publishes no exact caps, so capacity estimates SELF-TUNE:
//     an observed limit event records the true ceiling (observed_window_
//     ceiling in brain_queue.json) and the runtime re-fits. The ledger learns
//     the plan's real shape instead of pretending to know it.
//   · STUDY HOURS (09:00–21:00): spend at most day_reserve_frac of the window
//     estimate — the captain can always open Claude and work on top.
//   · OVERNIGHT (22:00–07:30): queue-drain toward overnight_target_frac.
//     Unused capacity is wasted sharpness.
//   · M-3, finally: the formation_read job passes a real llm into the
//     runManager({llm}) socket manager.mjs shipped with. manager.mjs is NOT
//     edited — the plug meets the socket (layering, never replace).
// GUARDS (each selftested):
//   · ANTHROPIC_API_KEY set ⇒ REFUSE to run LLM calls (hard $100 ceiling:
//     subscription only, ever).
//   · banned-phrase validator (no 10x/on-steroids/god-tier — hype in output is a
//     bug), OPT-OUT per job via `hype_guard:false` for machine-side analysis where
//     the words are real vocabulary; no_new_numbers / quotes_only validators for
//     insight-class jobs. All three now delegate to scripts/validators.mjs — the ONE
//     zero-hallucination engine — and the assembled prompt is threaded through as
//     `shown`, so a digit the wrapper itself handed the model is never "invented".
//   · EVERY job declares a `surface` (where its output appears). Reported with a
//     have/need counter on `status`; never a silent block.
//   · declared inputs are audited per run: a `required:true` input that is absent
//     skips the job BEFORE the spend, and the absent count rides the ledger row.
//   · deterministic organs never blocked: the brain enriches; it is never
//     load-bearing for the sheet (fallback skeleton law lives in manager.mjs).
//
// INPUT:  brain_config.json (canon) · the bus (read-only) ·
//         dressing-room/manager/system.md (the Opus soul)
// OUTPUT: brain_ledger.jsonl · brain_queue.json · brain_out/<job>/<date>.md
//         (formation_read writes through manager.mjs's own validated writer)
// MODES:  tick (default) · run <job_id> · status · selftest
//         gate [show|wake <lane>|journal [n]] · spend [days] · tokens · consumed <target> [--kind --by --file --note]
//         bell [fulltime|…] · trigger <name> [off] · pulse (ONE haiku beat) · daemon (the resident pacemaker)
// ============================================================================

import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync, appendFileSync, openSync, readSync, closeSync, statSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
// H3 (10 Aug 2026): the model's own doors — the sanitizer is the sibling's
// only entry, the formatter/guard pair is the night coach's only read.
import { sanitizeModelMine, testedEdgeLines, FACTS } from "./nikhil_model.mjs";
// H5 (10 Aug 2026): the dreams sanitizer resolves concepts through the same
// alias machinery the scoreboard already carries (capture.mjs's pattern).
import { loadAliasMap, repLocalDay } from "./scoreboard.mjs";
import { join, dirname, basename, isAbsolute } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
import { runManager } from "./manager.mjs";
import { redealtSheetLine } from "./captains_call.mjs";   // LADDER A1 — pure helper, no state writes
// THE ONE ZERO-HALLUCINATION VALIDATOR (2 Aug 2026 audit, findings #59/#60/#61).
// `allowedNumbers`/`noNewNumbers` used to exist THREE times — here, in manager.mjs and
// in viz.mjs — and only the manager's carried the 25 Jul fix. The two copies here still
// whitelisted every integer 0–31 and blanket-stripped dates and clock times, so a
// fabricated "cards due: 12 (+9 overdue)" or "we ship by 2026-12-25" sailed through on
// all six no_new_numbers jobs — including both team-talk mp3s and the Dugout's
// day_cartridge system instruction. The frozen originals stay below (layering law) as
// `allowedNumbersLegacy` / `noNewNumbersLegacy`; every LIVE call now routes here.
import { allowedNumbers as allowedNumbersShared, noNewNumbers as noNewNumbersShared, quotesOnly } from "./validators.mjs";
// THE FAILURE CLASSIFIER, BORROWED NOT COPIED (wiring audit 10 Aug 2026). The
// dead-brain alarm below needs to tell a plan wall from a server bug, and that
// rule was already fitted to this very ledger's evidence in claudegen.mjs — one
// definition, imported. claudegen pulls in nothing but node builtins, so this
// adds no cycle and no side effect at load.
import { classifyLimit } from "./claudegen.mjs";
// THE GATE (ORGANISM_OVERHAUL 18 Aug 2026 §5, LAW L5). One pure verdict function,
// shared with nightshift.mjs and dmn.mjs, so "asleep" means one thing everywhere.
// gate.mjs writes nothing; the journal, the consumption lane and the card are OURS.
import { decide as gateDecide, gateConfig, consumptionOf, failStreakOf, everRan as gateEverRan, CONSUMPTION_KINDS } from "./gate.mjs";
import { dayKey, addDays } from "./daykey.mjs";   // Block 6 — THE DAY-KEY LAW: a chain child (the morning sheet tick) keys the CHAIN's day; overnight jobs keep their wall-clock shift (shiftDay/serveDate untouched)
import { digestInput as intentDigestInput, validateDigest as intentValidateDigest } from "./intent.mjs";   // Block 2 §7.2 (18 Aug 2026): the intent_digest job's food + its validator — brain never writes the intent lane
import { swallow } from "./swallow.mjs";   // Block 7 — SWALLOW + PANIC (§14.2): every fs-guarding silent catch is declared

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const CFG_PATH  = join(STATE_DIR, "brain_config.json");
const LEDGER    = join(STATE_DIR, "brain_ledger.jsonl");
// LADDER E4 (9 Aug 2026): every utterance ATTEMPT leaves a row — sent or not,
// and why. Before this, "the mouth said nothing today" was invisible: the sheet
// absence line covers one slot of two, and a failed bell vanished into stdout.
// Sole appender: brain.mjs (the three pushNtfy call sites below). The watchman
// reads today's rows nightly.
const MOUTH_LOG = join(STATE_DIR, "mouth_log.jsonl");
function recordMouth(kind, pushed) {
  try { appendFileSync(MOUTH_LOG, JSON.stringify({ ts: new Date().toISOString(), kind, sent: !!(pushed && pushed.sent), why: (pushed && pushed.why) || null }) + "\n"); } catch (e) { swallow("recordMouth: appendFileSync(MOUTH_LOG) unwritable → ignored", e); }
}
const QUEUE     = join(STATE_DIR, "brain_queue.json");
const PULSE_SESSION = join(STATE_DIR, "pulse_session.json");   // Phase 3 — the rolling pulse session (runtime state; brain.mjs sole writer)
const PULSE_SESSION_TMP = PULSE_SESSION + ".tmp";
// WRITTEN WITH TWO RESOLVABLE CONSTANTS, not through writeAtomic — deliberately.
// writeAtomic's first act is `mkdirSync(dirname(path))`, and `dirname(<param>)` is
// opaque to xray's points-to analysis, so every call site banks one more Unknown
// sink: three of them tripped the suite's own unresolved_sinks ratchet
// (brain.mjs 228→231) the first time this shipped. Inlined with module constants,
// xray can SEE that brain.mjs writes pulse_session.json — the ownership law made
// machine-checkable instead of merely asserted in a comment. No mkdir: STATE_DIR
// is the state bus, it exists or nothing does. The tmp name is NOT per-pid
// (writeAtomic's rule) because it cannot be and stay resolvable — safe here
// because concurrent pulses are already impossible (daemon singleton on an
// exclusive port bind, min_spacing_s 150) and the worst case of a lost update is
// one extra cold seed, never a torn file.
function writePulseSession(obj) {
  try {
    writeFileSync(PULSE_SESSION_TMP, JSON.stringify(obj, null, 2) + "\n");
    renameSync(PULSE_SESSION_TMP, PULSE_SESSION);
  } catch (e) { swallow("the session file is an optimisation; a write failure must never cost a pulse", e); }
}
const TOKEN_VITALS = join(STATE_DIR, "token_vitals.json");
const OUT_DIR   = join(STATE_DIR, "brain_out");
// THE CONSUMPTION LANE (overhaul §5.2) — SOLE WRITER: brain.mjs, through
// recordConsumption() below (in-process import) or `brain.mjs consumed …` (CLI).
// One row per time something the organism made actually reached HIM (spoken ·
// sat · briefed · carded · opened · pushed). "Some other job read it" is NOT a row.
const CONSUMPTION = join(STATE_DIR, "consumption.jsonl");
// THE GATE JOURNAL (overhaul §5.3) — SOLE WRITER: brain.mjs, through gateTransition().
// One row per TRANSITION (asleep→awake, awake→asleep), never per beat.
const GATE_JOURNAL = join(OUT_DIR, "gate.jsonl");
const SYSTEM_MD = join(__dirname, "..", "dressing-room", "manager", "system.md");

const DEFAULTS = {
  budget: { window_hours: 5, window_capacity_est_tokens: 800000, weekly_capacity_est_tokens: 12000000, day_reserve_frac: 0.25, overnight_target_frac: 0.95, self_tune: true },
  study_hours: { start: "09:00", end: "21:00" },
  overnight: { start: "22:00", end: "07:30" },
  // max_attempts_per_shift (E2E audit 25 Jul 2026): a FAILED job keeps its daily
  // slot so it can retry — but with a ~75s daemon beat and nothing counting the
  // attempts, a job that fails DETERMINISTICALLY (validator always rejects, CLI
  // logged out) re-ran ~1150×/day at full model cost. Retry is right; retrying
  // forever is not. N attempts per shift, then the job sits out until next shift.
  // "exponential" was DROPPED from the banned list on 2 Aug 2026 (audit finding #62).
  // bannedPhraseCheck is a naive lowercase substring test, so it also catches
  // "exponentially" and "exponent" — and this organism's entire syllabus is transformers,
  // where softmax IS an exponential and quadratic-vs-exponential is a real claim about
  // complexity. Measured: 12 rejections / 185,983 tokens destroyed after the spend, on
  // machine-side mining jobs. The guard exists to keep HYPE out of the captain's ear;
  // it is kept for "10x", "on steroids", "god-tier", "time is short", which have no
  // legitimate technical reading. Per-job opt-out: `"hype_guard": false` (see hypeGuardOn).
  guards: { refuse_if_api_key_env: true, banned_phrases: ["10x", "on steroids", "god-tier", "time is short"], max_attempts_per_shift: 3 },
  ntfy: { enabled: false, topic: "", push_after: ["formation_read"] },
  gemini: { enabled: false, binary: "gemini" },
  dugout_pool: { enabled: true, gemini_defer_threshold_min: 30 },
  jobs: [],
};

const localDate = (now) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
const hhmm = (now) => `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

function loadConfig(path = CFG_PATH) {
  try {
    if (existsSync(path)) {
      const j = JSON.parse(readFileSync(path, "utf8"));
      return {
        budget: { ...DEFAULTS.budget, ...(j.budget || {}) },
        study_hours: { ...DEFAULTS.study_hours, ...(j.study_hours || {}) },
        overnight: { ...DEFAULTS.overnight, ...(j.overnight || {}) },
        guards: { ...DEFAULTS.guards, ...(j.guards || {}) },
        ntfy: { ...DEFAULTS.ntfy, ...(j.ntfy || {}) },
        gemini: { ...DEFAULTS.gemini, ...(j.gemini || {}) },
        dugout_pool: { ...DEFAULTS.dugout_pool, ...(j.dugout_pool || {}) },
        // CANON THAT COULD NOT BE EDITED (1 Aug 2026 audit). This return is a hardcoded
        // key literal, so a `pulse` or `daemon` block written into brain_config.json was
        // read, parsed, and silently dropped on the floor — pulseConfig() always saw
        // undefined and always returned its own defaults, and `"enabled": false` for the
        // pulse was literally unreachable. The file's own header claims "brain.mjs is the
        // sole reader; edits here are canon edits"; for two whole sections that was false.
        pulse: { ...(j.pulse || {}) },
        daemon: { ...(j.daemon || {}) },
        // THE MASTER PAUSE (2 Aug 2026). One switch for all 23 LLM jobs, because
        // flipping 23 `enabled` flags by hand is 23 chances to leave one on and no
        // way to tell later which were paused deliberately and which were forgotten.
        // Strictly `=== true` so a typo, a string, or a missing key can never pause
        // the organism by accident — the safe direction is RUNNING.
        paused: j.paused === true,
        jobs: Array.isArray(j.jobs) ? j.jobs : [],
      };
    }
  } catch (e) {
    // E2E audit 25 Jul 2026: a malformed canon config used to degrade SILENTLY to
    // DEFAULTS — whose jobs list is EMPTY. "config broken" and "nothing eligible"
    // then look identical: the daemon beats forever logging `0/0 ran`, status says
    // "eligible now: none", and every overnight organ stops without a word. One
    // trailing comma could brain-death the organism for days. It now SAYS SO, and
    // marks the returned config so callers can tell the two states apart.
    console.error(`brain: ⚠ CONFIG UNREADABLE — ${path}: ${String(e && e.message).slice(0, 140)}`);
    console.error("brain: ⚠ falling back to DEFAULTS, which have ZERO jobs — the brain will tick and do NOTHING until this file parses. Fix the JSON.");
    const d = JSON.parse(JSON.stringify(DEFAULTS));
    d._config_error = String(e && e.message).slice(0, 200);
    return d;
  }
  return JSON.parse(JSON.stringify(DEFAULTS));
}

function writeAtomic(path, obj) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = path + "." + process.pid + ".tmp";   // per-pid: two live writers must never share one temp name (same scar capture.mjs:319 fixed)
  writeFileSync(tmp, typeof obj === "string" ? obj : JSON.stringify(obj, null, 2) + "\n");
  renameSync(tmp, path);
}
const readJson = (p) => { try { if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")); } catch (e) { swallow("readJson: readFileSync(p) unreadable → null", e);} return null; };
const readLines = (p) => {
  const out = [];
  try { if (existsSync(p)) for (const l of readFileSync(p, "utf8").split("\n")) { if (!l.trim()) continue; try { out.push(JSON.parse(l)); } catch {} } } catch (e) { swallow("readLines: readFileSync(p) unreadable → out", e);}
  return out;
};

// ---------------------------------------------------------------------------
// TAIL READS FOR UNBOUNDED LOGS (2 Aug 2026 audit, finding #51)
// ---------------------------------------------------------------------------
// presence_log.jsonl is append-only with no rotation — 266 KB / 1,507 rows after 16
// days, ~6.7 MB/yr measured. brain has TWO whole-file readers that then throw ~99% of
// it away: liveSignal() wants the last 6 rows, and gatherInputs wants the last 200 for
// three LLM jobs. The presence organ is adding a MONTHLY ROLL, so the live file can
// also become short or vanish mid-month; a reader that only ever opens
// `<name>.jsonl` would then silently report an empty history as a measured zero.
//
// So this does two things at once: it reads only the bytes it needs, and it falls
// back to the newest ARCHIVE siblings (`<name>.<YYYY-MM>.jsonl`) when the live file
// cannot supply n rows. Archive-tolerant by construction — it works whether or not
// the roll has landed yet.
//
// NO GUESSED BYTE BUDGET: the read GROWS from the end of the file, doubling until it
// has n+1 newlines or reaches byte 0. The starting chunk is derived, not chosen —
// 64 KiB is one filesystem read-ahead unit and already holds ~370 presence rows at
// the file's own measured mean row size (266,799 B / 1,507 rows = 177 B/row), i.e.
// the first read satisfies every caller in this file (n = 6 and n = 200) without a
// second syscall. If a row ever gets longer, the loop simply reads again.
const TAIL_CHUNK = 65536;
function tailText(p, n) {
  let fd = null;
  try {
    const size = statSync(p).size;
    if (size === 0) return "";
    fd = openSync(p, "r");
    let want = Math.min(size, TAIL_CHUNK);
    for (;;) {
      const buf = Buffer.alloc(want);
      readSync(fd, buf, 0, want, size - want);
      const text = buf.toString("utf8");
      // enough newlines to be sure the first (possibly truncated) row can be dropped,
      // or we already hold the whole file — either way we are done.
      if (want >= size) return text;
      if ((text.match(/\n/g) || []).length > n) return text.slice(text.indexOf("\n") + 1);
      want = Math.min(size, want * 2);
    }
  } catch (e) { swallow("tailText: statSync(p) absent → null", e); return null; } finally { if (fd !== null) { try { closeSync(fd); } catch (e) { swallow("tailText: closeSync(fd) already closed → ignored", e);} } }
}
function parseLines(text) {
  const out = [];
  for (const l of String(text || "").split("\n")) { if (!l.trim()) continue; try { out.push(JSON.parse(l)); } catch {} }
  return out;
}
// archives of `<dir>/<base>.jsonl`, newest first: `<base>.2026-07.jsonl`, `<base>.2026-06.jsonl`…
// Sorted DESCENDING by name, which for zero-padded YYYY-MM is chronological.
function archiveSiblings(p) {
  try {
    const dir = dirname(p), base = basename(p, ".jsonl");
    const re = new RegExp(`^${base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\.[0-9][0-9A-Za-z_-]*\\.jsonl$`);
    return readdirSync(dir).filter(f => re.test(f)).sort().reverse().map(f => join(dir, f));
  } catch (e) { swallow("archiveSiblings: readdirSync(dir) unreadable → []", e); return []; }
}
// The public seam: the last n parsed rows of a (possibly rolled) jsonl log, oldest→newest.
// Returns [] when nothing is readable — and the CALLER is responsible for not rendering
// that as a measured zero (see the absent-input accounting in gatherInputsAudited).
function readLinesTail(p, n) {
  let rows = existsSync(p) ? parseLines(tailText(p, n)) : [];
  if (rows.length >= n) return rows.slice(-n);
  // short (or missing) live file ⇒ a roll just happened, or is about to. Walk back
  // through the archives newest-first until we have n rows or run out of history.
  for (const a of archiveSiblings(p)) {
    if (rows.length >= n) break;
    const older = parseLines(tailText(a, n - rows.length));
    rows = older.slice(-(n - rows.length)).concat(rows);
  }
  return rows.slice(-n);
}

// ---------------------------------------------------------------------------
// THE DOOR'S OWN CUT, COUNTED (11 Aug 2026 wiring pass — TRUNCATED_AT_DOOR, pass 3)
// ---------------------------------------------------------------------------
// Passes 1 and 2 (10 Aug) fixed WHICH rows the clipper keeps and made its drop
// countable off the built prompt (`rows_dropped=<n>`). Both were about the second
// cut. The FIRST cut — readLinesTail(p, 200) in gatherInputsAudited — was never
// counted anywhere, so the accounting under-reported by exactly the rows the door
// ate before the clipper ever saw them, and the under-count GROWS with the log.
// MEASURED the hour this was written: teaching_audit.jsonl held 225 rows; the door
// handed over 200; the clipper elided 184 of those; `brain run night_coach --dry`
// printed "184 log rows never reached the model" when the true figure was 209 of 225.
// night_coach declares that file REQUIRED — the drift evidence it teaches from.
//
// So the door needs a denominator, and a denominator costs a count of the live file.
// This is a BYTE scan, never a parse: it walks the file in TAIL_CHUNK reads (the same
// unit the tail read already uses — no new number) counting non-blank lines, so a
// 6.7 MB/yr log costs one streaming pass with bounded memory instead of 1,500
// JSON.parse calls. That is what finding #51 was protecting against; a newline count
// is not that read.
//
// EXACTNESS, both edges: a line counts only if it holds a byte that is not space/tab/
// CR/LF — the same test `parseLines` applies with `!l.trim()` — and UTF-8 continuation
// bytes all have the high bit set, so a multibyte character can never be mistaken for
// whitespace. A final row with no trailing newline is counted. An unparseable row is
// counted as a row: parseLines drops it, so the model did not see it either, and
// "never reached the model" stays true.
// Returns null (never 0) when the file cannot be read — the caller must not render an
// unreadable file as a measured zero, the same law readLinesTail's own header states.
function liveRowCount(p) {
  let fd = null;
  try {
    const size = statSync(p).size;
    if (size === 0) return 0;
    fd = openSync(p, "r");
    const buf = Buffer.alloc(TAIL_CHUNK);
    let rows = 0, at = 0, content = false;
    while (at < size) {
      const n = readSync(fd, buf, 0, Math.min(TAIL_CHUNK, size - at), at);
      if (n <= 0) break;
      for (let i = 0; i < n; i++) {
        const b = buf[i];
        if (b === 10) { if (content) rows++; content = false; }
        else if (b !== 32 && b !== 9 && b !== 13) content = true;
      }
      at += n;
    }
    if (content) rows++;   // last row, no trailing newline
    return rows;
  } catch (e) { swallow("liveRowCount: statSync(p) absent → null", e); return null; } finally { if (fd !== null) { try { closeSync(fd); } catch (e) { swallow("liveRowCount: closeSync(fd) already closed → ignored", e);} } }
}

// The door's tail width. NOT a new number — this is the literal 200 that has sat
// inline in gatherInputsAudited since finding #51, lifted to a name so the count, the
// prompt marker and the ledger field can never quote three different widths.
const DOOR_TAIL_ROWS = 200;

// ---------------------------------------------------------------------------
// BUDGET GOVERNOR (pure)
// ---------------------------------------------------------------------------
// ===========================================================================
// SPEND — THE ONE DEFINITION (C1, 12 Aug 2026). Read the whole comment before
// touching a number in it; three separate faults were measured here, and fixing
// any one alone makes another worse.
// ===========================================================================
// The meter used to be `total_tokens`, as written by whichever organ made the
// call. Measured off 5,153 ledger rows on 12 Aug 2026, that field is wrong in
// BOTH directions and mis-weighted even when right:
//
//   1. UNDER-COUNT (historical, lane repaired 2026-08-09T18:14). dmn_rollout wrote
//      856 rows and dmn_counter 143 rows whose `total_tokens` was the in+out pair
//      ONLY. Real four-component sum: 5,86,44,720 recorded as 10,19,066 — a factor
//      of 57. Verify: rows where total_tokens !== input+output+cache_creation+cache_read.
//   2. OVER-COUNT (historical, last row 2026-08-04). haiku_pulse wrote 101 rows
//      carrying a prompt-LENGTH GUESS as spend: 32,90,374 written against 72,674 real.
//   3. MIS-WEIGHT (LIVE, every correctly-recorded row). cache_read is 67.5% of all
//      counted traffic since 11 Aug (71,12,389 of 1,05,38,368) and was counted at
//      FULL price against the ceiling, though it is the cheapest traffic the plan
//      sells. This is what starved the live organs: `cortex consolidate` failing
//      daily with "no-headroom (0/50000 needed)", the diary refusing 127 beats.
//
// Fault 3 also made the control loop incoherent with its own optimisation rules:
// C3 principle 1 says put the stable preamble FIRST so it caches — which converts
// spend into cache_read — and under the old meter, obeying that principle made the
// governor angrier. A meter that punishes the cheap path is not a meter.
//
// THE WEIGHTS are Anthropic's published PRICE RATIOS per base input unit:
//   input 1 · cache_write 1.25 · cache_read 0.1 · output 5.
// They are ratios of what the traffic COSTS, not a claim about how Anthropic meters
// a subscription internally — that is unpublished. This is deliberately the honest
// half of the guess: the shape is sourced, the ceiling below is MEASURED against it.
const SPEND_WEIGHTS = { input_tokens: 1, cache_creation_tokens: 1.25, cache_read_tokens: 0.1, output_tokens: 5 };

// spendOf — cost-equivalent tokens for ONE ledger row, derived at READ time.
// Deriving from the components rather than trusting the written total is what
// repairs faults 1 and 2 without rewriting a single byte of an append-only ledger.
// A row with NO components (tokens_estimated: true — the sync fallback's length
// guess, 8 rows / 13,825 tokens on the whole board) keeps its written total at
// weight 1; too small to model, and guessing at its shape would be a fourth fault.
function spendOf(row) {
  if (!row || typeof row !== "object") return 0;
  const N = (v) => (typeof v === "number" && isFinite(v) ? v : 0);
  const four = N(row.input_tokens) + N(row.output_tokens) + N(row.cache_creation_tokens) + N(row.cache_read_tokens);
  if (four <= 0) return N(row.total_tokens);
  let s = 0;
  for (const k in SPEND_WEIGHTS) s += N(row[k]) * SPEND_WEIGHTS[k];
  return s;
}

// ── C1b · THE MODEL FACTOR (14 Aug 2026, unleash Phase 0) ────────────────────
// spendOf above is MODEL-BLIND: a haiku token and an opus token weigh the same.
// Measured on 7 days of ledger (582 rows), that blindness inverts the board —
// haiku_pulse reads 40% of all spend blind and ~18% model-aware, while the
// sonnet night lanes it hides (dmn_counter 3.86M, dmn_rollout 2.67M aware) are
// the real top of the table. Every receipt in the unleash plan is read off this
// board, so a board that ranks the wrong organ first sends the work to the
// wrong lane.
//
// THE FACTORS are the same kind of number as SPEND_WEIGHTS — published list
// INPUT prices per MTok, as ratios: haiku $1 · sonnet $3 · opus $5. Unknown
// model ⇒ 3 (sonnet, the organism's default engine), stated not guessed.
const MODEL_MULT = { haiku: 1, sonnet: 3, opus: 5 };
export function spendOfModelAware(row) {
  const base = spendOf(row);
  const m = String((row && row.model) || "").toLowerCase();
  const key = m.includes("haiku") ? "haiku" : m.includes("opus") ? "opus" : m.includes("sonnet") ? "sonnet" : null;
  return base * (key ? MODEL_MULT[key] : 3);
}
//
// ⚠ WHY THE GOVERNOR IS NOT SWITCHED TO IT — the one line to read before
// "finishing the job" by wiring this into windowUsage(). budget.window_capacity
// _est_tokens (27,50,000) and weekly_capacity (4,12,50,000) are stated IN THE
// MODEL-BLIND UNIT — brain_config's own `_unit_change_2026_08_12` note says so
// in its first sentence. On live data the two meters differ by 2.28× (7d:
// 1,07,48,830 blind vs 2,45,07,142 aware), so switching the meter under
// unchanged caps would take the governor from 26% to 59% utilisation overnight
// WITHOUT ONE EXTRA TOKEN BEING SPENT, and the headroom floor would start
// refusing organs — the exact starvation fault 3 above was written to end, and
// a GUARD the unleash plan's §NEVER-TOUCH forbids moving. The board is a
// REPORT and may change unit freely; the governor's unit may only change
// together with a re-derived ceiling, which is a separate, measured job.
// So: spendOf = the governor's unit (unchanged, still the engine of record).
//     spendOfModelAware = the reporting unit (board + treasury).
// ─────────────────────────────────────────────────────────────────────────────

// FROZEN — the engine of record until 12 Aug 2026, kept verbatim per the layering
// law. It sums `total_tokens` raw. Nothing calls it; it is here so the migration
// note has something to point at and so a future session can diff the two meters.
function windowUsageLegacy(ledger, now, hours) {
  const end = now.getTime();
  const cutoff = end - hours * 3600000;
  return ledger.filter(l => { const t = new Date(l.ts).getTime(); return l.engine === "claude" && t >= cutoff && t <= end; })
    .reduce((a, l) => a + (l.total_tokens || 0), 0);
}

function windowUsage(ledger, now, hours) {
  const end = now.getTime();
  const cutoff = end - hours * 3600000;
  // E2E audit 25 Jul 2026: the window had NO upper bound, so any row stamped in
  // the future counted as spent-right-now — a clock skew or a replayed ledger
  // could pin the governor at 100% forever. A window has two edges.
  // rounded ONCE at the end, never per row: the weights are fractional (cache_read
  // ×0.1), and rounding each row would drift on a window carrying hundreds of them.
  return Math.round(ledger.filter(l => { const t = new Date(l.ts).getTime(); return l.engine === "claude" && t >= cutoff && t <= end; })
    .reduce((a, l) => a + spendOf(l), 0));
}
const weekUsage = (ledger, now) => windowUsage(ledger, now, 24 * 7);

function inRange(nowHM, start, end) {
  return start <= end ? (nowHM >= start && nowHM < end) : (nowHM >= start || nowHM < end);
}

// how many tokens may we spend RIGHT NOW?  (signals: optional live-activity hint)
function headroom(cfg, ledger, queueState, now, signals = null) {
  // the observed ceiling is a LEARNED truth, but the real Max-5x window is
  // always >= our deliberately-conservative estimate; never let a stale/low
  // observed value collapse the budget to zero and starve the hot brain
  // (E2E finding 13 Jul: a limit event recorded ceiling=1 and switched the
  // overnight engine off). Floor at the estimate.
  const est = cfg.budget.window_capacity_est_tokens;
  const cap0 = Math.max(est, (queueState && queueState.observed_window_ceiling) || est);
  const used = windowUsage(ledger, now, cfg.budget.window_hours);
  const weekly = weekUsage(ledger, now);
  const weeklyCap = cfg.budget.weekly_capacity_est_tokens;
  const nowHM = hhmm(now);
  const study = inRange(nowHM, cfg.study_hours.start, cfg.study_hours.end);
  const overnight = inRange(nowHM, cfg.overnight.start, cfg.overnight.end);
  let cap;
  if (study) cap = cap0 * (signals ? reserveNow(cfg, signals) : cfg.budget.day_reserve_frac);   // protect his study — dynamically when we know he's live
  else if (overnight) {                                                                          // exhaust deliberately, but taper the morning tail
    const tail = nowHM >= "05:30" && nowHM < cfg.overnight.end;   // 05:30–07:30: back off so any CLI lockout clears before study
    cap = cap0 * (tail ? cfg.budget.day_reserve_frac : cfg.budget.overnight_target_frac);
  } else cap = cap0 * 0.6;                                                                        // shoulder hours
  return { allowed: Math.max(0, Math.min(cap - used, weeklyCap - weekly)), used, cap: Math.round(cap), phase: overnight ? "overnight" : study ? "study" : "shoulder" };
}

// LIVE RESERVE (Phase 0) — while he is actually at the keyboard, keep daytime
// spend protective so his heaviest interactive burst always has headroom; the
// instant he goes idle the spend rises toward the overnight target and the pacer
// floods. signals.idle_min = minutes since his last interactive trace; absent →
// assume live (safe). Returns the effective daytime SPEND fraction.
function reserveNow(cfg, signals = {}) {
  const idleMin = typeof signals.idle_min === "number" ? signals.idle_min : 0;
  const dayFrac = cfg.budget.day_reserve_frac, nightFrac = cfg.budget.overnight_target_frac;
  if (idleMin >= 20) return nightFrac;
  if (idleMin >= 8) return Math.min(nightFrac, dayFrac + (nightFrac - dayFrac) * 0.5);
  return dayFrac;
}

// SELF-TUNE the window ceiling as an EWMA, not a one-way ratchet: a limit event
// reveals the window's true size, but one anomalous night must not inflate it
// forever. Blend observed usage toward the running ceiling, floored at the
// estimate — the ledger self-corrects downward too, tracking the plan's real shape.
function blendCeiling(prev, observed, estimate, alpha = 0.4) {
  const base = (prev && prev > 0) ? prev : estimate;
  return Math.max(estimate, Math.round(alpha * observed + (1 - alpha) * base));
}

// THINKING DEPTH scales with the moment: lean (16k) while he is live so turns
// stay fast; deep (48k) overnight when the whole plan is the budget — never more
// than the window can pay for. Also yields the headroom floor a deep read needs,
// so the deepest thinking can't overshoot the one meter. (cortex wires this in P3.)
function maxThinkingFor(phase, allowed) {
  let think = phase === "study" ? 16000 : 48000;
  think = Math.min(think, Math.max(8000, Math.floor((allowed || 0) * 0.5)));
  return { max_thinking_tokens: think, min_headroom_tokens: Math.round(think * 1.6) };
}

// PACING (P3) — the resident daemon's burn-rate signal: spread the remaining window
// headroom across the time left before the window edge, in tokens/min. Heuristic (the
// 5h window is rolling, not clean-edged) — it LOGS the pace and lets the loop reason
// about being ahead/behind; the HARD per-job gating always stays in headroom(). The
// daemon never writes wake_queue — the thalamus is the sole wake authority.
function targetBurn(cfg, hr, now = new Date()) {
  const windowMin = (((cfg && cfg.budget && cfg.budget.window_hours) || 5)) * 60;
  const dayMin = now.getHours() * 60 + now.getMinutes();
  const minsToEdge = Math.max(5, windowMin - (dayMin % windowMin));
  const remaining = Math.max(0, (hr && hr.allowed) || 0);
  return { pace_tok_per_min: Math.round(remaining / minsToEdge), remaining, mins_to_edge: minsToEdge, phase: hr && hr.phase };
}

// ===========================================================================
// THE HAIKU PULSE (P4) — the always-on continuous layer, on HAIKU (~1% of Opus).
// The architecture's MOST FRAGILE piece: "cheap enough to be continuous" is
// asserted, never derived — so the meter IS the design. Three hard rails:
//   1. ENGAGED-ONLY   — idle → the pulse sleeps, zero spend (never pulse the void).
//   2. HARD DAILY CAP — counted from the ledger; over cap → skip (can't cannibalise
//                       the overnight Opus budget).
//   3. METERED EVERY PULSE — even a HOLD costs tokens and is logged, so the real
//                       per-call cost is MEASURABLE from day one (measure, then tune).
// It watches the afferent tail ABOVE the thalamus's deterministic salience and, if a
// genuine reasoning-hard moment hides there, ESCALATES by POSTing an afferent — it
// NEVER writes wake_queue (the thalamus stays the sole wake authority — Layer 4 law).
// ===========================================================================
function pulseConfig(cfg) {
  const p = (cfg && cfg.pulse) || {};
  // THE CAP WAS DENOMINATED IN THE WRONG UNIT (1 Aug 2026 audit — measured).
  // "Cheap enough to be continuous" was asserted from the MODEL (haiku ~1% of opus) and
  // never re-derived from the CALL. Every `claude -p` re-pays a full CLI boot: measured
  // 32,480 tok/pulse of which ~31,970 is system-prompt + tool-definition cache — the
  // pulse's own payload is ~510. So the "cheap" layer costs 1.61x an Opus job (opus avg
  // 20,192, n=24), and 200 calls/day authorised ~6.5M tok/DAY against a 12M/WEEK plan.
  // On 1 Aug it took 86.6% of the day's entire spend. Rail 3 (headroom) fired correctly
  // and rail 2 could not, because it was counting the wrong thing. Now it counts tokens.
  const weekly = (cfg && cfg.budget && cfg.budget.weekly_capacity_est_tokens) || DEFAULTS.budget.weekly_capacity_est_tokens;
  // ---- THE MEASUREMENT WINDOW, not a guessed cap (2 Aug 2026 audit, #66/#67) ------
  // The captain's standing order forbids setting a numerical limit by guessing: open
  // it, MEASURE, then set it from data. rail 2b was 0.05 of the weekly plan — a number
  // nobody derived. What IS measured: 32,480 tok/pulse (853 ledger rows, of which
  // ~31,970 is the `claude -p` boot tax and ~510 is the pulse's own payload).
  //
  // So the window is now sized to buy MEASUREMENT, and the arithmetic is written down.
  // RE-DERIVED, LADDER G3 (9 Aug 2026) — THE SPLIT RULING, his verbatim 20x words:
  // "i am on claude 20x plan now, nidhi... 5x, i need 5x to study then... rest 10x just
  // for the organism." 20x = 4 × (800k/12M) = 3.2M window / 48M week TOTAL; the split:
  // Nidhi 800k/12M + his study 800k/12M + THE ORGANISM 1.6M/24M — zero remainder, and
  // budget.window/weekly (P1) already equal the organism's share exactly.
  //     organism weekly        24,000,000 tok   (his ruled share)
  //     × PULSE_MEASURE_FRAC        0.10
  //     = daily window          2,400,000 tok
  //     ÷ post-lean cost/pulse     ~1,100 tok   (G0 est — re-measure on the first
  //                                              10 metered probes before trusting)
  //     ≈ ~2,180 pulses/day the TOKEN window would allow
  // WHICH INVERTS THE OLD TEXT: the 200-call backstop now binds FIRST (crossover at
  // 12,000 tok/pulse — above that the token window binds, below it the calls do).
  // The 12M-era line here said the cap "can never bind"; post-lean it is the binding
  // rail, and that is fine — it is a runaway backstop doing backstop work. Re-fit both
  // from the ledger after G14's measured probes; `brain status` prints tok/pulse live.
  const PULSE_MEASURE_FRAC = 0.10;
  return {
    enabled: p.enabled !== false,
    model: p.model || "haiku",
    // rail 2a — CALLS. Not a budget: a runaway-loop backstop (an explicitly permitted
    // exception to the no-guessed-limits order). G3 INVERSION (9 Aug 2026): post-lean
    // (~1.1k/pulse est) this binds FIRST — 2.4M/1.1k ≈ 2,180 » 200 — so the backstop
    // is now the working rail until G14's metered probes re-fit it. The old "can never
    // bind" was 12M-era arithmetic at 32,480 tok/pulse.
    daily_cap: p.daily_cap || 200,
    daily_token_frac: p.daily_token_frac || PULSE_MEASURE_FRAC,
    daily_token_budget: p.daily_token_budget || Math.round(weekly * (p.daily_token_frac || PULSE_MEASURE_FRAC)),
    // rail 2d — FREQUENCY. Halved (#67): the pulse rides every Nth daemon beat, not
    // every beat. Same reasoning as the window — fewer, better-spaced observations of
    // the same stream cost half as much and lose almost nothing, because the afferent
    // tail moves far slower than a 75-second beat.
    every_n_beats: Math.max(1, Number(p.every_n_beats) || 2),
    // LADDER G5 (9 Aug 2026) — SPACING PINNED IN SECONDS. every_n_beats was born
    // on a ~75s beat (2 beats ≈ 150s). The pacer now beats at daemon.poll_ms
    // 15000, and a beat-counted gate would have silently QUINTUPLED the pulse
    // the day G14 unpauses it. Default DERIVES from the old world: beats × 75s.
    min_spacing_s: Math.max(1, Number(p.min_spacing_s) || Math.max(1, Number(p.every_n_beats) || 2) * 75),
    // rail 2c — a deterministically failing pulse burned all 200 slots on 21 Jul (164
    // failures, CLI logged out) and killed the organ for the rest of that day. The job
    // runner has had attemptsOn() since the 25 Jul audit; runPulse is called separately
    // at the daemon level and was never covered by it.
    max_consecutive_failures: p.max_consecutive_failures || 3,
    engaged_idle_max_min: p.engaged_idle_max_min || 10,
    min_headroom_tokens: p.min_headroom_tokens || 20000,
    tail_n: p.tail_n || 12,
    timeout_ms: p.timeout_ms || 60000,
  };
}
// today's pulse rows, parsed-local-date keyed exactly like pulsesToday (see the note there)
function pulseRowsToday(ledger, now) {
  const today = dayKey(now);
  return (ledger || []).filter(r => r && r.job === "haiku_pulse" && r.ts && localDate(new Date(r.ts)) === today);
}
function pulseTokensToday(ledger, now) {
  return pulseRowsToday(ledger, now).reduce((a, r) => a + (r.total_tokens || 0), 0);
}
// consecutive failures at the TAIL of today's pulses (a success anywhere resets it)
function pulseFailStreak(ledger, now) {
  const rows = pulseRowsToday(ledger, now);
  let n = 0;
  for (let i = rows.length - 1; i >= 0; i--) { if (rows[i].ok) break; n++; }
  return n;
}
// THE MEASUREMENT ITSELF (#66/#67). The whole point of the window above is to LEARN
// what a pulse really costs, so the number has to be readable. Returns a have/need
// shape, never a bare verdict: {n, tokens, mean, budget, pct}. n === 0 is reported as
// "not measured yet", never as a mean of 0.
function pulseCostToday(ledger, now, budget = null) {
  const rows = pulseRowsToday(ledger, now);
  const tokens = rows.reduce((a, r) => a + (r.total_tokens || 0), 0);
  return {
    n: rows.length,
    tokens,
    mean: rows.length ? Math.round(tokens / rows.length) : null,   // null = unmeasured, NOT 0
    budget,
    pct: budget ? Math.round((tokens / budget) * 1000) / 10 : null,
  };
}
function pulsesToday(ledger, now) {
  const today = dayKey(now);
  // count on matching LOCAL dates. r.ts is a UTC ISO stamp — slicing its STRING would
  // mis-bucket every pulse fired before the local UTC offset each night (IST 00:00-05:30
  // maps to the previous UTC day), silently disengaging the hard cap during exactly the
  // overnight window it protects. Parse to a Date, then compare LOCAL dates.
  return (ledger || []).filter(r => r && r.job === "haiku_pulse" && r.ts && localDate(new Date(r.ts)) === today).length;
}
// ---------------------------------------------------------------------------
// THE PULSE'S CONCEPT TOKENS (2 Aug 2026 audit, finding #3)
// ---------------------------------------------------------------------------
// `concept_tokens` used to be "the first 4 words longer than 3 characters", with no
// stopword filter of any kind. Measured on the live ledger that produced:
//     event_key `pulse:need`, `pulse:isko`, concept_tokens ["what","left","part"]
// nov is the ONLY component that ever carries a pulse's salience score (pe falls to a
// base rate, self/err/gov/dead are structurally 0), and nov reads exactly this field.
// So the one signal doing the work was noise, and habituation then keyed on `pulse:isko`.
//
// Two changes: drop stopwords (English + HIS Hinglish — the list below is built from
// the actual failures and from the particles he types), and PREFER registered concept
// names, which is what the nucleus can actually match on.
const PULSE_STOPWORDS = new Set([
  // English fillers that survived the >3-char test and were observed in live tokens
  "what", "that", "this", "then", "than", "with", "from", "have", "has", "been", "being",
  "will", "would", "could", "should", "shall", "must", "about", "there", "their", "here",
  "when", "where", "which", "while", "your", "yours", "just", "like", "into", "onto",
  "over", "some", "more", "most", "much", "many", "need", "needs", "want", "wants",
  "left", "part", "parts", "thing", "things", "does", "done", "make", "made", "take",
  "taken", "give", "given", "said", "says", "tell", "told", "know", "knows", "known",
  "going", "doing", "really", "still", "even", "also", "only", "very", "back", "down",
  "because", "something", "anything", "everything", "nothing", "someone", "actually",
  "maybe", "might", "thats", "dont", "cant", "wont", "isnt", "arent", "were", "they",
  "them", "these", "those", "such", "same", "other", "another", "already", "again",
  "each", "both", "than", "then", "sure", "okay", "well", "good", "nice", "great",
  // his Hinglish particles — the exact class that produced `pulse:isko`
  "isko", "iska", "uska", "usko", "unka", "inka", "mera", "tera", "hume", "mujhe",
  "tumhe", "aapko", "apna", "apne", "apni", "wala", "wale", "wali", "koi", "kuch",
  "kaise", "kaisa", "kaisi", "kyun", "kyu", "kyon", "kaun", "kahan", "kabhi",
  "matlab", "yaar", "bhai", "phir", "abhi", "sirf", "lekin", "magar", "toh", "bhi",
  "aur", "mein", "hain", "hai", "nahi", "nhi", "raha", "rahi", "rahe", "karo", "kare",
  "karna", "karta", "karti", "hota", "hoti", "hote", "hoga", "hogi", "hona", "chahiye",
  "batao", "bolo", "dekho", "socho", "thoda", "bahut", "zyada", "jaise", "waise",
  "yahan", "wahan", "acha", "accha", "theek", "thik", "haan", "nahin", "bilkul",
]);
// the registered vocabulary — concepts.json keys + aliases, word-split. This is the
// SAME registry the rest of the organism canonicalises against, so a pulse token that
// survives here is one the nucleus can genuinely join on.
function conceptVocabulary(dir = STATE_DIR) {
  const set = new Set();
  const reg = readJson(join(dir, "concepts.json"));
  const eat = (s) => { for (const w of String(s || "").toLowerCase().split(/[^a-z0-9]+/)) if (w.length > 3) set.add(w); };
  const cs = (reg && reg.concepts) || {};
  for (const [name, meta] of Object.entries(cs)) { eat(name); for (const a of (meta && meta.aliases) || []) eat(a); }
  for (const [name] of Object.entries((reg && reg.skills) || {})) eat(name);
  return set;
}
// PURE, so the selftest can drive it without touching disk.
function pulseTokens(text, vocab = new Set(), max = 4) {
  const words = String(text || "").toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 3);
  const kept = words.filter(w => !PULSE_STOPWORDS.has(w));
  // registered concept names first — they are what the nucleus's novelty join can match
  const known = kept.filter(w => vocab.has(w));
  const rest = kept.filter(w => !vocab.has(w));
  const out = [];
  for (const w of [...known, ...rest]) if (!out.includes(w) && out.length < max) out.push(w);
  // HONEST DEGRADATION: if the moment was ALL stopwords there is no concept in it. Fall
  // back to the old unfiltered behaviour rather than collapsing every such escalation
  // into one `pulse:moment` habituation bucket — but the tokens are then genuinely
  // filler, which is exactly what the ledger will now show.
  if (!out.length) for (const w of words) if (!out.includes(w) && out.length < max) out.push(w);
  return out;
}

async function defaultAfferentPost(evt) {
  const url = (process.env.ARSENAL_THALAMUS || "http://127.0.0.1:4113") + "/afferent";
  try {
    const ctrl = new AbortController(); const to = setTimeout(() => ctrl.abort(), 400);
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(evt), signal: ctrl.signal });
    clearTimeout(to); return !!(r && r.ok);
  } catch { return false; }
}
// ── THE ROLLING PULSE SESSION (14 Aug 2026, unleash Phase 3) ────────────────
// dressing-room/state/pulse_session.json — brain.mjs is its SOLE WRITER, and it
// is RUNTIME STATE, not config: delete it and the next pulse simply seeds a new
// session. Shape: { id, started_at, turns, date, last_afferent_ts }.
//
// WHY. The pulse fires every ~150s while he is at the keyboard and is the No. 1
// lane on the board by cache writes (19.5 lakh in 7 days). Every one of those
// calls re-sent the whole preamble and the whole 25-row afferent tail as fresh
// context. MEASURED on this machine 14 Aug, the exact lane shape (haiku,
// --tools "", --strict-mcp-config, JSON reply, body on stdin):
//     seed    cw 7,490  cr 0
//     resume  cw   521  cr 7,490     ← the whole prior context read at 0.1×
// ≈10,900 weighted per pulse becomes ≈1,400. And the resumed pulse ANSWERED
// ABOUT THE NEW MOMENT ONLY ("escalate: true, which: moment 26") — so this is
// not just cheaper, it is the same amnesia fix as the Gaffer's 6k tail: the
// watch now remembers the day it is watching instead of meeting it new every
// 150 seconds.
//
// THE TWO NUMBERS ARE GUARDS, NOT BUDGETS: 80 turns and same-day rotation are
// CONTEXT-BLOAT stops (haiku holds 200k; ~80 turns × ~2k stays well inside).
// The real spend rails — daily_cap, daily_token_budget, failure backoff and the
// headroom floor — are all upstream of here and are untouched.
const PULSE_MAX_TURNS = 80;
export function pulseSessionUsable(s, now, maxTurns = PULSE_MAX_TURNS) {
  if (process.env.PULSE_RESUME_DISABLED) return false;      // one-line rollback
  return !!(s && s.id && s.date === dayKey(now) && (s.turns || 0) < maxTurns);
}
// The DELTA: afferent rows newer than the ones the session has already been
// shown. Same filters as the cold tail (never its own output — the 1 Aug
// tail-eating scar), same cap, newest last.
export function pulseDelta(rows, sinceTs, capN) {
  const since = Date.parse(sinceTs || 0);
  return (rows || [])
    .filter(a => a && a.text && a.modality !== "pulse")
    .filter(a => !Number.isFinite(since) || Date.parse(a.ts || 0) > since)
    .slice(-capN)
    .map(a => `[${a.modality}] ${String(a.text).slice(0, 160)}`);
}

async function runPulse(cfg, deps = {}) {
  const now = deps.now || new Date();
  const pc = pulseConfig(cfg);
  if (!pc.enabled) return { pulsed: false, skipped: "disabled" };
  // GATE 1 — engaged only (no interactive trace ⇒ treat as idle; never pulse the void)
  const sig = deps.signals || liveSignal(now);
  const idle = typeof sig.idle_min === "number" ? sig.idle_min : 999;
  if (idle > pc.engaged_idle_max_min) return { pulsed: false, skipped: `idle (${idle}min)` };
  const ledger = deps.ledger || readLines(LEDGER);
  // GATE 2a — call cap (kept as a runaway-loop backstop, not the real constraint)
  const count = pulsesToday(ledger, now);
  if (count >= pc.daily_cap) return { pulsed: false, skipped: `daily cap (${count}/${pc.daily_cap})` };
  // GATE 2b — TOKEN cap: the constraint that actually binds (see pulseConfig's note).
  const spent = pulseTokensToday(ledger, now);
  if (spent >= pc.daily_token_budget) return { pulsed: false, skipped: `token budget (${spent}/${pc.daily_token_budget})` };
  // GATE 2c — failure backoff: stop paying the CLI boot tax to fail identically all day.
  const fails = pulseFailStreak(ledger, now);
  if (fails >= pc.max_consecutive_failures) return { pulsed: false, skipped: `backoff (${fails} consecutive failures)` };
  // GATE 3 — headroom (never pulse the window dry; live-reserve already protects him).
  // FLOOR DERIVED, NOT GUESSED (2 Aug 2026 audit, #66). `min_headroom_tokens` was 20,000 —
  // a number nobody derived, and BELOW the measured 32,480 a pulse actually costs. So the
  // gate was letting a pulse fire into a window that could not pay for it, which is the
  // opposite of what a headroom floor is for. The config value is preserved as the named
  // key and is now a FLOOR under the floor: the real bar is whichever is larger, the
  // configured value or today's own measured mean cost off the ledger. On a day with no
  // pulses yet there is no measurement, so the configured value stands alone — and the
  // skip line says which of the two bound, so the next config value comes off evidence.
  const hr = deps.headroom || headroom(cfg, ledger, readJson(QUEUE) || {}, now, sig);
  const measured = pulseCostToday(ledger, now).mean;             // null until measured today
  const floor = Math.max(pc.min_headroom_tokens, measured || 0);
  if (hr.allowed < floor) {
    return { pulsed: false, skipped: `headroom (${hr.allowed} < ${floor}${measured ? `, today's measured cost/pulse ${measured}` : ", configured floor; cost/pulse NOT MEASURED YET today"})` };
  }
  // the afferent tail ABOVE the deterministic salience.
  // THE PULSE MUST NOT EAT ITS OWN TAIL (1 Aug 2026 audit — measured). Escalating POSTs an
  // afferent of modality "pulse" back into the SAME stream this reads, and the filter here
  // only ever checked `a.text`. Six of the last twelve afferents were its own output; five
  // read literally "pulse flagged (reasoning-hard): pulse flagged (reasoning-hard): …", and
  // the escalation rate stood at 82% over 24h. The thalamus held (wake_queue never took one),
  // so this cost tokens and signal quality rather than false wakes — but it is a feedback
  // loop, and a watch that keeps re-reading its own alarm is not watching him.
  // Filter BEFORE the slice, or excluding rows would silently shrink the window below tail_n.
  const afferentRows = deps.tail || readLines(join(STATE_DIR, "afferent.jsonl"));
  const tail = afferentRows
    .filter(a => a && a.text && a.modality !== "pulse")
    .slice(-pc.tail_n)
    .map(a => `[${a.modality}] ${String(a.text).slice(0, 160)}`);
  if (!tail.length) return { pulsed: false, skipped: "empty tail" };
  const ASK = `\n\nAbove routine chat / logging / app-switching, is ANY of these a genuinely reasoning-hard moment — a conceptual confusion, a contradiction, a strategy question worth deep thought? Reply STRICT JSON, no prose: {"escalate": true|false, "which": "<the moment text or empty>", "why": "<=12 words>"}`;
  // ---- ROLLING SESSION (Phase 3) -------------------------------------------
  const session = deps.session !== undefined ? deps.session : readJson(PULSE_SESSION);
  const resuming = pulseSessionUsable(session, now);
  // THE NEWEST MOMENT THIS RUN WILL HAVE SEEN — stamped whichever path we take,
  // so the next delta starts exactly where this one ended.
  const newestSeen = (() => {
    let t = null;
    for (const a of afferentRows) { if (a && a.text && a.modality !== "pulse" && a.ts && (!t || Date.parse(a.ts) > Date.parse(t))) t = a.ts; }
    return t;
  })();
  let prompt, delta = null;
  if (resuming) {
    delta = pulseDelta(afferentRows, session.last_afferent_ts, pc.tail_n);
    // NOTHING NEW ⇒ NOTHING TO JUDGE, and no call. The cold pulse re-read the
    // same 25 rows and re-answered them every 150s; on a resumed session that is
    // not just waste, it is the tail-eating loop with extra steps.
    if (!delta.length) return { pulsed: false, skipped: "no new moments since the last pulse (rolling session)" };
    prompt = `New moments since your last check (newest last):\n${delta.map((t, i) => `${i + 1}. ${t}`).join("\n")}${ASK}`;
  } else {
    prompt = `You are the continuous PULSE of a personal learning brain — a cheap always-on watch deciding whether the EXPENSIVE deep brain should look at a moment the fast deterministic reflex may have missed. Recent moments (newest last):\n${tail.map((t, i) => `${i + 1}. ${t}`).join("\n")}${ASK}`;
  }
  const exec = deps.exec || claudeExec;
  const t0 = Date.now();
  const r = deps.mockCall ? deps.mockCall(prompt) : exec(prompt, pc.model, resuming ? ["--resume", session.id] : [], pc.timeout_ms);
  const dur = Date.now() - t0;
  // ---- PERSIST / ROTATE / FALL BACK ----------------------------------------
  // A resumed call that FAILED drops the session so the next pulse seeds cold —
  // never a retry inside this tick (that would double-spend a failing lane, the
  // exact thing the failure-backoff rail exists to stop).
  if (!deps.dry) {
    const next =
      (resuming && !r.ok) ? { ...session, id: null, dropped_at: now.toISOString(), dropped_why: String(r.error || "resumed call failed").slice(0, 120) }
      : resuming ? { ...session, turns: (session.turns || 0) + 1, last_afferent_ts: newestSeen || session.last_afferent_ts, last_at: now.toISOString() }
      : (r.ok && r.session_id) ? { id: r.session_id, started_at: now.toISOString(), turns: 1, date: dayKey(now), last_afferent_ts: newestSeen, last_at: now.toISOString() }
      : null;
    if (next) writePulseSession(next);
  }
  // parse defensively — a malformed pulse is a HOLD, never a crash
  let verdict = { escalate: false, which: "", why: "" };
  try {
    const j = JSON.parse(String(r.text || "").replace(/^```json\s*|\s*```$/g, "").trim());
    if (j && typeof j === "object") verdict = { escalate: !!j.escalate, which: String(j.which || "").slice(0, 200), why: String(j.why || "").slice(0, 120) };
  } catch { /* hold */ }
  // METER EVERY PULSE — even a hold. This row IS the safety instrument.
  // The cache pair rides this row too (1 Aug 2026 audit). The job-runner row has carried
  // it since 25 Jul with the rule spelled out one screen below — "the components must be
  // visible or the ledger can't be audited" — and this literal simply omitted it. 0 of 853
  // pulse rows had it, leaving a mean 14,026 tok/call unattributed (~2.36M all-time). The
  // split is the whole decision: cache_creation is reducible, cache_read is the fixed boot
  // tax, and without seeing them apart there is no way to tell whether the pulse can ever
  // be made cheap or is simply the wrong shape.
  // ESCALATE by POSTing an afferent — the thalamus decides + enqueues. NEVER wake_queue.
  //
  // THE DELIVERY RECEIPT (11 Aug 2026 wiring pass — the escalation that only THOUGHT it
  // landed). `posted` was computed right here and thrown away: the ledger row said
  // `escalated:true` and NO field said whether the afferent ever reached the thalamus door.
  // MEASURED on the live ledger this morning: 1,043 pulse rows, 205 escalated, 0 carrying a
  // receipt of any kind. defaultAfferentPost (above) swallows every failure and returns
  // false by design — a 400ms abort, a refused connection, a dead :4113 all look identical
  // — so a pulse fired into a closed door was indistinguishable, on every surface, from one
  // the thalamus took. And unlike the two arms daemon_watchdog re-drives when the door comes
  // back (RESYNC_ARMS = mcp-memory + harvest, daemon_watchdog.mjs:260-263), the pulse has no
  // arm at all: the moment is simply gone. This does NOT recover it — whether a stale
  // "reasoning-hard moment" should be re-POSTed hours later is the captain's call, not a
  // guess to make here. It makes the loss VISIBLE: on the row, at both print surfaces, and
  // on token_vitals.json's `door` (see tokenVitals/doorReceipts), the file the doctor skill,
  // captains_call.mjs and organism_test.mjs already open.
  //
  // ORDER: the POST moved ABOVE the append so its receipt can ride the row. "METER EVERY
  // PULSE" is untouched — nothing between here and the append can escape (defaultAfferentPost
  // is total, and the try/catch below covers an injected deps.post that throws), and the
  // append itself is still unconditional.
  let posted = null;   // null = no escalation attempted. The ABSENCE is NAMED, never a false zero.
  if (verdict.escalate && r.ok) {
    // carry the flagged concept as concept_tokens (so the thalamus can score novelty on it)
    // + a PER-CONCEPT event_key (distinct escalations don't collapse into one habituation
    // bucket). The pulse only NAMES the moment; the thalamus stays the sole authority on
    // whether it crosses the wake threshold — that threshold is a salience-config/tuning
    // matter (part of the multi-day pulse calibration), not something the pulse forces.
    // stopword-filtered, concept-preferring (audit #3) — the old form was
    // `.split().filter(w => w.length > 3).slice(0,4)` and produced `pulse:isko`.
    const tokens = pulseTokens(verdict.which, deps.vocab || conceptVocabulary());
    try {
      const pr = await (deps.post || defaultAfferentPost)({ modality: "pulse", source: "haiku-pulse", text: `pulse flagged (reasoning-hard): ${verdict.which}${verdict.why ? " — " + verdict.why : ""}`, concept_tokens: tokens, event_key: `pulse:${tokens[0] || "moment"}`, ts: now.toISOString() });
      // a poster may answer with a boolean (defaultAfferentPost, and every injected test
      // double) or with an object receipt — `{ok:false}` is TRUTHY, so never bare-coerce it.
      posted = (pr && typeof pr === "object") ? !!pr.ok : !!pr;
    } catch { posted = false; }   // a thrown poster is a FAILED delivery, not a lost meter
  }
  const row = { ts: now.toISOString(), job: "haiku_pulse", engine: "claude", model: pc.model, input_tokens: r.input_tokens ?? null, output_tokens: r.output_tokens ?? null, cache_creation_tokens: r.cache_creation_tokens ?? null, cache_read_tokens: r.cache_read_tokens ?? null, total_tokens: r.total_tokens || 0, duration_ms: dur, ok: !!r.ok, error: r.error || null, limit_hit: !!r.limit_hit, escalated: !!(verdict.escalate && r.ok), posted,
    // Phase 3 — WHICH SHAPE THIS PULSE WAS: true = resumed a rolling session and
    // was shown ONLY the new moments · false = a cold seed (first of the day, a
    // rotation, or a recovery after a dropped session). Additive; rows before
    // today read as UNMEASURED, never as a measured "cold".
    resume: resuming, turns: resuming ? (session.turns || 0) + 1 : 1, delta_n: delta ? delta.length : null };
  (deps.appendLedger || ((o) => { if (!deps.dry) appendFileSync(LEDGER, JSON.stringify(o) + "\n"); }))(row);
  return { pulsed: true, escalated: !!(verdict.escalate && r.ok), posted, tokens: row.total_tokens, why: verdict.why, ok: !!r.ok, count: count + 1, cap: pc.daily_cap, tokens_today: spent + row.total_tokens, token_budget: pc.daily_token_budget };
}

// best-effort "is he live right now" — the freshest of his interactive traces.
// Defensive: any failure → {} (no signal → assume live → protect him).
function liveSignal(now, dir = STATE_DIR) {
  let freshest = 0;
  try {
    const scan = (arr, k = "ts") => { for (const r of arr) { const t = new Date(r[k]).getTime(); if (t > freshest && t <= now.getTime()) freshest = t; } };
    // TAIL READS (audit #51). These three are append-only logs; this function wants the
    // freshest row and nothing else. readLinesTail reads only the bytes it needs and
    // tolerates a rolled/archived presence_log, so the monthly roll cannot turn "he was
    // at the keyboard 4 minutes ago" into "no signal at all".
    scan(readLinesTail(join(dir, "afferent.jsonl"), 40).filter(a => ["voice", "code", "desktop-study", "note", "context", "gemini"].includes(a.modality)));
    scan(readLinesTail(join(dir, "presence_log.jsonl"), 6).filter(r => r.kind === "focus" && (r.focus_min || 0) > 0));
    scan(readLinesTail(join(dir, "dugout_stamps.jsonl"), 10));
  } catch (e) { swallow("liveSignal: readLinesTail(afferent.jsonl) unreadable → no live signal (idle unknown)", e); }
  return freshest ? { idle_min: Math.max(0, Math.round((now.getTime() - freshest) / 60000)) } : {};
}

// THE DEAD-BRAIN ALARM (E2E audit 25 Jul 2026 — OBSERVED LIVE, not inferred).
// The daemon ticked normally for four days while EVERY call failed with
// {"is_error":true,"result":"Not logged in · Please run /login"} — 732 consecutive
// failed ledger rows. No organ produced anything and NOTHING said a word: the
// brain had no notion of its own ok-rate. A brain that cannot call its own model
// must SAY SO, every tick, in the one place a human already looks (the ledger's
// consumers: tick log, status, token_vitals.json → the doctor).
// Deliberately reads the TAIL only: an old outage must not alarm forever.
//
// THE CAUSE, NAMED (wiring audit, 10 Aug 2026). Until today this alarm knew two
// states — "logged out" and "check the last error in brain_ledger.jsonl", which
// is an ASK handed to the captain in place of an answer the rows could already
// give. Measured on the live ledger that morning: of 2,587 failure rows, 2,365
// carry `"api_error_status":…` inside their error text and exactly 3 carry the
// http_status FIELD — the discriminator between a plan wall (nothing to fix, the
// window reopens itself) and a server/CLI bug (a real fault) sat on disk for
// weeks with no reader at all. claudegen.mjs was already computing it, and
// already handing back error_envelope on every failure, and NO organ read either.
// classifyLimit is IMPORTED, never re-implemented: the 429/529 rule stays fitted
// to the ledger evidence in one place (claudegen.mjs:26-46), and asking it about
// a synthesised `{"api_error_status":<code>}` is how this decides whether a code
// is a back-off wall — so no status list is invented or duplicated here.
// ADDITIVE ONLY: streak · sampled · dead · not_logged_in keep their exact
// meanings (the auth scan only widened its haystack to include the envelope), so
// nothing is being replaced — token_vitals.json.health, the doctor, watchman and
// captains_call's B3 card read the same fields they always did.
const AUTH_FAIL_RE = /not logged in|please run \/login|invalid api key|authenticat|unauthorized/i;
// claudegen's ledger projection writes error_envelope ONLY when it says more
// than `error` does (a null means "the envelope IS the error field"), so every
// reader ORs the two — never the envelope alone.
const forensicText = (r) => String((r && r.error_envelope) || (r && r.error) || "");
const isBackoffStatus = (code) => Number.isFinite(code) && classifyLimit(JSON.stringify({ api_error_status: code }), null).limit_hit === true;
// THE KILL IS READ (wiring pass, 11 Aug 2026) — the same defect as the line
// above, one day later. claudegen's SILENT KILL repair (10 Aug) stamps
// `killed` + `kill_signal` on every result and ledgerForensics projects both
// onto the row — and `grep -rn kill_signal --include=*.mjs scripts/ hooks/`
// returned claudegen.mjs and NOTHING ELSE. A timeout names no status and no
// auth phrase, so http stayed null and this ladder resolved a whole night of
// SIGTERM'd calls to cause "unknown" — the branch that hands the captain the
// raw error text in place of an answer. 18 dmn rows died at duration_ms
// ≈301,000 on 8 Aug (claudegen.mjs:192) and nothing anywhere could count them.
// TWO READS, because the row's shape depends on which caller wrote it:
//   · the FIELD — only nightshift/dmn/council spread ledgerForensics, so only
//     their rows carry it (116 of 4,694 rows on the live ledger this morning,
//     0 of them true yet: the field is younger than the last kill).
//   · the TEXT — parseErr prefixes the error itself with
//     `KILLED (<signal>) after <n>ms` (claudegen.mjs:162), and EVERY caller
//     copies `error` onto its row, brain's own job runner included (:2904).
//     Same retro-fit discipline as the http-from-text scan below: the field is
//     the producer's structured verdict, the text is how the rows already on
//     disk get named.
// NOT INFERRED FROM duration_ms. A row sitting at ~300s looks exactly like a
// kill, but "close enough to the timeout" is a threshold nobody measured — his
// no-guessed-numbers rule. Kills older than the 10 Aug stamp stay unnameable,
// and that is the honest answer.
const KILL_TEXT_RE = /KILLED \((SIG[A-Z]+|no-signal)\) after \d+ms/;
const killOf = (r) => {
  if (!r) return null;
  if (r.killed === true) return r.kill_signal || "no-signal";   // the field wins: the producer said so
  const m = KILL_TEXT_RE.exec(forensicText(r));
  return m ? m[1] : null;
};
function failureStreak(ledger, n = 25) {
  const rows = (ledger || []).filter(r => r && r.engine !== "gemini" && typeof r.ok === "boolean").slice(-n);
  let streak = 0;
  for (let i = rows.length - 1; i >= 0; i--) { if (rows[i].ok) break; streak++; }
  const dead = streak >= 5;
  const tail = dead ? rows.slice(-streak) : [];
  const auth = tail.some(r => AUTH_FAIL_RE.test(forensicText(r)));
  // The NEWEST failure that can name itself wins: an outage's cause is its
  // latest state, not its first. A row's own http_status is trusted ahead of a
  // re-parse of its text — the field is the producer's structured verdict, the
  // text scan is the retro-fit that recovers the 2,365 rows already on disk.
  let http = null, signal = null, sample = "";
  for (let i = tail.length - 1; i >= 0 && http === null; i--) {
    const r = tail[i], hay = forensicText(r);
    if (!sample) sample = hay;
    if (Number.isFinite(r.http_status)) { http = r.http_status; signal = r.limit_signal || "row_field"; break; }
    const cls = classifyLimit(hay, null);
    if (cls.http_status !== null) { http = cls.http_status; signal = cls.limit_signal; }
  }
  // the kills in the failing tail, newest signal last. COUNTED, never inferred:
  // this is the number that was uncountable before today.
  const kills = tail.map(killOf).filter(Boolean);
  const killSignal = kills.length ? kills[kills.length - 1] : null;
  // ADDITIVE, STRICTLY: `timeout` only ever splits what used to be `unknown`.
  // Every tail that named a status or an auth phrase resolves to exactly the
  // cause it resolved to yesterday — a killed call that still handed back a
  // COMPLETE 429 envelope is a plan wall first (that is the fact that says
  // whether waiting helps), and the kill still rides `timed_out` on the object.
  const cause = !dead ? null
    : auth ? "not_logged_in"
      : http === null ? (kills.length ? "timeout" : "unknown")
        : isBackoffStatus(http) ? "plan_limit" : "api_error";
  const hint = !dead ? null
    : cause === "not_logged_in"
      ? "the claude CLI is NOT LOGGED IN for the account this daemon runs under — open a terminal AS THAT USER, run `claude`, then /login."
      : cause === "plan_limit"
        ? `the PLAN WALL, not a bug: the CLI answered HTTP ${http} on the failing tail (via ${signal}). Nothing to fix — the window reopens on its own.`
        : cause === "api_error"
          ? `HTTP ${http} from the CLI (via ${signal}) — a server/CLI fault, NOT a plan wall, so waiting will not clear it.`
          : cause === "timeout"
            ? `CUT OFF, not refused: ${kills.length} of the last ${tail.length} failing calls died on ${killSignal} at the caller's own timeout — no status, no login problem, no answer. Waiting clears nothing; the call site's timeout or its prompt size is where this lives.`
            : `every recent brain call failed and no row named a status. Last error reads: ${sample.slice(0, 160) || "(empty)"}`;
  // timed_out / kills / kill_signal are NEW keys beside the old ones — nothing
  // that already read this object (token_vitals.json.health → the doctor,
  // watchman's B3 finding, captains_call's B3 card, the two dead-brain console
  // lines) loses a field or sees one change meaning.
  return { streak, sampled: rows.length, dead, not_logged_in: auth, timed_out: kills.length > 0, kills: kills.length, kill_signal: killSignal, cause, http_status: http, limit_signal: signal, hint };
}

// THE DOOR'S RECEIPT (11 Aug 2026 wiring pass) — the READER for runPulse's `posted`.
// A receipt nobody reads is the same black box as no receipt (this repo's own lesson, twice
// this week), so the stamp lands on the fuel gauge the doctor skill, captains_call.mjs and
// organism_test.mjs already open — no new organ, no new file.
// NO NEW NUMBER: the window is cfg.budget.window_hours, the same edge `starved.recent` uses
// one function below — an escalation older than the gauge's own window is history.
// `unknown` = the 1,043 rows written before the receipt existed (no `posted` key at all),
// and any row from a future producer that omits it. That is limits.mjs's discipline for
// brain_calls_unstamped: never a fabricated zero, never a fabricated failure.
function doorReceipts(ledger, now, hours) {
  const end = now.getTime(), cutoff = end - hours * 3600000;
  const rows = (ledger || []).filter(r => {
    if (!r || r.job !== "haiku_pulse" || !r.escalated) return false;
    const t = new Date(r.ts).getTime();
    return Number.isFinite(t) && t >= cutoff && t <= end;
  });
  let delivered = 0, undelivered = 0, unknown = 0;
  for (const r of rows) { if (!("posted" in r) || r.posted === null) unknown++; else if (r.posted) delivered++; else undelivered++; }
  return {
    window_hours: hours, escalations: rows.length, delivered, undelivered, unknown,
    summary: !rows.length ? "no pulse escalations in the window"
      : `${delivered}/${rows.length} escalation(s) reached the thalamus door`
        + (undelivered ? ` · ${undelivered} NEVER LANDED (the pulse has no resync arm — those moments are gone)` : "")
        + (unknown ? ` · ${unknown} pre-receipt row(s), delivery UNKNOWN` : ""),
  };
}

// TOKEN VITALS — the plan's fuel gauge, always current: both windows the Max-5x
// plan enforces (the rolling 5h window and the 7-day week). brain (single writer)
// mirrors this to token_vitals.json so the pacer, every organ, and the captain can
// read exactly how much of his plan is left, any time.
function tokenVitals(cfg, ledger, queueState, now, signals = null) {
  const h = headroom(cfg, ledger, queueState, now, signals);
  const est = cfg.budget.window_capacity_est_tokens;
  const ceiling = Math.max(est, (queueState && queueState.observed_window_ceiling) || est);
  const win = windowUsage(ledger, now, cfg.budget.window_hours);
  const wk = weekUsage(ledger, now), wkCap = cfg.budget.weekly_capacity_est_tokens;
  // STARVATION RIDES THE FUEL GAUGE (10 Aug 2026 wiring audit). Additive only — every
  // existing field keeps its exact meaning, so no engine is being replaced here and
  // nothing is frozen.
  // THIS COMMENT USED TO CLAIM ITS OWN READERS AND WAS WRONG (corrected 11 Aug 2026
  // wiring sweep). It said "the file the doctor skill (step 0), captains_call.mjs and
  // organism_test.mjs already open, so the fact reaches its readers without a new
  // organ" — all three open the FILE and take `.health` only (captains_call.mjs:803 →
  // health.not_logged_in · organism-doctor SKILL.md:10 → "→ health" · organism_test.mjs
  // names it in a live-writers regex and never opens it; watchman.mjs:215 the same).
  // `starved` therefore reached NOBODY for a day. Its real consumers, verified live:
  //   · physio.mjs brainFuelRead → loop_vitals.brain_fuel + the `brain_starved` bleed,
  //     which is what carries it to the mouth (talk.mjs), the sheet (manager.mjs), the
  //     dugout and /organism-doctor. Held by source in physio's own selftest.
  //   · starvedNightFor() below → dugout.mjs get_diary + learnstate.mjs diaryLine, which
  //     explain ONE artifact's absence rather than the body-wide fuel question.
  // Grep before you trust this list too: `grep -rn "starved\|starvedNightFor" scripts/*.mjs`.
  // `recent` is DERIVED, never a new threshold: inside the very rolling window this gauge
  // measures (cfg.budget.window_hours) — a starvation older than the window is history,
  // one inside it is happening now.
  const st = starvation(queueState, now);
  const recent = !!(st && st.age_min !== null && st.age_min <= cfg.budget.window_hours * 60);
  const door = doorReceipts(ledger, now, cfg.budget.window_hours);
  const pct = (a, b) => b > 0 ? Math.round((a / b) * 1000) / 10 : 0;
  return {
    ts: now.toISOString(), phase: h.phase,
    window_5h: { used: win, ceiling, pct: pct(win, ceiling), cap_now: h.cap, allowed_now: h.allowed },
    week_7d: { used: wk, cap: wkCap, pct: pct(wk, wkCap), remaining: Math.max(0, wkCap - wk) },
    // WHICHEVER ACTUALLY WON, not merely whichever is set (C1, 12 Aug 2026). cap0 is
    // max(estimate, observed), so a stale/low observed value is inert — but this field
    // still announced "observed" whenever the key existed, which is how a ceiling nobody
    // was using got reported as the one in force. It matters more since the unit change:
    // the observed value on disk (1,600,000) is in the OLD raw unit and is now inert.
    ceiling_source: (queueState && queueState.observed_window_ceiling > est) ? "observed" : "estimate",
    // E2E audit 25 Jul 2026: the fuel gauge showed a brain burning fuel while it
    // was in fact dead (every call failing). Ship the ok-rate WITH the fuel.
    health: failureStreak(ledger),
    // `health` answers "did the calls fail?"; this answers "were there any calls to
    // fail?". They are different silences and this organism has now been bitten by both.
    starved: st ? { ...st, recent } : null,
    // `health` = could the brain CALL? `starved` = was there anything to call for?
    // `door` = did what the pulse decided was worth escalating actually ARRIVE? Third
    // silence, same shelf (see doorReceipts above). Additive: nothing else changes meaning.
    door,
    summary: `${h.phase} · 5h ${win.toLocaleString()}/${ceiling.toLocaleString()} (${pct(win, ceiling)}%) · week ${wk.toLocaleString()}/${wkCap.toLocaleString()} (${pct(wk, wkCap)}%) · headroom now ${h.allowed.toLocaleString()}`
      + (recent ? ` · ⚠ STARVED: ${st.summary}` : "")
      + (door.undelivered ? ` · ⚠ DOOR: ${door.undelivered} pulse escalation(s) never landed` : ""),
  };
}

// THE CAPTAIN'S MIDNIGHT (IST sweep, 26 Jul 2026). A stored `ts` is UTC ISO, so
// slicing its first 10 chars gives the GREENWICH day; comparing that to
// localDate() (IST, UTC+5:30) mis-buckets everything logged between 00:00 and
// 05:30 IST. Same rule physio/touchline/scorer already run: parse, then format
// in HIS calendar. A date-only stamp carries no clock, so it is taken literally.
const localDayOf = (ts, fallbackNow) => {
  const s = String(ts || "");
  if (!/[T ]/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  return Number.isFinite(d.getTime()) ? localDate(d) : s.slice(0, 10);
};

// THE THIRD POOL (U3d): live-voice minutes beside Claude-window and Gemini-text
function dugoutMinutesToday(now, file = join(STATE_DIR, "dugout_ledger.jsonl")) {
  return readLines(file).filter(l => localDayOf(l.ts) === dayKey(now)).reduce((a, l) => a + (l.minutes || 0), 0);
}

// which jobs are eligible now?
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
// THE OVERNIGHT SHIFT IS ONE SHIFT even across midnight: its ledger day is the
// evening it STARTED. Calendar-keying made every overnight job eligible AGAIN at
// 00:00 — it re-ran with TODAY-tokened inputs now pointing at the empty new day
// and overwrote the good artifacts (the KAL-rich morning talk among them).
function shiftDay(job, now, cfg) {
  if (!job || job.window !== "overnight") return dayKey(now);   // Block 6 — a day job takes the run's day-key; the overnight shift below stays WALL-CLOCK (its window is)
  const endH = Number(String((cfg.overnight && cfg.overnight.end) || "07:30").split(":")[0]);
  return now.getHours() <= endH ? localDate(new Date(now.getTime() - 86400000)) : localDate(now);   // day-key: WALL-CLOCK by design (the overnight window is a clock window)
}
// THE PREVIOUS SHIFT'S DATE — the dream lane's key (11 Aug 2026 wiring audit).
// H5's two readers both asked disk for `localDate(now - 24h)`: CALENDAR yesterday.
// The WRITER keys by shiftDay, and a shift that runs past midnight has a shiftDay
// a full day behind the calendar, so the two ends of the wire spelled the filename
// differently the moment the laptop woke late — which on this machine is the
// normal case, not the edge one. MEASURED on the only night the lane ever ran:
// dreams wrote brain_out/dreams/2026-08-09.md at 01:23 IST (shift 2026-08-09) and
// the agenda six minutes later at 01:29 (same shift 2026-08-09) asked for
// "2026-08-09" — THIS shift's own file, not last shift's — while the night coach
// at 22:00 the evening before asked for "2026-08-08". Two consumers of one pick,
// two different files, and neither of them the previous shift. Agenda is priority
// 95 and dreams is 15, so within a shift the agenda ALWAYS runs first: a
// same-shift key can only ever open a file that does not exist yet. Derived from
// shiftDay() itself so writer and readers can never drift apart again, and
// noon-anchored so the subtraction cannot land on a DST seam.
function prevShiftDate(shiftDate) {
  return localDate(new Date(new Date(`${shiftDate}T12:00:00`).getTime() - 86400000));
}
// THE ATTEMPT LEDGER (E2E audit 25 Jul 2026). jobs_run is only credited on
// SUCCESS ("a failed job does not consume its daily slot"), which is right — but
// nothing counted the FAILURES, so a deterministically-failing job re-ran on every
// ~75s beat forever at full model cost: wall_insights derives a number → validator
// rejects → slot never consumed → highest-priority eligible job again 75s later.
// Same loop for a logged-out CLI. Attempts are now counted per shift beside the
// runs, and a job that has burned its attempts sits out until the next shift.
function attemptsOn(queueState, day, id) {
  return ((queueState && queueState.jobs_failed && queueState.jobs_failed[day]) || {})[id] || 0;
}
function recordJobFail(queueState, job, now, cfg) {
  const sd = shiftDay(job, now, cfg);
  queueState.jobs_failed = queueState.jobs_failed || {};
  const b = queueState.jobs_failed[sd] = queueState.jobs_failed[sd] || {};
  b[job.id] = (b[job.id] || 0) + 1;
  return queueState;
}
// the one place a run is credited — shared by tick() and manual `run` mode, so a
// manual run consumes the same slot the scheduler checks (E2E audit 25 Jul 2026).
function recordJobRun(queueState, job, now, cfg) {
  const sd = shiftDay(job, now, cfg);
  queueState.jobs_run = queueState.jobs_run || {};
  const b = queueState.jobs_run[sd] = queueState.jobs_run[sd] || {};
  b[job.id] = (b[job.id] || 0) + 1;
  return queueState;
}
// THE STARVED NIGHT, WRITTEN DOWN (10 Aug 2026 wiring audit). The budget refusal in
// tick() built the exact reason — `budget (overnight: 1999481/1520000)` — and threw the
// string away: no ledger row, no state write, and the daemon's own line said only
// "0/1 ran" into a window that is HIDDEN (hidden_run.vbs). Measured on this repo: 1,135
// beats printed that line, `diary` (priority 10, at 03:00) has NEVER run — 0 rows in
// 4,530 — and `brain status` still said "health OK", because failureStreak() samples
// boolean-`ok` rows and a starvation produces none. Absence again, the RC-4 shape: the
// organism detects FAILURE and not ABSENCE.
// TWO records, deliberately different in cost:
//   · queueState (brain owns brain_queue.json) counts EVERY starved beat — same
//     per-shift-day shape as jobs_run/jobs_failed, so it keys the whole night at once.
//   · the LEDGER gets exactly ONE row per (shift day, job) episode — `first` below.
//     A row per beat would be 1,135 rows a night and would roll the 2 MB ledger's real
//     history off the disk to record nothing but silence.
// The block NEVER consumes the job's slot (unlike agenda:skip, which is a decision):
// starvation is a wall, and the job must still run the moment headroom returns.
function recordBudgetBlock(queueState, job, h, now, cfg) {
  const sd = shiftDay(job, now, cfg);
  queueState.budget_starved = queueState.budget_starved || {};
  const day = queueState.budget_starved[sd] = queueState.budget_starved[sd] || {};
  const first = !day[job.id];
  const b = day[job.id] = day[job.id] || { beats: 0, first_ts: now.toISOString(), phase: h.phase, priority: job.priority ?? null };
  b.beats++;
  b.last_ts = now.toISOString();
  b.phase = h.phase;                       // the latest phase — a block can span the taper
  b.used = h.used; b.cap = h.cap;          // the numbers AS MEASURED, never a derived verdict
  return { first, shift_day: sd, record: b };
}
// The read side: the most recent starved shift, shaped for a consumer that must not
// guess. It reports the SHIFT DAY and the raw counts and lets the reader decide what is
// current — no staleness threshold is invented here (his standing rule: no number before
// the data). tokenVitals/status compare against the window this gauge already measures.
function starvation(queueState, now = new Date()) {
  const all = (queueState && queueState.budget_starved) || {};
  const days = Object.keys(all).sort();
  if (!days.length) return null;
  const sd = days[days.length - 1];
  const jobs = Object.entries(all[sd] || {}).map(([id, r]) => ({ id, ...r }))
    .sort((a, b) => (b.priority ?? -1) - (a.priority ?? -1) || (b.beats || 0) - (a.beats || 0));
  if (!jobs.length) return null;
  const beats = jobs.reduce((a, j) => a + (j.beats || 0), 0);
  const last = jobs.map(j => j.last_ts || j.first_ts).sort().pop() || null;
  const age_min = last ? Math.max(0, Math.round((now.getTime() - new Date(last).getTime()) / 60000)) : null;
  return {
    shift_day: sd, jobs, beats, last_ts: last, age_min,
    summary: `${jobs.length} job(s) starved on the ${sd} shift — ${beats} beat(s) refused for budget · ${jobs.map(j => `${j.id}×${j.beats}`).join(", ")}`,
  };
}
// ---------------------------------------------------------------------------
// WHY THE PAGE IS BLANK (11 Aug 2026 wiring pass) — starvation, told to the reader
// ---------------------------------------------------------------------------
// starvation() above already rides token_vitals.json as `starved` (tokenVitals),
// and two organs open that file — captains_call.mjs and watchman.mjs — but NEITHER
// connects it to the artifact it explains. Meanwhile the diary's two readers print
// nothing at all (learnstate.mjs diaryLine) and "a missed morning means the laptop
// slept through the slot" (dugout.mjs get_diary) on a night the laptop was awake.
// MEASURED on his live repo this session, 11 Aug 2026 04:37 IST: `diary` was the
// ONLY eligible job inside its 03:00–07:30 window and headroom returned allowed 0 —
// used 1,901,322 against cap 1,520,000 in the rolling 5h window, and the spend is
// almost entirely lanes that are not brain jobs at all (dmn_rollout 732,710 · ns_*
// 712,627 · haiku_pulse 187,660, last row 03:48 IST). 0 diary rows in 4,693. The
// page is not late, it is STARVED, and until this line the organism could not tell
// those two apart in the one place a human reads them.
//
// A REFUSED BEAT IS PROOF THE MACHINE WAS AWAKE — a tick had to run to refuse it.
// That is the whole discrimination handed to the callers, and it is derived from
// the record's EXISTENCE, not from any threshold.
//
// THE FORMATTER LAW (dugout.mjs:92 — "every reader renders through the owner's own
// line"): `why` is built here ONCE and each reader wraps it in its own prefix.
// `serveDay` is the MORNING the reader looked for; the night that would have served
// it is the day before — serveDate()'s own `next_morning` contract, the only serve
// mode the diary declares. Returns null when there is no evidence, so absence
// WITHOUT a measured cause stays silent — the H6 "absence is silence" rule this
// must not break.
export function starvedNightFor(vitals, jobId, serveDay) {
  const st = vitals && vitals.starved;
  if (!st || !Array.isArray(st.jobs) || !/^\d{4}-\d{2}-\d{2}$/.test(String(serveDay || ""))) return null;
  // noon anchor, not midnight: a DST/TZ edge can slip a midnight date by a day, and
  // this comparison is the whole gate (same reason localDayOf parses before it formats).
  const night = localDate(new Date(new Date(`${serveDay}T12:00:00`).getTime() - 86400000));
  if (st.shift_day !== night) return null;
  const j = st.jobs.find((x) => x && x.id === jobId);
  if (!j) return null;
  const spend = (typeof j.used === "number" && typeof j.cap === "number")
    ? ` at ${j.used.toLocaleString()}/${j.cap.toLocaleString()} tokens in the rolling window` : "";
  // TWO clauses, not one paragraph. `why` is the measured fact and is short enough to
  // ride a kickoff line without becoming the wall the ANCHOR LAW forbids; `awake` is the
  // correction — only the Gaffer, who would otherwise volunteer the sleep story, needs it.
  return { ...j, shift_day: night,
    why: `budget-starved on the ${night} night — ${j.beats || 0} beat(s) refused${spend}`
      + ` (${j.phase || "?"} phase); nothing spent, slot not consumed`,
    awake: `A refused beat means a tick RAN in order to refuse it — the machine was awake,`
      + ` so this is not a slept-through morning.` };
}

// hoisted out of eligibleJobs (1 Aug 2026) so the absence alarm in tick() reads the
// SAME window boundary the eligibility check uses — a duplicated "12:00" literal would
// drift the moment either side moved, and the alarm exists precisely to be trustworthy.
const jobWindows = (cfg) => ({ morning: ["07:30", "12:00"], midday: ["12:00", "17:00"], evening: ["17:00", "22:00"], overnight: [cfg.overnight.start, cfg.overnight.end], any: ["00:00", "24:00"] });
// Does this arm still speak for the job's CURRENT shift? See the long note at the
// trigger gate below for why (and for why this is a shift comparison, not a TTL).
// Deliberately takes the arm object rather than the whole queue so the presence
// test stays where it always was — an ABSENT trigger must remain closed, and a
// helper that answered "fresh" for `undefined` would silently open every gate.
function armFresh(job, arm, now, cfg) {
  const t = arm && arm.ts ? Date.parse(arm.ts) : NaN;
  if (!Number.isFinite(t)) return true;   // undateable arm ⇒ the old presence-only behaviour
  return shiftDay(job, new Date(t), cfg) === shiftDay(job, now, cfg);
}
function eligibleJobs(cfg, queueState, now, voiceMinToday = null) {
  // MASTER PAUSE — the thinking stops, the CAPTURING does not. Every deterministic
  // organ (capture, fsrs, calibration, nemesis, learning_state, presence, thalamus,
  // the wall) keeps running and keeps recording, so a paused week still arrives with
  // real data for the organism to think about when it wakes. Paused is stated out
  // loud on every tick and in `status` — a silent pause would be indistinguishable
  // from a dead brain, which is this organism's oldest failure mode.
  if (cfg && cfg.paused === true) return [];   // === true: only a literal pause pauses
  const nowHM = hhmm(now);
  const maxAttempts = (cfg.guards && cfg.guards.max_attempts_per_shift) || DEFAULTS.guards.max_attempts_per_shift;
  const ranOn = (day) => (queueState && queueState.jobs_run && queueState.jobs_run[day]) || {};
  const windows = jobWindows(cfg);
  const daytime = inRange(nowHM, cfg.study_hours.start, cfg.study_hours.end);
  return cfg.jobs.filter(j => {
    if (j.enabled === false) return false;
    if ((ranOn(shiftDay(j, now, cfg))[j.id] || 0) >= (j.max_per_day || 1)) return false;
    // RETRY CAP: burned its attempts this shift → sit out (see attemptsOn above)
    if (attemptsOn(queueState, shiftDay(j, now, cfg), j.id) >= (j.max_attempts || maxAttempts)) return false;
    if (Array.isArray(j.days) && !j.days.includes(DOW[now.getDay()])) return false;
    if (j.engine === "gemini" && !cfg.gemini.enabled) return false;
    // THE THIRD POOL: heavy voice day → daytime Gemini text/render jobs step
    // aside (the voice needs the free-tier pool); they run overnight anyway.
    if (j.engine === "gemini" && daytime && cfg.dugout_pool && cfg.dugout_pool.enabled &&
        voiceMinToday !== null && voiceMinToday >= cfg.dugout_pool.gemini_defer_threshold_min) return false;
    // EVENT-TRIGGERED jobs (U4): eligible ONLY while their trigger is armed
    // (brain.mjs trigger <name> "<reason>"); the tick consumes it on success.
    // A2 (9 Aug 2026, launch worklist): a job may also declare trigger_fallback_hm —
    // past that HH:MM the gate opens even unarmed, so a dead conductor can DELAY the
    // sheet but never starve it. Before the fallback, unarmed = wait: the catch-up
    // burst stays ordered (signals first, sheet second), which is the law the
    // conductor claimed since day one but nothing enforced until this line.
    // AN ARM BELONGS TO THE SHIFT THAT MADE IT (11 Aug 2026, dead-wire pass).
    // The gate above tested only that the KEY exists, so `ts` — written by BOTH
    // arming paths (conductor.mjs:287 armTrigger, and the `brain trigger` CLI) —
    // was read by nothing and an arm never expired. Measured on the live file the
    // day this was found: brain_queue.triggers.morning_signals.ts =
    // 2026-08-10T03:45:11.892Z, still armed on 11 Aug, because the arm lands AFTER
    // the job it opens (conductor.json finished 03:45:12Z; formation_read had
    // already fired at 03:15:09Z = 08:45 IST). So the sheet has been running every
    // morning on YESTERDAY's permission, 30 min before that day's conductor
    // refreshed readiness/fsrs/calibration/nemesis/learning-state — the exact
    // ordering ("signals first, sheet second") the trigger exists to enforce.
    // NOT A TTL — NO NUMBER IS INVENTED HERE. Freshness is the job's OWN shift,
    // via the shiftDay() this same filter already uses two lines up for
    // max_per_day: same shift ⇒ the arm still speaks for today, different shift ⇒
    // it is history. Nothing new to tune, and a "day" can never drift between the
    // run-counter and the gate because it is one function.
    // FAIL-OPEN ON AN UNDATEABLE ARM: no ts, or a ts that will not parse, keeps
    // the old presence-only behaviour. Refusing an arm we cannot date would be a
    // NEW way to starve the sheet, which is precisely what A2 was built to stop.
    // NO ENGINE IS REPLACED, so there is nothing to freeze under a *Legacy name:
    // the fallback path, the consume-on-success and the unarmed case are all
    // byte-for-byte what they were; the only new branch is the stale one.
    if (j.trigger) {
      const arm = (queueState && queueState.triggers) ? queueState.triggers[j.trigger] : null;
      const open = !!arm && armFresh(j, arm, now, cfg);
      if (!open && !(j.trigger_fallback_hm && nowHM >= j.trigger_fallback_hm)) return false;
    }
    // H2 (10 Aug 2026, refuter-caught BLOCKER): the at-gate was a plain string
    // compare, blind to the overnight window's midnight wrap — an `at` in the
    // after-midnight segment (e.g. diary 03:00) read as ELIGIBLE 22:00-23:59
    // ("22:05" >= "03:00" is string-true), so the job ran hours BEFORE the
    // moment its at named. No overnight job had ever carried an `at`, so the
    // hole sat unexercised until H6. Wrap-aware now: when the window wraps and
    // j.at sits in the after-midnight half (at < window start), eligibility is
    // the [at → end) segment alone. Pre-midnight ats keep the old behaviour.
    // In a wrapped window BOTH halves collapse to inRange(now, at, end): a
    // pre-midnight at (agenda 22:45) stays eligible across the wrap (02:00 is
    // "after 22:45" within this shift), an after-midnight at (diary 03:00)
    // waits out the evening half — inRange's own wrap branch carries both.
    if (j.at) {
      const [ws, we] = windows[j.window] || windows.any;
      if (ws > we) return inRange(nowHM, j.at, we);
      return nowHM >= j.at && inRange(nowHM, ws, we);
    }
    return inRange(nowHM, ...(windows[j.window] || windows.any));
  }).sort((a, b) => (b.priority || 0) - (a.priority || 0));
}

// ---------------------------------------------------------------------------
// THE GATE — consumption-gated spend, two-way, automatic
// (ORGANISM_OVERHAUL__2026-08-18.md §5 · LAW L5 · built 18 Aug 2026 on his word)
// ---------------------------------------------------------------------------
// WHAT THIS REPLACES. On 18 Aug 2026 this same `status` printed 11 jobs billed on
// absent evidence and 10 on half-eaten inputs, ~90% of the week's 6.12 crore tokens
// in the dark lane and ~0% reaching his ear. Every earlier repair here made the
// LEDGER honest (finding #64's absent count, the elision pair, the starved night)
// and left the SPEND wired to aliveness. This section wires it to USEFULNESS: a job
// runs iff its evidence exists (E), its output has reached HIM inside a window (C),
// and it is not stuck in a failure streak (F) — else it sleeps, journals ONE row,
// files ONE card, and wakes ITSELF the moment E∧C∧¬F holds again. Nothing is
// deleted, no list is kept: `brain status` derives who is asleep from the live
// facts every time it is asked. The verdict function is gate.mjs's `decide()`,
// shared with nightshift and the DMN, so "asleep" means one thing everywhere.
//
// E — evidence: the job's REQUIRED inputs that are NOT the organism's own artifacts.
//   A required `brain_out/…` path is an UPSTREAM dependency, not evidence about him
//   (midday_cartridge needs today's digest, which lands at 12:30 — that absence is
//   a same-day ordering fact, and runJob's own required-absent refusal keeps
//   handling it exactly as before). Only state HE or the world produced (season.json,
//   post_match/, slip.jsonl, twin.json …) can put a lane to sleep on E. `dreams`
//   carries its one computed probe (the cracked-axes inventory) — the same probe
//   runJob already refuses on before spending.
// C — consumed by him: the newest row in consumption.jsonl for this job or its
//   out-lane (spoken · sat · briefed · carded · opened · pushed), PLUS the two
//   derived sources no organ has to log: a card whose `open` dispatch points into
//   this lane and he answered haan/na (captains_call.json is READ here, never
//   written), and — for `job_input` surfaces — the consumption of the job that EATS
//   this one, transitively (a digest that fed a cartridge that a sitting loaded DID
//   change a sitting). "Some other job read it" (reconcile's word) is NOT a row.
//   First-run grace: a job with no boolean-ok ledger row has never had a chance to
//   be consumed, so it runs once. After that, the window decides.
// F — a run of `fail_streak` ok:false rows at the tail of this job's ledger.
//
// THE TWO WAKE DOORS (his ruling — reversibility, never a gate): the card's `na`
// dispatches `brain gate wake <lane>`; so does the CLI by hand. Both write ONE
// force into brain_queue.gate.forced[lane] = { until: +window_days, once: true }.
// `once` lets a lane through the F guard exactly one run; a success then clears
// the streak on the ledger by itself. Forces ride the same lost-update-safe merge
// the triggers ride (mergeTriggers).
//
// OWNERSHIP, unchanged: consumption.jsonl and brain_out/gate.jsonl are written HERE
// and only here (recordConsumption · gateTransition — in-process import or the
// `consumed` / `gate` CLI doors); the card goes through captains_call's own CLI;
// brain_queue.json stays this file's. gate.mjs writes nothing.
// ---------------------------------------------------------------------------
const CALL_STATE = join(STATE_DIR, "captains_call.json");   // READ ONLY here — the card organ is its sole writer

// ---- the consumption lane (§5.2) -------------------------------------------
// recordConsumption({job|lane, kind, by, file?, note?}, deps?) → {ok, row|why}
// Kinds are CLOSED (gate.mjs CONSUMPTION_KINDS): a caller cannot invent a new way
// of "reaching him" without changing the law in the one place it is written.
export function recordConsumption(evt = {}, deps = {}) {
  const { job = null, lane = null, kind, by = null, file = null, note = null } = evt;
  if (!CONSUMPTION_KINDS.includes(kind)) return { ok: false, why: `unknown consumption kind '${kind}' — one of ${CONSUMPTION_KINDS.join("|")}` };
  if (!job && !lane) return { ok: false, why: "job or lane required" };
  const now = deps.now || new Date();
  const row = { ts: now.toISOString(), job, lane, kind, by, file, note };
  try {
    if (deps.append) deps.append(JSON.stringify(row) + "\n");
    else appendFileSync(CONSUMPTION, JSON.stringify(row) + "\n");
    return { ok: true, row };
  } catch (e) { return { ok: false, why: String((e && e.message) || e).slice(0, 120) }; }
}
export function consumptionRows() { return readLines(CONSUMPTION); }

// ---- who eats whom (transitive C for job_input surfaces) --------------------
// Derived from the CONFIG's own `inputs` declarations + an optional explicit
// `gate.consumers` list — never a table kept by hand. Disabled downstream jobs
// cannot consume anything, so they are not consumers.
export function jobConsumers(cfg, job) {
  const lane = job.out || job.id;
  const prefix = `brain_out/${lane}/`;
  const jobs = (cfg && cfg.jobs) || [];
  const viaInputs = jobs.filter((j) => j.id !== job.id && j.enabled !== false && normalizeInputs(j).some((d) => d.path.startsWith(prefix)));
  const explicit = gateConfig(job).consumers.map((id) => jobs.find((j) => j.id === id && j.enabled !== false)).filter(Boolean);
  return [...new Set([...viaInputs, ...explicit])];
}
// A card that opened THIS lane's file and that he answered haan/na = he engaged
// with the artifact (`baad` is a deferral, not a read). Derived, never logged.
export function cardConsumption(cards, lane) {
  let best = null;
  for (const c of (Array.isArray(cards) ? cards : [])) {
    if (!c || !c.dispatch || c.dispatch.kind !== "open" || !c.answered_at || !["haan", "na"].includes(c.answer)) continue;
    const p = String(c.dispatch.path || "").replace(/\\/g, "/");
    if (!p.includes(`brain_out/${lane}/`)) continue;
    const t = Date.parse(c.answered_at);
    if (Number.isFinite(t) && (!best || t > best.t)) best = { t, last_at: c.answered_at, kind: "carded", by: `captains_call ${c.id}` };
  }
  return best ? { last_at: best.last_at, kind: best.kind, by: best.by } : null;
}
// THE MOUTH IS A CONSUMPTION SOURCE NOBODY HAS TO LOG (§5.2 "pushed"). mouth_log.jsonl
// (this file's own E4 lane) already records every push ATTEMPT with `sent`; a sent
// SHEET push carries the sheet's own head in its body, so it IS the sheet reaching
// his phone — the sheet job (cfg.ntfy.push_after) is consumed at the newest sent
// `sheet` row. Derived at decision time from a file this organ already owns; nothing
// new is written.
// DELIBERATELY NOT a source for the team-talk mp3s (teamtalk_am/pm), and this was
// weighed and reversed on the day it landed: the first cut counted "announced inside
// a sent push" (🎙️ line in the sheet push / the full-time bell) as reaching him — but
// an announcement that an mp3 exists is not the mp3 in his ear. Nothing on this
// machine records a PLAY. Under §5.2 that is exactly "not consumed", and those two
// lanes are the poster children of R3 (teamtalk_am 15/15 runs on absent evidence), so
// letting a weaker signal wake them would put the bleed back through the side door.
// They sleep until something proves a listen — the postmatch voice lane (§10, Block 5)
// records `spoken` when it plays one — or his `na`.
export function mouthConsumption(job, cfg, ctx) {
  const rows = ctx.mouth !== undefined ? ctx.mouth : readLines(MOUTH_LOG);
  const pushAfter = (cfg && cfg.ntfy && cfg.ntfy.push_after) || [];
  if (!pushAfter.includes(job.id)) return null;
  const sent = rows.filter((r) => r && r.sent === true && r.kind === "sheet" && Number.isFinite(Date.parse(r.ts))).sort((a, b) => Date.parse(b.ts) - Date.parse(a.ts));
  return sent[0] ? { last_at: sent[0].ts, kind: "pushed", by: "ntfy sheet push (mouth_log)" } : null;
}
export function consumptionForJob(cfg, job, ctx, visited = new Set()) {
  const none = { last_at: null, kind: null, by: null };
  if (!job || visited.has(job.id)) return none;
  visited.add(job.id);
  const lane = job.out || job.id;
  const cands = [consumptionOf(ctx.consumption || [], [job.id, lane])];
  const cc = cardConsumption(ctx.cards, lane);
  if (cc) cands.push(cc);
  const mc = mouthConsumption(job, cfg, ctx);
  if (mc) cands.push(mc);
  // explicit consumers that are NOT brain jobs (a nightshift lane, a skill) are read
  // as consumption keys directly — the cross-organ half of the transitive rule.
  for (const id of gateConfig(job).consumers) {
    if ((cfg.jobs || []).some((j) => j.id === id)) continue;   // a brain job: walked below
    const c = consumptionOf(ctx.consumption || [], [id]);
    if (c.last_at) cands.push({ ...c, by: `${c.by || "?"} ← ${id}` });
  }
  for (const d of jobConsumers(cfg, job)) {
    const dc = consumptionForJob(cfg, d, ctx, visited);
    if (dc.last_at) cands.push({ ...dc, by: `${dc.by || "?"} ← ${d.id}` });
  }
  let best = null;
  for (const c of cands) { const t = Date.parse(c.last_at || ""); if (Number.isFinite(t) && (!best || t > best.t)) best = { t, ...c }; }
  return best ? { last_at: best.last_at, kind: best.kind, by: best.by } : none;
}

// ---- evidence, per job (E) --------------------------------------------------
// File evidence = REQUIRED inputs outside brain_out/. Computed probes per kind.
export function gateEvidence(job, cfg, ctx) {
  const gi = ctx.evidenceFor ? ctx.evidenceFor(job) : gatherInputsAudited(job, ctx.now, shiftDay(job, ctx.now, cfg));
  const isOwn = (p) => /^brain_out\//.test(String(p).replace(/\\/g, "/"));
  const required_absent = (gi.required_absent || []).filter((p) => !isOwn(p));
  const absent = (gi.absent || []).filter((p) => !isOwn(p));
  const upstream_absent = (gi.required_absent || []).filter(isOwn);
  let ok = true, detail = null;
  if (job.kind === "dreams") {
    const inv = ctx.crackedInv !== undefined ? ctx.crackedInv : crackedAxesInventory();
    if (!inv.length) { ok = false; detail = "the cracked-axes inventory is EMPTY — dreams need his Re-Jirah rounds or measured scoreboard cracks (a real round or rep restores it)"; }
    else detail = `${inv.length} cracked axis/axes on record`;
  }
  return { ok, required_absent, absent, upstream_absent, detail, declared: gi.declared || 0, present: gi.present || 0 };
}

// ---- forces (the two wake doors) -------------------------------------------
export function gateForce(queueState, lane) {
  const f = queueState && queueState.gate && queueState.gate.forced && queueState.gate.forced[lane];
  return f && typeof f === "object" ? f : null;
}
export function setGateForce(queueState, lane, { until, once = true, by = "cli", now = new Date() } = {}) {
  queueState.gate = queueState.gate || {};
  queueState.gate.forced = queueState.gate.forced || {};
  queueState.gate.forced[lane] = { until: until || null, once: !!once, by, ts: now.toISOString() };
  return queueState;
}

// ---- THE FOLD, the runner's fact (overhaul §10 · Block 5.2, 18 Aug 2026) ---------
// A job with `folded_into: "<target>"` in brain_config.json is DISPLACED by that target
// (night_coach · day_cartridge · agenda · teamtalk_am · midday_cartridge · capsule_premap
// → prepare_tomorrow: ONE plan a night is what he meets). Not a switch: the lane stays
// enabled, and D fails — it sleeps — only while the target COVERS the day this lane
// serves. Computed here from the same three functions the WRITER uses (outDate ·
// shiftDay · serveDate), so the fold and the artifact can never spell the day apart:
//   covered  ⇐ the target's artifact for the day it serves NOW exists on disk
//              (brain_out/<target.out>/<day>.json|.md — prepare_tomorrow's plan), OR
//              the target is AWAKE by its own verdict, has made no attempt for that day
//              yet, and its slot for that day is still ahead (due tonight — the folded
//              lane waits instead of running first and being overwritten by the plan).
//   OPEN     ⇐ the target attempted that day and left no artifact (failed, or the plan
//              was refused by sitting's validator), or its slot passed with no attempt
//              (laptop asleep), or the target is asleep/disabled/not a job — then D holds
//              and the folded lane runs AS THE FALLBACK. Nothing deleted, no list.
// The verdict itself is gate.mjs's (the fourth letter D); this function only reads.
const nextCalendarDate = (d) => localDate(new Date(new Date(`${d}T12:00:00`).getTime() + 86400000));   // noon-anchored, like prevShiftDate
export function foldSlotAhead(target, day, now, cfg) {
  // is the target's run that would serve `day` still in front of `now`? `day` is the
  // target's outDate (a serve-day for `serve: next_morning`, the shift's evening date
  // otherwise), so first spell which calendar dates that shift's two halves fall on.
  const [ws, we] = jobWindows(cfg)[target.window] || jobWindows(cfg).any;
  const overnight = target.window === "overnight" || ws > we;
  const morningOf = target.serve === "next_morning" ? day : (overnight ? nextCalendarDate(day) : day);   // the after-midnight half
  const eveningOf = target.serve === "next_morning" ? prevShiftDate(day) : day;                            // the pre-midnight half
  const at = target.at || null;
  let slot;
  if (at) {
    // an `at` in the after-midnight half of a wrapped window (prepare_tomorrow 03:20) fires on the
    // morning; a pre-midnight at (agenda's 22:45 shape) fires the evening before.
    const evening = overnight && at >= ws;
    slot = Date.parse(`${evening ? eveningOf : morningOf}T${at}:00`);
  } else {
    // no at: the run can still come until the window CLOSES for that shift
    slot = Date.parse(`${overnight ? morningOf : day}T${we >= "24:00" ? "23:59" : we}:00`);
  }
  return Number.isFinite(slot) ? now.getTime() < slot : false;
}
export function foldStatus(job, cfg, ctx, visited = new Set()) {
  const tid = job && typeof job.folded_into === "string" && job.folded_into.trim() ? job.folded_into.trim() : null;
  if (!tid) return null;
  const target = ((cfg && cfg.jobs) || []).find((j) => j.id === tid);
  const now = ctx.now || new Date();
  if (!target) {
    // A NON-BRAIN fold target (a nightshift lane: gaffer_claim_audit → round_read, judge_night's home).
    // The config names the artifact that proves the target covered the day — `fold_artifact:
    // "brain_out/<lane>/<name>_<day>.json"`, <day> = the calendar date at this slot (nightshift's
    // own day key). No "still due" for a lane brain does not schedule: covered iff the file exists.
    const pat = typeof job.fold_artifact === "string" ? job.fold_artifact.replace(/\\/g, "/") : null;
    const m = pat && /^brain_out\/([^/]+)\/(.+)$/.exec(pat);
    if (!m) return { target: tid, covered: false, detail: `${tid} is not a brain job and no fold_artifact (brain_out/<lane>/<file with <day>>) names its output — the fold cannot cover anything` };
    const day = dayKey(now);
    const name = m[2].replace(/<day>/g, day);
    const exists = ctx.artifactExists ? ctx.artifactExists({ id: tid, out: m[1] }, day, name) : !!(laneListing({ id: tid, out: m[1] }) || []).some((f) => f.name === name);
    return exists
      ? { target: tid, covered: true, day, detail: `folded → ${tid}: its artifact for ${day} exists (brain_out/${m[1]}/${name}) — the fold target did this lane's work` }
      : { target: tid, covered: false, day, detail: `${tid} left no artifact for ${day} (brain_out/${m[1]}/${name}) — the fold is OPEN, this lane decides on its own E·C·F` };
  }
  if (target.enabled === false) return { target: tid, covered: false, detail: `${tid} is disabled — the fold cannot cover anything` };
  if (visited.has(job.id) || tid === job.id) return { target: tid, covered: false, detail: `fold cycle at ${tid} — refused, the fold is open` };
  const day = outDate(target, now, shiftDay(target, now, cfg));   // the day the target's NEXT artifact serves
  const lane = target.out || target.id;
  const exists = ctx.artifactExists ? ctx.artifactExists(target, day) : !!(laneListing(target) || []).some((f) => f.name === `${day}.json` || f.name === `${day}.md`);
  if (exists) return { target: tid, covered: true, day, detail: `folded → ${tid}: its artifact for ${day} exists (brain_out/${lane}/${day}.*) — the fold target did this lane's work` };
  // no artifact yet — did the target already TRY for that day? (rows whose own outDate is `day`)
  const attempts = (ctx.ledger || []).filter((r) => r && r.job === tid && typeof r.ok === "boolean" && !r.limit_hit
    && Number.isFinite(Date.parse(r.ts)) && outDate(target, new Date(r.ts), shiftDay(target, new Date(r.ts), cfg)) === day);
  if (attempts.length) {
    const last = attempts[attempts.length - 1];
    return { target: tid, covered: false, day, detail: `${tid} ran for ${day} and left no artifact (${attempts.length} attempt(s), last ${last.ok ? "ok but nothing written — its output was refused before the write" : "failed"}) — the fold is OPEN, this lane is the fallback` };
  }
  // not yet tried: is the target itself awake, and is its slot for `day` still ahead?
  const tv = gateVerdictFor(target, cfg, ctx, new Set([...visited, job.id]));
  if (!tv.run) return { target: tid, covered: false, day, detail: `${tid} is itself ASLEEP (${["E", "C", "F", "D"].filter((k) => tv.why[k] && !tv.why[k].ok).join("+")}) — the fold is OPEN, this lane decides on its own` };
  if (foldSlotAhead(target, day, now, cfg)) return { target: tid, covered: true, day, detail: `folded → ${tid}: due ${target.at || "in its window"} for ${day} (awake, not yet run) — this lane waits; the fold opens by itself if it fails or misses` };
  return { target: tid, covered: false, day, detail: `${tid}'s slot for ${day} passed with no attempt — the fold is OPEN, this lane is the fallback` };
}

// ---- the verdict for one brain job -----------------------------------------
export function gateVerdictFor(job, cfg, ctx, visited = new Set()) {
  const evidence = gateEvidence(job, cfg, ctx);
  const consumption = consumptionForJob(cfg, job, ctx);
  const never_ran = !gateEverRan(ctx.ledger || [], job.id);
  const forced = gateForce(ctx.queueState, job.id);
  const fold = ctx.foldFor ? ctx.foldFor(job) : foldStatus(job, cfg, ctx, visited);
  const v = gateDecide({ job, evidence, consumption: { ...consumption, never_ran }, failures: { streak: failStreakOf(ctx.ledger || [], job.id) }, now: ctx.now, forced, fold });
  return { ...v, evidence, consumption, never_ran, forced, fold_status: fold };
}
// ---- the verdict for a NON-brain lane (nightshift, DMN) — same law, same journal ----
// The other gated organs already import this file; they hand their own evidence
// (they know their inputs) and event arming, and get back the identical verdict
// shape brain jobs get. Ledger + consumption + forces are read here (their owner),
// once per call; hermetic callers pass them in. `gate` = the lane's gate config
// (window/fail_streak/event) — nightshift/dmn declare theirs in code, since they
// have no brain_config row.
// `aliases` = the ledger job names this lane's rows carry (the DMN's rows are
// dmn_rollout/dmn_counter; the shift's are ns_*) — everRan/failStreak read them as ONE.
export function gateVerdictForLane(lane, { evidence = {}, gate = {}, event_armed, ledger = null, consumption = null, queueState = null, now = new Date(), surface = null, aliases = [] } = {}) {
  const led = ledger || readLines(LEDGER);
  const cons = consumption || consumptionRows();
  const qs = queueState || readJson(QUEUE) || {};
  const ids = [lane, ...aliases];
  const c = consumptionOf(cons, [lane]);
  const never_ran = !gateEverRan(led, ids);
  const forced = gateForce(qs, lane);
  const v = gateDecide({ job: { id: lane, gate, surface }, evidence, consumption: { ...c, never_ran, ...(event_armed !== undefined ? { event_armed } : {}) }, failures: { streak: failStreakOf(led, ids) }, now, forced });
  return { ...v, consumption: c, never_ran, forced, evidence };
}
// The live context, read ONCE per tick/status. Hermetic callers hand their own.
function gateContext(deps, now, ledger, queueState) {
  const hermetic = !!deps.ledger;   // a fixture ledger ⇒ a fixture world (no live consumption/cards/journal)
  const g = deps.gate || {};
  const call = hermetic ? null : readJson(CALL_STATE);
  return {
    now, ledger, queueState,
    consumption: g.consumption !== undefined ? g.consumption : (hermetic ? [] : consumptionRows()),
    cards: g.cards !== undefined ? g.cards : ((call && call.cards) || []),
    states: g.states !== undefined ? g.states : (hermetic ? new Map() : lastGateStates()),
    mouth: g.mouth !== undefined ? g.mouth : (hermetic ? [] : readLines(MOUTH_LOG)),
    mediaExists: g.mediaExists !== undefined ? g.mediaExists : (hermetic ? () => false : undefined),
    evidenceFor: g.evidenceFor, crackedInv: deps.crackedInv,
  };
}

// ---- the journal + the card (transitions only) -----------------------------
export function lastGateStates() {
  const m = new Map();
  for (const r of readLines(GATE_JOURNAL)) if (r && r.lane && r.state) m.set(r.lane, r);
  return m;
}
export function gateJournalRows() { return readLines(GATE_JOURNAL); }
// The one-line card (≤140 chars after clip): what slept, why, what wakes it, and
// the two words he can say. `na` dispatches `brain gate wake <lane>` (captains_call
// carries the dispatch on the card itself: --gate-wake). Idempotent per (lane,
// sleep-episode) through captains_call's rolling-key guard: gate:<lane>:<day>.
// THE LETTERS a verdict can fail on — E·C·F since Block 0, D (displaced by a fold) since
// Block 5.2. One list, so the printer, the journal, the card and `gate json` agree.
const GATE_LETTERS = ["E", "C", "F", "D"];
const failedLetters = (why) => GATE_LETTERS.filter((k) => why && why[k] && why[k].ok === false);
function gateCardArgs(lane, verdict, now, cfg = null) {
  const failed = failedLetters(verdict.why);
  const short = (s) => String(s || "").replace(/\s+/g, " ").slice(0, 46);
  const w = verdict.wakes_when ? String(verdict.wakes_when).split(" · ")[0].replace(/\s+—.*$/, "") : "";
  const days = gateConfig((cfg && (cfg.jobs || []).find((j) => j.id === lane)) || {}).window_days;
  const line = `${lane} SO GAYA (${failed.join("")}: ${short(verdict.why[failed[0]].detail)}) · jaagega: ${short(w)} · haan=sone do · na=${days}d jagao`;
  return ["file", "--line", line, "--key", `gate:${lane}:${dayKey(now)}`, "--gate-wake", lane];
}
function defaultFileCard(args) {
  try { execFileSync(process.execPath, [join(__dirname, "captains_call.mjs"), ...args], { encoding: "utf8", timeout: 20000, windowsHide: true }); return true; }
  catch { return false; }
}
// gateTransition(lane, verdict, deps) → {changed, prev, row}. Journals a row and
// files the card ONLY on a state change; identical state on every beat = silence.
export function gateTransition(lane, verdict, deps = {}) {
  const now = deps.now || new Date();
  const prev = deps.prevState !== undefined ? deps.prevState : (lastGateStates().get(lane) || null);
  const state = verdict.state;
  if (prev && prev.state === state) return { changed: false, prev, row: null };
  const D = verdict.why.D || { ok: true, detail: null };   // pre-Block-5.2 verdict shapes read as "not folded"
  // A sleep on D ALONE files NO card: the fold is his approved design (§10 — "do not deal
  // cards about this plan"), the journal + `brain status` name it, and `brain gate wake`
  // stays his hand door. A sleep that also fails E/C/F cards as before.
  const cardable = state === "asleep" && failedLetters(verdict.why).some((k) => k !== "D");
  const row = {
    ts: now.toISOString(), lane, state, by: deps.by || "brain",
    why: { E: verdict.why.E.ok, C: verdict.why.C.ok, F: verdict.why.F.ok, D: D.ok },
    detail: { E: verdict.why.E.detail, C: verdict.why.C.detail, F: verdict.why.F.detail, D: D.detail },
    fold: verdict.fold || null,
    card: state === "asleep" ? (cardable ? "filed" : "none (fold — his approved design, journal only)") : null,
    wakes_when: verdict.wakes_when || null,
    consumption: verdict.consumption || null,
  };
  if (!deps.dry) {
    if (deps.appendJournal) deps.appendJournal(JSON.stringify(row) + "\n");
    else { try { mkdirSync(OUT_DIR, { recursive: true }); appendFileSync(GATE_JOURNAL, JSON.stringify(row) + "\n"); } catch (e) { swallow("gateTransition: mkdirSync(OUT_DIR) unmakeable → ignored", e); } }
    if (cardable) {
      const args = gateCardArgs(lane, verdict, now, deps.cfg || null);
      // a caller that COLLECTS decides how many cards this becomes (see the batch rule in tick)
      if (Array.isArray(deps.collectCards)) deps.collectCards.push({ lane, args });
      else (deps.fileCard || defaultFileCard)(args);
    }
  }
  return { changed: true, prev, row };
}
// THE BATCH RULE. "One card per (lane, sleep episode)" was written for the steady
// state — a lane going quiet now and then. The DAY the gate lands, twenty-odd lanes
// sleep in ONE tick on the same cause (nothing of them ever reached him), and
// twenty-odd cards at one-per-anchor is a fortnight of the same question — the
// report-disguised-as-asks shape his 7 Aug ruling forbids. So: more than
// GATE_BATCH_CARDS sleep-transitions in one tick ⇒ ONE card for the batch, whose
// `na` wakes them ALL (`brain gate wake all`); at or under it ⇒ the per-lane cards.
const GATE_BATCH_CARDS = 3;
// `threshold` — above this many sleepers in one pass, ONE card (nightshift passes 1:
// its three lanes sleep on the same night for the same reason). `label` names the
// batch's owner on the card. The batch card's --gate-wake carries the EXACT lanes
// (comma-joined), so his `na` wakes those and only those; `all` stays a hand door.
export function gateCardsForTick(collected, now, { fileCard = defaultFileCard, threshold = GATE_BATCH_CARDS, label = "THE GATE" } = {}) {
  if (!collected.length) return { filed: 0, batch: false };
  if (collected.length <= threshold) { for (const c of collected) fileCard(c.args); return { filed: collected.length, batch: false }; }
  const lanes = collected.map((c) => c.lane);
  const line = `${label}: ${lanes.length} lanes so gaye — output kabhi tum tak nahi pahuncha (list: brain gate show) · haan=theek, khud jaagenge · na=sab 14d jagao`;
  fileCard(["file", "--line", line, "--key", `gate:batch:${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}:${dayKey(now)}`, "--gate-wake", lanes.join(",")]);
  return { filed: 1, batch: true, lanes };
}
// The whole GATE read for `status`/`gate show`: every enabled job's LIVE verdict
// beside its journaled state, plus the non-brain lanes (ns_*, dmn) that journal here.
export function gateReport(cfg, ctx) {
  const jobs = ((cfg && cfg.jobs) || []).filter((j) => j.enabled !== false);
  // an EVENT lane (job.trigger — teamtalk_pm/evening_voice ride `fulltime` since Block 5.2) is awake
  // by the gate and still WAITS for its arm; the report says which, so `status` never reads
  // "awake" as "will run tonight" for a lane whose event has not fired.
  const armed = (j) => { if (!j.trigger) return null; const a = ctx.queueState && ctx.queueState.triggers && ctx.queueState.triggers[j.trigger]; return !!(a && armFresh(j, a, ctx.now, cfg)); };
  const rows = jobs.map((j) => ({ lane: j.id, kind: j.kind, trigger: j.trigger || null, trigger_armed: armed(j), ...gateVerdictFor(j, cfg, ctx), journaled: ctx.states.get(j.id) || null }));
  const others = [...ctx.states.values()].filter((r) => !jobs.some((j) => j.id === r.lane));
  return { rows, others, asleep: rows.filter((r) => !r.run), awake: rows.filter((r) => r.run) };
}
export function printGate(rep, { verbose = false } = {}) {
  const asleep = rep.asleep, awake = rep.awake;
  const folded = rep.rows.filter((r) => r.fold && r.fold.target);
  console.log(`brain: THE GATE — ${awake.length} lane(s) awake · ${asleep.length} asleep (E=evidence · C=consumed-by-him ≤window · F=fail streak · D=displaced by a fold; asleep is health, not disease — it wakes itself)`);
  for (const r of asleep) {
    const failed = failedLetters(r.why);
    const foldTag = r.fold && r.fold.target ? ` · folded → ${r.fold.target}${r.fold.covered ? "" : " (fold OPEN — fallback)"}` : "";
    console.log(`  · ${r.lane.padEnd(18)} ASLEEP on ${failed.join("+")}${foldTag} — ${failed.map((k) => `${k}: ${r.why[k].detail}`).join(" · ")}`);
    console.log(`    ${"".padEnd(18)} wakes when: ${r.wakes_when}${r.journaled ? ` · journaled ${r.journaled.state} since ${String(r.journaled.ts).slice(0, 16)}Z` : " · not yet journaled (first slot journals it)"}`);
  }
  const armTag = (r) => (r.trigger ? (r.trigger_armed ? ` · event ${r.trigger} ARMED` : ` · event ${r.trigger} not armed — waits for the event`) : "");
  if (verbose || asleep.length === 0) for (const r of awake) console.log(`  · ${r.lane.padEnd(18)} awake — ${r.why.C.detail}${armTag(r)}${r.fold && r.fold.target ? ` · folded → ${r.fold.target} (fold OPEN: ${r.why.D ? r.why.D.detail : "?"})` : ""}${r.forced ? ` · FORCED (${r.forced.by}, until ${r.forced.until})` : ""}`);
  else {
    const forcedAwake = awake.filter((r) => r.forced);
    const openFolds = awake.filter((r) => r.fold && r.fold.target);
    const waiting = awake.filter((r) => r.trigger && !r.trigger_armed);
    console.log(`  · awake: ${awake.map((r) => r.lane + (r.never_ran ? "*" : "") + (r.trigger && !r.trigger_armed ? "⏳" : "")).join(", ")}${awake.some((r) => r.never_ran) ? "  (* = first-run grace)" : ""}${waiting.length ? `  (⏳ = event lane, ${[...new Set(waiting.map((r) => r.trigger))].join("/")} not armed — runs after the event)` : ""}${forcedAwake.length ? ` · forced: ${forcedAwake.map((r) => r.lane).join(", ")}` : ""}${openFolds.length ? ` · fold OPEN (fallback running): ${openFolds.map((r) => `${r.lane}→${r.fold.target}`).join(", ")}` : ""}`);
  }
  // THE FOLDS (Block 5.2) — every folded lane with its target, in one line, so the DoD
  // ("brain status GATE names every folded lane with its fold target") is read here.
  if (folded.length) {
    const byTarget = new Map();
    for (const r of folded) { const t = r.fold.target; if (!byTarget.has(t)) byTarget.set(t, []); byTarget.get(t).push(`${r.lane}${r.run ? " (OPEN — fallback awake)" : ""}`); }
    for (const [t, lanes] of byTarget) console.log(`  · folded → ${t}: ${lanes.join(", ")}  (enabled, asleep by verdict while ${t} covers the day; the fold opens by itself the night it fails)`);
  }
  if (rep.others.length) console.log(`  · other lanes journaled here: ${rep.others.map((r) => `${r.lane}=${r.state}`).join(" · ")}`);
}

// ---------------------------------------------------------------------------
// VALIDATORS
// ---------------------------------------------------------------------------
function bannedPhraseCheck(text, banned) {
  const hay = String(text || "").toLowerCase();
  return banned.filter(b => hay.includes(String(b).toLowerCase()));
}

// ---- FROZEN (layering law, CLAUDE.md) --------------------------------------
// These two ARE the defect finding #59/#60 names. They are kept verbatim, renamed,
// and called by NOTHING on the live path — the selftest holds them as a regression
// witness so the drift can never quietly come back without a red suite. Do not call
// them; `validators.mjs` is the plan of record.
//   · whitelisted every integer 0–31, the exact range a hallucinating LLM fabricates
//   · blanket-stripped every date and clock time, so an invented deadline passed
//   · split "10,000" into ["10","000"] and bounced honest thousands (#60)
function allowedNumbersLegacy(data) {
  const s = new Set();
  (function walk(v) {
    if (typeof v === "number" && Number.isFinite(v)) { s.add(String(v)); s.add(String(Math.round(v * 10000) / 10000)); }
    else if (typeof v === "string") for (const m of v.match(/\d+(\.\d+)?/g) || []) s.add(m);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  })(data);
  for (let i = 0; i <= 31; i++) s.add(String(i));
  return s;
}
function noNewNumbersLegacy(text, inputData) {
  const allowed = allowedNumbersLegacy(inputData);
  const stripped = String(text || "").replace(/\d{4}-\d{2}-\d{2}/g, "").replace(/\d{1,2}:\d{2}/g, "");
  for (const n of stripped.match(/\d+(\.\d+)?/g) || []) if (!allowed.has(n)) return { ok: false, bad: n };
  return { ok: true };
}

// ---- LIVE (delegates to scripts/validators.mjs) -----------------------------
// Same names, same call shape as before, so every existing caller and the export
// surface are untouched — but the engine underneath is now the ONE canonical one.
// `shown` is the assembled prompt: a digit the wrapper itself put in front of the
// model is by definition not invented, and WITHOUT it importing the tightened
// whitelist would have recreated the already-audited "invented number 90" bug inside
// brain (buildAnalysisPrompt injects the literal 25 in its own LAWS line, plus every
// fingerprint digit, none of which are in `inputs`).
const allowedNumbers = (data, shown = "") => allowedNumbersShared(data, shown);
function noNewNumbers(text, inputData, shown = "") {
  const v = noNewNumbersShared(text, inputData, shown);
  return v.ok ? { ok: true } : { ok: false, bad: v.bad, all: v.all };
}

// THE HYPE GUARD IS OPT-OUT PER JOB (2 Aug 2026 audit, finding #62).
// It exists for the captain-facing VOICE — CLAUDE.md's "no hype-man" working-style
// rule — and was being enforced on machine-side mining jobs he never reads, where the
// banned words are subject vocabulary. The obvious gate (`job.speak_to ||
// job.validate === "no_new_numbers"`) is a TRAP: evening_voice has neither, so that
// form would strip the guard from the one Opus job that writes in his ear's register.
// An explicit per-job opt-out cannot make that mistake — the default is GUARDED, and
// a job only loses it by saying so in config.
const hypeGuardOn = (job) => !job || job.hype_guard !== false;

function validateOutput(job, text, inputData, cfg, shown = "") {
  if (hypeGuardOn(job)) {
    const banned = bannedPhraseCheck(text, cfg.guards.banned_phrases);
    if (banned.length) return { ok: false, reason: `banned phrase: ${banned.join(", ")}` };
  }
  if (job.validate === "no_new_numbers") {
    const v = noNewNumbers(text, inputData, shown);
    if (!v.ok) return { ok: false, reason: `invented number: ${v.bad}` };
  }
  if (job.validate === "quotes_only") {
    // finding #61: the ≥12-char floor used to live INSIDE the pair matcher
    // (/"([^"]{12,})"/g), so any anchor shorter than 12 chars desynced the pairing and
    // the regex matched from one phrase's CLOSING quote to the next phrase's OPENING
    // quote, capturing the annotation between them as if it were a quote. lexicon_mine
    // went 0-for-115 (548,556 tokens in 7 days) and was UNWINNABLE, because his own
    // lexicon holds "one picture" (11), "tera finops" (11), "naya sawaal" (11).
    // validators.quotesOnly pairs quotes sequentially, then applies the floor.
    const v = quotesOnly(text, inputData);
    if (!v.ok) return { ok: false, reason: `non-verbatim quote: ${v.bad}…` };
  }
  return { ok: true };
}

// ---------------------------------------------------------------------------
// EXECUTORS (injectable for selftest)
// ---------------------------------------------------------------------------
const LIMIT_RE = /limit|overloaded|rate.?limit|resets \d/i;

// TRUE TOKEN COST (E2E audit 25 Jul 2026). The ledger read ONLY input_tokens +
// output_tokens. But `claude -p` runs the full CLI: the system prompt and tool
// definitions arrive as CACHE tokens, so a real call looks like
// {input_tokens: ~4, output_tokens: ~600, cache_creation_input_tokens: ~14000,
//  cache_read_input_tokens: ~9000} — i.e. the two fields we counted were a few
// PERCENT of the spend. The governor believed it had ample headroom, kept
// flooding, and slammed the plan limit while the meter read ~10%. The plan meters
// cache tokens; so do we. Counted at full weight deliberately: over-counting
// costs sharpness, under-counting costs the captain his own plan mid-study.
function usageTotal(usage) {
  if (!usage || typeof usage !== "object") return 0;
  return (usage.input_tokens || 0) + (usage.output_tokens || 0)
       + (usage.cache_creation_input_tokens || 0) + (usage.cache_read_input_tokens || 0);
}

// ---------------------------------------------------------------------------
// THE BOOT TAX — the organism's single largest waste, closed 6 Aug 2026.
// ---------------------------------------------------------------------------
// The 2 Aug pause note measured the shape of the spend and named it exactly: 178
// calls, average 47,847 tokens each, of which only ~1,706 was generated output.
// "96% of every call was the machine loading itself; 3.6% was thinking." It then
// treated that as a fact of life and paused the brain instead.
//
// It is not a fact of life. `claude -p` boots the FULL interactive CLI: its system
// prompt, every built-in tool definition, and any MCP servers the project's
// .mcp.json declares — all billed as cache tokens on EVERY call. An organ job needs
// none of it. runJob already reads every input off disk itself (gatherInputsAudited)
// and embeds it in the prompt, so the model is never asked to use a tool; it is a
// pure text transform that happens to be spawned through a coding CLI.
//
// MEASURED 6 Aug 2026, same 6-token probe, same model:
//     baseline (today)                                49,411 tokens
//     --strict-mcp-config alone                       49,146   (MCP was never the bulk)
//     --tools ""                                      22,382
//     --system-prompt + --tools "" + --strict-mcp     >>> 5,663 <<<
// 88.5% off on a bare probe. But a probe is pure overhead, so that number flatters:
// VERIFIED THE SAME DAY ON 11 REAL JOBS (a live tick, real prompts, real outputs):
//     368 historical calls   avg 33,234 tokens/call
//     11 lean jobs           avg 14,128 tokens/call     => 57.5% off
//     one tick: 155,412 spent where the old average predicted 365,574
// 57.5% is the number to quote — the probe's 88.5% is the ceiling, not the average,
// because real jobs carry real embedded input and real generated output, and BOTH are
// legitimate spend. The ratio is what actually inverted: generated output was 3.6% of
// a call on 2 Aug and is 24.9% of these eleven. The machine is finally mostly thinking.
//
// REVERSIBLE: set budget.lean_calls = false in brain_config.json to restore the old
// full-CLI invocation verbatim. Nothing else changes.
const ORGAN_SYSTEM_PROMPT =
  "You are a deterministic text transformer inside a personal accountability system. "
  + "Everything you need is in the prompt: data is embedded, never fetched. "
  + "Return ONLY what the prompt asks for — no preamble, no commentary, no apology, "
  + "and no markdown fences unless the prompt explicitly asks for them.";
const LEAN_ARGS = ["--system-prompt", ORGAN_SYSTEM_PROMPT, "--tools", "", "--strict-mcp-config"];

// resolved once per process, not per call — the switch is a config read, not a hot path
let _lean = null;
function leanEnabled() {
  if (_lean === null) {
    try { const c = loadConfig(); _lean = !(c && c.budget && c.budget.lean_calls === false); }
    catch { _lean = true; }   // default LEAN: the expensive shape must be the one you opt into
  }
  return _lean;
}

// ── THE SPLIT (14 Aug 2026, unleash Phase 1) ─────────────────────────────────
// THE FACT THE ORGANISM NEVER SAW. `claude -p` caches the SYSTEM prompt in its
// own block, with its own breakpoint, and that block SURVIVES a changed body.
// Probed on this machine 14 Aug, twice (plan §0 and again at pre-flight):
//     S1 cold   --system-prompt <21.8k stable> + body A → cw 5,026  cr 0
//     S2 warm   SAME system, DIFFERENT body            → cw   137  cr 4,890
// The organism could never benefit, because ORGAN_SYSTEM_PROMPT is 84 chars
// (~21 tokens — under every cache minimum: haiku 4096 / sonnet 1024 / opus 512)
// while the whole STABLE head — organ preamble, LAWS, quote law, the cognitive
// fingerprint — sat inside the USER prompt, which is one block that changes
// every run. So every call cache-WROTE its head at 1.25× and never once read it.
//
// WHERE THE CUT IS, and why it needs no new plumbing: every prompt builder in
// this file (analysis · night coach · dreams · agenda) is literally
// `head + inputs.map(k => "\n## INPUT " + k + …)`. The first "\n## INPUT " IS
// the head/body boundary, by construction, in all four. So the split happens
// HERE, at the one door every builder already goes through, and not one call
// site or selftest changes shape.
//
// ⚠ WHAT THE PLAN ASSUMED, AND WHAT THE MACHINE ACTUALLY DOES (measured 14 Aug,
// three sonnet probe pairs, before shipping this). READ THIS BEFORE PLANNING
// ANY WORK ON CACHING — it is the only place these numbers are written down:
//
//   A · THE HEAD IS SMALL. The plan assumed analysis heads are "typically 2k–6k
//       tokens" and therefore clear sonnet's 1024-token minimum. MEASURED, live:
//       fingerprint 977 chars, whole head 1,625 chars ≈ 406 tokens. Probed at
//       exactly that size: run 1 cw=0 cr=0 in=823 · run 2 cw=0 cr=0 — the system
//       block IS NOT CACHED AT ALL below the minimum. At 5,200 chars the same
//       probe gives cw=2,184 then cw=164 cr=2,026. The mechanism is real; our
//       head is simply under the bar.
//   B · CROSS-LANE PREFIX SHARING DOES NOT EXIST. The obvious repair — one
//       shared cartridge first, each lane's own tail after — was probed with a
//       4,600-char identical prefix and two different tails: lane A cw=1,712
//       cr=0, lane B cw=1,712 cr=0. The match is on the WHOLE system block, not
//       on the longest common prefix. So padding every head to clear the bar
//       would cost every lane ~900 tokens a run to buy a read that never comes.
//       (This is also why Phase 2 of the plan — cluster different lanes inside
//       the 5-min TTL — cannot pay through the head; see §FAILURES in
//       UNLEASH_PLAN__2026-08-14.md.)
//   C · WHAT THE SPLIT IS THEREFORE WORTH TODAY: a small, certain win — those
//       406 head tokens move OUT of a user block that is cache-WRITTEN at 1.25×
//       and never read (the body changes every run) INTO plain input at 1.0×.
//       And it is the door Phase 3 needs: the moment a lane repeats inside the
//       TTL with a head over the bar — pulse on a rolling session, a rehearsal
//       pair — the read is already wired and stamped on the ledger row.
//       INERT-BUT-ARMED, honestly labelled, rather than a lever that was sold
//       as the biggest in the plan and measured as ~2% of one call.
export const SPLIT_MARK = "\n## INPUT ";
// Windows CreateProcess caps the whole command line at 32,767 chars. The head
// rides in argv (the body never does — it goes down stdin, which has no such
// limit), so an over-long head is sent the OLD way rather than truncated: a
// clipped system prompt is a silently different instruction, which is worse
// than an uncached one. Stamped `argv-capped` on the ledger row when it happens.
const SPLIT_ARGV_MAX = 26000;
export function splitPrompt(prompt) {
  const p = String(prompt || "");
  const i = p.indexOf(SPLIT_MARK);
  if (i <= 0) return { system: null, body: p, split: null };          // no inputs section ⇒ nothing stable to hoist
  const head = ORGAN_SYSTEM_PROMPT + "\n\n" + p.slice(0, i);
  if (head.length > SPLIT_ARGV_MAX) return { system: null, body: p, split: "argv-capped" };
  return { system: head, body: p.slice(i), split: "system" };
}

// ── PER-LANE CACHING SWITCH (14 Aug 2026, unleash Phase 4) ──────────────────
// `noCache` comes from a job's optional `"caching": false` in brain_config.json.
// WHY IT EXISTS: caching is not free — a written block costs 1.25x and a read
// costs 0.1x, so a lane that WRITES a cache it never reads pays a 25% surcharge
// for nothing. Break-even reuse (cr/cw) is 0.278: below that, off is cheaper.
// WHY IT IS SET NOWHERE YET: which lanes those are is a question for DATA, not
// for a hunch — the 13 Aug plan named 34 lanes and its own table already showed
// haiku_pulse at reuse 0.43, comfortably above break-even, on the list. The
// plumbing lands now and the decision is Phase 10's, off 48h of live ledger.
function claudeExec(prompt, model, extraArgs = [], timeoutMs = 300000, lean = null, thinkTokens = null, noCache = false) {
  if (lean === null) lean = leanEnabled();
  const t0 = Date.now();
  // SPLIT_DISABLED=1 in the daemon env restores the single-block call verbatim.
  const sp = (lean && !process.env.SPLIT_DISABLED) ? splitPrompt(prompt) : { system: null, body: prompt, split: null };
  const splitArgs = sp.system ? ["--system-prompt", sp.system, "--tools", "", "--strict-mcp-config"] : null;
  const sentChars = String(prompt || "").length;   // FULL prompt — the no-usage fallback estimate must not shrink just because the head moved to argv
  try {
    const stdout = execFileSync("claude", ["-p", "--output-format", "json", "--model", model || "sonnet",
      ...(splitArgs || (lean ? LEAN_ARGS : [])), ...(Array.isArray(extraArgs) ? extraArgs : [])],
      // G4 — extended thinking via env, same mechanism the cortex has always used
      { input: sp.body, timeout: timeoutMs, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"], windowsHide: true, env: { ...process.env, ARSENAL_ORGAN: "1", ...(noCache ? { DISABLE_PROMPT_CACHING: "1" } : {}), ...(Number.isFinite(thinkTokens) && thinkTokens > 0 ? { MAX_THINKING_TOKENS: String(thinkTokens) } : {}) } });
    let text = stdout, inTok = null, outTok = null, cacheCreate = null, cacheRead = null, isErr = false, sessionId = null;
    try {
      const j = JSON.parse(stdout);
      text = j.result !== undefined ? String(j.result) : stdout;
      isErr = j.is_error === true;
      // the CLI's own conversation id — the ONLY way to resume this context later
      // (Phase 3). Additive: a caller that does not want a rolling session simply
      // ignores it, and a reply without one leaves it null rather than inventing one.
      sessionId = j.session_id ? String(j.session_id) : null;
      if (j.usage) {
        inTok = j.usage.input_tokens ?? null; outTok = j.usage.output_tokens ?? null;
        // the cache pair is where the CLI's real spend lives — see usageTotal above
        cacheCreate = j.usage.cache_creation_input_tokens ?? null;
        cacheRead = j.usage.cache_read_input_tokens ?? null;
      }
    } catch { /* non-json → raw text */ }
    // PHANTOM-TOKEN GUARD (E2E audit 25 Jul 2026): a FAILED call carries no usage
    // object, so the char-count estimate used to be ledgered as if those tokens
    // were really spent. Four days of "Not logged in" errors booked ~4.8M tokens
    // that never reached the API and throttled the governor against fiction.
    // An unmade call costs nothing; estimate only when the call actually landed.
    const measured = usageTotal({ input_tokens: inTok, output_tokens: outTok, cache_creation_input_tokens: cacheCreate, cache_read_input_tokens: cacheRead });
    const total = isErr ? measured : (measured || Math.ceil((sentChars + text.length) / 4));
    const limit_hit = isErr && LIMIT_RE.test(text);
    return { ok: !isErr, text, input_tokens: inTok, output_tokens: outTok, cache_creation_tokens: cacheCreate, cache_read_tokens: cacheRead, total_tokens: total, duration_ms: Date.now() - t0, limit_hit, error: isErr ? text.slice(0, 200) : null, split: sp.split, session_id: sessionId };
  } catch (e) {
    const msg = String((e.stderr || "") + (e.stdout || "") + e.message);
    return { ok: false, text: null, input_tokens: null, output_tokens: null, cache_creation_tokens: null, cache_read_tokens: null, total_tokens: 0,   // never spawned/never answered ⇒ zero spend
      duration_ms: Date.now() - t0, limit_hit: LIMIT_RE.test(msg), error: msg.slice(0, 200), split: sp.split };
  }
}

// RESOLVE THE GEMINI COMMAND (pure — the spawn itself stays in geminiExec).
// Windows: npm installs gemini as a .cmd shim (bare "gemini" ENOENTs from
// execFile), and Node 22 requires shell:true to spawn a .cmd (CVE-2024-27980).
// E2E audit 25 Jul 2026: the old comment claimed the path was "fixed and
// space-free", but it is built from %APPDATA% — any Windows account whose
// username has a space ("C:\Users\Nikhil Panwar\AppData\Roaming\npm\gemini.cmd")
// hands cmd.exe an UNQUOTED string, which splits at the space and tries to run
// C:\Users\Nikhil. With shell:true the config-supplied `binary` string also
// reaches cmd.exe verbatim, so it is validated as a bare name first: under a
// shell, an unvalidated string is an injection, not an argument.
function geminiCommand(binary, opts = {}) {
  const platform = opts.platform || process.platform;
  const appdata = opts.appdata !== undefined ? opts.appdata : process.env.APPDATA;
  const exists = opts.exists || existsSync;
  const name = String(binary || "");
  if (!/^[\w.-]+$/.test(name)) return { ok: false, cmd: null, shell: false, error: `unsafe gemini binary name: ${name.slice(0, 40)}` };
  const shim = platform === "win32" && appdata ? join(appdata, "npm", name + ".cmd") : name;
  const resolved = exists(shim) ? shim : name;
  const shell = resolved.endsWith(".cmd");
  // quoted ONLY when a shell will parse it; execFileSync without a shell passes
  // the path through untouched and quotes would become part of the filename.
  return { ok: true, cmd: shell ? `"${resolved}"` : resolved, shell, path: resolved, error: null };
}

function geminiExec(prompt, binary, timeoutMs = 300000) {
  const t0 = Date.now();
  try {
    // Prompt goes via STDIN (argv would hit length limits + quoting). The junk
    // legacy GOOGLE_API_KEY is stripped from the child env — the organism's
    // Gemini lane authenticates via ~/.gemini/.env only.
    const gc = geminiCommand(binary);
    if (!gc.ok) return { ok: false, text: null, total_tokens: 0, duration_ms: Date.now() - t0, limit_hit: false, error: gc.error };
    const env = { ...process.env, GEMINI_CLI_TRUST_WORKSPACE: "true" };
    delete env.GOOGLE_API_KEY;
    const stdout = execFileSync(gc.cmd, [], { input: prompt.slice(0, 200000), timeout: timeoutMs, encoding: "utf8", windowsHide: true, env, shell: gc.shell });
    return { ok: true, text: stdout, total_tokens: Math.ceil((prompt.length + stdout.length) / 4), duration_ms: Date.now() - t0, limit_hit: false, error: null };
  } catch (e) {
    return { ok: false, text: null, total_tokens: 0, duration_ms: Date.now() - t0, limit_hit: false, error: String(e.message).slice(0, 200) };
  }
}

// ---------------------------------------------------------------------------
// NTFY — the organism's mouth on the captain's phone. Two utterances ONLY:
// the 08:45 sheet (after formation_read) and the 21:30 full-time bell.
// Nothing else ever pings (constitutional). The topic is a SECRET: config
// holds "" and resolution falls back to env → gitignored throwin_topic.txt.
// ---------------------------------------------------------------------------
function resolveNtfyTopic(cfg, env = process.env) {
  // TRIPWIRE (E2E audit 25 Jul 2026): brain_config.json is TRACKED in a PUBLIC
  // repo and the topic name IS the password (NTFY_SETUP.md Part 1). The old
  // Part 3 told the captain to paste it here. Precedence is unchanged so a local
  // experiment still works — but it now says so out loud, every single run.
  if (cfg.ntfy && cfg.ntfy.topic) {
    console.warn("brain: ⚠ ntfy topic is set INSIDE brain_config.json — that file is COMMITTED to a public repo. Move it to env ARSENAL_NTFY_TOPIC or dressing-room/state/throwin_topic.txt (gitignored) and blank it here.");
    return cfg.ntfy.topic;
  }
  const fromEnv = env.ARSENAL_NTFY_TOPIC;
  if (fromEnv && String(fromEnv).trim()) return String(fromEnv).trim();
  try {
    const p = join(STATE_DIR, "throwin_topic.txt");
    if (existsSync(p)) { const t = readFileSync(p, "utf8").trim(); if (t) return t; }
  } catch (e) { swallow("resolveNtfyTopic: readFileSync(p) unreadable → null", e); }
  return null;
}
// HTTP headers are ByteString (every code point ≤ 0xFF) — Node's fetch throws on
// the club badge BEFORE any network I/O, so an emoji title would silently kill the
// push. ntfy supports RFC 2047 encoded-words in Title: the badge still shows on
// the phone, the header stays pure ASCII.
function ntfyHeaderSafe(s) {
  const str = String(s || "");
  return /^[\x00-\xFF]*$/.test(str) ? str : `=?UTF-8?B?${Buffer.from(str, "utf8").toString("base64")}?=`;
}
async function pushNtfy(cfg, title, body, fetchFn = fetch, opts = {}) {
  if (!cfg.ntfy || !cfg.ntfy.enabled) return { sent: false, why: "disabled" };
  const topic = resolveNtfyTopic(cfg);
  if (!topic) return { sent: false, why: "no topic" };
  try {
    const res = await fetchFn(`https://ntfy.sh/${encodeURIComponent(topic)}`, {
      // Markdown renders in the ntfy app — plain text passes through unchanged,
      // formatted utterances glow. Priority stays default: no urgency pressure, ever.
      method: "POST", body, headers: { Title: ntfyHeaderSafe(title), Tags: opts.tags || "soccer", Priority: opts.priority || "default", Markdown: "yes" },
      signal: AbortSignal.timeout(15000),
    });
    return { sent: res && (res.ok || res.status === 200), why: null };
  } catch (e) { return { sent: false, why: "network" }; }
}
// the OTHER sanctioned utterance's title, hoisted out of runJob (E2E audit
// 25 Jul 2026): it lived as an inline literal, so the selftest that claims to
// check "both utterances sign their titles with the badge" could not see it and
// silently only ever checked the bell. The badge IS the throw-in echo filter —
// both titles must carry it, and now both are checkable from one place.
const SHEET_PUSH_TITLE = "⚪🔴 Team sheet is up";
// THE SAME MOUTH, SAYING THE OPPOSITE THING (1 Aug 2026 audit). Not a third daily
// utterance: this and SHEET_PUSH_TITLE share the ONE morning slot (`mouth_said[day]`),
// so at most one of them is ever spoken. It exists because the morning sheet failed
// SILENTLY on 9 of 15 days — the laptop asleep through the whole 07:30–12:00 window,
// no ledger row, no bleed, and `brain status` still printing "health OK". The bell
// already stays silent OUT LOUD (see mode === "bell"); the sheet did not. Absence is
// the failure this organism could not see, so absence now has to speak.
const SHEET_ABSENCE_TITLE = "⚪🔴 No sheet this morning";
// THE MORNING SLOT — one utterance per shift-day, whoever claims it. The sheet push
// (runJob) and the absence line (tick) are the same mouth saying opposite things, so
// exactly one may speak. Pure, and exported, so the law is a fact the selftest can
// hold rather than a comment two call sites are each trusted to honour.
function mouthMaySpeak(cfg, queueState, day, jobId) {
  if (!cfg || !cfg.ntfy || !cfg.ntfy.enabled) return false;
  if (!(cfg.ntfy.push_after || []).includes(jobId)) return false;
  return !(((queueState && queueState.mouth_said) || {})[day]);
}
const BELLS = {
  // B3 (9 Aug 2026, HIS RULING): "bell time 10:00 krdo, i come back home at that
  // time" — 22:00, aligned in all three places (here, the Bell-FullTime task, the
  // config _note). It was 21:30 here while the task fired 22:30 — 60 of the 75
  // grace minutes burned before the bell even rang.
  fulltime: { at: "22:00", grace_min: 75, title: "⚪🔴 Full-time, captain", body: "**30 seconds, then sleep.**\n\nDugout se bolo **\"full time\"** — ya `npm run postmatch`\n\n• HIT ya MISS — honest\n• one signal worth naming\n• **KAL-line** — the weld that wins tomorrow's morning\n\nCOYG ⚪🔴" },
};

// the inner claude is an agentic CLI — it may wrap the sheet in chatter or try
// to "help". Deterministic slice: from the FIRST badge to the END of the LAST
// badge. No badge ⇒ return as-is (the wrapper's validator will judge it).
function sliceSheet(text) {
  const s = String(text || "");
  const first = s.indexOf("⚪🔴");
  const last = s.lastIndexOf("⚪🔴");
  if (first === -1 || last === first) return s;
  return s.slice(first, last + "⚪🔴".length);
}

// ---------------------------------------------------------------------------
// PROMPT BUILDERS
// ---------------------------------------------------------------------------
// FROZEN VERBATIM (LAYERING law) — the pre-10-Aug-2026 clipper. Head-only: it kept the
// FIRST n and dropped the tail. Kept in the file as the regression witness for the
// double-cut finding below; nothing on the live path may call it.
const clipLegacy = (s, n = 14000) => { const t = typeof s === "string" ? s : JSON.stringify(s, null, 1); return t.length > n ? t.slice(0, n) + "\n…[clipped]" : t; };

// ---------------------------------------------------------------------------
// THE DOUBLE CUT (10 Aug 2026 wiring audit — TRUNCATED_AT_DOOR)
// ---------------------------------------------------------------------------
// A .md input was cut TWICE and only one cut was named. gatherInputsAudited kept the
// LAST 20,000 chars (head dropped, SILENTLY), then clipLegacy kept the FIRST 14,000 of
// those (tail dropped, marked). The model received the MIDDLE of the day.
// MEASURED on brain_out/dugout/2026-08-10.md, 27,890 ch: the model never saw the
// opening ("CAPTAIN: Hello. / GAFFER: Hello captain. Match record resume kar raha ho")
// nor the close ("GAFFER: Cheers, Captain. Karte hain baat jab aap ready honge.").
// NINE enabled jobs declare a .md/.html input — including dugout_digest, which feeds
// day_cartridge, which IS the Gaffer's next-day system instruction. So the Gaffer was
// being briefed on a day with both its ends amputated.
//
// THE REPAIR IS ONE NAMED CUT, NOT A BIGGER ONE. The read-side slice is gone (see
// gatherInputsAudited) and this clipper now elides the MIDDLE, keeping both ends — a
// transcript's opening and close are the two spans that carry intent. Budget is
// UNCHANGED at n = 14000, so token spend does not move by a single char; the split is
// n/2 either side, DERIVED from n itself (no new threshold invented — his standing
// no-guessed-numbers rule), and the marker states the MEASURED elided count.
const clipMiddle = (t, n) => {
  if (t.length <= n) return t;
  const head = Math.ceil(n / 2), tail = n - head;   // derived from n, not chosen
  const elided = t.length - n;
  return t.slice(0, head)
    + `\n…[${elided} chars elided from the MIDDLE of this input — head ${head} + tail ${tail} kept, opening and close intact]…\n`
    + t.slice(t.length - tail);
};

// ---------------------------------------------------------------------------
// THE SAME CUT, BUT A LOG IS NOT A TRANSCRIPT (10 Aug 2026 wiring audit, second pass)
// ---------------------------------------------------------------------------
// clipMiddle above is kept BYTE-FOR-BYTE — it is the right engine for prose, and the
// .md double-cut it was written for is genuinely fixed. This is the shape it cannot
// serve: gatherInputsAudited renders a .jsonl input as readLinesTail(p, 200), an ARRAY
// of parsed rows, oldest→newest. Cut that by CHARACTERS and both seams land mid-object.
// MEASURED on live state the hour this was written, at the current n = 14000:
//   teaching_audit.jsonl — 200 rows tailed, the newest-end fragment handed to the model
//   opens `ndhe jaate hain. Beec"\n ],\n "measured": {…` — a headless object with no
//   `ts`, no `rule`, its first evidence string sheared through the middle of a Hindi
//   word. presence_log.jsonl opens mid-timestamp: `T17:00:04.266Z",\n "day":…`.
// So the row the job reasons about hardest — the newest one it can see — arrives as a
// corpse, and the marker's "opening and close intact" is a true sentence about a
// transcript and a false one about a log. It also counts CHARS, which cannot tell the
// reader he lost 192 of 200 rows.
//
// FIX: rows are elided by ROW, never mid-row, and the marker states the MEASURED row
// counts. Both ends are kept for the same reason clipMiddle keeps them — the oldest
// rows carry the log's time-span, the newest are what the job is actually reading —
// and the split is the SAME n/2 derived from n, so token spend does not move a char.
// Each side is emitted as its own valid JSON array: two honest arrays beat one mangled.
function clipRows(s, n) {
  const whole = JSON.stringify(s, null, 1);
  if (whole.length <= n) return whole;
  const headBudget = Math.ceil(n / 2), tailBudget = n - headBudget;   // derived from n, not chosen
  // largest row-count from each end that still fits its half — halving, so no row size
  // is ever assumed (rows in this organism range from ~60 to ~2,000 chars).
  const widest = (budget, take) => {
    let lo = 0, hi = s.length;
    while (lo < hi) { const mid = Math.ceil((lo + hi) / 2); if (JSON.stringify(take(mid), null, 1).length <= budget) lo = mid; else hi = mid - 1; }
    return lo;
  };
  let k = widest(tailBudget, m => s.slice(-m));        // NEWEST rows — the ones the job reasons about
  let j = widest(headBudget, m => s.slice(0, m));      // OLDEST rows — the span's other edge
  if (j + k > s.length) j = s.length - k;              // never show a row twice
  // a single row wider than half the budget: deliver the NEWEST one cut by clipMiddle
  // rather than nothing, and say which row it is. Silence here is the whole finding.
  if (k === 0) return `…[every row exceeds the ${tailBudget}-char tail budget; ${s.length - 1} of ${s.length} rows dropped, the NEWEST kept and cut (rows_dropped=${s.length - 1})]…\n`
    + clipMiddle(JSON.stringify(s[s.length - 1], null, 1), n);
  const dropped = s.length - j - k;
  if (dropped <= 0) return whole;
  return (j ? JSON.stringify(s.slice(0, j), null, 1) : "")
    + `\n…[${dropped} of ${s.length} rows elided from the MIDDLE of this log — OLDEST ${j} + NEWEST ${k} kept WHOLE, never cut mid-row; the two blocks below are separate arrays, not one (rows_dropped=${dropped})]…\n`
    + JSON.stringify(s.slice(-k), null, 1);
}
const clip = (s, n = 14000) =>
  Array.isArray(s) ? clipRows(s, n) : clipMiddle(typeof s === "string" ? s : JSON.stringify(s, null, 1), n);

// THE COGNITIVE FINGERPRINT — every LLM call this brain makes is conditioned
// on the captain's MEASURED mind, not an assumed one: his own metaphor
// anchors (Ghar-ki-Boli), his wrong-prior shapes (the Decoy Map, machine-side
// — used to design, never shown pre-guess), his live calibration bias, his
// fluency map. Assembled deterministically; empty parts simply absent.
function buildFingerprint({ lexicon, grammar, calibration, ls, mined } = {}) {
  const parts = [];
  if (lexicon && Array.isArray(lexicon.anchors) && lexicon.anchors.length) {
    // scan-fix 15 Jul: the miner's raw n-grams shipped shredded fragments
    // ("one picture yeh diagram poore", "aristo eco ₹81 500") as "his
    // metaphors" in EVERY prompt. Filter: no digits/currency, must not be a
    // mid-phrase shard (drop entries wholly contained in a longer anchor).
    const clean = lexicon.anchors
      .map(a => String(a.phrase || "").trim())
      .filter(p => p.length >= 12 && !/[\d₹$%]/.test(p));
    const keep = clean.filter(p => !clean.some(q => q !== p && q.includes(p)));
    if (keep.length) parts.push(`HIS ANCHOR METAPHORS (reach for these FIRST; verbatim from his own Bolo): ${keep.slice(0, 6).map(p => `"${p}"`).join(" · ")}`);
  }
  // THE MINER FINALLY HAS AN ADDRESS (2 Aug 2026 audit, finding #5). `lexicon_mine`
  // writes brain_out/lexicon/<date>.md every night and NOTHING opened it — 560,786
  // tokens all-time into a file with no reader, on top of being 0-for-115 on the
  // validator (#61, fixed above). This is the seam it was always missing: the mined
  // anchors ride the fingerprint that conditions every other brain call.
  // SAFE BY CONSTRUCTION: the job is `validate: "quotes_only"`, so anything inside
  // quotes in that file is verbatim-present in lexicon.json — the miner cannot invent
  // a phrase into his own voice. The file's DATE is printed rather than thresholded:
  // an old mine is still one of his real phrases, and the reader can see its age
  // (the hippocampus/tone stale-safe pattern — degrade, never assert freshness).
  if (mined && Array.isArray(mined.anchors) && mined.anchors.length) {
    parts.push(`MINED ANCHORS (lexicon_mine, ${mined.date}; verbatim-validated against his lexicon): ${mined.anchors.slice(0, 4).map(p => `"${p}"`).join(" · ")}`);
  }
  if (grammar && grammar.shape_counts) {
    const top = Object.entries(grammar.shape_counts).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]).slice(0, 2);
    if (top.length) parts.push(`HIS WRONG-PRIOR SHAPES (machine-side — design probes around these, NEVER name them to him): ${top.map(([s, n]) => `${s}(${n})`).join(", ")}`);
  }
  // WIRING AUDIT, 11 Aug 2026 — THE DENOMINATOR THAT WAS DROPPED AT THIS DOOR.
  // This printed the bare scalar. On 10 Aug that made every Gaffer call today read
  // "overconfidence P(wrong|knew)=0" — a perfect-honesty verdict resting on THREE
  // knew-reps — while the trend beside it carried "21/40 reps". calibration.json
  // published buckets.knew.n right next to the rate and this reader walked past it.
  // The n now rides the sentence. SOURCE ORDER, most authoritative first: the
  // producer's own gate row (calibration.mjs buildGate, `overconfidence_rate`, which
  // carries the need too), else buckets.knew.n, else NOTHING IS GUESSED — the line
  // says the denominator is unavailable rather than implying the rate is solid. That
  // fallback is live today, not theoretical: the calibration.json on disk was written
  // before the gate row existed, and a stale file must degrade, never assert.
  // The null branch is new too. With zero knew reps the rate is null and this whole
  // line VANISHED — calibration's loudest field going silent with nothing naming the
  // silence, the exact #99 failure. It now says it is not yet measurable, with its 0/n.
  if (calibration && (typeof calibration.overconfidence_rate === "number" || calibration.buckets)) {
    const sub = calibration.gate && Array.isArray(calibration.gate.sub)
      ? calibration.gate.sub.find(s => s && s.name === "overconfidence_rate") : null;
    const n = sub && Number.isFinite(sub.have) ? sub.have
      : (calibration.buckets && calibration.buckets.knew && Number.isFinite(calibration.buckets.knew.n)
        ? calibration.buckets.knew.n : null);
    const denom = n === null ? "denominator unavailable — read this as UNMEASURED"
      : (sub && Number.isFinite(sub.need) ? `n=${n}/${sub.need} knew-reps` : `n=${n} knew-reps`);
    const provisional = sub && sub.open === false ? ", BELOW ITS OWN NEED — provisional" : "";
    const read = typeof calibration.overconfidence_rate === "number"
      ? `P(wrong|knew)=${calibration.overconfidence_rate} (${denom}${provisional})`
      : `P(wrong|knew) not yet measurable (${denom}${provisional})`;
    parts.push(`CALIBRATION: overconfidence ${read}; trend ${calibration.trend || "—"}.`);
  }
  if (ls && ls.weak_connection) parts.push(`THE FRAYING PASS: ${ls.weak_connection}.`);
  // WHERE HE IS STANDING RIGHT NOW (added 1 Aug 2026). The forge pacer was an island:
  // it alone knew the concept and the step, so every OTHER surface — the Gaffer most of
  // all, holding thirty state files — had to ask him what he was in the middle of. The
  // position now rides learning_state.json; this is the consumer that turns it into a
  // sentence. Deliberately POSITION ONLY, never content: the pacer knows which axes were
  // graded, and that is a FACT. What was taught is his Bolo's to say, at LOCK, in his
  // words (FORGE_SPEC §2.5) — a fingerprint that summarised his understanding would be
  // this machine inventing his mind back at him.
  if (ls && ls.position && ls.position.session_open && ls.position.concept) {
    const p = ls.position;
    // `stale` is a frozen judgement (learning_state stamps stale_as_of for exactly this
    // reason) — recompute from started_at so a session that died overnight is not
    // announced as live.
    const t0 = Date.parse(p.started_at || "");
    const dead = p.stale || (Number.isFinite(t0) && (Date.now() - t0) / 3600000 > 18);
    if (!dead) parts.push(
      `MID-CONCEPT RIGHT NOW: ${p.concept}, step ${p.step}/11 ${p.step_name || ""}`.trim()
      + ` — axes closed ${(p.axes_done || []).join("") || "none"}, left ${(p.axes_left || []).join("") || "none"}`
      + ((p.axes_ungraded || []).length ? `, UNGRADED ${p.axes_ungraded.join("")}` : "")
      + ". Do not re-teach a closed axis; do not claim an ungraded one is held.");
  }
  // WHAT HE FINISHED LAST (2 Aug 2026 audit, finding #29). learning_state computes
  // `position.last_closed` DELIBERATELY independently of whether a session is open
  // (learning_state.mjs:235-247) — "what did he finish last" and "what is he on now"
  // are two different questions — and it had ZERO consumers anywhere in the repo,
  // because the branch above drops the entire position block the moment a session is
  // absent or stale. Which is exactly when this is the only thing left to say.
  // Position only, never content — same law as the branch above: the pacer knows which
  // axes were graded, and that is a FACT; what was taught is his Bolo's to say.
  const lc = ls && ls.position && ls.position.last_closed;
  if (lc && lc.concept) {
    const done = (lc.axes_done || []).join("") || "none";
    const untouched = (lc.axes_untouched || []).join("") || "none";
    const missed = (lc.steps_missed || []).length;
    // HOW IT RAN, not just how far (wiring audit, 10 Aug 2026). forge_session's
    // coverage() stamps two clocks that cannot be typed by hand — total elapsed and
    // the span across the axis marks — plus the quiz-dump refusal count and the CORE
    // axis it never closed. All four were durable in every forge_sessions.jsonl row
    // and read by no organ anywhere; learning_state now carries them across the bus,
    // and this is the surface. REPORTED, NEVER JUDGED: the producer refuses to
    // threshold them (forge_session.mjs:388) because no calibrated body of closed
    // sessions exists to derive a fair cutoff from, so the numbers are stated and the
    // reading is left to whoever is looking. null means NOT RECORDED (a row written
    // before the fields existed) and prints nothing — never a fabricated zero.
    const pace = [];
    if (typeof lc.elapsed_min === "number") pace.push(`${lc.elapsed_min} min elapsed`);
    if (typeof lc.axis_marks_span_min === "number") pace.push(`axis marks spread over ${lc.axis_marks_span_min} min`);
    parts.push(
      `LAST CLOSED SESSION: ${lc.concept}${lc.ended_at ? ` (ended ${String(lc.ended_at).slice(0, 10)})` : ""}`
      + ` — axes closed ${done}, untouched ${untouched}`
      + ((lc.axes_deferred || []).length ? `, deferred ${lc.axes_deferred.join("")}` : "")
      + `; ${(lc.steps_ran || []).length}/${(lc.steps_ran || []).length + missed} steps ran.`
      + (pace.length ? ` PACE (reported, not a verdict): ${pace.join(", ")}.` : "")
      + (lc.check_q_refused ? ` ${lc.check_q_refused} check-question(s) REFUSED as quiz-dump.` : "")
      + ((lc.core_missing || []).length ? ` CORE axis ${lc.core_missing.join("")} was never closed — canon forbids deferring it, so that lap owes it.` : "")
      + " That is where the last lap actually stopped — pick up from it, do not assume the concept is finished.");
  }
  parts.push("FIXED TRAITS: ADHD-PI, ~4 working-memory slots, visual-first, Hinglish welds, walls of text = shutdown, finance-ops instincts (Zomato/Blinkit) — teach through business impact.");
  return parts.length ? "THE CAPTAIN'S COGNITIVE FINGERPRINT (measured, not assumed):\n" + parts.map(p => "  · " + p).join("\n") : "";
}
// finding #5's reader: the newest brain_out/lexicon/<date>.md, with its quoted spans
// extracted. Quotes are paired SEQUENTIALLY (never /"([^"]{12,})"/ — that is the exact
// desync #61 was about) and the ≥12-char floor is applied after pairing, matching
// validators.quotesOnly so what the fingerprint shows is what the validator accepted.
function minedAnchors(dir = join(OUT_DIR, "lexicon")) {
  try {
    const files = readdirSync(dir).filter(f => /^\d{4}-\d{2}-\d{2}\.md$/.test(f)).sort();
    if (!files.length) return null;
    const newest = files[files.length - 1];
    const parts = readFileSync(join(dir, newest), "utf8").split('"');
    const raw = [];
    for (let i = 1; i < parts.length; i += 2) {
      const seg = parts[i].trim();
      // same two filters the deterministic anchor path above already applies (scan-fix
      // 15 Jul): no digits/currency, and drop any span wholly contained in a longer one,
      // so a mid-phrase shard can never ride into the prompt as "his metaphor".
      if (seg.length >= 12 && !/[\d₹$%]/.test(seg) && !raw.includes(seg)) raw.push(seg);
    }
    const anchors = raw.filter(p => !raw.some(q => q !== p && q.includes(p)));
    return anchors.length ? { date: newest.replace(/\.md$/, ""), anchors } : null;
  } catch (e) { swallow("minedAnchors: readdirSync(dir) unreadable → null", e); return null; }
}
function gatherFingerprint() {
  return buildFingerprint({
    lexicon: readJson(join(STATE_DIR, "lexicon.json")),
    grammar: readJson(join(STATE_DIR, "doubt_grammar.json")),
    calibration: readJson(join(STATE_DIR, "calibration.json")),
    ls: readJson(join(STATE_DIR, "learning_state.json")),
    mined: minedAnchors(),
  });
}

function buildAnalysisPrompt(job, inputs, fingerprint = gatherFingerprint(), banned = DEFAULTS.guards.banned_phrases) {
  // THE PROMPT MUST NAME THE SAME LAW THE VALIDATOR ENFORCES (finding #62). This line
  // used to order every job never to write "10x/exponential" — including the machine-side
  // mining jobs whose whole subject is transformers, where softmax IS an exponential.
  // "exponential" is no longer banned anywhere; the hype list is now named from the live
  // config so the instruction can never drift from the guard again, and a job that has
  // opted out of the guard is not told a rule it is not held to.
  const hype = hypeGuardOn(job)
    ? ` honest frame only (compounding, never ${(banned || []).map(b => `"${b}"`).join("/")});`
    : " honest frame only (this is machine-side analysis — subject vocabulary is not hype, but do not sell);";
  // THE PROMPT MUST NAME THE SAME LAW THE VALIDATOR ENFORCES (finding #62's rule,
  // applied to the OTHER validator — 7 Aug 2026 audit). After the #61 pairing fix,
  // lexicon_mine STILL failed every run (457h stale, reconcile's bleed) for a reason
  // the prompt never told the model about: quotesOnly's haystack is the ## INPUT
  // sections alone, but the model also sees this head — where the fingerprint prints
  // his anchors IN QUOTES as style and the laws carry quotable doctrine. Observed
  // rejects: "hallucinations" (the fingerprint's position line), "proposes code
  // validates human approves" (doctrine), and a real anchor with a comma tucked
  // inside the closing quote. The law was enforced but never named.
  const quoteLaw = job.validate === "quotes_only"
    ? `\nQUOTE LAW (enforced mechanically, reject on breach): every "quoted span" of 12+ characters in your reply must be copied BYTE-FOR-BYTE from the ## INPUT sections below. Never quote this instruction block or anything above the inputs; punctuation you add stays OUTSIDE the quotes; one verbatim phrase per pair of quotes, never a stitched sentence.`
    : "";
  const head = `You are an organ of ARSENAL AI FC — the captain's exocortex. Job: ${job.id}. ${job._note || ""}
LAWS:${hype} no calendar pressure; no shame; self-scout register; every number must come from the data below; if the data is thin say so plainly. Output: concise markdown, ≤ 25 lines.${quoteLaw}
${fingerprint}`;
  const body = Object.entries(inputs).map(([k, v]) => `\n## INPUT ${k}\n${clip(v)}`).join("\n");
  return head + body;
}

// dateStr (E2E audit 25 Jul 2026): the TODAY token used to expand to the CALENDAR
// date always. shiftDay fixed the RE-run after midnight, but a FIRST run after
// midnight still gathered the fresh, empty new day: dugout_digest at 23:40 writes
// the 12th, the tick breaks on budget, and day_cartridge at 00:30 reads
// brain_out/.../<the 13th>.md → null, and thinks the captain did nothing all day.
// One shift, one date — the caller passes the shift day for overnight jobs.
function gatherInputs(job, now = new Date(), dateStr = null) {
  return gatherInputsAudited(job, now, dateStr).inputs;
}

// ---------------------------------------------------------------------------
// THE SILENT-NULL PROBLEM (2 Aug 2026 audit, finding #64)
// ---------------------------------------------------------------------------
// gatherInputs mapped a missing path to null with NO warning, and
// buildAnalysisPrompt then rendered the literal string `null` under a heading that
// says `## INPUT season.json`. Measured: EIGHT enabled jobs declare inputs that do
// not exist, seven of them run — teamtalk_am has produced the morning team talk 85
// times at 3-of-4 inputs absent, billing ~45k tokens and reporting ok:true every run.
//
// THE TRAP (recorded in ORGANISM_ISSUES.md): do NOT use a majority-ratio guard. It
// misses deep_reanalysis at exactly 50% — the job the finding was written about — and
// it KILLS teamtalk_am at 75%, a daily ritual that currently degrades gracefully
// (its 1 Aug output literally says "season aur match record se koi naya signal nahi
// aaya, toh us par kuch bolne ka nahi"). A ratio cannot tell a load-bearing absence
// from a tolerable one; only the config can.
//
// So: a PER-INPUT `required` flag, plus the absent count recorded on the ledger row so
// the spend on nulls is finally visible. An input may be a plain string (optional, the
// old shape, unchanged) or {"path": "...", "required": true}.
function normalizeInputs(job) {
  return (job.inputs || []).map(raw =>
    (raw && typeof raw === "object")
      ? { path: String(raw.path || ""), required: raw.required === true }
      : { path: String(raw), required: false });
}
function gatherInputsAudited(job, now = new Date(), dateStr = null) {
  const inputs = {};
  const day = dateStr || dayKey(now);
  const absent = [], required_absent = [], door = [];
  for (const decl of normalizeInputs(job)) {
    const name = decl.path.replace(/TODAY/g, day);   // date-tokened paths (e.g. dugout transcripts)
    // TOTAL RESOLVER (12 Aug 2026, E1's true final cause). Declared paths are
    // STATE_DIR-relative — but on Windows, path.relative() across DRIVES cannot
    // produce a relative path and returns the absolute target instead, which
    // join(STATE_DIR, ...) then mangles into garbage. That is exactly what the
    // hermetic selftest fixtures do on the CI runner (workspace D:\a\..., temp
    // C:\Users\runneradmin\...), so six DOUBLE-CUT/DOOR3 assertions failed on
    // every runner and passed on every one-drive home machine — unreproducible
    // until temp was subst-ed onto its own drive. No live config declares an
    // absolute input; honoring one when it arrives makes the resolver total.
    const p = isAbsolute(name) ? name : join(STATE_DIR, name);
    const there = existsSync(p);
    // TAIL READ (audit #51): three jobs list presence_log.jsonl, which is unbounded and
    // rolls monthly. Only the last 200 rows were ever used; now only those are read, and
    // a rolled file resolves through its archives instead of reading as empty.
    //
    // …AND THE CUT IS COUNTED (11 Aug 2026, TRUNCATED_AT_DOOR pass 3 — see liveRowCount).
    // The tail width was silent: nothing recorded that 25 of teaching_audit's 225 rows
    // never left disk, so every count downstream was the clipper's alone. Now the
    // shortfall against the LIVE file rides two lanes at once —
    //   · the HEADING, so the model is not told a 225-row log is a 200-row log (the
    //     clip marker says "N of 200 rows", which is a true sentence about the array
    //     it was handed and a false one about the file). Decorating the key reaches
    //     all six prompt builders, none of which key off input names — the same
    //     no-plumbing seam the clipper's own tag uses;
    //   · the returned `door` list, which is what the LEDGER row and the note carry.
    // Counted against the LIVE file only: when the tail falls back to ARCHIVES the
    // live file is shorter than n, nothing was dropped from it, and older months are
    // history the reader never asked for — not a cut. Unreadable (null) drops nothing.
    if (name.endsWith(".jsonl")) {
      const rows = readLinesTail(p, DOOR_TAIL_ROWS);
      const onDisk = there ? liveRowCount(p) : null;
      const dropped = (typeof onDisk === "number" && onDisk > rows.length) ? onDisk - rows.length : 0;
      if (dropped > 0) {
        door.push({ name, read: rows.length, on_disk: onDisk, dropped });
        // TAG NAME IS LOAD-BEARING: runJob counts the clipper off the prompt with
        // /rows_dropped=(\d+)/, so a door tag containing that substring would be
        // double-counted as a clip. `door_rows_unread` cannot collide, and it is the
        // truer word — these rows were never read, not read-then-elided.
        inputs[`${name} (DOOR TAIL — newest ${rows.length} of ${onDisk} rows in this file were read; the ${dropped} OLDER row(s) never left disk, so this is NOT the whole log: door_rows_unread=${dropped})`] = rows;
      } else inputs[name] = rows;
    }
    // WHOLE FILE (10 Aug 2026, the double-cut repair — see clip()). This line used to
    // end `.slice(-20000)`: a SECOND, unnamed budget that dropped the head of every
    // transcript before clip's own named budget then dropped the tail. It is deleted,
    // not widened — a .md input is now bounded in exactly ONE place, by the clipper
    // that says so in the prompt. JSON inputs were always read whole; .md now matches.
    else if (name.endsWith(".md") || name.endsWith(".html")) inputs[name] = there ? readFileSync(p, "utf8") : null;
    else inputs[name] = readJson(p);
    // "absent" is about the FILE, not about emptiness — an empty log is a measured zero
    // and must never be reported as a missing input (that is the honesty law running
    // the other way).
    if (!there) { absent.push(name); if (decl.required) required_absent.push(name); }
  }
  const declared = Object.keys(inputs).length;
  // door_dropped is a SUM of measured shortfalls, not a ratio and not a verdict — the
  // #64 TRAP (no majority guard) still stands, and nothing here blocks a job.
  return { inputs, declared, absent, required_absent, present: declared - absent.length,
    door, door_dropped: door.reduce((a, d) => a + d.dropped, 0) };
}

// ---------------------------------------------------------------------------
// #64, THE READ BACK (10 Aug 2026 wiring pass — a producer with no consumer)
// ---------------------------------------------------------------------------
// #64 put inputs_present / inputs_declared / inputs_absent / inputs_absent_names on
// every ledger row because "85 teamtalk_am runs billed full price on 3-of-4 absent,
// with nothing anywhere recording it". The RECORDING landed and the READING never
// did: a live grep for those four names outside this file returned zero hits, and
// `brain status` re-derived presence from TODAY's disk (gatherInputsAudited) without
// ever opening the history. So #64's own question — "how many nights has this job
// billed on absent evidence" — was being written down every run and no organ could
// answer it. This is the answer, and it is the ledger's, not a fresh stat().
//
// TWO HONESTY LANES, because a bare "unaccounted" would lie in both directions:
//   · `unaccounted` = rows with NO inputs_declared key at all — everything written
//     before #64 shipped, plus the other appenders on this shared lane (talk,
//     nightshift, cortex, agenda:skip). Never folded into a denominator.
//   · `no_inputs` = rows whose key is present and null — the manager_m3 class, a
//     job that DECLARES no inputs. Nothing can be absent, so it is not a gap.
// No threshold, no ratio (the #64 TRAP above still stands), no sort by anything but
// the count the ledger itself carries. Nights are HIS local days (localDayOf).
export function absentEvidenceHistory(ledger) {
  const jobs = new Map();
  let unaccounted = 0, noInputs = 0, accounted = 0;
  for (const r of (ledger || [])) {
    if (!r || !("inputs_declared" in r)) { unaccounted++; continue; }
    if (typeof r.inputs_declared !== "number") { noInputs++; continue; }
    accounted++;
    const id = r.job || "?";
    if (!jobs.has(id)) jobs.set(id, { runs: 0, runs_absent: 0, nights: new Set(), last: null, names: {} });
    const j = jobs.get(id);
    j.runs++;
    if (!(typeof r.inputs_absent === "number" && r.inputs_absent > 0)) continue;
    j.runs_absent++;
    const day = localDayOf(r.ts);
    j.nights.add(day);
    if (!j.last || day > j.last) j.last = day;
    for (const n of (r.inputs_absent_names || [])) j.names[n] = (j.names[n] || 0) + 1;
  }
  const gaps = [...jobs.entries()]
    .filter(([, j]) => j.runs_absent > 0)
    .map(([job, j]) => ({ job, runs: j.runs, runs_absent: j.runs_absent, nights: j.nights.size,
      last_absent_day: j.last,
      absent_names: Object.entries(j.names).sort((a, b) => b[1] - a[1]).map(([n, c]) => `${n}×${c}`) }))
    .sort((a, b) => b.runs_absent - a.runs_absent);
  return { accounted, unaccounted, no_inputs: noInputs, jobs: gaps };
}

// ---------------------------------------------------------------------------
// THE SAME READ BACK, FOR THE CUT (11 Aug 2026 wiring pass)
// ---------------------------------------------------------------------------
// absentEvidenceHistory answers "which job billed on a MISSING file". The clip pair
// — inputs_clipped / inputs_rows_dropped — was added the SAME day (10 Aug, the
// elision accounting in runJob) to answer the other half: "which job billed on a
// file that was THERE and arrived half-eaten". The stamping landed and the reading
// never did, exactly as #64's own pair had gone unread for eight days. A grep on
// 11 Aug for both names across scripts/ .claude/ hooks/ returned five hits and every
// one of them is a WRITE inside this file — including brain's own history read, ten
// lines up, which was built for this question and only ever asked half of it.
// The damage is not theoretical: a live run this session had night_coach report
// "183 log rows never reached the model". That sentence went to the note, the note
// went to the row, and stdout on this lane goes into a window hidden_run.vbs hides —
// so nothing could be asked how many nights a job has been reasoning on a stump.
//
// A SIBLING, deliberately, not a widening of the function above. Absence is about
// the FILE and elision is about the BUDGET; both can be true on one run and they
// fail in opposite directions. Folded into one `jobs` list, a 4/4-present-but-gutted
// run would be indistinguishable from a 1/4-absent one — the exact blur runJob's own
// note line refuses by printing them as two separate clauses.
//
// Same two honesty lanes as #64, for the same reason — a bare "unaccounted" lies
// both ways:
//   · `unaccounted` = rows with NO inputs_clipped key at all: every row written
//     before the pair shipped (4,693 of them on his live ledger the day this was
//     written — the tick has not run since), plus the other appenders on this shared
//     lane (talk, nightshift, cortex, dmn_counter). Never folded into a denominator.
//   · `never_clipped` = key present and null: the run WAS measured and nothing was
//     cut. That one is a real measured zero, and it is the good outcome.
// No threshold, no ratio, no sort by anything but the count the ledger carries
// (the #64 TRAP still stands). `worst_run` is a max of numbers already on the rows,
// not a budget opinion. Nights are HIS local days (localDayOf), same as above.
// THE THIRD LANE (11 Aug 2026, TRUNCATED_AT_DOOR pass 3): this read was built for the
// clipper alone, so a run whose loss happened UPSTREAM of the clipper — the door's
// 200-row tail — landed in `never_clipped` and was reported as "read their inputs
// WHOLE". That is the same class of lie the function was written to end, one cut
// earlier. A run now enters `jobs` if EITHER cut ate rows, `never_clipped` means both
// lanes measured zero, and `door_unmeasured` counts the rows written in the 10–11 Aug
// window where the clipper was measured and the door was not — never folded into a
// denominator, same rule as `unaccounted`.
export function clippedEvidenceHistory(ledger) {
  const jobs = new Map();
  let unaccounted = 0, neverClipped = 0, accounted = 0, doorUnmeasured = 0;
  for (const r of (ledger || [])) {
    if (!r || !("inputs_clipped" in r)) { unaccounted++; continue; }
    accounted++;
    if (!("inputs_rows_door_dropped" in r)) doorUnmeasured++;
    const clipped = typeof r.inputs_clipped === "number" && r.inputs_clipped > 0 ? r.inputs_clipped : 0;
    const doorDropped = typeof r.inputs_rows_door_dropped === "number" && r.inputs_rows_door_dropped > 0 ? r.inputs_rows_door_dropped : 0;
    if (!clipped && !doorDropped) { neverClipped++; continue; }
    const id = r.job || "?";
    if (!jobs.has(id)) jobs.set(id, { runs_clipped: 0, inputs_clipped: 0, rows_dropped: 0, door_dropped: 0, worst: 0, nights: new Set(), last: null });
    const j = jobs.get(id);
    j.runs_clipped++;
    j.inputs_clipped += clipped;
    const dropped = typeof r.inputs_rows_dropped === "number" ? r.inputs_rows_dropped : 0;
    j.rows_dropped += dropped;
    j.door_dropped += doorDropped;
    // `worst` is the worst SINGLE RUN, and a run's loss is both its cuts — the number
    // that answers "how much of the log did this job actually never see that night".
    if (dropped + doorDropped > j.worst) j.worst = dropped + doorDropped;
    const day = localDayOf(r.ts);
    j.nights.add(day);
    if (!j.last || day > j.last) j.last = day;
  }
  // `runs` is counted in a second pass over the SAME accounted rows so a job that has
  // clipped once in fifty runs reads as 1/50, not 1/1 — the denominator has to include
  // the clean runs or the ratio he'd read off it would be a lie by omission.
  const runsBy = new Map();
  for (const r of (ledger || [])) {
    if (!r || !("inputs_clipped" in r)) continue;
    const id = r.job || "?";
    runsBy.set(id, (runsBy.get(id) || 0) + 1);
  }
  const cut = [...jobs.entries()]
    // rows_unseen is the SUM of the two cuts — the only figure that answers the
    // question the note used to answer wrongly. rows_dropped keeps its old meaning
    // (the clipper's), so a reader comparing to a pre-11-Aug row is not misled.
    .map(([job, j]) => ({ job, runs: runsBy.get(job) || j.runs_clipped, runs_clipped: j.runs_clipped,
      inputs_clipped: j.inputs_clipped, rows_dropped: j.rows_dropped, door_dropped: j.door_dropped,
      rows_unseen: j.rows_dropped + j.door_dropped, worst_run: j.worst,
      nights: j.nights.size, last_clipped_day: j.last }))
    .sort((a, b) => b.rows_unseen - a.rows_unseen);
  return { accounted, unaccounted, never_clipped: neverClipped, door_unmeasured: doorUnmeasured, jobs: cut };
}

// ---------------------------------------------------------------------------
// SURFACES — every job declares where its output APPEARS (audit finding #63)
// ---------------------------------------------------------------------------
// Eight-to-ten brain jobs wrote into brain_out dirs no line of code opens: 2,865,782
// tokens all-time, ~3.27M of one 8.25M week. midday_reread alone ate 560,465 of an
// 800,000-token window for a file with no reader, while formation_read — the sheet,
// priority 100 — got 103,010 all week.
//
// The organism's own constraint (ORGANISM_ISSUES.md, constraint 3) is: "Never delete
// an organ because nobody reads its output. Give it an ADDRESS." Four of these jobs
// are DESIGNED to be human-read and say so verbatim in their config notes
// (doubt_clusters, widget_spec, market_scan, drill_forge) — wiring a code consumer is
// the wrong seam for those. Their real defect is that NO SURFACE EVER POINTED AT THE
// FILE: runJob's `→ brain_out/<out>/<date>.md` note is the only pointer that has ever
// existed, and stdout goes to a hidden window. So the address is made real here — the
// note names the surface, the LEDGER ROW carries the note, and `brain status` prints
// the human-read files by path so a batch-glance is one command away.
//
// DELIBERATELY NOT A HARD GATE. A job with no surface is reported, loudly, with a
// have/need counter — it is not blocked. The safe direction in this runtime is
// RUNNING (the same reasoning as `paused === true`): a missing config key must never
// be able to silence an organ. What gets disabled is disabled EXPLICITLY, in config,
// with a comment naming what would bring it back.
const SURFACE_KINDS = new Set(["code", "job_input", "human_file", "media", "sheet", "none"]);
function jobSurface(job) {
  const s = job && job.surface;
  if (!s || typeof s !== "object" || !SURFACE_KINDS.has(s.kind)) {
    return { declared: false, kind: "none", where: null };
  }
  return { declared: true, kind: s.kind, where: s.where || null };
}
// the have/need counter (#106): never the bare word "ok".
function surfaceAudit(cfg) {
  const jobs = (cfg.jobs || []).filter(j => j.enabled !== false);
  const addressed = jobs.filter(j => { const s = jobSurface(j); return s.declared && s.kind !== "none"; });
  const orphans = jobs.filter(j => { const s = jobSurface(j); return !s.declared || s.kind === "none"; }).map(j => j.id);
  const human = jobs.filter(j => jobSurface(j).kind === "human_file");
  return { have: addressed.length, need: jobs.length, orphans, human };
}

// ---------------------------------------------------------------------------
// THE NIGHT COACH (P2 unleash, 9 Aug 2026 — his verbatim "yes lets build p1 p2
// p3 p7 to the peak of its powers and make sure data flows everywhere wherever
// it is required"). A nightly Opus read of the study day WHOLE — his turns, the
// coach's answers, the gut-words, the audit rows — that writes tomorrow's
// misconception map + pre-written lesson. The regex doubtminer catches shapes;
// this catches MEANING. It rides the SHARED analysis path (exec → validate →
// write → acct), never a manager_m3-style early return.
// ---------------------------------------------------------------------------
// The day's teaching lanes, DAY-FILTERED and roll-safe. The default .jsonl
// input read is a blind last-200-rows tail (neither "today" nor a stable span
// on a 4,500-row bus), so the night coach gathers its own: readLinesTail
// survives the monthly roll via archiveSiblings, the filter is the study day
// (shift day) in LOCAL time, and only the four teaching lanes ride. Counts are
// reported beside the sample so a trimmed day never reads as a complete one.
//
// FROZEN VERBATIM (LAYERING law) — the gatherer that shipped from the P2 unleash
// (9 Aug 2026) until 11 Aug 2026. Kept in the file as the regression witness for
// THE UNNAMED TURN CUT below: it is scrupulous about the ROW trim it performs
// (turns_total / turns_shown / note) and then beheads every individual turn at
// 600 characters with no marker, no count and no field naming the loss. Nothing
// on the live path may call it.
function nightCoachAfferentsLegacy(dayStr, dir = STATE_DIR) {
  const LANES = new Set(["claude-code", "claude-code-teaching", "gemini-study", "gemini-study-teaching", "dugout-gaffer-teaching"]);
  let rows = [];
  try {
    rows = readLinesTail(join(dir, "afferent.jsonl"), 4000)
      .filter(a => a && a.text && (LANES.has(a.source) || (a.modality === "voice" && !a.source)))
      .filter(a => { const t = new Date(a.ts || 0); return !isNaN(t.getTime()) && localDate(t) === dayStr; })
      .map(a => ({ t: String(a.ts).slice(11, 16), who: a.source || "voice(him)", text: String(a.text).slice(0, 600) }));
  } catch (e) { swallow("nightCoachAfferentsLegacy: readLinesTail(join(dir, \"afferent.jsonl\")) unreadable → ignored", e); }
  const kept = rows.slice(-120);
  return {
    study_day: dayStr, turns_total: rows.length, turns_shown: kept.length,
    note: rows.length > kept.length ? "older turns trimmed — turns_total is the truth, the tail is the sample" : "the complete day",
    turns: kept,
  };
}

// ---------------------------------------------------------------------------
// THE UNNAMED TURN CUT (11 Aug 2026 wiring audit — TRUNCATED_AT_DOOR)
// ---------------------------------------------------------------------------
// The third instance of one shape, after the Gaffer's 220-char weld cut
// (dugout.mjs capsuleProjectionLegacy) and the .md double cut (clipLegacy above):
// a door that reports the trim it is proud of and hides the one it is not.
// MEASURED on the live bus the hour this was written, study day 2026-08-11:
// 6 of 14 night-coach-lane rows ran past 600 chars, 9,848 characters were dropped
// with nothing naming them, and his longest turn (3,904 ch) reached the model as
// its first 600 — 3,304 characters of his own words gone, the row still presented
// as a whole turn.
// WHY IT MATTERS HERE SPECIFICALLY: step 1 of buildNightCoachPrompt orders "ONE
// VERBATIM quote of his own words as evidence". The coach was ordered to quote
// evidence it could not see, out of turns nothing told it were partial — and long
// turns are the CONFUSED ones. A misconception that surfaces in the last paragraph
// of a 3,900-char turn did not exist as far as the night coach knew, so tomorrow's
// pre-written lesson was built on the openings of his hardest thinking.
//
// THE REPAIR IS THE ONE THIS FILE ALREADY RULED ON, NOT A BIGGER BUDGET. The
// per-turn budget stays 600: it is the number already in the file, and his
// no-guessed-numbers rule forbids swapping it for a nicer one. What changes is
// that the cut now rides clipMiddle — head 300 + tail 300, DERIVED from the 600
// (never chosen), with the marker stating the measured elided count. Both ends of
// a turn survive, which is where a turn carries its intent: his question lands at
// the END. The object then counts what it cut (turns_cut / chars_elided) so a
// mutilated day can never read as a complete one — the same honesty the row trim
// has had since day one — and the prompt is told what a marked turn means.
function nightCoachAfferents(dayStr, dir = STATE_DIR) {
  // LADDER F10 (9 Aug 2026): the coach HEARS THE VOICE. The filter carried only
  // the four typed/gemini lanes, so his SPOKEN confusion never reached the
  // misconception map. Voice rows carry no `source` at all (thalamus_config
  // _self_sources_doc #1: a voice modality IS his provenance), so modality
  // "voice" with no source = him; `dugout-gaffer-teaching` (F4) is the coach's
  // spoken half, deny-listed as self but exactly the teaching evidence this
  // reader wants.
  const LANES = new Set(["claude-code", "claude-code-teaching", "gemini-study", "gemini-study-teaching", "dugout-gaffer-teaching"]);
  const TURN_BUDGET = 600;   // carried over unchanged from the frozen gatherer — spend does not move
  let rows = [];
  try {
    rows = readLinesTail(join(dir, "afferent.jsonl"), 4000)
      .filter(a => a && a.text && (LANES.has(a.source) || (a.modality === "voice" && !a.source)))
      .filter(a => { const t = new Date(a.ts || 0); return !isNaN(t.getTime()) && localDate(t) === dayStr; })
      .map(a => {
        const full = String(a.text);
        const row = { t: String(a.ts).slice(11, 16), who: a.source || "voice(him)", text: clipMiddle(full, TURN_BUDGET) };
        // the per-row receipt: a partial turn SAYS it is partial and how long the
        // real one was, so the reader can weigh the evidence instead of assuming it.
        if (full.length > TURN_BUDGET) { row.partial = true; row.chars = full.length; }
        return row;
      });
  } catch (e) { swallow("nightCoachAfferents: readLinesTail(join(dir, \"afferent.jsonl\")) unreadable → ignored", e); }
  const kept = rows.slice(-120);
  // counted over the SAMPLE that actually ships, not over the day: turns dropped by
  // the row trim were never shown, and turns_total already names that loss.
  const cut = kept.filter(r => r.partial).length;
  const elided = kept.reduce((s, r) => s + (r.partial ? r.chars - TURN_BUDGET : 0), 0);
  const trimNote = rows.length > kept.length ? "older turns trimmed — turns_total is the truth, the tail is the sample" : "the complete day";
  const cutNote = cut
    ? `${cut} of ${kept.length} turns shown are PARTIAL (partial:true, chars = the real length): ${elided} chars elided from their MIDDLES, both ends kept — never quote ACROSS a marker`
    : "every turn shown WHOLE";
  return {
    study_day: dayStr, turns_total: rows.length, turns_shown: kept.length,
    turns_cut: cut, chars_elided: elided,
    note: `${trimNote}; ${cutNote}`,
    turns: kept,
  };
}

function buildNightCoachPrompt(job, inputs, fingerprint = gatherFingerprint(), banned = DEFAULTS.guards.banned_phrases) {
  const head = `You are THE NIGHT COACH of ARSENAL AI FC — the slow brain reading one study day whole, so tomorrow's teaching starts where today's confusion actually was.
${fingerprint ? "\n" + fingerprint + "\n" : ""}
THE DAY'S EVIDENCE is in the INPUT sections below: his own turns and the coach's answers (the claude-code and gemini lanes), his reps with gut-words (confidence ∈ knew|shaky|guessed, committed BEFORE the answer — never re-graded), and the teaching-audit rows (drift against THE METHOD).

DO, IN ORDER:
1. THE MISCONCEPTION MAP — every place he holds a wrong or half-formed model TODAY. For each: the concept, ONE VERBATIM quote of his own words as evidence (quote him exactly, never paraphrase him), what he currently thinks, what is actually true. A day with none is a finding, not a failure — say so plainly.
2. TOMORROW'S LESSON for the single most load-bearing misconception: 2-3 SAMJHAO passes (Hinglish, ONE idea per pass, everyday-physical analogies only — khana/ghar/dukaan/sheher, never geometry), up to 3 widget guess-gate questions, and EXACTLY ONE check-question (the four-question-moments law: one, never a quiz-dump).
3. END the reply with EXACTLY ONE fenced \`\`\`json block, nothing after it:
{"date": "<the morning this teaches>", "study_day": "<the day read>", "misconceptions": [{"concept": "...", "evidence": "<his verbatim words>", "what_he_thinks": "...", "whats_true": "..."}], "lesson": {"concept": "...", "samjhao_passes": ["..."], "widget_gates": ["..."], "check_question": "..."}}

LAWS: Hinglish body, technical words stay English. Evidence only — every claim traceable to the inputs; a thin day = say less, never invent. No dates, deadlines or countdowns in any teaching line. NEVER these phrases: ${(banned || []).join(", ")}. ≤ 80 lines before the json block.
PARTIAL TURNS (11 Aug 2026 — the prompt must name what the door does to the evidence): a turn marked \`partial: true\` carries a \`…[N chars elided from the MIDDLE …]…\` marker inside its text. Its opening and its close are his real words; the middle is GONE. Quote from ONE intact side only — a quote stitched across the marker is not verbatim, it is invented. If the evidence a misconception needs sits inside an elision, say the evidence is truncated and name the turn's time; never reconstruct it.`;
  const body = Object.entries(inputs || {}).map(([k, v]) => `\n## INPUT ${k}\n${clip(v)}`).join("\n");
  return head + body;
}

// the machine-face sibling is DERIVED from the same single call — the trailing
// fenced json block, parsed after the validator has passed. A miss returns null
// and the run degrades to note-only: a throw here would kill the whole
// overnight drain (tick has no per-job try/catch).
export function parseNightCoachJson(text) {
  try {
    const m = [...String(text || "").matchAll(/```json\s*\n([\s\S]*?)```/gi)];
    if (!m.length) return null;
    const j = JSON.parse(m[m.length - 1][1]);
    if (!j || typeof j !== "object" || !Array.isArray(j.misconceptions)) return null;
    return j;
  } catch { return null; }
}

// ---------------------------------------------------------------------------
// PHASE H · H2 AGENDA + H6 DIARY (10 Aug 2026, his "let's build everything")
// ---------------------------------------------------------------------------
const lastJsonBlock = (text) => {
  try {
    const m = [...String(text || "").matchAll(/```json\s*\n([\s\S]*?)```/gi)];
    return m.length ? JSON.parse(m[m.length - 1][1]) : null;
  } catch { return null; }
};

// H2 — the agenda's machine sibling, SANITIZED at parse time (allocates only,
// never invents): keys must be ENABLED jobs in the OVERNIGHT window (any other
// window's shiftDay never resolves tonight's file — a non-overnight allocation
// is a dead letter, refuter-proven, so it is dropped HERE and recorded), the
// agenda cannot allocate itself, NEVER_SKIP lanes (night_coach — tomorrow's
// lesson — and diary — the night's own record) demote skip→lean, and depth is
// {lean, skip} ONLY: "deep" is a NO-OP overnight (maxThinkingFor already gives
// every non-study phase the 48k ceiling — G4), so it is dropped, never obeyed.
export function parseAgendaJson(text, cfg) {
  const j = lastJsonBlock(text);
  if (!j || typeof j !== "object" || !j.allocations || typeof j.allocations !== "object") return null;
  const NEVER_SKIP = new Set(["night_coach", "diary"]);
  const legal = new Map(((cfg && cfg.jobs) || [])
    .filter((x) => x.enabled !== false && x.window === "overnight" && x.kind !== "agenda")
    .map((x) => [x.id, x]));
  const allocations = {}; const dropped = [];
  for (const [id, a] of Object.entries(j.allocations)) {
    const depth = a && typeof a === "object" ? String(a.depth || "") : String(a || "");
    const why = (a && typeof a === "object" && a.why) ? String(a.why).slice(0, 200) : "";
    if (!legal.has(id)) { dropped.push({ id, why: "not an enabled overnight job — outside the agenda's date key" }); continue; }
    if (depth !== "lean" && depth !== "skip") { dropped.push({ id, why: `depth "${depth}" not in {lean, skip} ("deep" is the 48k default already)` }); continue; }
    if (depth === "skip" && NEVER_SKIP.has(id)) { allocations[id] = { depth: "lean", why: `NEVER_SKIP demoted skip→lean: ${why}` }; continue; }
    allocations[id] = { depth, why };
  }
  // H5 — the dream pick: strings-only sanitize HERE; whether it quotes a REAL
  // bridge is verified at the CONSUMER (night_coach reads the actual dreams
  // file — the sanitizer has no date context, refuter-confirmed).
  let dream_pick = null;
  if (j.dream_pick && typeof j.dream_pick === "object") {
    const p = j.dream_pick;
    if (typeof p.from_concept === "string" && typeof p.to_concept === "string" && /^[a-i]$/.test(String(p.axis || "")))
      dream_pick = { from_concept: p.from_concept.slice(0, 60), to_concept: p.to_concept.slice(0, 60),
        axis: String(p.axis), hypothesis: String(p.hypothesis || "").slice(0, 240) };
  }
  return { date: typeof j.date === "string" ? j.date : null,
    focus: typeof j.focus === "string" ? j.focus.slice(0, 300) : null,
    allocations, ...(dream_pick ? { dream_pick } : {}), ...(dropped.length ? { dropped } : {}) };
}

// H6 — the diary's machine sibling: one deterministic line for diaryLine and
// get_diary, so the healthy read path never parses LLM prose.
export function parseDiaryJson(text) {
  const j = lastJsonBlock(text);
  if (!j || typeof j !== "object" || typeof j.will_change !== "string") return null;
  return { date: typeof j.date === "string" ? j.date : null, will_change: j.will_change.slice(0, 300) };
}

// the per-kind sibling parser map — the night_coach mechanism, generalized
// (it was hardcoded twice; H2/H6 are its second and third users).
// H3 — model_mine's sibling: the ONLY door proposals enter by, sanitized by
// the owner's own sanitizer (closed vocabulary, med hard-block, dedupe against
// the edges already tracked). The LLM proposes WHICH edges; every NUMBER is
// re-derived by nikhil_model.mjs ingest from its grid.
function parseModelMineJson(text) {
  const j = lastJsonBlock(text);
  const existing = (readJson(join(STATE_DIR, "nikhil_model.json")) || {}).edges || [];
  return sanitizeModelMine(j, existing);
}

// H5 — the dreams sibling: ≤10 bridges, from/to resolved through the alias
// machinery against known concept ids, axis a-i, confidence ALWAYS "low"
// (a dream is a dream — the sanitizer stamps it, the model cannot raise it).
export function parseDreamsJson(text, _cfg, aliasMap = null) {
  const j = lastJsonBlock(text);
  if (!j || typeof j !== "object" || !Array.isArray(j.bridges)) return null;
  const map = aliasMap || loadAliasMap(join(STATE_DIR, "concepts.json"));
  const known = [...new Set([...map.values()])];
  const resolve = (raw) => {
    if (typeof raw !== "string" || !raw.trim()) return null;
    const key = raw.toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
    if (map.has(key)) return map.get(key);
    for (const id of known) { const n = id.toLowerCase(); if (n === key || n.includes(key) || key.includes(n)) return id; }
    return null;
  };
  const bridges = []; const dropped = [];
  for (const b of j.bridges.slice(0, 10)) {
    const from = resolve(b && b.from_concept), to = resolve(b && b.to_concept);
    const axis = String((b && b.axis) || "");
    if (!from || !to || from === to) { dropped.push({ raw: b, why: !from || !to ? "unknown concept" : "self-bridge" }); continue; }
    if (!/^[a-i]$/.test(axis)) { dropped.push({ raw: b, why: "axis outside a-i" }); continue; }
    bridges.push({ from_concept: from, to_concept: to, axis,
      hypothesis: String((b && b.hypothesis) || "").slice(0, 240), confidence: "low" });
  }
  return { date: typeof j.date === "string" ? j.date : null, bridges, ...(dropped.length ? { dropped } : {}) };
}

// ── INTENT DIGEST (OVERHAUL Block 2 · §7.2, 18 Aug 2026) ────────────────────
// ONE sonnet call a night over the day's session-intent rows (intent.mjs's grouped,
// clipped input — never the raw lane): label each session kind / promised / shipped
// / open. THE FOOD IS COMPUTED, THE VERDICT IS VALIDATED, THE LANE IS NEVER WRITTEN
// HERE: the sibling lands in brain_out/intent_digest/<day>.json and intent.mjs READS
// it (show · brief). No-invented-numbers: intent.validateDigest drops any label whose
// number is not in the input corpus and NAMES the drop. Consumption (§5.2 C): the
// brief stamps `briefed` when it carries the SESSION INTENTS block (learnstate).
let intentDigestFood = null;   // the input the running job was built from — its parser validates against exactly that
function buildIntentDigestPrompt(job, inputs, banned = DEFAULTS.guards.banned_phrases) {
  const head = `You are the INTENT SCRIBE of ARSENAL AI FC — the captain's session memory. Below are TODAY's Claude Code sessions, each as the HEADS of his prompts and of the replies (verbatim, clipped). For EACH session say what he ASKED FOR (promised = what the session said it would do), what it SAID IT SHIPPED (shipped), and what is STILL OPEN (asked, not shipped, or shipped-claim you cannot see evidence for in the heads). Label the session kind: study (he was being taught / drilled / re-jirah) · build (fixing/building the organism) · other.

DO: ≤ 12 lines of reading, then END with EXACTLY ONE fenced \`\`\`json block, nothing after it:
{"sessions": [{"session_id": "<id from the input>", "kind": "study|build|other", "promised": ["<short line>"], "shipped": ["<short line>"], "open": ["<short line>"]}]}

LAWS: session_id ONLY from the input (anything else is dropped). Short lines (≤ 300 chars), in the language he used. EVERY NUMBER must appear in the input heads verbatim — a line with a number not present there is DROPPED mechanically. Empty arrays are honest ("open": [] = nothing left open). No praise, no advice, no plan of your own. NEVER these phrases: ${(banned || []).join(", ")}.`;
  const body = Object.entries(inputs || {}).map(([k, v]) => `\n## INPUT ${k}\n${clip(v)}`).join("\n");
  return head + body;
}
export function parseIntentDigestJson(text, _cfg, food = intentDigestFood) {
  const j = lastJsonBlock(text);
  const input = food || intentDigestInput({ day: dayKey() });
  return intentValidateDigest(j, input);
}

// ── PREPARE TOMORROW (OVERHAUL Block 5 · §10, 18 Aug 2026) — the ONE dark-lane job ──
// ONE opus call a night that composes TOMORROW'S ONE SITTING: the map + the units, in
// EXACTLY the shape sitting.mjs's PLAN FILE CONTRACT declares (its header lines 54–56),
// validated by sitting's OWN validatePlan before a byte is written, and refused when the
// route it would plan is not a voice route (PYTHON = the CLOSE-PACKET loop in /learn;
// SCRIMMAGE = the dugout's staged mock). THE ROUTE IS THE SITTING'S ROUTE BY
// CONSTRUCTION: the food comes from sitting.gatherPlanContext — the same reader `open`
// runs the next morning — so the plan cannot be composed for a task the sitting will
// not open (and if state moves overnight, `open`'s task/route guard refuses it as
// stale rather than serving it). The night's OTHER lanes (night_coach · day_cartridge ·
// agenda · teamtalk_am · midday_cartridge · capsule_premap) FOLD into this by THE GATE
// (they stay enabled; E∧C∧¬F sleeps them; `folded_into` names it — Block 5.2), so a
// night costs ONE plan and the plan is what he actually meets.
// CONSUMPTION (§5.2 C): the units carry src:["prepare_tomorrow"] — sitting's own
// consumeSpoken stamps `sat` on the JOB ID the moment a unit is SPOKEN to him (spoken =
// reached; read ≠ reached), which is the one honest signal that the plan was met.
let prepareFood = null;      // the food the running job was built from — its parser validates against exactly that route
let prepareSitting = null;   // the sitting module, loaded once at gather time so the (sync) sibling parser can call its validator
export async function gatherPrepareFood(deps = {}) {
  const S = deps.sitting || await import("./sitting.mjs");
  prepareSitting = S;
  const ctx = await S.gatherPlanContext(deps.ctxDeps || {}, deps.now ? Date.parse(deps.now) : Date.now());
  const day = localDate(deps.now ? new Date(deps.now) : new Date());   // day-key: WALL-CLOCK by design (an overnight lane — the reviews of the day this run closes)
  // today's sitting reviews (base + LLM rows merged per sitting), the last 3 closed
  const rows = deps.reviewRows || readLinesTail(join(STATE_DIR, "sitting_reviews.jsonl"), 60) || [];
  const ids = [...new Set(rows.filter((r) => r && r.kind === "sitting_review" && r.sitting_id).map((r) => r.sitting_id))].slice(-3);
  const reviews = ids.map((id) => S.mergeReviewRows(rows, id)).filter(Boolean).map((r) => ({
    sitting_id: r.sitting_id, closed_at: r.closed_at, route: r.route, concept: r.concept, turns: r.turns, banked: r.banked,
    units_spoken: `${r.units_delivered}/${r.units_composed}`, drifts: r.drifts || null, what_changes_next: r.what_changes_next || null,
    register_line: r.judge && r.judge.register_line ? r.judge.register_line : null,
  }));
  const cal = deps.calibration !== undefined ? deps.calibration : readJson(join(STATE_DIR, "calibration.json"));
  const weak = deps.weaknesses !== undefined ? deps.weaknesses : readJson(join(STATE_DIR, "weaknesses.json"));
  const cap = ctx.capsule;
  // THE CAPSULE, by route: REJIRAH gets the STRIKES only (the truth-layer fence — welds are
  // his to defend, never in a plan he will hear before he answers); REVISION/FORGE get titles
  // + strikes + the mechanism head; never `deep`.
  const capsuleFood = cap ? {
    id: cap.id, title: cap.title, lockedOn: cap.lockedOn || null,
    axes: (cap.faultLines || []).map((a) => ({ axis: a.axis, title: a.title || null, strike: a.strike || null, status: a.status || null })),
    mechanism_head: ctx.route === "REJIRAH" ? "(withheld — cold round)" : String(cap.mechanism || "").slice(0, 400) || null,
    traps: ctx.route === "REJIRAH" ? "(withheld — cold round)" : (cap.traps || []).map((t) => (typeof t === "string" ? t : (t && t.bait) || "")).filter(Boolean).slice(0, 5),
  } : null;
  return {
    for_day: day, route: ctx.route, route_why: ctx.routeWhy, concept: ctx.concept, task_title: ctx.taskTitle, task_id: ctx.taskId, track: ctx.track,
    plan_max_units: (S.DEFAULT_CONFIG && S.DEFAULT_CONFIG.plan_max_units) || 16, unit_max_words: (S.DEFAULT_CONFIG && S.DEFAULT_CONFIG.unit_max_words) || 110,
    forge: ctx.forge && ctx.forge.concept && !ctx.forge.closed_at ? { concept: ctx.forge.concept, step: ctx.forge.step, steps_done: ctx.forge.steps_done || [], axes_done: ctx.forge.axes_done || [] } : null,
    kickoff_line: ctx.kickoff && ctx.kickoff.cur ? `${ctx.kickoff.cur.id || ""} ${ctx.kickoff.cur.task || ""} (${ctx.kickoff.cur.track || ""})`.trim() : null,
    nextup: ctx.nextup && ctx.nextup.winner ? { name: ctx.nextup.winner.name, line: ctx.nextup.winner.line, why: ctx.nextup.winner.why } : null,
    capsule: capsuleFood, reviews,
    calibration: cal ? { gap: cal.calibration_gap ?? null, trend: cal.trend ?? null, overconfidence_rate: cal.overconfidence_rate ?? null, status: cal.status || null } : null,
    weaknesses: weak ? { headline: weak.headline || null, axis_pattern: weak.axis_pattern || null, register: weak.register || null } : null,
  };
}
export function buildPrepareTomorrowPrompt(job, inputs, banned = DEFAULTS.guards.banned_phrases, food = prepareFood) {
  const f = food || {};
  const head = `You are THE SITTING BRAIN's night half — you compose TOMORROW'S ONE SITTING for the captain (ADHD-PI, Hinglish, learns by ONE idea per unit, gut-word before every answer). Route ${f.route || "?"}${f.concept ? ` · concept '${f.concept}'` : ""}${f.forge ? ` · forge step ${f.forge.step} (steps done ${(f.forge.steps_done || []).join(",") || "none"}; axes done ${(f.forge.axes_done || []).join(",") || "none"})` : ""} · for ${f.for_day || "tomorrow"}.

WHAT A PLAN IS: a MAP (≤60 words, spoken Hinglish — declare today's map first and END by asking him to start) and 3–${f.plan_max_units || 16} UNITS, each ≤${f.unit_max_words || 110} words of spoken Hinglish carrying ONE idea. Unit 0 IS the map. A question unit ends with '?' and asks for the gut-word first — the gut-word vocabulary is EXACTLY these three English words, knew · shaky · guessed (the bank lane recognises only them; never translate them). FORGE: steps never go backwards (THE METHOD 0-11), open with the map, then Pehle-Guess, then the axes in order; REJIRAH: cold strikes ONLY, one axis per question, NEVER the weld or the answer; REVISION: his one-line first, then a recital unit with the locked weld, then a check-question. Analogies only from everyday physical things (food, house, shop, city). Where the last sitting's review says what changes, CHANGE IT — that is why it rides here. Where his register line says the room wanted a word, plant ONE unit that makes him say it, in context, never a vocabulary lecture.

DO: ≤ 8 lines of reasoning, then END with EXACTLY ONE fenced \`\`\`json block, nothing after it:
{"map":"<≤60 words, ends by asking him to start>","units":[{"step":0-11|null,"axis":"a-i"|null,"kind":"unit|question|recital","text":"<≤110 words spoken Hinglish, ONE idea>","question":true|false,"est_seconds":n,"src":["prepare_tomorrow"]}]}

LAWS: no markdown inside unit text · no code fences inside text · no numbers he has not met (his own capsule's counts are fine) · never a weld or a trap's truth on a REJIRAH plan · never praise, never hype · NEVER these phrases: ${(banned || []).join(", ")}.`;
  const body = Object.entries(inputs || {}).map(([k, v]) => `\n## INPUT ${k}\n${clip(v)}`).join("\n");
  return head + body;
}
let prepareLastRefusal = null;   // why the last reply's plan was refused by sitting's validator (named in the note; nothing written)
export function parsePrepareTomorrowJson(text, _cfg, food = prepareFood, S = prepareSitting) {
  prepareLastRefusal = null;
  const j = lastJsonBlock(text);
  if (!j || !food || !S) { prepareLastRefusal = !j ? "no fenced json block" : !food ? "no food" : "sitting validator unavailable"; return null; }
  const v = S.validatePlan(j, { route: food.route });
  if (!v.ok) { prepareLastRefusal = v.why.join("; "); return null; }
  return {
    // task.id is the SPRINT task's id only when the plan is FOR the sprint task (FORGE on
    // the current concept); a Re-Jirah/revision on another concept carries that concept.
    task: { id: (food.route === "FORGE" && food.task_id) ? food.task_id : (food.concept || food.task_id || null), title: food.task_title || food.concept || null }, route: food.route, concept: food.concept || null,
    map: v.plan.map, units: v.plan.units.map((u) => ({ ...u, src: (u.src && u.src.length ? u.src : ["prepare_tomorrow"]).map((s) => (s === "prepare" ? "prepare_tomorrow" : s)) })),
    source: "prepare_tomorrow", for_day: food.for_day, composed_at: new Date().toISOString(),
    inputs: { reviews: (food.reviews || []).length, register_line: !!(food.reviews || []).find((r) => r.register_line), forge_step: food.forge ? food.forge.step : null },
  };
}

const SIBLING_PARSERS = {
  night_coach: (text) => parseNightCoachJson(text),
  intent_digest: (text) => parseIntentDigestJson(text),
  prepare_tomorrow: (text, cfg) => parsePrepareTomorrowJson(text, cfg),
  agenda: (text, cfg) => parseAgendaJson(text, cfg),
  diary: (text) => parseDiaryJson(text),
  model_mine: (text) => parseModelMineJson(text),
  dreams: (text, cfg) => parseDreamsJson(text, cfg),
};

// H5 — the cracked-axes inventory, computed (never guessed): rejirah grades
// carry concept×axis directly; scoreboard cracks carry the concept, and the
// axis is recovered from that day's own wrong reps (reps carry axis per rep).
export function crackedAxesInventory(dir = STATE_DIR) {
  const inv = new Map();
  const bump = (c, a, src) => { const k = `${c}×${a}`; const e = inv.get(k) || { concept: c, axis: a, n: 0, src: new Set() }; e.n++; e.src.add(src); inv.set(k, e); };
  for (const r of readLinesTail(join(dir, "rejirah_log.jsonl"), 500) || [])
    if (r && r.result === "cracked" && r.concept && r.axis) bump(r.concept, r.axis, "rejirah");
  const outs = readLinesTail(join(dir, "brain_outcomes.jsonl"), 500) || [];
  const last = new Map();
  for (const r of outs) last.set(`${r.day}|${r.kind}|${r.subject}`, r);
  const reps = readLinesTail(join(dir, "reps_log.jsonl"), 500) || [];
  for (const o of [...last.values()].filter((r) => (r.kind === "misconception" || r.kind === "lesson") && (r.verdict === "cracked" || r.verdict === "mixed")))
    for (const rp of reps.filter((r) => repLocalDay(r.ts) === o.day && r.concept === o.subject && r.correct === false && r.axis))
      bump(rp.concept, rp.axis, "scoreboard");
  return [...inv.values()].map((e) => ({ concept: e.concept, axis: e.axis, n: e.n, src: [...e.src].join("+") }));
}

function buildDreamsPrompt(job, inputs, banned = DEFAULTS.guards.banned_phrases) {
  const head = `You are the DREAMER of ARSENAL AI FC — the DMN's night recombination. Take the captain's CRACKED axes (where his model of a concept actually broke), his own lexicon (the metaphors HIS brain already runs on), and the syllabus graph — and dream CHEAP, LOW-CONFIDENCE bridges: "what if the crack in X's axis is the same shape as Y?" A dream is a hypothesis for ONE future lesson to test, never a claim.

DO: ≤ 15 lines of recombination, then END with EXACTLY ONE fenced \`\`\`json block, nothing after it:
{"date": "<shift day>", "bridges": [{"from_concept": "<cracked concept>", "to_concept": "<known concept>", "axis": "<a-i>", "hypothesis": "<ONE line in HIS lexicon's imagery — everyday-physical, never geometry>"}]}

LAWS: ≤ 10 bridges, fewer is better. from_concept must be a genuinely cracked one (the inventory below), to_concept a known syllabus concept. Confidence is ALWAYS low — the sanitizer stamps it regardless. NEVER these phrases: ${(banned || []).join(", ")}.`;
  const body = Object.entries(inputs || {}).map(([k, v]) => `\n## INPUT ${k}\n${clip(v)}`).join("\n");
  return head + body;
}

function buildModelMinePrompt(job, inputs, banned = DEFAULTS.guards.banned_phrases) {
  const vocab = Object.entries(FACTS).map(([id, f]) => `- ${id}: ${f.desc} (src: ${f.src})`).join("\n");
  const head = `You are the MODEL MINER of ARSENAL AI FC — the night's hypothesis engine about the CAPTAIN. Propose which cause→effect day-edges are worth WATCHING, from the evidence below. You propose WHICH edges; the code owns every number (counts are re-derived from the fact grid — nothing you write becomes a statistic).

THE CLOSED VOCABULARY (cause and effect must EACH be one of these ids — anything else is rejected at the door):
${vocab}

DO: read the inputs, write ≤ 20 lines of reasoning (which co-occurrences look real, which are noise), then END with EXACTLY ONE fenced \`\`\`json block, nothing after it:
{"edges": [{"cause": "<vocab id>", "effect": "<vocab id>", "statement": "<ONE plain line naming the observed co-occurrence — his data, never advice, NEVER medication/dose language (hard-blocked)>"}]}

LAWS: ≤ 3 new edges a night — fewer is better; an edge repeats existing tracked pairs = wasted. Evidence only. This is observed co-occurrence, never medical guidance. NEVER these phrases: ${(banned || []).join(", ")}.`;
  const body = Object.entries(inputs || {}).map(([k, v]) => `\n## INPUT ${k}\n${clip(v)}`).join("\n");
  return head + body;
}

// H2 — the tick-side lookup: tonight's sanitized allocations for THIS job.
// Only overnight-window jobs can resolve tonight's file (shiftDay keying);
// the agenda never allocates itself. Absent file / absent key = null = default.
export function agendaAllocationFor(job, cfg, now, dir = OUT_DIR) {
  if (!job || job.window !== "overnight" || job.kind === "agenda") return null;
  const sd = shiftDay(job, now, cfg);
  const ag = readJson(join(dir, "agenda", sd + ".json"));
  const a = ag && ag.allocations && ag.allocations[job.id];
  return a && typeof a === "object" && (a.depth === "lean" || a.depth === "skip")
    ? { depth: a.depth, why: a.why || "" } : null;
}

// H2 — the skip-safety gate: a lane may rest tonight ONLY if its newest output
// file is younger than ONE declared period (24h). reconcile's staleness bar is
// two periods (48h, its own derivation law) — so a legal skip can never bleed,
// and every non-agenda cause of a missed night (failed attempts, dead laptop,
// validator rejects) closes the gate by itself, no proxy needed.
// THE ONE READ OF A LANE'S DIRECTORY (Block 5.2): laneRestable (H2) and foldStatus (the fold's
// artifact check) both ride this single listing, so brain.mjs's unresolved-sink ratchet stays
// where it was — one readdir site, one stat site — instead of a new existsSync per caller.
// null = no lane dir (never produced); else [{name, mtimeMs}].
export function laneListing(job, dir = OUT_DIR) {
  const lane = join(dir, job.out || job.id);
  try {
    return readdirSync(lane).map((f) => { try { return { name: f, mtimeMs: statSync(join(lane, f)).mtimeMs }; } catch (e) { swallow("laneListing: statSync(join(lane, f)) absent → { name: f, mtimeMs: 0 }", e); return { name: f, mtimeMs: 0 }; } });
  } catch (e) { swallow("laneListing: readdirSync(lane) unreadable → null", e); return null; }
}
export function laneRestable(job, dir = OUT_DIR, nowMs = Date.now()) {
  const files = laneListing(job, dir);
  if (!files) return false;   // no lane dir = never produced = never restable
  let newest = 0;
  for (const f of files) if (f.mtimeMs > newest) newest = f.mtimeMs;
  return newest > 0 && (nowMs - newest) < 24 * 3600000;
}

function buildAgendaPrompt(job, inputs, cfg, banned = DEFAULTS.guards.banned_phrases) {
  const targets = ((cfg && cfg.jobs) || [])
    .filter((x) => x.enabled !== false && x.window === "overnight" && x.kind !== "agenda")
    .map((x) => `${x.id} (priority ${x.priority || 0}, out brain_out/${x.out || x.id})`);
  const head = `You are THE AGENDA of ARSENAL AI FC — the first thought of the night lane. Spend follows surprise: tonight's depth goes where today's evidence says it matters, and is TAKEN AWAY where the food is stale or absent. You ALLOCATE only — the job table is canon and you may never invent, reorder or re-schedule a job.

LEGAL ALLOCATION TARGETS (overnight lane only — any other id is dropped by the sanitizer):
${targets.map((t) => "- " + t).join("\n")}

DO: read the day's evidence below, then write ≤ 25 lines of reasoning (what surprised, what the night should chase, what is a waste tonight), then END with EXACTLY ONE fenced \`\`\`json block, nothing after it:
{"date": "<tonight's shift day>", "focus": "<ONE line — the single most surprising thing today>", "allocations": {"<job_id>": {"depth": "lean"|"skip", "why": "<one line of tonight's evidence>"}}, "dream_pick": {"from_concept": "...", "to_concept": "...", "axis": "a-i", "hypothesis": "..."}}
(dream_pick is OPTIONAL and at most ONE — copy a bridge VERBATIM from the dreams input, and only if tomorrow's lesson could genuinely test it in one line; omit the field otherwise.)

LAWS: an absent job = default depth (the night's 48k ceiling) — allocate ONLY where the evidence says lean (the lane's food is thin tonight) or skip (its food is absent/stale and one night's rest costs nothing). night_coach and diary can never be skipped. Evidence only — every why must trace to an INPUT line. Use only numbers present in the inputs. NEVER these phrases: ${(banned || []).join(", ")}.`;
  const body = Object.entries(inputs || {}).map(([k, v]) => `\n## INPUT ${k}\n${clip(v)}`).join("\n");
  return head + body;
}

// ---------------------------------------------------------------------------
// PHASE H · H4 REHEARSAL (10 Aug 2026) — draft → simulated-Nikhil → final,
// for the night coach's lesson (the morning's highest-stakes teaching page).
// THE SHEET IS DELIBERATELY NOT REHEARSED in v1: formation_read's draft lives
// inside manager.mjs's own validate/publish path (the capstone — CLAUDE.md's
// M-2..M-5 caution), so its rehearsal is a captain-approved item, not a build
// decision. SIMULATED-HIM IS DESIGN ONLY: this edits the DRAFT before
// publication — it never writes reps, never grades, never touches capture/
// FSRS state. LOAD-BEARING ONLY ON TESTED: the critic reads nikhil_model's
// TESTED edges alone (via the owner's formatter + morning guard), plus
// doubt_grammar and the lexicon fingerprint — both real his-data from day 1,
// so zero tested edges still leaves a working critic.
// ---------------------------------------------------------------------------
function buildRehearsalPrompt(draft) {
  const dg = readJson(join(STATE_DIR, "doubt_grammar.json"));
  let edges = [];
  try { edges = testedEdgeLines(); } catch { }
  return `You are SIMULATED-NIKHIL — reading tomorrow's lesson as HIM, hunting where a sentence CRACKS for this exact brain (ADHD-PI, Hinglish, one idea at a time, everyday-physical analogies only, cold-start honesty).
${gatherFingerprint() || ""}
${edges.length ? "\nTESTED patterns about him (observed co-occurrence, his own data):\n" + edges.map((e) => "- " + e).join("\n") : ""}
${dg ? "\nHIS DOUBT GRAMMAR (how his confusion actually phrases itself):\n" + clip(dg) : ""}

THE DRAFT:
${draft}

DO: read it as him. Reply with AT MOST 5 numbered cracks — each quoting the exact sentence and ONE line on why it cracks for THIS brain (too many ideas, English where Hinglish belongs, geometry analogy, assumed recall, a question-moment beyond the four). If nothing cracks, reply with exactly: STANDS`;
}

function buildDiaryPrompt(job, inputs, banned = DEFAULTS.guards.banned_phrases) {
  const head = `You are the BRAIN of ARSENAL AI FC writing tonight's ONE-PAGE DIARY in your own first person — the page a captain may glance at over chai, and the page your own tomorrow reads. Five headed sections, in this order: ATTENDED (what tonight actually ran) · BELIEVED (what the agenda thought would matter) · TESTED (what the scoreboard measured) · WAS WRONG (where belief and measurement disagree — say it plainly) · WILL CHANGE (one concrete thing tomorrow does differently).

LAWS: ≤ 25 lines total (the analysis head's own cap — one glance, one story). Plain English, first person, no hype. USE ONLY THE COUNTS GIVEN in the inputs — never sum, average or derive a new number; if a count is not given, say "uncounted", never invent it. END with EXACTLY ONE fenced \`\`\`json block, nothing after it:
{"date": "<the morning this serves>", "will_change": "<the WILL CHANGE line, verbatim, one line>"}
NEVER these phrases: ${(banned || []).join(", ")}.`;
  const body = Object.entries(inputs || {}).map(([k, v]) => `\n## INPUT ${k}\n${clip(v)}`).join("\n");
  return head + body;
}

// H2 — the day's evidence, computed DETERMINISTICALLY (the nightCoachAfferents
// pattern: code summarizes, the model reads summaries — never a 2MB raw dump).
// Salience day-filter uses r.day (the ledger's own local-day field), .1-roll-aware.
export function salienceDaySummary(day, dir = STATE_DIR) {
  const p = join(dir, "salience_ledger.jsonl");
  const rows = [];
  for (const f of [p + ".1", p]) {
    try {
      for (const line of readFileSync(f, "utf8").split("\n")) {
        if (!line.trim()) continue;
        try { const r = JSON.parse(line); if (r.day === day) rows.push(r); } catch { }
      }
    } catch (e) { swallow("salienceDaySummary: readFileSync(f) unreadable → ignored", e); }
  }
  const hist = {}; const tiers = {}; const keys = {};
  let pulseComps = 0;
  for (const r of rows) {
    hist[r.outcome || "?"] = (hist[r.outcome || "?"] || 0) + 1;
    tiers["t" + (r.tier ?? "?")] = (tiers["t" + (r.tier ?? "?")] || 0) + 1;
    keys[r.key] = (keys[r.key] || 0) + 1;
    if (r.comps && r.comps.pulse > 0) pulseComps++;
  }
  const escalations = rows.filter((r) => r.outcome && r.outcome !== "reflex")
    .sort((a, b) => (b.S || 0) - (a.S || 0)).slice(0, 8)
    .map((r) => ({ key: r.key, S: r.S, outcome: r.outcome, tier: r.tier }));
  const topKeys = Object.entries(keys).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, n]) => `${k}×${n}`);
  return { day, rows: rows.length, outcomes: hist, tiers, top_keys: topKeys, escalations, pulse_comp_rows: pulseComps };
}

// H1's journal, read the readers' way: last row per (day|kind|subject) key.
export function outcomesFor(days, dir = STATE_DIR) {
  const last = new Map();
  try {
    for (const line of readFileSync(join(dir, "brain_outcomes.jsonl"), "utf8").split("\n")) {
      if (!line.trim()) continue;
      try { const r = JSON.parse(line); last.set(`${r.day}|${r.kind}|${r.subject}`, r); } catch { }
    }
  } catch (e) { swallow("outcomesFor: readFileSync(brain_outcomes.jsonl) unreadable → the rows read so far", e); }
  return [...last.values()].filter((r) => days.includes(r.day));
}

// H6 — tonight's ledger, summarized with EVERY count precomputed (the diary's
// no-derive law only works if the summary already carries every number the
// five sections could want). Explicit .1+live read — readLinesTail can miss a
// freshly-rolled generation (E3).
export function ledgerShiftSummary(shiftDayStr, dir = STATE_DIR) {
  const p = join(dir, "brain_ledger.jsonl");
  const rows = [];
  for (const f of [p + ".1", p]) {
    try {
      for (const line of readFileSync(f, "utf8").split("\n")) {
        if (!line.trim()) continue;
        try { rows.push(JSON.parse(line)); } catch { }
      }
    } catch (e) { swallow("ledgerShiftSummary: readFileSync(f) unreadable → ignored", e); }
  }
  // the shift = 22:00 of the shift day → now (the diary runs inside the shift)
  const start = new Date(`${shiftDayStr}T22:00:00+05:30`).getTime();
  const shift = rows.filter((r) => { const t = new Date(r.ts).getTime(); return Number.isFinite(t) && t >= start; });
  const perJob = {};
  let ok = 0, failed = 0, skipped = 0, tokens = 0;
  let starved = 0;
  // WIRING AUDIT (11 Aug 2026) — THE BENCH CENSUS HAD NO READER. cortex.mjs stamps
  // council_seats/council_note onto every cortex_wake row so a Bridge read that ran
  // COLD leaves a durable trace ("THE DRY COUNCIL LEFT NO TRACE", cortex.mjs) — and a
  // tracing pass this morning found NOTHING in the repo reading either field. A
  // producer with no consumer is a black box, not a feedback loop: all three free
  // chairs plus the cross-examiner could sit empty for a week and no organ would know,
  // because a dry sitting and a four-chair one still summed to one identical row.
  // It lands HERE because this summary is the DIARY's own input (same wire as the
  // STARVED counters above) and "how much breadth tonight's deep reads were actually
  // given" is precisely ATTENDED — and WAS WRONG, when the night believed it had a
  // bench it never had.
  // COUNTS AND HIS OWN ORGANS' WORDS ONLY: no threshold, no verdict, no derived rate —
  // the same no-derive discipline buildDiaryPrompt puts on the model.
  // null ≠ 0 is carried end to end. cortex writes null for an UNMEASURED bench (no
  // council object came back at all) and 0 only when chairs really sat and every one
  // brought nothing; collapsing the two here would re-tell the exact lie council.mjs's
  // `?? null` law forbids one file over.
  const council = { reads: 0, with_bench: 0, seats: 0, cold: 0, unmeasured: 0, notes: {} };
  for (const r of shift) {
    const j = perJob[r.job] = perJob[r.job] || { runs: 0, ok: 0, failed: 0, agenda_skips: 0, budget_skips: 0, tokens: 0 };
    j.runs++; j.tokens += r.total_tokens || 0; tokens += r.total_tokens || 0;
    // keyed off FIELD PRESENCE, never off job === "cortex_wake": the census is a
    // property of the row, so the next organ that convenes a council is counted the
    // day it starts stamping, with no edit here.
    if (Object.prototype.hasOwnProperty.call(r, "council_seats") || Object.prototype.hasOwnProperty.call(r, "council_note")) {
      council.reads++;
      if (typeof r.council_seats === "number") {
        if (r.council_seats > 0) { council.with_bench++; council.seats += r.council_seats; }
        else council.cold++;
      } else council.unmeasured++;
      // the note rides VERBATIM and deduped-with-a-count — this file never re-phrases
      // another organ's honest note (cortex.mjs holds the same rule one hop upstream).
      if (r.council_note) council.notes[r.council_note] = (council.notes[r.council_note] || 0) + 1;
    }
    if (r.agenda_skip) { j.agenda_skips++; skipped++; }
    // THE NIGHT THE DIARY LOST (10 Aug 2026 wiring audit): budget_skip rows exist from
    // today, and without this arm they fell into `runs` and out of every other bucket —
    // a phantom run in the one summary the diary reads. A starved lane must be COUNTED,
    // and it is separate from agenda_skips because the two are opposite facts: an agenda
    // skip is a choice this organism made, a budget skip is a wall it hit.
    else if (r.budget_skip) { j.budget_skips++; starved++; }
    else if (r.ok === true) { j.ok++; ok++; }
    else if (r.ok === false) { j.failed++; failed++; }
  }
  return { shift_day: shiftDayStr, rows: shift.length, ok, failed, agenda_skips: skipped, budget_skips: starved, total_tokens: tokens, per_job: perJob, council };
}

// ---------------------------------------------------------------------------
// JOB RUNNER
// ---------------------------------------------------------------------------
async function runJob(job, cfg, deps) {
  const { exec, gexec, now, dry } = deps;
  // ONE SHIFT, ONE DATE (E2E audit 25 Jul 2026): both the TODAY-token inputs and
  // the output filename now key off the shift the job belongs to, not the wall
  // calendar — so an overnight job that first runs at 00:30 still reads and
  // writes the evening it started. Identical to localDate() for every other window.
  const today = shiftDay(job, now, cfg);

  if (job.kind === "manager_m3") {
    // M-3: the plug meets the socket. manager.mjs validates + writes the sheet
    // itself (zero-invented-numbers + fallback skeleton — never depends on us).
    const system = existsSync(SYSTEM_MD) ? readFileSync(SYSTEM_MD, "utf8") : "";
    let usage = null;
    const llm = async (prompt) => {
      const r = exec(system + "\n\n=== TODAY'S WRAPPER FEATURES (the only numbers that exist) ===\n\n" + prompt +
        "\n\nOUTPUT CONTRACT (mechanical): reply with ONLY the finished team sheet text — first characters '⚪🔴', last line ending 'COYG. ⚪🔴'. No preamble, no commentary, no questions, no tool use, no file writes. Your entire reply IS the sheet.", job.model);
      usage = r;
      if (!r.ok) throw new Error(r.error || "llm failed");
      return sliceSheet(r.text);
    };
    const res = dry ? { source: "dry" } : await runManager({ llm });
    // THE MOUTH IS GATED ON THE SHEET EXISTING, NOT ON WHO WROTE IT (1 Aug 2026 audit).
    // This read `res.source === "llm"`, so EVERY degraded path — validator reject, spawn
    // ETIMEDOUT, a 429 weekly limit, the M-1 stub — wrote a perfectly good sheet to disk
    // (manager.mjs publishes it UNCONDITIONALLY, line 535) and then silently swallowed the
    // one push the captain actually depends on. Observed live 1 Aug: source=fallback on
    // `invented number(s): 90`, phone silent after a SUCCESSFUL 48,464-token Opus run.
    // brain_config's own note promises "fallback skeleton guarantees the sheet regardless" —
    // the gate broke that promise without ever saying so. Now the sheet always ships and the
    // BODY carries the provenance: a skeleton morning is honest, never absent.
    //
    // ONCE A DAY, WHOEVER SPEAKS. A failed llm does not consume the job's daily slot (it is
    // meant to retry), so gating on existence alone would have pushed up to max_attempts
    // times per morning. `mouth_said[day]` is the morning slot itself — the sheet claims it
    // here, the absence line in tick() claims it if the window closes empty. Exactly one of
    // the two speaks, which keeps the two-utterances-a-day law intact.
    let pushed = null;
    const qs = deps.queueState;
    const spoke = !mouthMaySpeak(cfg, qs, today, job.id) && !!(qs && qs.mouth_said && qs.mouth_said[today]);
    if (!dry && mouthMaySpeak(cfg, qs, today, job.id)) {
      const sheetPath = join(STATE_DIR, "team_sheet.md");
      if (existsSync(sheetPath)) {
        const head = readFileSync(sheetPath, "utf8").split("\n").slice(0, 10).join("\n");
        const tt = teamtalkLine("am", now);
        const lead = res.source === "llm"
          ? "**The sheet is up, captain.**"
          : `**The sheet is up, captain** — skeleton, not the Gaffer's read.\n\n_${res.reason || "no llm"}_`;
        // LADDER A1 — a card re-dealt past 10 times without his word earns ONE line
        // here (captains_call.json is READ only; the card organ stays sole writer).
        const callState = readJson(join(STATE_DIR, "captains_call.json"));
        const nag = callState ? redealtSheetLine(callState.cards, today) : null;
        // LADDER B3 — the one line that reaches his phone when the CLI is logged
        // out (this very push still works: it is fetch, not claude).
        const tvHealth = ((readJson(TOKEN_VITALS) || {}).health) || {};
        const loginLine = tvHealth.not_logged_in === true ? "🔑 claude CLI LOGGED OUT — terminal kholke `claude` → /login, warna raat ka brain andhera." : null;
        // THE STATE LINE (overhaul §7.1, 18 Aug 2026) rides the morning push — the one
        // anchor that reaches his phone. Fail-silent: the sheet must never wait on it.
        const stateLine = await (async () => { try { const { liveState } = await import("./state.mjs"); return (await liveState()).line; } catch { return null; } })();
        pushed = await pushNtfy(cfg, SHEET_PUSH_TITLE, `${lead}\n\n${head}\n\n_…full sheet on the Wall (ARSENAL 2)._${loginLine ? "\n\n" + loginLine : ""}${nag ? "\n\n" + nag : ""}${tt ? "\n\n🎙️ " + tt : ""}${stateLine ? "\n\n" + stateLine : ""}`, undefined, { tags: "soccer,clipboard" });
        // marked only on a REAL send, so a network blip retries next beat instead of
        // burning the day's one utterance on a push that never left the machine.
        if (qs && pushed.sent) { qs.mouth_said = qs.mouth_said || {}; qs.mouth_said[today] = "sheet"; }
        recordMouth("sheet", pushed);   // E4 — the attempt is a row either way
      }
    }
    return {
      usage: usage || { ok: false, total_tokens: 0, limit_hit: false, error: "not called" },
      note: `sheet source=${res.source}${res.reason ? " (" + res.reason + ")" : ""}${pushed ? ` · push ${pushed.sent ? "sent" : "FAILED: " + pushed.why}` : spoke ? " · push already sent today" : ""}`,
    };
  }

  // analysis-class job — render-class jobs use viz's auto-written prompt file
  // (it carries the render laws + the design-coach critique), never the
  // analysis head (which would ask for markdown, not an artifact).
  const gi = gatherInputsAudited(job, now, today);
  const inputs = gi.inputs;
  // REQUIRED INPUTS (finding #64). Only a config-declared `required: true` can stop a
  // job, and it stops it BEFORE the spend, saying exactly which file is missing —
  // never a ratio, never a silent null rendered as `null` under its own heading.
  if (gi.required_absent.length) {
    return {
      usage: { ok: false, total_tokens: 0, duration_ms: 0, limit_hit: false, error: `required input absent: ${gi.required_absent.join(", ")}` },
      note: `skipped before spend — ${gi.required_absent.length}/${gi.declared} REQUIRED input(s) absent: ${gi.required_absent.join(", ")}`,
      inputs_absent: gi.absent.length, inputs_declared: gi.declared, inputs_absent_names: gi.absent,
    };
  }
  let prompt;
  if (job.kind === "render" && job.prompt_file) {
    const pf = join(STATE_DIR, "..", "club", "prompts", job.prompt_file);
    prompt = existsSync(pf) ? readFileSync(pf, "utf8") + "\nOutput ONLY the artifact — first character '<'." : buildAnalysisPrompt(job, inputs, undefined, cfg.guards.banned_phrases);
  } else if (job.kind === "night_coach") {
    // P2: swap the blind afferent tail for the day-filtered teaching lanes, and
    // the ≤25-line analysis head for the coach's own — everything else (exec,
    // validator, write, acct) stays the shared path.
    inputs[`afferent lanes (study day ${today})`] = nightCoachAfferents(today);
    // H3 — TESTED edges only (the load-bearing law): rendered by the owner's
    // own formatter (n + p + the not-medical-guidance frame by construction);
    // readiness-caused edges withheld while the coach is stale. Empty = the
    // key is absent, the coach teaches exactly as before — optional icing.
    try {
      const tel = testedEdgeLines();
      if (tel.length) inputs["nikhil model (TESTED edges — observed co-occurrence, never guidance)"] = tel;
    } catch { }
    // H5 — the agenda's picked dream, verified against the REAL bridge file
    // (the pick must quote an actual bridge — a hallucinated pick is dropped
    // here, at the consumer, where the file is; refuter-placed).
    // 11 Aug 2026: keyed by prevShiftDate(today), not calendar yesterday — the
    // agenda picks from the previous SHIFT's file and this must open THAT file
    // or a legitimate pick is silently dropped for straddling midnight.
    try {
      const ag = readJson(join(OUT_DIR, "agenda", today + ".json"));
      const pick = ag && ag.dream_pick;
      if (pick) {
        const dj = readJson(join(OUT_DIR, "dreams", prevShiftDate(today) + ".json"));
        const real = dj && Array.isArray(dj.bridges)
          && dj.bridges.find((b) => b.from_concept === pick.from_concept && b.to_concept === pick.to_concept && b.axis === pick.axis);
        if (real) inputs["dream to test (agenda's pick — OPTIONAL seed: weave into the lesson's FABRIC only if it fits in one line; NEVER a new question-moment; drop silently if it does not fit)"] = real;
      }
    } catch (e) { swallow("runJob: readJson(join(OUT_DIR, \"agenda\", today + \".json\")) unreadable → ignored", e); }
    prompt = buildNightCoachPrompt(job, inputs, undefined, cfg.guards.banned_phrases);
  } else if (job.kind === "model_mine") {
    // H3 — the proposer's food: the owner's own grid tail + current edges +
    // H1 outcomes. All computed/read, never guessed; the ledger note carries
    // per-fact observable-day counts so an empty grid is VISIBLE, not silent.
    const grid = readLinesTail(join(STATE_DIR, "nikhil_model_grid.jsonl"), 14);
    inputs["fact grid (last 14 finalized days — null = UNOBSERVED, never false)"] = grid;
    inputs["edges currently tracked"] = ((readJson(join(STATE_DIR, "nikhil_model.json")) || {}).edges || [])
      .map((e) => ({ id: e.id, status: e.status, n: `${e.n_cooccur}/${e.n_cause_days}` }));
    inputs["brain_outcomes (last-per-key, 2 days)"] = outcomesFor([today, addDays(today, -1)]);
    prompt = buildModelMinePrompt(job, inputs, cfg.guards.banned_phrases);
  } else if (job.kind === "agenda") {
    // H2: the day's evidence, all code-computed (never a raw ledger dump).
    // Wake residue rides the salience summary's own escalation rows — the
    // brain_ledger's cortex_wake rows carry metering only (refuter-verified),
    // so the ledger contributes nothing here but cost lines the diary reads.
    // (11 Aug 2026: those rows now also carry council_seats/council_note — the
    // bench census cortex.mjs added so a dry council leaves a trace. Still not
    // wake residue: it says how much breadth the read was given, never what the
    // moment was about, so this input set is unchanged. The census DOES have a
    // reader — ledgerShiftSummary().council, the diary's input, wired the same day;
    // do not read this deliberate non-read as "nothing consumes those fields".)
    inputs[`salience day-summary (computed, ${today})`] = salienceDaySummary(today);
    inputs["brain_outcomes (last-per-key, yesterday+today)"] = outcomesFor([today, addDays(today, -1)]);
    const tc = readJson(join(STATE_DIR, "teaching_contract.json"));
    inputs["teaching drifts (top rules)"] = ((tc && tc.rules) || [])
      .map((r) => ({ id: r.id, hits: (r.hits || 0) + (r.auto_hits || 0) }))
      .sort((a, b) => b.hits - a.hits).slice(0, 5);
    // H5 — last night's dreams (the agenda is THE reader; unpicked bridges are
    // inert by construction — never read again, never deleted)
    // 11 Aug 2026: LAST night = the previous SHIFT, not the previous calendar
    // day. On a 01:29 agenda run calendar-yesterday resolves to this shift's own
    // dreams file, which the priority order (agenda 95 > dreams 15) guarantees
    // is not on disk yet — the menu was empty by construction. See prevShiftDate.
    const dj = readJson(join(OUT_DIR, "dreams", prevShiftDate(today) + ".json"));
    if (dj && Array.isArray(dj.bridges) && dj.bridges.length)
      inputs["last night's dreams (you MAY dream_pick exactly ONE, verbatim)"] = dj.bridges;
    prompt = buildAgendaPrompt(job, inputs, cfg, cfg.guards.banned_phrases);
  } else if (job.kind === "diary") {
    // H6: every count precomputed (the no-derive law), agenda via declared
    // input (brain_out/agenda/TODAY.json — reconcile sees the pair), coach
    // names ONLY — the evidence field is his verbatim words, and injecting it
    // would make this a G8 opus lane (the _note carries the tripwire).
    inputs[`tonight's ledger (computed, shift ${today})`] = ledgerShiftSummary(today);
    inputs["brain_outcomes (last-per-key, 2 days)"] = outcomesFor([today, addDays(today, -1)]);
    const wl = readJson(join(STATE_DIR, "watchman_last.json"));
    inputs["watchman findings (last sweep)"] = ((wl && wl.findings) || []).map((f) => ({ id: f.id, level: f.level }));
    const ncServe = readJson(join(OUT_DIR, "night_coach", outDate(job, now, today) + ".json"));
    inputs["tomorrow's lesson (concept names ONLY)"] = ncServe && Array.isArray(ncServe.misconceptions)
      ? ncServe.misconceptions.map((m) => m && m.concept).filter(Boolean) : null;
    // H3 — the model's status counts (precomputed — the no-derive law)
    const nm = readJson(join(STATE_DIR, "nikhil_model.json"));
    if (nm && nm.counts) inputs["nikhil model status counts"] = nm.counts;
    // H-BREATH — the wind tunnel's pending threshold proposals (gate_tune's
    // lane, B5): the diary SEES them so its WILL CHANGE line can name one —
    // but the diary's prose never BECOMES a proposal: thresholds enter only
    // through the wind tunnel's MEASURED lane + his card (a prose-to-threshold
    // converter would be a guessed-number factory; deferred until the
    // metacognition window has data, the rejirah controller-v0 pattern).
    try {
      const tdir = join(OUT_DIR, "nightshift");
      const wt = readdirSync(tdir).filter((f) => /^wind_tunnel_\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort().pop();
      if (wt) {
        const wj = readJson(join(tdir, wt));
        if (wj) inputs["threshold proposal pending (the wind tunnel — his card decides, never this page)"] = { file: wt, id: wj.id || null, effect: wj.effect || null };
      }
    } catch (e) { swallow("runJob: readdirSync(tdir) unreadable → ignored", e); }
    prompt = buildDiaryPrompt(job, inputs, cfg.guards.banned_phrases);
  } else if (job.kind === "intent_digest") {
    // Block 2 §7.2 — the day's session-intent rows, GROUPED + CLIPPED by the owner
    // (intent.mjs digestInput), never the raw lane; refuse BEFORE the spend when the
    // day has no session at all (an empty day labelled by a model = invented asks).
    const food = intentDigestInput({ day: today });
    if (!food.sessions.length) {
      return {
        usage: { ok: false, total_tokens: 0, duration_ms: 0, limit_hit: false, error: "no session-intent rows for the day" },
        note: `skipped before spend — session_intent.jsonl has no turn rows for ${today} (nothing to digest; the Stop hook fills it as he works)`,
      };
    }
    intentDigestFood = food;
    inputs[`session intents (${today} · ${food.sessions.length} session(s), grouped + clipped by intent.mjs — heads of his prompts and the replies)`] = food;
    prompt = buildIntentDigestPrompt(job, inputs, cfg.guards.banned_phrases);
  } else if (job.kind === "prepare_tomorrow") {
    // Block 5 §10 — the food is the SITTING'S OWN gather (route/concept/capsule by
    // construction) plus today's reviews, the register line, calibration and nemesis.
    // Refuse BEFORE the spend on a route no voice plan serves: PYTHON (the CLOSE-PACKET
    // loop lives in /learn) and SCRIMMAGE (the dugout's staged mock composes itself).
    const food = deps.prepareFood !== undefined ? deps.prepareFood : await gatherPrepareFood({ now: new Date(now).toISOString() });
    if (!food || !["FORGE", "REJIRAH", "REVISION"].includes(food.route)) {
      return {
        usage: { ok: false, total_tokens: 0, duration_ms: 0, limit_hit: false, error: `route ${food ? food.route : "?"} needs no composed plan` },
        note: `skipped before spend — tomorrow's route is ${food ? food.route : "unknown"} (${food ? food.route_why : "no context"}); a plan is composed only for FORGE · REJIRAH · REVISION`,
      };
    }
    prepareFood = food;
    inputs[`tomorrow's sitting (route · task · capsule strikes · forge step — sitting.mjs's own gather, for ${food.for_day})`] = { route: food.route, why: food.route_why, concept: food.concept, task: food.task_title, kickoff: food.kickoff_line, nextup: food.nextup, forge: food.forge, capsule: food.capsule };
    inputs["today's sitting reviews (what changes next · his asks · the room's words)"] = food.reviews.length ? food.reviews : "(no sitting closed today)";
    inputs["calibration + nemesis (measured — the words the room wanted are register.top_missing)"] = { calibration: food.calibration, weaknesses: food.weaknesses };
    prompt = buildPrepareTomorrowPrompt(job, inputs, cfg.guards.banned_phrases, food);
  } else if (job.kind === "dreams") {
    // H5 — refuse BEFORE the spend when there is nothing to recombine: an
    // empty cracked-axes inventory + a model told to dream anyway = invented
    // cracks (the refuter's trap). The required_absent shape — honest skip,
    // named food, sits out after max_attempts like any deterministic skip.
    const inv = deps.crackedInv !== undefined ? deps.crackedInv : crackedAxesInventory();
    if (!inv.length) {
      return {
        usage: { ok: false, total_tokens: 0, duration_ms: 0, limit_hit: false, error: "cracked-axes inventory empty" },
        note: "skipped before spend — the cracked-axes inventory is EMPTY (dreams need his Re-Jirah rounds or measured scoreboard cracks; few axes = few dreams is honest, none = none)",
        inputs_absent: 1, inputs_declared: 1, inputs_absent_names: ["cracked-axes inventory"],
      };
    }
    inputs["cracked axes (computed inventory — concept×axis, counted)"] = inv;
    inputs["his lexicon (the metaphors his brain runs on)"] = readJson(join(STATE_DIR, "lexicon.json"));
    inputs["known concepts"] = [...new Set([...loadAliasMap(join(STATE_DIR, "concepts.json")).values()])];
    prompt = buildDreamsPrompt(job, inputs, cfg.guards.banned_phrases);
  } else prompt = buildAnalysisPrompt(job, inputs, undefined, cfg.guards.banned_phrases);
  const r = job.engine === "gemini" ? gexec(prompt, cfg.gemini.binary) : exec(prompt, job.model, job.extra_args, undefined, null, deps.thinkTokens || null, job.caching === false);   // G4 — the thinking budget rides through · Phase 4 — and the lane's own caching verdict
  // the absent-input accounting rides EVERY outcome, so the ledger shows what a run
  // was actually built from — including the failures.
  // …and so does the ELISION accounting (10 Aug 2026 wiring audit). An input that is
  // PRESENT but arrives half-eaten was invisible everywhere: the run reported
  // `inputs 4/4 present` while the model saw 8 of 200 rows. Counted off the BUILT
  // PROMPT — clipRows stamps `rows_dropped=<n>` on every cut it makes — so one read
  // covers all six prompt builders with no plumbing threaded through any of them.
  const rowDrops = String(prompt).match(/rows_dropped=(\d+)/g) || [];
  const acct = {
    inputs_absent: gi.absent.length, inputs_declared: gi.declared, inputs_absent_names: gi.absent,
    inputs_clipped: rowDrops.length || null,
    inputs_rows_dropped: rowDrops.length ? rowDrops.reduce((a, m) => a + Number(m.split("=")[1]), 0) : null,
    // …AND THE CUT UPSTREAM OF THE CLIPPER (11 Aug 2026, TRUNCATED_AT_DOOR pass 3). The
    // pair above can only ever see rows the door handed over. A SEPARATE field, never a
    // widening of inputs_rows_dropped: that field's meaning ("rows the clipper elided")
    // is already written into every row since 10 Aug, and folding a second lane into it
    // would make new rows silently incomparable with old ones. Two lanes, one total in
    // the note — the same shape absence and elision already use.
    inputs_rows_door_dropped: gi.door_dropped || null,
    inputs_door_names: gi.door.length ? gi.door.map(d => `${d.name} ${d.read}/${d.on_disk}`) : null,
  };
  if (r.ok && r.text) {
    // `prompt` is threaded in as `shown` (finding #59): buildAnalysisPrompt injects the
    // literal 25 in its own LAWS line plus every fingerprint digit, none of which are in
    // `inputs` — without this the tightened whitelist would bounce the model for numbers
    // the wrapper itself handed it. Same fix the manager already carries.
    const v = validateOutput(job, r.text, inputs, cfg, prompt);
    if (!v.ok) return { usage: { ...r, ok: false, error: "validator: " + v.reason }, note: `rejected (${v.reason}) — nothing written`, ...acct };
    // H4 (10 Aug 2026) — REHEARSAL: a passing draft is read by SIMULATED-NIKHIL
    // (tested edges + doubt grammar + the fingerprint) and revised ONCE if it
    // cracks. Bounded at 2 extra execs; runs only when the phase is not his
    // live study hours AND this beat's headroom covers 2× the draft's own cost
    // (a measured gate — no invented number). Usage is SUMMED into the one
    // returned object so the G1 meter and windowUsage stay honest. A failing
    // revision KEEPS THE DRAFT — a passing draft is never lost to a bad rewrite.
    let rehearseNote = "";
    if (job.rehearse && deps.hr && deps.hr.phase !== "study"
        && (deps.hr.allowed || 0) >= 2 * (r.total_tokens || 0)) {
      const addUsage = (base, x) => {
        for (const k of ["input_tokens", "output_tokens", "cache_creation_tokens", "cache_read_tokens", "total_tokens", "duration_ms"])
          base[k] = (base[k] || 0) + ((x && x[k]) || 0);
      };
      const adv = exec(buildRehearsalPrompt(r.text), job.model, job.extra_args, undefined, null, deps.thinkTokens || null);
      addUsage(r, adv);
      if (adv.ok && adv.text && !/^\s*STANDS\s*$/i.test(adv.text.trim())) {
        const cracks = adv.text.trim();
        const nCracks = (cracks.match(/^\s*\d+[.)]/gm) || []).length || 1;
        const rv = exec(prompt + "\n\nYOUR DRAFT:\n" + r.text
          + "\n\nSIMULATED-NIKHIL READ IT AS HIM AND FOUND THESE CRACKS:\n" + cracks
          + "\n\nRewrite the FULL reply fixing ONLY the cracks — every law above still binds, the trailing fenced json block included.",
          job.model, job.extra_args, undefined, null, deps.thinkTokens || null);
        addUsage(r, rv);
        if (rv.ok && rv.text && validateOutput(job, rv.text, inputs, cfg, prompt).ok) {
          r.text = rv.text;   // the sibling below parses from the FINAL, for free
          rehearseNote = ` · rehearsed: ${nCracks} crack(s), REVISED`;
        } else rehearseNote = ` · rehearsed: ${nCracks} crack(s), revision failed — DRAFT KEPT`;
      } else if (adv.ok) rehearseNote = " · rehearsed: STANDS";
      else rehearseNote = " · rehearsal exec failed — draft stands";
    }
    // WHICH DATE THE ARTIFACT IS FOR (2 Aug 2026 audit, finding #65). The write used to
    // hardcode `today` = shiftDay(), which is YESTERDAY for any overnight job run before
    // 07:30 — and the night shift fires 02:40–03:00. viz reads the CALENDAR date, so
    // ~675k tokens/week of poster + gemini_wall + wall_insights landed in filenames viz
    // can never open (club/poster.svg frozen at 21 Jul). Fixed at the PRODUCER, not with
    // a viz-side lookback — a lookback fights posterFlag's freshness law and would serve
    // a two-day-old poster as today's. serveDate() already proves this on the mp3 lane.
    // shiftDay REMAINS the ledger/eligibility key; only the filename moves, and only for
    // jobs that explicitly declare `serve`.
    const outDay = outDate(job, now, today);
    if (!dry) writeAtomic(join(OUT_DIR, job.out || job.id, outDay + ".md"), r.text);
    // KAAM 1 (10 Aug 2026) — THE ALLOWED-SET SNAPSHOT, or: why "The read" died.
    // Two validators were judging the same text against DIFFERENT allowed-sets.
    // Here the prompt rides in as `shown` (line above), so every digit the wrapper
    // itself handed the model is legal. viz re-validates the SAME file hours later
    // with `shown = ""` — it never held the prompt — so anything the model quoted
    // from its own instructions bounced, and the panel rendered "held at the gate"
    // on all 4 nights with evidence. Only 1 of those 4 deaths was the self-dated
    // header; the other two were a derived count and a quoted session date, and
    // NEITHER is fixed by stripping a title line. This sidecar is that fix: the
    // producer records the exact set it judged by, and the consumer judges by the
    // same set. Not a loosening — it is the identical set, moved, so that one text
    // cannot be legal at 03:00 and invented at 07:38.
    // NUMBERS ONLY, never the prompt itself: the prompt carries his cognitive
    // fingerprint and his live state, brain_out is on disk beside a PUBLIC repo,
    // and the validator needs nothing but the tokens.
    // Its reader is named: viz.mjs readInsights (wall_insights). Other
    // no_new_numbers jobs get it for free on the same line; a job whose output
    // nobody re-validates simply has an unread 200-byte sidecar, which costs zero
    // tokens — this is derived data, not a generated artifact, so the
    // "never produce what nothing reads" law is not in play.
    if (!dry && job.validate === "no_new_numbers") {
      writeAtomic(join(OUT_DIR, job.out || job.id, outDay + ".allowed.json"), JSON.stringify({
        job: job.id, out_day: outDay, written_at: new Date(now).toISOString(),
        why: "the exact allowed-number set this output was judged against — any downstream re-validation must use THIS, not a fresh set built from a later state",
        allowed: [...allowedNumbersShared(inputs, prompt)],
      }, null, 2));
    }
    // THE ADDRESS, said out loud (finding #63). This note is what the ledger row carries
    // and what `brain status` echoes, so a file written for a human to glance at finally
    // names itself somewhere he can see.
    const srf = jobSurface(job);
    let note = `→ brain_out/${job.out || job.id}/${outDay}.md`
      + (srf.where ? ` · reads at: ${srf.where}` : " · ⚠ NO SURFACE DECLARED — nothing points at this file")
      + rehearseNote
      + (gi.absent.length ? ` · inputs ${gi.present}/${gi.declared} present (absent: ${gi.absent.join(", ")})` : "")
      // the elision rides the SAME note (10 Aug 2026 wiring audit), so the one string the
      // ledger carries and `brain status` echoes can no longer say a job read a log whole
      // when it read 8 rows of 200. Present-but-half-eaten was the invisible failure.
      // 11 Aug 2026: it said "never reached the model" while counting ONE of the two cuts
      // — the door's tail was upstream and unmeasured, so the sentence under-reported by
      // exactly the rows that never left disk (measured: 184 printed, 209 true, of 225).
      // Now BOTH cuts are named separately and the total is stated, because the total is
      // the number that was wrong.
      + (acct.inputs_clipped ? ` · ⚠ ${acct.inputs_clipped} input(s) CLIPPED — ${acct.inputs_rows_dropped} log row(s) elided at the clipper` : "")
      + (acct.inputs_rows_door_dropped ? ` · ⚠ ${gi.door.length} input(s) TAIL-CUT AT THE DOOR — ${acct.inputs_rows_door_dropped} older row(s) never left disk (${acct.inputs_door_names.join(", ")})` : "")
      + (((acct.inputs_rows_dropped || 0) + (acct.inputs_rows_door_dropped || 0))
        ? ` · ${(acct.inputs_rows_dropped || 0) + (acct.inputs_rows_door_dropped || 0)} log row(s) never reached the model in total` : "");
    // P2 — the machine sibling: same call, same outDay, derived by parsing the
    // trailing fenced json AFTER the validator passed. A parse miss is
    // degradation said out loud in the note, never a thrown error. H2/H6
    // (10 Aug 2026) generalized the night_coach mechanism into a per-kind
    // parser map — agenda's sibling is SANITIZED at parse (allocates only),
    // diary's carries the one deterministic will_change line its readers need.
    if (SIBLING_PARSERS[job.kind]) {
      const sib = SIBLING_PARSERS[job.kind](r.text, cfg);
      if (sib && !dry) writeAtomic(join(OUT_DIR, job.out || job.id, outDay + ".json"), sib);
      const detail = sib && job.kind === "night_coach" ? `: ${sib.misconceptions.length} misconception(s)`
        : sib && job.kind === "agenda" ? `: ${Object.keys(sib.allocations).length} allocation(s)${sib.dropped ? `, ${sib.dropped.length} dropped` : ""}`
        : sib && job.kind === "prepare_tomorrow" ? `: ${sib.route} '${sib.task && sib.task.title}' · ${sib.units.length} unit(s) — sitting.mjs open prefers it tomorrow`
        : "";
      note += sib ? ` + ${outDay}.json (machine sibling${detail})`
        : job.kind === "prepare_tomorrow" ? ` · PLAN REFUSED by sitting's validator (${prepareLastRefusal || "no fenced json"}) — nothing written; the sitting will compose live at open (degraded, not fatal)`
          : " · json sibling ABSENT — no valid fenced json in the reply (degraded, not fatal)";
    }
    // MEDIA ENGINE: speak_to jobs render their validated text to an mp3 in
    // club/media/ (speak.mjs synthToFile — earClean inside). Offline = honest
    // skip; the text output stands either way.
    if (!dry && job.speak_to) {
      try {
        const { synthToFile } = await import("./speak.mjs");
        const target = join(STATE_DIR, "..", "club", "media", job.speak_to.replace(/DATE/g, serveDate(job, now)));
        const sp = await synthToFile(r.text, target);
        note += sp.wrote ? ` · 🎙 ${job.speak_to.replace(/DATE/g, serveDate(job, now))}` : ` · mp3 skipped (${sp.error})`;
      } catch (e) { note += ` · mp3 skipped (${String(e.message).slice(0, 60)})`; }
    }
    return { usage: r, note, ...acct };
  }
  return { usage: r, note: r.limit_hit ? "PLAN LIMIT observed — ceiling recorded, backing off" : `failed: ${r.error}`, ...acct };
}

// which date an audio artifact SERVES: overnight-compiled morning talks are
// for tomorrow (when run in the evening half of the night), else today.
function serveDate(job, now) {
  return job.serve === "next_morning" && now.getHours() >= 15 ? localDate(new Date(now.getTime() + 86400000)) : localDate(now);   // day-key: WALL-CLOCK by design (which morning follows THIS run)
}

// WHICH DATE THE .md ARTIFACT IS FILED UNDER (2 Aug 2026 audit, finding #65).
// Pure, so the seam is testable. Two different questions, deliberately kept apart:
//   · shiftDay  — WHICH SHIFT this run belongs to. Stays the ledger and eligibility key,
//                 so the overnight shift is still ONE shift across midnight and an
//                 00:30 re-run cannot claim a second daily slot.
//   · serveDate — WHICH MORNING the artifact is FOR. Only jobs that declare `serve`
//                 use it, so nothing else moves: dugout_digest at 00:30 still files
//                 under the evening it started, and day_cartridge still finds it.
// Without this split, `writeAtomic(..., today + ".md")` filed the poster, the Gemini
// render and the wall's "The read" under YESTERDAY (shiftDay returns yesterday for any
// overnight job run before 07:30, and the night shift fires 02:40–03:00) while viz
// opened the calendar date — ~675k tokens/week into filenames viz can never open.
function outDate(job, now, shiftToday) {
  return job && job.serve ? serveDate(job, now) : shiftToday;
}

// "team talk taiyaar" rides INSIDE the two sanctioned utterances (never a
// third push): the 08:45 sheet gets the am line, the 21:30 bell the pm line.
function teamtalkLine(slot, now = new Date(), dir = join(STATE_DIR, "..", "club", "media")) {
  const f = `teamtalk_${dayKey(now)}_${slot}.mp3`;
  return existsSync(join(dir, f)) ? `🎙 team talk taiyaar — club/media/${f}` : null;
}

// ---------------------------------------------------------------------------
// TICK — the deterministic heartbeat of the hot brain
// ---------------------------------------------------------------------------
async function tick(cfg, deps) {
  const { now } = deps;
  if (cfg.guards.refuse_if_api_key_env && process.env.ANTHROPIC_API_KEY) {
    console.log("brain: REFUSING — ANTHROPIC_API_KEY is set in this shell (per-token billing risk). Unset it; the brain runs on the Max subscription only.");
    return { ran: [], refused: true };
  }
  // LADDER E3 (9 Aug 2026): the ledger rolls at 2 MB — run_logged.cmd's own
  // measured precedent, one generation kept. Rolled HERE and ONLY here: brain.mjs
  // alone rolls its ledger (talk.mjs is a second APPENDER, never a roller — two
  // rollers racing the rename is how a journal loses rows). Tail readers
  // (failureStreak's last-25, the card organ's gemini tail) ride the hot file.
  if (!deps.ledger && !deps.dry) {
    try { if (statSync(LEDGER).size > 2 * 1024 * 1024) { rmSync(LEDGER + ".1", { force: true }); renameSync(LEDGER, LEDGER + ".1"); } } catch (e) { swallow("tick: statSync(LEDGER) absent → ignored", e); }
  }
  // HERMETIC-TEST SEAM (E2E audit 25 Jul 2026): tick() used to always read the
  // LIVE ledger/queue, so the selftest's mocked clock saw real rows and the two
  // tick checks went red the moment the machine had history. Production passes
  // neither dep and behaves exactly as before.
  const ledger = deps.ledger || readLines(LEDGER);
  const queueState = deps.queueState || readJson(QUEUE) || { observed_window_ceiling: null, jobs_run: {} };
  const today = dayKey(now);   // Block 6 — the tick's day-key (a chain child = the chain's day)
  queueState.jobs_run = queueState.jobs_run || {};
  queueState.jobs_run[today] = queueState.jobs_run[today] || {};

  // LADDER G2 (9 Aug 2026): the ceiling learns from ANY lane's wall — not only a
  // limit the tick itself hits. Council, nightshift, cortex and the pulse all
  // write limit_hit rows onto the SHARED ledger now (G1); each unprocessed one is
  // an observation of the account's real ceiling at its own moment. SHARE-AWARE
  // by construction: window_capacity_est is the organism's SHARE of one account
  // (G3's split ruling), so a wall seen by any lane is evidence about the same
  // shared ceiling. The cursor starts at 2026-08-07 so the one empirical datum on
  // record — the 2026-08-07T19:16 session wall — is the first observation fed in.
  if (cfg.budget && cfg.budget.self_tune) {
    const cursor = queueState.foreign_limit_seen_ts || "2026-08-07T00:00:00.000Z";
    let newest = cursor;
    for (const r of ledger) {
      if (!(r && r.limit_hit === true && typeof r.ts === "string" && r.ts > cursor)) continue;
      const at = new Date(r.ts);
      if (isNaN(at.getTime())) continue;
      const observed = windowUsage(ledger.filter(x => x && x.ts && x.ts <= r.ts), at, cfg.budget.window_hours);
      queueState.observed_window_ceiling = blendCeiling(queueState.observed_window_ceiling, observed, cfg.budget.window_capacity_est_tokens);
      if (r.ts > newest) newest = r.ts;
    }
    queueState.foreign_limit_seen_ts = newest;
  }

  // THE DEAD-BRAIN ALARM, spoken every tick (E2E audit 25 Jul 2026 — live):
  // four days of "Not logged in" and the runtime never once said it was blind.
  // PAUSED, OUT LOUD. A quiet brain and a paused brain look identical from the
  // outside, and this organism has already lost four days to that exact ambiguity.
  // #106: a have/need counter, never a bare word. "all 23 jobs" was already drifting from
  // the truth the moment #63 turned four of them off — the pause holds the ENABLED ones,
  // and the difference between the two numbers is itself information.
  if (cfg.paused) {
    const all = (cfg.jobs || []).length, on = (cfg.jobs || []).filter(j => j.enabled !== false).length;
    console.log(`brain: PAUSED — ${on}/${all} enabled LLM jobs held by brain_config.paused (${all - on} are separately disabled, each with a stated reason). Capture, sensors and the deterministic squad still run. Un-pause: set "paused": false.`);
  }

  const health = failureStreak(ledger);
  if (health.dead) {
    console.error(`brain: ⚠⚠ DEAD BRAIN — the last ${health.streak} of ${health.sampled} calls ALL FAILED. ${health.hint}`);
  }

  const ran = [];
  const consumedTriggers = [];
  const consumedForces = [];
  // THE GATE (overhaul §5) sits BEFORE the headroom check: an asleep lane must never
  // consume headroom, block the lanes behind it, or burn an attempt. Verdicts are
  // computed for the ELIGIBLE jobs only (in-window, slot open) — "an asleep lane
  // re-checks every scheduled slot" — and a transition journals ONE row + files ONE
  // card through captains_call's own CLI. Same state as last time = silence.
  const gctx = gateContext(deps, now, ledger, queueState);
  const awake = [];
  const sleptNow = [];
  const gated = [];   // asleep lanes this beat — reported beside `ran`, never inside it (a sleep is not an attempt)
  for (const job of eligibleJobs(cfg, queueState, now, dugoutMinutesToday(now))) {
    const v = gateVerdictFor(job, cfg, gctx);
    gateTransition(job.id, v, { now, dry: deps.dry, prevState: gctx.states.get(job.id) || null, collectCards: sleptNow, appendJournal: deps.appendJournal, cfg });
    if (v.run) awake.push({ job, verdict: v });
    else gated.push({ job: job.id, why: failedLetters(v.why).join("+"), verdict: v });
  }
  if (!deps.dry && sleptNow.length) gateCardsForTick(sleptNow, now, deps.fileCard ? { fileCard: deps.fileCard } : {});
  for (const { job, verdict } of awake) {
    const h = headroom(cfg, ledger.concat(ran.map(r => r.ledgerRow).filter(Boolean)), queueState, now, deps.signals);
    if (h.allowed <= 0) {
      // …and the reason is now KEPT (see recordBudgetBlock above). The row copies the
      // agenda:skip precedent exactly — engine that is not "claude" (windowUsage counts
      // only claude rows, so a starvation can never read as spend) and NO boolean `ok`
      // (failureStreak samples boolean-ok rows; a fake ok:true would reset the dead-brain
      // alarm across a starved night, a fake ok:false would fake a dead brain).
      const why = `budget (${h.phase}: ${h.used}/${h.cap})`;
      const blk = recordBudgetBlock(queueState, job, h, now, cfg);
      const brow = { ts: now.toISOString(), job: job.id, engine: "budget", model: null,
        total_tokens: 0, duration_ms: 0, budget_skip: true,
        phase: h.phase, budget_used: h.used, budget_cap: h.cap, shift_day: blk.shift_day,
        note: `budget:skip — ${why}; nothing spent, slot NOT consumed, the job retries the moment headroom returns` };
      // ONE row per (shift day, job) — the episode, not the beat. queueState.beats counts
      // the rest, and `brain status` / token_vitals.json read it from there.
      if (blk.first && !deps.dry) appendFileSync(LEDGER, JSON.stringify(brow) + "\n");
      ran.push({ job: job.id, skipped: why, ledgerRow: blk.first ? brow : null });
      break;
    }
    // H2 (10 Aug 2026) — THE AGENDA'S HAND, economize-only. Tonight's file is
    // keyed on the job's own shiftDay (stable across midnight for overnight
    // jobs — brain.mjs:688-692; the sanitizer already scoped allocations to
    // the overnight window, so a resolvable allocation is the only kind here).
    const alloc = agendaAllocationFor(job, cfg, now);
    if (alloc && alloc.depth === "skip") {
      if (!laneRestable(job)) {
        // the skip-safety gate: one night's rest is legal only while the lane's
        // newest file is younger than ONE declared period (24h) — reconcile's
        // own staleness bar is two periods (48h), so a legal skip can never
        // bleed, and a lane already starved by a failed/dead night is protected
        // no matter what yesterday's agenda believed (refuter-closed hole).
        alloc.depth = "lean"; alloc.why = `skip demoted — lane not fresh enough to rest (${alloc.why || ""})`;
      } else {
        // a REAL night's rest: ALL slots consumed (the capsule_premap
        // max_per_day:3 lesson — one recordJobRun would leave 2 live slots),
        // ONE ledger row with NO boolean ok — failureStreak samples only
        // boolean-ok rows (:628), and a fake ok:true would reset the
        // dead-brain alarm across a night of skips.
        const sd = shiftDay(job, now, cfg);
        queueState.jobs_run = queueState.jobs_run || {};
        queueState.jobs_run[sd] = queueState.jobs_run[sd] || {};
        queueState.jobs_run[sd][job.id] = job.max_per_day || 1;
        const srow = { ts: now.toISOString(), job: job.id, engine: "agenda", model: null,
          total_tokens: 0, duration_ms: 0, agenda_skip: true,
          note: `agenda:skip (${alloc.why || "no why given"})` };
        if (!deps.dry) appendFileSync(LEDGER, JSON.stringify(srow) + "\n");
        ran.push({ job: job.id, skipped: `agenda:skip (${alloc.why || ""})`, ledgerRow: srow });
        continue;
      }
    }
    // queueState rides along so runJob can claim the day's ONE morning utterance
    // (`mouth_said`) — a failed llm keeps its slot and retries, and without this the
    // existence-gated push would fire once per attempt.
    // LADDER G4 (9 Aug 2026): extended thinking, funded by the idle pool —
    // maxThinkingFor was built, tested, EXPORTED, and never called by the
    // runtime. The phase + this beat's own headroom derive the budget (study
    // 16k, overnight 48k, always ≤ half the allowed window); claudeExec turns
    // it into MAX_THINKING_TOKENS. Depth before breadth: 12 overnight jobs ×
    // 48k thinking is idle-pool-funded 4.6× over.
    // H2: "lean" borrows the study phase's own 16k constant — no new number;
    // absent allocation (or any non-overnight job) = the phase default (G4).
    const thinkPhase = alloc && alloc.depth === "lean" ? "study" : h.phase;
    const { usage, note, inputs_absent, inputs_declared, inputs_absent_names, inputs_clipped, inputs_rows_dropped, inputs_rows_door_dropped, inputs_door_names } = await runJob(job, cfg, { ...deps, queueState, hr: h, thinkTokens: maxThinkingFor(thinkPhase, h.allowed).max_thinking_tokens });
    const row = {
      ts: now.toISOString(), job: job.id, engine: job.engine || "claude", model: job.model || null,
      input_tokens: usage.input_tokens ?? null, output_tokens: usage.output_tokens ?? null,
      // the cache pair rides the row too (E2E audit 25 Jul 2026) — total_tokens now
      // includes it, so the components must be visible or the ledger can't be audited.
      cache_creation_tokens: usage.cache_creation_tokens ?? null, cache_read_tokens: usage.cache_read_tokens ?? null,
      total_tokens: usage.total_tokens || 0, duration_ms: usage.duration_ms || 0,
      ok: usage.ok, error: usage.error || null, limit_hit: !!usage.limit_hit,
      // HOW THE CALL WAS SENT (14 Aug 2026, unleash Phase 1): "system" = the stable
      // head rode --system-prompt and can be cache-READ next run · "argv-capped" =
      // the head was too long for Windows argv and went the old single-block way ·
      // null = no ## INPUT section, nothing to hoist (or the split is switched off).
      // Additive: rows written before today read as UNMEASURED, not as a measured no.
      split: usage.split || null,
      // THE ONE FACT NEEDED TO DEBUG A SILENT MOUTH, finally written down (1 Aug 2026
      // audit): runJob has always built `sheet source=… (reason)`, and the row literal
      // has always dropped it. 0 of 2,811 rows carried it, stdout goes nowhere (the
      // daemon runs through hidden_run.vbs with the window hidden), and manager_notes.json
      // holds only the LAST run — so every earlier morning's verdict was unrecoverable.
      note: note || null,
      // WHAT THIS RUN WAS ACTUALLY BUILT FROM (2 Aug 2026 audit, finding #64). Eight
      // enabled jobs declare inputs that do not exist and 85 teamtalk_am runs billed full
      // price on 3-of-4 absent — with nothing anywhere recording it. A have/need pair,
      // never a bare "ok": `null` here means the job declared no inputs at all (the
      // manager_m3 class), which is different from "all inputs present".
      inputs_present: typeof inputs_declared === "number" ? inputs_declared - inputs_absent : null,
      inputs_declared: typeof inputs_declared === "number" ? inputs_declared : null,
      inputs_absent: typeof inputs_absent === "number" ? inputs_absent : null,
      inputs_absent_names: (inputs_absent_names && inputs_absent_names.length) ? inputs_absent_names : null,
      // PRESENT IS NOT THE SAME AS WHOLE (10 Aug 2026 wiring audit). The have/need pair
      // above counts FILES; these count what the budget ate on the way in. A run that
      // reads `inputs 4/4 present · 1 clipped · 192 rows dropped` is telling the truth
      // the old row could not: the file was there and the model still never saw the day.
      // null (not 0) when nothing was cut — same no-bare-"ok" rule as the pair above.
      inputs_clipped: inputs_clipped ?? null,
      inputs_rows_dropped: inputs_rows_dropped ?? null,
      // …AND THE CUT BEFORE THE CLIPPER (11 Aug 2026). The pair above counts the second
      // cut only; the door's 200-row tail happened upstream and was recorded nowhere, so
      // the row's own numbers under-stated the loss by the rows that never left disk.
      // Its own field, so a row written before today reads as UNMEASURED on this lane
      // rather than as a measured zero (clippedEvidenceHistory keeps that distinction).
      inputs_rows_door_dropped: inputs_rows_door_dropped ?? null,
      inputs_door_names: (inputs_door_names && inputs_door_names.length) ? inputs_door_names : null,
    };
    if (!deps.dry) appendFileSync(LEDGER, JSON.stringify(row) + "\n");
    // a FAILED job does not consume its daily slot — it retries next tick
    // (e.g. gemini before the captain's one-time login, or a transient claude
    // error). Success is what spends the slot.
    if (usage.ok) recordJobRun(queueState, job, now, cfg);
    // …but the ATTEMPT is counted either way (E2E audit 25 Jul 2026), so a job that
    // fails deterministically — validator always rejects, CLI logged out — cannot
    // re-run on every 75s beat forever at full model cost. A plan-limit backoff is
    // NOT the job's fault, so it doesn't burn an attempt.
    else if (!usage.limit_hit) recordJobFail(queueState, job, now, cfg);
    // THE GATE — a `once` force is spent by the ATTEMPT (success or failure): it
    // bought one run through the F guard, and a success clears the streak on the
    // ledger by itself; a failure means the same failure repeated and F holds again.
    // `until` (the C force) stays — his 'na' bought the whole window.
    if (verdict.forced && verdict.forced.once && !usage.limit_hit) {
      const f = queueState.gate && queueState.gate.forced && queueState.gate.forced[job.id];
      if (f) { f.once = false; consumedForces.push(job.id); }
    }
    // consumed — but a trigger SHARED by several jobs (Block 5.2: teamtalk_pm + evening_voice
    // both ride `fulltime`) is spent only when EVERY enabled job that declares it has run this
    // shift; the first success used to delete it and starve the second job for the day.
    if (usage.ok && job.trigger && queueState.triggers) {
      const siblings = (cfg.jobs || []).filter((j) => j.enabled !== false && j.trigger === job.trigger && j.id !== job.id);
      const allDone = siblings.every((j) => ((queueState.jobs_run[shiftDay(j, now, cfg)] || {})[j.id] || 0) >= (j.max_per_day || 1));
      if (allDone) { delete queueState.triggers[job.trigger]; consumedTriggers.push(job.trigger); }
    }
    if (usage.limit_hit && cfg.budget.self_tune) {
      // a limit event means we spent ~the plan's true capacity — record the
      // ACTUAL window usage, but never below the conservative estimate (a
      // limit at low observed-usage is a false read, not a 1-token ceiling).
      // E2E audit 25 Jul 2026: the observation read the START-OF-TICK ledger only,
      // so the drain that CAUSED the limit was invisible — a limit hit after
      // 900k of in-tick spend was recorded as "the ceiling is ~0 observed", which
      // then dragged the learned ceiling DOWN toward the estimate. Observe the
      // same augmented view the per-job headroom check already uses, plus this row.
      const observed = windowUsage(ledger.concat(ran.map(r => r.ledgerRow).filter(Boolean)).concat([row]), now, cfg.budget.window_hours);
      queueState.observed_window_ceiling = blendCeiling(queueState.observed_window_ceiling, observed, cfg.budget.window_capacity_est_tokens);
      ran.push({ job: job.id, note, ledgerRow: row });
      break;                                                    // back off the moment the plan says stop
    }
    ran.push({ job: job.id, note, ledgerRow: row });
  }
  // ---- THE MORNING THAT NEVER CAME — absence speaks, once, out loud ----------
  // RC-4 of the 1 Aug 2026 audit: this organism detects FAILURE and never ABSENCE.
  // failureStreak() samples logged calls, and a job that never ran logs nothing — so
  // formation_read missing on 19/22/23/24/25/27/28/29/31 Jul (9 of 15 days, laptop
  // asleep clean through 07:30–12:00) produced no row, no bleed, no alarm, while
  // `brain status` kept printing "health OK". team_sheet.md just sat there stale,
  // yesterday's sheet reading as today's. Nine days before the captain noticed.
  // The bell already refuses to ring late and SAYS SO; the sheet now does the same.
  // Shares `mouth_said[day]` with the sheet push, so the morning slot still speaks
  // at most once — this is that one utterance when there was nothing to announce.
  try {
    const sheetJob = (cfg.jobs || []).find(j => j.enabled !== false && (cfg.ntfy.push_after || []).includes(j.id));
    // B2 (9 Aug 2026, launch worklist): an "any"-window sheet closed at "24:00" — an
    // hour hhmm() can never reach — so this whole block was mathematically unreachable,
    // the exact silent absence it exists to kill. An at-anchored job now gets a MORNING
    // deadline (at + 90min); a windowed job keeps its close, clamped inside the clock.
    const addMin = (hm, m) => { const [H, M] = String(hm).split(":").map(Number); const t = H * 60 + M + m; return `${String(Math.floor(t / 60) % 24).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`; };
    const winClose = (jobWindows(cfg)[sheetJob?.window] || jobWindows(cfg).any)[1];
    const closeHM = sheetJob?.at ? addMin(sheetJob.at, 90) : (winClose >= "24:00" ? "23:59" : winClose);
    if (!deps.dry && sheetJob && hhmm(now) >= closeHM
        && !(queueState.jobs_run[today] || {})[sheetJob.id]
        && mouthMaySpeak(cfg, queueState, today, sheetJob.id)) {
      const tried = attemptsOn(queueState, today, sheetJob.id);
      const why = tried > 0
        ? `it ran ${tried}× and failed every time`
        : `the ${sheetJob.window} window closed and it never ran — the machine was not awake for it`;
      const r = await pushNtfy(cfg, SHEET_ABSENCE_TITLE,
        `**No sheet this morning, captain.**\n\n${why}.\n\nNothing is lost — the wall and the state are untouched, and yesterday's sheet is still on disk (do not read it as today's). Open the laptop and ask for it whenever you want.`,
        undefined, { tags: "soccer,mute" });
      if (r.sent) { queueState.mouth_said = queueState.mouth_said || {}; queueState.mouth_said[today] = "absence"; }
      recordMouth("sheet-absence", r);   // E4 — the attempt is a row either way
      console.log(`brain: ${sheetJob.window} window closed with no ${sheetJob.id} — ${r.sent ? "said so on the phone" : "phone unreachable (" + r.why + "), will say it next beat"}`);
    }
  } catch (e) { console.error(`brain: absence check failed — ${e.message}`); }

  queueState.last_tick = now.toISOString();
  if (!deps.dry) {
    // LOST-UPDATE FIX (E2E audit 25 Jul 2026): the queue object is read once at
    // beat start and written whole at beat end, minutes of LLM calls later. A
    // `brain trigger <name>` fired in between (postmatch auto-arms 'reanalysis')
    // wrote its armed trigger to disk — and this write silently erased it, so the
    // event-triggered re-analysis never happened and nothing reported it. Re-read
    // at write time and keep the disk's triggers, minus the ones we just consumed.
    writeAtomic(QUEUE, mergeTriggers(readJson(QUEUE), queueState, consumedTriggers, consumedForces));
    try { writeAtomic(TOKEN_VITALS, tokenVitals(cfg, readLines(LEDGER), queueState, now, deps.signals)); } catch (e) { swallow("tick: writeAtomic(TOKEN_VITALS) unwritable → ignored", e);}
  }
  return { ran, refused: false, gated };
}

// ---------------------------------------------------------------------------
// ARMING A TRIGGER — the OWNER's function (overhaul Block 1, 18 Aug 2026; xray Q2).
// ---------------------------------------------------------------------------
// conductor.mjs used to write brain_queue.json itself to arm `morning_signals` — a
// second writer of this file's state, and xray named it a law breach every night. The
// body below is conductor's own armTrigger, MOVED here verbatim in its rules (a guest
// may ADD a key, never RESET the file: absent ⇒ create · readable ⇒ merge · present-
// but-unreadable ⇒ REFUSE, return false, touch nothing) — now called by conductor
// through this export and by this file's own `trigger` CLI, which until today reset an
// unreadable queue to a two-key default (the exact wipe conductor's note documents).
// `queuePath` is a parameter for the same reason conductor's `dir` was: the conductor
// selftest arms a REAL file in a fresh temp dir. The write rides writeAtomic, whose
// site is already resolved for the analyser (constant callers), so this adds no sink.
export function armTrigger(name, reason, { queuePath = QUEUE, now = new Date() } = {}) {
  let q = { observed_window_ceiling: null, jobs_run: {} };   // cold checkout only
  if (existsSync(queuePath)) {
    let disk = null;
    try { disk = JSON.parse(readFileSync(queuePath, "utf8")); } catch (e) { swallow("armTrigger: readFileSync(queuePath) unreadable → ignored", e); }
    // `null`, `[]` and `"…"` all parse cleanly and are still not this file's shape —
    // spreading a trigger onto any of them and writing it back is the same wipe.
    if (!disk || typeof disk !== "object" || Array.isArray(disk)) return false;
    q = disk;
  }
  q.triggers = q.triggers || {};
  q.triggers[name] = { ts: now.toISOString(), reason: reason || null };
  writeAtomic(queuePath, JSON.stringify(q, null, 2));
  return true;
}

// the merge itself, pure and testable: brain owns every key EXCEPT `triggers`,
// which a separate `brain trigger` process arms at any moment. Disk wins on
// triggers (it is the freshest arming), we win on everything else, and anything
// this tick consumed stays consumed.
// THE GATE'S FORCES (18 Aug 2026) ride the same rule: `brain gate wake <lane>` (by
// hand, or dispatched by his 'na' on a card) writes gate.forced[lane] to disk at any
// moment, and this tick's whole-object write must not erase it. Disk wins on forces
// EXCEPT for a `once` this tick just spent (consumedForces) — that stays spent.
function mergeTriggers(disk, mine, consumed = [], consumedForces = []) {
  if (!disk || typeof disk !== "object") return mine;
  const triggers = { ...(disk.triggers || {}) };
  for (const k of consumed) delete triggers[k];
  const mineForced = (mine.gate && mine.gate.forced) || {};
  const diskForced = (disk.gate && disk.gate.forced) || {};
  const forced = { ...mineForced, ...diskForced };
  for (const lane of consumedForces) if (forced[lane]) forced[lane] = { ...forced[lane], once: false };
  const gate = { ...(mine.gate || {}), forced };
  return { ...mine, triggers, gate };
}

// ---------------------------------------------------------------------------
// selftest — mock executors; tmp state; no real LLM calls, no real writes
// ---------------------------------------------------------------------------
async function selftest() {
  const checks = [];
  const assert = (name, cond) => { checks.push([name, !!cond]); console.log(`  ${cond ? "✓" : "✗"} ${name}`); };
  // The committed config is the fixture — it must parse. But the RUNTIME SWITCHES in it
  // are the captain's, not the suite's: on 2 Aug he paused the brain and disabled the
  // pulse, and 21 assertions went red without a line of logic changing. A suite whose
  // verdict depends on his current settings tests his settings, not the code. Every
  // switch is therefore forced to its RUNNING value here, and each switch has its own
  // dedicated assertions (PAUSE — …, PULSE — disabled …) that pass it explicitly.
  const liveCfg = loadConfig();
  const cfg = { ...liveCfg, paused: false, pulse: { ...(liveCfg.pulse || {}), enabled: true } };
  assert("committed brain_config.json parses with jobs", cfg.jobs.length >= 10);
  assert("the suite reads the captain's real switches without obeying them", typeof liveCfg.paused === "boolean");
  assert("day cartridge job wired (L3: slow brain programs the fast brain)", cfg.jobs.some(j => j.id === "day_cartridge" && j.window === "overnight" && j.validate === "no_new_numbers" && String(j._note).includes("second person")));

  // THE THIRD POOL (U3d) — voice minutes shift daytime gemini text jobs aside
  {
    const poolCfg = { ...cfg, gemini: { enabled: true }, dugout_pool: { enabled: true, gemini_defer_threshold_min: 30 }, jobs: [{ id: "g1", engine: "gemini", window: "any", priority: 5 }, { id: "c1", engine: "claude", window: "any", priority: 5 }] };
    const day = new Date(2026, 6, 12, 14, 0), night = new Date(2026, 6, 12, 23, 0);
    assert("heavy voice day → daytime gemini job steps aside", !eligibleJobs(poolCfg, {}, day, 45).some(j => j.id === "g1"));
    assert("claude jobs untouched by the voice pool", eligibleJobs(poolCfg, {}, day, 45).some(j => j.id === "c1"));
    assert("quiet voice day → gemini runs as normal", eligibleJobs(poolCfg, {}, day, 5).some(j => j.id === "g1"));
    assert("overnight gemini runs regardless (voice is asleep)", eligibleJobs(poolCfg, {}, night, 500).some(j => j.id === "g1"));
    assert("minutes ledger math: missing file → 0 (never crashes)", dugoutMinutesToday(day, "no-such-ledger-xyz.jsonl") === 0);
    assert("pool committed to canon config", !!cfg.dugout_pool && cfg.dugout_pool.enabled === true);
  }

  // A2 (9 Aug 2026) — the sheet really does wait on its inputs, and a dead
  // conductor delays it but can never starve it (trigger_fallback_hm).
  {
    const trigCfg = { ...cfg, jobs: [{ id: "t1", engine: "claude", window: "any", at: "08:45", priority: 5, trigger: "morning_signals", trigger_fallback_hm: "09:30" }] };
    const at850 = new Date(2026, 6, 12, 8, 50), at931 = new Date(2026, 6, 12, 9, 31);
    assert("A2 — unarmed trigger gates the job before the fallback hour", !eligibleJobs(trigCfg, { triggers: {} }, at850).some(j => j.id === "t1"));
    assert("A2 — armed trigger opens the gate", eligibleJobs(trigCfg, { triggers: { morning_signals: { ts: "x" } } }, at850).some(j => j.id === "t1"));
    assert("A2 — past the fallback the gate opens even unarmed", eligibleJobs(trigCfg, { triggers: {} }, at931).some(j => j.id === "t1"));
    assert("A2 — formation_read carries the trigger + fallback in canon config", (() => { const f = cfg.jobs.find(j => j.id === "formation_read"); return f && f.trigger === "morning_signals" && !!f.trigger_fallback_hm; })());
    // THE ARM EXPIRES WITH ITS SHIFT (11 Aug 2026, dead-wire pass). Real dates, and
    // the real damage shape: the live file carried an arm stamped 03:45 on 10 Aug and
    // it was still opening the 08:45 gate on 11 Aug, before that morning's conductor
    // had refreshed a single signal. at845_11 is BEFORE the 09:30 fallback on purpose
    // — that is the only window where a stale arm can do harm, and the only window
    // where this assertion can catch it.
    const at845_11 = new Date(2026, 7, 11, 8, 45);
    const staleArm = { triggers: { morning_signals: { ts: "2026-08-10T03:45:11.892Z", reason: "morning conductor: 5 signal organs fresh" } } };
    const freshArm = { triggers: { morning_signals: { ts: new Date(2026, 7, 11, 8, 15).toISOString(), reason: "same morning" } } };
    assert("A2 — an arm from a PREVIOUS shift does NOT open today's gate (ts is read, not decoration)",
      !eligibleJobs(trigCfg, staleArm, at845_11).some(j => j.id === "t1"));
    assert("A2 — TODAY's arm still opens it", eligibleJobs(trigCfg, freshArm, at845_11).some(j => j.id === "t1"));
    assert("A2 — a stale arm still yields to the fallback hour (delay, never starve)",
      eligibleJobs(trigCfg, staleArm, new Date(2026, 7, 11, 9, 31)).some(j => j.id === "t1"));
    assert("A2 — an UNDATEABLE arm fails OPEN (a ts we cannot parse must not become a new starvation)",
      eligibleJobs(trigCfg, { triggers: { morning_signals: { reason: "no ts at all" } } }, at845_11).some(j => j.id === "t1"));
    assert("A2 — an ABSENT trigger is still closed (armFresh must never answer for undefined)",
      armFresh(trigCfg.jobs[0], null, at845_11, cfg) === true && !eligibleJobs(trigCfg, { triggers: {} }, at845_11).some(j => j.id === "t1"));
    // OVERHAUL Block 5.2 — THE FULL-TIME EVENT: teamtalk_pm + evening_voice ride ONE trigger
    // (`fulltime`, armed by postmatch.mjs at his close). A shared arm is spent only when EVERY
    // job that declares it has run this shift — the first success used to delete it and starve
    // the second lane for the day.
    {
      const ev = cfg.jobs.find((j) => j.id === "evening_voice"), tp = cfg.jobs.find((j) => j.id === "teamtalk_pm");
      assert("FULL-TIME EVENT — evening_voice + teamtalk_pm declare trigger `fulltime` AND gate.event `fulltime` in canon config (they run only after his close; the arm belongs to that shift)",
        ev && tp && ev.trigger === "fulltime" && tp.trigger === "fulltime" && ev.gate && ev.gate.event === "fulltime" && tp.gate && tp.gate.event === "fulltime");
      const ftCfg = { ...cfg, paused: false, jobs: [
        { id: "ev_fx", engine: "claude", window: "any", priority: 90, trigger: "fulltime", inputs: [] },
        { id: "tp_fx", engine: "claude", window: "any", priority: 45, trigger: "fulltime", inputs: [], at: "23:50" },
      ] };
      const T21 = new Date(2026, 7, 18, 21, 30);
      const qsFT = { observed_window_ceiling: null, jobs_run: {}, triggers: { fulltime: { ts: new Date(2026, 7, 18, 21, 25).toISOString(), reason: "full-time" } } };
      const ftDeps = { exec: () => ({ ok: true, text: "Sharp read. 2 drills stand.", total_tokens: 1000, duration_ms: 5, limit_hit: false, error: null }), gexec: () => ({ ok: false }), now: T21, dry: true, ledger: [], queueState: qsFT, gate: { consumption: [], cards: [], states: new Map(), mouth: [], mediaExists: () => false, evidenceFor: () => ({ inputs: {}, declared: 0, absent: [], required_absent: [], present: 0, door: [], door_dropped: 0 }) } };
      const r1 = await tick(ftCfg, ftDeps);
      assert("FULL-TIME EVENT — at 21:30 only ev_fx is eligible (tp_fx's at is 23:50); it runs and the SHARED arm is NOT spent (tp_fx has not run this shift)",
        r1.ran.some((x) => x.job === "ev_fx") && !r1.ran.some((x) => x.job === "tp_fx") && !!qsFT.triggers.fulltime);
      const r2 = await tick(ftCfg, { ...ftDeps, now: new Date(2026, 7, 18, 23, 55) });
      assert("FULL-TIME EVENT — at 23:55 tp_fx runs on the same arm, and only THEN is the arm spent (both lanes served by one full-time)",
        r2.ran.some((x) => x.job === "tp_fx") && !qsFT.triggers.fulltime);
      const repFT = gateReport(ftCfg, gateContext({ ledger: [], gate: ftDeps.gate }, T21, [], { jobs_run: {}, triggers: {} }));
      assert("FULL-TIME EVENT — gateReport names an event lane's arm state (trigger + trigger_armed) so `status` never reads 'awake' as 'runs tonight' before his close",
        repFT.rows.every((r) => r.trigger === "fulltime" && r.trigger_armed === false));
    }
  }

  // PHASE H · H2/H6 (10 Aug 2026) — the wrap-aware at-gate + the agenda's hand
  {
    const hCfg = { ...cfg, jobs: [
      { id: "diary_fx", engine: "claude", window: "overnight", at: "03:00", priority: 10 },
      { id: "agenda_fx", engine: "claude", window: "overnight", at: "22:45", priority: 95 },
      { id: "plain_fx", engine: "claude", window: "overnight", priority: 50 },
    ] };
    const at2230 = new Date(2026, 6, 12, 22, 30), at2300 = new Date(2026, 6, 12, 23, 0),
      at0200 = new Date(2026, 6, 13, 2, 0), at0305 = new Date(2026, 6, 13, 3, 5), at0745 = new Date(2026, 6, 13, 7, 45);
    assert("H2 AT-GATE — an after-midnight at WAITS OUT the evening half (the H6 blocker: 03:00 must not run at 23:00)",
      !eligibleJobs(hCfg, {}, at2300).some(j => j.id === "diary_fx")
      && eligibleJobs(hCfg, {}, at0305).some(j => j.id === "diary_fx")
      && !eligibleJobs(hCfg, {}, at0745).some(j => j.id === "diary_fx"));
    assert("H2 AT-GATE — a pre-midnight at stays eligible ACROSS the wrap (22:45 is still past at 02:00)",
      !eligibleJobs(hCfg, {}, at2230).some(j => j.id === "agenda_fx")
      && eligibleJobs(hCfg, {}, at2300).some(j => j.id === "agenda_fx")
      && eligibleJobs(hCfg, {}, at0200).some(j => j.id === "agenda_fx"));
    assert("H2 AT-GATE — at-less overnight jobs untouched on both sides of midnight (regression)",
      eligibleJobs(hCfg, {}, at2300).some(j => j.id === "plain_fx")
      && eligibleJobs(hCfg, {}, at0200).some(j => j.id === "plain_fx"));

    const sanCfg = { jobs: [
      { id: "night_coach", enabled: true, window: "overnight", kind: "night_coach" },
      { id: "diary", enabled: true, window: "overnight", kind: "diary" },
      { id: "wall_insights", enabled: true, window: "overnight" },
      { id: "midday_digest", enabled: true, window: "midday" },
      { id: "agenda", enabled: true, window: "overnight", kind: "agenda" },
    ] };
    const agTxt = "soch\n```json\n" + JSON.stringify({ date: "2026-08-10", focus: "f", allocations: {
      wall_insights: { depth: "lean", why: "thin day" },
      night_coach: { depth: "skip", why: "silence the coach" },
      midday_digest: { depth: "skip", why: "wrong window" },
      invented_job: { depth: "skip", why: "not real" },
      agenda: { depth: "skip", why: "self" },
      diary: { depth: "deep", why: "no-op depth" },
    } }) + "\n```";
    const ag = parseAgendaJson(agTxt, sanCfg);
    assert("H2 SANITIZER — legal lean kept · NEVER_SKIP demotes skip→lean · invented/non-overnight/self/deep all dropped with reasons",
      ag.allocations.wall_insights.depth === "lean"
      && ag.allocations.night_coach.depth === "lean" && /NEVER_SKIP/.test(ag.allocations.night_coach.why)
      && !ag.allocations.midday_digest && !ag.allocations.invented_job && !ag.allocations.agenda
      && ag.dropped.length === 4);
    assert("H2 SANITIZER — prose-only / shapeless json → null, never a throw",
      parseAgendaJson("prose only", sanCfg) === null && parseAgendaJson("```json\n{\"x\":1}\n```", sanCfg) === null);
    assert("H6 SIBLING — {date, will_change} parses; shapeless → null",
      parseDiaryJson("x\n```json\n{\"date\":\"2026-08-10\",\"will_change\":\"one line\"}\n```").will_change === "one line"
      && parseDiaryJson("```json\n{\"date\":\"x\"}\n```") === null);

    const hDir = join(tmpdir(), "brain-h2-" + process.pid);
    mkdirSync(join(hDir, "agenda"), { recursive: true });
    mkdirSync(join(hDir, "wall_insights"), { recursive: true });
    writeFileSync(join(hDir, "agenda", "2026-07-12.json"), JSON.stringify({ allocations: { wall_insights: { depth: "skip", why: "w" } } }));
    writeFileSync(join(hDir, "wall_insights", "2026-07-12.md"), "fresh page");
    assert("H2 LOOKUP — an overnight job resolves tonight's sanitized allocation; a non-overnight job never can",
      agendaAllocationFor({ id: "wall_insights", window: "overnight" }, cfg, at2300, hDir).depth === "skip"
      && agendaAllocationFor({ id: "wall_insights", window: "midday" }, cfg, at2300, hDir) === null
      && agendaAllocationFor({ id: "agenda", window: "overnight", kind: "agenda" }, cfg, at2300, hDir) === null);
    assert("H2 REST GATE — a lane rests only when its newest file is <24h old; stale or never-produced lanes refuse",
      laneRestable({ id: "wall_insights", out: "wall_insights" }, hDir) === true
      && laneRestable({ id: "wall_insights", out: "wall_insights" }, hDir, Date.now() + 25 * 3600000) === false
      && laneRestable({ id: "ghost", out: "ghost" }, hDir) === false);
    rmSync(hDir, { recursive: true, force: true });
    assert("H2/H6 CANON — both jobs committed: agenda opus/overnight/22:45/95, diary sonnet/overnight/03:00/serve, sibling parsers wired",
      (() => { const a = cfg.jobs.find(j => j.id === "agenda"), d = cfg.jobs.find(j => j.id === "diary");
        return a && a.kind === "agenda" && a.at === "22:45" && a.priority === 95 && a.model === "opus"
          && d && d.kind === "diary" && d.at === "03:00" && d.serve === "next_morning" && d.model === "sonnet"
          && d.inputs.some(i => /agenda\/TODAY\.json/.test(typeof i === "string" ? i : i.path)); })());
  }

  // MEDIA ENGINE — team talks: validated text → mp3 in club/media/
  const ttam = cfg.jobs.find(j => j.id === "teamtalk_am"), ttpm = cfg.jobs.find(j => j.id === "teamtalk_pm");
  assert("teamtalk jobs wired with speak_to + no-new-numbers validator", !!ttam && !!ttpm && ttam.speak_to === "teamtalk_DATE_am.mp3" && ttpm.speak_to === "teamtalk_DATE_pm.mp3" && ttam.validate === "no_new_numbers" && ttpm.validate === "no_new_numbers");
  assert("morning talk compiled overnight SERVES tomorrow", serveDate({ serve: "next_morning" }, new Date(2026, 6, 12, 23, 15)) === "2026-07-13");
  assert("after-midnight compile serves the same morning", serveDate({ serve: "next_morning" }, new Date(2026, 6, 13, 2, 0)) === "2026-07-13");
  assert("evening talk serves the same day", serveDate({}, new Date(2026, 6, 12, 20, 45)) === "2026-07-12");
  {
    const { mkdtempSync } = await import("node:fs");
    const osm = await import("node:os");
    const td = mkdtempSync(join(osm.tmpdir(), "brain-tt-"));
    assert("no mp3 → no line (the push never lies)", teamtalkLine("am", new Date(2026, 6, 12, 8, 45), td) === null);
    writeFileSync(join(td, "teamtalk_2026-07-12_am.mp3"), "x");
    const line = teamtalkLine("am", new Date(2026, 6, 12, 8, 45), td);
    assert("mp3 present → 'team talk taiyaar' rides the sanctioned push", !!line && line.includes("teamtalk_2026-07-12_am.mp3"));
  }

  // budget math
  const now = (h, m) => new Date(2026, 6, 12, h, m, 0);
  const L = (hoursAgo, tokens, engine = "claude") => ({ ts: new Date(now(23, 0).getTime() - hoursAgo * 3600000).toISOString(), engine, total_tokens: tokens });
  const ledger = [L(1, 100000), L(2, 200000), L(6, 500000), L(3, 50000, "gemini")];
  assert("window usage sums 5h of CLAUDE tokens only", windowUsage(ledger, now(23, 0), 5) === 300000);
  assert("gemini tokens never count against the Claude window", windowUsage(ledger, now(23, 0), 5) < 350000);
  // REGRESSION (E2E audit 25 Jul 2026): the window had no upper edge, so a
  // future-stamped row (clock skew / replayed ledger) counted as spent now and
  // could pin the governor at zero headroom permanently.
  {
    const future = ledger.concat([{ ts: new Date(now(23, 0).getTime() + 6 * 3600000).toISOString(), engine: "claude", total_tokens: 999999 }]);
    assert("WINDOW HAS TWO EDGES — a future-dated row never counts as spent", windowUsage(future, now(23, 0), 5) === 300000);
  }

  // C1 (12 Aug 2026) — THE SPEND METER. Three measured faults, one per assertion,
  // each held BY SOURCE so a future edit that reintroduces any of them goes red.
  {
    // fault 1 — UNDER-COUNT: the dmn wrote total_tokens as the in+out pair only, so
    // 5.86 crore of real traffic metered as 10 lakh. spendOf derives from components,
    // so a lying total is simply not consulted.
    const dmnShaped = { engine: "claude", input_tokens: 2, output_tokens: 700, cache_creation_tokens: 20000, cache_read_tokens: 100000, total_tokens: 702 };
    assert("C1 fault 1 — a row whose total_tokens is the in+out pair only is NOT believed (the dmn under-count)",
      spendOf(dmnShaped) > 702 && spendOf(dmnShaped) === 2 * 1 + 700 * 5 + 20000 * 1.25 + 100000 * 0.1);
    // fault 2 — OVER-COUNT: haiku_pulse wrote a prompt-LENGTH GUESS as spend, 32.9 lakh
    // against 72k of real traffic. Same derivation kills it from the other side.
    const guessShaped = { engine: "claude", input_tokens: 1, output_tokens: 10, cache_creation_tokens: 0, cache_read_tokens: 0, total_tokens: 999999 };
    assert("C1 fault 2 — an inflated written total is NOT believed either (the pulse length-guess)", spendOf(guessShaped) === 1 + 50);
    // fault 3 — MIS-WEIGHT: cache_read was 67.5% of counted traffic at FULL price. It
    // is the cheapest traffic sold, and counting it dear is what starved cortex.
    const cacheHeavy = { engine: "claude", input_tokens: 0, output_tokens: 0, cache_creation_tokens: 0, cache_read_tokens: 1000, total_tokens: 1000 };
    assert("C1 fault 3 — cache_read costs a TENTH against the ceiling, not full price", spendOf(cacheHeavy) === 100);
    assert("C1 — output is the dear one and outweighs the same count of cache_read 50×",
      spendOf({ output_tokens: 1000 }) === 50 * spendOf(cacheHeavy));
    // the fallback: a row with NO components keeps its written total, which is the only
    // reason every budget assertion written before today still holds.
    assert("C1 — a component-less row (tokens_estimated) keeps its written total at weight 1", spendOf({ total_tokens: 4242 }) === 4242);
    // C1b (14 Aug 2026) — THE MODEL FACTOR. Two clauses, and the second is the
    // one that protects a guard: the board sees models, the GOVERNOR does not.
    assert("C1b — model-aware spend multiplies the same row by haiku 1 / sonnet 3 / opus 5",
      spendOfModelAware({ ...cacheHeavy, model: "haiku" }) === 100
      && spendOfModelAware({ ...cacheHeavy, model: "sonnet" }) === 300
      && spendOfModelAware({ ...cacheHeavy, model: "opus" }) === 500
      && spendOfModelAware(cacheHeavy) === 300);   // unstated ⇒ sonnet, never free
    assert("C1b — the GOVERNOR's unit is UNCHANGED: windowUsage never sees the model factor (its caps are stated model-blind)",
      windowUsage([{ ...cacheHeavy, ts: now(22, 30).toISOString(), model: "opus" }], now(23, 0), 5)
      === windowUsage([{ ...cacheHeavy, ts: now(22, 30).toISOString(), model: "haiku" }], now(23, 0), 5));
    assert("C1 — the frozen legacy meter still sums raw, and the two now DISAGREE by design",
      windowUsageLegacy([{ ...dmnShaped, ts: now(22, 30).toISOString() }], now(23, 0), 5) === 702
      && windowUsage([{ ...dmnShaped, ts: now(22, 30).toISOString() }], now(23, 0), 5) !== 702);
    // THE CONSEQUENCE the whole item exists for: a cache-heavy window that read as
    // exhausted under the raw meter must leave real headroom under the true one.
    const starving = Array.from({ length: 40 }, (_, i) => ({ ts: now(22, 0).toISOString(), engine: "claude", input_tokens: 2, output_tokens: 500, cache_creation_tokens: 3000, cache_read_tokens: 40000, total_tokens: 43502 }));
    const rawUsed = windowUsageLegacy(starving, now(23, 0), 5), trueUsed = windowUsage(starving, now(23, 0), 5);
    assert("C1 — THE STARVATION: a cache-heavy window meters far lower in true cost than raw (cortex's 'no-headroom (0/50000)')",
      rawUsed > trueUsed * 2 && headroom(cfg, starving, { observed_window_ceiling: null, jobs_run: {} }, now(2, 0)).allowed >= 50000);
  }

  const qEmpty = { observed_window_ceiling: null, jobs_run: {} };
  const hStudy = headroom(cfg, ledger, qEmpty, now(14, 0));
  assert("STUDY HOURS — cap = day_reserve_frac (protect the captain)", hStudy.phase === "study" && hStudy.cap === Math.round(cfg.budget.window_capacity_est_tokens * cfg.budget.day_reserve_frac));
  const hNight = headroom(cfg, ledger, qEmpty, now(23, 30));
  assert("OVERNIGHT — cap = overnight_target_frac (exhaust deliberately)", hNight.phase === "overnight" && hNight.cap === Math.round(cfg.budget.window_capacity_est_tokens * cfg.budget.overnight_target_frac));
  // P1 unleash (9 Aug 2026): these ceiling fixtures were literals from the 800k era and went
  // red the day the estimate doubled — they now derive from cfg.budget so they assert the
  // RELATION (observed-above-estimate wins), not a number the captain is free to change.
  const aboveEst = Math.round(cfg.budget.window_capacity_est_tokens * 1.5);
  assert("self-tuned ceiling ABOVE estimate overrides (learns the plan is bigger)", headroom(cfg, ledger, { observed_window_ceiling: aboveEst }, now(23, 30)).cap === Math.round(aboveEst * cfg.budget.overnight_target_frac));
  assert("STARVATION GUARD — a too-low/corrupt ceiling is floored at the estimate", headroom(cfg, ledger, { observed_window_ceiling: 1 }, now(23, 30)).cap === Math.round(cfg.budget.window_capacity_est_tokens * cfg.budget.overnight_target_frac) && headroom(cfg, ledger, { observed_window_ceiling: 1 }, now(23, 30)).allowed > 100000);

  // ---- PHASE-0 GOVERNOR: token vitals · live reserve · ceiling EWMA · thinking depth ----
  {
    const dayCap = Math.round(cfg.budget.window_capacity_est_tokens * cfg.budget.day_reserve_frac);
    const nightCap = Math.round(cfg.budget.window_capacity_est_tokens * cfg.budget.overnight_target_frac);
    const estC = cfg.budget.window_capacity_est_tokens;
    const vt = tokenVitals(cfg, [L(1, 100000), L(30, 4000000)], qEmpty, now(23, 0));
    assert("TOKEN VITALS expose BOTH windows (5h + 7d)", vt.window_5h.used === 100000 && vt.week_7d.used === 4100000 && vt.week_7d.cap === cfg.budget.weekly_capacity_est_tokens);
    assert("TOKEN VITALS carry a human summary + live headroom", /5h .*week /.test(vt.summary) && typeof vt.window_5h.allowed_now === "number");
    assert("LIVE RESERVE — at the keyboard, daytime spend stays protective", headroom(cfg, [], qEmpty, now(14, 0), { idle_min: 1 }).cap === dayCap);
    assert("LIVE RESERVE — idle at the desk, spend rises toward the flood", headroom(cfg, [], qEmpty, now(14, 0), { idle_min: 30 }).cap === nightCap);
    assert("LIVE RESERVE — no signal ⇒ unchanged static behavior (selftests safe)", headroom(cfg, [], qEmpty, now(14, 0)).cap === dayCap);
    assert("CEILING EWMA — blends observed toward the running ceiling", blendCeiling(estC * 1.25, estC * 1.75, estC, 0.5) === estC * 1.5);
    assert("CEILING EWMA — floored at the estimate (a low read can't starve)", blendCeiling(null, 1, estC) === estC);
    // DERIVED, NOT HARDCODED (C1, 12 Aug 2026) — this read `blendCeiling(2000000, 900000, estC, 0.5)`,
    // two literals that only sat above the estimate while the estimate was 1,600,000. The C1
    // re-fit put the floor above both and the assertion went red measuring the ceiling of the
    // day it was written instead of the down-correction it names. Both ends now ride estC, so
    // the pair holds the real law: it corrects DOWN, but the line above still floors it.
    assert("CEILING EWMA — self-corrects DOWN (not a one-way ratchet)", blendCeiling(estC * 2, estC * 1.1, estC, 0.5) < estC * 2);
    assert("THINKING DEPTH — lean live, deep overnight", maxThinkingFor("study", 1000000).max_thinking_tokens === 16000 && maxThinkingFor("overnight", 1000000).max_thinking_tokens === 48000);
    assert("THINKING DEPTH — never budgets more than the window can pay", maxThinkingFor("overnight", 40000).max_thinking_tokens <= 20000);
    assert("THINKING DEPTH — derives the deep-read headroom floor", maxThinkingFor("overnight", 1000000).min_headroom_tokens === Math.round(48000 * 1.6));
    assert("PACING — burn rate rises with headroom, mins-to-edge floored >=5", (() => { const c = { budget: { window_hours: 5 } }; const rich = targetBurn(c, { allowed: 300000, phase: "overnight" }, now(2, 0)); const poor = targetBurn(c, { allowed: 20000, phase: "overnight" }, now(2, 0)); return rich.pace_tok_per_min > poor.pace_tok_per_min && rich.mins_to_edge >= 5; })());
    assert("PACING — zero/negative headroom → pace floored at 0, never negative", targetBurn({ budget: {} }, { allowed: -5, phase: "shoulder" }, now(14, 0)).pace_tok_per_min === 0);
    // PULSE (P4) — the three hard rails + escalate/hold, all deps-injected (no live spend)
    {
      // HERMETIC CONFIG (2 Aug 2026). This block used the LIVE cfg, so the moment the
      // captain paused the pulse in brain_config.json all NINE pulse assertions went red —
      // not because the code broke, but because a setting changed. A suite whose answer
      // depends on his current settings is not a suite. The pulse's own enabled-flag
      // behaviour is asserted separately (see the CONFIG assertions below).
      const pCfg = { ...cfg, pulse: { ...(cfg.pulse || {}), enabled: true } };
      const pTail = [{ modality: "voice", text: "attention scaling mujhe samajh nahi aaya" }];
      const hrOK = { allowed: 300000, phase: "study" };
      const mkCall = (esc) => () => ({ ok: true, text: JSON.stringify({ escalate: esc, which: "attention scaling", why: "conceptual confusion" }), input_tokens: 400, output_tokens: 30, total_tokens: 430, error: null, limit_hit: false });
      let metered = [], posted = null;
      const base = { now: now(14, 0), signals: { idle_min: 2 }, headroom: hrOK, tail: pTail, ledger: [], appendLedger: (o) => metered.push(o), post: async (e) => { posted = e; return true; }, dry: true };
      const esc = await runPulse(pCfg, { ...base, mockCall: mkCall(true) });
      assert("PULSE — escalate: metered + POSTs a 'pulse' afferent w/ concept_tokens + per-concept key (never wake_queue)", esc.pulsed && esc.escalated && metered.length === 1 && metered[0].job === "haiku_pulse" && posted && posted.modality === "pulse" && posted.event_key === "pulse:attention" && Array.isArray(posted.concept_tokens) && posted.concept_tokens.includes("attention"));
      assert("PULSE — cap counts by PARSED local date (today's pulse counts, a 2-day-old one does not)", pulsesToday([{ job: "haiku_pulse", ts: base.now.toISOString() }, { job: "haiku_pulse", ts: new Date(base.now.getTime() - 2 * 86400000).toISOString() }], base.now) === 1);
      metered = []; posted = null;
      const hold = await runPulse(pCfg, { ...base, mockCall: mkCall(false) });
      assert("PULSE — a HOLD is STILL metered (the meter is the whole safety story)", hold.pulsed && !hold.escalated && metered.length === 1 && posted === null);
      const idleSkip = await runPulse(pCfg, { ...base, signals: { idle_min: 30 }, appendLedger: () => { throw new Error("meter when idle"); }, mockCall: () => { throw new Error("call when idle"); } });
      assert("PULSE — engaged gate: idle → skip, zero call, zero meter", idleSkip.pulsed === false && /idle/.test(idleSkip.skipped));
      const capped = await runPulse(pCfg, { ...base, ledger: Array.from({ length: 500 }, () => ({ job: "haiku_pulse", ts: now(14, 0).toISOString() })), appendLedger: () => { throw new Error("pulse over cap"); }, mockCall: () => { throw new Error("call over cap"); } });
      assert("PULSE — hard daily cap: over cap → skip, no call, no meter", capped.pulsed === false && /cap/.test(capped.skipped));
      let m2 = [];
      const malformed = await runPulse(pCfg, { ...base, appendLedger: (o) => m2.push(o), mockCall: () => ({ ok: true, text: "not json at all", total_tokens: 200 }) });
      assert("PULSE — malformed reply → HOLD, still metered, never a crash", malformed.pulsed && malformed.escalated === false && m2.length === 1);

      // ---- THE ROLLING SESSION (14 Aug 2026, unleash Phase 3) ----------------
      // Measured on this machine before building it (haiku, the exact lane shape):
      // seed cw 7,490 cr 0 → resume cw 521 cr 7,490. Everything below is the
      // logic around that fact; `dry: true` keeps the session file untouched.
      {
        const dated = (h, m, txt, mod = "voice") => ({ modality: mod, text: txt, ts: now(h, m).toISOString() });
        const rows = [dated(13, 0, "purani baat"), dated(13, 30, "aur purani baat"), dated(14, 0, "nayi baat — attention scaling")];
        const live = { id: "sid-1", date: localDate(now(14, 0)), turns: 3, last_afferent_ts: now(13, 30).toISOString() };
        assert("SESSION — usable only for TODAY, under the turn guard, with an id, and never when PULSE_RESUME_DISABLED is set",
          pulseSessionUsable(live, now(14, 0))
          && !pulseSessionUsable({ ...live, date: "2020-01-01" }, now(14, 0))
          && !pulseSessionUsable({ ...live, turns: 80 }, now(14, 0))
          && !pulseSessionUsable({ ...live, id: null }, now(14, 0))
          && !pulseSessionUsable(null, now(14, 0)));
        assert("DELTA — only moments NEWER than the session has seen, own output still filtered out, newest last",
          pulseDelta([...rows, { modality: "pulse", text: "its own alarm", ts: now(14, 1).toISOString() }], live.last_afferent_ts, 25)
            .join("|") === "[voice] nayi baat — attention scaling");
        let m3 = []; let argsSeen = null;
        const resumed = await runPulse(pCfg, { ...base, tail: rows, session: live, appendLedger: (o) => m3.push(o),
          exec: (p, model, extra) => { argsSeen = { p, extra }; return { ok: true, text: JSON.stringify({ escalate: false }), total_tokens: 900, session_id: "sid-1" }; } });
        assert("RESUMED PULSE — spawns with --resume, is shown ONLY the delta (not the whole tail), and says so on its ledger row",
          resumed.pulsed && argsSeen.extra.join(" ") === "--resume sid-1"
          && /nayi baat/.test(argsSeen.p) && !/purani baat/.test(argsSeen.p)
          && m3[0].resume === true && m3[0].delta_n === 1 && m3[0].turns === 4);
        const quiet = await runPulse(pCfg, { ...base, tail: rows, session: { ...live, last_afferent_ts: now(14, 0).toISOString() },
          appendLedger: () => { throw new Error("metered a pulse with nothing to judge"); }, exec: () => { throw new Error("called with an empty delta"); } });
        assert("RESUMED PULSE — nothing new since the last check ⇒ NO CALL AT ALL (the cold lane re-judged the same 25 rows every 150s)",
          quiet.pulsed === false && /no new moments/.test(quiet.skipped));
        let m4 = []; let coldSeen = null;
        const cold = await runPulse(pCfg, { ...base, tail: rows, session: { ...live, date: "2020-01-01" }, appendLedger: (o) => m4.push(o),
          exec: (p, model, extra) => { coldSeen = { p, extra }; return { ok: true, text: JSON.stringify({ escalate: false }), total_tokens: 900, session_id: "sid-2" }; } });
        assert("ROTATION — yesterday's session is NOT resumed: the pulse seeds cold with the WHOLE tail, no --resume, and the row says resume:false",
          cold.pulsed && coldSeen.extra.length === 0
          && /purani baat/.test(coldSeen.p) && /nayi baat/.test(coldSeen.p) && /continuous PULSE/.test(coldSeen.p)
          && m4[0].resume === false && m4[0].turns === 1);
      }

      // ---- THE DELIVERY RECEIPT (11 Aug 2026 wiring pass) ---------------------
      // The wire that was dead: `posted` computed in runPulse and dropped, so 205
      // escalations across 1,043 live rows claimed `escalated:true` with nothing saying
      // whether the thalamus door ever took them. These four fail the moment the receipt
      // stops riding the row, stops distinguishing a hold from a failure, or a dead door
      // starts reading as a delivery again.
      let rcpt1 = [];
      const delivered = await runPulse(pCfg, { ...base, appendLedger: (o) => rcpt1.push(o), mockCall: mkCall(true), post: async () => true });
      assert("PULSE RECEIPT — a DELIVERED escalation stamps posted:true on the ledger row and on the return",
        rcpt1.length === 1 && rcpt1[0].escalated === true && rcpt1[0].posted === true && delivered.posted === true);
      let rcpt2 = [];
      const dropped = await runPulse(pCfg, { ...base, appendLedger: (o) => rcpt2.push(o), mockCall: mkCall(true), post: async () => false });
      assert("PULSE RECEIPT — a door that REFUSES is recorded: escalated:true + posted:FALSE (the row can no longer claim delivery)",
        rcpt2.length === 1 && rcpt2[0].escalated === true && rcpt2[0].posted === false && dropped.escalated === true && dropped.posted === false);
      let rcpt3 = [];
      const thrown = await runPulse(pCfg, { ...base, appendLedger: (o) => rcpt3.push(o), mockCall: mkCall(true), post: async () => { throw new Error("door exploded"); } });
      assert("PULSE RECEIPT — a poster that THROWS is a failed delivery, never a lost meter (METER EVERY PULSE holds)",
        rcpt3.length === 1 && rcpt3[0].posted === false && thrown.pulsed === true);
      let rcpt4 = [];
      const heldRow = await runPulse(pCfg, { ...base, appendLedger: (o) => rcpt4.push(o), mockCall: mkCall(false), post: async () => { throw new Error("posted on a HOLD"); } });
      assert("PULSE RECEIPT — a HOLD names the absence (posted:null, key present) instead of a false zero",
        rcpt4.length === 1 && "posted" in rcpt4[0] && rcpt4[0].posted === null && heldRow.escalated === false);
      // and the READER — a receipt with no consumer is the black box this pass exists to kill
      {
        const dNow = now(14, 0), iso = (h) => new Date(dNow.getTime() - h * 3600000).toISOString();
        const dLedger = [
          { job: "haiku_pulse", ts: iso(1), escalated: true, posted: true },
          { job: "haiku_pulse", ts: iso(2), escalated: true, posted: false },
          { job: "haiku_pulse", ts: iso(3), escalated: true },                       // pre-receipt row
          { job: "haiku_pulse", ts: iso(1), escalated: false, posted: null },        // a hold never counts
          { job: "haiku_pulse", ts: iso(99), escalated: true, posted: false },       // outside the window
        ];
        const d = doorReceipts(dLedger, dNow, 5);
        assert("DOOR RECEIPTS — counts delivered/undelivered/unknown inside the gauge's OWN window; holds and old rows excluded",
          d.escalations === 3 && d.delivered === 1 && d.undelivered === 1 && d.unknown === 1 && d.window_hours === 5 && /NEVER LANDED/.test(d.summary));
        // HERMETIC WINDOW, same lesson as the pulse fixtures above: the 99h-old row is only
        // "outside" against a pinned 5h window, so pin it rather than ride the live config.
        const tv = tokenVitals({ ...pCfg, budget: { ...cfg.budget, window_hours: 5 } }, dLedger, {}, dNow);
        assert("DOOR RIDES THE FUEL GAUGE — token_vitals.json carries `door`, and an undelivered escalation reaches the summary the doctor reads",
          tv.door && tv.door.undelivered === 1 && /⚠ DOOR: 1 pulse escalation\(s\) never landed/.test(tv.summary));
      }

      // ---- THE BLEED RAILS (1 Aug 2026 audit — the pulse took 86.6% of a day) ----
      // rail 2b: TOKENS. The call cap could not bind because it counted the wrong unit.
      // FIXTURE RE-DERIVED 2 Aug 2026 (#67): the measurement window doubled to 0.10 of a
      // 12M weekly plan = 1,200,000 tok/day, so at the MEASURED 32,480 tok/pulse the cap
      // now bites at ceil(1,200,000 / 32,480) = 37 pulses → 37 × 32,480 = 1,201,760.
      // 37 calls is still nowhere near the 200-call backstop, which is the whole point:
      // the unit that binds is tokens, and the call cap is a runaway guard, not a budget.
      // HERMETIC BUDGET (9 Aug 2026, P1 unleash). This fixture's arithmetic (37 × 32,480
      // just over a 1.2M/day window) was derived from the 12M-era weekly plan but rode the
      // LIVE cfg.budget — the exact defect the HERMETIC CONFIG note above records for
      // `enabled`. The moment the captain doubled the budget, 37 pulses stopped exceeding
      // the window and the mock threw. The fixture now PINS the weekly plan it was
      // measured against; the live budget is asserted separately in the CONFIG block.
      const pTokCfg = { ...pCfg, budget: { ...(pCfg.budget || {}), weekly_capacity_est_tokens: 12000000 } };
      const bigRows = Array.from({ length: 37 }, () => ({ job: "haiku_pulse", ts: now(14, 0).toISOString(), total_tokens: 32480, ok: true }));
      assert("PULSE tokens — today's spend is summed from the ledger, not inferred", pulseTokensToday(bigRows, now(14, 0)) === 1201760);
      assert("PULSE tokens — a yesterday row never counts against today", pulseTokensToday([...bigRows, { job: "haiku_pulse", ts: new Date(now(14, 0).getTime() - 86400000).toISOString(), total_tokens: 999999, ok: true }], now(14, 0)) === 1201760);
      const tokCapped = await runPulse(pTokCfg, { ...base, ledger: bigRows, appendLedger: () => { throw new Error("pulsed over the TOKEN budget"); }, mockCall: () => { throw new Error("called over the TOKEN budget"); } });
      assert("PULSE — token budget bites where the CALL cap never could (37 calls, 1.2M tokens, cap 200)", tokCapped.pulsed === false && /token budget/.test(tokCapped.skipped) && bigRows.length < pulseConfig(pTokCfg).daily_cap);
      assert("PULSE — the measurement window is a FRACTION of the weekly plan, so it re-fits itself", pulseConfig({ budget: { weekly_capacity_est_tokens: 12000000 } }).daily_token_budget === 1200000);
      assert("PULSE — an explicit daily_token_budget in config wins over the fraction", pulseConfig({ pulse: { daily_token_budget: 123456 } }).daily_token_budget === 123456);

      // ---- #66/#67 — THE WINDOW IS MEASURED, NOT GUESSED -----------------------
      // The captain's standing order: never set a numerical limit by guessing. These hold
      // the two halves of the replacement — a window derived from a measured cost, and a
      // frequency that was halved rather than a cap that was invented.
      assert("MEASUREMENT — the window DOUBLED (0.05 → 0.10 of the weekly plan)", pulseConfig({}).daily_token_frac === 0.10);
      assert("MEASUREMENT — frequency HALVED: the pulse rides every 2nd daemon beat by default", pulseConfig({}).every_n_beats === 2 && pulseConfig({ pulse: { every_n_beats: 5 } }).every_n_beats === 5);
      assert("MEASUREMENT — every_n_beats is always >= 1 (0, negative, garbage and absent all stay safe: `beats % n` must never divide by zero)",
        [0, -3, "abc", null, undefined, NaN].every(v => pulseConfig({ pulse: { every_n_beats: v } }).every_n_beats >= 1));
      assert("MEASUREMENT — the arithmetic closes: window ÷ measured cost/pulse ≈ 36 observations/day", Math.floor(pulseConfig({}).daily_token_budget / 32480) === 36);
      {
        // the measurement itself must never render an unmeasured silence as a measured zero
        const c0 = pulseCostToday([], now(14, 0), 1200000);
        const c1 = pulseCostToday(bigRows, now(14, 0), 1200000);
        assert("MEASUREMENT — 0 pulses today reports mean = null (NOT MEASURED), never a mean of 0", c0.n === 0 && c0.mean === null && c0.tokens === 0);
        assert("MEASUREMENT — with pulses it reports the real per-call cost off the ledger", c1.n === 37 && c1.mean === 32480 && c1.pct === 100.1);
      }
      {
        // #66 — the headroom floor now DERIVES from the measured cost, and the old
        // configured 20,000 was below what a pulse actually costs (32,480), i.e. the gate
        // was letting a pulse fire into a window that could not pay for it.
        const priced = [{ job: "haiku_pulse", ts: now(14, 0).toISOString(), total_tokens: 32480, ok: true }];
        const thin = await runPulse(pCfg, {
          ...base, ledger: priced, headroom: { allowed: 25000, phase: "study" },
          appendLedger: () => { throw new Error("metered on headroom it cannot pay for"); },
          mockCall: () => { throw new Error("called on headroom below one measured pulse"); },
        });
        assert("#66 — headroom BELOW today's measured cost/pulse now skips (the configured 20,000 alone would have let it fire)",
          thin.pulsed === false && /headroom/.test(thin.skipped) && /measured cost\/pulse 32480/.test(thin.skipped)
          && 25000 > pulseConfig(pCfg).min_headroom_tokens);
        const unmeasured = await runPulse(pCfg, { ...base, ledger: [], headroom: { allowed: 19000, phase: "study" }, appendLedger: () => { throw new Error("x"); }, mockCall: () => { throw new Error("x"); } });
        assert("#66 — with NO measurement yet the configured floor still stands, and SAYS it is unmeasured",
          unmeasured.pulsed === false && /NOT MEASURED YET/.test(unmeasured.skipped));
      }

      // rail 2c: BACKOFF. 21 Jul burned all 200 slots with 164 failures on a logged-out CLI.
      const failRows = Array.from({ length: 3 }, () => ({ job: "haiku_pulse", ts: now(14, 0).toISOString(), total_tokens: 0, ok: false }));
      assert("PULSE backoff — counts consecutive failures at the TAIL of today", pulseFailStreak(failRows, now(14, 0)) === 3);
      assert("PULSE backoff — one success ANYWHERE later resets the streak", pulseFailStreak([...failRows, { job: "haiku_pulse", ts: now(14, 0).toISOString(), total_tokens: 400, ok: true }], now(14, 0)) === 0);
      const backedOff = await runPulse(pCfg, { ...base, ledger: failRows, appendLedger: () => { throw new Error("pulsed while backed off"); }, mockCall: () => { throw new Error("called while backed off"); } });
      assert("PULSE — 3 consecutive failures → sit out, no call, no meter", backedOff.pulsed === false && /backoff/.test(backedOff.skipped));

      // the feedback loop: escalating POSTs modality "pulse" into the very stream this reads
      let m3 = [];
      const selfFed = await runPulse(pCfg, {
        ...base, appendLedger: (o) => m3.push(o),
        tail: [{ modality: "pulse", text: "pulse flagged (reasoning-hard): pulse flagged (reasoning-hard): x" }],
        mockCall: () => { throw new Error("called on a tail of NOTHING but its own output"); },
      });
      assert("PULSE — its OWN output is not a moment: a self-only tail reads as empty", selfFed.pulsed === false && /empty tail/.test(selfFed.skipped) && m3.length === 0);
      let m4 = [], seenPrompt = "";
      await runPulse(pCfg, {
        ...base, appendLedger: (o) => m4.push(o),
        tail: [{ modality: "pulse", text: "pulse flagged (reasoning-hard): echo" }, { modality: "voice", text: "attention scaling samajh nahi aaya" }],
        mockCall: (p) => { seenPrompt = p; return { ok: true, text: JSON.stringify({ escalate: false }), total_tokens: 430 }; },
      });
      assert("PULSE — a mixed tail keeps his voice and drops the echo", m4.length === 1 && /attention scaling/.test(seenPrompt) && !/pulse flagged/.test(seenPrompt));
      assert("PULSE — the row now carries the cache pair (the boot tax is finally visible)", "cache_read_tokens" in m4[0] && "cache_creation_tokens" in m4[0]);

      // RC-6: config sections that were parsed and then silently dropped
      assert("CONFIG — a `pulse` block written into brain_config actually reaches pulseConfig", pulseConfig({ pulse: { daily_cap: 7 } }).daily_cap === 7);
      assert("CONFIG — `enabled: false` for the pulse is reachable at last", pulseConfig({ pulse: { enabled: false } }).enabled === false);
      // and the disabled path must SPEND NOTHING — no CLI call, no ledger row, no network.
      // This is the assertion the captain's pause actually rests on.
      {
        const offCfg = { ...cfg, pulse: { enabled: false } };
        const off = await runPulse(offCfg, { ...base, mockCall: () => { throw new Error("called while disabled"); }, appendLedger: () => { throw new Error("metered while disabled"); } });
        assert("PULSE — disabled ⇒ zero call, zero meter, and it SAYS why", off.pulsed === false && off.skipped === "disabled");
      }

      // ---- THE MASTER PAUSE (2 Aug 2026) ----
      assert("PAUSE — paused ⇒ not one job is eligible, at any hour", eligibleJobs({ ...cfg, paused: true }, { jobs_run: {} }, now(8, 45)).length === 0 && eligibleJobs({ ...cfg, paused: true }, { jobs_run: {} }, now(2, 0)).length === 0);
      // A2 (9 Aug 2026): formation_read now waits on morning_signals, so these
      // three arm the trigger — pause semantics unchanged, sheet gate respected.
      const qArmed = { jobs_run: {}, triggers: { morning_signals: { ts: "x" } } };
      assert("PAUSE — un-paused ⇒ the job table works exactly as before", eligibleJobs({ ...cfg, paused: false }, qArmed, now(8, 45)).some(j => j.id === "formation_read"));
      // the safe direction is RUNNING: only a literal true may silence the organism.
      assert("PAUSE — a truthy typo can never pause it (string)", loadConfig.length >= 0 && eligibleJobs({ ...cfg, paused: "true" }, qArmed, now(8, 45)).length > 0);
      assert("PAUSE — a missing key can never pause it", eligibleJobs({ ...cfg, paused: undefined }, qArmed, now(8, 45)).length > 0);
    }
    assert("OVERNIGHT TAPER — after 05:30 the cap eases to the day reserve", headroom(cfg, [], qEmpty, now(6, 0)).cap === dayCap);
    assert("OVERNIGHT — 23:30 still floods to the overnight target", headroom(cfg, [], qEmpty, now(23, 30)).cap === nightCap);
    assert("LIVE SIGNAL — no traces ⇒ empty (assume live, never over-spend)", Object.keys(liveSignal(now(14, 0), "no-such-dir-xyz")).length === 0);
  }

  // eligibility
  const q = { jobs_run: { "2026-07-12": { formation_read: 1 } }, triggers: { morning_signals: { ts: "x" } } };
  // A2: armed trigger — the sheet is eligible at 08:45 only behind its inputs now.
  const elig845 = eligibleJobs(cfg, { jobs_run: {}, triggers: { morning_signals: { ts: "x" } } }, now(8, 45));
  assert("formation_read eligible at 08:45", elig845.some(j => j.id === "formation_read"));
  assert("A2 — formation_read WAITS at 08:45 when the conductor has not armed its inputs", !eligibleJobs(cfg, { jobs_run: {} }, now(8, 45)).some(j => j.id === "formation_read"));
  assert("max_per_day dedup — second run same day blocked", !eligibleJobs(cfg, q, now(9, 0)).some(j => j.id === "formation_read"));
  assert("overnight jobs ineligible mid-day", !eligibleJobs(cfg, { jobs_run: {} }, now(14, 0)).some(j => j.window === "overnight"));
  const eligNight = eligibleJobs(cfg, { jobs_run: {} }, now(23, 30));
  assert("overnight queue rich at 23:30 (≥4 jobs)", eligNight.filter(j => j.window === "overnight").length >= 4);
  // (was season_review until 2 Aug 2026, when #63 disabled it for having no address —
  // market_scan is the other Sun-only job and exercises exactly the same mechanism.)
  assert("Sunday-only job honors days[] (2026-07-12 IS a Sunday)", eligNight.some(j => j.id === "market_scan"));
  assert("days[] still EXCLUDES a Sunday-only job on a Monday", !eligibleJobs(cfg, { jobs_run: {} }, new Date(2026, 6, 13, 23, 30)).some(j => j.id === "market_scan"));
  // THE MIDNIGHT SEAM — the overnight shift is ONE shift: a job that ran at
  // 23:30 must NOT come back at 00:30 with empty TODAY-inputs; next evening it must.
  const qNight = { jobs_run: { "2026-07-12": { day_cartridge: 1 } } };
  assert("overnight job does NOT re-run after midnight (same shift)", !eligibleJobs(cfg, qNight, new Date(2026, 6, 13, 0, 30)).some(j => j.id === "day_cartridge"));
  assert("next EVENING the overnight job runs again (new shift)", eligibleJobs(cfg, qNight, new Date(2026, 6, 13, 22, 30)).some(j => j.id === "day_cartridge"));
  assert("a post-midnight success LEDGERS to the evening the shift started", shiftDay({ window: "overnight" }, new Date(2026, 6, 13, 0, 30), cfg) === "2026-07-12" && shiftDay({ window: "overnight" }, new Date(2026, 6, 13, 23, 0), cfg) === "2026-07-13");
  assert("non-overnight jobs stay calendar-keyed", shiftDay({ window: "morning" }, new Date(2026, 6, 13, 8, 45), cfg) === "2026-07-13");
  const cfgGemOff = { ...cfg, gemini: { ...cfg.gemini, enabled: false } };
  assert("gemini jobs skipped when gemini.enabled=false (mechanism)", !eligibleJobs(cfgGemOff, { jobs_run: {} }, now(23, 30)).some(j => j.engine === "gemini"));
  // ENGINE LAW (captain's order, 17 Jul): the free pool shrank to ~20 req/day
  // and starved the night — ALL committed jobs now ride Claude; gemini.enabled
  // stays true only for the physics lanes outside this job table.
  assert("ENGINE LAW: every committed job rides Claude (no cognition on the free pool)", cfg.jobs.every(j => (j.engine || "claude") === "claude"));
  assert("priority ordering (formation > insights)", elig845.length === 0 || elig845[0].priority >= (elig845[1] ? elig845[1].priority : 0));

  // validators
  assert("banned-phrase validator rejects hype", validateOutput({ validate: null }, "this is a 10x week", {}, cfg).ok === false);
  assert("no_new_numbers rejects invented numbers", validateOutput({ validate: "no_new_numbers" }, "you did 97 reps", { reps: 12 }, cfg).ok === false);
  assert("no_new_numbers passes grounded numbers", validateOutput({ validate: "no_new_numbers" }, "12 reps, gap 0.14", { reps: 12, gap: 0.14 }, cfg).ok === true);
  // KAAM 1 (10 Aug 2026) — THE ALLOWED-SET SNAPSHOT ROUND-TRIPS.
  // The wall re-validates this file's output hours later using the recorded set
  // instead of the prompt. That only holds if a set, joined back into a `shown`
  // string, reproduces this file's own verdict EXACTLY — same passes, same
  // bounces. If that ever stops being true, "The read" starts lying in one
  // direction or the other, and it is this assertion that says so first.
  {
    const inputs = { reps: 12 };
    const prompt = "LAWS: use at most 25 rollouts. he sat 47 minutes. weight 0.4375.";
    const snap = [...allowedNumbersShared(inputs, prompt)].join(" ");
    const via = (text, shown) => validateOutput({ validate: "no_new_numbers" }, text, inputs, cfg, shown).ok;
    assert("KAAM1 — a snapshot reproduces the producer's verdict on the numbers it was HANDED",
      via("47 minutes at weight 0.4375", prompt) === true && via("47 minutes at weight 0.4375", snap) === true);
    assert("KAAM1 — a snapshot is not a loosening: an invented number bounces under BOTH",
      via("he retired 97 doubts", prompt) === false && via("he retired 97 doubts", snap) === false);
    assert("KAAM1 — and the defect it cures is real: the SAME text with an empty shown is 'invented'",
      via("47 minutes at weight 0.4375", "") === false);
  }
  assert("quotes_only rejects non-verbatim quotes", validateOutput({ validate: "quotes_only" }, 'anchor: "a phrase he never said anywhere"', { bolo: "warehouse wala naksha" }, cfg).ok === false);
  assert("quotes_only passes verbatim quotes", validateOutput({ validate: "quotes_only" }, 'anchor: "warehouse wala naksha"', { bolo: "warehouse wala naksha socho" }, cfg).ok === true);

  // API-key guard
  process.env.ANTHROPIC_API_KEY = "sk-test-guard";
  const refused = await tick(cfg, { exec: () => ({ ok: true }), gexec: () => ({ ok: true }), now: now(23, 0), dry: true });
  assert("API-KEY GUARD — brain refuses when key present", refused.refused === true);
  delete process.env.ANTHROPIC_API_KEY;

  // tick with mock executor: runs jobs, respects budget, self-tunes on limit
  const calls = [];
  const mockExec = (prompt, model) => { calls.push({ model, len: prompt.length }); return { ok: true, text: "Sharp read. 2 drills stand.", total_tokens: 50000, duration_ms: 10, limit_hit: false, error: null }; };
  const hermetic = () => ({ ledger: [], queueState: { observed_window_ceiling: null, jobs_run: {} } });
  // DORMANT-SAFE (7 Aug 2026, the away-day red). These tick fixtures test the BUDGET
  // LOOP (drain count, limit stop, ceiling blend) — but each job's real `inputs` were
  // still gathered from the LIVE state dir, so on a fresh checkout (which the CI runner
  // is forever, by design) required-absent inputs skipped jobs before the mock exec and
  // all three asserts went red while passing at home. The inputs are not this fixture's
  // subject; they are stripped so the loop is measured identically in both worlds.
  const inputFree = (jobs) => jobs.filter(j => j.kind !== "manager_m3").map(j => ({ ...j, inputs: [] }));
  const t1 = await tick({ ...cfg, jobs: inputFree(cfg.jobs) }, { exec: mockExec, gexec: () => ({ ok: false }), now: now(23, 30), dry: true, ...hermetic() });
  assert("overnight tick drains multiple jobs", t1.ran.filter(r => r.ledgerRow && r.ledgerRow.ok).length >= 3);
  const limitExec = () => ({ ok: false, text: null, total_tokens: 0, duration_ms: 5, limit_hit: true, error: "You've hit your session limit · resets 7am" });
  const t2 = await tick({ ...cfg, jobs: inputFree(cfg.jobs) }, { exec: limitExec, gexec: () => ({ ok: false }), now: now(23, 30), dry: true, ...hermetic() });
  // THE GATE (18 Aug 2026): `ran` now also carries gate-asleep skips (like budget
  // skips), so the LIMIT row is found by its ledgerRow, not by position.
  const t2rows = t2.ran.filter(r => r.ledgerRow);
  assert("SELF-TUNE — limit event stops the tick immediately", t2rows.length === 1 && t2rows[0].note.includes("LIMIT"));

  // ---- THE STARVED NIGHT (10 Aug 2026 wiring audit) ------------------------------
  // The refusal at the top of the job loop built its reason and DISCARDED it: no ledger
  // row, no state write, and the hidden daemon window printed "0/1 ran" 1,135 times while
  // `diary` (priority 10, 03:00) sat at 0 rows in 4,530. These hold the whole wire —
  // tick → brain_queue.budget_starved → the ledger row → ledgerShiftSummary (the diary's
  // own input) → token_vitals.json (the doctor's step 0) — and go red if any link drops.
  // The fixture is the MEASURED case, not an invented one: it reproduces the 2026-08-10
  // 03:00 IST reading of 1,999,481 spent against an overnight cap of 1,520,000.
  // DERIVED, NOT HARDCODED (C1, 12 Aug 2026): the spend used to be the literal 2,000,000,
  // which measured the ceiling of the day it was written rather than the wire it names —
  // so the C1 re-fit turned this assertion red for a reason that had nothing to do with
  // starvation being recorded. Both numbers now come off the config, and the fixture keeps
  // the same overshoot (cap + 480k ≈ the measured 1.32×) through any future ceiling change.
  {
    const ovCap = Math.round(cfg.budget.window_capacity_est_tokens * cfg.budget.overnight_target_frac);
    const starvedSpend = ovCap + 480000;
    const starvedLedger = [{ ts: now(23, 0).toISOString(), engine: "claude", ok: true, total_tokens: starvedSpend }];
    const qs = { observed_window_ceiling: null, jobs_run: {} };
    const sCfg = { ...cfg, jobs: inputFree(cfg.jobs) };
    const never = () => { throw new Error("a starved tick must never call the model"); };
    const s1 = await tick(sCfg, { exec: never, gexec: never, now: now(23, 30), dry: true, ledger: starvedLedger, queueState: qs });
    const row = s1.ran[0] && s1.ran[0].ledgerRow;
    assert("STARVED — the budget refusal is RECORDED, not discarded: one ledger row carrying the exact reason",
      s1.ran.length === 1 && s1.ran[0].skipped === `budget (overnight: ${starvedSpend}/${ovCap})`
      && !!row && row.budget_skip === true && row.note.includes(`budget:skip — budget (overnight: ${starvedSpend}/${ovCap})`));
    assert("STARVED — the row cannot corrupt the two meters it sits beside: not spend (engine ≠ claude), not health (no boolean ok)",
      row.engine === "budget" && row.total_tokens === 0 && typeof row.ok !== "boolean"
      && windowUsage(starvedLedger.concat([row]), now(23, 30), 5) === starvedSpend
      && failureStreak(starvedLedger.concat([row])).sampled === 1
      && failureStreak(starvedLedger.concat([row])).streak === 0);
    const starvedJob = Object.keys(qs.budget_starved[Object.keys(qs.budget_starved)[0]])[0];
    assert("STARVED — brain_queue.budget_starved keys the whole night by shift day and names the job",
      !!qs.budget_starved && !!starvedJob && qs.budget_starved[Object.keys(qs.budget_starved)[0]][starvedJob].beats === 1);
    // the flood guard: a second starved beat must NOT write a second row (1,135 rows a
    // night would roll the 2 MB ledger's real history off the disk to record silence).
    const s2 = await tick(sCfg, { exec: never, gexec: never, now: now(23, 31), dry: true, ledger: starvedLedger, queueState: qs });
    assert("STARVED — one row per (shift day, job) EPISODE, never one per beat; the beats keep counting in state",
      s2.ran[0].ledgerRow === null
      && qs.budget_starved[Object.keys(qs.budget_starved)[0]][starvedJob].beats === 2);
    assert("STARVED — a wall never consumes the slot: the job is still un-run and retries when headroom returns",
      !((qs.jobs_run[localDate(now(23, 31))] || {})[starvedJob]) && !((qs.jobs_run["2026-07-12"] || {})[starvedJob]));
    // the READ side, all three consumers
    const stv = starvation(qs, now(23, 32));
    assert("STARVED — starvation() reads it back: the shift, the job, the beats, the age",
      !!stv && stv.beats === 2 && stv.jobs[0].id === starvedJob && stv.age_min === 1 && stv.summary.includes(`${starvedJob}×2`));
    const tv = tokenVitals(cfg, starvedLedger, qs, now(23, 32));
    // 11 Aug 2026: this label named three readers that take `.health` only — see the
    // correction above tokenVitals(). The real consumer is physio.mjs (loop_vitals
    // .brain_fuel + the brain_starved bleed), and physio's own selftest holds that
    // wire by source. This half stays what it always was: the PRODUCER's half.
    assert("STARVED — it reaches token_vitals.json (physio.mjs brainFuelRead is the consumer) and the summary SAYS it",
      !!tv.starved && tv.starved.recent === true && /⚠ STARVED/.test(tv.summary)
      && tv.health.dead === false);
    assert("STARVED — and the OLD silence is exactly reproduced without it: health is computed off boolean-ok rows, so a starved night still scores 'OK'",
      failureStreak([row, row, row]).sampled === 0 && failureStreak([row, row, row]).dead === false);
    // ledgerShiftSummary is the DIARY'S input — the very job starved here. Before this
    // wire a budget_skip row landed in `runs` and in no other bucket: a phantom run.
    {
      const { mkdtempSync } = await import("node:fs");
      const oss = await import("node:os");
      const sd = mkdtempSync(join(oss.tmpdir(), "brain-starve-"));
      writeFileSync(join(sd, "brain_ledger.jsonl"),
        [{ ts: "2026-07-12T23:30:00+05:30", job: "diary", engine: "budget", budget_skip: true, total_tokens: 0 },
         { ts: "2026-07-12T23:40:00+05:30", job: "night_coach", engine: "claude", ok: true, total_tokens: 500 }]
          .map(r => JSON.stringify(r)).join("\n") + "\n");
      const sum = ledgerShiftSummary("2026-07-12", sd);
      assert("STARVED — the diary's own summary counts it as a STARVATION, never as a run, and never as a failure",
        sum.budget_skips === 1 && sum.per_job.diary.budget_skips === 1
        && sum.per_job.diary.ok === 0 && sum.per_job.diary.agenda_skips === 0
        && sum.ok === 1 && sum.failed === 0);
      rmSync(sd, { recursive: true, force: true });
    }
  }

  // ---- THE BENCH CENSUS (11 Aug 2026 wiring audit) --------------------------------
  // cortex.mjs stamped council_seats/council_note onto every cortex_wake row and NOTHING
  // in the repo read either one — a producer with no consumer. These hold the READ half
  // of the wire: the diary's own summary must be able to tell a four-chair Bridge from a
  // cold one, and must not flatten UNMEASURED into a measured zero. cortex.mjs's selftest
  // holds the WRITE half, and holds this function by behaviour so deleting the reader
  // turns the producer red too.
  {
    const { mkdtempSync } = await import("node:fs");
    const oss = await import("node:os");
    const cd = mkdtempSync(join(oss.tmpdir(), "brain-council-"));
    const dryNote = "every chair empty (pool dry/late) — the Bridge proceeds cold";
    writeFileSync(join(cd, "brain_ledger.jsonl"),
      [{ ts: "2026-07-12T22:10:00+05:30", job: "cortex_wake", engine: "claude", ok: true, total_tokens: 40000, council_seats: 3, council_note: null },
       { ts: "2026-07-12T23:10:00+05:30", job: "cortex_wake", engine: "claude", ok: true, total_tokens: 41000, council_seats: 0, council_note: dryNote },
       { ts: "2026-07-13T00:10:00+05:30", job: "cortex_wake", engine: "claude", ok: true, total_tokens: 42000, council_seats: 0, council_note: dryNote },
       { ts: "2026-07-13T01:10:00+05:30", job: "cortex_wake", engine: "claude", ok: true, total_tokens: 43000, council_seats: null, council_note: "convene threw: pool unreachable" },
       { ts: "2026-07-13T02:10:00+05:30", job: "night_coach", engine: "claude", ok: true, total_tokens: 500 }]
        .map(r => JSON.stringify(r)).join("\n") + "\n");
    const cs = ledgerShiftSummary("2026-07-12", cd).council;
    assert("BENCH CENSUS — the diary's summary READS council_seats: three cold-vs-benched facts, counted, never derived",
      cs.reads === 4 && cs.with_bench === 1 && cs.seats === 3 && cs.cold === 2);
    assert("BENCH CENSUS — UNMEASURED (null) stays its own bucket; a bench nobody looked at is never written down as an empty one",
      cs.unmeasured === 1 && cs.cold === 2 && cs.reads === cs.with_bench + cs.cold + cs.unmeasured);
    assert("BENCH CENSUS — convene's note rides VERBATIM and deduped-with-a-count, and a row carrying no census is not counted as a read",
      cs.notes[dryNote] === 2 && cs.notes["convene threw: pool unreachable"] === 1
      && Object.keys(cs.notes).length === 2 && ledgerShiftSummary("2026-07-12", cd).rows === 5);
    rmSync(cd, { recursive: true, force: true });
  }

  // cognitive fingerprint — 2050-grade personalization, measured not assumed
  const fp = buildFingerprint({
    lexicon: { anchors: [{ phrase: "warehouse wala naksha" }] },
    grammar: { shape_counts: { finance_analogy_overreach: 4, determinism_assumption: 1 } },
    calibration: { overconfidence_rate: 0.21, trend: "narrowing" },
    ls: { weak_connection: "tokenization → embeddings" },
  });
  assert("fingerprint carries his anchors verbatim", fp.includes('"warehouse wala naksha"'));
  assert("fingerprint carries wrong-prior shapes as machine-side design input", fp.includes("finance_analogy_overreach") && fp.includes("NEVER name them"));
  assert("fingerprint carries measured calibration + fraying pass", fp.includes("0.21") && fp.includes("tokenization → embeddings"));
  // WIRING AUDIT (11 Aug 2026) — the rate must never reach a prompt bare again.
  // His live 10 Aug numbers: rate 0 off 3 knew-reps. Bare, that reads as perfect
  // honesty to every Gaffer call; with its n it reads as three reps.
  {
    const calLive = {
      overconfidence_rate: 0, trend: "establishing baseline (21/40 reps)",
      buckets: { knew: { n: 3, accuracy: 1 } },
      gate: { sub: [{ name: "overconfidence_rate", have: 3, need: 3, open: true, line: "3/3 knew-reps" }] },
    };
    const fpc = buildFingerprint({ calibration: calLive });
    assert("#wire the overconfidence rate reaches the prompt WITH its denominator (his live 0 off 3 knew-reps)",
      fpc.includes("P(wrong|knew)=0") && fpc.includes("n=3/3 knew-reps"));
    // a STALE calibration.json (written before the gate row existed — the one on
    // disk today) must still find the n beside the rate, never print it bare
    const fpStale = buildFingerprint({ calibration: { overconfidence_rate: 0, trend: "t", buckets: { knew: { n: 3 } } } });
    assert("#wire a pre-gate calibration.json degrades to buckets.knew.n rather than shipping the scalar alone",
      fpStale.includes("n=3 knew-reps"));
    // nothing is guessed when neither source is there
    const fpBlind = buildFingerprint({ calibration: { overconfidence_rate: 0.21, trend: "narrowing" } });
    assert("#wire no denominator anywhere ⇒ the line SAYS so, never an implied-solid number",
      fpBlind.includes("denominator unavailable") && !/P\(wrong\|knew\)=0\.21;/.test(fpBlind));
    // a shut gate is announced as provisional, and a null rate no longer vanishes
    const fpShut = buildFingerprint({ calibration: { overconfidence_rate: 1, trend: "t", gate: { sub: [{ name: "overconfidence_rate", have: 1, need: 3, open: false }] } } });
    assert("#wire a rate below its own need is stamped provisional in the prompt", fpShut.includes("BELOW ITS OWN NEED"));
    const fpNull = buildFingerprint({ calibration: { overconfidence_rate: null, trend: "t", buckets: { knew: { n: 0 } } } });
    assert("#wire zero knew-reps no longer deletes the whole calibration line — the silence names itself",
      fpNull.includes("not yet measurable") && fpNull.includes("n=0 knew-reps"));
  }
  assert("fingerprint enters every analysis prompt", buildAnalysisPrompt({ id: "x" }, {}, fp).includes("COGNITIVE FINGERPRINT"));
  assert("empty world → fixed-traits fingerprint only, no crash", buildFingerprint({}).includes("ADHD-PI"));

  // ── THE SPLIT (14 Aug 2026, unleash Phase 1) ───────────────────────────────
  // The cut must satisfy three things at once, and the third is the one that
  // makes it safe: the model must receive the SAME BYTES it received yesterday.
  {
    const pr = buildAnalysisPrompt({ id: "split_x", _note: "note" }, { "a.json": [{ x: 1 }], "b.json": "hello" }, fp);
    const s = splitPrompt(pr);
    assert("SPLIT — the head goes to --system-prompt and the ## INPUT sections stay in the body",
      s.split === "system" && s.system.includes("COGNITIVE FINGERPRINT") && s.system.includes("Job: split_x")
      && !s.system.includes("## INPUT a.json") && s.body.startsWith("\n## INPUT a.json") && s.body.includes("## INPUT b.json"));
    assert("SPLIT — NOTHING IS LOST OR REORDERED: system+body reconstructs the exact prompt, with only the organ preamble added in front",
      s.system + s.body === ORGAN_SYSTEM_PROMPT + "\n\n" + pr);
    // NOT an assertion that the head clears the cache minimum — it does not
    // (1,625 chars ≈ 406 tokens vs sonnet's 1024, measured 14 Aug; see the probe
    // record above the function). The honest witness is that the SIZE IS
    // REPORTED, so nobody re-derives the lever's value from prose again.
    console.log(`         · live analysis head = ${s.system.length} chars ≈ ${Math.round(s.system.length / 4)} tokens (sonnet caches at ≥1024, opus ≥512, haiku ≥4096)`);
    assert("SPLIT — the body carries the whole variable part and the head carries none of it (that is the only thing that makes the head stable)",
      !s.system.includes("hello") && s.body.includes("hello"));
    // the two refusals, both of which must fall back to today's exact call
    assert("SPLIT — a prompt with no ## INPUT section is NOT split (nothing stable to hoist), and says so with null",
      splitPrompt("just a question, no inputs").split === null && splitPrompt("just a question, no inputs").body === "just a question, no inputs");
    const huge = "x".repeat(30000) + "\n## INPUT a\n1";
    assert("SPLIT — a head over the Windows argv cap is sent WHOLE the old way and stamped argv-capped, never truncated",
      splitPrompt(huge).split === "argv-capped" && splitPrompt(huge).system === null && splitPrompt(huge).body === huge);
    assert("SPLIT — a body-first prompt (mark at index 0) is left alone, no empty system prompt",
      splitPrompt("\n## INPUT a\n1").split === null);
  }

  // ── PHASE 4 · the per-lane caching switch, PLUMBED AND SET NOWHERE ─────────
  // Two witnesses: the wire carries a job's own declaration through to the spawn,
  // and no lane carries it yet — because that answer is Phase 10's, off data.
  {
    let sawNoCache = null;
    const fakeExec = (p, m, x, t, l, th, noCache) => { sawNoCache = noCache; return { ok: true, text: "x", total_tokens: 1 }; };
    const jdeps = { exec: fakeExec, dry: true, now: now(14, 0) };
    await runJob({ id: "cache_off", model: "sonnet", caching: false, inputs: [] }, cfg, jdeps);
    const off = sawNoCache;
    await runJob({ id: "cache_on", model: "sonnet", inputs: [] }, cfg, jdeps);
    assert("CACHING SWITCH — a job declaring caching:false reaches the spawn as DISABLE_PROMPT_CACHING; a job that declares nothing does not",
      off === true && sawNoCache === false);
    const live = (loadConfig().jobs || []).filter((j) => j.caching === false).map((j) => j.id);
    assert("CACHING SWITCH — and it is set on NO lane yet: break-even reuse 0.278 is a measurement, not a hunch (the 13 Aug list had haiku_pulse at 0.43 on it)",
      live.length === 0, live.join(", "));
  }

  // ntfy mouth — secret topic never in committed config; two utterances only
  const cfgNtfyOn = { ...cfg, ntfy: { enabled: true, topic: "", push_after: ["formation_read"] } };
  assert("ntfy topic resolves from env fallback (config stays secret-free)", resolveNtfyTopic({ ntfy: { topic: "" } }, { ARSENAL_NTFY_TOPIC: "sekrit" }) === "sekrit");
  assert("ntfy disabled ⇒ never sends", (await pushNtfy({ ntfy: { enabled: false } }, "t", "b", async () => { throw new Error("must not be called"); })).sent === false);
  let pushed = null;
  const okFetch = async (url, opts) => { pushed = { url, body: opts.body, title: opts.headers.Title }; return { ok: true, status: 200 }; };
  const bellRes = await pushNtfy({ ntfy: { enabled: true, topic: "t1" } }, BELLS.fulltime.title, BELLS.fulltime.body, okFetch);
  assert("full-time bell sends the postmatch cue", bellRes.sent === true && pushed.body.includes("npm run postmatch"));
  assert("bell carries no shame/streak/hype language", !/streak|fail|10x|hurry|late/i.test(pushed.body));
  // E2E audit 25 Jul 2026: this check was a TAUTOLOGY — `A && B || A` (&& binds
  // tighter) reduces to A, the dead clause compared an RFC-2047 title to undefined,
  // and the SECOND utterance was never inspected at all. Both titles, explicitly.
  assert("both utterances SIGN their titles with the badge (throw-in echo filter)", BELLS.fulltime.title.includes("⚪🔴") && SHEET_PUSH_TITLE.includes("⚪🔴"));
  assert("the sheet push actually SENDS the badged title (not just declares it)", (() => { const t = ntfyHeaderSafe(SHEET_PUSH_TITLE); return Buffer.from(t.replace(/^=\?UTF-8\?B\?/, "").replace(/\?=$/, ""), "base64").toString("utf8").includes("⚪🔴"); })());
  assert("only two utterances exist (bell registry + push_after)", Object.keys(BELLS).length === 1 && cfgNtfyOn.ntfy.push_after.length === 1);
  // THE BELL MEANS ITS HOUR (29 Jul 2026) — observed live: the 21:30 bell fired
  // at 15:23 as schtasks catch-up after the laptop woke, pushing "30 seconds,
  // then sleep" mid-afternoon. Pure function of the clock, so it is testable.
  {
    const onTime = (hh, mm) => {
      const b = BELLS.fulltime;
      const [bh, bm] = String(b.at).split(":").map(Number);
      const lateBy = (hh * 60 + mm) - (bh * 60 + bm);
      return !(lateBy < -5 || lateBy > (b.grace_min || 75));
    };
    assert("BELL HOUR — the fulltime bell declares its hour + grace (B3: HIS ruling, 22:00 — he is home by 10pm)", BELLS.fulltime.at === "22:00" && BELLS.fulltime.grace_min > 0);
    assert("BELL HOUR — rings at 22:00", onTime(22, 0));
    assert("BELL HOUR — rings a little late (22:25, inside grace)", onTime(22, 25));
    assert("BELL HOUR — SILENT at 15:23, the real catch-up time that caused this", onTime(15, 23) === false);
    assert("BELL HOUR — SILENT hours early (08:00)", onTime(8, 0) === false);
    assert("BELL HOUR — SILENT past the grace (23:30)", onTime(23, 30) === false);
  }
  // the badge must SURVIVE HTTP: headers are ByteString (≤0xFF per char) — a raw
  // emoji Title throws inside Node's fetch before any I/O and the push dies as
  // "network". This mock enforces the real rule the earlier okFetch skipped.
  const strictFetch = async (url, opts) => { for (const v of Object.values(opts.headers)) { for (const ch of String(v)) if (ch.codePointAt(0) > 255) throw new TypeError("header value is not a ByteString"); } return { ok: true, status: 200 }; };
  assert("badge title survives real fetch header rules (RFC 2047, never raw emoji)", (await pushNtfy({ ntfy: { enabled: true, topic: "t1" } }, BELLS.fulltime.title, "b", strictFetch)).sent === true);
  assert("encoded title decodes back to the badge on the phone", Buffer.from(ntfyHeaderSafe(BELLS.fulltime.title).replace(/^=\?UTF-8\?B\?/, "").replace(/\?=$/, ""), "base64").toString("utf8") === BELLS.fulltime.title);
  assert("plain ASCII titles pass through untouched", ntfyHeaderSafe("Team sheet is up") === "Team sheet is up");

  // ---- THE MORNING SLOT: one utterance, whoever claims it (1 Aug 2026 audit) ----
  // The old push was gated on `res.source === "llm"`, so a validator reject, a spawn
  // timeout or a 429 wrote the sheet and silenced the phone; and when the job never ran
  // at all (9 of 15 days, laptop asleep through the window) nothing anywhere said so.
  // Both halves are now the same mouth — these hold it to exactly one utterance.
  const mCfg = { ntfy: { enabled: true, topic: "t1", push_after: ["formation_read"] } };
  assert("ABSENCE title signs with the badge (throw-in echo filter, same as the other two)", SHEET_ABSENCE_TITLE.includes("⚪🔴"));
  assert("ABSENCE title survives real fetch header rules and decodes back to the badge",
    Buffer.from(ntfyHeaderSafe(SHEET_ABSENCE_TITLE).replace(/^=\?UTF-8\?B\?/, "").replace(/\?=$/, ""), "base64").toString("utf8") === SHEET_ABSENCE_TITLE);
  assert("the two morning utterances are DISTINCT — he can tell a sheet from its absence", SHEET_ABSENCE_TITLE !== SHEET_PUSH_TITLE);
  assert("MOUTH open when the day has said nothing yet", mouthMaySpeak(mCfg, { mouth_said: {} }, "2026-08-02", "formation_read") === true);
  assert("MOUTH shut once the SHEET spoke (a retrying job cannot push twice)", mouthMaySpeak(mCfg, { mouth_said: { "2026-08-02": "sheet" } }, "2026-08-02", "formation_read") === false);
  assert("MOUTH shut once ABSENCE spoke (the alarm never repeats on later beats)", mouthMaySpeak(mCfg, { mouth_said: { "2026-08-02": "absence" } }, "2026-08-02", "formation_read") === false);
  assert("MOUTH still open on the NEXT day (the slot is per shift-day, not forever)", mouthMaySpeak(mCfg, { mouth_said: { "2026-08-02": "sheet" } }, "2026-08-03", "formation_read") === true);
  assert("MOUTH shut when ntfy is disabled", mouthMaySpeak({ ntfy: { enabled: false, push_after: ["formation_read"] } }, {}, "2026-08-02", "formation_read") === false);
  assert("MOUTH shut for any job the captain did not sanction in push_after", mouthMaySpeak(mCfg, {}, "2026-08-02", "deep_twin") === false);
  assert("MOUTH survives a queueState with no mouth_said at all (first ever run)", mouthMaySpeak(mCfg, {}, "2026-08-02", "formation_read") === true);
  // the absence alarm must close at the SAME boundary eligibility opens/shuts on —
  // a duplicated literal here is how an alarm starts lying about a window that moved.
  assert("ABSENCE reads the morning window from the same map eligibleJobs uses", jobWindows(cfg).morning[1] === "12:00" && jobWindows(cfg).morning[0] === "07:30");
  assert("ABSENCE window map honours config for overnight (not a frozen literal)", jobWindows({ overnight: { start: "23:00", end: "06:00" } }).overnight[0] === "23:00");

  // sheet slicing — the agentic-CLI chatter guard
  assert("sliceSheet strips preamble + epilogue chatter", sliceSheet("Sure! Here it is:\n⚪🔴 TEAM SHEET — x\nbody\nCOYG. ⚪🔴\nLet me know!") === "⚪🔴 TEAM SHEET — x\nbody\nCOYG. ⚪🔴");
  assert("sliceSheet passes badge-less text through to the validator", sliceSheet("no badge here") === "no badge here");

  // M-3 socket smoke: runManager with a stub llm in a hermetic state dir
  const os = await import("node:os");
  const { mkdtempSync } = await import("node:fs");
  const tmp = mkdtempSync(join(os.tmpdir(), "brain-m3-"));
  const res = await runManager({ llm: async () => null, stateDir: tmp });
  assert("M-3 SOCKET — runManager import works; fallback law intact", res && res.source === "fallback" && existsSync(join(tmp, "team_sheet.md")));

  // =========================================================================
  // E2E AUDIT 25 Jul 2026 — the regression wall. Every check below FAILS against
  // the code as it stood the night the audit ran; none of them can pass vacuously.
  // =========================================================================
  {
    // 1. TRUE TOKEN COST — the cache pair is most of a `claude -p` call's spend
    assert("LEDGER COUNTS CACHE TOKENS — the CLI's real spend is cache, not input/output",
      usageTotal({ input_tokens: 4, output_tokens: 600, cache_creation_input_tokens: 14000, cache_read_input_tokens: 9000 }) === 23604);
    assert("token accounting is defensive — no usage object ⇒ zero, never NaN",
      usageTotal(null) === 0 && usageTotal({}) === 0 && usageTotal({ input_tokens: 10 }) === 10);

    // 2. DRY IS DRY — --dry must never reach the real executor
    const dryDeps = buildDeps(now(23, 0), ["node", "brain.mjs", "daemon", "--dry"]);
    const wetDeps = buildDeps(now(23, 0), ["node", "brain.mjs", "daemon"]);
    assert("--dry NEVER reaches the real `claude -p` executor (preview costs nothing)",
      dryDeps.dry === true && dryDeps.exec !== claudeExec && dryDeps.gexec !== geminiExec);
    assert("a dry call is a ZERO-token no-op that still looks like a success to the pipeline",
      dryDeps.exec("prompt", "opus").total_tokens === 0 && dryDeps.exec("p", "opus").ok === true);
    assert("without --dry the real executors are wired exactly as before",
      wetDeps.dry === false && wetDeps.exec === claudeExec && wetDeps.gexec === geminiExec);

    // 3. RETRY CAP — a deterministically-failing job must stop re-running every beat
    const qBurned = { jobs_run: {}, jobs_failed: { "2026-07-12": { day_cartridge: 3 } } };
    const qOne = { jobs_run: {}, jobs_failed: { "2026-07-12": { day_cartridge: 1 } } };
    assert("RETRY CAP — a job that burned its attempts this shift sits out (no 75s retry storm)",
      !eligibleJobs(cfg, qBurned, now(23, 30)).some(j => j.id === "day_cartridge"));
    assert("RETRY CAP — under the cap the job still retries (failure keeps its slot)",
      eligibleJobs(cfg, qOne, now(23, 30)).some(j => j.id === "day_cartridge"));
    assert("RETRY CAP — attempts are keyed to the SHIFT, so the next evening is a clean slate",
      eligibleJobs(cfg, qBurned, new Date(2026, 6, 13, 22, 30)).some(j => j.id === "day_cartridge"));
    const qF = {}; recordJobFail(qF, { id: "wall_insights", window: "overnight" }, now(23, 30), cfg);
    assert("a validator rejection COUNTS as an attempt (the tokens were really spent)",
      attemptsOn(qF, "2026-07-12", "wall_insights") === 1);

    // 4. MANUAL RUN spends the slot (else the 08:45 tick pushes the sheet twice)
    const qManual = {}; recordJobRun(qManual, cfg.jobs.find(j => j.id === "formation_read"), now(8, 40), cfg);
    assert("MANUAL RUN consumes the daily slot — the scheduled tick won't double-push the sheet",
      !eligibleJobs(cfg, qManual, now(8, 45)).some(j => j.id === "formation_read"));

    // 5. ONE SHIFT, ONE DATE — a first run after midnight reads the shift it belongs to
    const past2am = new Date(2026, 6, 13, 0, 30);
    const giShift = gatherInputs({ window: "overnight", inputs: ["no_such_dir_xyz/TODAY.md"] }, past2am, shiftDay({ window: "overnight" }, past2am, cfg));
    assert("MIDNIGHT SEAM — overnight TODAY-inputs resolve to the SHIFT day, not the empty new calendar day",
      Object.keys(giShift)[0] === "no_such_dir_xyz/2026-07-12.md");
    const giDay = gatherInputs({ window: "morning", inputs: ["no_such_dir_xyz/TODAY.md"] }, new Date(2026, 6, 13, 8, 45));
    assert("daytime jobs still read the plain calendar day (unchanged)",
      Object.keys(giDay)[0] === "no_such_dir_xyz/2026-07-13.md");

    // 6. CEILING OBSERVATION must include the drain that CAUSED the limit
    {
      const qCeil = { observed_window_ceiling: 1000000, jobs_run: {} };
      let n = 0;
      const drainThenLimit = () => (++n <= 3)
        ? { ok: true, text: "steady read, nothing invented", total_tokens: 300000, duration_ms: 5, limit_hit: false, error: null }
        : { ok: false, text: null, total_tokens: 0, duration_ms: 5, limit_hit: true, error: "session limit · resets 7am" };
      // The whole regression's arithmetic (prev 1.0M · drain 900k · blend 960k · floor)
      // was measured in the 800k-estimate era, so the estimate is PINNED here — with the
      // live doubled estimate (P1 unleash, 9 Aug 2026) the 1.6M floor would swallow the
      // 960k blend and the assertion would test the floor, not the observation.
      await tick({ ...cfg, budget: { ...cfg.budget, window_capacity_est_tokens: 800000 }, jobs: cfg.jobs.filter(j => j.kind !== "manager_m3").map(j => ({ ...j, inputs: [] })) },
        { exec: drainThenLimit, gexec: () => ({ ok: false }), now: now(23, 30), dry: true, ledger: [], queueState: qCeil });
      // 3×300k spent inside this tick, then the limit. blend(prev 1.0M, observed 900k)
      // = 960k. Reading only the START-OF-TICK ledger observes 0 → blend collapses to
      // 800k (the estimate floor) and the learned ceiling is dragged DOWN by a drain
      // that actually proved the window is big.
      assert("CEILING OBSERVATION includes THIS tick's own spend (a limit after a 900k drain is not 'observed 0')",
        qCeil.observed_window_ceiling === 960000);
    }

    // 7. QUEUE MERGE — a trigger armed mid-tick must survive the end-of-beat write
    const diskQ = { triggers: { reanalysis: { ts: "armed-mid-tick" }, doubt: { ts: "old" } }, jobs_run: { "2026-07-11": { x: 1 } } };
    const mineQ = { triggers: { doubt: { ts: "old" } }, jobs_run: { "2026-07-12": { drill_forge: 1 } }, last_tick: "now" };
    const merged = mergeTriggers(diskQ, mineQ, ["doubt"]);
    assert("QUEUE MERGE — a trigger armed WHILE the tick ran is not erased by the tick's write",
      !!merged.triggers.reanalysis);
    assert("QUEUE MERGE — a trigger this tick CONSUMED stays consumed", !merged.triggers.doubt);
    assert("QUEUE MERGE — brain still owns every non-trigger key",
      merged.jobs_run["2026-07-12"].drill_forge === 1 && merged.last_tick === "now" && merged.jobs_run["2026-07-11"] === undefined);
    assert("QUEUE MERGE — no readable queue on disk ⇒ write ours (first run never blocks)",
      mergeTriggers(null, mineQ, []) === mineQ);

    // 8. THE DEAD-BRAIN ALARM (live finding: 732 straight failures, four silent days)
    const deadRows = Array.from({ length: 10 }, () => ({ engine: "claude", ok: false, ts: now(22, 0).toISOString(), total_tokens: 0, error: 'Not logged in · Please run /login' }));
    const hDead = failureStreak(deadRows);
    assert("DEAD BRAIN — an all-failed tail is detected and NAMED (login, not mystery)",
      hDead.dead === true && hDead.streak === 10 && hDead.not_logged_in === true && /login/.test(hDead.hint));
    assert("DEAD BRAIN — one success at the tail clears the alarm (an old outage never nags)",
      failureStreak(deadRows.concat([{ engine: "claude", ok: true, ts: now(22, 5).toISOString() }])).dead === false);
    assert("DEAD BRAIN — the fuel gauge carries the ok-rate, so the doctor can see a dead brain",
      tokenVitals(cfg, deadRows, qEmpty, now(23, 0)).health.dead === true);
    // ── THE CAUSE IS READ, NOT ASKED FOR (wiring audit, 10 Aug 2026) ─────────
    // claudegen produced error_envelope on every failure from 4 Aug and 0 of the
    // organism's 4,558 ledger rows ever carried it, because no caller wrote it
    // and no reader wanted it. These three checks are the wire: drop the
    // envelope out of forensicText(), or stop spreading ledgerForensics in
    // nightshift/dmn, and the first one goes red.
    {
      const wallRows = Array.from({ length: 6 }, () => ({
        engine: "claude", ok: false, ts: now(22, 0).toISOString(), total_tokens: 0,
        error: "You've hit your weekly limit · resets Jul 20, 11:30pm",   // the human message alone names no status
        error_envelope: '{"type":"result","is_error":true,"api_error_status":429,"result":"You\'ve hit your weekly limit · resets Jul 20, 11:30pm"}',
      }));
      const hWall = failureStreak(wallRows);
      assert("DEAD BRAIN — error_envelope is READ: a 429 wall is named a PLAN WALL, not a mystery",
        hWall.cause === "plan_limit" && hWall.http_status === 429 && hWall.limit_signal === "api_error_status"
        && /PLAN WALL/.test(hWall.hint) && !/brain_ledger\.jsonl/.test(hWall.hint));
      // the discrimination that matters: same shape, server fault — waiting will
      // not clear it, and it must never be excused as a quota death
      const bugRows = wallRows.map(r => ({ ...r, error_envelope: '{"is_error":true,"api_error_status":500,"result":"internal error"}', error: "internal error" }));
      const hBug = failureStreak(bugRows);
      assert("DEAD BRAIN — a 500 is a SERVER fault, never excused as the plan wall",
        hBug.cause === "api_error" && hBug.http_status === 500 && /NOT a plan wall/.test(hBug.hint));
      // the 2,365 rows already on disk: status only in the error TEXT, no field,
      // no envelope — the retro-fit must still name them
      const legacyRows = wallRows.map(r => ({ engine: "claude", ok: false, ts: r.ts, total_tokens: 0, error: r.error_envelope.slice(0, 200) }));
      assert("DEAD BRAIN — a legacy row whose status lives only in its error TEXT is still named",
        failureStreak(legacyRows).cause === "plan_limit" && failureStreak(legacyRows).http_status === 429);
      // …and the login verdict still outranks every status (it is the one a human must act on)
      assert("DEAD BRAIN — logged-out still wins over any status code",
        failureStreak(deadRows).cause === "not_logged_in" && failureStreak(deadRows).not_logged_in === true);

      // ── THE KILL IS READ TOO (wiring pass, 11 Aug 2026) ───────────────────
      // claudegen has stamped killed/kill_signal on every result since 10 Aug
      // and projected both onto the ledger row, and NO organ read either — a
      // night of SIGTERM'd calls resolved to cause "unknown". These go red the
      // moment killOf stops being consulted or the timeout branch is dropped
      // back into the mystery lane.
      // Fixtures are claudegen's own two shapes, verbatim: the FIELD (what
      // ledgerForensics writes on nightshift/dmn/council rows) and the TEXT
      // (parseErr's `KILLED (SIGTERM) after <n>ms` prefix, which every caller
      // copies onto `error`, brain's own job runner included).
      const killField = Array.from({ length: 6 }, () => ({
        engine: "claude", ok: false, ts: now(22, 0).toISOString(), total_tokens: 0,
        error: "Command failed: claude", killed: true, kill_signal: "SIGTERM",
      }));
      const hKill = failureStreak(killField);
      assert("DEAD BRAIN — a SIGTERM'd tail is named a TIMEOUT, never the 'unknown' mystery branch",
        hKill.cause === "timeout" && hKill.timed_out === true && hKill.kills === 6
        && hKill.kill_signal === "SIGTERM" && /CUT OFF/.test(hKill.hint) && !/Last error reads/.test(hKill.hint));
      const killText = Array.from({ length: 6 }, () => ({
        engine: "claude", ok: false, ts: now(22, 0).toISOString(), total_tokens: 0,
        error: "KILLED (SIGTERM) after 300012ms — the CLI was cut off, not answered. Command failed: claude",
      }));
      assert("DEAD BRAIN — a row that names its kill only in the error TEXT is counted too (brain's own rows carry no forensics field)",
        failureStreak(killText).cause === "timeout" && failureStreak(killText).kills === 6);
      // the discrimination that pays for the branch: a kill is NOT a wall and NOT a login
      assert("DEAD BRAIN — a timeout is never excused as a plan wall, and never blamed on /login",
        hKill.http_status === null && hKill.not_logged_in === false && !/PLAN WALL/.test(hKill.hint));
      // …and a tail that names a status keeps the cause it had yesterday (ADDITIVE law)
      const wallKilled = wallRows.map(r => ({ ...r, killed: true, kill_signal: "SIGTERM" }));
      const hWK = failureStreak(wallKilled);
      assert("DEAD BRAIN — a 429 tail that ALSO got axed is still a PLAN WALL (the new branch only splits 'unknown'), and the kill still rides the object",
        hWK.cause === "plan_limit" && hWK.http_status === 429 && hWK.timed_out === true && hWK.kills === 6);
      assert("DEAD BRAIN — a healthy-shaped failure with no kill anywhere stays 'unknown' (no phantom timeouts)",
        failureStreak(Array.from({ length: 6 }, () => ({ engine: "claude", ok: false, ts: now(22, 0).toISOString(), error: "something else broke" }))).cause === "unknown");
      assert("DEAD BRAIN — the timeout verdict reaches the fuel gauge the doctor/watchman/card organ already open",
        tokenVitals(cfg, killField, qEmpty, now(23, 0)).health.cause === "timeout");
    }

    // 9. CONFIG UNREADABLE must be loud, not a silent zero-job brain
    {
      const { mkdtempSync } = await import("node:fs");
      const osx = await import("node:os");
      const bad = join(mkdtempSync(join(osx.tmpdir(), "brain-cfg-")), "brain_config.json");
      writeFileSync(bad, '{ "jobs": [], }');
      const orig = console.error; let spoke = 0; console.error = () => { spoke++; };
      const broken = loadConfig(bad);
      console.error = orig;
      assert("CONFIG BROKEN — a malformed canon config SAYS SO and is flagged, never a silent idle brain",
        spoke > 0 && typeof broken._config_error === "string" && broken.jobs.length === 0);
      assert("CONFIG MISSING — an absent file is still the quiet, legal first-run default",
        loadConfig(join(dirname(bad), "no-such-config.json"))._config_error === undefined);
    }

    // 10. GEMINI SHIM — %APPDATA% with a space is a real machine, not a hypothetical
    const spaced = geminiCommand("gemini", { platform: "win32", appdata: "C:\\Users\\Some Captain\\AppData\\Roaming", exists: () => true });
    assert("GEMINI SHIM — a spaced %APPDATA% path is QUOTED before cmd.exe parses it",
      spaced.shell === true && spaced.cmd === '"C:\\Users\\Some Captain\\AppData\\Roaming\\npm\\gemini.cmd"');
    assert("GEMINI SHIM — no shell ⇒ no quotes (quotes would become part of the filename)",
      geminiCommand("gemini", { platform: "linux", appdata: null, exists: () => false }).cmd === "gemini");
    assert("GEMINI SHIM — a config-supplied binary string can never inject into cmd.exe",
      geminiCommand("gemini & del x", { platform: "win32", appdata: "C:\\a", exists: () => true }).ok === false);

    // 11. TICK LOCK — only EADDRINUSE means "another tick is running"
    assert("TICK LOCK — a genuinely in-use port reads as locked",
      lockVerdict({ code: "EADDRINUSE" }) === "locked");
    assert("TICK LOCK — an UNBINDABLE port is a FAULT, not a phantom concurrent tick",
      lockVerdict({ code: "EACCES" }) === "unbindable" && lockVerdict({ code: "EADDRNOTAVAIL" }) === "unbindable");
    assert("TICK LOCK — a clean bind is acquired", lockVerdict(null) === "acquired");
  }

  // =========================================================================
  // AUDIT 2 Aug 2026 — the second regression wall. Every check below FAILS against
  // the code as it stood before this pass. The FROZEN pre-audit engines
  // (allowedNumbersLegacy / noNewNumbersLegacy) are kept live in the file precisely so
  // the drift can be asserted in BOTH directions instead of described in a comment.
  // =========================================================================
  {
    const os2 = await import("node:os");
    const { mkdtempSync: mkd } = await import("node:fs");

    // ---- #59 · the 0–31 whitelist hole, both directions ------------------
    const F59 = { reps: 9, capsules: 4, date: "2026-08-02" };
    assert("#59 LEGACY (frozen witness) — the old validator WAVED THROUGH 'cards due: 12 (+9 overdue)'",
      noNewNumbersLegacy("cards due: 12 (+9 overdue)", F59).ok === true);
    assert("#59 LIVE — the shared validator BOUNCES it, naming the invented token",
      validateOutput({ validate: "no_new_numbers" }, "cards due: 12 (+9 overdue)", F59, cfg).ok === false
      && /invented number: 12/.test(validateOutput({ validate: "no_new_numbers" }, "cards due: 12 (+9 overdue)", F59, cfg).reason));
    assert("#59 LEGACY — the old validator STRIPPED dates and clock times, so an invented deadline passed",
      noNewNumbersLegacy("we ship by 2026-12-25, lights out 22:45", F59).ok === true);
    assert("#59 LIVE — an invented deadline and an invented clock window both bounce now",
      validateOutput({ validate: "no_new_numbers" }, "we ship by 2026-12-25", F59, cfg).ok === false
      && validateOutput({ validate: "no_new_numbers" }, "lights out by 22:45", F59, cfg).ok === false);
    assert("#59 — an HONEST number that traces to the inputs still passes (no honest output lost)",
      validateOutput({ validate: "no_new_numbers" }, "9 reps, 4 capsules, on 2026-08-02", F59, cfg).ok === true);
    assert("#59 — brain's allowedNumbers IS the shared one now (0–31 laundering is gone)",
      allowedNumbers({}).has("12") === false && allowedNumbers({}).has("31") === false
      && allowedNumbersLegacy({}).has("12") === true && allowedNumbersLegacy({}).has("31") === true);

    // ---- #60 · comma-grouped thousands -----------------------------------
    assert("#60 LEGACY — '10,000' split into ['10','000'] and bounced a number the model was HANDED",
      noNewNumbersLegacy("the wall shows 10,000 tokens", { tokens: 10000 }).ok === false
      && noNewNumbersLegacy("the wall shows 10,000 tokens", { tokens: 10000 }).bad === "000");
    assert("#60 LIVE — comma-grouped thousands and Indian lakh grouping both survive",
      validateOutput({ validate: "no_new_numbers" }, "the wall shows 10,000 tokens", { tokens: 10000 }, cfg).ok === true
      && validateOutput({ validate: "no_new_numbers" }, "that is 1,00,000 rupees", { amt: 100000 }, cfg).ok === true);
    assert("#60 — a comma-grouped number that is NOT in the data still bounces (the guard did not loosen)",
      validateOutput({ validate: "no_new_numbers" }, "the wall shows 99,999 tokens", { tokens: 10000 }, cfg).ok === false);

    // ---- #59 · `shown` threading — the "invented 90" bug, prevented here --
    // buildAnalysisPrompt injects the literal 25 in its own LAWS line. Under a tightened
    // whitelist and WITHOUT `shown`, brain would have bounced the model for a number the
    // wrapper itself put in front of it — recreating the already-audited manager bug.
    const j59 = { id: "shown_probe", validate: "no_new_numbers", inputs: [], out: "shown_probe" };
    const p59 = buildAnalysisPrompt(j59, {}, "", cfg.guards.banned_phrases);
    assert("#59 — the assembled prompt really does carry a digit that is in NO input (the 25-line law)",
      /≤ 25 lines/.test(p59) && !("25" in {}));
    assert("#59 — WITHOUT `shown` that digit is 'invented' (the bug this would have been)",
      validateOutput(j59, "hold it to 25 lines today", {}, cfg).ok === false);
    assert("#59 — WITH `shown` threaded it passes, and runJob threads it for real",
      validateOutput(j59, "hold it to 25 lines today", {}, cfg, p59).ok === true);
    {
      const r59 = await runJob(j59, cfg, { exec: () => ({ ok: true, text: "hold it to 25 lines today", total_tokens: 10, duration_ms: 1, limit_hit: false, error: null }), gexec: () => ({ ok: false }), now: now(23, 30), dry: true });
      assert("#59 END-TO-END — runJob hands validateOutput the prompt it actually sent (not a fresh reject)",
        r59.usage.ok === true && /→ brain_out\/shown_probe\//.test(r59.note));
    }

    // ---- #61 · quotes_only pairing (lexicon_mine, 0-for-115) -------------
    const lex61 = { anchors: [{ phrase: "one picture" }, { phrase: "tera finops" }, { phrase: "the whole machine is one long sentence" }] };
    const annotated = '"one picture" (4× · context+emb) and "tera finops" (×2)';
    assert("#61 LEGACY (the exact live failure) — a sub-12-char anchor DESYNCED the pairing and captured the annotation",
      (String(annotated).match(/"([^"]{12,})"/g) || []).some(m => m.includes("(4×")));
    assert("#61 LIVE — sequential pairing accepts his real, verbatim, sub-12-char anchors",
      validateOutput({ validate: "quotes_only" }, annotated, lex61, cfg).ok === true);
    assert("#61 — a genuinely non-verbatim long quote is STILL caught (the guard did not loosen)",
      validateOutput({ validate: "quotes_only" }, 'he said "this phrase was never anywhere in the input"', lex61, cfg).ok === false);

    // ---- #62 · the hype guard, opt-out per job ---------------------------
    assert("#62 — 'exponential' is gone from the defaults AND from the committed config (softmax IS an exponential)",
      !DEFAULTS.guards.banned_phrases.includes("exponential") && !(liveCfg.guards.banned_phrases || []).includes("exponential"));
    assert("#62 — the real technical sentence that cost 185,983 tokens now passes",
      validateOutput({ validate: null }, "Probe angle: softmax normalises by the exponential of each score, so attention cost grows quadratically.", {}, cfg).ok === true);
    assert("#62 — genuine hype is still bounced on a guarded job", validateOutput({ validate: null }, "this is a 10x week", {}, cfg).ok === false);
    assert("#62 — hype_guard:false opts a machine-side job out; the default is GUARDED",
      hypeGuardOn({}) === true && hypeGuardOn({ hype_guard: false }) === false
      && validateOutput({ hype_guard: false }, "this is a 10x week", {}, cfg).ok === true);
    // THE TRAP, held as an assertion: `job.speak_to || validate==="no_new_numbers"` would
    // have stripped the guard from evening_voice, which has NEITHER.
    {
      const ev = liveCfg.jobs.find(j => j.id === "evening_voice");
      assert("#62 TRAP — evening_voice has neither speak_to nor validate, and KEEPS the hype guard",
        !!ev && !ev.speak_to && !ev.validate && hypeGuardOn(ev) === true);
      assert("#62 — every job the captain HEARS or READS keeps the guard",
        ["evening_voice", "teamtalk_am", "teamtalk_pm", "day_cartridge", "midday_cartridge", "wall_insights", "drill_forge"]
          .every(id => hypeGuardOn(liveCfg.jobs.find(j => j.id === id) || {}) === true));
      assert("#62 — the prompt's own LAWS line no longer orders a job not to say a word that is not banned",
        !/exponential/.test(buildAnalysisPrompt({ id: "x" }, {}, "", cfg.guards.banned_phrases))
        && /machine-side analysis/.test(buildAnalysisPrompt({ id: "x", hype_guard: false }, {}, "", cfg.guards.banned_phrases)));
    }

    // ---- #63 · every job declares where its output appears ---------------
    {
      const sa = surfaceAudit(liveCfg);
      assert("#63 — EVERY enabled job in the committed config declares a surface (have/need, not a word)",
        sa.have === sa.need && sa.orphans.length === 0 && sa.need > 0);
      // PHASE 9 (14 Aug 2026): widget_spec and drill_forge were TWO of these four
      // and are now closed — traced end to end on 13 Aug, neither had a reader,
      // human or machine, and "designed for his eyes" is only true if his eyes
      // ever arrive. His §0 ruling closed them. The assertion's real subject is
      // unchanged and still live for the two that remain: a human_file lane must
      // be ON and addressed BY PATH, never merely declared.
      assert("#63 — the DESIGNED-to-be-human-read jobs still open are ON and addressed by file path",
        ["doubt_clusters", "market_scan"].every(id => {
          const j = liveCfg.jobs.find(x => x.id === id);
          return j && j.enabled !== false && jobSurface(j).kind === "human_file" && /brain_out\//.test(jobSurface(j).where || "");
        }));
      assert("#63 — every DISABLED job says WHY and names what would bring it back",
        liveCfg.jobs.filter(j => j.enabled === false).length > 0
        && liveCfg.jobs.filter(j => j.enabled === false).every(j => /RE-ENABLE WHEN/.test(JSON.stringify(j))));
      // G9 (9 Aug 2026) INVERTED #63's midday_reread half: the job is back ON —
      // but ONLY because its reader finally exists. The regression this line now
      // guards is the ORIGINAL sin returning: enabled with no consumer. The exact
      // re-enable condition the 2-Aug note named (evening_voice lists the file)
      // must hold as long as the job is on, and the input must NEVER be required
      // (orphanChain law — a missing midday must not kill the evening voice).
      assert("#63/G9 — midday_reread is ON only WITH its reader: evening_voice lists brain_out/midday/TODAY.md, un-required",
        (() => {
          const mr = liveCfg.jobs.find(j => j.id === "midday_reread") || {};
          const ev = liveCfg.jobs.find(j => j.id === "evening_voice") || {};
          const listed = (ev.inputs || []).some(i => (typeof i === "string" ? i : i.path) === "brain_out/midday/TODAY.md");
          const req = (ev.inputs || []).some(i => typeof i === "object" && i.path === "brain_out/midday/TODAY.md" && i.required === true);
          return mr.enabled !== false ? (listed && !req) : true;
        })());
      // WIRING AUDIT (11 Aug 2026) — THE FORGOTTEN FLIP. Twice now a ladder step
      // built the reader a disabled job was waiting for, flipped enabled:true, and
      // left the SURFACE block untouched: G9 on midday_reread (fixed by the H0 audit
      // 10 Aug) and G10 on capsule_premap, which still declared
      // `human_file · "DISABLED: nothing opens this today"` while nightshift.mjs read
      // it every night. That is not cosmetic — `brain status` prints every human_file
      // lane under "for your eyes (nothing reads these — glance and bin)", so the
      // address map told the captain a load-bearing lane was disposable; and
      // reconcile.mjs:262 EXEMPTS kind human_file from the no-reader bleed, so the
      // day nightshift's read broke, the lie would have absorbed the alarm.
      // The net is the SHAPE, not the one job: an enabled lane may not claim to be
      // his-eyes-only while its own address says nothing opens it. Both repaired
      // blocks quote the old string inside their correction prose, so the kind is
      // half the test — the contradiction only exists when it is still human_file.
      assert("WIRING — no ENABLED job declares human_file while its own address says nothing opens it (the G9/G10 forgotten flip)",
        (() => {
          const liars = (liveCfg.jobs || []).filter(j => j.enabled !== false)
            .filter(j => jobSurface(j).kind === "human_file" && /DISABLED:|nothing opens this/i.test(jobSurface(j).where || ""))
            .map(j => j.id);
          if (liars.length) console.log(`   ↳ contradicting surfaces: ${liars.join(", ")}`);
          return liars.length === 0;
        })());
      // …and the specific wire, proven at BOTH ENDS the way the night coach's is
      // (same method, ~line 4316): derive the lane exactly as the emitter does
      // (job.out || job.id) and demand the literal appear in the reader's source in
      // one of the two join() spellings the tree uses. Fails if the surface is
      // flipped back, if the job's `out` is renamed, or if nightshift's gemCartridge
      // read is deleted. What it CANNOT prove is that nightshift ever executes —
      // that is the ArsenalFC-NightShift task's business, not a selftest's.
      assert("WIRING — capsule_premap's premap lane is named at both ends: surface cites nightshift, nightshift reads the lane",
        (() => {
          const cp = (liveCfg.jobs || []).find(j => j.id === "capsule_premap");
          if (!cp || cp.enabled === false) return true;   // off is a decision, not a defect
          const lane = cp.out || cp.id;
          const s = jobSurface(cp);
          const src = readFileSync(join(__dirname, "nightshift.mjs"), "utf8");
          return s.kind === "code" && /nightshift\.mjs/.test(s.where || "")
            && (src.includes(`"brain_out/${lane}"`) || src.includes(`"brain_out", "${lane}"`));
        })());
      assert("#63 — an undeclared surface is reported, never silently trusted",
        jobSurface({}).declared === false && jobSurface({ surface: { kind: "banana" } }).declared === false
        && jobSurface({ surface: { kind: "code", where: "viz.mjs:647" } }).where === "viz.mjs:647");
      // the address itself: runJob's note names the surface, and the ledger row carries the note
      const jh = { id: "human_probe", out: "human_probe", inputs: [], surface: { kind: "human_file", where: "brain_out/human_probe/<date>.md — glance it" } };
      const rh = await runJob(jh, cfg, { exec: () => ({ ok: true, text: "a proposal", total_tokens: 5, duration_ms: 1, limit_hit: false, error: null }), gexec: () => ({ ok: false }), now: now(23, 30), dry: true });
      assert("#63 — the run note names the FILE and the SURFACE, so a human-read file finally points at itself",
        /brain_out\/human_probe\//.test(rh.note) && /reads at: /.test(rh.note));
      const rn = await runJob({ id: "orphan_probe", out: "orphan_probe", inputs: [] }, cfg, { exec: () => ({ ok: true, text: "x", total_tokens: 5, duration_ms: 1, limit_hit: false, error: null }), gexec: () => ({ ok: false }), now: now(23, 30), dry: true });
      assert("#63 — a job with NO declared surface says so out loud on every run", /NO SURFACE DECLARED/.test(rn.note));
    }

    // ---- #64 · required inputs, and the ratio TRAP -----------------------
    {
      assert("#64 — an input may be a plain string (optional, unchanged) or {path, required}",
        JSON.stringify(normalizeInputs({ inputs: ["a.json", { path: "b.json", required: true }] }))
        === JSON.stringify([{ path: "a.json", required: false }, { path: "b.json", required: true }]));
      const jAbs = { id: "abs", inputs: ["no_such_a.json", "no_such_b.jsonl", { path: "no_such_c.json", required: true }], out: "abs" };
      const a = gatherInputsAudited(jAbs, now(23, 30));
      assert("#64 — absence is COUNTED and NAMED, not silently rendered as the literal `null`",
        a.declared === 3 && a.absent.length === 3 && a.present === 0 && a.required_absent.length === 1 && a.required_absent[0] === "no_such_c.json");
      const rReq = await runJob(jAbs, cfg, { exec: () => { throw new Error("spent tokens on a job missing a REQUIRED input"); }, gexec: () => ({ ok: false }), now: now(23, 30), dry: true });
      assert("#64 — a REQUIRED absent input skips the job BEFORE the spend, and says which file",
        rReq.usage.ok === false && rReq.usage.total_tokens === 0 && /REQUIRED input\(s\) absent: no_such_c\.json/.test(rReq.note));
      // THE TRAP: a majority-ratio guard misses deep_reanalysis at exactly 50% and kills
      // teamtalk_am at 75%. Both shapes are held here, from the committed config.
      const tta = liveCfg.jobs.find(j => j.id === "teamtalk_am");
      const dre = liveCfg.jobs.find(j => j.id === "deep_reanalysis");
      // DORMANT-SAFE (7 Aug 2026, the away-day red). These two began as live regression
      // nets and had become CLOCKS of this exact machine's state: "3-of-4 absent" was
      // true at home and false (4-of-4) on every fresh checkout, so CI went red on a
      // statement about a different computer. The TRAP's real claims are environment-
      // stable and are what is asserted now: teamtalk_am declares 4 inputs, NONE
      // required — so however many are absent it degrades in words and is never killed
      // (a majority-ratio guard would have killed it); and the exactly-50% shape a
      // majority rule can never catch is held by a FIXTURE whose present half is a
      // TRACKED file, identical in every checkout.
      // The kill-proof property is CONFIG SHAPE, not today's disk: teamtalk declares 4
      // inputs of which 3 are OPTIONAL — so a majority of its inputs can be absent and
      // it still runs (degrading in words). That is true in every checkout, forever.
      const ttaDecl = normalizeInputs(tta);
      assert("#64 TRAP — teamtalk_am (4 declared, 3 optional) survives a majority of its inputs being absent BY SHAPE (a majority-ratio guard would kill it)",
        ttaDecl.length === 4 && ttaDecl.filter(d => !d.required).length === 3 && Array.isArray(dre.inputs) && dre.inputs.length >= 2);
      const jHalf = { id: "half", inputs: ["concepts.json", "no_such_half.json"], out: "half" };
      assert("#64 TRAP — an exactly-50%-absent job is a shape no majority rule would ever catch (fixture: one tracked file + one missing)",
        gatherInputsAudited(jHalf, now(23, 30)).absent.length * 2 === gatherInputsAudited(jHalf, now(23, 30)).declared);
      // HERMETIC (audit 6 Aug 2026). This began as a live regression net and had become
      // a CLOCK. Two required inputs are brain_out artifacts this same pipeline PRODUCES
      // (midday_cartridge and day_cartridge each require dugout_digest's dated .md), so on
      // any day the organism has not run they are legitimately absent and this went red —
      // and brain sits at position 16 of 43 in a && chain, so 27 organs stopped being run
      // at all. Measured 6 Aug 2026 with the schedule disarmed: exactly those two.
      // The claim splits in two, and both halves stay real:
      //   · a required input OUTSIDE brain_out/ is infrastructure — it must exist NOW.
      //   · a required input INSIDE brain_out/ is a CHAIN dependency — assert its PRODUCER
      //     job exists and is enabled, which is the config typo the net was actually for.
      const enabledJobs = liveCfg.jobs.filter(j => j.enabled !== false);
      const requiredOf = (j) => normalizeInputs(j).filter(d => d.required).map(d => d.path);
      const infraMissing = enabledJobs.flatMap((j) => {
        const day = shiftDay(j, new Date(), liveCfg);
        return requiredOf(j).filter(p => !p.startsWith("brain_out/"))
          .filter(p => !existsSync(join(STATE_DIR, p.replace(/TODAY/g, day))));
      });
      // WARM-MACHINE NET (7 Aug 2026, the away-day red). "Required infrastructure must
      // exist NOW" is a statement about HIS machine, not about a fresh checkout — the
      // required files (drills.json, slip.jsonl) are gitignored personal state, absent
      // in every CI clone by construction, so this net went red on a truth about a
      // different computer. It runs only where the organism actually lives (marker:
      // the afferent bus, gitignored and always present on a live machine) and SAYS
      // it skipped elsewhere — a skip with its reason, never a silent green.
      const WARM = existsSync(join(STATE_DIR, "afferent.jsonl"));
      if (WARM) {
        assert("#64 — every required input OUTSIDE the pipeline resolves on disk TODAY (the regression net — live machine only)",
          infraMissing.length === 0);
      } else {
        console.log("  ~ SKIP #64 infra net — dormant checkout (no afferent bus): required personal state is absent here by construction");
      }
      // ── NOT EVERY brain_out/ DIRECTORY IS PRODUCED BY A JOB (17 Aug 2026) ────
      // This asked one question — "is there an enabled job whose `out` is this
      // directory?" — and that was the whole truth until a job declared
      // `brain_out/dugout/TODAY.md` REQUIRED (the claim auditor, truth layer BLOCK 2:
      // an audit of a transcript that does not exist is an opus call spent proving
      // nothing). `brain_out/dugout/` is written by the VOICE SURFACE, not by any job
      // here, so a correct declaration read as a chain typo.
      // The second producer is DECLARED IN THE CONFIG, beside the input, as
      // `produced_by: "<organ>.mjs"`. It is data rather than a code scan on purpose:
      // scanning every sibling for the string would have meant a directory read with
      // a runtime path, i.e. a new unresolved sink in xray's static graph, and the
      // per-organ ratchet is a real budget — the work order's own trap #5 says fix
      // legibility, never widen the budget. And it is NOT a rubber stamp: the named
      // organ must exist in this tree, checked below, so a typo in the declaration
      // fails exactly as loudly as a typo in the path it excuses.
      const declaredProducer = (j, p) => (j.inputs || []).some((i) => i && typeof i === "object" && i.path === p && i.produced_by);
      const orphanChain = enabledJobs.flatMap((j) => requiredOf(j).filter(p => p.startsWith("brain_out/"))
        .filter((p) => {
          const producer = p.split("/")[1];
          return !liveCfg.jobs.some(k => k.out === producer && k.enabled !== false) && !declaredProducer(j, p);
        }));
      assert("#64 — every required brain_out/ input is produced by an ENABLED job, or DECLARES the organ outside the pipeline that writes it (a chain typo still fails; a cold pipeline does not)",
        orphanChain.length === 0, orphanChain.join(", "));
      // THE OTHER HALF OF THIS GUARD LIVES IN organism_test.mjs, deliberately: proving
      // the declared organ really exists needs a read of the scripts directory with a
      // runtime path, which is a new unresolved sink here (measured: brain.mjs 52->53,
      // and the ratchet said so within the minute). The cross-organ suite already walks
      // that directory for every selftest it runs, so the check is free there and costs
      // nothing in legibility — `grep -n "declared external producer" scripts/organism_test.mjs`.
      // Trap #5 of the work order, obeyed: move the code, never the budget.
      // concepts.json, not drills.json: the present half must be a TRACKED file so the
      // 1/2-present claim is identical at home and in a fresh checkout (drills.json is
      // gitignored personal state — the exact reason this assert was a clock).
      const rOpt = await runJob({ id: "opt", inputs: ["no_such_x.json", "concepts.json"], out: "opt" }, cfg,
        { exec: () => ({ ok: true, text: "thin data, saying less", total_tokens: 7, duration_ms: 1, limit_hit: false, error: null }), gexec: () => ({ ok: false }), now: now(23, 30), dry: true });
      assert("#64 — an OPTIONAL absent input still runs, and the run reports what it was built from",
        rOpt.usage.ok === true && rOpt.inputs_absent === 1 && rOpt.inputs_declared === 2 && /inputs 1\/2 present/.test(rOpt.note));

      // ---- #64's READ BACK (10 Aug 2026) · the wire, netted --------------------
      // The assert above nets the WRITER, and the writer was never the problem: the
      // four inputs_* fields have ridden every row since #64 and NOTHING read them
      // (grep, 10 Aug: zero hits outside this file — brain itself only ever saw them
      // on runJob's return value, never back off the ledger). A writer-only net can
      // never catch that, so these three net the READER.
      // TIMEZONE-STABLE BY CONSTRUCTION (the CLOCK scar 30 lines up): the three
      // absent rows straddle a UTC midnight such that they bucket into exactly two of
      // HIS days whether the machine runs IST or UTC, and the newest day is asserted
      // by SHAPE, never by a literal that would be true only on his laptop.
      const fixLedger = [
        { ts: "2026-08-08T18:30:00.000Z", job: "teamtalk_am", inputs_declared: 4, inputs_present: 1, inputs_absent: 3, inputs_absent_names: ["season.json", "match_record.md", "tape_room.json"] },
        { ts: "2026-08-08T20:00:00.000Z", job: "teamtalk_am", inputs_declared: 4, inputs_present: 1, inputs_absent: 3, inputs_absent_names: ["season.json", "match_record.md", "tape_room.json"] },
        { ts: "2026-08-09T19:00:00.000Z", job: "teamtalk_am", inputs_declared: 4, inputs_present: 3, inputs_absent: 1, inputs_absent_names: ["season.json"] },
        { ts: "2026-08-09T19:05:00.000Z", job: "night_coach", inputs_declared: 2, inputs_present: 2, inputs_absent: 0, inputs_absent_names: null },
        { ts: "2026-08-09T19:10:00.000Z", job: "manager_m3", inputs_declared: null, inputs_present: null, inputs_absent: null, inputs_absent_names: null },
        { ts: "2026-07-01T19:10:00.000Z", job: "teamtalk_am", total_tokens: 900 },   // pre-#64 row: none of the four keys exist
      ];
      const ah64 = absentEvidenceHistory(fixLedger);
      const tta64 = ah64.jobs.find(j => j.job === "teamtalk_am");
      assert("#64 READ BACK — the ledger finally ANSWERS its own question: which job billed on absent evidence, how many runs, across how many of HIS days, and which input was missing most",
        ah64.jobs.length === 1 && tta64.runs === 3 && tta64.runs_absent === 3 && tta64.nights === 2
        && tta64.absent_names[0] === "season.json×3" && /^\d{4}-\d{2}-\d{2}$/.test(tta64.last_absent_day));
      assert("#64 READ BACK — both honesty lanes, so neither direction lies: a manager_m3-class row (DECLARES no inputs) is not a gap, and a pre-#64 row is UNCOUNTED, never a measured zero",
        ah64.accounted === 4 && ah64.no_inputs === 1 && ah64.unaccounted === 1);
      // the wire itself. If someone deletes the print, the aggregation above still
      // passes and the fields go dark again exactly as they did for eight days.
      // lastIndexOf, not indexOf: these two literals also appear in THIS assertion,
      // and the selftest sits ABOVE main() — an indexOf slice measured itself and went
      // red (seen live, 10 Aug). main() is the last thing in the file, so the last
      // occurrence is the real handler.
      const brainSrc = readFileSync(fileURLToPath(import.meta.url), "utf8");
      const stStart = brainSrc.lastIndexOf(`if (mode === "status")`);
      const statusBlock = brainSrc.slice(stStart, brainSrc.indexOf(`if (mode === "run")`, stStart));
      assert("#64 READ BACK — `brain status` OPENS the history (.1-roll-aware) and SAYS it: the consumer that makes the accounting more than a black box",
        statusBlock.length > 0 && /absentEvidenceHistory\(/.test(statusBlock)
        && /LEDGER \+ "\.1"/.test(statusBlock) && /brain: inputs history —/.test(statusBlock));

      // ---- THE CUT read back (11 Aug 2026) — the other half of the same question ----
      // Fixture shape mirrors the one above, and TIMEZONE-STABLE BY CONSTRUCTION for the
      // same reason (the CLOCK scar): the three cut rows straddle a UTC midnight such
      // that they bucket into exactly two of HIS days whether the machine runs IST or
      // UTC — a two-row fixture READ 2 NIGHTS UNDER NEITHER (caught live, 11 Aug, by
      // this assertion going red on its first run). night_coach is measured-and-whole,
      // the fourth teamtalk_am row is a clean run that must still count in the
      // denominator, and the pre-10-Aug row carries no key at all.
      const clipLedger = [
        { ts: "2026-08-08T18:30:00.000Z", job: "teamtalk_am", inputs_clipped: 1, inputs_rows_dropped: 183 },
        { ts: "2026-08-08T20:00:00.000Z", job: "teamtalk_am", inputs_clipped: 2, inputs_rows_dropped: 40 },
        { ts: "2026-08-09T19:00:00.000Z", job: "teamtalk_am", inputs_clipped: 1, inputs_rows_dropped: 7 },
        { ts: "2026-08-09T19:02:00.000Z", job: "teamtalk_am", inputs_clipped: null, inputs_rows_dropped: null },
        { ts: "2026-08-09T19:05:00.000Z", job: "night_coach", inputs_clipped: null, inputs_rows_dropped: null },
        { ts: "2026-07-01T19:10:00.000Z", job: "teamtalk_am", total_tokens: 900 },   // pre-elision row: no key
      ];
      const ch11 = clippedEvidenceHistory(clipLedger);
      const tta11 = ch11.jobs.find((j) => j.job === "teamtalk_am");
      assert("ELISION READ BACK — the ledger answers the OTHER half: which job billed on half-eaten inputs, how many rows never reached the model, worst single run, across how many of HIS days",
        ch11.jobs.length === 1 && tta11.runs_clipped === 3 && tta11.rows_dropped === 230
        && tta11.worst_run === 183 && tta11.nights === 2 && /^\d{4}-\d{2}-\d{2}$/.test(tta11.last_clipped_day));
      assert("ELISION READ BACK — the denominator counts the CLEAN runs too (1-in-50 must not read as 1-in-1), and both honesty lanes hold: measured-and-whole is a real zero, a pre-elision row is UNCOUNTED",
        tta11.runs === 4 && ch11.accounted === 5 && ch11.never_clipped === 2 && ch11.unaccounted === 1);
      assert("ELISION READ BACK — absence and elision stay SEPARATE lanes: a run cut to a stump with every file present is invisible to the absent-evidence read, which is why this sibling exists",
        absentEvidenceHistory(clipLedger).jobs.length === 0);
      // THE WIRE ITSELF. Without this, the aggregation above passes and the pair goes
      // dark again exactly as it did for a day — which is the whole defect class.
      assert("ELISION READ BACK — `brain status` OPENS it (.1-roll-aware) and SAYS it: the consumer that makes inputs_clipped / inputs_rows_dropped more than a black box",
        statusBlock.length > 0 && /clippedEvidenceHistory\(/.test(statusBlock)
        && /brain: inputs elision —/.test(statusBlock));
      // …and the PRODUCER on the manual path, which dropped both fields on the floor
      // until today: `brain run` is what he fires while debugging a stumped job.
      const runBlock = brainSrc.slice(brainSrc.lastIndexOf(`if (mode === "run")`), brainSrc.lastIndexOf(`if (mode === "pulse")`));
      assert("ELISION READ BACK — the MANUAL `brain run` row carries the pair too, so debugging a stumped job is not the one path that refuses to write down what it read",
        runBlock.length > 0 && /inputs_clipped: inputs_clipped \?\? null/.test(runBlock)
        && /inputs_rows_dropped: inputs_rows_dropped \?\? null/.test(runBlock));
    }

    // ---- THE DOUBLE CUT (10 Aug 2026) · a .md input is bounded ONCE, and both ends live
    // The regression this nets: a .md was cut at the READ door (last 20,000, silently)
    // and again at the PROMPT door (first 14,000, marked), so the model got the middle
    // of the day — no opening, no close — across nine enabled jobs, one of which
    // (dugout_digest) feeds day_cartridge, the Gaffer's own next-day instruction.
    // Hermetic by construction: the fixture is written to tmp and declared through a
    // `../` relative path, the shape brain_config already uses for ../club/wall_gemini.html.
    {
      const { mkdtempSync } = await import("node:fs");
      const osc = await import("node:os");
      const { relative, sep } = await import("node:path");
      const tdc = mkdtempSync(join(osc.tmpdir(), "brain-doublecut-"));
      // Bigger than BOTH old budgets — the only size that can expose a double cut. The
      // multiplier is derived from the clipper's own default (clip's n), never chosen.
      const OPEN = "CAPTAIN: Hello.", CLOSE = "GAFFER: Cheers, Captain.";
      const doc = `${OPEN}\n${"m".repeat(14000 * 3)}\n${CLOSE}\n`;
      writeFileSync(join(tdc, "2026-07-12.md"), doc);
      const decl = relative(STATE_DIR, join(tdc, "TODAY.md")).split(sep).join("/");
      const key = decl.replace(/TODAY/g, "2026-07-12");
      const giMd = gatherInputsAudited({ id: "doublecut", inputs: [decl], out: "dc" }, new Date(2026, 6, 12));
      assert("DOUBLE CUT — the READ door hands over the WHOLE .md; no second, unnamed budget upstream of clip()",
        typeof giMd.inputs[key] === "string" && giMd.inputs[key].length === doc.length);
      const promptMd = buildAnalysisPrompt({ id: "doublecut" }, giMd.inputs, "", []);
      assert("DOUBLE CUT — the transcript's OPENING reaches the model (the head the read-cut used to eat)",
        promptMd.includes(OPEN));
      assert("DOUBLE CUT — the transcript's CLOSE reaches the model (the tail clipLegacy used to eat)",
        promptMd.includes(CLOSE));
      assert("DOUBLE CUT — what IS dropped is named with a measured count, never silent",
        /\[\d+ chars elided from the MIDDLE/.test(promptMd));
      assert("DOUBLE CUT — the budget did not move: still one clip() window, not a bigger one",
        clip(doc).length - doc.length < 0 && clip(doc).replace(/\n…\[[^\]]*\]…\n/, "").length === 14000);
      // LAYERING witness: the frozen head-only engine still behaves exactly as it did,
      // and still fails the claim above — which is why it was replaced, not tuned.
      assert("DOUBLE CUT — clipLegacy is FROZEN verbatim and still drops the close (the regression witness)",
        clipLegacy(doc).startsWith(OPEN) && !clipLegacy(doc).includes(CLOSE) && clipLegacy(doc).endsWith("\n…[clipped]"));
      try { rmSync(tdc, { recursive: true, force: true }); } catch (e) { swallow("rmSync(tdc) already gone → ignored", e);}
    }

    // ---- #65 · the night shift's artifacts land where viz looks ----------
    {
      const nightRun = new Date(2026, 6, 13, 2, 50);      // the real 02:40–03:00 night shift
      const evenRun = new Date(2026, 6, 12, 23, 0);
      const serveJob = { window: "overnight", serve: "next_morning" };
      const plainJob = { window: "overnight" };
      assert("#65 — shiftDay STILL returns yesterday for an overnight job at 02:50 (ledger key unchanged)",
        shiftDay(serveJob, nightRun, cfg) === "2026-07-12");
      assert("#65 — but the ARTIFACT for a `serve` job is filed under the morning it is FOR",
        outDate(serveJob, nightRun, shiftDay(serveJob, nightRun, cfg)) === "2026-07-13");
      assert("#65 — an evening compile of the same job serves the NEXT morning",
        outDate(serveJob, evenRun, shiftDay(serveJob, evenRun, cfg)) === "2026-07-13");
      assert("#65 — a job WITHOUT `serve` is untouched: it still files under its shift (day_cartridge's chain holds)",
        outDate(plainJob, nightRun, shiftDay(plainJob, nightRun, cfg)) === "2026-07-12");
      assert("#65 — the three artifacts viz opens by calendar date now declare `serve`",
        ["maidan_poster", "gemini_render", "wall_insights"].every(id => (liveCfg.jobs.find(j => j.id === id) || {}).serve === "next_morning"));
      assert("#65 — wall_review deliberately does NOT (its consumer already loops i<=2 over recent dates)",
        (liveCfg.jobs.find(j => j.id === "wall_review") || {}).serve === undefined);
    }

    // ---- #3 · the pulse's concept tokens are no longer filler ------------
    {
      const vocab = new Set(["attention", "embeddings", "softmax"]);
      const oldWay = (t) => String(t).toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 3).slice(0, 4);
      assert("#3 (live evidence) — the OLD rule produced `pulse:isko` from his own Hinglish",
        oldWay("isko samajh nahi aaya attention wala")[0] === "isko");
      assert("#3 — stopwords are dropped and a REGISTERED CONCEPT leads, so the key is `pulse:attention`",
        pulseTokens("isko samajh nahi aaya attention wala", vocab)[0] === "attention");
      assert("#3 (live evidence) — the OLD rule produced ['what','left','that','part'] — pure filler",
        JSON.stringify(oldWay("what is left of that part")) === JSON.stringify(["what", "left", "that", "part"]));
      assert("#3 — every one of those four is now a stopword, so filler can never lead the key",
        ["what", "left", "that", "part"].every(w => PULSE_STOPWORDS.has(w))
        && pulseTokens("what is left of that part is the retrieval step", vocab)[0] === "retrieval"
        && !pulseTokens("what is left of that part is the retrieval step", vocab).some(w => ["what", "left", "that", "part"].includes(w)));
      assert("#3 — a concept beats a non-stopword noun for the habituation key",
        pulseTokens("the warehouse diagram for embeddings", vocab)[0] === "embeddings");
      assert("#3 — an ALL-stopword moment degrades honestly to the old behaviour instead of collapsing to one bucket",
        pulseTokens("isko wala kaise matlab", vocab).length > 0);
      assert("#3 — the vocabulary really is the organism's own concept registry", conceptVocabulary().size > 10 && conceptVocabulary().has("embeddings"));
      assert("#3 — the stopword list carries BOTH languages he actually types",
        PULSE_STOPWORDS.has("isko") && PULSE_STOPWORDS.has("matlab") && PULSE_STOPWORDS.has("what") && PULSE_STOPWORDS.has("part"));
    }

    // ---- #5 · lexicon_mine finally has a reader --------------------------
    {
      const td5 = mkd(join(os2.tmpdir(), "brain-mined-"));
      writeFileSync(join(td5, "2026-07-19.md"), 'anchors:\n- "one picture" (4× · context+emb)\n- "the whole machine is one long sentence" (2×)\n');
      writeFileSync(join(td5, "2026-08-01.md"), '- "warehouse wala naksha" — strongest\n- "short" ignored\n');
      const m = minedAnchors(td5);
      assert("#5 — the NEWEST mined file is read, and its quoted spans extracted by sequential pairing",
        m && m.date === "2026-08-01" && m.anchors.includes("warehouse wala naksha") && !m.anchors.includes("short"));
      const fpM = buildFingerprint({ mined: m });
      assert("#5 — mined anchors reach the fingerprint at the head of every analysis prompt, WITH their date",
        /MINED ANCHORS/.test(fpM) && fpM.includes("2026-08-01") && fpM.includes('"warehouse wala naksha"'));
      assert("#5 — no mined file ⇒ no line at all (an empty dir never fabricates an anchor)",
        minedAnchors(join(td5, "no-such-dir")) === null && !/MINED ANCHORS/.test(buildFingerprint({})));
    }

    // ---- #29 · last_closed is no longer computed for nobody --------------
    {
      const lastClosed = { concept: "hallucinations", ended_at: "2026-08-02T09:00:19.555Z", steps_ran: [0, 2, 3], steps_missed: [1, 4, 5], axes_done: ["a"], axes_deferred: [], axes_untouched: ["b", "c"] };
      const fpDead = buildFingerprint({ ls: { position: { session_open: false, concept: null, last_closed: lastClosed } } });
      assert("#29 — with NO open session (the case that dropped the whole block) the last lap still reaches the prompt",
        /LAST CLOSED SESSION: hallucinations/.test(fpDead) && /ended 2026-08-02/.test(fpDead) && /axes closed a, untouched bc/.test(fpDead));
      const fpStale = buildFingerprint({ ls: { position: { session_open: true, concept: "x", step: 3, stale: true, started_at: "2026-07-01T00:00:00Z", last_closed: lastClosed } } });
      assert("#29 — a STALE session is not announced as live, and last_closed speaks in its place",
        !/MID-CONCEPT RIGHT NOW/.test(fpStale) && /LAST CLOSED SESSION/.test(fpStale));
      assert("#29 — POSITION ONLY, never content: it reports axes and steps, never what was taught",
        /3\/6 steps ran/.test(fpDead) && !/taught|understood|explained/i.test(fpDead));
      assert("#29 — no last_closed ⇒ no line (never a fabricated 'last session')",
        !/LAST CLOSED SESSION/.test(buildFingerprint({ ls: { position: { session_open: false, last_closed: null } } })));

      // ---- WIRING AUDIT (10 Aug 2026) · the two clocks reach the prompt ----
      // elapsed_min / axis_marks_span_min / check_q_refused / core_missing were
      // written to every forge row and read by NOTHING. This is the consumer end
      // of that wire; if learning_state stops carrying them, or this stops
      // printing them, these fail.
      const fpPaced = buildFingerprint({ ls: { position: { session_open: false, last_closed:
        { ...lastClosed, elapsed_min: 5.2, axis_marks_span_min: 0, check_q_refused: 2, core_missing: ["d"] } } } });
      assert("WIRE — the two clocks, the refusal count and the CORE gap all reach the analysis prompt",
        /PACE \(reported, not a verdict\): 5\.2 min elapsed, axis marks spread over 0 min/.test(fpPaced)
        && /2 check-question\(s\) REFUSED/.test(fpPaced) && /CORE axis d was never closed/.test(fpPaced));
      assert("WIRE — REPORTED, NEVER JUDGED: no verdict word is invented around the clocks",
        !/theatre|forged|replayed|fake|cheat/i.test(fpPaced));
      assert("WIRE — a pre-field row (all four null/absent) prints the old line and fabricates no zero",
        /LAST CLOSED SESSION/.test(fpDead) && !/PACE \(/.test(fpDead)
        && !/REFUSED/.test(fpDead) && !/CORE axis/.test(fpDead));
      assert("WIRE — a genuinely clean lap says nothing about refusals or CORE (0 and [] are not noise)",
        !/REFUSED|CORE axis/.test(buildFingerprint({ ls: { position: { session_open: false, last_closed:
          { ...lastClosed, elapsed_min: 42, axis_marks_span_min: 31, check_q_refused: 0, core_missing: [] } } } })));
    }

    // ---- #51 · the unbounded presence log is read by the tail ------------
    {
      const td51 = mkd(join(os2.tmpdir(), "brain-tail-"));
      const live = join(td51, "presence_log.jsonl");
      writeFileSync(join(td51, "presence_log.2026-07.jsonl"), Array.from({ length: 500 }, (_, i) => JSON.stringify({ i, era: "archive" })).join("\n") + "\n");
      writeFileSync(live, Array.from({ length: 3000 }, (_, i) => JSON.stringify({ i, era: "live", pad: "x".repeat(120) })).join("\n") + "\n");
      const t6 = readLinesTail(live, 6);
      assert("#51 — a 3,000-row log yields exactly the 6 rows the caller wanted, newest last",
        t6.length === 6 && t6[5].i === 2999 && t6[0].i === 2994);
      assert("#51 — and the 200-row LLM-input slice is the same tail, not a whole-file parse",
        readLinesTail(live, 200).length === 200 && readLinesTail(live, 200)[199].i === 2999);
      // the roll: a fresh month leaves the live file nearly empty
      writeFileSync(live, JSON.stringify({ i: 0, era: "live-after-roll" }) + "\n");
      const rolled = readLinesTail(live, 6);
      assert("#51 — after a monthly ROLL the reader falls back to the archive instead of reporting an empty history",
        rolled.length === 6 && rolled[5].era === "live-after-roll" && rolled[0].era === "archive");
      assert("#51 — the archive glob finds the rolled sibling and nothing else",
        archiveSiblings(live).length === 1 && /presence_log\.2026-07\.jsonl$/.test(archiveSiblings(live)[0]));
      assert("#51 — a missing file is [] and never a crash (and never a measured zero downstream)",
        readLinesTail(join(td51, "no_such.jsonl"), 6).length === 0);
      assert("#51 — brain's own readers ask for a TAIL now (liveSignal never crashes on a rolled log)",
        typeof liveSignal(now(14, 0), td51) === "object");
    }

    // ---- TRUNCATED_AT_DOOR · the tail survives the clipper, ROW-ALIGNED --
    // (10 Aug 2026 wiring audit.) The regression these guard is exact: readLinesTail
    // hands the prompt builder 200 rows oldest→newest, and the clipper decides which of
    // them the model is allowed to see. Cut by characters and the newest row arrives
    // headless; cut from the head alone and the newest three days vanish entirely
    // (MEASURED before the fix: night_coach's teaching_audit tail spanned 06 Aug →
    // 10 Aug and the newest row that reached the model was stamped 07 Aug 06:12).
    {
      // 300 rows, each far larger than 1/200th of the budget, so the clip is forced.
      const rowsT = Array.from({ length: 300 }, (_, i) => ({ i, ts: `2026-08-${String((i % 28) + 1).padStart(2, "0")}T00:00:00Z`, pad: "y".repeat(300) }));
      const outT = clip(rowsT);
      assert("DOOR — the clipper does not silently drop the NEWEST rows: the last row on the bus reaches the model",
        outT.includes('"i": 299'));
      assert("DOOR — and it is the WHOLE row, never sheared mid-object (the newest block parses as JSON on its own)",
        (() => { const blk = outT.split("]…\n")[1]; try { const a = JSON.parse(blk); return Array.isArray(a) && a[a.length - 1].i === 299 && typeof a[a.length - 1].ts === "string"; } catch { return false; } })());
      assert("DOOR — the marker NAMES the cut in ROWS (chars cannot tell him he lost 192 of 200) and stamps the machine tag",
        /\d+ of 300 rows elided/.test(outT) && /rows_dropped=\d+/.test(outT));
      assert("DOOR — the oldest end is kept too, and it is whole (the log's time-span survives)",
        outT.includes('"i": 0') && JSON.parse(outT.split("\n…[")[0])[0].i === 0);
      assert("DOOR — the budget did not move: the clip still fits the n it was always given",
        outT.length < 14000 + 400 && clip(rowsT, 14000).length === outT.length);
      assert("DOOR — an array that FITS is passed through untouched, with no marker invented",
        clip(rowsT.slice(0, 3)) === JSON.stringify(rowsT.slice(0, 3), null, 1) && !/elided/.test(clip(rowsT.slice(0, 3))));
      // a single row wider than the whole budget: deliver the newest, say so, never nothing.
      const fat = [{ i: 0, pad: "z".repeat(40000) }, { i: 1, pad: "q".repeat(40000) }];
      assert("DOOR — one over-wide row still yields the NEWEST one and names the drop, never silence",
        /rows_dropped=1/.test(clip(fat)) && clip(fat).includes('"i": 1'));
      // PROSE IS NOT A LOG — the .md middle-elide engine must be untouched by all this.
      const prose = "OPEN" + "m".repeat(30000) + "CLOSE";
      assert("DOOR — a STRING input still rides clipMiddle: both ends of a transcript intact, chars named",
        clip(prose).startsWith("OPEN") && clip(prose).endsWith("CLOSE") && /chars elided from the MIDDLE/.test(clip(prose)));
      assert("DOOR — clipLegacy stays frozen verbatim as the witness (head-only, one bare marker)",
        clipLegacy(prose).startsWith("OPEN") && !clipLegacy(prose).endsWith("CLOSE") && clipLegacy(prose).endsWith("…[clipped]"));
      // the LEDGER seam: the drop is countable off the built prompt, which is how
      // runJob's acct sees it without threading a counter through six builders.
      const promptT = buildAnalysisPrompt({ id: "x" }, { "a_log.jsonl": rowsT }, "", []);
      const tags = promptT.match(/rows_dropped=(\d+)/g) || [];
      assert("DOOR — the drop is visible to the LEDGER: the built prompt carries a countable rows_dropped tag",
        tags.length === 1 && Number(tags[0].split("=")[1]) > 0);
    }

    // ---- TRUNCATED_AT_DOOR, pass 3 · the DOOR'S OWN cut is counted -------
    // (11 Aug 2026.) Passes 1–2 above guard the CLIPPER. This guards the cut that
    // happens before the clipper can see anything: readLinesTail(p, DOOR_TAIL_ROWS).
    // The regression, MEASURED on live state: teaching_audit.jsonl held 225 rows,
    // night_coach declares it REQUIRED, and `brain run night_coach --dry` printed
    // "184 log rows never reached the model" — 25 rows short, because the 25 the door
    // ate never entered any counter. Every one of these fails against that code.
    {
      const td3 = mkd(join(os2.tmpdir(), "brain-door3-"));
      const { relative: rel3, sep: sep3 } = await import("node:path");
      // rows wide enough to force the clipper too, so BOTH cuts are live at once —
      // the only shape that can prove the two lanes are counted separately.
      const row3 = (i) => JSON.stringify({ i, ts: `2026-08-11T00:00:${String(i % 60).padStart(2, "0")}Z`, pad: "d".repeat(300) });
      const big3 = join(td3, "door_log.jsonl"), small3 = join(td3, "short_log.jsonl");
      writeFileSync(big3, Array.from({ length: DOOR_TAIL_ROWS + 50 }, (_, i) => row3(i)).join("\n") + "\n");
      writeFileSync(small3, Array.from({ length: 7 }, (_, i) => row3(i)).join("\n") + "\n");
      writeFileSync(join(td3, "ragged.jsonl"), `${row3(0)}\n\n   \n${row3(1)}`);   // blank rows + no trailing newline
      assert("DOOR3 — liveRowCount counts the file's real rows (blank lines skipped like parseLines, last row without a newline still counted)",
        liveRowCount(big3) === DOOR_TAIL_ROWS + 50 && liveRowCount(small3) === 7
        && liveRowCount(join(td3, "ragged.jsonl")) === 2 && liveRowCount(join(td3, "no_such.jsonl")) === null);
      const declBig = rel3(STATE_DIR, big3).split(sep3).join("/");
      const declSmall = rel3(STATE_DIR, small3).split(sep3).join("/");
      const gi3 = gatherInputsAudited({ id: "door3", inputs: [declBig, declSmall], out: "door3" }, new Date(2026, 7, 11));
      assert("DOOR3 — the tail cut is MEASURED against the live file, not assumed: 50 of 250 rows never left disk",
        gi3.door_dropped === 50 && gi3.door.length === 1
        && gi3.door[0].read === DOOR_TAIL_ROWS && gi3.door[0].on_disk === DOOR_TAIL_ROWS + 50 && gi3.door[0].dropped === 50);
      assert("DOOR3 — a log SHORTER than the tail is not decorated and drops nothing (a measured zero, never a phantom cut)",
        gi3.inputs[declSmall].length === 7 && !gi3.door.some(d => d.name === declSmall));
      const key3 = Object.keys(gi3.inputs).find(k => k.startsWith(declBig));
      assert("DOOR3 — the MODEL is told: the heading names newest/total and the older rows, so the clip marker's 'of 200' can no longer read as the whole log",
        key3 !== declBig && /newest 200 of 250 rows/.test(key3) && /50 OLDER row\(s\) never left disk/.test(key3)
        && gi3.inputs[key3].length === DOOR_TAIL_ROWS);
      const prompt3 = buildAnalysisPrompt({ id: "door3" }, gi3.inputs, "", []);
      assert("DOOR3 — and it survives into the built prompt, through the same six-builder seam the clipper's tag uses",
        prompt3.includes(key3) && /door_rows_unread=50/.test(prompt3));
      // THE COLLISION GUARD: runJob counts the clipper with /rows_dropped=(\d+)/ over the
      // whole prompt. Name the door tag `door_rows_dropped` and this regex swallows it,
      // double-counting the door as a clip — the exact under/over-count this pass exists
      // to end, inverted. Exactly ONE clipper tag must be visible in a prompt that also
      // carries a door tag.
      const clipTags3 = String(prompt3).match(/rows_dropped=(\d+)/g) || [];
      assert("DOOR3 — the door tag CANNOT be mistaken for a clipper tag: one prompt, both cuts, still exactly one rows_dropped",
        clipTags3.length === 1 && Number(clipTags3[0].split("=")[1]) !== 50);
      // END TO END — the note is the string the ledger row carries and `brain status`
      // echoes. Before today it named one cut and called it the total.
      const r3 = await runJob({ id: "door3", out: "door3", inputs: [declBig, declSmall] }, cfg,
        { exec: () => ({ ok: true, text: "thin data, saying less", total_tokens: 9, duration_ms: 1, limit_hit: false, error: null }),
          gexec: () => ({ ok: false }), now: now(23, 30), dry: true });
      assert("DOOR3 — runJob returns the door lane as its OWN field, never folded into the clipper's (old rows stay comparable)",
        r3.inputs_rows_door_dropped === 50 && r3.inputs_rows_dropped > 0
        && r3.inputs_rows_dropped !== 50 && Array.isArray(r3.inputs_door_names));
      assert("DOOR3 — the NOTE names both cuts and states the TOTAL, which is the number that was wrong",
        /TAIL-CUT AT THE DOOR — 50 older row\(s\) never left disk/.test(r3.note)
        && /elided at the clipper/.test(r3.note)
        && r3.note.includes(`${r3.inputs_rows_dropped + 50} log row(s) never reached the model in total`));
      // THE READ BACK — a run cut ONLY at the door must not report as whole.
      const ch3 = clippedEvidenceHistory([
        { ts: "2026-08-11T19:00:00.000Z", job: "night_coach", inputs_clipped: null, inputs_rows_dropped: null, inputs_rows_door_dropped: 25 },
        { ts: "2026-08-11T19:05:00.000Z", job: "night_coach", inputs_clipped: 1, inputs_rows_dropped: 184, inputs_rows_door_dropped: 25 },
        { ts: "2026-08-10T19:00:00.000Z", job: "night_coach", inputs_clipped: 1, inputs_rows_dropped: 183 },   // clipper measured, door not
        { ts: "2026-08-11T19:10:00.000Z", job: "night_coach", inputs_clipped: null, inputs_rows_dropped: null, inputs_rows_door_dropped: null },
      ]);
      const nc3 = ch3.jobs.find(j => j.job === "night_coach");
      assert("DOOR3 — clippedEvidenceHistory counts the door lane: a door-only cut is a cut, and only a BOTH-lanes-zero run reads as whole",
        nc3 && nc3.rows_unseen === 417 && nc3.door_dropped === 50 && nc3.rows_dropped === 367
        && nc3.runs_clipped === 3 && ch3.never_clipped === 1);
      assert("DOOR3 — a row written before the door was counted is UNMEASURED on that lane, never a measured zero",
        ch3.door_unmeasured === 1);
      // …and both ledger writers actually carry the field, the failure mode that kept
      // inputs_clipped a black box for a day on the manual path.
      const src3 = readFileSync(fileURLToPath(import.meta.url), "utf8");
      assert("DOOR3 — BOTH ledger row literals (tick + manual `brain run`) write the door lane, so neither path is the one that forgets",
        (src3.match(/inputs_rows_door_dropped: inputs_rows_door_dropped \?\? null/g) || []).length === 2);
      try { rmSync(td3, { recursive: true, force: true }); } catch (e) { swallow("rmSync(td3) already gone → ignored", e);}
    }

    // ---- #106 · status lines are have/need counters ----------------------
    {
      const sa = surfaceAudit({ jobs: [{ id: "a", surface: { kind: "code", where: "x" } }, { id: "b" }, { id: "c", enabled: false }] });
      assert("#106 — the surface report is a have/need pair and NAMES the gap, never the bare word 'ok'",
        sa.have === 1 && sa.need === 2 && sa.orphans.length === 1 && sa.orphans[0] === "b");
    }

    // ---- OVERHAUL Block 5.1 · PREPARE TOMORROW (18 Aug 2026) — the one dark-lane job ----
    // Hermetic: fixture food, fixture reply, the REAL sitting validator (pure). The live
    // proof (a real opus run → brain_out/prepare/<day>.json → `sitting.mjs open` prefers
    // it) is recorded in the plan file's BUILD LOG, never faked here.
    {
      const pj = cfg.jobs.find(j => j.id === "prepare_tomorrow");
      assert("PREPARE TOMORROW — committed job: opus · overnight · at 03:20 · serve next_morning · kind prepare_tomorrow · out prepare · max 1/day · sprint.json REQUIRED · surface names sitting.mjs open",
        !!pj && pj.model === "opus" && pj.window === "overnight" && pj.at === "03:20" && pj.serve === "next_morning" && pj.kind === "prepare_tomorrow" && pj.out === "prepare"
        && pj.max_per_day === 1 && pj.enabled === true && (pj.inputs || []).some(i => i && i.path === "sprint.json" && i.required) && /sitting\.mjs open/.test(pj.surface.where) && pj.gate && pj.gate.window_days === 14);
      const S = await import("./sitting.mjs");
      const food = { for_day: "2026-08-19", route: "REJIRAH", route_why: "proof purana", concept: "tokenization", task_title: "Tokenization", task_id: "1-04", track: "concept", plan_max_units: 16, unit_max_words: 110,
        forge: null, kickoff_line: "1-04 Hallucinations (concept)", nextup: { name: "rejirah-due", line: "Re-Jirah R2 'tokenization'", why: "ripe" },
        capsule: { id: "tokenization", title: "Tokenization", axes: [{ axis: "a", title: "Kya hai", strike: "token kya hai?" }], mechanism_head: "(withheld — cold round)", traps: "(withheld — cold round)" },
        reviews: [{ sitting_id: "s1", what_changes_next: ["open every new label first"], register_line: `interviewer yeh shabd sunna chahega: "vocabulary"` }], calibration: { gap: 0.09 }, weaknesses: { register: { line: "register: 1 rep(s) read" } } };
      const pp = buildPrepareTomorrowPrompt(pj, { "tomorrow's sitting": { route: food.route, concept: food.concept } }, ["10x"], food);
      assert("PREPARE TOMORROW — the prompt is the SITTING BRAIN's night half: route + concept named, the PLAN FILE CONTRACT's json shape, cold-round law (never the weld on REJIRAH), the register line planted as ONE unit, and it ends with the fenced-json order",
        /Route REJIRAH · concept 'tokenization'/.test(pp) && /"map":"<≤60 words/.test(pp) && /NEVER the weld or the answer/.test(pp) && /register line says the room wanted a word, plant ONE unit/.test(pp) && /EXACTLY ONE fenced/.test(pp) && /NEVER these phrases: 10x/.test(pp));
      const good = "thinking…\n```json\n" + JSON.stringify({ map: "Aaj Re-Jirah, tokenization — 9 axis, gut-word pehle. Shuru karein?", units: [
        { step: null, axis: null, kind: "unit", text: "Aaj Re-Jirah, tokenization — 9 axis, gut-word pehle. Shuru karein?", question: true, est_seconds: 15, src: ["prepare"] },
        { step: null, axis: "a", kind: "question", text: "Axis a — pehle gut-word bolo, phir: token kya hai?", question: true, est_seconds: 12 },
        { step: null, axis: null, kind: "unit", text: "Round poora — 'full time' bolo.", question: false, est_seconds: 6 }] }) + "\n```";
      const sib = parsePrepareTomorrowJson(good, cfg, food, S);
      assert("PREPARE TOMORROW — a valid reply becomes the sibling in EXACTLY sitting.mjs's PLAN FILE CONTRACT ({task:{id,title}, route, map, units[{step,axis,kind,text,question,est_seconds,src}]}), validated by sitting's OWN validatePlan, every unit's src = the job id (so a spoken unit stamps `sat` on prepare_tomorrow)",
        !!sib && sib.route === "REJIRAH" && sib.task.title === "Tokenization" && sib.task.id === "tokenization" && sib.units.length === 3 && sib.units[0].kind === "map" && sib.units[1].kind === "question" && sib.units[1].axis === "a"
        && sib.units.every(u => u.src.length && u.src.every(s => s === "prepare_tomorrow")) && sib.source === "prepare_tomorrow" && sib.for_day === "2026-08-19"
        && S.validatePlan({ map: sib.map, units: sib.units }, { route: "REJIRAH" }).ok);
      assert("PREPARE TOMORROW — a plan the sitting would refuse (map without the start-ask · one unit) is NOT written: null, and the refusal is NAMED",
        parsePrepareTomorrowJson("```json\n{\"map\":\"no ask here\",\"units\":[{\"text\":\"x\"}]}\n```", cfg, food, S) === null && /fewer than 2 units/.test(prepareLastRefusal || "")
        && parsePrepareTomorrowJson("no json at all", cfg, food, S) === null && /no fenced json/.test(prepareLastRefusal || ""));
      // refuse BEFORE the spend on a route no voice plan serves — driven through runJob with a fixture food and an exec that must not be called
      const noSpend = await runJob(pj, cfg, { exec: () => { throw new Error("must not be called"); }, gexec: () => { throw new Error("no"); }, now: new Date("2026-08-18T03:20:00+05:30"), dry: true, prepareFood: { route: "PYTHON", route_why: "sprint ki current task Python track pe hai" } });
      assert("PREPARE TOMORROW — a PYTHON (or SCRIMMAGE) tomorrow is a refusal BEFORE the spend, named — no opus call for a plan no voice sitting will read",
        noSpend && noSpend.usage && noSpend.usage.ok === false && /needs no composed plan/.test(noSpend.usage.error) && /PYTHON/.test(noSpend.note));
    }

    // ---- P2 · THE NIGHT COACH (9 Aug 2026, his unleash word) --------------
    {
      const nj = cfg.jobs.find(j => j.id === "night_coach");
      assert("NIGHT COACH — committed job: opus · overnight · serve next_morning · kind night_coach · enabled",
        !!nj && nj.model === "opus" && nj.window === "overnight" && nj.serve === "next_morning"
        && nj.kind === "night_coach" && nj.enabled === true && (nj.engine || "claude") === "claude");
      assert("NIGHT COACH — reps + teaching audit REQUIRED, surface names all four consumers",
        !!nj && nj.inputs.filter(i => i && i.required).length === 2
        && /setpiece/.test(nj.surface.where) && /examiner/.test(nj.surface.where)
        && /learnstate/.test(nj.surface.where) && /dugout/.test(nj.surface.where));
      // THE LANE, asserted at BOTH ENDS (10 Aug 2026 tracing pass). The .json
      // sibling sat unwritten for weeks — the 9-Aug run predated P2's emitter,
      // so five machine readers watched an empty lane and nothing said so. The
      // wire closed itself on the 10-Aug 22:06 run (ledger: "+ 2026-08-11.json
      // (machine sibling: 4 misconception(s))"), but NOTHING here tied the two
      // ends together: the fixture below runs on out:"nc_fixture", so the real
      // `out` was never read by any check, and a rename would have the producer
      // writing to a lane no consumer opens while every assertion still passed.
      // That is #63's sin one level down — the surface PROSE names the readers,
      // it never proves they read THIS lane. So: derive the lane exactly as the
      // emitter does (job.out || job.id, line ~2004) and demand it appear as a
      // literal in every sibling reader, in one of the two join() spellings the
      // tree actually uses. The closing quote is load-bearing — it excludes the
      // prose mentions in each file's header comment.
      // WHAT THIS PROVES: both ends name the same lane, and each consumer reads
      // the .json sibling (not just the human .md — dugout is absent from this
      // list for exactly that reason). WHAT IT CANNOT PROVE: that the reader
      // ever executes. The runtime detector for a silent producer already
      // exists — watchman's "md present, json absent" check.
      {
        const ncLane = nj && (nj.out || nj.id);
        const spellings = [`"brain_out/${ncLane}"`, `"brain_out", "${ncLane}"`];
        const SIBLING_READERS = ["setpiece.mjs", "examiner.mjs", "learnstate.mjs", "scoreboard.mjs", "watchman.mjs"];
        const orphaned = SIBLING_READERS.filter((f) => {
          const src = readFileSync(join(__dirname, f), "utf8");
          return !(spellings.some((q) => src.includes(q)) && src.includes('".json"'));
        });
        assert(`NIGHT COACH — the machine sibling's lane is the SAME string at both ends: producer "${ncLane}" reaches all ${SIBLING_READERS.length} .json readers${orphaned.length ? ` (ORPHANED: ${orphaned.join(", ")})` : ""}`,
          !!ncLane && orphaned.length === 0);
      }
      const good = "misconception map yahan hai\n```json\n{\"date\":\"2026-08-10\",\"study_day\":\"2026-08-09\",\"misconceptions\":[{\"concept\":\"hallucinations\",\"evidence\":\"x\"}],\"lesson\":{\"concept\":\"hallucinations\",\"samjhao_passes\":[\"a\"],\"widget_gates\":[],\"check_question\":\"?\"}}\n```";
      assert("NIGHT COACH — the machine sibling parses out of the LAST fenced json block",
        parseNightCoachJson("```json\n{\"misconceptions\":[]}\n```\nbeech ka text\n" + good).misconceptions.length === 1);
      assert("NIGHT COACH — no block / broken json / shapeless json → null, never a throw",
        parseNightCoachJson("koi block nahi") === null && parseNightCoachJson("```json\n{broken\n```") === null
        && parseNightCoachJson("```json\n{\"no_misconceptions_key\":1}\n```") === null);
      assert("NIGHT COACH — the day filter reports counts beside the sample (a trimmed day never reads complete)",
        (() => { const a = nightCoachAfferents("1999-01-01"); return a.study_day === "1999-01-01" && a.turns_total === 0 && Array.isArray(a.turns); })());
      // ---- THE UNNAMED TURN CUT (11 Aug 2026) · a turn is bounded ONCE, and both ends live
      // The regression this nets: every turn was cut at 600 chars with nothing naming it,
      // while the same object honestly reported its ROW trim. MEASURED on the live bus that
      // day — 6 of 14 lane rows over 600, 9,848 chars gone unmarked, longest turn 3,904 →
      // 600. The coach is ordered to quote him VERBATIM; it was quoting from openings only.
      // Hermetic: the fixture is its own tmp dir, passed through the gatherer's `dir` seam.
      {
        const { mkdtempSync } = await import("node:fs");
        const osn = await import("node:os");
        const tdn = mkdtempSync(join(osn.tmpdir(), "brain-turncut-"));
        // sized off the LIVE measurement above (3,904 ch), not a chosen number: one turn
        // far past the 600 budget, one comfortably under, so both branches are exercised.
        const OPEN = "CAPTAIN: mujhe yeh samajh nahi aaya", CLOSE = "toh phir softmax kyun lagta hai?";
        const longTurn = `${OPEN} ${"x".repeat(3904 - OPEN.length - CLOSE.length - 2)} ${CLOSE}`;
        const short = "haan samajh gaya";
        writeFileSync(join(tdn, "afferent.jsonl"),
          JSON.stringify({ ts: "2026-08-11T14:00:00.000Z", source: "claude-code", text: longTurn }) + "\n" +
          JSON.stringify({ ts: "2026-08-11T14:05:00.000Z", modality: "voice", text: short }) + "\n");
        const day = localDate(new Date("2026-08-11T14:00:00.000Z"));
        const a = nightCoachAfferents(day, tdn);
        const longRow = a.turns.find(r => r.who === "claude-code") || {};
        assert("TURN CUT — the END of his long turn reaches the night coach (the tail the 600-slice ate)",
          typeof longRow.text === "string" && longRow.text.includes(CLOSE) && longRow.text.includes(OPEN));
        assert("TURN CUT — what IS dropped is named with a measured count inside the turn, never silent",
          /\[\d+ chars elided from the MIDDLE/.test(longRow.text || ""));
        assert("TURN CUT — the row itself declares partial + its real length, and the day counts what it cut",
          longRow.partial === true && longRow.chars === longTurn.length
          && a.turns_cut === 1 && a.chars_elided === longTurn.length - 600 && /PARTIAL/.test(a.note));
        assert("TURN CUT — a turn inside the budget is shipped WHOLE and never marked partial",
          (a.turns.find(r => r.who === "voice(him)") || {}).text === short
          && (a.turns.find(r => r.who === "voice(him)") || {}).partial === undefined);
        assert("TURN CUT — the budget did not move: still one 600-char window per turn, not a bigger one",
          (longRow.text || "").replace(/\n…\[[^\]]*\]…\n/, "").length === 600);
        assert("TURN CUT — the PROMPT names what a marked turn means, so a quote is never stitched across it",
          /PARTIAL TURNS/.test(buildNightCoachPrompt({ id: "nc" }, { x: a }, "", [])));
        // LAYERING witness: the frozen gatherer still behaves exactly as it did, and still
        // fails the claim above — which is why it was replaced, not tuned.
        const aL = nightCoachAfferentsLegacy(day, tdn);
        assert("TURN CUT — nightCoachAfferentsLegacy is FROZEN verbatim and still eats the close, unmarked (the witness)",
          (aL.turns[0] || {}).text.length === 600 && !aL.turns[0].text.includes(CLOSE)
          && aL.turns_cut === undefined && !/PARTIAL|elided/.test(aL.note));
        try { rmSync(tdn, { recursive: true, force: true }); } catch (e) { swallow("rmSync(tdn) already gone → ignored", e); }
      }
      const ncFix = { id: "nc_fixture", kind: "night_coach", inputs: [], out: "nc_fixture", serve: "next_morning", surface: { kind: "code", where: "x" } };
      const rNC = await runJob(ncFix, cfg, { exec: () => ({ ok: true, text: good, total_tokens: 9, duration_ms: 1, limit_hit: false, error: null }), gexec: () => ({ ok: false }), now: now(23, 30), dry: true });
      assert("NIGHT COACH — rides the SHARED path: ok run, sibling named in the note, acct present",
        rNC.usage.ok === true && /machine sibling: 1 misconception/.test(rNC.note) && typeof rNC.inputs_declared === "number");
      const rNC2 = await runJob(ncFix, cfg, { exec: () => ({ ok: true, text: "sirf prose, koi json block nahi", total_tokens: 9, duration_ms: 1, limit_hit: false, error: null }), gexec: () => ({ ok: false }), now: now(23, 30), dry: true });
      assert("NIGHT COACH — a reply without the json block DEGRADES out loud, never fails the run",
        rNC2.usage.ok === true && /json sibling ABSENT/.test(rNC2.note));

      // ---- H4 REHEARSAL (10 Aug 2026): draft → simulated-Nikhil → final ----
      const draft = "draft lesson\n```json\n{\"date\":\"2026-08-10\",\"misconceptions\":[{\"concept\":\"a\"}],\"lesson\":{}}\n```";
      const final_ = "revised lesson\n```json\n{\"date\":\"2026-08-10\",\"misconceptions\":[{\"concept\":\"a\"},{\"concept\":\"b\"}],\"lesson\":{}}\n```";
      const rhFix = { ...ncFix, rehearse: true };
      const seq = (replies) => { let i = 0; return () => ({ ok: true, text: replies[Math.min(i++, replies.length - 1)], total_tokens: 10, duration_ms: 1, limit_hit: false, error: null }); };
      const HR = { phase: "overnight", allowed: 1000000 };
      const rRH = await runJob(rhFix, cfg, { exec: seq([draft, "1. \"draft lesson\" — do ideas ek saath", final_]), gexec: () => ({ ok: false }), now: now(23, 30), dry: true, hr: HR });
      assert("H4 — a cracking draft is REVISED once, the sibling parses from the FINAL, and all 3 execs' usage is SUMMED",
        /rehearsed: 1 crack\(s\), REVISED/.test(rRH.note) && /machine sibling: 2 misconception/.test(rRH.note)
        && rRH.usage.total_tokens === 30);
      const rST = await runJob(rhFix, cfg, { exec: seq([draft, "STANDS"]), gexec: () => ({ ok: false }), now: now(23, 30), dry: true, hr: HR });
      assert("H4 — STANDS keeps the draft (2 execs only) and says so",
        /rehearsed: STANDS/.test(rST.note) && rST.usage.total_tokens === 20 && /machine sibling: 1 misconception/.test(rST.note));
      const rBAD = await runJob(rhFix, cfg, { exec: seq([draft, "1. crack", "broken revision — a god-tier lesson, no json block"]), gexec: () => ({ ok: false }), now: now(23, 30), dry: true, hr: HR });
      assert("H4 — a failing revision KEEPS THE DRAFT (a passing draft is never lost to a bad rewrite)",
        /DRAFT KEPT/.test(rBAD.note) && /machine sibling: 1 misconception/.test(rBAD.note));
      const rSTUDY = await runJob(rhFix, cfg, { exec: seq([draft, "1. crack", final_]), gexec: () => ({ ok: false }), now: now(23, 30), dry: true, hr: { phase: "study", allowed: 1000000 } });
      assert("H4 — his live study hours are protected: no rehearsal in the study phase (draft ships, 1 exec)",
        !/rehearsed/.test(rSTUDY.note) && rSTUDY.usage.total_tokens === 10);
      const rPOOR = await runJob(rhFix, cfg, { exec: seq([draft, "1. crack", final_]), gexec: () => ({ ok: false }), now: now(23, 30), dry: true, hr: { phase: "overnight", allowed: 15 } });
      assert("H4 — the measured gate: headroom under 2× the draft's own cost skips the adversary",
        !/rehearsed/.test(rPOOR.note) && rPOOR.usage.total_tokens === 10);
      assert("H4 — canon: night_coach carries rehearse:true, formation_read does NOT (the capstone needs his word)",
        (() => { const nj2 = cfg.jobs.find(j => j.id === "night_coach"), fr = cfg.jobs.find(j => j.id === "formation_read");
          return nj2 && nj2.rehearse === true && fr && !fr.rehearse; })());

      // ---- H5 DREAMS (10 Aug 2026): sanitizer + refuse-before-spend --------
      const aMap = new Map([["hallucinations", "hallucinations"], ["context window", "context"], ["embeddings", "embeddings"]]);
      const dTxt = "soch\n```json\n" + JSON.stringify({ date: "2026-08-10", bridges: [
        { from_concept: "Hallucinations", to_concept: "context window", axis: "d", hypothesis: "dono mein bhoolna scale ka sawaal hai" },
        { from_concept: "hallucinations", to_concept: "hallucinations", axis: "a", hypothesis: "self" },
        { from_concept: "quantum flux", to_concept: "embeddings", axis: "b", hypothesis: "unknown from" },
        { from_concept: "embeddings", to_concept: "context", axis: "z", hypothesis: "bad axis" },
        { from_concept: "embeddings", to_concept: "context", axis: "c", hypothesis: "ok", confidence: "HIGH" },
      ] }) + "\n```";
      const dp = parseDreamsJson(dTxt, cfg, aMap);
      assert("H5 SANITIZER — aliases resolve, self-bridges/unknowns/bad-axes drop with reasons, confidence is ALWAYS stamped low",
        dp.bridges.length === 2 && dp.dropped.length === 3
        && dp.bridges[0].from_concept === "hallucinations" && dp.bridges[0].to_concept === "context"
        && dp.bridges.every((b) => b.confidence === "low"));
      assert("H5 SANITIZER — no bridges array / broken json → null, never a throw",
        parseDreamsJson("prose", cfg, aMap) === null && parseDreamsJson("```json\n{\"x\":1}\n```", cfg, aMap) === null);
      const dreamsFix = { id: "dreams_fx", kind: "dreams", inputs: [], out: "dreams_fx", surface: { kind: "code", where: "x" } };
      const rDR = await runJob(dreamsFix, cfg, { exec: () => { throw new Error("exec must not be called on an empty inventory"); }, gexec: () => ({ ok: false }), now: now(23, 30), dry: true, crackedInv: [] });
      assert("H5 — an EMPTY cracked-axes inventory refuses BEFORE the spend (no exec, food named)",
        rDR.usage.ok === false && /inventory is EMPTY/.test(rDR.note) && rDR.inputs_absent_names[0] === "cracked-axes inventory");
      const rDR2 = await runJob(dreamsFix, cfg, { exec: () => ({ ok: true, text: dTxt, total_tokens: 8, duration_ms: 1, limit_hit: false, error: null }), gexec: () => ({ ok: false }), now: now(23, 30), dry: true, crackedInv: [{ concept: "hallucinations", axis: "d", n: 2, src: "rejirah" }] });
      assert("H5 — a real inventory dreams: the run ships and the sanitized sibling is named in the note",
        rDR2.usage.ok === true && /machine sibling/.test(rDR2.note));
      assert("H5 — agenda dream_pick sanitizes strings-only (bridge-reality is the consumer's check)",
        (() => { const ag = parseAgendaJson("x\n```json\n" + JSON.stringify({ allocations: {}, dream_pick: { from_concept: "a", to_concept: "b", axis: "c", hypothesis: "h" } }) + "\n```", { jobs: [] });
          return ag && ag.dream_pick && ag.dream_pick.axis === "c"
            && parseAgendaJson("x\n```json\n" + JSON.stringify({ allocations: {}, dream_pick: { from_concept: "a", to_concept: "b", axis: "zz" } }) + "\n```", { jobs: [] }).dream_pick === undefined; })());

      // ---- THE DREAM LANE'S DATE KEY (11 Aug 2026 wiring audit) -------------
      // The producer keys by shiftDay; both readers keyed by CALENDAR yesterday.
      // Those two spellings agree only while the whole shift finishes before
      // midnight — and on this laptop it routinely does not (the only dreams run
      // that ever happened was at 01:23 IST). H5's own surface note promises the
      // night coach verifies the pick "against the same file" the agenda picked
      // from; measured on that night the agenda asked for 2026-08-09 and the
      // coach for 2026-08-08, so the promise was false and a legitimate pick
      // would have been dropped in silence. These two checks are the wire:
      // agree-across-midnight, and never again by calendar arithmetic.
      {
        const dj2 = cfg.jobs.find((j) => j.id === "dreams");
        const ag2 = cfg.jobs.find((j) => j.id === "agenda");
        const nc3 = cfg.jobs.find((j) => j.id === "night_coach");
        // writer: dreams runs 23:30 on 12 Jul → shift 2026-07-12 → dreams/2026-07-12.json
        const wrote = outDate(dj2, new Date(2026, 6, 12, 23, 30), shiftDay(dj2, new Date(2026, 6, 12, 23, 30), cfg));
        // readers, NEXT shift, straddling midnight: agenda 22:45 on the 13th and
        // night_coach 02:10 on the 14th are the SAME shift (2026-07-13).
        const tAg = shiftDay(ag2, new Date(2026, 6, 13, 22, 45), cfg);
        const tNc = shiftDay(nc3, new Date(2026, 6, 14, 2, 10), cfg);
        assert("H5 WIRE — the dreams key AGREES across midnight: last shift's file is one filename, whether the reader wakes at 22:45 or 02:10, and it is the one the writer wrote",
          wrote === "2026-07-12" && tAg === tNc && prevShiftDate(tAg) === wrote && prevShiftDate(tNc) === wrote);
        // the discriminator: the old spelling is WRONG at the after-midnight
        // clock (it names this shift's own file, which agenda-95-before-dreams-15
        // guarantees is not on disk), so this assertion could not have passed
        // before the fix.
        assert("H5 WIRE — calendar-yesterday is NOT the key: at 02:10 it names THIS shift's unwritten file, which is the defect this replaced",
          localDate(new Date(new Date(2026, 6, 14, 2, 10).getTime() - 86400000)) === tNc && tNc !== wrote);
        // and the source guard, the SIBLING_READERS pattern one level down: no
        // dreams read site may go back to calendar arithmetic.
        const src = readFileSync(join(__dirname, "brain.mjs"), "utf8");
        const dreamReads = src.split("\n").filter((l) => /join\(OUT_DIR, "dreams"/.test(l));
        assert(`H5 WIRE — all ${dreamReads.length} dreams read site(s) key by prevShiftDate(today), none by now-86400000`,
          dreamReads.length === 2 && dreamReads.every((l) => l.includes("prevShiftDate(today)") && !l.includes("86400000")));
      }
    }
  }

  // THE ALLOWED-SET SIDECAR AND ITS DELIVERY (10 Aug 2026 — the KAAM 1 scar).
  // Two failures, one wire. The sidecar's TRIGGER is `validate: "no_new_numbers"`
  // on wall_insights (runJob writes <out>/<outDay>.allowed.json off exactly that
  // predicate, and viz.mjs re-validates "The read" against it) — and the fix's
  // DELIVERY is a resident daemon that has to notice its own code moved. On 10 Aug
  // both were broken at once: the code was right at 08:51 and the process running
  // it had booted at 01:29, so zero .allowed.json files existed all day.
  {
    const wi = cfg.jobs.find((j) => j.id === "wall_insights");
    assert("SIDECAR TRIGGER — wall_insights still declares validate:no_new_numbers, the ONLY predicate that writes the <date>.allowed.json viz.mjs re-validates 'The read' against",
      !!wi && wi.validate === "no_new_numbers" && wi.out === "wall_insights" && wi.serve === "next_morning");
    // the real scar, to the second: daemon boot 01:29:33, dfe3c51 landed 08:51:23
    const BOOT = Date.parse("2026-08-10T01:29:33+05:30");
    const FIXED = Date.parse("2026-08-10T08:51:23+05:30");
    const mt = { "/r/brain.mjs": FIXED, "/r/validators.mjs": BOOT - 60000 };
    assert("STALE-CODE RETIREMENT — a source edited AFTER boot is named (this is the 10 Aug daemon: it would have written tonight's wall_insights with the pre-fix code)",
      staleSources(Object.keys(mt), BOOT, (p) => mt[p]).map((s) => s.path).join(",") === "/r/brain.mjs");
    assert("STALE-CODE RETIREMENT — nothing newer than boot ⇒ the resident stays up (no grace window either way: the comparison is strict, both sides measured)",
      staleSources(Object.keys(mt), FIXED, (p) => mt[p]).length === 0
      && staleSources(["/r/brain.mjs"], FIXED, () => FIXED).length === 0);
    assert("STALE-CODE RETIREMENT — an unreadable/vanished source is NOT evidence of a newer one; the pacer never retires on a read error",
      staleSources(["/r/gone.mjs"], BOOT, () => { throw new Error("ENOENT"); }).length === 0);
    const fake = { "/r/brain.mjs": 'import { x } from "./validators.mjs";\nimport { y } from "./manager.mjs";\nconst z = await import("./late.mjs");\nimport g from "./ghost.mjs";\nimport http from "node:http";',
                   "/r/validators.mjs": 'import { q } from "./manager.mjs";', "/r/manager.mjs": 'import { r } from "./brain.mjs";', "/r/late.mjs": "" };
    // separator-normalising reader: join() returns native separators, and the
    // whole point of the Map key is that those must not fork the walk.
    const g = sourceGraph("/r/brain.mjs", (p) => { const k = p.replace(/\\/g, "/"); if (!(k in fake)) throw new Error("ENOENT"); return fake[k]; }).map((p) => p.replace(/\\/g, "/")).sort();
    assert("SOURCE GRAPH — transitive + dynamic imports are watched, node: builtins are not, a cycle terminates, and each file appears ONCE whatever separators it arrived with",
      g.join(",") === "/r/brain.mjs,/r/late.mjs,/r/manager.mjs,/r/validators.mjs");
    assert("SOURCE GRAPH — an unreadable specifier is NOT watched: ./ghost.mjs never enters the list (this is what kept the selftest's own fixture strings out of the LIVE watch — measured, they were in it)",
      !g.some((p) => p.includes("ghost")));
    // and the LIVE graph: brain.mjs's real sibling imports must be in it, or a
    // repair landing in one of them would ride a frozen resident unnoticed.
    const live = sourceGraph(fileURLToPath(import.meta.url), (p) => readFileSync(p, "utf8")).map((p) => basename(p));
    // SELF-DESCRIBING ON FAILURE (12 Aug 2026, E1): this assertion fails on the CI
    // runner and passes in every local reproduction (bare env, TZ=UTC, CRLF clone,
    // shallow clone) — so when it fails it must SAY which sibling the walk missed
    // and on what machine shape, because the runner's log is the only place the
    // difference exists and the annotation tail is the only readable surface.
    const wanted = ["brain.mjs", "validators.mjs", "manager.mjs", "scoreboard.mjs", "nikhil_model.mjs", "captains_call.mjs"];
    const missing = wanted.filter((f) => !live.includes(f));
    assert(`SOURCE GRAPH — the LIVE walk finds this file and its real siblings (validators/manager/scoreboard/nikhil_model/captains_call)${missing.length ? ` — MISSING: ${missing.join("+")} · walked ${live.length}: ${live.sort().join(",").slice(0, 300)} · node ${process.version} · locale ${Intl.DateTimeFormat().resolvedOptions().locale}` : ""}`,
      missing.length === 0);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // THE GATE (ORGANISM_OVERHAUL 18 Aug 2026 §5.5) — the acceptance fixtures, at
  // the TICK level: verdict → journal row → card → the next slot wakes it, with
  // no human action. Everything hermetic: fixture ledger/consumption/cards/mouth,
  // captured journal + card args, dry executors. Nothing touches the live bus.
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const T = new Date(2026, 7, 18, 23, 30, 0);   // 18 Aug 2026 23:30 local — overnight window
    const iso = (dAgo) => new Date(T.getTime() - dAgo * 86400000).toISOString();
    const J = (id, extra = {}) => ({ id, kind: "analysis", model: "sonnet", engine: "claude", enabled: true, window: "overnight", max_per_day: 1, priority: 50, inputs: [], out: id, surface: { kind: "code", where: "scripts/learnstate.mjs" }, ...extra });
    const gcfg = { ...cfg, jobs: [
      J("needs_season", { inputs: [{ path: "season.json", required: true }] }),
      J("upstream_only", { inputs: [{ path: "brain_out/other/TODAY.md", required: true }] }),
      J("digest", { surface: { kind: "job_input", where: "input to cartridge" } }),
      J("cartridge", { inputs: ["brain_out/digest/TODAY.md"], surface: { kind: "code", where: "scripts/dugout.mjs" } }),
      J("failing"),
      J("stale_lane"),
      J("fresh_lane"),
    ] };
    const okExec = () => ({ ok: true, text: "Sharp read. 2 drills stand.", total_tokens: 1000, duration_ms: 5, limit_hit: false, error: null });
    const journal = [], cards = [];
    const evidenceFor = (job) => {   // fixture disk: season.json is ABSENT, other files present
      const req = normalizeInputs(job);
      const absent = req.filter((d) => /season\.json/.test(d.path) || /brain_out\/other/.test(d.path)).map((d) => d.path.replace(/TODAY/g, "2026-08-18"));
      return { inputs: {}, declared: req.length, absent, required_absent: absent.filter((p) => req.find((d) => d.path.replace(/TODAY/g, "2026-08-18") === p && d.required)), present: req.length - absent.length, door: [], door_dropped: 0 };
    };
    // history: every lane except fresh_lane has run before (so first-run grace is off);
    // `failing` has 5 straight failures; stale_lane was consumed 20d ago, cartridge 2d ago.
    const hist = [
      { ts: iso(3), job: "needs_season", engine: "claude", ok: true, total_tokens: 1 },
      { ts: iso(3), job: "upstream_only", engine: "claude", ok: true, total_tokens: 1 },
      { ts: iso(3), job: "digest", engine: "claude", ok: true, total_tokens: 1 },
      { ts: iso(3), job: "cartridge", engine: "claude", ok: true, total_tokens: 1 },
      { ts: iso(3), job: "stale_lane", engine: "claude", ok: true, total_tokens: 1 },
      ...Array.from({ length: 5 }, (_, i) => ({ ts: iso(2 - i * 0.1), job: "failing", engine: "claude", ok: false, error: "validator: banned", total_tokens: 1 })),
    ];
    const consumption = [
      { ts: iso(20), job: "stale_lane", kind: "briefed", by: "learnstate" },
      { ts: iso(2), job: "cartridge", kind: "sat", by: "dugout" },
      { ts: iso(1), job: "needs_season", kind: "briefed", by: "learnstate" },
      { ts: iso(1), job: "upstream_only", kind: "briefed", by: "learnstate" },
      { ts: iso(1), job: "failing", kind: "briefed", by: "learnstate" },
    ];
    const gateDeps = (over = {}) => ({
      exec: okExec, gexec: () => ({ ok: false }), now: T, dry: false,
      ledger: hist, queueState: { observed_window_ceiling: null, jobs_run: {} },
      gate: { consumption, cards: [], states: new Map(), mouth: [], mediaExists: () => false, evidenceFor },
      appendJournal: (l) => journal.push(JSON.parse(l)), fileCard: (args) => { cards.push(args); return true; },
      ...over,
    });
    // dry:false is needed for the journal/card path, so every WRITE the tick would do
    // must be intercepted: the ledger append and the queue write are the two. Both are
    // guarded by `deps.dry` in tick(); here we keep dry:false but hand tick a fixture
    // ledger (no roll) and rely on the fact that appendFileSync(LEDGER) happens only
    // when !deps.dry — so we run the tick against a TEMP copy of the module state by
    // pointing the two paths at a scratch dir? No such seam exists; instead we run in
    // dry mode for the ledger and exercise the journal/card seams DIRECTLY below.
    const gc = gateContext(gateDeps({ dry: true }), T, hist, { jobs_run: {} });
    const rep = gateReport(gcfg, gc);
    const by = (id) => rep.rows.find((r) => r.lane === id);
    assert("§5.5/1 TICK — a REQUIRED input outside brain_out (season.json) absent ⇒ ASLEEP on E, wakes when the file exists again",
      by("needs_season").run === false && by("needs_season").why.E.ok === false && /season\.json exists again/.test(by("needs_season").wakes_when));
    assert("§5.5/1 TICK — a REQUIRED input UNDER brain_out is an upstream ordering fact, not evidence: the lane stays AWAKE on E (runJob's own refusal keeps handling the same-day absence)",
      by("upstream_only").why.E.ok === true && by("upstream_only").run === true && by("upstream_only").evidence.upstream_absent.length === 1);
    assert("§5.5/2 TICK — five straight ok:false rows ⇒ ASLEEP on F even though it was briefed yesterday; the wake door is named",
      by("failing").run === false && by("failing").why.F.ok === false && by("failing").why.C.ok === true && /gate wake failing/.test(by("failing").wakes_when));
    assert("§5.5/3 TICK — consumed (briefed) 20d ago ⇒ ASLEEP on C; consumed (sat) 2d ago ⇒ AWAKE",
      by("stale_lane").run === false && by("stale_lane").why.C.ok === false && by("cartridge").run === true && /sat/.test(by("cartridge").why.C.detail));
    assert("TRANSITIVE C — a job_input lane (digest) is consumed when the job that EATS it (cartridge, via its declared input) was consumed: awake, and the chain is named",
      by("digest").run === true && /← cartridge/.test(by("digest").why.C.detail) && jobConsumers(gcfg, gcfg.jobs.find((j) => j.id === "digest")).map((j) => j.id).join() === "cartridge");
    assert("FIRST RUN — a lane with no boolean-ok row ever (fresh_lane) is AWAKE on grace, marked as such",
      by("fresh_lane").run === true && by("fresh_lane").never_ran === true && /first run/.test(by("fresh_lane").why.C.detail));
    assert("REPORT — asleep/awake partition adds up and every asleep row carries a wakes_when sentence",
      rep.asleep.length + rep.awake.length === gcfg.jobs.length && rep.asleep.length === 3 && rep.asleep.every((r) => typeof r.wakes_when === "string" && r.wakes_when.length > 10));

    // the transition seam: first sight journals + cards; same state again = silence;
    // the wake (evidence back / consumption back / force) journals awake, no card.
    journal.length = 0; cards.length = 0;
    const vAsleep = by("needs_season");
    const t1 = gateTransition("needs_season", vAsleep, { now: T, prevState: null, appendJournal: (l) => journal.push(JSON.parse(l)), fileCard: (a) => { cards.push(a); return true; }, cfg: gcfg });
    const t2 = gateTransition("needs_season", vAsleep, { now: T, prevState: journal[0], appendJournal: (l) => journal.push(JSON.parse(l)), fileCard: (a) => { cards.push(a); return true; }, cfg: gcfg });
    assert("JOURNAL — a lane's FIRST asleep verdict writes one row {lane,state,why,detail,wakes_when} and files ONE card; the same verdict on the next beat writes NOTHING",
      t1.changed === true && journal.length === 1 && journal[0].lane === "needs_season" && journal[0].state === "asleep" && journal[0].why.E === false && cards.length === 1
      && t2.changed === false && journal.length === 1 && cards.length === 1);
    assert("CARD — the args are captains_call's own file door: --line names lane+cause+wake+the two words, --key is gate:<lane>:<day> (rolling family = one per episode), --gate-wake carries the lane for his na",
      cards[0][0] === "file" && /needs_season SO GAYA \(E:/.test(cards[0][2]) && /haan=sone do · na=14d jagao/.test(cards[0][2]) && cards[0][2].length <= 200
      && cards[0][cards[0].indexOf("--key") + 1] === `gate:needs_season:${localDate(T)}` && cards[0][cards[0].indexOf("--gate-wake") + 1] === "needs_season");
    // evidence returns ⇒ the SAME machinery journals awake, and no card
    const gcBack = gateContext(gateDeps({ dry: true, gate: { consumption, cards: [], states: new Map(), mouth: [], mediaExists: () => false, evidenceFor: (job) => ({ inputs: {}, declared: 1, absent: [], required_absent: [], present: 1, door: [], door_dropped: 0 }) } }), T, hist, { jobs_run: {} });
    const vAwake = gateVerdictFor(gcfg.jobs[0], gcfg, gcBack);
    const t3 = gateTransition("needs_season", vAwake, { now: T, prevState: journal[0], appendJournal: (l) => journal.push(JSON.parse(l)), fileCard: (a) => { cards.push(a); return true; }, cfg: gcfg });
    assert("WAKE — season.json back ⇒ verdict AWAKE ⇒ one `awake` journal row, NO card, no human action anywhere in the chain",
      vAwake.run === true && t3.changed === true && journal.length === 2 && journal[1].state === "awake" && cards.length === 1);

    // the two wake doors, through the state the CLI writes
    const qs = { jobs_run: {} };
    setGateForce(qs, "failing", { until: iso(-14), once: true, by: "card c1 (his na)", now: T });
    const vForced = gateVerdictFor(gcfg.jobs.find((j) => j.id === "failing"), gcfg, { ...gc, queueState: qs });
    assert("FORCE — `gate wake` (or his na) puts a {until,once} force in brain_queue.gate.forced and the F-blocked lane runs ONCE; the force is named in the verdict",
      vForced.run === true && /ONE run/.test(vForced.why.F.detail) && vForced.forced && vForced.forced.by === "card c1 (his na)");
    const vStale = gateVerdictFor(gcfg.jobs.find((j) => j.id === "stale_lane"), gcfg, { ...gc, queueState: (() => { const q = { jobs_run: {} }; setGateForce(q, "stale_lane", { until: iso(-14), once: false, now: T }); return q; })() });
    assert("FORCE — a C-blocked lane with a live `until` force is awake for the window (his na buys 14 days, not one run)",
      vStale.run === true && /forced awake/.test(vStale.why.C.detail));
    // lost-update safety: a force written to disk between a tick's read and write survives; a spent `once` stays spent
    const merged = mergeTriggers({ triggers: {}, gate: { forced: { late: { until: iso(-14), once: true, by: "cli" } } } }, { jobs_run: {}, gate: { forced: { failing: { until: iso(-14), once: false, by: "cli" } } } }, [], ["failing"]);
    assert("MERGE — a `gate wake` written to disk mid-tick survives the tick's whole-object write; a `once` this tick spent stays spent",
      merged.gate.forced.late && merged.gate.forced.late.once === true && merged.gate.forced.failing.once === false);
    const merged2 = mergeTriggers({ triggers: {}, gate: { forced: { x: { until: iso(-14), once: true, by: "cli" } } } }, { jobs_run: {} }, [], []);
    assert("MERGE — a tick that never touched gate state still carries the disk's forces forward (and triggers merge exactly as before)",
      merged2.gate.forced.x.once === true && typeof merged2.triggers === "object");

    // ── THE FOLD (Block 5.2) — the runner's fact, then the fourth letter, then the transition ──
    {
      // T = 18 Aug 23:30 (evening half of the overnight shift): prepare_tomorrow (03:20, serve
      // next_morning) serves 2026-08-19; night_coach (overnight, no at) is folded into it.
      const fcfg = { ...cfg, jobs: [
        J("night_coach", { model: "opus", folded_into: "prepare_tomorrow", kind: "night_coach" }),
        J("agenda", { at: "22:45", folded_into: "prepare_tomorrow", kind: "agenda" }),
        J("prepare_tomorrow", { at: "03:20", serve: "next_morning", out: "prepare", kind: "prepare_tomorrow" }),
        J("orphan_fold", { folded_into: "no_such_job" }),
      ] };
      const fhist = [
        { ts: iso(3), job: "night_coach", engine: "claude", ok: true, total_tokens: 1 },
        { ts: iso(3), job: "agenda", engine: "claude", ok: true, total_tokens: 1 },
        { ts: iso(3), job: "prepare_tomorrow", engine: "claude", ok: true, total_tokens: 1 },
        { ts: iso(3), job: "orphan_fold", engine: "claude", ok: true, total_tokens: 1 },
      ];
      const fcons = [{ ts: iso(1), job: "night_coach", kind: "briefed", by: "learnstate" }, { ts: iso(1), job: "agenda", kind: "briefed", by: "learnstate" }, { ts: iso(1), job: "prepare_tomorrow", kind: "sat", by: "sitting" }, { ts: iso(1), job: "orphan_fold", kind: "briefed", by: "learnstate" }];
      const fctx = (over = {}) => ({ ...gateContext(gateDeps({ dry: true, ledger: fhist, gate: { consumption: fcons, cards: [], states: new Map(), mouth: [], mediaExists: () => false, evidenceFor: () => ({ inputs: {}, declared: 0, absent: [], required_absent: [], present: 0, door: [], door_dropped: 0 }) } }), T, fhist, { jobs_run: {} }), ...over });
      const jobF = (id) => fcfg.jobs.find((j) => j.id === id);
      // (a) the plan for the day it serves is on disk ⇒ COVERED
      const fA = foldStatus(jobF("night_coach"), fcfg, fctx({ artifactExists: (t, day) => t.id === "prepare_tomorrow" && day === "2026-08-19" }));
      assert("FOLD/runner — the target's artifact for the day it serves NOW (23:30 → serves 2026-08-19) exists ⇒ covered, the detail names target + day + path",
        fA && fA.covered === true && fA.day === "2026-08-19" && /folded → prepare_tomorrow/.test(fA.detail) && /brain_out\/prepare\/2026-08-19/.test(fA.detail));
      // (b) no plan yet, target awake, its 03:20 slot for the 19th still ahead of 23:30 ⇒ covered (pending)
      const fB = foldStatus(jobF("night_coach"), fcfg, fctx({ artifactExists: () => false }));
      assert("FOLD/runner — no artifact yet, target AWAKE and its slot for that day still AHEAD (03:20 tomorrow) ⇒ covered-pending: the folded lane WAITS instead of running first",
        fB && fB.covered === true && /due 03:20/.test(fB.detail) && /waits/.test(fB.detail));
      // (c) the target ATTEMPTED that day and left nothing ⇒ OPEN (fallback)
      const failedRun = { ts: new Date(2026, 7, 19, 3, 21, 0).toISOString(), job: "prepare_tomorrow", engine: "claude", ok: false, error: "x", total_tokens: 1 };
      const T2 = new Date(2026, 7, 19, 3, 25, 0);
      const fC = foldStatus(jobF("night_coach"), fcfg, fctx({ now: T2, ledger: [...fhist, failedRun], artifactExists: () => false }));
      assert("FOLD/runner — the target ran for that day and left no artifact (failed at 03:21) ⇒ the fold is OPEN and the folded lane is the FALLBACK; nothing was deleted, no list edited",
        fC && fC.covered === false && /left no artifact/.test(fC.detail) && /fallback/.test(fC.detail));
      // (d) slot passed with no attempt (laptop asleep) ⇒ OPEN
      const fD = foldStatus(jobF("night_coach"), fcfg, fctx({ now: new Date(2026, 7, 19, 4, 0, 0), artifactExists: () => false }));
      assert("FOLD/runner — the target's slot passed with NO attempt (a dead night) ⇒ OPEN, named", fD && fD.covered === false && /passed with no attempt/.test(fD.detail));
      // (e) target itself asleep (F streak) ⇒ OPEN
      const fE = foldStatus(jobF("night_coach"), fcfg, fctx({ ledger: [...fhist, ...Array.from({ length: 5 }, (_, i) => ({ ts: iso(2 - i * 0.1), job: "prepare_tomorrow", engine: "claude", ok: false, error: "x", total_tokens: 1 }))], artifactExists: () => false }));
      assert("FOLD/runner — a target that is itself ASLEEP (5-fail streak) cannot cover anything ⇒ OPEN, the folded lane decides on its own E·C·F", fE && fE.covered === false && /itself ASLEEP \(F\)/.test(fE.detail));
      // (f) a fold to a non-job is OPEN and says so; an unfolded job has no fold fact
      assert("FOLD/runner — folded_into a job that does not exist (and no fold_artifact) ⇒ OPEN and named; a job with no folded_into ⇒ null (no fact)",
        foldStatus(jobF("orphan_fold"), fcfg, fctx()).covered === false && /not a brain job/.test(foldStatus(jobF("orphan_fold"), fcfg, fctx()).detail) && foldStatus(jobF("prepare_tomorrow"), fcfg, fctx()) === null);
      // (f2) a NON-brain target (nightshift round_read) with fold_artifact — covered iff the file for the calendar day exists
      const gca = J("gaffer_claim_audit", { at: "03:10", folded_into: "round_read", fold_artifact: "brain_out/nightshift/round_read_<day>.json" });
      const T3 = new Date(2026, 7, 19, 3, 10, 0);
      const fN1 = foldStatus(gca, { ...fcfg, jobs: [...fcfg.jobs, gca] }, fctx({ now: T3, artifactExists: (t, day, name) => t.id === "round_read" && t.out === "nightshift" && day === "2026-08-19" && name === "round_read_2026-08-19.json" }));
      const fN0 = foldStatus(gca, { ...fcfg, jobs: [...fcfg.jobs, gca] }, fctx({ now: T3, artifactExists: () => false }));
      assert("FOLD/runner — a fold into a NON-brain lane (round_read) is decided by the config-named fold_artifact for the calendar day: file there ⇒ covered · absent ⇒ OPEN (no 'still due' — brain does not schedule the shift)",
        fN1 && fN1.covered === true && /brain_out\/nightshift\/round_read_2026-08-19\.json/.test(fN1.detail) && fN0 && fN0.covered === false && /fold is OPEN/.test(fN0.detail));
      assert("FOLD/config — gaffer_claim_audit is folded into round_read (judge_night's home) with its fold_artifact named; the six night lanes fold into prepare_tomorrow",
        (() => { const g = cfg.jobs.find((j) => j.id === "gaffer_claim_audit"); const six = ["night_coach", "day_cartridge", "agenda", "teamtalk_am", "midday_cartridge", "capsule_premap"]; return g && g.folded_into === "round_read" && /round_read_<day>\.json$/.test(g.fold_artifact) && six.every((id) => (cfg.jobs.find((j) => j.id === id) || {}).folded_into === "prepare_tomorrow"); })());
      // (g) the pre-midnight `at` (agenda 22:45) — its slot for the 19th is the evening of the 18th: at 23:30 it is past ⇒ but the TARGET's slot is what counts (03:20 ahead) ⇒ covered
      const fG = foldStatus(jobF("agenda"), fcfg, fctx({ artifactExists: () => false }));
      assert("FOLD/runner — the folded lane's own `at` is irrelevant; the TARGET's slot for the served day decides (agenda at 23:30 waits for prepare_tomorrow's 03:20)", fG && fG.covered === true);
      // the fourth letter through the whole verdict + the transition (journal row, NO card on D alone)
      const vFold = gateVerdictFor(jobF("night_coach"), fcfg, fctx({ artifactExists: (t, day) => day === "2026-08-19" }));
      assert("FOLD/verdict — a covered folded lane is ASLEEP on D ALONE (E·C·F hold), fold.target named, wakes_when says the fold opens by itself the night the target fails",
        vFold.run === false && vFold.why.E.ok && vFold.why.C.ok && vFold.why.F.ok && vFold.why.D.ok === false && vFold.fold && vFold.fold.target === "prepare_tomorrow" && vFold.fold.covered === true && /fold opens by itself the night prepare_tomorrow fails/.test(vFold.wakes_when));
      const fj = [], fcards = [];
      const tF = gateTransition("night_coach", vFold, { now: T, prevState: null, appendJournal: (l) => fj.push(JSON.parse(l)), fileCard: (a) => { fcards.push(a); return true; }, cfg: fcfg });
      assert("FOLD/transition — a sleep on D alone JOURNALS (why.D false, fold named, card:'none (fold …)') and files NO card — the fold is his approved design, not a lane going quiet",
        tF.changed && fj.length === 1 && fj[0].why.D === false && fj[0].fold && fj[0].fold.target === "prepare_tomorrow" && /none \(fold/.test(fj[0].card) && fcards.length === 0);
      const vFoldOpen = gateVerdictFor(jobF("night_coach"), fcfg, fctx({ now: T2, ledger: [...fhist, failedRun], artifactExists: () => false }));
      assert("FOLD/verdict — the night the target fails, the same lane reads AWAKE (D holds, fold OPEN named in D's detail) — the fallback runs with no human action",
        vFoldOpen.run === true && vFoldOpen.why.D.ok === true && /fold OPEN/.test(vFoldOpen.why.D.detail) && vFoldOpen.fold && vFoldOpen.fold.covered === false);
      const repF = gateReport(fcfg, fctx({ artifactExists: (t, day) => day === "2026-08-19" }));
      assert("FOLD/report — gateReport carries fold on every folded row so `brain status` can print `folded → prepare_tomorrow: night_coach, agenda` (the DoD line)",
        repF.rows.filter((r) => r.fold && r.fold.target === "prepare_tomorrow").map((r) => r.lane).sort().join() === "agenda,night_coach" && repF.rows.find((r) => r.lane === "prepare_tomorrow").fold === null);
    }

    // the consumption lane's own door
    const rows = [];
    const r1 = recordConsumption({ job: "night_coach", kind: "briefed", by: "learnstate" }, { append: (l) => rows.push(JSON.parse(l)), now: T });
    const r2 = recordConsumption({ job: "night_coach", kind: "glanced-at" }, { append: (l) => rows.push(JSON.parse(l)), now: T });
    const r3 = recordConsumption({ kind: "briefed" }, { append: (l) => rows.push(JSON.parse(l)), now: T });
    assert("CONSUMPTION — recordConsumption writes {ts,job,lane,kind,by,file,note}; an unknown kind is REFUSED (the kinds are the law, closed); no job/lane is refused",
      r1.ok && rows.length === 1 && rows[0].job === "night_coach" && rows[0].kind === "briefed" && rows[0].by === "learnstate" && "file" in rows[0]
      && r2.ok === false && /unknown consumption kind/.test(r2.why) && r3.ok === false && rows.length === 1);
    // cards as a derived source
    const cardsFx = [
      { id: "c7", dispatch: { kind: "open", path: "dressing-room/state/brain_out/market/2026-08-01.md" }, answer: "haan", answered_at: iso(5) },
      { id: "c8", dispatch: { kind: "open", path: "dressing-room\\state\\brain_out\\market\\2026-08-08.md" }, answer: "baad", answered_at: iso(1) },
      { id: "c9", dispatch: { kind: "open", path: "dressing-room/state/brain_out/doubts/2026-08-01.md" }, answer: null, answered_at: null },
    ];
    const cc = cardConsumption(cardsFx, "market");
    assert("CARDED — a card whose `open` dispatch points into the lane and that he answered haan/na counts (Windows path too); `baad` and unanswered do not",
      cc && cc.kind === "carded" && /c7/.test(cc.by) && cardConsumption(cardsFx, "doubts") === null);
    // the mouth as a derived source
    const mouth = [{ ts: iso(1), kind: "sheet", sent: true }, { ts: iso(0.5), kind: "sheet", sent: false, why: "no topic" }, { ts: iso(2), kind: "bell:fulltime", sent: true }];
    const sheetJob = { id: "formation_read", kind: "manager_m3" };
    const amJob = { id: "teamtalk_am", speak_to: "teamtalk_DATE_am.mp3" };
    const pmJob = { id: "teamtalk_pm", speak_to: "teamtalk_DATE_pm.mp3" };
    const mcfg = { ntfy: { push_after: ["formation_read"] } };
    const mSheet = mouthConsumption(sheetJob, mcfg, { mouth });
    const mAm = mouthConsumption(amJob, mcfg, { mouth, mediaExists: () => true });
    const mPm = mouthConsumption(pmJob, mcfg, { mouth, mediaExists: () => true });
    assert("PUSHED — the sheet is consumed at the newest SENT sheet push (a failed push is not a reach); the team-talk mp3s are NOT — an announcement is not a listen, and nothing records a play (R3's poster children stay asleep until a play is recorded)",
      mSheet && mSheet.kind === "pushed" && mSheet.last_at === iso(1) && mAm === null && mPm === null);
    // the batch rule
    const filed = [];
    const many = Array.from({ length: 5 }, (_, i) => ({ lane: `l${i}`, args: ["file", "--line", `l${i}`, "--key", `gate:l${i}:d`, "--gate-wake", `l${i}`] }));
    const bA = gateCardsForTick(many, T, { fileCard: (a) => filed.push(a) });
    const afterA = filed.length;
    const few = many.slice(0, 2);
    const bB = gateCardsForTick(few, T, { fileCard: (a) => filed.push(a) });
    assert("BATCH — more than 3 lanes sleeping in ONE tick ⇒ ONE card whose na wakes EXACTLY those lanes (`--gate-wake l0,l1,…`); 3 or fewer ⇒ the per-lane cards; a threshold of 1 batches a 2-lane pass",
      bA.batch === true && bA.filed === 1 && afterA === 1 && filed[0][filed[0].indexOf("--gate-wake") + 1] === "l0,l1,l2,l3,l4" && /5 lanes so gaye/.test(filed[0][2])
      && bB.batch === false && filed.length === 3
      && gateCardsForTick(few, T, { fileCard: () => {}, threshold: 1, label: "nightshift" }).batch === true);
    // and the tick itself honours the verdict: an asleep lane never reaches the executor
    {
      const execd = [];
      const jr = [], cf = [];
      const tk = await tick(gcfg, gateDeps({ dry: true, exec: (p, m) => { execd.push(m); return okExec(); }, appendJournal: (l) => jr.push(l), fileCard: (a) => cf.push(a) }));
      const ranIds = tk.ran.map((r) => r.job);
      const gatedIds = (tk.gated || []).map((g) => g.job);
      assert("TICK — asleep lanes are reported in `gated` (never in `ran`, never at the executor); awake lanes run as before; dry writes nothing",
        gatedIds.sort().join() === "failing,needs_season,stale_lane" && !ranIds.some((id) => gatedIds.includes(id)) && ranIds.includes("cartridge") && ranIds.includes("fresh_lane")
        && jr.length === 0 && cf.length === 0);
    }
  }

  const passed = checks.every(c => c[1]);
  console.log(passed ? "\nALL CHECKS PASSED" : "\nSELFTEST FAILED");
  return passed;
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
// SINGLE-INSTANCE tick guard (P3-review fix) — the resident daemon and any schtasks
// 'brain tick' must NEVER run tick() CONCURRENTLY, or an eligible job double-runs (double
// Opus spend + duplicate ledger rows) because jobs_run is only persisted at beat-end. An
// exclusive localhost port bind (cortex's :4112 pattern) serializes ticks across processes
// and self-releases if a holder crashes. Held only for the tick's duration; a loser skips.
// E2E audit 25 Jul 2026: the bind result used to be a BOOLEAN — every listen
// error meant "another tick is running". It doesn't. EACCES, EADDRNOTAVAIL, or a
// Windows WinNAT/Hyper-V dynamic reserved range swallowing :4115 (those ranges
// move after a reboot) all bind-fail too — and then every daemon beat and every
// scheduled tick forever prints "tick locked (another tick is running)", an
// assertion about a concurrent tick that does not exist, while the brain quietly
// does nothing at all. Only EADDRINUSE is a lock; anything else is a FAULT.
function lockVerdict(err) {
  if (!err) return "acquired";
  return err.code === "EADDRINUSE" ? "locked" : "unbindable";
}
async function withTickLock(fn, deps = {}) {
  // brain's OWN singleton port. The organism's block: 4111 turnstile · 4112 cortex ·
  // 4113 thalamus · 4114 dugout — so brain takes 4115 (verified free; 4111 collides).
  const port = deps.lockPort || 4115;
  const { createServer } = await import("node:http");
  const lock = createServer(() => {});
  const err = await new Promise((res) => { lock.once("error", (e) => res(e || { code: "UNKNOWN" })); lock.listen(port, "127.0.0.1", () => res(null)); });
  const verdict = lockVerdict(err);
  if (verdict === "locked") return { ran: [], refused: false, skipped: "tick locked (another tick is running)" };
  if (verdict === "unbindable") {
    // loud, then RUN: a dead brain is worse than a small concurrency risk (the
    // daemon singleton on :4116 already stops the common double-runner).
    console.error(`brain: ⚠ tick-lock port :${port} is UNBINDABLE (${err.code}) — this is NOT a concurrent tick. Running this tick UNLOCKED; if it persists, free the port or move it (deps.lockPort).`);
    return await fn();
  }
  try { return await fn(); } finally { try { lock.close(); } catch {} }
}

// ---------------------------------------------------------------------------
// THE RESIDENT MUST NOT OUTLIVE ITS OWN SOURCE (10 Aug 2026 — the KAAM 1 scar).
// KAAM 1 shipped the allowed-set sidecar at 08:51:23 (dfe3c51). The resident
// daemon holding :4116 had booted at 01:29:33 the SAME morning — 7h22m earlier —
// and an ESM process never re-reads its own modules. So the repair was live in
// the FILE and absent from the PROCESS that beats every ~75s and would have
// written tonight's wall_insights: no `<date>.allowed.json` on disk, viz.mjs
// falling back to shown = "" exactly as before, and "The read" dead a fifth
// night with its fix sitting committed in the repo. `find brain_out -name
// '*.allowed.json'` → empty, all day, on a fixed codebase.
// Audit #108 caught the twin of this on the PAUSE switch and fixed it by
// RE-READING THE CONFIG each beat (see liveCfg below) — but no amount of
// re-reading state can refresh code. The only honest move is to retire.
//
// RETIRING IS SAFE, because two organs already cover the gap and both are live:
//   · daemon_watchdog.mjs (every 10 min, LADDER D2) probes :4116, finds it DOWN
//     and relaunches `brain.mjs daemon` through the VBS cloak — on the NEW code.
//     Its "never kills anything, relaunch only" law is exactly why the resident
//     has to be the one that steps down.
//   · ArsenalFC-BrainTick spawns a FRESH `brain.mjs tick` every 30 min, and has
//     always been immune to this because it is a new process every time.
// So this is not "stop the brain" — it is "hand the brain to a process that can
// read today's repair". Nothing is killed: the loop ends between beats, the same
// clean stop SIGTERM already performs, so no beat dies mid-`claude -p`.
//
// NO THRESHOLD AND NO GRACE WINDOW: both sides are MEASURED, never chosen — this
// process's own boot instant (Date.now() - process.uptime()*1000) against each
// source file's mtime, compared strictly. A grace period would be a guessed
// number; the price of strictness is one extra relaunch during an editing
// session, which the watchdog absorbs on its own schedule.
//
// The graph is walked, not hardcoded: brain.mjs imports nikhil_model, scoreboard,
// manager, captains_call and validators today, and a repair landing in any of
// them is just as frozen in a running resident as one landing here.
export function sourceGraph(entry, readSrc) {
  // keyed on separator-normalised paths: join() returns native separators, so a
  // caller handing in "C:/…/brain.mjs" and manager.mjs's own "./brain.mjs" would
  // otherwise be watched TWICE and named twice in the retirement line (seen live,
  // 10 Aug). Separators only — case-folding would be a guess about the platform.
  const seen = new Map();
  const key = (p) => String(p).replace(/[\\/]+/g, "/");
  const queue = [entry];
  while (queue.length) {
    const p = queue.shift();
    if (seen.has(key(p))) continue;
    let src;
    // A module we cannot READ is not watched AT ALL: never treated as changed
    // (a transient read error must not retire the pacer) and never added to the
    // list. That second half matters — the regex below cannot tell an import
    // statement from a specifier sitting inside a STRING LITERAL, and this very
    // file's selftest fixtures contain both. Requiring the file to open is what
    // keeps "./late.mjs" out of the live watch list (measured: it was in it).
    try { src = readSrc(p); } catch { continue; }
    seen.set(key(p), p);
    // static `from "./x.mjs"` and dynamic `import("./x.mjs")`, both local only:
    // node: builtins and bare specifiers are not ours to watch. Built fresh each
    // call so no lastIndex can leak between walks.
    for (const m of String(src).matchAll(/(?:from|import)\s*\(?\s*["'](\.\/[^"'\n]+\.mjs)["']/g)) queue.push(join(dirname(p), m[1]));
  }
  return [...seen.values()];
}
export function staleSources(paths, bootMs, mtimeOf) {
  const out = [];
  for (const p of paths) {
    let mt = null;
    // a file that vanished is not evidence of a NEWER one — same fail-quiet rule
    try { mt = mtimeOf(p); } catch { continue; }
    if (typeof mt === "number" && mt > bootMs) out.push({ path: p, mtime_ms: mt });
  }
  return out;
}

// DRY MEANS DRY (E2E audit 25 Jul 2026). --dry only ever suppressed WRITES: the
// executor still fired REAL `claude -p` calls, and because the ledger append is a
// write, the spend was invisible too. `brain daemon --dry` at 23:00 to "preview"
// the overnight drain therefore re-ran the whole overnight suite plus a haiku
// pulse every 75s with real, unmetered Opus/Sonnet calls. The dry executors are
// injected in ONE place (buildDeps) so every mode — tick, run, pulse, daemon —
// inherits them; selftest injects its own deps and is untouched by this.
// the stub text is deliberately DIGIT-FREE so the no_new_numbers validator can't
// reject it and turn a dry preview into a fake "rejected" report.
const dryExec = (prompt, model) => ({ ok: true, text: `[dry-run — no LLM call was made; the real run would have used model: ${String(model || "sonnet").replace(/\d/g, "")}]`, input_tokens: 0, output_tokens: 0, cache_creation_tokens: 0, cache_read_tokens: 0, total_tokens: 0, duration_ms: 0, limit_hit: false, error: null });
const dryGexec = () => ({ ok: true, text: "[dry-run — no gemini call was made.]", total_tokens: 0, duration_ms: 0, limit_hit: false, error: null });
function buildDeps(now, argv = process.argv) {
  const dry = argv.includes("--dry");
  return { exec: dry ? dryExec : claudeExec, gexec: dry ? dryGexec : geminiExec, now, dry, signals: liveSignal(now) };
}

async function main() {
  const mode = (process.argv[2] || "tick").toLowerCase();
  if (mode === "selftest") { process.exit((await selftest()) ? 0 : 1); }
  const cfg = loadConfig();
  const now = new Date();
  const deps = buildDeps(now);   // --dry ⇒ stub executors: dry is DRY, not "writes off"

  if (mode === "bell") {
    const kind = (process.argv[3] || "fulltime").toLowerCase();
    const bell = BELLS[kind];
    if (!bell) { console.log(`brain: no bell '${kind}'`); process.exit(1); }
    // THE BELL MEANS ITS HOUR (29 Jul 2026). The schtask carries
    // StartWhenAvailable=True, so a missed 21:30 fires the INSTANT the laptop
    // wakes — observed live: last run 15:23, pushing "Full-time, captain —
    // 30 seconds, then sleep" to his phone at twenty past three in the
    // afternoon. Catch-up is right for consolidation, which only needs to
    // happen; it is wrong for an utterance whose entire meaning is its hour.
    // The organism gets exactly two utterances a day — one arriving absurdly
    // late costs more trust than a skipped one. Late ⇒ stay silent, out loud.
    if (bell.at && !process.argv.includes("--force")) {
      const [bh, bm] = String(bell.at).split(":").map(Number);
      const lateBy = (now.getHours() * 60 + now.getMinutes()) - (bh * 60 + bm);
      if (lateBy < -5 || lateBy > (bell.grace_min || 75)) {
        console.log(`brain: bell '${kind}' SILENT — it is ${hhmm(now)}, the bell belongs to ${bell.at} (±${bell.grace_min || 75}m). A catch-up bell at the wrong hour is noise, not a cue. Use --force to ring anyway.`);
        return;
      }
    }
    const tt = teamtalkLine("pm", now);   // rides INSIDE the bell — never a third utterance
    const r = await pushNtfy(cfg, bell.title, bell.body + (tt ? "\n" + tt : ""));
    recordMouth(`bell:${kind}`, r);   // E4 — the attempt is a row either way
    console.log(`brain: bell '${kind}' ${r.sent ? "rang on the phone" : "silent (" + r.why + ")"}`);
    return;
  }
  if (mode === "trigger") {
    // EVENT-TRIGGERED RE-ANALYSIS (U4): milestone/crisis arms a trigger; the
    // next tick runs the matching job once, then consumes it.
    const name = process.argv[3];
    if (!name) { console.log("brain: trigger <name> [reason]"); process.exit(1); }
    if ((process.argv[4] || "").toLowerCase() === "off") {
      const q = readJson(QUEUE);
      if (!q || typeof q !== "object" || Array.isArray(q)) { console.log(`brain: trigger '${name}' NOT disarmed — brain_queue.json is unreadable and this door will not reset it`); process.exit(1); }
      q.triggers = q.triggers || {};
      delete q.triggers[name];
      writeAtomic(QUEUE, q);
      console.log(`brain: trigger '${name}' disarmed`);
      return;
    }
    // the OWNER's arming function (Block 1): absent ⇒ create · readable ⇒ merge ·
    // present-but-unreadable ⇒ REFUSE (this door used to reset the whole queue here)
    const armed = armTrigger(name, process.argv.slice(4).join(" ") || null, { now });
    if (!armed) { console.log(`brain: trigger '${name}' NOT armed — brain_queue.json exists but did not parse; refused to overwrite it (the queue is intact)`); process.exit(1); }
    console.log(`brain: trigger '${name}' armed — the next tick fires the matching job once`);
    return;
  }
  // ---- THE GATE'S DOORS (overhaul §5.3, 18 Aug 2026) --------------------------
  // `gate show` — the live verdict for every enabled lane (the same section `status`
  //   prints, alone). `gate wake <lane> [--days N]` — the ONE force: awake for the
  //   lane's window (or N days) and through the F guard for one run; written to
  //   brain_queue.gate.forced (lost-update-safe via mergeTriggers). `gate clear <lane>`
  //   — drop a force. `gate journal [n]` — the last n transitions.
  //   No `gate sleep`: nothing here can be put to sleep by hand — sleep is a VERDICT
  //   on the evidence, and a hand-slept lane would be the kill list wearing a new coat.
  if (mode === "gate") {
    const sub = (process.argv[3] || "show").toLowerCase();
    const q = readJson(QUEUE) || { observed_window_ceiling: null, jobs_run: {} };
    if (sub === "show") {
      const ledger = readLines(LEDGER);
      printGate(gateReport(cfg, gateContext({}, now, ledger, q)), { verbose: process.argv.includes("-v") || process.argv.includes("--verbose") });
      const forced = (q.gate && q.gate.forced) || {};
      const live = Object.entries(forced).filter(([, f]) => f && ((f.until && Date.parse(f.until) > now.getTime()) || f.once));
      if (live.length) console.log(`brain: gate forces live — ${live.map(([l, f]) => `${l} (until ${String(f.until || "-").slice(0, 16)}${f.once ? ", once" : ""}, by ${f.by})`).join(" · ")}`);
      return;
    }
    if (sub === "json") {
      // the machine face — reconcile.mjs (and any reader) gets the LIVE verdicts without
      // importing this file: every enabled lane's state, why, detail, wakes_when,
      // beside its journaled row (if any). Read-only.
      const ledger = readLines(LEDGER);
      const rep = gateReport(cfg, gateContext({}, now, ledger, q));
      console.log(JSON.stringify({
        at: now.toISOString(),
        lanes: rep.rows.map((r) => ({ lane: r.lane, state: r.state, why: { E: r.why.E.ok, C: r.why.C.ok, F: r.why.F.ok, D: r.why.D ? r.why.D.ok : true }, detail: { E: r.why.E.detail, C: r.why.C.detail, F: r.why.F.detail, D: r.why.D ? r.why.D.detail : null }, fold: r.fold || null, wakes_when: r.wakes_when, never_ran: r.never_ran, forced: r.forced || null, journaled: r.journaled ? { state: r.journaled.state, ts: r.journaled.ts } : null })),
        others: rep.others.map((r) => ({ lane: r.lane, state: r.state, ts: r.ts, why: r.why || null, detail: r.detail || null, wakes_when: r.wakes_when || null })),
      }));
      return;
    }
    if (sub === "journal") {
      const n = Math.max(1, Number(process.argv[4]) || 20);
      const rows = gateJournalRows().slice(-n);
      if (!rows.length) console.log("brain: gate journal — no transition recorded yet (the first tick after the gate landed writes the first rows)");
      for (const r of rows) console.log(`  ${String(r.ts).slice(0, 19)}Z ${r.lane.padEnd(18)} → ${r.state.padEnd(6)} E${r.why.E ? "✓" : "✗"} C${r.why.C ? "✓" : "✗"} F${r.why.F ? "✓" : "✗"}${r.state === "asleep" ? ` · wakes when: ${String(r.wakes_when || "").slice(0, 110)}` : ""}`);
      return;
    }
    const lane = process.argv[4];
    if (!lane) { console.log("brain: gate show | gate wake <lane> [--days N] | gate clear <lane> | gate journal [n]"); process.exit(1); }
    if (sub === "wake") {
      const di = process.argv.indexOf("--days");
      // `all` = every enabled lane that is ASLEEP right now (a hand door); a comma list
      // = exactly those lanes (the batch card's `na` carries the lanes that slept together).
      const lanes = lane === "all"
        ? gateReport(cfg, gateContext({}, now, readLines(LEDGER), q)).asleep.map((r) => r.lane)
        : String(lane).split(",").map((s) => s.trim()).filter(Boolean);
      if (!lanes.length) { console.log("brain: gate wake all — nothing is asleep right now"); return; }
      for (const l of lanes) {
        const job = (cfg.jobs || []).find((j) => j.id === l) || {};
        const days = di >= 0 && Number(process.argv[di + 1]) > 0 ? Number(process.argv[di + 1]) : gateConfig(job).window_days;
        const until = new Date(now.getTime() + days * 86400000).toISOString();
        setGateForce(q, l, { until, once: true, by: process.env.ARSENAL_GATE_BY || "cli", now });
        console.log(`brain: gate wake ${l} — forced awake until ${until.slice(0, 16)}Z (${days}d) and through the fail guard for ONE run; the next eligible slot runs it, and a success clears any streak. Sleeping again after that is a verdict on the evidence, not a switch.`);
      }
      writeAtomic(QUEUE, mergeTriggers(readJson(QUEUE), q, [], []));
      return;
    }
    if (sub === "clear") {
      if (q.gate && q.gate.forced && q.gate.forced[lane]) { delete q.gate.forced[lane]; writeAtomic(QUEUE, mergeTriggers(readJson(QUEUE), q, [], [])); console.log(`brain: gate clear ${lane} — force dropped; the live evidence decides again`); }
      else console.log(`brain: gate clear ${lane} — no force on record`);
      return;
    }
    console.log("brain: gate show | gate wake <lane> [--days N] | gate clear <lane> | gate journal [n]");
    process.exit(1);
  }
  // ---- THE CONSUMPTION DOOR (overhaul §5.2) — for organs that do not import this file
  //   node scripts/brain.mjs consumed <job-or-lane> --kind spoken|sat|briefed|carded|opened|pushed --by <organ> [--lane] [--file <p>] [--note "…"]
  if (mode === "consumed") {
    const target = process.argv[3];
    const ki = process.argv.indexOf("--kind"), bi = process.argv.indexOf("--by"), fi = process.argv.indexOf("--file"), ni = process.argv.indexOf("--note");
    const kind = ki >= 0 ? process.argv[ki + 1] : null;
    if (!target || !kind) { console.log("brain: consumed <job-or-lane> --kind <spoken|sat|briefed|carded|opened|pushed> --by <organ> [--lane] [--file <p>] [--note \"…\"]"); process.exit(1); }
    const asLane = process.argv.includes("--lane");
    const r = recordConsumption({ job: asLane ? null : target, lane: asLane ? target : null, kind, by: bi >= 0 ? process.argv[bi + 1] : null, file: fi >= 0 ? process.argv[fi + 1] : null, note: ni >= 0 ? process.argv[ni + 1] : null }, { now });
    console.log(r.ok ? `brain: consumed — ${target} ${kind}${r.row.by ? " via " + r.row.by : ""} (row on consumption.jsonl)` : `brain: consumed REFUSED — ${r.why}`);
    if (!r.ok) process.exit(1);
    return;
  }
  if (mode === "tokens") {
    const ledger = readLines(LEDGER);
    const q = readJson(QUEUE) || {};
    const v = tokenVitals(cfg, ledger, q, now, liveSignal(now));
    writeAtomic(TOKEN_VITALS, v);
    console.log("brain tokens · " + v.summary);
    console.log(`  5h window : ${v.window_5h.used.toLocaleString()} / ${v.window_5h.ceiling.toLocaleString()} (${v.window_5h.pct}% of ceiling · ${v.ceiling_source}) — spend now <= ${v.window_5h.allowed_now.toLocaleString()}`);
    console.log(`  7d week   : ${v.week_7d.used.toLocaleString()} / ${v.week_7d.cap.toLocaleString()} (${v.week_7d.pct}%) — ${v.week_7d.remaining.toLocaleString()} left`);
    // THE DOOR (11 Aug 2026 wiring pass). The receipt's HUMAN reader: this command is the
    // doctor skill's step 0, the one place a person already opens the gauge. The alarm case
    // also rides v.summary above; this line shows the whole count, including the pre-receipt
    // rows, so "unknown" can never quietly read as "fine".
    console.log(`  door      : ${v.door.summary} (last ${v.door.window_hours}h)`);
    return;
  }
  // ---- C2 · THE BOARD (12 Aug 2026) -------------------------------------------
  // "Start every optimisation from this table, refreshed — never from a guess about
  // which organ is expensive." The plan carried the table as PROSE, which is the one
  // thing this repo has proved rots: the numbers in it were true for two days.
  // So the table is a COMMAND. `node scripts/brain.mjs spend [days]`.
  // It reports COST-WEIGHTED spend (the C1 unit — what the governor actually meters)
  // beside raw output, because those two rank the organs DIFFERENTLY and optimising
  // the wrong one is how you make an organ cheaper and useless (C3 principle 10).
  if (mode === "spend") {
    const days = Math.max(1, Number(process.argv[3]) || 7);
    const since = new Date(now.getTime() - days * 24 * 3600000);
    const rows = readLines(LEDGER).filter(r => r && r.ts && new Date(r.ts) >= since && r.engine === "claude");
    const N = (v) => (typeof v === "number" && isFinite(v) ? v : 0);
    const by = new Map();
    for (const r of rows) {
      const k = r.job || "(nojob)";
      if (!by.has(k)) by.set(k, { job: k, n: 0, spend: 0, aware: 0, model: r.model || "?", out: 0, cr: 0, cc: 0, inp: 0, fail: 0 });
      const b = by.get(k);
      b.n++; b.spend += spendOf(r); b.aware += spendOfModelAware(r); b.out += N(r.output_tokens); b.cr += N(r.cache_read_tokens);
      b.cc += N(r.cache_creation_tokens); b.inp += N(r.input_tokens); if (r.ok === false) b.fail++;
      if (r.model) b.model = r.model;
    }
    // C1b (14 Aug): SORTED BY THE MODEL-AWARE COLUMN. Both units are printed —
    // WEIGHTED is what the governor meters, AWARE is what it costs — because the
    // two rank the organs differently and the difference is the whole point.
    const list = [...by.values()].sort((a, b) => b.aware - a.aware);
    const total = list.reduce((a, b) => a + b.spend, 0) || 1;
    const totalAware = list.reduce((a, b) => a + b.aware, 0) || 1;
    const f = (n) => Math.round(n).toLocaleString("en-IN");
    console.log(`\nSPEND BOARD — last ${days}d · ${rows.length} claude rows · ${f(total)} cost-weighted · ${f(totalAware)} model-aware`);
    console.log(`(weights: input 1 · cache_write 1.25 · cache_read 0.1 · output 5 — see brain.mjs SPEND)`);
    console.log(`(model factor: haiku 1 · sonnet 3 · opus 5, list input prices. AWARE% is the true cost share; WEIGHTED is the governor's unit)\n`);
    console.log("JOB".padEnd(24) + "MODEL".padEnd(8) + "N".padStart(5) + "WEIGHTED".padStart(13) + "AWARE".padStart(13) + "A%".padStart(7) + "output".padStart(11) + "cache_rd".padStart(12) + "cache_wr".padStart(12) + "  fail");
    for (const b of list) console.log(
      b.job.slice(0, 24).padEnd(24) + String(b.model).slice(0, 7).padEnd(8) + String(b.n).padStart(5) + f(b.spend).padStart(13) + f(b.aware).padStart(13)
      + ((b.aware / totalAware) * 100).toFixed(1).padStart(7) + f(b.out).padStart(11) + f(b.cr).padStart(12) + f(b.cc).padStart(12)
      + (b.fail ? `  ${b.fail}✗` : ""));
    // THE RANKING THAT MATTERS FOR C3: the same board sorted by generated output is a
    // DIFFERENT order, and the difference IS the optimisation target — an organ high on
    // weighted spend but low on output is paying boot tax, not thinking.
    const byOut = [...list].sort((a, b) => b.out - a.out).slice(0, 5).map(b => b.job).join(" · ");
    const byBlind = [...list].sort((a, b) => b.spend - a.spend).slice(0, 5).map(b => b.job).join(" · ");
    console.log(`\ntop 5 by MODEL-AWARE    : ${list.slice(0, 5).map(b => b.job).join(" · ")}`);
    console.log(`top 5 by WEIGHTED spend : ${byBlind}`);
    console.log(`top 5 by REAL OUTPUT    : ${byOut}`);
    console.log(`→ an organ high on the first list and absent from the second is paying boot tax, not thinking.\n`);
    return;
  }
  if (mode === "status") {
    const ledger = readLines(LEDGER);
    const q = readJson(QUEUE) || {};
    const h = headroom(cfg, ledger, q, now);
    const vm = dugoutMinutesToday(now);
    console.log(`brain: phase=${h.phase} · window ${h.used.toLocaleString()}/${h.cap.toLocaleString()} tokens · week ${weekUsage(ledger, now).toLocaleString()} · ceiling ${q.observed_window_ceiling > cfg.budget.window_capacity_est_tokens ? q.observed_window_ceiling.toLocaleString() + " (observed)" : cfg.budget.window_capacity_est_tokens.toLocaleString() + " (estimate)"} · voice pool ${vm}min today${cfg.dugout_pool && cfg.dugout_pool.enabled && vm >= cfg.dugout_pool.gemini_defer_threshold_min ? " (daytime gemini deferred)" : ""} · eligible now: ${eligibleJobs(cfg, q, now, vm).map(j => j.id).join(", ") || "none"}`);
    // A STALE ARM IS SAID OUT LOUD (11 Aug 2026, dead-wire pass). The gate now
    // ignores an arm from a previous shift, and an ignored thing that reports
    // nothing is how the last one hid for weeks. This is a MACHINE-face line in a
    // command a session/doctor already runs — never a card, never his to remember.
    for (const j of (cfg.jobs || [])) {
      const arm = j.trigger && q.triggers ? q.triggers[j.trigger] : null;
      if (arm && !armFresh(j, arm, now, cfg)) {
        console.log(`brain: trigger '${j.trigger}' is STALE — armed ${arm.ts} (shift ${shiftDay(j, new Date(arm.ts), cfg)}), this shift is ${shiftDay(j, now, cfg)}. It does NOT open ${j.id}; ${j.trigger_fallback_hm ? `the ${j.trigger_fallback_hm} fallback still will` : "nothing will until it is re-armed"}.`);
      }
    }
    // the ok-rate, said out loud (E2E audit 25 Jul 2026): status used to look
    // perfectly healthy through four days of every-call-failed.
    const hh = failureStreak(ledger);
    console.log(hh.dead
      ? `brain: ⚠⚠ DEAD BRAIN — the last ${hh.streak} of ${hh.sampled} calls ALL FAILED. ${hh.hint}`
      : `brain: health OK — ${hh.streak} failure(s) at the tail of the last ${hh.sampled} call(s).`);
    // …and the OTHER silence (10 Aug 2026 wiring audit): "health OK" is computed from
    // boolean-ok rows, so a night where the budget refused every job scores a perfect
    // health line off ZERO calls. Said out loud here, beside it, so the two can never be
    // confused again. Not a verdict and not a tuning suggestion — raising the cap or
    // moving a job's hour is the captain's call, and this only hands him the measurement.
    const stv = starvation(q, now);
    if (stv) console.log(`brain: ⚠ STARVED — ${stv.summary}${stv.age_min !== null ? ` (last refusal ${stv.age_min} min ago)` : ""}. Nothing was spent and no slot was consumed; each of these retries the moment headroom returns.`);
    else console.log("brain: starvation — no budget-refused job on record (brain_queue.budget_starved is empty).");
    if (cfg._config_error) console.log(`brain: ⚠⚠ CONFIG BROKEN (${cfg._config_error}) — running on DEFAULTS with zero jobs.`);

    // ---- THE GATE (overhaul §5, 18 Aug 2026) — who is asleep, why, what wakes it ----
    // Derived LIVE from the ledger, the consumption lane, the cards and today's disk
    // — never a list. Read the journal for history: `brain gate journal`.
    try { printGate(gateReport(cfg, gateContext({}, now, ledger, q)), { verbose: process.argv.includes("-v") || process.argv.includes("--verbose") }); }
    catch (e) { console.log(`brain: THE GATE — could not compute (${String((e && e.message) || e).slice(0, 120)})`); }

    // ---- THE TRUTH LANE (16 Aug 2026, THE TRUTH LAYER BLOCK 1) --------------
    // The judge decides what is TRUE about him — every rep, every axis, every
    // scrimmage — and until today it called claudeGen directly, so it was the ONE
    // lane whose spend nothing here could see. It is on the shared ledger now, and
    // this line is where it becomes visible in the command he already runs.
    // REUSE IS PRINTED BESIDE THE SPEND because it is the whole claim of that
    // block: a judging head is the one shape that repeats inside the 5-minute TTL,
    // and if reuse stays near zero the split bought nothing and should be said so.
    // Measured across the whole organism the day this landed: opus reuse 0.005.
    // Break-even is 0.278 (write 1.25x vs read 0.1x) — below it, caching COSTS.
    {
      const jr = ledger.filter((r) => r && r.job === "gaffer_judge");
      if (!jr.length) {
        console.log("brain: truth lane (gaffer_judge) — no judgement has been made yet. Nothing about him has been graded by the one judge; that is a fact about the study loop, not a fault here.");
      } else {
        const num = (v) => (typeof v === "number" && isFinite(v) ? v : 0);
        const cw = jr.reduce((a, r) => a + num(r.cache_creation_tokens), 0);
        const cr = jr.reduce((a, r) => a + num(r.cache_read_tokens), 0);
        const wt = jr.reduce((a, r) => a + spendOf(r), 0);   // the governor's own unit, never a second one
        const inl = jr.filter((r) => r.head_cached === false).length;
        console.log(`brain: truth lane (gaffer_judge) — ${jr.length} judgement call(s) · ${Math.round(wt).toLocaleString()} weighted · cache write ${cw.toLocaleString()} read ${cr.toLocaleString()} · reuse ${cw ? (cr / cw).toFixed(2) : "n/a"} (break-even 0.278)${inl ? ` · ⚠ ${inl} ran with the head INLINED — this box cannot carry a system prompt, so the standard was sent every time and cached never` : ""}`);
      }
      // OVERHAUL Block 4 §9.1 (18 Aug 2026) — the judge's EXTERNAL CHECK: one sonnet
      // `--allowedTools WebSearch` call per round that cites a fact (gaffer_brain.mjs
      // verifyCitedFacts, job `gaffer_verify`). Same ledger, same rule: a lane whose
      // spend this command cannot see is a lane that can starve unseen.
      const vr = ledger.filter((r) => r && r.job === "gaffer_verify");
      if (vr.length) console.log(`brain: truth lane (gaffer_verify) — ${vr.length} external check(s) · ${Math.round(vr.reduce((a, r) => a + spendOf(r), 0)).toLocaleString()} weighted · ${vr.filter((r) => r.ok === false).length} failed`);
    }

    // ---- SURFACES: where every enabled job's output actually appears (finding #63) ----
    // This IS the address for the four jobs that are designed to be human-read. Their
    // output used to exist only as a file nothing pointed at; it is now one command away,
    // named by path, beside the date of the newest thing each of them wrote.
    const sa = surfaceAudit(cfg);
    console.log(`brain: surfaces ${sa.have}/${sa.need} enabled jobs declare where their output appears${sa.orphans.length ? ` — NO ADDRESS: ${sa.orphans.join(", ")}` : ""}`);
    if (sa.human.length) {
      console.log("brain: for your eyes (nothing reads these — glance and bin):");
      for (const j of sa.human) {
        const d = join(OUT_DIR, j.out || j.id);
        let newest = null;
        try { const fs2 = readdirSync(d).filter(f => f.endsWith(".md")).sort(); newest = fs2.length ? fs2[fs2.length - 1] : null; } catch (e) { swallow("readdirSync(d) unreadable → ignored", e);}
        console.log(`  · ${j.id.padEnd(16)} ${newest ? join("dressing-room", "state", "brain_out", j.out || j.id, newest) : `(brain_out/${j.out || j.id}/ — nothing written yet)`}`);
      }
    }

    // ---- INPUTS: declared vs on disk, per enabled job (finding #64) ----
    const gaps = [];
    for (const j of (cfg.jobs || []).filter(x => x.enabled !== false && (x.inputs || []).length)) {
      const a = gatherInputsAudited(j, now, shiftDay(j, now, cfg));
      if (a.absent.length) gaps.push(`${j.id} ${a.present}/${a.declared}${a.required_absent.length ? ` (REQUIRED absent: ${a.required_absent.join(", ")})` : ""} — absent: ${a.absent.join(", ")}`);
    }
    console.log(gaps.length
      ? `brain: inputs — ${gaps.length} enabled job(s) are running on absent evidence:\n  · ${gaps.join("\n  · ")}`
      : "brain: inputs — every enabled job's declared inputs resolve on disk.");

    // ---- INPUTS, THE HISTORY (10 Aug 2026) — the ledger read BACK -------------
    // The block above answers "is a job short of evidence RIGHT NOW" off today's
    // disk. #64's actual complaint was about the past: 85 runs already billed on
    // absent inputs before anyone noticed. Those rows have been on the ledger ever
    // since and nothing opened them (grep: zero readers outside this file). Now the
    // history stands beside the live read, and a job that has been quietly billing
    // on nulls for weeks is one `brain status` away — the same command /matchday and
    // organism-doctor already run, so it rides an anchor he already hits.
    // E3's windowed-reader law: this ledger rolls at 2MB keeping one .1 generation
    // (the roll lives in tick), so a HISTORY query must open .1 first. The reads
    // above are 5h/7d windows and cannot reach across a roll, so they stay as-is.
    const ah = absentEvidenceHistory(readLines(LEDGER + ".1").concat(ledger));
    const ahTail = `${ah.accounted.toLocaleString()} accounted row(s)`
      + (ah.no_inputs ? ` · ${ah.no_inputs.toLocaleString()} declared no inputs` : "")
      + (ah.unaccounted ? ` · ${ah.unaccounted.toLocaleString()} row(s) predate the accounting and are UNCOUNTED` : "");
    console.log(ah.jobs.length
      ? `brain: inputs history — ${ah.jobs.length} job(s) have BILLED on absent evidence (${ahTail}):\n  · `
        + ah.jobs.map(j => `${j.job} — ${j.runs_absent}/${j.runs} run(s) across ${j.nights} day(s), last ${j.last_absent_day} — ${j.absent_names.join(", ")}`).join("\n  · ")
      : `brain: inputs history — no accounted run has ever billed on an absent input (${ahTail}).`);

    // ---- THE CUT, THE HISTORY (11 Aug 2026) — present is not the same as whole ----
    // The line above only ever asked about MISSING files. A job whose inputs all
    // resolve and then lose 183 of 200 rows to the prompt budget reads 4/4 present up
    // there and is a stump in fact. runJob has stamped that on the row since 10 Aug and
    // NOTHING read it — this is the read. Same ledger, same .1-roll-aware concat, same
    // anchor he already hits (/matchday and organism-doctor both run `brain status`),
    // so it costs one more line and no new command to remember.
    const ch = clippedEvidenceHistory(readLines(LEDGER + ".1").concat(ledger));
    const chTail = `${ch.accounted.toLocaleString()} measured row(s)`
      + (ch.never_clipped ? ` · ${ch.never_clipped.toLocaleString()} read their inputs WHOLE` : "")
      + (ch.unaccounted ? ` · ${ch.unaccounted.toLocaleString()} row(s) predate the elision accounting and are UNCOUNTED` : "")
      // the door lane's own honesty clause (11 Aug 2026): rows measured for the clipper
      // but written before the door was counted are UNMEASURED on that lane, not clean.
      + (ch.door_unmeasured ? ` · ${ch.door_unmeasured.toLocaleString()} of those predate the DOOR accounting (clipper measured, tail not)` : "");
    console.log(ch.jobs.length
      ? `brain: inputs elision — ${ch.jobs.length} job(s) have BILLED on half-eaten inputs (${chTail}):\n  · `
        + ch.jobs.map(j => `${j.job} — ${j.runs_clipped}/${j.runs} run(s) across ${j.nights} day(s), last ${j.last_clipped_day} — ${j.rows_unseen.toLocaleString()} row(s) never reached the model (${j.rows_dropped.toLocaleString()} clipper + ${j.door_dropped.toLocaleString()} door tail; worst single run ${j.worst_run.toLocaleString()})`).join("\n  · ")
      : `brain: inputs elision — no measured run has been cut on the way in (${chTail}).`);

    // ---- PULSE: the measurement, never a verdict (findings #66/#67) ----
    const pc = pulseConfig(cfg);
    const pcost = pulseCostToday(ledger, now, pc.daily_token_budget);
    console.log(pc.enabled
      ? `brain: pulse window ${pcost.tokens.toLocaleString()}/${pc.daily_token_budget.toLocaleString()} tok today (${pcost.pct ?? 0}%) · ${pcost.n} pulse(s) · measured cost ${pcost.mean === null ? "NOT MEASURED YET (0 pulses today)" : pcost.mean.toLocaleString() + " tok/pulse"} · every ${pc.every_n_beats} beat(s)`
      : "brain: pulse DISABLED in brain_config — zero calls, zero meter, and no measurement is accruing.");
    return;
  }
  if (mode === "run") {
    const id = process.argv[3];
    const job = cfg.jobs.find(j => j.id === id);
    if (!job) { console.log(`brain: no job ${id}`); process.exit(1); }
    if (cfg.guards.refuse_if_api_key_env && process.env.ANTHROPIC_API_KEY) { console.log("brain: REFUSING — ANTHROPIC_API_KEY set."); process.exit(1); }
    // E2E audit 25 Jul 2026: `run` used to bypass the tick lock AND never credit
    // jobs_run — so `brain run formation_read` at 08:40 fired the one sanctioned
    // sheet push, and the 08:45 scheduled tick, seeing an empty slot, ran it and
    // pushed AGAIN (double Opus spend, two sheets on his phone). A manual run is
    // still a run: it takes the lock and it spends the slot.
    const out = await withTickLock(async () => {
      const q = readJson(QUEUE) || { observed_window_ceiling: null, jobs_run: {} };
      const sd = shiftDay(job, now, cfg);
      const already = ((q.jobs_run && q.jobs_run[sd]) || {})[job.id] || 0;
      if (already >= (job.max_per_day || 1)) console.warn(`brain: ⚠ ${job.id} already ran ${already}× this shift (${sd}) — running again because you asked; it will spend again.`);
      const { usage, note, inputs_absent, inputs_declared, inputs_absent_names, inputs_clipped, inputs_rows_dropped, inputs_rows_door_dropped, inputs_door_names } = await runJob(job, cfg, deps);
      if (!deps.dry) {
        appendFileSync(LEDGER, JSON.stringify({ ts: now.toISOString(), job: job.id, engine: job.engine || "claude", model: job.model || null, input_tokens: usage.input_tokens ?? null, output_tokens: usage.output_tokens ?? null, cache_creation_tokens: usage.cache_creation_tokens ?? null, cache_read_tokens: usage.cache_read_tokens ?? null, total_tokens: usage.total_tokens || 0, duration_ms: usage.duration_ms || 0, ok: usage.ok, error: usage.error || null, limit_hit: !!usage.limit_hit, manual: true, note: note || null,
          split: usage.split || null,   // Phase 1 — and the manual row is where the split's own receipt is READ, so it cannot be the row that drops it
          // same input accounting as the scheduled path (finding #64) — a manual run must
          // not be the one place the evidence base goes unrecorded.
          inputs_present: typeof inputs_declared === "number" ? inputs_declared - inputs_absent : null,
          inputs_declared: typeof inputs_declared === "number" ? inputs_declared : null,
          inputs_absent: typeof inputs_absent === "number" ? inputs_absent : null,
          inputs_absent_names: (inputs_absent_names && inputs_absent_names.length) ? inputs_absent_names : null,
          // …and the ELISION pair with it (11 Aug 2026). runJob has returned these since
          // 10 Aug and this row literal dropped both on the floor — the same "one place
          // the accounting goes unrecorded" the comment above was written to prevent,
          // reopened one field-pair later. It matters more here than on the tick: a
          // manual `brain run` is what you fire while DEBUGGING a job that read a stump,
          // and it was the one path that refused to write down what it read.
          inputs_clipped: inputs_clipped ?? null,
          inputs_rows_dropped: inputs_rows_dropped ?? null,
          // …and the DOOR lane with it (11 Aug 2026), for the same reason the pair above
          // was added here one day earlier: a manual `brain run` is the path you fire
          // while debugging a job that read a stump, so it must not be the one row that
          // forgets which of the two cuts ate the evidence.
          inputs_rows_door_dropped: inputs_rows_door_dropped ?? null,
          inputs_door_names: (inputs_door_names && inputs_door_names.length) ? inputs_door_names : null }) + "\n");
        if (usage.ok) { recordJobRun(q, job, now, cfg); writeAtomic(QUEUE, mergeTriggers(readJson(QUEUE), q, [])); }
        else if (!usage.limit_hit) { recordJobFail(q, job, now, cfg); writeAtomic(QUEUE, mergeTriggers(readJson(QUEUE), q, [])); }
      }
      console.log(`brain: ${job.id} ${usage.ok ? "OK" : "FAILED"} (${(usage.total_tokens || 0).toLocaleString()} tok) ${note}`);
      return { ran: [], refused: false };
    });
    if (out && out.skipped) console.log(`brain: ${out.skipped} — 'run' skipped so it can't double-run the job`);
    return;
  }
  if (mode === "pulse") {
    // ONE haiku pulse (for a 60-90s schtasks, or manual measurement). Self-gated +
    // metered; safe to call as often as you like (engaged/cap/headroom rails hold).
    const r = await runPulse(cfg, deps);
    // the receipt prints WITH the verdict (11 Aug 2026): "ESCALATED" alone was the lie —
    // it told you the pulse decided, never that the thalamus door took it.
    console.log(r.pulsed
      ? `brain: pulse — ${r.escalated ? "ESCALATED (" + r.why + ")" + (r.posted ? " → delivered" : " → ⚠ NOT DELIVERED (thalamus door refused/down; no resync arm)") : "hold"} · ${(r.tokens || 0).toLocaleString()} tok · ${r.count}/${r.cap} calls · ${(r.tokens_today || 0).toLocaleString()}/${(r.token_budget || 0).toLocaleString()} tok measurement window`
      : `brain: pulse skipped — ${r.skipped}`);
    return;
  }
  if (mode === "daemon" || mode === "--daemon") {
    // THE RESIDENT PACEMAKER (P3) — the old 15-30min cron, folded into brain.mjs as a
    // ~60-90s poll. Each beat: compute the burn pace, run a tick (which self-gates every
    // job on headroom), report. It NEVER writes wake_queue — the thalamus stays the SOLE
    // wake authority (Layer 4 law). SIGINT/SIGTERM = a clean stop between beats.
    // DAEMON SINGLETON (E2E audit 25 Jul 2026). Observed live: FOUR resident
    // daemons alive at once (spawned 21, 22, 23 and 25 Jul) — every schedule fire
    // or manual start added one and none ever retired. withTickLock stopped them
    // double-SPENDING, but nothing stopped the processes accumulating, and each
    // one polls forever. An exclusive port bind held for the PROCESS lifetime
    // makes starting the daemon idempotent: the second instance exits at once.
    // Port registry: 4111 turnstile · 4112 cortex · 4113 thalamus · 4114 dugout
    // · 4115 brain tick-lock · 4116 brain daemon-singleton.
    const { createServer: createSingleton } = await import("node:http");
    const resident = createSingleton(() => {});
    const isFirst = await new Promise((res) => { resident.once("error", () => res(false)); resident.listen(4116, "127.0.0.1", () => res(true)); });
    if (!isFirst) { console.log("brain: --daemon ALREADY RESIDENT (:4116 held) — this instance exits instead of piling up."); return; }
    const pollMs = (cfg.daemon && cfg.daemon.poll_ms) || 75000;
    let stop = false, beats = 0, lastPulseAt = 0;   // G5 — the pulse's seconds-pinned clock
    const onSig = () => { stop = true; };
    process.on("SIGINT", onSig); process.on("SIGTERM", onSig);
    console.log(`brain: --daemon up (poll ~${Math.round(pollMs / 1000)}s) — the resident pacer. It never writes wake_queue. Ctrl-C to stop.`);
    // STALE-CODE RETIREMENT (see sourceGraph/staleSources above) — measured ONCE
    // at boot, checked every beat. The console this prints to is not a void: the
    // VBS cloak redirects it to scripts/brain.log (audit finding #10).
    const SELF_SRC = fileURLToPath(import.meta.url);
    const BOOT_MS = Date.now() - process.uptime() * 1000;
    const SOURCES = sourceGraph(SELF_SRC, (p) => readFileSync(p, "utf8"));
    console.log(`brain: --daemon booted ${new Date(BOOT_MS).toISOString()} · watching ${SOURCES.length} of its own source file(s) for edits after that instant — a resident that outlives its own code runs the old brain all night (the KAAM 1 scar, 10 Aug 2026).`);
    // THE PACEMAKER RE-READS ITS OWN SWITCH (audit #108, 6 Aug 2026).
    // `cfg` was loaded ONCE in main() and this loop reused it forever, so a resident
    // daemon kept obeying whatever brain_config.json said at boot. Measured live: PID
    // 21080 (started 05-08 07:06) was still printing "PAUSED — 19/23 enabled LLM jobs
    // held" at beat 394 while the file on disk had read `paused: false` since 04:08
    // that morning. The 30-min BrainTick spawns fresh and did honour the change, so
    // the harm looked one-directional and cosmetic — but the DANGEROUS direction is the
    // reverse: setting `paused: true` to stop a token bleed would not stop this loop,
    // and it is the process holding the plan's credit card. A pause switch that a
    // running process cannot see is not a pause switch.
    // Re-read per beat, never trusting a partial file: loadConfig() returning null or
    // throwing (an atomic rename caught mid-flight) keeps the LAST GOOD config rather
    // than crashing the pacer or silently falling back to defaults.
    let liveCfg = cfg;
    while (!stop) {
      // Checked BEFORE the beat spends anything, so an out-of-date resident never
      // runs one more job with code the repo has already moved past.
      const stale = staleSources(SOURCES, BOOT_MS, (p) => statSync(p).mtimeMs);
      if (stale.length) {
        console.log(`brain: --daemon RETIRING — booted ${new Date(BOOT_MS).toISOString()}, and ${stale.length} of its own source file(s) changed AFTER that: ${stale.map((s) => `${basename(s.path)} @ ${new Date(s.mtime_ms).toISOString()}`).join(" · ")}. An ESM process cannot reload its code, so staying up means running the OLD brain. Releasing :4116 — daemon_watchdog.mjs relaunches this daemon on the new code within its next pass (≤10 min), and ArsenalFC-BrainTick covers the 30-min lane meanwhile.`);
        break;
      }
      const bnow = new Date();
      const bdeps = buildDeps(bnow);   // --dry ⇒ the beat calls NOTHING real (E2E audit 25 Jul 2026)
      try {
        // `if (fresh)` was DEAD CODE (verify pass, 6 Aug 2026): loadConfig() never
        // returns null and never throws — on a parse error it returns a DEFAULTS
        // deep-copy tagged `_config_error`. So an unreadable brain_config.json
        // (an atomic rename caught mid-flight) would have swapped the live pacer to
        // DEFAULTS: jobs = 0 and `paused` undefined — silently DROPPING a deliberate
        // pause, the exact direction the comment above swears this prevents.
        try { const fresh = loadConfig(); if (fresh && !fresh._config_error) liveCfg = fresh; } catch { /* keep last good */ }
        const cfg = liveCfg;           // shadows the boot config for the rest of this beat
        const hr = headroom(cfg, readLines(LEDGER), readJson(QUEUE) || {}, bnow, bdeps.signals);
        const pace = targetBurn(cfg, hr, bnow);
        const t = await withTickLock(() => tick(cfg, bdeps));
        if (t.refused) { console.log("brain: --daemon halting — ANTHROPIC_API_KEY refusal. Unset it and restart."); break; }
        if (t.skipped) {
          console.log(`brain: beat skipped — ${t.skipped}`);   // another tick owns the window this beat
        } else {
          beats++;
          const done = t.ran.filter(r => r.ledgerRow && r.ledgerRow.ok).length;
          // THE REASON, IN THE LOG (10 Aug 2026 wiring audit). This line printed only
          // "0/1 ran" — identical for a starved job, a failed job and a rested one — into
          // a window the captain cannot see (hidden_run.vbs). Measured: 1,135 such beats.
          // The skip reasons were already on every `ran` entry; they were simply not read.
          const skips = t.ran.filter(r => r.skipped).map(r => `${r.job}: ${r.skipped}`).join(" · ");
          // THE GATE (18 Aug 2026): asleep lanes are named on the beat line too — a lane
          // that sleeps by verdict must never be mistaken for a lane that never came up.
          const gated = (t.gated || []).length ? ` · gate:asleep ${t.gated.map(g => `${g.job}(${g.why})`).join(", ")}` : "";
          console.log(`brain: beat ${beats} [${pace.phase} · pace ~${pace.pace_tok_per_min.toLocaleString()} tok/min · ${done}/${t.ran.length} ran]${skips ? ` — ${skips}` : ""}${gated}`);
          // the HAIKU PULSE rides every Nth beat — self-gated (engaged + cap + headroom)
          // and metered every fire; skipped when another tick owns the beat (no double-pulse).
          // FREQUENCY HALVED (2 Aug 2026 audit, #67): it used to fire on EVERY beat, so a
          // ~75s poll meant a pulse a minute and a quarter all day, and haiku_pulse became
          // 2,762,471 tok = 32.4% of the rolling week — the single largest consumer of the
          // plan. `every_n_beats` (default 2) doubles the spacing. The afferent tail moves
          // far slower than 75 seconds, so this loses observations, not signal — and the
          // measured tok/pulse now prints beside it so the next value comes off the ledger.
          const pcfg = pulseConfig(cfg);
          // G5 — the gate is SECONDS-pinned (min_spacing_s), never beat-counted:
          // the beat is just a clock now, and a faster pacer cannot speed the pulse.
          if (pcfg.enabled && (Date.now() - lastPulseAt) >= pcfg.min_spacing_s * 1000) {
            const pr = await runPulse(cfg, bdeps);
            if (pr.pulsed) {
              lastPulseAt = Date.now();
              // same receipt as `brain pulse` — the daemon's log is the ONLY human-facing
              // trace a resident pulse leaves, so an undelivered escalation must say so here.
              console.log(`brain: pulse ${pr.escalated ? "ESCALATED" + (pr.posted ? " → delivered" : " → ⚠ NOT DELIVERED (thalamus door)") : "hold"} (${(pr.tokens || 0).toLocaleString()} tok · ${pr.count}/${pr.cap} calls · ${(pr.tokens_today || 0).toLocaleString()}/${(pr.token_budget || 0).toLocaleString()} tok window)`);
            }
          }
        }
      } catch (e) {
        console.log(`brain: --daemon beat error (continuing): ${String((e && e.message) || e).slice(0, 160)}`);
      }
      await new Promise((res) => { const step = 500; let el = 0; const iv = setInterval(() => { el += step; if (stop || el >= pollMs) { clearInterval(iv); res(); } }, step); });
    }
    try { resident.close(); } catch {}                 // release the singleton for the next start
    console.log(`brain: --daemon stopped after ${beats} beat(s).`);
    return;
  }

  // tick (single-instance guarded — won't run concurrently with the resident daemon)
  const { ran, refused, skipped, gated } = await withTickLock(() => tick(cfg, deps));
  if (refused) process.exit(1);
  if (skipped) { console.log(`brain: ${skipped} — skipped this tick`); return; }
  const done = ran.filter(r => r.ledgerRow && r.ledgerRow.ok).length;
  console.log(`brain: tick — ${done} job(s) ran, ${ran.length - done} skipped/failed [${ran.map(r => r.job + (r.skipped ? ":skip" : "")).join(", ") || "idle"}]${(gated || []).length ? ` · gate:asleep [${gated.map(g => `${g.job}(${g.why})`).join(", ")}]` : ""} → ${LEDGER}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { headroom, windowUsage, weekUsage, eligibleJobs, shiftDay, armFresh, validateOutput, noNewNumbers, bannedPhraseCheck, tick, runJob, loadConfig, sliceSheet, resolveNtfyTopic, pushNtfy, buildFingerprint, buildAnalysisPrompt, serveDate, teamtalkLine, dugoutMinutesToday, tokenVitals, reserveNow, blendCeiling, maxThinkingFor, targetBurn, runPulse, pulseConfig, pulsesToday, liveSignal,
  // E2E audit 25 Jul 2026 — new seams, exported so the doctor/selftest can see them
  usageTotal, failureStreak, gatherInputs, recordJobRun, recordJobFail, attemptsOn, mergeTriggers, geminiCommand, lockVerdict, buildDeps, SHEET_PUSH_TITLE,
  // 10 Aug 2026 wiring audit — the starved night's two halves (write + read), exported
  // so the suite can hold the wire from tick() all the way to token_vitals.json.
  recordBudgetBlock, starvation,
  // 1 Aug 2026 — the absence utterance + the shared window map, exported so the
  // selftest can hold them to the same badge/boundary rules as the other two.
  SHEET_ABSENCE_TITLE, jobWindows, mouthMaySpeak, pulseTokensToday, pulseFailStreak,
  // 2 Aug 2026 audit — the new seams. allowedNumbers/noNewNumbers now delegate to
  // scripts/validators.mjs; the FROZEN pre-audit engines are exported too so the
  // selftest can hold them as a live regression witness (nothing else may call them).
  allowedNumbers, allowedNumbersLegacy, noNewNumbersLegacy, hypeGuardOn,
  gatherInputsAudited, normalizeInputs, jobSurface, surfaceAudit,
  readLinesTail, archiveSiblings, pulseTokens, conceptVocabulary, PULSE_STOPWORDS,
  pulseCostToday, minedAnchors, outDate,
  // THE GATE (overhaul §5, 18 Aug 2026) — the seams, exported so the selftest, the
  // reconciler, the watchman and the two other gated organs can hold the wire.
  gateContext, gateCardArgs };
