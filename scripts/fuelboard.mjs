#!/usr/bin/env node
// ============================================================================
// fuelboard.mjs · ARSENAL AI FC — THE FUELBOARD (eight tanks, one gauge)
// ----------------------------------------------------------------------------
// WHAT:  The account-allocation ledger that makes "7 parallel regions" real
//        (CYBORG_BRAIN.md §5, §8). Rate limits are per-PROJECT, so 7 accounts
//        = 7 independent quota pools, each pinned to a DIFFERENT region/model:
//        T1 Gaffer (mouth) · T2 Watcher (vision) · T3 Cochlea (ears, OFF by
//        default) · T4 Bridge (Opus via cortex — not a Gemini tank) · T5 Scout
//        (research) · T6 Hippocampus (embeddings) · T7 DMN (default-mode +
//        failover shock absorber) · T8 Distiller (working-set — added with the
//        working-memory build; §5's seven regions + one).
// LAWS:  sole writer of tanks.json (gitignored runtime). THE STARVATION GUARD
//        (ported verbatim from the brain's P0 fix): a 429 records
//        observed_ceiling = Math.max(quota_est, used_today) — a limit event at
//        low usage can NEVER strand a region at ceiling=1. pickTank NEVER
//        borrows T1/T2 mid-conversation (a user-visible stall is worse than a
//        deferred job). All tanks cold → the caller degrades (drop vision →
//        drop to text → HARD STOP) — a quota outage never silently drains the
//        Opus window. The DMN may only spend a tank's measured headroom
//        (ceiling − used − reserve): use-it-or-lose-it, blast radius $0.
//        naive_shadow counter: callers report what a naive all-Opus run would
//        have cost, so the gauge shows the real multiplier the thalamus saves.
// MODES: node scripts/fuelboard.mjs status        → the 7-bar fuel gauge
//        node scripts/fuelboard.mjs use <id> [units] [naive_tokens]
//        node scripts/fuelboard.mjs fault <id>    → record a 429 on a tank
//        node scripts/fuelboard.mjs selftest
// ============================================================================

