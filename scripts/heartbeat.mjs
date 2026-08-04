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

// ORGANISM AUDIT #49 (4 Aug 2026) — DEFAULTS.order had SIX entries while the
// committed canon (heartbeat_config.json) has EIGHT. capsule_bridge and shipped
// were missing, and those two are precisely the only organs in the beat with NO
// independent automatic path (the other six each own a scheduled task; verified
// in the audit appendix). So any degraded config — file deleted, unparseable, or
// every entry shape-invalid — silently amputated the two witnesses that nothing
// else can wake, and then main() printed "6/6 organs beat … all ran".
// DEFAULTS is now a verbatim mirror of the canon file, and the selftest asserts
// that parity against the real file so this drift cannot recur silently.
const DEFAULTS = {
  order: [
    { name: "capture",        script: "capture.mjs",        args: ["pull"] },
    { name: "fsrs",           script: "fsrs.mjs",           args: [] },
    { name: "capsule_bridge", script: "capsule_bridge.mjs", args: [] },
    { name: "calibration",    script: "calibration.mjs",    args: [] },
    { name: "nemesis",        script: "nemesis.mjs",        args: [] },
    { name: "learning_state", script: "learning_state.mjs", args: [] },
    { name: "timeaudit",      script: "timeaudit.mjs",      args: ["pulse"] },
    { name: "shipped",        script: "shipped.mjs",        args: [] },
  ],
  timeout_ms: 120000,
};

const localDate = (now) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

// E2E audit (25 Jul 2026): an order entry only has to be JSON-valid to reach
// runAgent — and JSON-valid is not shape-valid. `{"order":["capture"]}` or an
// entry that lost its `script` key parses fine, so the "malformed → defaults"
// catch below never fires; the damage lands later, in runAgent's join().
// One shape gate, used by BOTH the loader and the runner.
const validEntry = (e) =>
  !!e && typeof e === "object" &&
  typeof e.name === "string" && e.name.length > 0 &&
  typeof e.script === "string" && e.script.length > 0;

