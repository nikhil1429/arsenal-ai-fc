#!/usr/bin/env node
// ============================================================================
// daemon_watchdog.mjs · ARSENAL AI FC — THE DAEMON WATCHDOG (LADDER D2, 9 Aug 2026)
// ----------------------------------------------------------------------------
// WHY: four resident daemons carry the organism's nervous system — turnstile
//   (:4111), cortex (:4112), thalamus (:4113), the brain pacemaker (:4116) —
//   and until this file, a daemon that died mid-day stayed dead until the NEXT
//   morning conductor (09:15) or a matchday boot. Every afferent in between
//   fell on the floor. This watchdog runs every 10 minutes: probe → relaunch
//   DOWN daemons through the same VBS cloak the conductor uses (a visible
//   console begs to be closed — the 0xC000013A scar) → and, one pass AFTER the
//   thalamus answers again, dispatch the two resyncs that re-deliver what the
//   outage dropped (mcp-memory resync · harvest resync). The delay is the
//   point: a daemon that just booted needs its boot, not a burst of retries.
//
// THE DUGOUT (:4114) IS DELIBERATELY EXCLUDED. It is HIS interactive voice
//   surface — it opens when he opens it, dies when he closes it, and a watchdog
//   relaunching it headless every 10 minutes would be the machine overriding
//   his own hands. Its lanes already run headless via ArsenalFC-DugoutReminders
//   and ArsenalFC-ShadowDetect (fixed in LADDER A2).
//
// LAWS: sole writer of daemon_watchdog.json · never kills anything (relaunch
//   only — EADDRINUSE singletons make a double-start harmless) · resync is
//   dispatched at most once per recovery · every decision is recorded.
// MODES: pass (default) · status · selftest
// ============================================================================

import { readFileSync, writeFileSync, renameSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
import { portOpen, launchDetached } from "./conductor.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = process.env.ARSENAL_WATCHDOG_STATE_DIR || join(__dirname, "..", "dressing-room", "state");
const STATE = () => join(STATE_DIR, "daemon_watchdog.json");

// The four residents. args = exactly what their installers/conductor launch.
export const DAEMONS = [
  { name: "turnstile", port: 4111, args: ["scripts/turnstile.mjs"] },
  { name: "cortex",    port: 4112, args: ["scripts/cortex.mjs"] },
  { name: "thalamus",  port: 4113, args: ["scripts/thalamus.mjs"] },
  { name: "brain",     port: 4116, args: ["scripts/brain.mjs", "daemon"] },   // :4115 is the tick LOCK; :4116 is the daemon singleton
];

const readJson = (p) => { try { return JSON.parse(readFileSync(p, "utf8")); } catch { return null; } };
function writeAtomic(path, obj) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(obj, null, 2));
  renameSync(tmp, path);
}

// ── PURE CORE — one pass, fully injected ────────────────────────────────────
// prev = last pass's state ({ports: {name: bool}, thalamus_down_since, resync_pending}).
// Returns { state, actions } — the CLI layer performs actions (launch/resync).
export function decidePass(prev, probes, nowIso) {
  const p = prev || { ports: {}, thalamus_down_since: null, resync_pending: false, resyncs: [] };
  const actions = { launch: [], resync: false };
  const ports = {};
  for (const d of DAEMONS) {
    ports[d.name] = probes[d.name] === true;
    if (!ports[d.name]) actions.launch.push(d.name);
  }
  let { thalamus_down_since, resync_pending } = p;
  if (!ports.thalamus) {
    // down now — remember since when, and arm the resync for after it recovers
    thalamus_down_since = thalamus_down_since || nowIso;
    resync_pending = true;
  } else if (resync_pending && p.ports && p.ports.thalamus === true) {
    // THE NEXT-PASS RULE: it answered LAST pass too (a full pass of boot time) —
    // now the dropped deliveries get re-driven, exactly once per recovery.
    actions.resync = true;
    resync_pending = false;
    thalamus_down_since = null;
  }
  // (thalamus up this pass but was down last pass ⇒ hold the resync one more
  // pass — p.ports.thalamus === false keeps resync_pending true above.)
  return {
    state: { at: nowIso, ports, thalamus_down_since, resync_pending, resyncs: p.resyncs || [] },
    actions,
  };
}

async function pass(deps = {}) {
  const nowIso = (deps.now || new Date()).toISOString();
  const probes = {};
  for (const d of DAEMONS) {
    probes[d.name] = await (deps.probe || portOpen)(d.port);
  }
  const prev = deps.prev !== undefined ? deps.prev : readJson(STATE());
  const { state, actions } = decidePass(prev, probes, nowIso);
  for (const name of actions.launch) {
    const d = DAEMONS.find((x) => x.name === name);
    try { (deps.launch || launchDetached)(d.args); state.ports[`${name}_relaunched`] = true; } catch { }
  }
  if (actions.resync) {
    const ran = [];
    for (const argv of [["mcp-memory.mjs", "resync"], ["harvest.mjs", "resync"]]) {
      try {
        const out = (deps.exec || ((a) => execFileSync(process.execPath, [join(__dirname, a[0]), ...a.slice(1)], { encoding: "utf8", timeout: 60000 })))(argv);
        ran.push({ cmd: argv.join(" "), ok: true, said: String(out).trim().slice(0, 120) });
      } catch (e) {
        ran.push({ cmd: argv.join(" "), ok: false, error: String((e && e.message) || e).slice(0, 120) });
      }
    }
    state.resyncs = [...(state.resyncs || []), { at: nowIso, ran }].slice(-20);
  }
  if (!deps.dry) writeAtomic(STATE(), state);
  return { state, actions };
}

