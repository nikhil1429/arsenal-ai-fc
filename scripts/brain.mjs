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
// ============================================================================

import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync, appendFileSync, openSync, readSync, closeSync, statSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
// H3 (10 Aug 2026): the model's own doors — the sanitizer is the sibling's
// only entry, the formatter/guard pair is the night coach's only read.
import { sanitizeModelMine, testedEdgeLines, FACTS } from "./nikhil_model.mjs";
// H5 (10 Aug 2026): the dreams sanitizer resolves concepts through the same
// alias machinery the scoreboard already carries (capture.mjs's pattern).
import { loadAliasMap, repLocalDay } from "./scoreboard.mjs";
import { join, dirname, basename } from "node:path";
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
  try { appendFileSync(MOUTH_LOG, JSON.stringify({ ts: new Date().toISOString(), kind, sent: !!(pushed && pushed.sent), why: (pushed && pushed.why) || null }) + "\n"); } catch { }
}
const QUEUE     = join(STATE_DIR, "brain_queue.json");
const TOKEN_VITALS = join(STATE_DIR, "token_vitals.json");
const OUT_DIR   = join(STATE_DIR, "brain_out");
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
const readJson = (p) => { try { if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")); } catch {} return null; };
const readLines = (p) => {
  const out = [];
  try { if (existsSync(p)) for (const l of readFileSync(p, "utf8").split("\n")) { if (!l.trim()) continue; try { out.push(JSON.parse(l)); } catch {} } } catch {}
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
  } catch { return null; } finally { if (fd !== null) { try { closeSync(fd); } catch {} } }
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
  } catch { return []; }
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
// BUDGET GOVERNOR (pure)
// ---------------------------------------------------------------------------
function windowUsage(ledger, now, hours) {
  const end = now.getTime();
  const cutoff = end - hours * 3600000;
  // E2E audit 25 Jul 2026: the window had NO upper bound, so any row stamped in
  // the future counted as spent-right-now — a clock skew or a replayed ledger
  // could pin the governor at 100% forever. A window has two edges.
  return ledger.filter(l => { const t = new Date(l.ts).getTime(); return l.engine === "claude" && t >= cutoff && t <= end; })
    .reduce((a, l) => a + (l.total_tokens || 0), 0);
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
  const today = localDate(now);
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
  const today = localDate(now);
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
  const tail = (deps.tail || readLines(join(STATE_DIR, "afferent.jsonl")))
    .filter(a => a && a.text && a.modality !== "pulse")
    .slice(-pc.tail_n)
    .map(a => `[${a.modality}] ${String(a.text).slice(0, 160)}`);
  if (!tail.length) return { pulsed: false, skipped: "empty tail" };
  const prompt = `You are the continuous PULSE of a personal learning brain — a cheap always-on watch deciding whether the EXPENSIVE deep brain should look at a moment the fast deterministic reflex may have missed. Recent moments (newest last):\n${tail.map((t, i) => `${i + 1}. ${t}`).join("\n")}\n\nAbove routine chat / logging / app-switching, is ANY of these a genuinely reasoning-hard moment — a conceptual confusion, a contradiction, a strategy question worth deep thought? Reply STRICT JSON, no prose: {"escalate": true|false, "which": "<the moment text or empty>", "why": "<=12 words>"}`;
  const exec = deps.exec || claudeExec;
  const t0 = Date.now();
  const r = deps.mockCall ? deps.mockCall(prompt) : exec(prompt, pc.model, [], pc.timeout_ms);
  const dur = Date.now() - t0;
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
  const row = { ts: now.toISOString(), job: "haiku_pulse", engine: "claude", model: pc.model, input_tokens: r.input_tokens ?? null, output_tokens: r.output_tokens ?? null, cache_creation_tokens: r.cache_creation_tokens ?? null, cache_read_tokens: r.cache_read_tokens ?? null, total_tokens: r.total_tokens || 0, duration_ms: dur, ok: !!r.ok, error: r.error || null, limit_hit: !!r.limit_hit, escalated: !!(verdict.escalate && r.ok) };
  (deps.appendLedger || ((o) => { if (!deps.dry) appendFileSync(LEDGER, JSON.stringify(o) + "\n"); }))(row);
  // ESCALATE by POSTing an afferent — the thalamus decides + enqueues. NEVER wake_queue.
  let posted = false;
  if (verdict.escalate && r.ok) {
    // carry the flagged concept as concept_tokens (so the thalamus can score novelty on it)
    // + a PER-CONCEPT event_key (distinct escalations don't collapse into one habituation
    // bucket). The pulse only NAMES the moment; the thalamus stays the sole authority on
    // whether it crosses the wake threshold — that threshold is a salience-config/tuning
    // matter (part of the multi-day pulse calibration), not something the pulse forces.
    // stopword-filtered, concept-preferring (audit #3) — the old form was
    // `.split().filter(w => w.length > 3).slice(0,4)` and produced `pulse:isko`.
    const tokens = pulseTokens(verdict.which, deps.vocab || conceptVocabulary());
    posted = await (deps.post || defaultAfferentPost)({ modality: "pulse", source: "haiku-pulse", text: `pulse flagged (reasoning-hard): ${verdict.which}${verdict.why ? " — " + verdict.why : ""}`, concept_tokens: tokens, event_key: `pulse:${tokens[0] || "moment"}`, ts: now.toISOString() });
  }
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
  } catch {}
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
function failureStreak(ledger, n = 25) {
  const rows = (ledger || []).filter(r => r && r.engine !== "gemini" && typeof r.ok === "boolean").slice(-n);
  let streak = 0;
  for (let i = rows.length - 1; i >= 0; i--) { if (rows[i].ok) break; streak++; }
  const authRe = /not logged in|please run \/login|invalid api key|authenticat|unauthorized/i;
  const dead = streak >= 5;
  const auth = dead && rows.slice(-streak).some(r => authRe.test(String(r.error || "")));
  return {
    streak, sampled: rows.length, dead, not_logged_in: auth,
    hint: !dead ? null : auth
      ? "the claude CLI is NOT LOGGED IN for the account this daemon runs under — open a terminal AS THAT USER, run `claude`, then /login."
      : "every recent brain call failed — check the last error in brain_ledger.jsonl.",
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
  const pct = (a, b) => b > 0 ? Math.round((a / b) * 1000) / 10 : 0;
  return {
    ts: now.toISOString(), phase: h.phase,
    window_5h: { used: win, ceiling, pct: pct(win, ceiling), cap_now: h.cap, allowed_now: h.allowed },
    week_7d: { used: wk, cap: wkCap, pct: pct(wk, wkCap), remaining: Math.max(0, wkCap - wk) },
    ceiling_source: (queueState && queueState.observed_window_ceiling) ? "observed" : "estimate",
    // E2E audit 25 Jul 2026: the fuel gauge showed a brain burning fuel while it
    // was in fact dead (every call failing). Ship the ok-rate WITH the fuel.
    health: failureStreak(ledger),
    summary: `${h.phase} · 5h ${win.toLocaleString()}/${ceiling.toLocaleString()} (${pct(win, ceiling)}%) · week ${wk.toLocaleString()}/${wkCap.toLocaleString()} (${pct(wk, wkCap)}%) · headroom now ${h.allowed.toLocaleString()}`,
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
  return readLines(file).filter(l => localDayOf(l.ts) === localDate(now)).reduce((a, l) => a + (l.minutes || 0), 0);
}

// which jobs are eligible now?
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
// THE OVERNIGHT SHIFT IS ONE SHIFT even across midnight: its ledger day is the
// evening it STARTED. Calendar-keying made every overnight job eligible AGAIN at
// 00:00 — it re-ran with TODAY-tokened inputs now pointing at the empty new day
// and overwrote the good artifacts (the KAL-rich morning talk among them).
function shiftDay(job, now, cfg) {
  if (!job || job.window !== "overnight") return localDate(now);
  const endH = Number(String((cfg.overnight && cfg.overnight.end) || "07:30").split(":")[0]);
  return now.getHours() <= endH ? localDate(new Date(now.getTime() - 86400000)) : localDate(now);
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
// hoisted out of eligibleJobs (1 Aug 2026) so the absence alarm in tick() reads the
// SAME window boundary the eligibility check uses — a duplicated "12:00" literal would
// drift the moment either side moved, and the alarm exists precisely to be trustworthy.
const jobWindows = (cfg) => ({ morning: ["07:30", "12:00"], midday: ["12:00", "17:00"], evening: ["17:00", "22:00"], overnight: [cfg.overnight.start, cfg.overnight.end], any: ["00:00", "24:00"] });
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
    if (j.trigger && !(queueState && queueState.triggers && queueState.triggers[j.trigger])
        && !(j.trigger_fallback_hm && nowHM >= j.trigger_fallback_hm)) return false;
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

function claudeExec(prompt, model, extraArgs = [], timeoutMs = 300000, lean = null, thinkTokens = null) {
  if (lean === null) lean = leanEnabled();
  const t0 = Date.now();
  try {
    const stdout = execFileSync("claude", ["-p", "--output-format", "json", "--model", model || "sonnet",
      ...(lean ? LEAN_ARGS : []), ...(Array.isArray(extraArgs) ? extraArgs : [])],
      // G4 — extended thinking via env, same mechanism the cortex has always used
      { input: prompt, timeout: timeoutMs, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"], windowsHide: true, env: { ...process.env, ARSENAL_ORGAN: "1", ...(Number.isFinite(thinkTokens) && thinkTokens > 0 ? { MAX_THINKING_TOKENS: String(thinkTokens) } : {}) } });
    let text = stdout, inTok = null, outTok = null, cacheCreate = null, cacheRead = null, isErr = false;
    try {
      const j = JSON.parse(stdout);
      text = j.result !== undefined ? String(j.result) : stdout;
      isErr = j.is_error === true;
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
    const total = isErr ? measured : (measured || Math.ceil((prompt.length + text.length) / 4));
    const limit_hit = isErr && LIMIT_RE.test(text);
    return { ok: !isErr, text, input_tokens: inTok, output_tokens: outTok, cache_creation_tokens: cacheCreate, cache_read_tokens: cacheRead, total_tokens: total, duration_ms: Date.now() - t0, limit_hit, error: isErr ? text.slice(0, 200) : null };
  } catch (e) {
    const msg = String((e.stderr || "") + (e.stdout || "") + e.message);
    return { ok: false, text: null, input_tokens: null, output_tokens: null, cache_creation_tokens: null, cache_read_tokens: null, total_tokens: 0,   // never spawned/never answered ⇒ zero spend
      duration_ms: Date.now() - t0, limit_hit: LIMIT_RE.test(msg), error: msg.slice(0, 200) };
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
  } catch { }
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
const clip = (s, n = 14000) => { const t = typeof s === "string" ? s : JSON.stringify(s, null, 1); return t.length > n ? t.slice(0, n) + "\n…[clipped]" : t; };

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
  if (calibration && typeof calibration.overconfidence_rate === "number")
    parts.push(`CALIBRATION: overconfidence P(wrong|knew)=${calibration.overconfidence_rate}; trend ${calibration.trend || "—"}.`);
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
    parts.push(
      `LAST CLOSED SESSION: ${lc.concept}${lc.ended_at ? ` (ended ${String(lc.ended_at).slice(0, 10)})` : ""}`
      + ` — axes closed ${done}, untouched ${untouched}`
      + ((lc.axes_deferred || []).length ? `, deferred ${lc.axes_deferred.join("")}` : "")
      + `; ${(lc.steps_ran || []).length}/${(lc.steps_ran || []).length + missed} steps ran.`
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
  } catch { return null; }
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
  const day = dateStr || localDate(now);
  const absent = [], required_absent = [];
  for (const decl of normalizeInputs(job)) {
    const name = decl.path.replace(/TODAY/g, day);   // date-tokened paths (e.g. dugout transcripts)
    const p = join(STATE_DIR, name);
    const there = existsSync(p);
    // TAIL READ (audit #51): three jobs list presence_log.jsonl, which is unbounded and
    // rolls monthly. Only the last 200 rows were ever used; now only those are read, and
    // a rolled file resolves through its archives instead of reading as empty.
    if (name.endsWith(".jsonl")) inputs[name] = readLinesTail(p, 200);
    else if (name.endsWith(".md") || name.endsWith(".html")) inputs[name] = there ? readFileSync(p, "utf8").slice(-20000) : null;
    else inputs[name] = readJson(p);
    // "absent" is about the FILE, not about emptiness — an empty log is a measured zero
    // and must never be reported as a missing input (that is the honesty law running
    // the other way).
    if (!there) { absent.push(name); if (decl.required) required_absent.push(name); }
  }
  const declared = Object.keys(inputs).length;
  return { inputs, declared, absent, required_absent, present: declared - absent.length };
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
function nightCoachAfferents(dayStr, dir = STATE_DIR) {
  // LADDER F10 (9 Aug 2026): the coach HEARS THE VOICE. The filter carried only
  // the four typed/gemini lanes, so his SPOKEN confusion never reached the
  // misconception map. Voice rows carry no `source` at all (thalamus_config
  // _self_sources_doc #1: a voice modality IS his provenance), so modality
  // "voice" with no source = him; `dugout-gaffer-teaching` (F4) is the coach's
  // spoken half, deny-listed as self but exactly the teaching evidence this
  // reader wants.
  const LANES = new Set(["claude-code", "claude-code-teaching", "gemini-study", "gemini-study-teaching", "dugout-gaffer-teaching"]);
  let rows = [];
  try {
    rows = readLinesTail(join(dir, "afferent.jsonl"), 4000)
      .filter(a => a && a.text && (LANES.has(a.source) || (a.modality === "voice" && !a.source)))
      .filter(a => { const t = new Date(a.ts || 0); return !isNaN(t.getTime()) && localDate(t) === dayStr; })
      .map(a => ({ t: String(a.ts).slice(11, 16), who: a.source || "voice(him)", text: String(a.text).slice(0, 600) }));
  } catch { }
  const kept = rows.slice(-120);
  return {
    study_day: dayStr, turns_total: rows.length, turns_shown: kept.length,
    note: rows.length > kept.length ? "older turns trimmed — turns_total is the truth, the tail is the sample" : "the complete day",
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

LAWS: Hinglish body, technical words stay English. Evidence only — every claim traceable to the inputs; a thin day = say less, never invent. No dates, deadlines or countdowns in any teaching line. NEVER these phrases: ${(banned || []).join(", ")}. ≤ 80 lines before the json block.`;
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

const SIBLING_PARSERS = {
  night_coach: (text) => parseNightCoachJson(text),
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
export function laneRestable(job, dir = OUT_DIR, nowMs = Date.now()) {
  try {
    const lane = join(dir, job.out || job.id);
    let newest = 0;
    for (const f of readdirSync(lane)) {
      try { const m = statSync(join(lane, f)).mtimeMs; if (m > newest) newest = m; } catch { }
    }
    return newest > 0 && (nowMs - newest) < 24 * 3600000;
  } catch { return false; }   // no lane dir = never produced = never restable
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
    } catch { }
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
  } catch { }
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
    } catch { }
  }
  // the shift = 22:00 of the shift day → now (the diary runs inside the shift)
  const start = new Date(`${shiftDayStr}T22:00:00+05:30`).getTime();
  const shift = rows.filter((r) => { const t = new Date(r.ts).getTime(); return Number.isFinite(t) && t >= start; });
  const perJob = {};
  let ok = 0, failed = 0, skipped = 0, tokens = 0;
  for (const r of shift) {
    const j = perJob[r.job] = perJob[r.job] || { runs: 0, ok: 0, failed: 0, agenda_skips: 0, tokens: 0 };
    j.runs++; j.tokens += r.total_tokens || 0; tokens += r.total_tokens || 0;
    if (r.agenda_skip) { j.agenda_skips++; skipped++; }
    else if (r.ok === true) { j.ok++; ok++; }
    else if (r.ok === false) { j.failed++; failed++; }
  }
  return { shift_day: shiftDayStr, rows: shift.length, ok, failed, agenda_skips: skipped, total_tokens: tokens, per_job: perJob };
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
        pushed = await pushNtfy(cfg, SHEET_PUSH_TITLE, `${lead}\n\n${head}\n\n_…full sheet on the Wall (ARSENAL 2)._${loginLine ? "\n\n" + loginLine : ""}${nag ? "\n\n" + nag : ""}${tt ? "\n\n🎙️ " + tt : ""}`, undefined, { tags: "soccer,clipboard" });
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
    try {
      const ag = readJson(join(OUT_DIR, "agenda", today + ".json"));
      const pick = ag && ag.dream_pick;
      if (pick) {
        const dj = readJson(join(OUT_DIR, "dreams", localDate(new Date(now.getTime() - 86400000)) + ".json"));
        const real = dj && Array.isArray(dj.bridges)
          && dj.bridges.find((b) => b.from_concept === pick.from_concept && b.to_concept === pick.to_concept && b.axis === pick.axis);
        if (real) inputs["dream to test (agenda's pick — OPTIONAL seed: weave into the lesson's FABRIC only if it fits in one line; NEVER a new question-moment; drop silently if it does not fit)"] = real;
      }
    } catch { }
    prompt = buildNightCoachPrompt(job, inputs, undefined, cfg.guards.banned_phrases);
  } else if (job.kind === "model_mine") {
    // H3 — the proposer's food: the owner's own grid tail + current edges +
    // H1 outcomes. All computed/read, never guessed; the ledger note carries
    // per-fact observable-day counts so an empty grid is VISIBLE, not silent.
    const grid = readLinesTail(join(STATE_DIR, "nikhil_model_grid.jsonl"), 14);
    inputs["fact grid (last 14 finalized days — null = UNOBSERVED, never false)"] = grid;
    inputs["edges currently tracked"] = ((readJson(join(STATE_DIR, "nikhil_model.json")) || {}).edges || [])
      .map((e) => ({ id: e.id, status: e.status, n: `${e.n_cooccur}/${e.n_cause_days}` }));
    inputs["brain_outcomes (last-per-key, 2 days)"] = outcomesFor([today, localDate(new Date(now.getTime() - 86400000))]);
    prompt = buildModelMinePrompt(job, inputs, cfg.guards.banned_phrases);
  } else if (job.kind === "agenda") {
    // H2: the day's evidence, all code-computed (never a raw ledger dump).
    // Wake residue rides the salience summary's own escalation rows — the
    // brain_ledger's cortex_wake rows carry metering only (refuter-verified),
    // so the ledger contributes nothing here but cost lines the diary reads.
    inputs[`salience day-summary (computed, ${today})`] = salienceDaySummary(today);
    inputs["brain_outcomes (last-per-key, yesterday+today)"] = outcomesFor([today, localDate(new Date(now.getTime() - 86400000))]);
    const tc = readJson(join(STATE_DIR, "teaching_contract.json"));
    inputs["teaching drifts (top rules)"] = ((tc && tc.rules) || [])
      .map((r) => ({ id: r.id, hits: (r.hits || 0) + (r.auto_hits || 0) }))
      .sort((a, b) => b.hits - a.hits).slice(0, 5);
    // H5 — last night's dreams (the agenda is THE reader; unpicked bridges are
    // inert by construction — never read again, never deleted)
    const dj = readJson(join(OUT_DIR, "dreams", localDate(new Date(now.getTime() - 86400000)) + ".json"));
    if (dj && Array.isArray(dj.bridges) && dj.bridges.length)
      inputs["last night's dreams (you MAY dream_pick exactly ONE, verbatim)"] = dj.bridges;
    prompt = buildAgendaPrompt(job, inputs, cfg, cfg.guards.banned_phrases);
  } else if (job.kind === "diary") {
    // H6: every count precomputed (the no-derive law), agenda via declared
    // input (brain_out/agenda/TODAY.json — reconcile sees the pair), coach
    // names ONLY — the evidence field is his verbatim words, and injecting it
    // would make this a G8 opus lane (the _note carries the tripwire).
    inputs[`tonight's ledger (computed, shift ${today})`] = ledgerShiftSummary(today);
    inputs["brain_outcomes (last-per-key, 2 days)"] = outcomesFor([today, localDate(new Date(now.getTime() - 86400000))]);
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
    } catch { }
    prompt = buildDiaryPrompt(job, inputs, cfg.guards.banned_phrases);
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
  const r = job.engine === "gemini" ? gexec(prompt, cfg.gemini.binary) : exec(prompt, job.model, job.extra_args, undefined, null, deps.thinkTokens || null);   // G4 — the thinking budget rides through
  // the absent-input accounting rides EVERY outcome, so the ledger shows what a run
  // was actually built from — including the failures.
  const acct = { inputs_absent: gi.absent.length, inputs_declared: gi.declared, inputs_absent_names: gi.absent };
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
    // THE ADDRESS, said out loud (finding #63). This note is what the ledger row carries
    // and what `brain status` echoes, so a file written for a human to glance at finally
    // names itself somewhere he can see.
    const srf = jobSurface(job);
    let note = `→ brain_out/${job.out || job.id}/${outDay}.md`
      + (srf.where ? ` · reads at: ${srf.where}` : " · ⚠ NO SURFACE DECLARED — nothing points at this file")
      + rehearseNote
      + (gi.absent.length ? ` · inputs ${gi.present}/${gi.declared} present (absent: ${gi.absent.join(", ")})` : "");
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
        : "";
      note += sib ? ` + ${outDay}.json (machine sibling${detail})`
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
  return job.serve === "next_morning" && now.getHours() >= 15 ? localDate(new Date(now.getTime() + 86400000)) : localDate(now);
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
  const f = `teamtalk_${localDate(now)}_${slot}.mp3`;
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
    try { if (statSync(LEDGER).size > 2 * 1024 * 1024) { rmSync(LEDGER + ".1", { force: true }); renameSync(LEDGER, LEDGER + ".1"); } } catch { }
  }
  // HERMETIC-TEST SEAM (E2E audit 25 Jul 2026): tick() used to always read the
  // LIVE ledger/queue, so the selftest's mocked clock saw real rows and the two
  // tick checks went red the moment the machine had history. Production passes
  // neither dep and behaves exactly as before.
  const ledger = deps.ledger || readLines(LEDGER);
  const queueState = deps.queueState || readJson(QUEUE) || { observed_window_ceiling: null, jobs_run: {} };
  const today = localDate(now);
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
  for (const job of eligibleJobs(cfg, queueState, now, dugoutMinutesToday(now))) {
    const h = headroom(cfg, ledger.concat(ran.map(r => r.ledgerRow).filter(Boolean)), queueState, now, deps.signals);
    if (h.allowed <= 0) { ran.push({ job: job.id, skipped: `budget (${h.phase}: ${h.used}/${h.cap})` }); break; }
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
    const { usage, note, inputs_absent, inputs_declared, inputs_absent_names } = await runJob(job, cfg, { ...deps, queueState, hr: h, thinkTokens: maxThinkingFor(thinkPhase, h.allowed).max_thinking_tokens });
    const row = {
      ts: now.toISOString(), job: job.id, engine: job.engine || "claude", model: job.model || null,
      input_tokens: usage.input_tokens ?? null, output_tokens: usage.output_tokens ?? null,
      // the cache pair rides the row too (E2E audit 25 Jul 2026) — total_tokens now
      // includes it, so the components must be visible or the ledger can't be audited.
      cache_creation_tokens: usage.cache_creation_tokens ?? null, cache_read_tokens: usage.cache_read_tokens ?? null,
      total_tokens: usage.total_tokens || 0, duration_ms: usage.duration_ms || 0,
      ok: usage.ok, error: usage.error || null, limit_hit: !!usage.limit_hit,
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
    if (usage.ok && job.trigger && queueState.triggers) { delete queueState.triggers[job.trigger]; consumedTriggers.push(job.trigger); }   // consumed
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
    writeAtomic(QUEUE, mergeTriggers(readJson(QUEUE), queueState, consumedTriggers));
    try { writeAtomic(TOKEN_VITALS, tokenVitals(cfg, readLines(LEDGER), queueState, now, deps.signals)); } catch {}
  }
  return { ran, refused: false };
}

// the merge itself, pure and testable: brain owns every key EXCEPT `triggers`,
// which a separate `brain trigger` process arms at any moment. Disk wins on
// triggers (it is the freshest arming), we win on everything else, and anything
// this tick consumed stays consumed.
function mergeTriggers(disk, mine, consumed = []) {
  if (!disk || typeof disk !== "object") return mine;
  const triggers = { ...(disk.triggers || {}) };
  for (const k of consumed) delete triggers[k];
  return { ...mine, triggers };
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
    assert("CEILING EWMA — self-corrects DOWN (not a one-way ratchet)", blendCeiling(2000000, 900000, estC, 0.5) < 2000000);
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
  assert("SELF-TUNE — limit event stops the tick immediately", t2.ran.filter(r => r.ledgerRow).length === 1 && t2.ran[0].note.includes("LIMIT"));

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
  assert("fingerprint enters every analysis prompt", buildAnalysisPrompt({ id: "x" }, {}, fp).includes("COGNITIVE FINGERPRINT"));
  assert("empty world → fixed-traits fingerprint only, no crash", buildFingerprint({}).includes("ADHD-PI"));

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
    const spaced = geminiCommand("gemini", { platform: "win32", appdata: "C:\\Users\\Nikhil Panwar\\AppData\\Roaming", exists: () => true });
    assert("GEMINI SHIM — a spaced %APPDATA% path is QUOTED before cmd.exe parses it",
      spaced.shell === true && spaced.cmd === '"C:\\Users\\Nikhil Panwar\\AppData\\Roaming\\npm\\gemini.cmd"');
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
      assert("#63 — the four DESIGNED-to-be-human-read jobs are still ON and addressed by file path",
        ["doubt_clusters", "widget_spec", "market_scan", "drill_forge"].every(id => {
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
      const orphanChain = enabledJobs.flatMap((j) => requiredOf(j).filter(p => p.startsWith("brain_out/"))
        .filter((p) => { const producer = p.split("/")[1]; return !liveCfg.jobs.some(k => k.out === producer && k.enabled !== false); }));
      assert("#64 — every required brain_out/ input has an ENABLED producer job (a chain typo still fails; a cold pipeline does not)",
        orphanChain.length === 0);
      // concepts.json, not drills.json: the present half must be a TRACKED file so the
      // 1/2-present claim is identical at home and in a fresh checkout (drills.json is
      // gitignored personal state — the exact reason this assert was a clock).
      const rOpt = await runJob({ id: "opt", inputs: ["no_such_x.json", "concepts.json"], out: "opt" }, cfg,
        { exec: () => ({ ok: true, text: "thin data, saying less", total_tokens: 7, duration_ms: 1, limit_hit: false, error: null }), gexec: () => ({ ok: false }), now: now(23, 30), dry: true });
      assert("#64 — an OPTIONAL absent input still runs, and the run reports what it was built from",
        rOpt.usage.ok === true && rOpt.inputs_absent === 1 && rOpt.inputs_declared === 2 && /inputs 1\/2 present/.test(rOpt.note));
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

    // ---- #106 · status lines are have/need counters ----------------------
    {
      const sa = surfaceAudit({ jobs: [{ id: "a", surface: { kind: "code", where: "x" } }, { id: "b" }, { id: "c", enabled: false }] });
      assert("#106 — the surface report is a have/need pair and NAMES the gap, never the bare word 'ok'",
        sa.have === 1 && sa.need === 2 && sa.orphans.length === 1 && sa.orphans[0] === "b");
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
      const good = "misconception map yahan hai\n```json\n{\"date\":\"2026-08-10\",\"study_day\":\"2026-08-09\",\"misconceptions\":[{\"concept\":\"hallucinations\",\"evidence\":\"x\"}],\"lesson\":{\"concept\":\"hallucinations\",\"samjhao_passes\":[\"a\"],\"widget_gates\":[],\"check_question\":\"?\"}}\n```";
      assert("NIGHT COACH — the machine sibling parses out of the LAST fenced json block",
        parseNightCoachJson("```json\n{\"misconceptions\":[]}\n```\nbeech ka text\n" + good).misconceptions.length === 1);
      assert("NIGHT COACH — no block / broken json / shapeless json → null, never a throw",
        parseNightCoachJson("koi block nahi") === null && parseNightCoachJson("```json\n{broken\n```") === null
        && parseNightCoachJson("```json\n{\"no_misconceptions_key\":1}\n```") === null);
      assert("NIGHT COACH — the day filter reports counts beside the sample (a trimmed day never reads complete)",
        (() => { const a = nightCoachAfferents("1999-01-01"); return a.study_day === "1999-01-01" && a.turns_total === 0 && Array.isArray(a.turns); })());
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
    const q = readJson(QUEUE) || { observed_window_ceiling: null, jobs_run: {} };
    q.triggers = q.triggers || {};
    if ((process.argv[4] || "").toLowerCase() === "off") {
      delete q.triggers[name];
      writeAtomic(QUEUE, q);
      console.log(`brain: trigger '${name}' disarmed`);
      return;
    }
    q.triggers[name] = { ts: now.toISOString(), reason: process.argv.slice(4).join(" ") || null };
    writeAtomic(QUEUE, q);
    console.log(`brain: trigger '${name}' armed — the next tick fires the matching job once`);
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
    return;
  }
  if (mode === "status") {
    const ledger = readLines(LEDGER);
    const q = readJson(QUEUE) || {};
    const h = headroom(cfg, ledger, q, now);
    const vm = dugoutMinutesToday(now);
    console.log(`brain: phase=${h.phase} · window ${h.used.toLocaleString()}/${h.cap.toLocaleString()} tokens · week ${weekUsage(ledger, now).toLocaleString()} · ceiling ${q.observed_window_ceiling ? q.observed_window_ceiling.toLocaleString() + " (observed)" : cfg.budget.window_capacity_est_tokens.toLocaleString() + " (estimate)"} · voice pool ${vm}min today${cfg.dugout_pool && cfg.dugout_pool.enabled && vm >= cfg.dugout_pool.gemini_defer_threshold_min ? " (daytime gemini deferred)" : ""} · eligible now: ${eligibleJobs(cfg, q, now, vm).map(j => j.id).join(", ") || "none"}`);
    // the ok-rate, said out loud (E2E audit 25 Jul 2026): status used to look
    // perfectly healthy through four days of every-call-failed.
    const hh = failureStreak(ledger);
    console.log(hh.dead
      ? `brain: ⚠⚠ DEAD BRAIN — the last ${hh.streak} of ${hh.sampled} calls ALL FAILED. ${hh.hint}`
      : `brain: health OK — ${hh.streak} failure(s) at the tail of the last ${hh.sampled} call(s).`);
    if (cfg._config_error) console.log(`brain: ⚠⚠ CONFIG BROKEN (${cfg._config_error}) — running on DEFAULTS with zero jobs.`);

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
        try { const fs2 = readdirSync(d).filter(f => f.endsWith(".md")).sort(); newest = fs2.length ? fs2[fs2.length - 1] : null; } catch {}
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
      const { usage, note, inputs_absent, inputs_declared, inputs_absent_names } = await runJob(job, cfg, deps);
      if (!deps.dry) {
        appendFileSync(LEDGER, JSON.stringify({ ts: now.toISOString(), job: job.id, engine: job.engine || "claude", model: job.model || null, input_tokens: usage.input_tokens ?? null, output_tokens: usage.output_tokens ?? null, cache_creation_tokens: usage.cache_creation_tokens ?? null, cache_read_tokens: usage.cache_read_tokens ?? null, total_tokens: usage.total_tokens || 0, duration_ms: usage.duration_ms || 0, ok: usage.ok, error: usage.error || null, limit_hit: !!usage.limit_hit, manual: true, note: note || null,
          // same input accounting as the scheduled path (finding #64) — a manual run must
          // not be the one place the evidence base goes unrecorded.
          inputs_present: typeof inputs_declared === "number" ? inputs_declared - inputs_absent : null,
          inputs_declared: typeof inputs_declared === "number" ? inputs_declared : null,
          inputs_absent: typeof inputs_absent === "number" ? inputs_absent : null,
          inputs_absent_names: (inputs_absent_names && inputs_absent_names.length) ? inputs_absent_names : null }) + "\n");
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
    console.log(r.pulsed
      ? `brain: pulse — ${r.escalated ? "ESCALATED (" + r.why + ")" : "hold"} · ${(r.tokens || 0).toLocaleString()} tok · ${r.count}/${r.cap} calls · ${(r.tokens_today || 0).toLocaleString()}/${(r.token_budget || 0).toLocaleString()} tok measurement window`
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
          console.log(`brain: beat ${beats} [${pace.phase} · pace ~${pace.pace_tok_per_min.toLocaleString()} tok/min · ${done}/${t.ran.length} ran]`);
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
              console.log(`brain: pulse ${pr.escalated ? "ESCALATED" : "hold"} (${(pr.tokens || 0).toLocaleString()} tok · ${pr.count}/${pr.cap} calls · ${(pr.tokens_today || 0).toLocaleString()}/${(pr.token_budget || 0).toLocaleString()} tok window)`);
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
  const { ran, refused, skipped } = await withTickLock(() => tick(cfg, deps));
  if (refused) process.exit(1);
  if (skipped) { console.log(`brain: ${skipped} — skipped this tick`); return; }
  const done = ran.filter(r => r.ledgerRow && r.ledgerRow.ok).length;
  console.log(`brain: tick — ${done} job(s) ran, ${ran.length - done} skipped/failed [${ran.map(r => r.job + (r.skipped ? ":skip" : "")).join(", ") || "idle"}] → ${LEDGER}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { headroom, windowUsage, weekUsage, eligibleJobs, shiftDay, validateOutput, noNewNumbers, bannedPhraseCheck, tick, runJob, loadConfig, sliceSheet, resolveNtfyTopic, pushNtfy, buildFingerprint, buildAnalysisPrompt, serveDate, teamtalkLine, dugoutMinutesToday, tokenVitals, reserveNow, blendCeiling, maxThinkingFor, targetBurn, runPulse, pulseConfig, pulsesToday, liveSignal,
  // E2E audit 25 Jul 2026 — new seams, exported so the doctor/selftest can see them
  usageTotal, failureStreak, gatherInputs, recordJobRun, recordJobFail, attemptsOn, mergeTriggers, geminiCommand, lockVerdict, buildDeps, SHEET_PUSH_TITLE,
  // 1 Aug 2026 — the absence utterance + the shared window map, exported so the
  // selftest can hold them to the same badge/boundary rules as the other two.
  SHEET_ABSENCE_TITLE, jobWindows, mouthMaySpeak, pulseTokensToday, pulseFailStreak,
  // 2 Aug 2026 audit — the new seams. allowedNumbers/noNewNumbers now delegate to
  // scripts/validators.mjs; the FROZEN pre-audit engines are exported too so the
  // selftest can hold them as a live regression witness (nothing else may call them).
  allowedNumbers, allowedNumbersLegacy, noNewNumbersLegacy, hypeGuardOn,
  gatherInputsAudited, normalizeInputs, jobSurface, surfaceAudit,
  readLinesTail, archiveSiblings, pulseTokens, conceptVocabulary, PULSE_STOPWORDS,
  pulseCostToday, minedAnchors, outDate };