// ORGANISM AUDIT #49 — the loader now REPORTS what it did instead of quietly
// substituting. `configured_total` is how many organs the canon asked for, so the
// stdout count can be "6/8", not the self-congratulating "6/6" you get when you
// divide by the survivors. `source` and `dropped` name the degradation out loud
// (the precedent is brain.mjs:106-108, which already announces its own config
// fallback). Nothing here changes WHICH organs beat — only what is admitted.
function loadConfig(path = CFG_PATH) {
  try {
    if (existsSync(path)) {
      const j = JSON.parse(readFileSync(path, "utf8"));
      // E2E audit (25 Jul 2026): was `Array.isArray(j.order) && j.order.length`,
      // which waved through string/shapeless entries. Now junk entries are
      // dropped and the survivors still beat; only a fully-junk order falls back
      // to DEFAULTS, because zero organs beating is worse than a stale order.
      const raw  = Array.isArray(j.order) ? j.order : [];
      const kept = raw.filter(validEntry);
      const dropped = raw.filter(e => !validEntry(e))
        .map(e => (e && typeof e === "object" && typeof e.name === "string") ? e.name : "(malformed)");
      const timeout_ms = typeof j.timeout_ms === "number" ? j.timeout_ms : DEFAULTS.timeout_ms;
      if (kept.length) {
        return {
          order: kept, timeout_ms,
          // the canon asked for `raw.length`; `kept.length` is what survived.
          configured_total: raw.length,
          source: dropped.length ? "canon(partial)" : "canon",
          dropped,
        };
      }
      return {
        order: DEFAULTS.order.slice(), timeout_ms,
        configured_total: DEFAULTS.order.length,
        source: raw.length ? "defaults(every canon entry malformed)" : "defaults(canon order empty)",
        dropped,
      };
    }
  } catch {
    return { order: DEFAULTS.order.slice(), timeout_ms: DEFAULTS.timeout_ms,
      configured_total: DEFAULTS.order.length, source: "defaults(canon unparseable)", dropped: [] };
  }
  return { order: DEFAULTS.order.slice(), timeout_ms: DEFAULTS.timeout_ms,
    configured_total: DEFAULTS.order.length, source: "defaults(canon missing)", dropped: [] };
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
  // E2E audit (25 Jul 2026): join() sits OUTSIDE the try, so a config entry with
  // a non-string `script` threw ERR_INVALID_ARG_TYPE right here and aborted the
  // whole beat — organs already run, pulse.json never written, isolation law
  // ("one agent failing NEVER aborts the pass") broken by a single bad line of
  // canon. A malformed entry is now just another isolated failure.
  if (!validEntry(entry)) {
    const name = (entry && typeof entry.name === "string" && entry.name) ? entry.name : "(malformed)";
    return { name, ran: false, exit: null, ms: 0, note: "malformed config entry" };
  }
  const path = join(scriptsDir, entry.script);
  const t0 = Date.now();
  if (!existsSync(path)) return { name: entry.name, ran: false, exit: null, ms: 0, note: "script missing" };
  try {
    execFn(process.execPath, [path, ...(entry.args || [])], { timeout: timeout_ms, stdio: "pipe" });
    return { name: entry.name, ran: true, exit: 0, ms: Date.now() - t0, note: null };
  } catch (e) {
    const exit = typeof e.status === "number" ? e.status : null;
    // E2E audit (25 Jul 2026): the old test was `e.killed`, which execFileSync
    // NEVER sets — Node's checkExecSyncError ObjectAssigns only the spawnSync
    // result {pid,output,stdout,stderr,status,signal,error} onto the thrown
    // error; `killed` belongs to async ChildProcess. So the timeout branch was
    // dead code and a wedged organ (hung Drive pull) was labelled "spawn error",
    // pointing debugging at permissions instead of the hang. Verified on this
    // machine: a timed-out child throws {code:'ETIMEDOUT', signal:'SIGTERM',
    // status:null, killed:undefined}. e.killed is kept as a fallback so an
    // injected execFn stub can still declare a kill.
    const timedOut = e.code === "ETIMEDOUT" || e.killed === true ||
                     (e.signal === "SIGTERM" && e.status === null);
    const note = timedOut ? "timeout" : (exit !== null ? `exit ${exit}` : "spawn error");
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

// ORGANISM AUDIT #68 (4 Aug 2026) — pulse.status and pulse.low_confidence were
// STRING LITERALS ("ok" / false), computed from nothing, with the `agents` array
// (every organ's real exit code) sitting on the very next line and never read.
// Fed buildPulse eight organs all `ran:false` and it still returned "ok"; the
// selftest's own fixture builds a pulse reading "ok" from 1-of-3 organs and
// prints ALL CHECKS PASSED. No deterministic reader branches on it (verified:
// postmatch.mjs:230 takes only .withheld_disclosures), but pulse.json is pasted
// RAW into three enabled LLM jobs — so the lie is read by the part of the system
// that cannot check it. Now derived, with a have/need counter beside the word so
// the reader never has to trust the word alone (audit #106).
//
// Vocabulary note: "degraded" is the audit's own recommended value, and it is
// safe here in a way it is NOT for loop_vitals — manager.mjs:159/:167 pattern-
// matches `bus.X.status === "ok"` on cards/calibration/weaknesses/learning_state
// only, and nothing anywhere pattern-matches pulse.status.
function pulseHealth(agents, configured_total) {
  const list = Array.isArray(agents) ? agents : [];
  const beat    = list.filter(a => a && a.ran === true && a.exit === 0);
  const skipped = list.filter(a => a && a.ran !== true && a.note === "skipped");
  // anything that was asked to run, was not skipped, and did not come back clean
  const failed  = list.filter(a => a && a.ran !== true && a.note !== "skipped");
  // organs the canon asked for that never even produced a row (a shrunk order)
  const total   = Number.isInteger(configured_total) && configured_total > list.length ? configured_total : list.length;
  const unaccounted = total - list.length;
  const detail = [
    ...failed.map(a => `${a.name}:${a.note || "failed"}`),
    ...skipped.map(a => `${a.name}:skipped`),
    ...(unaccounted > 0 ? [`${unaccounted} organ(s) never reached the beat`] : []),
  ];
  return {
    status: (failed.length || unaccounted > 0) ? "degraded" : "ok",
    // low_confidence is the DATA-SUFFICIENCY half of the house pair: a skipped
    // organ is not a failure, but its file did not refresh, so anything read
    // downstream is thinner than a full beat. That is exactly low confidence.
    low_confidence: failed.length > 0 || skipped.length > 0 || unaccounted > 0,
    organs: {
      configured: total,
      beat: beat.length,
      failed: failed.map(a => a.name),
      skipped: skipped.map(a => a.name),
      // the have/need line, so no surface has to re-derive it from the array
      line: `${beat.length}/${total} organs beat${detail.length ? " — " + detail.join(", ") : " — all ran"}`,
    },
  };
}

function buildPulse({ agents, bus, buckets, ladderCfg, now, configured_total }) {
  const today = localDate(now);
  const lad = ladderRead(bus.readiness, ladderCfg);
  const health = pulseHealth(agents, configured_total);
  return {
    date: today,
    status: health.status,
    low_confidence: health.low_confidence,
    organs: health.organs,
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
  // HONESTY OVER GREEN: a check that could not be run is recorded as UNMEASURED
  // and named in the summary — never rendered as a silent pass.
  const unmeasured = [];
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

  // regression (E2E audit 25 Jul 2026): malformed canon must be an isolated
  // organ failure, not a thrown TypeError that ends the beat. Both of these
  // threw ERR_INVALID_ARG_TYPE out of runAgent before the fix.
  let malThrew = false, mal = null;
  try { mal = runAgent({ name: "noscript" }, 5000, tmp); } catch { malThrew = true; }
  assert("entry missing `script` isolated, never throws", !malThrew && mal && mal.ran === false && mal.note === "malformed config entry");
  let strThrew = false;
  try { runAgent("capture", 5000, tmp); } catch { strThrew = true; }
  assert("bare-string order entry isolated, never throws", !strThrew);

  // regression (E2E audit 25 Jul 2026): loadConfig used to pass any non-empty
  // array straight through — junk entries reached runAgent. Junk is dropped,
  // good entries survive, and an entirely junk order still beats the DEFAULTS.
  const cfgMixed = join(tmp, "hb_cfg_mixed.json");
  writeFileSync(cfgMixed, JSON.stringify({ order: ["capture", { name: "noscript" }, { name: "good", script: "ok.mjs", args: [] }], timeout_ms: 4000 }));
  const loadedMixed = loadConfig(cfgMixed);
  assert("loadConfig drops shapeless order entries, keeps good ones", loadedMixed.order.length === 1 && loadedMixed.order[0].name === "good" && loadedMixed.timeout_ms === 4000);
  const cfgJunk = join(tmp, "hb_cfg_junk.json");
  writeFileSync(cfgJunk, JSON.stringify({ order: ["capture", "fsrs"] }));
  assert("all-junk order falls back to DEFAULTS (never zero organs)", loadConfig(cfgJunk).order.length === DEFAULTS.order.length);

  // ORGANISM AUDIT #49 — the loader must ADMIT a degradation, not perform it in
  // silence. Before this, `loadConfig` returned only {order,timeout_ms}: a
  // missing canon and a healthy canon were indistinguishable to every caller.
  assert("junk fallback names itself as a fallback, not as canon",
    /^defaults\(/.test(loadConfig(cfgJunk).source) && loadConfig(cfgJunk).dropped.length === 2);
  assert("a missing canon file says so", /^defaults\(canon missing/.test(loadConfig(join(tmp, "nope.json")).source));
  const cfgBad = join(tmp, "hb_cfg_bad.json");
  writeFileSync(cfgBad, "{not json");
  assert("an unparseable canon says so (and still beats)",
    loadConfig(cfgBad).source === "defaults(canon unparseable)" && loadConfig(cfgBad).order.length === DEFAULTS.order.length);
  assert("a partially-junk canon reports the CONFIGURED total, not the survivors",
    loadedMixed.configured_total === 3 && loadedMixed.order.length === 1 && loadedMixed.source === "canon(partial)");

  // ORGANISM AUDIT #49 — THE PARITY CHECK THAT WAS MISSING. The old suite
  // asserted `loadConfig(junk).order.length === DEFAULTS.order.length`, i.e. it
  // pinned the fallback to ITSELF, so DEFAULTS could drift away from the canon
  // (6 vs 8 organs) and the suite stayed green. This asserts DEFAULTS against
  // the REAL heartbeat_config.json. It is deliberately NOT fatal when the canon
  // is unreadable — the ladder_config lesson (see :276 below) is that a selftest
  // must not die for a file that isn't its subject — but an unmeasured check is
  // reported as unmeasured, never silently counted as a pass.
  let canonOrder = null;
  try { const c = JSON.parse(readFileSync(CFG_PATH, "utf8")); if (Array.isArray(c.order)) canonOrder = c.order; } catch { /* unreadable */ }
  const sig = (o) => JSON.stringify(o.map(e => [e.name, e.script, (e.args || []).join(" ")]));
  if (canonOrder) {
    assert(`DEFAULTS.order matches the canon heartbeat_config.json verbatim (${canonOrder.length} organs)`,
      sig(canonOrder) === sig(DEFAULTS.order));
  } else {
    unmeasured.push("DEFAULTS.order vs canon heartbeat_config.json (file unreadable)");
    console.log("  ⚠ DEFAULTS.order vs canon parity — NOT MEASURED (heartbeat_config.json unreadable)");
  }

  // regression (E2E audit 25 Jul 2026): a hung organ was reported as
  // "spawn error" because execFileSync never sets e.killed. Real spawn, real
  // kill — the only honest way to pin the label (~0.4s).
  writeFileSync(join(tmp, "hang.mjs"), "Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 5000);");
  const hung = runAgent({ name: "hang", script: "hang.mjs", args: [] }, 400, tmp);
  assert("timed-out organ labelled timeout, not spawn error", hung.ran === false && hung.note === "timeout");

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

  // E2E audit (25 Jul 2026): this read the LIVE ladder_config.json, breaking
  // this selftest's own header promise ("no real state touched") — an ENOENT
  // (file renamed mid genome-review) killed the run before a single check
  // printed, and a legitimate canon edit would fail heartbeat for a defect that
  // isn't heartbeat's. The mapping logic is what's under test, so the tiers are
  // now an inline fixture mirroring ladder_config.json's shape. The live file
  // is still exercised for real in `run` mode via readJson (null-safe there).
  const ladderCfg = {
    GREEN: { drill_modes_allowed: ["recall", "reconstruct", "defend", "novel", "negative_space"], max_drills: 3, sheet_scope: "full", nemesis_headline: "show", due_cards_may_slide: false, first_ball: "winnable_green" },
    AMBER: { drill_modes_allowed: ["recall"], max_drills: 2, sheet_scope: "floor_plus_one", nemesis_headline: "show", due_cards_may_slide: true, first_ball: "winnable_green" },
    RED:   { drill_modes_allowed: ["floor_touch"], max_drills: 1, sheet_scope: "floor_only", nemesis_headline: "withhold_disclose_at_postmatch", due_cards_may_slide: true, first_ball: "five_minute_floor_touch" },
  };
  const ladRed = ladderRead({ verdict: "RED" }, ladderCfg);
  assert("RED ladder → nemesis withholding disclosed", ladRed.withheld.some(w => w.includes("nemesis")));
  const ladAmber = ladderRead({ verdict: "AMBER" }, ladderCfg);
  assert("AMBER caps sheet + drills, keeps nemesis headline", ladAmber.withheld.some(w => w.includes("floor_plus_one")) && ladAmber.withheld.some(w => w.includes("drills limited")) && !ladAmber.withheld.some(w => w.includes("nemesis")));
  const ladNone = ladderRead(null, ladderCfg);
  assert("missing readiness → GREEN (M-1 precedent), zero withholdings", ladNone.verdict === "GREEN" && ladNone.withheld.length === 0);

  const pulse = buildPulse({ agents: results, bus, buckets, ladderCfg, now, configured_total: results.length });
  assert("pulse envelope + disclosures present", pulse.date === "2026-07-12" && Array.isArray(pulse.withheld_disclosures));

  // ORGANISM AUDIT #68 — THIS is the fixture that used to lie. `results` is
  // 1-of-3 organs (ok.mjs ran, bad.mjs exited 3, ghost.mjs is missing) and the
  // pulse built from it reported "status":"ok","low_confidence":false while the
  // whole suite printed ALL CHECKS PASSED. The literal is now a computation.
  assert("a 1-of-3 beat is NOT 'ok' (the fixture that used to lie)",
    pulse.status === "degraded" && pulse.low_confidence === true);
  assert("the pulse carries a have/need counter, not just a word",
    pulse.organs.configured === 3 && pulse.organs.beat === 1 &&
    pulse.organs.failed.join(",") === "bad,ghost" && /^1\/3 organs beat — /.test(pulse.organs.line));
  const allGood = [{ name: "a", ran: true, exit: 0, ms: 1, note: null }, { name: "b", ran: true, exit: 0, ms: 1, note: null }];
  const okPulse = buildPulse({ agents: allGood, bus, buckets, ladderCfg, now, configured_total: 2 });
  assert("a clean beat still reads ok / high-confidence",
    okPulse.status === "ok" && okPulse.low_confidence === false && okPulse.organs.line === "2/2 organs beat — all ran");
  // a --skip is deliberate, so it is not a FAILURE — but that organ's file did
  // not refresh, which is precisely what low_confidence means in this codebase.
  const skipped = buildPulse({ agents: [allGood[0], { name: "b", ran: false, exit: null, ms: 0, note: "skipped" }], bus, buckets, ladderCfg, now, configured_total: 2 });
  assert("a skipped organ is low-confidence but not 'degraded'",
    skipped.status === "ok" && skipped.low_confidence === true && skipped.organs.skipped.join(",") === "b");
  // ORGANISM AUDIT #49 — the amputation case: the canon asked for 8, only 6 rows
  // came back. "6/6 organs beat … all ran" was the exact printed lie.
  const shrunk = buildPulse({ agents: allGood, bus, buckets, ladderCfg, now, configured_total: 8 });
  assert("organs the canon asked for but never beat are counted against the total",
    shrunk.status === "degraded" && /^2\/8 organs beat — 6 organ\(s\) never reached the beat/.test(shrunk.organs.line));

  const p = join(tmp, "pulse.json");
  writeAtomic(p, pulse);
  assert("atomic pulse write lands", existsSync(p) && JSON.parse(readFileSync(p, "utf8")).date === "2026-07-12");

  const passed = checks.every(c => c[1]);
  const tail = unmeasured.length ? ` (${unmeasured.length} NOT MEASURED: ${unmeasured.join("; ")})` : "";
  console.log(passed ? `\nALL CHECKS PASSED${tail}` : `\nSELFTEST FAILED${tail}`);
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
  const pulse = buildPulse({ agents, bus, buckets, ladderCfg, now, configured_total: cfg.configured_total });
  writeAtomic(PULSE, pulse);
  // ORGANISM AUDIT #49 — the denominator is now the CONFIGURED squad, not the
  // survivors, so a shrunk order can no longer print itself a perfect score; and
  // a degraded config announces itself instead of being inferred from a count.
  if (cfg.source && cfg.source !== "canon") {
    console.log(`heartbeat: CONFIG DEGRADED — ${cfg.source}${cfg.dropped && cfg.dropped.length ? ` · dropped: ${cfg.dropped.join(", ")}` : ""} · running ${cfg.order.length} organ(s) from ${cfg.source.startsWith("canon") ? "canon" : "DEFAULTS"}`);
  }
  console.log(`heartbeat: ${pulse.organs.line} · pulse ${pulse.status} · ladder ${pulse.ladder.verdict} → ${PULSE}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { runAgent, staleness, timeauditBridge, ladderRead, buildPulse, pulseHealth, loadConfig, DEFAULTS };
