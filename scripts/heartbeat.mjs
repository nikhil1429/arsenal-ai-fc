#!/usr/bin/env node
// ============================================================================
// heartbeat.mjs · ARSENAL AI FC — THE ORGANISM: THE HEARTBEAT
// ----------------------------------------------------------------------------
// WHAT:  ONE sensory pass instead of four crons (THE_ORGANISM §VIII): shells
//        the existing green agents in fixed order — capture pull → fsrs →
//        calibration → nemesis → learning_state → timeaudit pulse — then reads
//        the whole bus into one coherent run-manifest (pulse.json).
// WHY:   A 4-slot working memory cannot debug a distributed system of timers.
//        One beat, one manifest, fixed order — the machine's body as legible
//        as the captain's scoreboard.
// LAWS:  Single writer of pulse.json ONLY. It SHELLS the other agents — it
//        never writes their files (single-writer intact). One agent failing
//        NEVER aborts the pass. Deterministic; zero-LLM. The ladder verdict is
//        READ (readiness.json → ladder_config.json), never produced here.
//        Every ladder withholding is recorded for post-match disclosure —
//        adaptation disclosed, never hidden.
// BRIDGE: pulse.timeaudit_bridge derives the Manager-shaped fields
//        {building_pct, building_target, meta_pct, on_track} from the REAL
//        timeaudit.json shape ({buckets:{...pct}, onTrack:boolean}) + committed
//        buckets.json targets — healing the known schema mismatch WITHOUT
//        touching either green script (layering, never replace).
//
// INPUT:  heartbeat_config.json (canon) · the state bus (read-only) ·
//         ladder_config.json · buckets.json
// OUTPUT: dressing-room/state/pulse.json
// MODES:  run (default; honors --skip=a,b) · selftest
// ============================================================================

import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCRIPTS   = __dirname;
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const CFG_PATH  = join(STATE_DIR, "heartbeat_config.json");
const PULSE     = join(STATE_DIR, "pulse.json");

const DEFAULTS = {
  order: [
    { name: "capture",        script: "capture.mjs",        args: ["pull"] },
    { name: "fsrs",           script: "fsrs.mjs",           args: [] },
    { name: "calibration",    script: "calibration.mjs",    args: [] },
    { name: "nemesis",        script: "nemesis.mjs",        args: [] },
    { name: "learning_state", script: "learning_state.mjs", args: [] },
    { name: "timeaudit",      script: "timeaudit.mjs",      args: ["pulse"] },
  ],
  timeout_ms: 120000,
};

const localDate = (now) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

function loadConfig(path = CFG_PATH) {
  try {
    if (existsSync(path)) {
      const j = JSON.parse(readFileSync(path, "utf8"));
      return {
        order: Array.isArray(j.order) && j.order.length ? j.order : DEFAULTS.order,
        timeout_ms: typeof j.timeout_ms === "number" ? j.timeout_ms : DEFAULTS.timeout_ms,
      };
    }
  } catch { /* malformed → defaults */ }
  return { order: DEFAULTS.order.slice(), timeout_ms: DEFAULTS.timeout_ms };
}

function writeAtomic(path, obj) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = path + ".tmp";
  writeFileSync(tmp, JSON.stringify(obj, null, 2) + "\n");
  renameSync(tmp, path);
}

const readJson = (path) => {
  try { if (existsSync(path)) return JSON.parse(readFileSync(path, "utf8")); } catch { /* corrupt → null */ }
  return null;
};

// one agent, isolated: failure/absence never aborts the pass.
function runAgent(entry, timeout_ms, scriptsDir = SCRIPTS, execFn = execFileSync) {
  const path = join(scriptsDir, entry.script);
  const t0 = Date.now();
  if (!existsSync(path)) return { name: entry.name, ran: false, exit: null, ms: 0, note: "script missing" };
  try {
    execFn(process.execPath, [path, ...(entry.args || [])], { timeout: timeout_ms, stdio: "pipe" });
    return { name: entry.name, ran: true, exit: 0, ms: Date.now() - t0, note: null };
  } catch (e) {
    const exit = typeof e.status === "number" ? e.status : null;
    const note = e.killed ? "timeout" : (exit !== null ? `exit ${exit}` : "spawn error");
    return { name: entry.name, ran: false, exit, ms: Date.now() - t0, note };
  }
}

