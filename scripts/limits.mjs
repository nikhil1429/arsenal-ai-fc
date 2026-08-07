// ============================================================================
// scripts/limits.mjs — THE NUMBERS LEDGER
//
// WHY (captain, 1 Aug 2026, his own words): "why are we setting numerical limits
// in the entire organism when we are starting it from scratch? shouldn't
// everything be fully opened and then we analyze the data in 30-45-60 days and
// then think what should be the numerical limits?"
//
// He is right, and the repo already said so and then did the opposite:
// brain_config.json — "these start conservative and SELF-TUNE … the ledger LEARNS
// the plan's real shape instead of PRETENDING TO KNOW IT"; brain.mjs's pulse —
// "cheap enough to be continuous is ASSERTED, NEVER DERIVED … MEASURE, then tune."
// 853 pulses later nobody had measured. Meanwhile four of the seven core organs
// sit at status "warming_up" behind rep gates the captain was never shown.
//
// WHAT: every number that decides something, in one place, next to the REAL data
// it is being judged against — so a threshold is either EARNED or exposed as a
// guess. Read-only. No config is changed by this file, ever.
//
// ORIGIN is the whole point of the table:
//   guessed   — a human picked it; no data behind it. THESE are what he means.
//   measured  — derived from this captain's own recorded history
//   external  — a wall we do not own (plan limits, API shapes, sleep science)
//   guard     — not a budget: it stops one identical failure repeating forever.
//               Guards stay open-ended systems' only protection and are NOT
//               subject to the 30-60-day rule.
// Anything not in the curated table is reported `unclassified` — never guessed at,
// because silently calling a number "fine" is the exact failure this file exists for.
// ============================================================================
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = join(__dirname, "..");
const STATE = join(REPO, "dressing-room", "state");
const SCRIPTS = join(REPO, "scripts");

const readJson = (p) => { try { return JSON.parse(readFileSync(p, "utf8")); } catch { return null; } };
const readLines = (p) => { try { return readFileSync(p, "utf8").trim().split("\n").filter(Boolean); } catch { return []; } };

// ---- WHAT THE CAPTAIN ACTUALLY HAS RIGHT NOW -------------------------------
export function measureReality(stateDir = STATE) {
  const reps = readLines(join(stateDir, "reps_log.jsonl")).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  const capsules = (() => { try { return readdirSync(join(stateDir, "capsules")).filter(f => f.endsWith(".json")).length; } catch { return 0; } })();
  const dg = readJson(join(stateDir, "doubt_grammar.json"));
  const ledger = readLines(join(stateDir, "brain_ledger.jsonl")).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  const days = (() => {
    const ts = reps.map(r => String(r.ts || "").slice(0, 10)).filter(Boolean).sort();
    if (!ts.length) return 0;
    return Math.round((Date.parse(ts[ts.length - 1]) - Date.parse(ts[0])) / 86400000) + 1;
  })();
  return {
    reps: reps.length,
    rep_days: new Set(reps.map(r => String(r.ts || "").slice(0, 10))).size,
    span_days: days,
    capsules,
    doubts: dg && Array.isArray(dg.doubts) ? dg.doubts.length : (dg && dg.total_doubts) || 0,
    afferents: readLines(join(stateDir, "afferent.jsonl")).length,
    salience_moments: readLines(join(stateDir, "salience_ledger.jsonl")).length,
    wakes: readLines(join(stateDir, "wake_queue.jsonl")).length,
    brain_calls: ledger.length,
    pulses: ledger.filter(r => r.job === "haiku_pulse").length,
    // KEPT (layering law) — this is what the twin gate USED to be judged against,
    // wrongly. It is a real number about a real file (voice take_notes), it is
    // just not the twin's denominator. See twin_resolutions_best_type below.
    voice_resolutions: readLines(join(stateDir, "dugout_notes.jsonl")).length,
    // AUDIT #78 (4 Aug 2026) — THE TWIN MAPPING WAS WRONG.
    // `gates.twin_voice_min_resolutions` was printed next to dugout_notes.jsonl's
    // line count. Those are the Dugout's take_note writes — a voice feature that
    // has nothing to do with the twin. physio.mjs:456-457 computes the real
    // denominator: rows of slip.jsonl where book === "twin" && resolved, collapsed
    // last-wins per (book|type|date|claim) so an appended correction cannot pay the
    // gate twice (physio.mjs:93-97, E2E audit 25 Jul), counted PER CLAIM-TYPE, and
    // the gate opens when ANY ONE type reaches the threshold (physio.mjs:480 uses
    // .some, :502 takes the max). So the honest "have" is the best single type —
    // which is why this reads the max, not the total. Replicated here rather than
    // imported because limits.mjs must stay a read-only observer with no importers.
    twin_resolutions_best_type: twinBestType(readLines(join(stateDir, "slip.jsonl"))),
    throwins: readLines(join(stateDir, "loose_balls.jsonl")).length,
  };
}