// ── CLI ─────────────────────────────────────────────────────────────────────
async function main() {
  const mode = process.argv[2] || "pass";
  if (mode === "selftest") process.exit((await selftest()) ? 0 : 1);
  if (mode === "status") {
    const s = readJson(STATE());
    if (!s) { console.log("daemon_watchdog: never run"); return; }
    console.log(`daemon_watchdog: last pass ${s.at} · ${DAEMONS.map((d) => `${d.name} ${s.ports[d.name] ? "UP" : "DOWN"}`).join(" · ")}${s.resync_pending ? " · resync ARMED (fires one pass after the thalamus answers)" : ""} · ${(s.resyncs || []).length} resync(s) ever`);
    return;
  }
  const { state, actions } = await pass();
  const up = DAEMONS.filter((d) => state.ports[d.name]).length;
  console.log(`daemon_watchdog: ${up}/${DAEMONS.length} up${actions.launch.length ? ` · relaunched: ${actions.launch.join(", ")} (detached via the VBS cloak — health lives in their own logs)` : ""}${actions.resync ? " · RESYNC dispatched (mcp-memory + harvest) — the outage's dropped deliveries re-driven" : ""}`);
}

// ── SELFTEST — hermetic, injected, every check can fail ─────────────────────
async function selftest() {
  let pass2 = 0, fail = 0;
  const assert = (n, c) => { if (c) { pass2++; console.log(`  ✓ ${n}`); } else { fail++; console.log(`  ✗ ${n}`); } };
  console.log("== daemon_watchdog selftest ==\n");
  const T = (h) => `2026-08-09T${String(h).padStart(2, "0")}:00:00.000Z`;

  assert("the dugout (:4114) is EXCLUDED — his surface, never the watchdog's",
    !DAEMONS.some((d) => d.port === 4114) && DAEMONS.length === 4
    && DAEMONS.find((d) => d.name === "brain").port === 4116);

  const allUp = { turnstile: true, cortex: true, thalamus: true, brain: true };
  const d1 = decidePass(null, allUp, T(10));
  assert("all up ⇒ no launches, no resync, clean state",
    d1.actions.launch.length === 0 && d1.actions.resync === false && d1.state.resync_pending === false);

  const thalDown = { ...allUp, thalamus: false, brain: false };
  const d2 = decidePass(d1.state, thalDown, T(11));
  assert("a down daemon is relaunched; thalamus-down arms the resync and stamps since-when",
    d2.actions.launch.join(",") === "thalamus,brain"
    && d2.state.resync_pending === true && d2.state.thalamus_down_since === T(11));

  const d3 = decidePass(d2.state, allUp, T(12));
  assert("THE NEXT-PASS RULE — the pass where it first answers does NOT resync (boot time is boot time)",
    d3.actions.resync === false && d3.state.resync_pending === true);

  const d4 = decidePass(d3.state, allUp, T(13));
  assert("…and the pass AFTER that dispatches the resync exactly once, then disarms",
    d4.actions.resync === true && d4.state.resync_pending === false && d4.state.thalamus_down_since === null
    && decidePass(d4.state, allUp, T(14)).actions.resync === false);

  const d5 = decidePass(d2.state, thalDown, T(12));
  assert("still down ⇒ keeps the ORIGINAL down-since stamp (the outage is one outage)",
    d5.state.thalamus_down_since === T(11) && d5.actions.launch.includes("thalamus"));

  // the full pass() with injected probe/launch/exec — no real ports, no real spawns
  {
    const launched = [];
    const execs = [];
    const r = await pass({
      dry: true, prev: d3.state, now: new Date(T(13)),
      probe: async () => true,
      launch: (a) => launched.push(a.join(" ")),
      exec: (a) => { execs.push(a.join(" ")); return "ok"; },
    });
    assert("pass() drives the decision: recovery pass runs BOTH resyncs (mcp-memory + harvest), records both",
      launched.length === 0 && execs.length === 2
      && execs[0] === "mcp-memory.mjs resync" && execs[1] === "harvest.mjs resync"
      && r.state.resyncs.length === 1 && r.state.resyncs[0].ran.every((x) => x.ok));
  }

  console.log(`\ndaemon_watchdog selftest: ${pass2} passed, ${fail} failed`);
  return fail === 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
