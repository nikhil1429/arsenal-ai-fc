#!/usr/bin/env node
// ============================================================================
// physio.mjs · ARSENAL AI FC — THE ORGANISM: THE PHYSIO (proprioception)
// ----------------------------------------------------------------------------
// WHAT:  The organ that knows the organism has never had blood (THE_ORGANISM
//        §IV.1). Audits the boundary itself: files stale beyond cadence,
//        signal emitted-but-never-consumed, effort spent-but-uncaptured
//        ("we played but the cameras were off"), throw-ins that stopped
//        arriving, a mirror that stopped syncing. Owns the SPEAK-GATES every
//        fitted organ defers to, and the per-organ signal table.
// WHY:   Trust, not tokens, is the real coupling substrate. The loop must feel
//        its own anemia before anything is allowed to speak as if fed —
//        and repairing the loop must never be the captain's chore.
// CONSTITUTIONAL (each selftested):
//   · EXCEPTION-ONLY VOICE — vitals.line is null unless something bleeds.
//   · GOVERNOR EXEMPT — the Goalkeeper/Governor NEVER appears in the signal
//     table. A safety brake that can be relegated by a Brier score is a brake
//     that will one day be off when the crash comes.
//   · NEVER-BORN ≠ BLEEDING — a file that has never existed on a bloodless
//     organism is status quo, not a wound. Only files that have EXISTED and
//     gone stale bleed.
//   · Throw-in watching is DELIVERY-failure only (poller wired but silent) —
//     usage is never a captain metric.
//
// INPUT:  physio_config.json (canon) · the whole bus (read-only, mtimes+JSON)
// OUTPUT: dressing-room/state/loop_vitals.json (sole writer)
// MODES:  run (default) · selftest
// ============================================================================

import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync, statSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const CFG_PATH  = join(STATE_DIR, "physio_config.json");
const VITALS    = join(STATE_DIR, "loop_vitals.json");

const DEFAULTS = {
  expected_cadence_hours: {
    "readiness.json": 30, "cards.json": 30, "calibration.json": 30, "weaknesses.json": 30,
    "learning_state.json": 30, "timeaudit.json": 30, "pulse.json": 30, "mirror_manifest.json": 30,
    "drills.json": 30, "twin.json": 30, "pitch_read.json": 30,
  },
  grace_frac: 0.25,
  effort_uncaptured: { min_learning_minutes: 120 },
  throwin_gap_days: 4,
  signal_table: { min_n: 20 },
  gates: {
    twin_voice_min_resolutions: 30,
    doubt_clusters: { min_capsules: 4, min_doubts: 60 },
    bootroom_min_reps: 200,
    apni_ghadi: { min_cards: 8, min_reps_per_card: 4 },
    body_archive_min_days: 84,
  },
};

const localDate = (now) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
const round = (x, d = 4) => (x === null ? null : Math.round(x * 10 ** d) / 10 ** d);

function loadConfig(path = CFG_PATH) {
  try {
    if (existsSync(path)) {
      const j = JSON.parse(readFileSync(path, "utf8"));
      return {
        expected_cadence_hours: { ...DEFAULTS.expected_cadence_hours, ...(j.expected_cadence_hours || {}) },
        grace_frac: typeof j.grace_frac === "number" ? j.grace_frac : DEFAULTS.grace_frac,
        effort_uncaptured: { ...DEFAULTS.effort_uncaptured, ...(j.effort_uncaptured || {}) },
        throwin_gap_days: typeof j.throwin_gap_days === "number" ? j.throwin_gap_days : DEFAULTS.throwin_gap_days,
        signal_table: { ...DEFAULTS.signal_table, ...(j.signal_table || {}) },
        gates: { ...DEFAULTS.gates, ...(j.gates || {}) },
      };
    }
  } catch { /* malformed → defaults */ }
  return JSON.parse(JSON.stringify(DEFAULTS));
}

function writeAtomic(path, obj) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = path + ".tmp";
  writeFileSync(tmp, JSON.stringify(obj, null, 2) + "\n");
  renameSync(tmp, path);
}