// The twin's real denominator, as a PURE function of the slip lines, so the
// selftest can prove it on a fixture without this read-only file ever opening a
// writer. Mirrors physio.mjs:93-97 (lastWinsSlip) + :457 (filter) + :502 (max).
export function twinBestType(slipLines = []) {
  const lastWins = new Map();
  for (const line of slipLines) {
    let s; try { s = JSON.parse(line); } catch { continue; }
    if (!s || s.book !== "twin" || !s.resolved) continue;
    lastWins.set(`${s.book}|${s.type}|${s.date}|${s.claim}`, s);   // last row for a day+claim wins
  }
  const perType = {};
  for (const s of lastWins.values()) perType[s.type] = (perType[s.type] || 0) + 1;
  const counts = Object.values(perType);
  return counts.length ? Math.max(...counts) : 0;   // the gate opens on ONE type, not the sum
}

// ---- THE GATES: numbers that decide whether an organ may SPEAK AT ALL -------
// Each carries the LIVE reading it is judged against, so "shut" is a fact, not a claim.
export const GATES = [
  { organ: "calibration",   file: "calibration.mjs",   key: "min_reps",                    need: 20,  have: (m) => m.reps,              origin: "guessed", effect: "no calibration_gap, no overconfidence read" },
  { organ: "calibration",   file: "calibration.mjs",   key: "window_size",                 need: 20,  have: (m) => m.reps,              origin: "guessed", effect: "trend window" },
  { organ: "calibration",   file: "calibration.mjs",   key: "danger.min_knew_reps",        need: 3,   have: (m) => m.reps,              origin: "guessed", effect: "no danger-zone topics surfaced" },
  { organ: "nemesis",       file: "nemesis.mjs",       key: "warming_up_min_reps",         need: 20,  have: (m) => m.reps,              origin: "guessed", effect: "no weakness headline reaches the sheet" },
  { organ: "nemesis",       file: "nemesis.mjs",       key: "axis_cluster_min_concepts",   need: 3,   have: (m) => m.capsules,          origin: "guessed", effect: "no axis-pattern read" },
  { organ: "learning_state",file: "learning_state.mjs",key: "thresholds.warming_up_min_reps", need: 12, have: (m) => m.reps,           origin: "guessed", effect: "no fluency state, no maidan focus" },
  { organ: "learning_state",file: "learning_state.mjs",key: "thresholds.held_streak",      need: 2,   have: (m) => m.reps,              origin: "guessed", effect: "a concept cannot reach HELD" },
  { organ: "learning_state",file: "learning_state.mjs",key: "thresholds.fluent_streak",    need: 3,   have: (m) => m.reps,              origin: "guessed", effect: "a concept cannot reach FLUENT" },
  { organ: "doubtminer",    file: "doubtminer.mjs",    key: "gates.min_capsules",          need: 4,   have: (m) => m.capsules,          origin: "guessed", effect: "no doubt clustering" },
  { organ: "doubtminer",    file: "doubtminer.mjs",    key: "gates.min_doubts",            need: 60,  have: (m) => m.doubts,            origin: "guessed", effect: "no doubt clustering" },
  { organ: "doubtminer",    file: "doubtminer.mjs",    key: "lexicon.min_count",           need: 2,   have: (m) => m.capsules,          origin: "guessed", effect: "an anchor must repeat twice — why filler outranks metaphor" },
  { organ: "doubtminer",    file: "doubtminer.mjs",    key: "tape_room.min_age_days",      need: 14,  have: (m) => m.span_days,         origin: "guessed", effect: "no rematch is old enough to return" },
  { organ: "boot room",     file: "physio.mjs",        key: "gates.bootroom_min_reps",     need: 200, have: (m) => m.reps,              origin: "guessed", effect: "the genome proposes no mutation" },
  // #78: `have` was m.voice_resolutions (dugout_notes.jsonl lines) — the wrong file
  // entirely. It now reads the same thing physio.mjs:457/:502 counts.
  { organ: "twin",          file: "physio.mjs",        key: "gates.twin_voice_min_resolutions", need: 30, have: (m) => m.twin_resolutions_best_type, origin: "guessed", effect: "no voice-twin read (best single claim-type in slip.jsonl)" },
  { organ: "apni ghadi",    file: "physio.mjs",        key: "gates.apni_ghadi.min_cards",  need: 8,   have: (m) => m.capsules,          origin: "guessed", effect: "no personal-interval calibration" },
  { organ: "body archive",  file: "physio.mjs",        key: "gates.body_archive_min_days", need: 84,  have: (m) => m.span_days,         origin: "external", effect: "seasonal body baseline — 12 weeks is a real physiological window" },
  { organ: "signal table",  file: "physio.mjs",        key: "signal_table.min_n",          need: 20,  have: (m) => m.reps,              origin: "guessed", effect: "no per-signal reliability table" },
  { organ: "thalamus",      file: "thalamus_config.json", key: "wake threshold (tau1)",    need: null, have: null,                      origin: "guessed", effect: "TIER-2 wake bar — pulse maxes at 0.244 against a 0.40-0.85 bar" },
];