// staleness — the Manager M-1 precedent: LOCAL date, fresh iff .date===today;
// readiness is Oura-lag tolerant (0 ≤ today−day ≤ 2 days, via its `day` field).
function staleness(bus, today) {
  const lagDays = (d) => Math.round((new Date(today) - new Date(d)) / 86400000);
  const verdictFor = (j, dateField, maxLag) => {
    if (!j) return "missing";
    const d = j[dateField];
    if (!d) return "missing";
    const lag = lagDays(String(d).slice(0, 10));
    return (lag >= 0 && lag <= maxLag) ? "fresh" : `stale(${String(d).slice(0, 10)})`;
  };
  return {
    readiness: verdictFor(bus.readiness, bus.readiness && bus.readiness.day ? "day" : "date", 2),
    cards: verdictFor(bus.cards, "date", 0),
    calibration: verdictFor(bus.calibration, "date", 0),
    weaknesses: verdictFor(bus.weaknesses, "date", 0),
    learning_state: verdictFor(bus.learning_state, "date", 0),
    timeaudit: verdictFor(bus.timeaudit, "date", 0),
  };
}

// the schema bridge: real timeaudit.json + committed buckets.json → Manager shape.
function timeauditBridge(ta, buckets) {
  if (!ta || !ta.buckets) return null;
  const pct = (b) => (ta.buckets[b] && typeof ta.buckets[b].pct === "number") ? ta.buckets[b].pct : null;
  const targets = (buckets && buckets.targets) || {};
  const building_pct = pct("Building");
  const meta_pct = pct("Meta");
  const building_target = typeof targets.buildingPctMin === "number" ? targets.buildingPctMin : 60;
  let on_track = null;
  if (typeof ta.onTrack === "boolean") on_track = ta.onTrack ? "yes" : "no";
  else if (building_pct !== null && meta_pct !== null) {
    const metaMax = typeof targets.metaPctMax === "number" ? targets.metaPctMax : 25;
    on_track = (building_pct >= building_target && meta_pct <= metaMax) ? "yes" : "no";
  }
  return { building_pct, building_target, meta_pct, on_track };
}

// ladder: verdict from readiness (missing ⇒ GREEN, M-1 precedent) mapped through
// ladder_config.json; RED/AMBER dampenings are recorded for post-match disclosure.
function ladderRead(readiness, ladderCfg) {
  const verdict = (readiness && typeof readiness.verdict === "string") ? readiness.verdict.toUpperCase() : "GREEN";
  const source = readiness ? "readiness.json" : "missing→GREEN";
  const tier = (ladderCfg && ladderCfg[verdict]) || null;
  const withheld = [];
  if (tier && verdict !== "GREEN") {
    if (tier.nemesis_headline === "withhold_disclose_at_postmatch")
      withheld.push("nemesis headline withheld today (RED mercy — nobody rubs a wound on a broken day)");
    if (tier.sheet_scope && tier.sheet_scope !== "full")
      withheld.push(`sheet capped at ${tier.sheet_scope} (ladder ${verdict})`);
    if (Array.isArray(tier.drill_modes_allowed) && !tier.drill_modes_allowed.includes("novel"))
      withheld.push(`drills limited to ${tier.drill_modes_allowed.join("/")} (ladder ${verdict})`);
  }
  return { verdict, source, withheld };
}

function buildPulse({ agents, bus, buckets, ladderCfg, now }) {
  const today = localDate(now);
  const lad = ladderRead(bus.readiness, ladderCfg);
  return {
    date: today,
    status: "ok",
    low_confidence: false,
    generated_at: now.toISOString(),
    agents,
    staleness: staleness(bus, today),
    timeaudit_bridge: timeauditBridge(bus.timeaudit, buckets),
    ladder: { verdict: lad.verdict, source: lad.source },
    withheld_disclosures: lad.withheld,
  };
}