import { readFileSync, existsSync, mkdirSync, writeFileSync, renameSync, rmSync, statSync, utimesSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const CONFIG    = join(STATE_DIR, "fuelboard_config.json");
const TANKS     = join(STATE_DIR, "tanks.json");
const TANK_LOCK = TANKS + ".lock";

const readJson = (p) => { try { if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")); } catch {} return null; };
function writeAtomic(path, obj) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = path + "." + process.pid + ".tmp";   // per-pid: two live writers must never share one temp name (same scar capture.mjs:319 fixed)
  writeFileSync(tmp, JSON.stringify(obj, null, 2) + "\n");
  renameSync(tmp, path);
}
const localDate = (now = new Date()) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

const DEFAULT_TANKS = [
  { id: "T1", name: "Gaffer",      region: "mouth",        key_index: 0,    model: "gemini-3.1-flash-live-preview",       quota_est: 90,   enabled: true },
  { id: "T2", name: "Watcher",     region: "vision",       key_index: 1,    model: "gemini-3.1-flash-live-preview",       quota_est: 90,   enabled: true },
  { id: "T3", name: "Cochlea",     region: "ears",         key_index: 2,    model: "gemini-2.5-flash-native-audio-latest", quota_est: 60,  enabled: false },
  { id: "T4", name: "Bridge",      region: "prefrontal",   key_index: null, model: "opus-via-cortex",                     quota_est: 0,    enabled: true },
  { id: "T5", name: "Scout",       region: "research",     key_index: 3,    model: "gemini-3.1-pro-preview",              quota_est: 50,   enabled: true },
  { id: "T6", name: "Hippocampus", region: "memory",       key_index: 4,    model: "gemini-embedding-001",                quota_est: 1000, enabled: true },
  { id: "T7", name: "DMN",         region: "default-mode", key_index: 5,    model: "gemini-flash-latest",                 quota_est: 250,  enabled: true },
  { id: "T8", name: "Distiller",   region: "working-set",  key_index: 6,    model: "gemini-flash-latest",                 quota_est: 250,  enabled: true },
];
function loadTankConfig() {
  const c = readJson(CONFIG);
  return (c && Array.isArray(c.tanks) && c.tanks.length) ? c.tanks : DEFAULT_TANKS;
}

// ---------------------------------------------------------------------------
// THE BOARD — config ⊕ runtime, day-reset at local midnight
// ---------------------------------------------------------------------------
function loadBoard(deps = {}) {
  const cfgTanks = deps.config || loadTankConfig();
  const rt = (deps.readState || (() => readJson(TANKS)))() || {};
  const today = localDate(deps.now || new Date());
  const tanks = cfgTanks.map(t => {
    const s = (rt.tanks && rt.tanks[t.id]) || {};
    const fresh = s.day === today;
    return {
      ...t,
      day: today,
      used_today: fresh ? (s.used_today || 0) : 0,
      faults_today: fresh ? (s.faults_today || 0) : 0,
      // the ceiling survives the day-reset (it is a learned property of the
      // account, not of the day) — but the STARVATION GUARD floors it always
      observed_ceiling: Math.max(t.quota_est, s.observed_ceiling || 0),
      last_429: fresh ? (s.last_429 || null) : null,
    };
  });
  return { day: today, tanks, naive_shadow_tokens: rt.naive_shadow_tokens || 0, actual_units: rt.actual_units || 0 };
}
function saveBoard(board, deps = {}) {
  const out = { day: board.day, updated_at: new Date().toISOString(), naive_shadow_tokens: board.naive_shadow_tokens, actual_units: board.actual_units, tanks: {} };
  for (const t of board.tanks) out.tanks[t.id] = { day: t.day, used_today: t.used_today, faults_today: t.faults_today, observed_ceiling: t.observed_ceiling, last_429: t.last_429, state: stateOf(t) };
  (deps.writeState || ((o) => writeAtomic(TANKS, o)))(out);
  return out;
}
function stateOf(t) {
  if (!t.enabled) return "DEAD";
  if (t.key_index === null) return t.id === "T4" ? "HOT" : "DEAD";   // the Bridge is budgeted by the brain ledger, not here
  if (t.last_429) return "COLD";                                      // faulted → cold till local midnight
  const ceiling = Math.max(t.quota_est, t.observed_ceiling || 0);
  if (!ceiling) return "DEAD";
  return t.used_today < ceiling * 0.8 ? "HOT" : "WARM";
}
// what the DMN may spend: measured headroom minus a reserve — never the core
function headroomOf(t, reserveFrac = 0.15) {
  const ceiling = Math.max(t.quota_est, t.observed_ceiling || 0);
  return Math.max(0, Math.floor(ceiling * (1 - reserveFrac)) - t.used_today);
}

// ---------------------------------------------------------------------------
// THE TANK LOCK — cross-PROCESS mutual exclusion around load→mutate→save.
// E2E audit (25 Jul 2026, finding 3e32616e): "single writer" held only INSIDE
// one process. The verbs are fully synchronous, so no two of them interleave in
// a single node — but many PROCESSES import them: the hourly dmn pass fires
// 50-100 recordUse writes across a stadium night, council.mjs records seat
// spends whenever cortex/nightshift convenes it, and `fuelboard.mjs status`
// re-saves the whole board. Two of those overlapping = classic lost update:
// both load "T7 used 40", both write 41, one unit of spend evaporates and the
// gauge under-reports — which is exactly the number the STARVATION GUARD later
// freezes into observed_ceiling on a 429. So the whole read-modify-write now
// runs under an exclusive lockfile (O_EXCL create, atomic on Windows + POSIX).
// Two deliberate degradations, because a fuel ledger must never block a spend:
//   · a STALE lock (holder crashed mid-write) is broken after LOCK_STALE_MS —
//     a dead organ can never wedge the board for the season;
//   · if the wait budget expires we proceed UNLOCKED and say so (`locked:false`)
//     — that is exactly today's behaviour, so we are never worse than before.
// ---------------------------------------------------------------------------
const LOCK_STALE_MS = 10_000;   // no honest holder keeps a sync file write this long
const LOCK_WAIT_MS  = 2_000;    // patience before we give up and write anyway
const LOCK_STEALS   = 3;        // bounded stale-breaking: never spin forever
const sleepSync = (ms) => {
  // synchronous sleep — the verbs are sync by contract and callers depend on
  // the return value being the settled board, so we must not go async here
  try { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); }
  catch { const end = Date.now() + ms; while (Date.now() < end) { /* spin */ } }
};
function acquireTankLock(lockPath = TANK_LOCK, { waitMs = LOCK_WAIT_MS, staleMs = LOCK_STALE_MS } = {}) {
  const deadline = Date.now() + waitMs;
  let steals = 0;
  for (;;) {
    try {
      mkdirSync(dirname(lockPath), { recursive: true });
      writeFileSync(lockPath, JSON.stringify({ pid: process.pid, at: new Date().toISOString() }), { flag: "wx" });
      return () => { try { rmSync(lockPath, { force: true }); } catch {} };
    } catch (e) {
      if (!e || e.code !== "EEXIST") return () => {};   // fs unusable → never block the spend
      let age = Infinity;
      try { age = Date.now() - statSync(lockPath).mtimeMs; } catch {}
      if (age > staleMs && steals < LOCK_STEALS) { steals += 1; try { rmSync(lockPath, { force: true }); } catch {} continue; }
      if (Date.now() >= deadline) return null;          // waited long enough → caller proceeds unlocked
      sleepSync(25);
    }
  }
}
// deps.readState/writeState = an in-memory board (selftest, or a caller that
// owns its own state) → it never touches the shared file, so it needs no lock.
// deps.acquireLock is honoured either way so the lock discipline is testable.
function withTankLock(deps, fn) {
  const inMemory = !!(deps.readState || deps.writeState);
  const acquire  = deps.acquireLock || (inMemory ? null : acquireTankLock);
  const release  = acquire ? acquire(deps.lockPath || TANK_LOCK) : null;
  try { return fn(release !== null); }
  finally { if (typeof release === "function") release(); }
}

// ---------------------------------------------------------------------------
// THE LEDGER VERBS (single writer: every mutation loads → mutates → saves,
// now serialised across processes by the tank lock above)
// ---------------------------------------------------------------------------
function recordUse(tankId, units = 1, naiveTokens = 0, deps = {}) {
  return withTankLock(deps, (locked) => {
    const board = loadBoard(deps);
    const t = board.tanks.find(x => x.id === tankId);
    if (!t) return { ok: false, error: "no such tank" };
    t.used_today += Math.max(0, Number(units) || 0);
    board.actual_units += Math.max(0, Number(units) || 0);
    board.naive_shadow_tokens += Math.max(0, Number(naiveTokens) || 0);
    saveBoard(board, deps);
    return { ok: true, used_today: t.used_today, state: stateOf(t), locked };
  });
}
function record429(tankId, deps = {}) {
  return withTankLock(deps, (locked) => {
    const board = loadBoard(deps);
    const t = board.tanks.find(x => x.id === tankId);
    if (!t) return { ok: false, error: "no such tank" };
    // THE STARVATION GUARD (the brain's P0 fix, ported): the observed ceiling is
    // NEVER recorded below the conservative estimate — a 429 at low usage must
    // not strand the region at ceiling≈0 and silently kill it for the season.
    t.observed_ceiling = Math.max(t.quota_est, t.used_today);
    t.last_429 = new Date().toISOString();
    t.faults_today += 1;
    saveBoard(board, deps);
    return { ok: true, observed_ceiling: t.observed_ceiling, state: stateOf(t), locked };
  });
}

// ---------------------------------------------------------------------------
// THE ROUTER — pinned tank first, T7 shock-absorber second, any idle HOT third.
// NEVER borrows T1/T2 mid-conversation (a user-visible stall breaks the voice).
// Returns null when everything is cold: the caller must DEGRADE, never touch
// the Opus window for reflex work.
// ---------------------------------------------------------------------------
function pickTank(region, { inConversation = false, board } = {}, deps = {}) {
  const b = board || loadBoard(deps);
  const usable = (t) => ["HOT", "WARM"].includes(stateOf(t)) && t.key_index !== null;
  const pinned = b.tanks.find(t => t.region === region);
  if (pinned && usable(pinned)) return pinned;
  const t7 = b.tanks.find(t => t.id === "T7");
  if (t7 && t7.region !== region && usable(t7)) return t7;
  for (const t of b.tanks) {
    if (t.region === region || t.id === "T7") continue;
    if (inConversation && (t.id === "T1" || t.id === "T2")) continue;   // never mid-talk
    if (usable(t)) return t;
  }
  return null;                                       // all cold → degrade, hard stop before Opus
}

// the gauge — the organism's interoception, 7 bars
function gaugeLines(board = loadBoard()) {
  return board.tanks.map(t => {
    const ceiling = Math.max(t.quota_est, t.observed_ceiling || 0) || 1;
    const pct = Math.max(0, Math.min(1, 1 - t.used_today / ceiling));
    const bars = "▓".repeat(Math.round(pct * 8)).padEnd(8, "░");
    return `${t.id} ${t.name.padEnd(11)} ${bars} ${String(Math.round(pct * 100)).padStart(3)}% · ${stateOf(t)}${t.faults_today ? ` · ${t.faults_today} fault(s)` : ""}`;
  });
}
function summary(board = loadBoard()) {
  return board.tanks.map(t => {
    const ceiling = Math.max(t.quota_est, t.observed_ceiling || 0) || 1;
    return { id: t.id, name: t.name, state: stateOf(t), pct: Math.round(Math.max(0, Math.min(1, 1 - t.used_today / ceiling)) * 100), key_index: t.key_index, model: t.model, enabled: t.enabled };
  });
}

// ---------------------------------------------------------------------------
// selftest
// ---------------------------------------------------------------------------
async function selftest() {
  const checks = [];
  const assert = (name, cond) => { checks.push([name, !!cond]); console.log(`  ${cond ? "✓" : "✗"} ${name}`); };
  const mem = (init = null) => { let s = init; return { readState: () => s, writeState: (o) => { s = o; }, get: () => s }; };

  // the board + day reset
  {
    const m = mem({ day: "2026-07-13", tanks: { T1: { day: "2026-07-13", used_today: 55, observed_ceiling: 120, last_429: "x" } } });
    const b = loadBoard({ ...m, now: new Date("2026-07-14T08:00:00") });
    const t1 = b.tanks.find(t => t.id === "T1");
    assert("local-midnight reset: usage + faults + 429 clear, day rolls", t1.used_today === 0 && t1.last_429 === null);
    assert("the LEARNED ceiling survives the day-reset (property of the account)", t1.observed_ceiling === 120);
    assert("eight tanks, eight regions, each a different job", b.tanks.length === 8 && new Set(b.tanks.map(t => t.region)).size === 8);
  }
  // THE STARVATION GUARD (the P0 fix, ported)
  {
    const m = mem();
    recordUse("T7", 3, 0, m);
    const r = record429("T7", m);
    assert("STARVATION GUARD: a 429 at LOW usage floors the ceiling at the estimate", r.observed_ceiling === 250 && r.observed_ceiling !== 3);
    const m2 = mem({ day: localDate(), tanks: { T7: { day: localDate(), used_today: 400, observed_ceiling: 0 } } });
    const r2 = record429("T7", m2);
    assert("a 429 at HIGH usage records the true observed ceiling", r2.observed_ceiling === 400);
    assert("faulted tank reads COLD (till midnight)", r2.state === "COLD");
  }
  // the router
  {
    const b = loadBoard({ readState: () => null });
    const pick = pickTank("vision", { board: b });
    assert("pinned tank first: vision → T2", pick && pick.id === "T2");
    b.tanks.find(t => t.id === "T2").last_429 = "now";
    const fall = pickTank("vision", { board: b });
    assert("pinned cold → T7 absorbs the region (the shock absorber)", fall && fall.id === "T7");
    b.tanks.find(t => t.id === "T7").last_429 = "now";
    const third = pickTank("vision", { board: b, inConversation: true });
    assert("T7 also cold → borrows an idle tank, NEVER T1 mid-conversation", third && third.id !== "T1" && third.id !== "T2" && third.id !== "T7");
    for (const t of b.tanks) if (t.key_index !== null) t.last_429 = "now";
    assert("ALL tanks cold → null (degrade; hard stop before the Opus window)", pickTank("vision", { board: b }) === null);
  }
  // DMN headroom + the dead/disabled states
  {
    const b = loadBoard({ readState: () => null });
    const t7 = b.tanks.find(t => t.id === "T7");
    t7.used_today = 100;
    assert("DMN headroom = ceiling·(1−reserve) − used (use-it-or-lose-it only)", headroomOf(t7) === Math.floor(250 * 0.85) - 100);
    const t3 = b.tanks.find(t => t.id === "T3");
    assert("Cochlea ships DISABLED (a preview surface behind a pref) → DEAD", stateOf(t3) === "DEAD");
    const t4 = b.tanks.find(t => t.id === "T4");
    assert("the Bridge tank is budgeted by the brain ledger, not this board", stateOf(t4) === "HOT" && headroomOf(t4) === 0);
  }
  // the naive-shadow multiplier + the gauge
  {
    const m = mem();
    recordUse("T1", 5, 40000, m);
    recordUse("T7", 2, 80000, m);
    assert("naive_shadow accumulates what all-Opus would have cost", m.get().naive_shadow_tokens === 120000 && m.get().actual_units === 7);
    const lines = gaugeLines(loadBoard(m));
    assert("the gauge draws 8 bars with states", lines.length === 8 && lines.every(l => /[▓░]{8}/.test(l)) && lines.some(l => l.includes("HOT")));
    const s = summary(loadBoard(m));
    assert("the page summary carries id/state/pct for the fuel line", s.length === 8 && s.every(x => "pct" in x && "state" in x));
  }
  // THE TANK LOCK (E2E audit 25 Jul 2026, 3e32616e — lost updates across
  // processes). Runs against a throwaway lock path in the OS temp dir so the
  // selftest never touches the captain's live tanks.json or its lock.
  {
    const lp = join(tmpdir(), `fuelboard_selftest_${process.pid}.lock`);
    try { rmSync(lp, { force: true }); } catch {}
    const rel = acquireTankLock(lp, { waitMs: 0 });
    assert("tank lock: the first writer takes the board", typeof rel === "function");
    assert("tank lock: a SECOND process cannot enter the read-modify-write", acquireTankLock(lp, { waitMs: 0 }) === null);
    rel();
    const rel2 = acquireTankLock(lp, { waitMs: 0 });
    assert("tank lock: released → the next spend walks straight in", typeof rel2 === "function");
    rel2();
    // a holder that crashed mid-write: backdate the lock past LOCK_STALE_MS so
    // this exercises the REAL staleness rule, not a doctored threshold
    writeFileSync(lp, JSON.stringify({ pid: 999999, at: "crashed" }));
    const old = new Date(Date.now() - 10 * 60_000);
    utimesSync(lp, old, old);
    const relStale = acquireTankLock(lp, { waitMs: 0 });
    assert("tank lock: a STALE holder is broken — a dead organ never wedges the board", typeof relStale === "function");
    if (typeof relStale === "function") relStale();
    try { rmSync(lp, { force: true }); } catch {}
  }
  {
    const m = mem();
    let held = 0, freed = 0;
    const spy = { ...m, acquireLock: () => { held += 1; return () => { freed += 1; }; } };
    recordUse("T7", 1, 0, spy);
    record429("T7", spy);
    assert("EVERY ledger spend runs inside the tank lock, and releases it", held === 2 && freed === 2);
    let held2 = 0, freed2 = 0;
    const spy2 = { ...mem(), acquireLock: () => { held2 += 1; return () => { freed2 += 1; }; } };
    recordUse("T99-nope", 1, 0, spy2);
    assert("a REJECTED spend still releases the lock (no wedged fuelboard)", held2 === 1 && freed2 === 1);
  }

  // THE FAULT WIRE (11 Aug 2026) — record429 sat in this file for weeks with NO
  // producer for the LIVE tanks: only dmn.mjs (borrowed lanes) and distiller.mjs
  // (T8) ever called it. The Dugout socket DETECTED real quota exhaustion,
  // rotated the key pool and benched the captain with "free juice dry" — and
  // never told this board, so stateOf() could not return COLD for T1/T2, the
  // STARVATION GUARD never learned a real ceiling for any live tank, and
  // physio.mjs's `mouth_cold` bleed (written because "T1 and T2 sat COLD from a
  // 429 storm and no organ in the body said so") was unreachable by the real
  // path. Live tanks.json and both vault snapshots agreed: last_429 null on all
  // eight tanks, ever. A consumer with no producer is a black box, not a
  // feedback loop — so this asserts the PRODUCER, from the consumer's side.
  {
    let dugoutSrc = "";
    try { dugoutSrc = readFileSync(join(__dirname, "dugout.mjs"), "utf8"); } catch { }
    assert("record429 HAS a live producer: the Dugout's /tank-fault door shells `fuelboard.mjs fault`",
      dugoutSrc.includes("/tank-fault") && /"fuelboard\.mjs"\), "fault", id\]/.test(dugoutSrc));
    assert("…and the voice page still knocks on it when a key really runs dry",
      dugoutSrc.includes("function reportFault(") && dugoutSrc.includes("reportFault(keyIdx,"));
  }

  const passed = checks.every(c => c[1]);
  console.log(passed ? "\nALL CHECKS PASSED" : "\nSELFTEST FAILED");
  return passed;
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
async function main() {
  const mode = (process.argv[2] || "").toLowerCase();
  if (mode === "selftest") process.exit((await selftest()) ? 0 : 1);
  if (mode === "use") { console.log(JSON.stringify(recordUse(process.argv[3], Number(process.argv[4] || 1), Number(process.argv[5] || 0)))); return; }
  if (mode === "fault") { console.log(JSON.stringify(record429(process.argv[3]))); return; }
  // status (default)
  // E2E audit (25 Jul 2026, 3e32616e): status is a read-modify-write too — it
  // re-saves the WHOLE board, so a status run overlapping a dmn/council spend
  // used to write its own stale snapshot over that spend. Load and save now sit
  // inside one lock hold; the printing happens after, outside the critical path.
  const board = withTankLock({}, () => {
    const b = loadBoard();
    saveBoard(b);                                    // persist any day-reset
    return b;
  });
  console.log(`⛽ THE FUELBOARD · ${board.day}`);
  for (const l of gaugeLines(board)) console.log("  " + l);
  if (board.naive_shadow_tokens) console.log(`  naive-Opus shadow: ~${Math.round(board.naive_shadow_tokens / 1000)}k tokens avoided (${board.actual_units} free units spent instead)`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { loadBoard, saveBoard, stateOf, headroomOf, recordUse, record429, pickTank, gaugeLines, summary, loadTankConfig, acquireTankLock, withTankLock };