// ---- BUDGETS: numbers that cap SPEND ---------------------------------------
export const BUDGETS = [
  { name: "pulse daily call cap",      where: "brain.mjs pulseConfig.daily_cap",              value: 200,      origin: "guessed",  note: "reclassified #66/#67: a runaway-loop backstop, NOT a budget — at the 0.10 window (~36 pulses/day) it can never bind; pulse itself PAUSED since 2 Aug (brain_config.pulse.enabled:false)" },
  { name: "pulse daily token budget",  where: "brain.mjs pulseConfig.daily_token_frac",       value: 0.10,     origin: "guessed",  note: "was 0.05 (1 Aug guess); DOUBLED 2 Aug as a MEASUREMENT WINDOW — arithmetic recorded in brain_config.pulse._measurement_window_note; this row said 0.05 until 7 Aug 2026, exactly the rot this file warns about" },
  { name: "window capacity estimate",  where: "brain_config.budget.window_capacity_est_tokens", value: 800000, origin: "measured", note: "SELF-TUNES from observed limit events (observed_window_ceiling)" },
  { name: "weekly capacity estimate",  where: "brain_config.budget.weekly_capacity_est_tokens", value: 12000000, origin: "external", note: "the Claude Max plan's real wall — not ours to choose" },
  { name: "day reserve fraction",      where: "brain_config.budget.day_reserve_frac",         value: 0.4,      origin: "guessed",  note: "how much of the window is held back during his study hours" },
  { name: "overnight target fraction", where: "brain_config.budget.overnight_target_frac",    value: 0.95,     origin: "guessed",  note: "how hard the night is allowed to run" },
  { name: "gemini defer threshold",    where: "brain_config.dugout_pool.gemini_defer_threshold_min", value: 30, origin: "guessed", note: "voice minutes before daytime gemini steps aside" },
  { name: "pulse min headroom",        where: "brain.mjs pulseConfig.min_headroom_tokens",    value: 20000,    origin: "guessed",  note: "" },
];

// ---- GUARDS: not budgets. They stop ONE identical failure repeating forever. --
export const GUARDS = [
  { name: "max attempts per shift",   where: "brain_config.guards.max_attempts_per_shift", value: 3,      earned: "25 Jul: a deterministically-failing job re-ran ~1150x/day at full model cost" },
  { name: "pulse failure backoff",    where: "brain.mjs pulseConfig.max_consecutive_failures", value: 3,   earned: "21 Jul: 164 failures burned all 200 slots on a logged-out CLI" },
  { name: "bell grace window",        where: "brain.mjs BELLS.fulltime.grace_min",         value: 75,     earned: "29 Jul: the 21:30 bell fired at 15:23 as schtasks catch-up" },
  { name: "step timeout",             where: "conductor.mjs STEP_TIMEOUT_MS",              value: 180000, earned: "a hung organ must not eat the morning" },
  { name: "heartbeat timeout",        where: "heartbeat.mjs timeout_ms",                   value: 120000, earned: "" },
  { name: "sheet line cap",           where: "manager.mjs LINE_CAP",                       value: 40,     earned: "one glance = one story; a 200-line sheet is not a sheet" },
];