const readJson = (p) => { try { if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")); } catch {} return null; };
const readLines = (p) => {
  const out = [];
  try {
    if (existsSync(p)) for (const l of readFileSync(p, "utf8").split("\n")) {
      if (!l.trim()) continue;
      try { out.push(JSON.parse(l)); } catch { /* corrupt line skipped */ }
    }
  } catch { }
  return out;
};

// ---------------------------------------------------------------------------
// pure core — every input injected so the selftest owns the world
// ---------------------------------------------------------------------------
function compute(world, cfg, now = new Date()) {
  // world: { files:{name:{exists,mtimeMs}}, reps:[], timeaudit, weaknesses, teamSheetMtime,
  //          weaknessesMtime, looseBalls:[], throwinState, capsules:[{doubts:[]}...],
  //          slip:[], fsrsStore, readinessCount }
  const bleeds = [];
  const nowMs = now.getTime();

  // 1) STALE — only files that have EXISTED bleed (never-born ≠ bleeding).
  for (const [name, hrs] of Object.entries(cfg.expected_cadence_hours)) {
    const f = world.files[name];
    if (!f || !f.exists) continue;                       // never born → status quo
    const ageH = (nowMs - f.mtimeMs) / 3600000;
    if (ageH > hrs * (1 + cfg.grace_frac)) {
      bleeds.push({ organ: name.replace(".json", ""), kind: "stale",
        evidence: `${name} is ${round(ageH, 1)}h old (cadence ${hrs}h)`,
        line: `${name.replace(".json", "")} went quiet — its file is ${Math.round(ageH)}h old.` });
    }
  }

  // 2) EMITTED-BUT-NEVER-CONSUMED — a weakness headline no sheet ever surfaced.
  if (world.weaknesses && world.weaknesses.headline && world.weaknessesMtime) {
    if (!world.teamSheetMtime || world.teamSheetMtime < world.weaknessesMtime) {
      bleeds.push({ organ: "nemesis→manager", kind: "emitted_unconsumed",
        evidence: "weaknesses.headline set but team_sheet.md missing or older",
        line: "the scout filed a headline no sheet has carried yet." });
    }
  }

  // 3) EFFORT-UNCAPTURED — hours in the Learning bucket, zero reps in the log.
  const ta = world.timeaudit;
  const learnMin = ta && ta.buckets && ta.buckets.Learning && typeof ta.buckets.Learning.minutes === "number"
    ? ta.buckets.Learning.minutes : null;
  if (learnMin !== null && learnMin >= cfg.effort_uncaptured.min_learning_minutes) {
    const today = localDate(now);
    const repsToday = world.reps.filter(r => String(r.ts || "").slice(0, 10) === today).length;
    if (repsToday === 0) {
      bleeds.push({ organ: "capture", kind: "effort_uncaptured",
        evidence: `${learnMin} Learning minutes today, 0 reps in the log`,
        line: "we played but the cameras were off — one paste, captain." });
    }
  }

  // 4) THROW-IN GAP — delivery failure only: poller wired, stream previously
  //    flowed, now silent past the gap. Usage is never a captain metric.
  if (world.throwinState && world.throwinState.wired && world.looseBalls.length > 0) {
    const lastTs = Math.max(...world.looseBalls.map(b => new Date(b.ts).getTime() || 0));
    const gapDays = (nowMs - lastTs) / 86400000;
    if (gapDays > cfg.throwin_gap_days) {
      bleeds.push({ organ: "throwin", kind: "throwin_gap",
        evidence: `poller wired; last delivery ${round(gapDays, 1)}d ago`,
        line: "the throw-in line may be dropping balls — check the phone shortcut once." });
    }
  }

  // 5) MIRROR-STALE handled by (1) via mirror_manifest.json cadence.

  // SPEAK-GATES — computed from real volumes; fitted organs defer to these.
  const twinResolutions = {};
  for (const s of world.slip) if (s.book === "twin" && s.resolved) twinResolutions[s.type] = (twinResolutions[s.type] || 0) + 1;
  const totalDoubts = world.capsules.reduce((n, c) => n + (Array.isArray(c.doubts) ? c.doubts.length : 0), 0);
  const maturedCards = world.fsrsStore && Array.isArray(world.fsrsStore.cards)
    ? world.fsrsStore.cards.filter(c => (c.reps || 0) >= cfg.gates.apni_ghadi.min_reps_per_card).length : 0;
  const speak_gates = {
    twin_voice: Object.values(twinResolutions).some(n => n >= cfg.gates.twin_voice_min_resolutions),
    doubt_clusters: world.capsules.length >= cfg.gates.doubt_clusters.min_capsules && totalDoubts >= cfg.gates.doubt_clusters.min_doubts,
    bootroom_mutation: world.reps.length >= cfg.gates.bootroom_min_reps,
    apni_ghadi: maturedCards >= cfg.gates.apni_ghadi.min_cards,
    body_archive: (world.readinessCount || 0) >= cfg.gates.body_archive_min_days,
  };

  // SIGNAL TABLE — per-organ predictive scoring; FSRS Brier is the one fit
  // legitimate from day one (built for n=1), still volume-gated.
  // GOVERNOR CONSTITUTIONALLY EXEMPT — never in this table (see header).
  const signal_table = [];
  {
    let brier = null, n = 0;
    if (world.fsrsStore && Array.isArray(world.fsrsStore.cards) && world.reps.length) {
      // score: for each rep on a card AFTER its first review, FSRS "predicted"
      // retrievability proxy — honest v0: use overdue-vs-outcome (due passed &
      // rep correct?) as binary forecast 0.9/0.5; gated hard below min_n.
      const dueByConcept = new Map(world.fsrsStore.cards.map(c => [c.id, c.due]));
      const scored = [];
      for (const r of world.reps) {
        if (r.track !== "concept" || typeof r.correct !== "boolean") continue;
        const due = dueByConcept.get(String(r.concept || "").toLowerCase());
        if (!due) continue;
        const p = new Date(r.ts) <= new Date(due) ? 0.9 : 0.5;   // before due: high retention predicted
        scored.push((p - (r.correct ? 1 : 0)) ** 2);
      }
      n = scored.length;
      if (n >= cfg.signal_table.min_n) brier = round(scored.reduce((a, b) => a + b, 0) / n, 4);
    }
    signal_table.push({ organ: "fsrs", brier, n, note: brier === null ? "gated (needs n≥" + cfg.signal_table.min_n + ")" : "brier vs due-day outcomes" });
  }
  for (const organ of ["twin", "gaffer"]) {
    const entries = world.slip.filter(s => s.book === organ && s.resolved && typeof s.p === "number");
    const n = entries.length;
    const brier = n >= cfg.signal_table.min_n
      ? round(entries.reduce((a, s) => a + (s.p - (s.hit ? 1 : 0)) ** 2, 0) / n, 4) : null;
    signal_table.push({ organ, brier, n, note: brier === null ? "gated" : "brier over slip" });
  }

  return {
    date: localDate(now),
    status: "ok",
    low_confidence: false,
    generated_at: now.toISOString(),
    bleeds,
    speak_gates,
    signal_table,
    line: bleeds.length ? bleeds[0].line : null,     // EXCEPTION-ONLY VOICE
  };
}

function gatherWorld() {
  const fileNames = Object.keys(loadConfig().expected_cadence_hours);
  const files = {};
  for (const name of fileNames) {
    const p = join(STATE_DIR, name);
    files[name] = existsSync(p) ? { exists: true, mtimeMs: statSync(p).mtimeMs } : { exists: false };
  }
  const capsDir = join(STATE_DIR, "capsules");
  const capsules = existsSync(capsDir)
    ? readdirSync(capsDir).filter(f => f.endsWith(".json")).map(f => readJson(join(capsDir, f))).filter(Boolean)
    : [];
  const tsPath = join(STATE_DIR, "team_sheet.md");
  const wkPath = join(STATE_DIR, "weaknesses.json");
  const readiness = readJson(join(STATE_DIR, "readiness.json"));
  return {
    files,
    reps: readLines(join(STATE_DIR, "reps_log.jsonl")),
    timeaudit: readJson(join(STATE_DIR, "timeaudit.json")),
    weaknesses: readJson(wkPath),
    weaknessesMtime: existsSync(wkPath) ? statSync(wkPath).mtimeMs : null,
    teamSheetMtime: existsSync(tsPath) ? statSync(tsPath).mtimeMs : null,
    looseBalls: readLines(join(STATE_DIR, "loose_balls.jsonl")),
    throwinState: readJson(join(STATE_DIR, "throwin_state.json")),
    capsules,
    slip: readLines(join(STATE_DIR, "slip.jsonl")),
    fsrsStore: readJson(join(STATE_DIR, "fsrs_store.json")),
    readinessCount: readiness && typeof readiness.nights === "number" ? readiness.nights : 0,
  };
}

// ---------------------------------------------------------------------------
// selftest — fixture world; no real state touched
// ---------------------------------------------------------------------------
async function selftest() {
  const checks = [];
  const assert = (name, cond) => { checks.push([name, !!cond]); console.log(`  ${cond ? "✓" : "✗"} ${name}`); };
  const cfg = loadConfig("__no_such__");
  const now = new Date(2026, 6, 12, 21, 30, 0);
  const H = 3600000;
  const base = {
    files: {}, reps: [], timeaudit: null, weaknesses: null, weaknessesMtime: null,
    teamSheetMtime: null, looseBalls: [], throwinState: null, capsules: [], slip: [],
    fsrsStore: null, readinessCount: 0,
  };

  // healthy bloodless organism: nothing born, nothing bleeds, line null
  const quiet = compute({ ...base, files: { "cards.json": { exists: false } } }, cfg, now);
  assert("never-born files do NOT bleed (bloodless ≠ wounded)", quiet.bleeds.length === 0);
  assert("EXCEPTION-ONLY VOICE — line null when nothing bleeds", quiet.line === null);

  // stale bleed: existed, went quiet
  const stale = compute({ ...base, files: { "cards.json": { exists: true, mtimeMs: now.getTime() - 60 * H } } }, cfg, now);
  assert("existed-then-stale file bleeds", stale.bleeds.some(b => b.kind === "stale" && b.organ === "cards"));
  assert("line speaks when bleeding", typeof stale.line === "string");

  // effort uncaptured
  const effort = compute({ ...base, timeaudit: { buckets: { Learning: { minutes: 180 } } }, reps: [] }, cfg, now);
  assert("cameras-were-off bleed on effort without reps", effort.bleeds.some(b => b.kind === "effort_uncaptured" && b.line.includes("cameras were off")));
  const effortOk = compute({ ...base, timeaudit: { buckets: { Learning: { minutes: 180 } } }, reps: [{ ts: "2026-07-12T10:00:00Z", track: "concept", correct: true, concept: "x" }] }, cfg, now);
  assert("no effort bleed when reps flowed", !effortOk.bleeds.some(b => b.kind === "effort_uncaptured"));

  // emitted-unconsumed
  const emit = compute({ ...base, weaknesses: { headline: { topic: "chunking" } }, weaknessesMtime: 100, teamSheetMtime: 50 }, cfg, now);
  assert("headline older sheet → emitted_unconsumed bleed", emit.bleeds.some(b => b.kind === "emitted_unconsumed"));

  // throw-in gap: wired + flowed + silent
  const gap = compute({ ...base, throwinState: { wired: true }, looseBalls: [{ ts: new Date(now.getTime() - 6 * 86400000).toISOString() }] }, cfg, now);
  assert("wired+flowed+silent → throwin_gap (delivery, not usage)", gap.bleeds.some(b => b.kind === "throwin_gap"));
  const noGap = compute({ ...base, throwinState: { wired: false }, looseBalls: [] }, cfg, now);
  assert("unwired poller never bleeds (usage never coached)", !noGap.bleeds.some(b => b.kind === "throwin_gap"));

  // speak gates
  const gates = compute({ ...base,
    slip: Array.from({ length: 31 }, (_, i) => ({ book: "twin", type: "floor_touched", resolved: true, hit: i % 2 === 0, p: 0.6 })),
    capsules: [{ doubts: Array(20).fill({ q: "q", a: "a" }) }, { doubts: Array(20).fill({ q: "q", a: "a" }) }, { doubts: Array(15).fill({ q: "q", a: "a" }) }, { doubts: Array(10).fill({ q: "q", a: "a" }) }],
    reps: Array(250).fill({ ts: "2026-07-01T00:00:00Z", track: "concept", correct: true, concept: "x" }),
  }, cfg, now);
  assert("twin_voice gate opens at 30 resolutions", gates.speak_gates.twin_voice === true);
  assert("doubt_clusters gate opens at 4 capsules + 60 doubts", gates.speak_gates.doubt_clusters === true);
  assert("bootroom gate opens at 200 reps", gates.speak_gates.bootroom_mutation === true);
  assert("body_archive gate closed below 84 days", gates.speak_gates.body_archive === false);
  const gatesClosed = compute(base, cfg, now);
  assert("all gates closed on bloodless organism", Object.values(gatesClosed.speak_gates).every(v => v === false));

  // signal table: GOVERNOR EXEMPT + gating
  assert("GOVERNOR EXEMPT — never in the signal table", !gates.signal_table.some(s => /governor|goalkeeper|oura|readiness/i.test(s.organ)));
  assert("twin brier computed at n≥20", gates.signal_table.find(s => s.organ === "twin").brier !== null);
  assert("fsrs brier gated below n", gatesClosed.signal_table.find(s => s.organ === "fsrs").brier === null);

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
  const out = compute(gatherWorld(), cfg, new Date());
  writeAtomic(VITALS, out);
  console.log(`physio: ${out.bleeds.length} bleed(s)${out.bleeds.length ? " — " + out.bleeds.map(b => b.kind).join(", ") : ""} · gates open: ${Object.entries(out.speak_gates).filter(([, v]) => v).map(([k]) => k).join(", ") || "none (awaiting blood)"} → ${VITALS}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { compute, loadConfig };