// ---------------------------------------------------------------------------
// selftest — stub scripts in tmpdir; fixture bus; no real state touched
// ---------------------------------------------------------------------------
async function selftest() {
  const os = await import("node:os");
  const { mkdtempSync } = await import("node:fs");
  const checks = [];
  const assert = (name, cond) => { checks.push([name, !!cond]); console.log(`  ${cond ? "✓" : "✗"} ${name}`); };
  const tmp = mkdtempSync(join(os.tmpdir(), "heartbeat-st-"));

  // stub agents: ok / failing / missing
  writeFileSync(join(tmp, "ok.mjs"), "process.exit(0)");
  writeFileSync(join(tmp, "bad.mjs"), "process.exit(3)");
  const order = [
    { name: "ok", script: "ok.mjs", args: [] },
    { name: "bad", script: "bad.mjs", args: [] },
    { name: "ghost", script: "ghost.mjs", args: [] },
  ];
  const results = order.map(e => runAgent(e, 5000, tmp));
  assert("ok agent runs, exit 0", results[0].ran === true && results[0].exit === 0);
  assert("failing agent isolated (pass continues)", results[1].ran === false && results[1].exit === 3);
  assert("missing script isolated with note", results[2].ran === false && results[2].note === "script missing");
  assert("fixed order preserved", results.map(r => r.name).join(",") === "ok,bad,ghost");

  const now = new Date(2026, 6, 12, 8, 39, 0);
  const bus = {
    readiness: { day: "2026-07-11", verdict: "AMBER" },              // 1-day Oura lag = fresh
    cards: { date: "2026-07-12" },
    calibration: { date: "2026-07-10" },                              // stale
    weaknesses: null,                                                 // missing
    learning_state: { date: "2026-07-12" },
    timeaudit: { date: "2026-07-12", buckets: { Building: { pct: 60.4 }, Learning: { pct: 25 }, Meta: { pct: 14.6 } }, onTrack: true },
  };
  const st = staleness(bus, "2026-07-12");
  assert("readiness Oura-lag ≤2d = fresh", st.readiness === "fresh");
  assert("same-day file = fresh", st.cards === "fresh");
  assert("old file = stale(date)", st.calibration === "stale(2026-07-10)");
  assert("absent file = missing", st.weaknesses === "missing");

  const buckets = { targets: { buildingPctMin: 60, metaPctMax: 25 } };
  const br = timeauditBridge(bus.timeaudit, buckets);
  assert("bridge maps real shape → manager shape", br.building_pct === 60.4 && br.building_target === 60 && br.meta_pct === 14.6 && br.on_track === "yes");
  assert("bridge null-safe on absent timeaudit", timeauditBridge(null, buckets) === null);
  const brDerived = timeauditBridge({ date: "x", buckets: { Building: { pct: 40 }, Meta: { pct: 30 } } }, buckets);
  assert("bridge derives on_track when onTrack absent", brDerived.on_track === "no");

  const ladderCfg = JSON.parse(readFileSync(join(STATE_DIR, "ladder_config.json"), "utf8"));
  const ladRed = ladderRead({ verdict: "RED" }, ladderCfg);
  assert("RED ladder → nemesis withholding disclosed", ladRed.withheld.some(w => w.includes("nemesis")));
  const ladNone = ladderRead(null, ladderCfg);
  assert("missing readiness → GREEN (M-1 precedent), zero withholdings", ladNone.verdict === "GREEN" && ladNone.withheld.length === 0);

  const pulse = buildPulse({ agents: results, bus, buckets, ladderCfg, now });
  assert("pulse envelope + disclosures present", pulse.date === "2026-07-12" && Array.isArray(pulse.withheld_disclosures));
  const p = join(tmp, "pulse.json");
  writeAtomic(p, pulse);
  assert("atomic pulse write lands", existsSync(p) && JSON.parse(readFileSync(p, "utf8")).date === "2026-07-12");

  const passed = checks.every(c => c[1]);
  console.log(passed ? "\nALL CHECKS PASSED" : "\nSELFTEST FAILED");
  return passed;
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
async function main() {
  const mode = (process.argv[2] || "run").toLowerCase();
  if (mode === "selftest") { process.exit((await selftest()) ? 0 : 1); }
  const cfg = loadConfig();
  const skipArg = (process.argv.find(a => a.startsWith("--skip=")) || "").slice(7);
  const skip = new Set(skipArg ? skipArg.split(",").map(s => s.trim()) : []);
  const now = new Date();
  const agents = [];
  for (const entry of cfg.order) {
    if (skip.has(entry.name)) { agents.push({ name: entry.name, ran: false, exit: null, ms: 0, note: "skipped" }); continue; }
    agents.push(runAgent(entry, cfg.timeout_ms));
  }
  const bus = {
    readiness: readJson(join(STATE_DIR, "readiness.json")),
    cards: readJson(join(STATE_DIR, "cards.json")),
    calibration: readJson(join(STATE_DIR, "calibration.json")),
    weaknesses: readJson(join(STATE_DIR, "weaknesses.json")),
    learning_state: readJson(join(STATE_DIR, "learning_state.json")),
    timeaudit: readJson(join(STATE_DIR, "timeaudit.json")),
  };
  const buckets = readJson(join(STATE_DIR, "buckets.json"));
  const ladderCfg = readJson(join(STATE_DIR, "ladder_config.json"));
  const pulse = buildPulse({ agents, bus, buckets, ladderCfg, now });
  writeAtomic(PULSE, pulse);
  const ok = agents.filter(a => a.ran).length;
  console.log(`heartbeat: ${ok}/${agents.length} organs beat (${agents.filter(a => !a.ran).map(a => `${a.name}:${a.note}`).join(", ") || "all ran"}) · ladder ${pulse.ladder.verdict} → ${PULSE}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { runAgent, staleness, timeauditBridge, ladderRead, buildPulse, loadConfig };