// ---- generic sweep: every numeric leaf in every *_config.json ---------------
export function sweepConfigs(stateDir = STATE) {
  const out = [];
  let files = [];
  try { files = readdirSync(stateDir).filter(f => /_config\.json$|_profile\.json$/.test(f)); } catch { }
  for (const f of files) {
    const j = readJson(join(stateDir, f));
    if (!j) continue;
    (function walk(v, path) {
      if (typeof v === "number") { out.push({ file: f, path, value: v }); return; }
      if (Array.isArray(v)) return v.forEach((x, i) => walk(x, `${path}[${i}]`));
      if (v && typeof v === "object") return Object.entries(v).forEach(([k, x]) => { if (!k.startsWith("_")) walk(x, path ? `${path}.${k}` : k); });
    })(j, "");
  }
  return out;
}

// ---- generic sweep: numeric literals inside each script's DEFAULTS block ----
export function sweepScriptDefaults(dir = SCRIPTS) {
  const out = [];
  let files = [];
  try { files = readdirSync(dir).filter(f => f.endsWith(".mjs")); } catch { }
  for (const f of files) {
    let src = "";
    try { src = readFileSync(join(dir, f), "utf8"); } catch { continue; }
    const i = src.indexOf("const DEFAULTS = {");
    if (i < 0) continue;
    let depth = 0, j = src.indexOf("{", i);
    const start = j;
    for (; j < src.length; j++) { if (src[j] === "{") depth++; else if (src[j] === "}") { depth--; if (!depth) break; } }
    // strip line comments so a number inside prose is never reported as a knob
    const block = src.slice(start, j + 1).split("\n").map(l => l.replace(/\/\/.*$/, "")).join("\n");
    const re = /([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*(-?\d+(?:\.\d+)?)\s*[,}]/g;
    let m;
    while ((m = re.exec(block))) out.push({ file: f, key: m[1], value: Number(m[2]) });
  }
  return out;
}

export function report(stateDir = STATE) {
  const m = measureReality(stateDir);
  const gates = GATES.map(g => {
    const have = g.have ? g.have(m) : null;
    return { ...g, have, open: have == null || g.need == null ? null : have >= g.need, have_fn: undefined };
  });
  return { measured: m, gates, budgets: BUDGETS, guards: GUARDS, config_numbers: sweepConfigs(stateDir), script_defaults: sweepScriptDefaults() };
}

function human(r) {
  const m = r.measured;
  console.log("\n=== WHAT HE ACTUALLY HAS ===");
  for (const [k, v] of Object.entries(m)) console.log(`  ${k.padEnd(20)} ${String(v).padStart(7)}`);

  console.log("\n=== GATES — numbers that decide whether an organ MAY SPEAK ===");
  console.log(`  ${"organ".padEnd(15)}${"knob".padEnd(38)}${"have".padStart(6)}${"need".padStart(7)}   status   origin`);
  for (const g of r.gates) {
    const st = g.open === null ? "  ?   " : g.open ? " OPEN " : " SHUT ";
    console.log(`  ${g.organ.padEnd(15)}${g.key.padEnd(38)}${String(g.have ?? "-").padStart(6)}${String(g.need ?? "-").padStart(7)}   ${st}  ${g.origin}`);
  }
  const shut = r.gates.filter(g => g.open === false);
  console.log(`  → ${shut.length} of ${r.gates.length} gates SHUT. ${r.gates.filter(g => g.origin === "guessed").length} of them are GUESSES.`);

  console.log("\n=== BUDGETS — numbers that cap spend ===");
  for (const b of r.budgets) console.log(`  ${b.origin.padEnd(9)} ${String(b.value).padStart(9)}  ${b.name}  ·  ${b.where}`);

  console.log("\n=== GUARDS — not budgets; they stop one failure repeating ===");
  for (const g of r.guards) console.log(`  ${String(g.value).padStart(7)}  ${g.name.padEnd(26)} ${g.earned ? "earned: " + g.earned : ""}`);

  console.log(`\n=== SWEEP === ${r.config_numbers.length} numeric knobs across ${new Set(r.config_numbers.map(c => c.file)).size} config files · ${r.script_defaults.length} in script DEFAULTS blocks`);
  console.log("(run `node scripts/limits.mjs json` for the full machine-readable dump)\n");
}

function selftest() {
  let pass = 0, fail = 0;
  const ok = (n, c) => { if (c) { pass++; console.log("  ✓ " + n); } else { fail++; console.log("  ✗ " + n); } };
  const r = report();
  ok("measures reality from the live bus, never from a constant", typeof r.measured.reps === "number" && typeof r.measured.capsules === "number");
  ok("every gate declares an origin", r.gates.every(g => ["guessed", "measured", "external", "guard"].includes(g.origin)));
  ok("a gate's status is computed from live data, never asserted", r.gates.filter(g => g.have != null).every(g => g.open === (g.have >= g.need)));
  ok("the sweep finds config knobs", r.config_numbers.length > 0);
  ok("the sweep finds script DEFAULTS knobs", r.script_defaults.length > 0);
  ok("comment text is stripped — no prose number reported as a knob", !r.script_defaults.some(d => d.key === "E2E" || d.key === "audit"));

  // ---- AUDIT #78 — THE TWIN MAPPING ----------------------------------------
  // The bug was that the twin gate's `have` read dugout_notes.jsonl (voice
  // take_notes) instead of the twin's own resolved slips. The fixture below makes
  // the two sources DISAGREE on purpose — that disagreement is the entire defect —
  // so this assertion goes red the moment the mapping drifts back.
  {
    const slip = [
      { date: "2026-07-01", book: "twin",   type: "floor_touched", claim: "c", resolved: true },
      { date: "2026-07-02", book: "twin",   type: "floor_touched", claim: "c", resolved: true },
      { date: "2026-07-02", book: "twin",   type: "floor_touched", claim: "c", resolved: true },  // appended correction, same day
      { date: "2026-07-03", book: "twin",   type: "floor_touched", claim: "c", resolved: true },
      { date: "2026-07-04", book: "twin",   type: "session_abandon", claim: "c", resolved: true }, // a DIFFERENT claim-type
      { date: "2026-07-05", book: "gaffer", type: "floor_touched", claim: "c", resolved: true },  // not the twin's book
      { date: "2026-07-06", book: "twin",   type: "floor_touched", claim: "c", resolved: false }, // not resolved yet
      "{ not json",
    ].map(x => typeof x === "string" ? x : JSON.stringify(x));
    ok("#78 — the twin gate counts RESOLVED twin slips on ONE claim-type, last-wins (3, not 4, not 5, not 7)",
      twinBestType(slip) === 3);
    ok("#78 — no slips at all reads 0, never null or NaN", twinBestType([]) === 0 && twinBestType(["{}"]) === 0);
    // the table row itself, fed a measurement where the two candidate sources
    // disagree — the old mapping returns 7 here, the repaired one returns 3.
    const twinRow = GATES.find(g => g.organ === "twin");
    ok("#78 — the twin row's have() reads twin_resolutions_best_type, NOT dugout_notes' take_note count",
      !!twinRow && twinRow.have({ voice_resolutions: 7, twin_resolutions_best_type: 3 }) === 3);
  }

  // This used to be `typeof globalThis.writeFileSync === "undefined"` — always true
  // on every Node process ever, i.e. an assertion that could not fail guarding the
  // file's loudest claim ("Read-only. No config is changed by this file, ever").
  // Now it reads this module's OWN source and demands no writer is even called.
  {
    const src = readFileSync(fileURLToPath(import.meta.url), "utf8")
      .split("\n").filter(l => !/^\s*(\/\/|\*|\/\*)/.test(l)).join("\n");
    ok("READ-ONLY: this file calls no writer — measured against its own source, not asserted",
      !/\bwriteFileSync\s*\(|\bappendFileSync\s*\(|\brenameSync\s*\(|\bmkdirSync\s*\(|\brmSync\s*\(|\bunlinkSync\s*\(/.test(src));
  }
  console.log(fail === 0 ? `\nALL CHECKS PASSED (${pass} passed, 0 failed)` : `\n${fail} FAILED (${pass} passed)`);
  return fail === 0;
}

function main() {
  const mode = (process.argv[2] || "human").toLowerCase();
  if (mode === "selftest") process.exit(selftest() ? 0 : 1);
  const r = report();
  if (mode === "json") { console.log(JSON.stringify(r, null, 2)); return; }
  human(r);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
