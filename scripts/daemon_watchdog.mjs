#!/usr/bin/env node
// ============================================================================
// daemon_watchdog.mjs · ARSENAL AI FC — THE DAEMON WATCHDOG (LADDER D2, 9 Aug 2026)
// ----------------------------------------------------------------------------
// WHY: the resident daemons carry the organism's nervous system — turnstile
//   (:4111), cortex (:4112), thalamus (:4113), the brain pacemaker (:4116), and
//   since 10 Aug 2026 the ambient context bridge (no port — see DAEMONS) —
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
//   dispatched at most once per recovery · every decision is recorded ·
//   conductor.json is READ-ONLY here and the only cross-organ write is through
//   an owner's own CLI (captains_call.mjs file), never into its file.
// MODES: pass (default) · status · selftest
// ============================================================================

import { readFileSync, writeFileSync, renameSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
import { portOpen, launchDetached, processStartMs } from "./conductor.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = join(__dirname, "..");
// READ-ONLY. The manual restart verb — the same file watchman.mjs:750 points him at.
// The selftest reads it to prove the table below still matches the real logon lane.
const DAEMONS_VBS = join(REPO, "setup", "START_DAEMONS.vbs");
const STATE_DIR = process.env.ARSENAL_WATCHDOG_STATE_DIR || join(__dirname, "..", "dressing-room", "state");
const STATE = () => join(STATE_DIR, "daemon_watchdog.json");
// The morning chain's own receipt. Read-only from here — conductor.mjs owns it.
const MORNING_REPORT = () => join(STATE_DIR, "conductor.json");

const localDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const localDayOf = (ts) => { const d = new Date(String(ts || "")); return Number.isFinite(d.getTime()) ? localDate(d) : null; };

// The residents. args = exactly what their installers/conductor launch.
//
// THE 5th RESIDENT WAS MISSING (10 Aug 2026, wire repair). Since D7 (9 Aug) the
// ambient context bridge runs as a logon daemon — it is the LAST line of
// ArsenalFC-Brain.bat and of setup/START_DAEMONS.vbs — and it appeared in no
// liveness table anywhere: not this one, not watchman.mjs's DAEMON_PORTS, not
// conductor.mjs's three `daemon:` steps. Live proof the day it was found: ONE
// `node scripts\context.mjs daemon` in the process table (PID 21308, booted
// 09-08-2026 13:08:39) — running, unprobed, and unrelaunchable if it ever stopped.
// It could have been dark for weeks and nothing in the organism would have said so.
//
// WHY IT NEEDS A DIFFERENT PROBE: the other four hold a localhost port, so "is it
// up" is a TCP connect. The bridge is a POLL, not a server — it holds no port (no
// createServer/listen anywhere in context.mjs). So `match` marks it, and liveness
// comes from the process table via conductor.mjs's own processStartMs(), the same
// exported probe this file already uses for the STALE-BUILD read below. `match` is
// the FULL command tail, never the bare filename, so a `context.mjs once|status`
// invocation can never be mistaken for the resident.
export const DAEMONS = [
  { name: "turnstile", port: 4111, args: ["scripts/turnstile.mjs"] },
  { name: "cortex",    port: 4112, args: ["scripts/cortex.mjs"] },
  { name: "thalamus",  port: 4113, args: ["scripts/thalamus.mjs"] },
  { name: "brain",     port: 4116, args: ["scripts/brain.mjs", "daemon"] },   // :4115 is the tick LOCK; :4116 is the daemon singleton
  { name: "context",   port: null, match: "context.mjs daemon", args: ["scripts/context.mjs", "daemon"] },
];

const readJson = (p) => { try { return JSON.parse(readFileSync(p, "utf8")); } catch { return null; } };
function writeAtomic(path, obj) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(obj, null, 2));
  renameSync(tmp, path);
}

// Liveness for a PORTLESS resident (the context bridge). null means UNKNOWN and
// never "down": off Windows there is no Win32_Process to read at all, so "I could
// not look" is the only honest answer — reporting that as DOWN would relaunch a
// bridge that is very much alive. On Windows a null from the probe IS a real
// not-in-the-table reading, and the confirm rule in decidePass covers the rare
// case where the powershell call itself failed.
// TRAP, hit while proving this live: processStartMs greps the command line of EVERY
// node.exe, so a process that merely MENTIONS the match string reports itself as the
// daemon (a `node -e "…context.mjs daemon…"` probe returned UP for a lane that does
// not exist). The scheduled caller is `node scripts\daemon_watchdog.mjs pass`, which
// contains no such string — but never pass this a substring loose enough to catch a
// bystander, and verify a DOWN reading from a command line that does not name it.
export function processProbe(match, deps = {}) {
  const platform = deps.platform || process.platform;
  if (platform !== "win32") return null;
  try { return (deps.procStart || processStartMs)(match) != null; } catch { return false; }
}

// ── PURE CORE — one pass, fully injected ────────────────────────────────────
// prev = last pass's state ({ports: {name: bool}, unknown: [name], thalamus_down_since,
// resync_pending}). Returns { state, actions } — the CLI layer performs the actions.
export function decidePass(prev, probes, nowIso) {
  const p = prev || { ports: {}, unknown: [], thalamus_down_since: null, resync_pending: false, resyncs: [] };
  const actions = { launch: [], resync: false };
  const ports = {};
  const unknown = [];
  for (const d of DAEMONS) {
    const seen = probes[d.name];
    ports[d.name] = seen === true;
    if (seen === true) continue;
    if (seen == null) { unknown.push(d.name); continue; }   // an unread probe is not a verdict
    // A PORT-LOCKED daemon is relaunched the moment it stops answering: its own
    // EADDRINUSE lock makes a double start harmless — this file's stated law.
    if (d.port != null) { actions.launch.push(d.name); continue; }
    // A PORTLESS one has NO such guard. Two context bridges would both POST the
    // thalamus door, which is the very damage this entry exists to prevent, so it
    // takes this file's OWN next-pass shape (the resync rule below — no new number
    // invented): relaunch only when the PREVIOUS pass also read it genuinely down,
    // never off a single reading, and never off a reading we could not take.
    if (p.ports && p.ports[d.name] === false && !(p.unknown || []).includes(d.name)) actions.launch.push(d.name);
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
    state: { at: nowIso, ports, unknown, thalamus_down_since, resync_pending, resyncs: p.resyncs || [] },
    actions,
  };
}

// One word per daemon, and UNKNOWN is its own word — a probe that could not be taken
// must never print as DOWN (the same honesty the morning read's `verified` flag keeps).
export const upWord = (s, name) =>
  s.ports && s.ports[name] ? "UP" : ((s.unknown || []).includes(name) ? "UNKNOWN" : "DOWN");

// ── THE MORNING REPORT'S FIRST READER (10 Aug 2026, wire repair) ────────────
// conductor.json — the morning chain's own receipt, "what ran, what failed, how
// long, in what order" — had NO reader anywhere in the repo. Only its evening
// twin ever got one (watchman.mjs probeEveningChain, H0, which opens by naming
// the same defect for the evening). Live proof the morning this was found:
// conductor.json (2026-08-10) carried failed=2 with thalamus AND cortex both
// "STALE BUILD" and both clocks named; six hours later the only automated word
// on the subject anywhere was watchman_last.json's "ArsenalFC-Morning-Conductor:
// result 1". The verdict existed, was correct, was specific — and nothing read
// it. He filed c31 BY HAND that same day for the brain daemon's stale code,
// which is the anchor law being paid for in his attention because no organ was
// carrying the verdict for him.
//
// THIS ORGAN, NOT ANOTHER: the watchdog is already the conductor's between-
// mornings deputy for exactly this disease — "a daemon that died mid-day stayed
// dead until the NEXT morning conductor (09:15)". STALE is that same sentence
// with the port still answering. It wakes every 10 minutes and it already
// imports this chain's own probes.
//
// IT PROPOSES, IT NEVER ACTS. Fixing a stale daemon needs a KILL, and both files
// refuse that by law (conductor: "a stale daemon is still never auto-relaunched"
// — the double-ingest scar; here: "never kills anything"). So the verdict rides
// an anchor instead, as ONE captain's-call card per daemon keyed
// `daemon:stale:<name>:<day>` — a ROLLING key, so a 10-minute cron cannot mint a
// second card while the same ask sits unanswered (captains_call fileGuard).
//
// THE DAY GATE: a STALE verdict is a claim about the process the chain probed
// THIS MORNING, and the chain re-issues it every morning — so stale verdicts are
// carried only from today's report; an older one is an old claim, not today's
// silence. `failed` (the whole chain's failed-step names) is carried from the
// last report whatever its day, WITH the day named — exactly how
// probeEveningChain reports its last run. Quiet is not dead at either end.
export function morningDaemonVerdicts(report, today) {
  if (!report || !Array.isArray(report.steps)) return { day: null, started: null, failed: [], stale: [] };
  const day = localDayOf(report.started);
  const failed = report.steps.filter((s) => s && s.ok === false).map((s) => s.id);
  const stale = day !== today ? [] : report.steps
    .filter((s) => s && s.ok === false && /STALE BUILD/.test(String(s.daemon || "")))
    .map((s) => ({ name: s.id, port: s.port == null ? null : s.port, why: String(s.error || s.daemon || "").slice(0, 200) }));
  return { day, started: report.started || null, failed, stale };
}

// A verdict can be OVERTAKEN between 09:15 and now: he reads the card, restarts
// the daemon, and this morning's report still says STALE until tomorrow's chain.
// The process table already knows — conductor.mjs exports the very
// processStartMs() the chain used to catch cortex in the first place. A process
// that booted AFTER the report was written is a DIFFERENT process, so the
// verdict is void. Unknowable (null either side) ⇒ the verdict STANDS, marked
// unverified: an honest unknown, never a fabricated all-clear. No new number —
// the only comparison is the report's own `started` stamp.
export function voidedByRestart(reportStartedMs, procStartMs) {
  if (reportStartedMs == null || procStartMs == null) return false;
  return procStartMs > reportStartedMs;
}

// One card per open stale daemon. The line names the daemon, why it is stale and
// what the machine is NOT allowed to do — c31's own shape, which he wrote by
// hand the day before this organ learned to file it.
export function staleCardArgs(entry, day) {
  return ["captains_call.mjs", "file",
    "--line", `${entry.name} STALE BUILD — purane code pe chal raha hai (aaj ke conductor ne pakda). Restart karun? Live daemon kill sirf aapke word se.`,
    "--key", `daemon:stale:${entry.name}:${day}`];
}

async function pass(deps = {}) {
  const nowIso = (deps.now || new Date()).toISOString();
  const probes = {};
  for (const d of DAEMONS) {
    // Two probes, one table: a port answers, or the process table names it. Both are
    // borrowed from conductor.mjs — this repair added no new instrument.
    probes[d.name] = d.port != null
      ? await (deps.probe || portOpen)(d.port)
      : (deps.procProbe || processProbe)(d.match, deps);
  }
  const prev = deps.prev !== undefined ? deps.prev : readJson(STATE());
  const { state, actions } = decidePass(prev, probes, nowIso);
  const shell = deps.exec || ((a) => execFileSync(process.execPath, [join(__dirname, a[0]), ...a.slice(1)], { encoding: "utf8", timeout: 60000 }));
  for (const name of actions.launch) {
    const d = DAEMONS.find((x) => x.name === name);
    try { (deps.launch || launchDetached)(d.args); state.ports[`${name}_relaunched`] = true; } catch { }
  }
  if (actions.resync) {
    const ran = [];
    for (const argv of [["mcp-memory.mjs", "resync"], ["harvest.mjs", "resync"]]) {
      try {
        const out = shell(argv);
        ran.push({ cmd: argv.join(" "), ok: true, said: String(out).trim().slice(0, 120) });
      } catch (e) {
        ran.push({ cmd: argv.join(" "), ok: false, error: String((e && e.message) || e).slice(0, 120) });
      }
    }
    state.resyncs = [...(state.resyncs || []), { at: nowIso, ran }].slice(-20);
  }

  // ---- the morning report's read (see morningDaemonVerdicts' header) --------
  // The process-table call costs a powershell spawn, so it fires ONLY for a
  // daemon the report actually named stale — a healthy morning pays nothing.
  const today = deps.today || localDate(deps.now || new Date());
  const report = deps.report !== undefined ? deps.report : readJson(MORNING_REPORT());
  const v = morningDaemonVerdicts(report, today);
  const startedMs = v.started ? Date.parse(v.started) : null;
  const stale = [];
  for (const e of v.stale) {
    const d = DAEMONS.find((x) => x.name === e.name);
    const procMs = d ? (deps.procStart || processStartMs)(d.args[0]) : null;
    const cleared = voidedByRestart(startedMs, procMs);
    const row = { ...e, cleared, verified: procMs != null };
    if (!cleared) {
      // The ask goes through captains_call's OWN cli — the owners-only law: this
      // file never touches captains_call.json, and the rolling key means the
      // 10-minute cadence files at most one live card per daemon.
      try { row.card = String(shell(staleCardArgs(e, today))).trim().slice(0, 120); }
      catch (err) { row.card_error = String((err && err.message) || err).slice(0, 120); }
    }
    stale.push(row);
  }
  state.morning_chain = { report_day: v.day, report_started: v.started, failed: v.failed, stale, read_at: nowIso };

  if (!deps.dry) writeAtomic(STATE(), state);
  return { state, actions };
}

// The one-line voice of the morning read — shared by `pass` and `status` so the
// verdict is never visible in only one of them.
export function morningLine(mc) {
  if (!mc || !mc.report_day) return "morning chain: NO report on disk (conductor.json absent — the chain may never have run here)";
  const open = (mc.stale || []).filter((s) => !s.cleared);
  const head = `morning chain (${mc.report_day}): ${(mc.failed || []).length ? `FAILED ${mc.failed.join(", ")}` : "all steps ok"}`;
  if (!(mc.stale || []).length) return head;
  const cleared = (mc.stale || []).filter((s) => s.cleared).map((s) => s.name);
  return `${head} · STALE BUILD: ${open.length ? open.map((s) => s.name + (s.verified ? "" : " (unverified)")).join(", ") + " — card filed, restart needs HIS word" : "none open"}${cleared.length ? ` · cleared by restart since the report: ${cleared.join(", ")}` : ""}`;
}

// ── CLI ─────────────────────────────────────────────────────────────────────
async function main() {
  const mode = process.argv[2] || "pass";
  if (mode === "selftest") process.exit((await selftest()) ? 0 : 1);
  if (mode === "status") {
    const s = readJson(STATE());
    if (!s) { console.log("daemon_watchdog: never run"); return; }
    console.log(`daemon_watchdog: last pass ${s.at} · ${DAEMONS.map((d) => `${d.name} ${upWord(s, d.name)}${d.port == null ? " (process table)" : ""}`).join(" · ")}${s.resync_pending ? " · resync ARMED (fires one pass after the thalamus answers)" : ""} · ${(s.resyncs || []).length} resync(s) ever`);
    console.log(`daemon_watchdog: ${morningLine(s.morning_chain)}`);
    return;
  }
  const { state, actions } = await pass();
  const up = DAEMONS.filter((d) => state.ports[d.name]).length;
  const dark = DAEMONS.filter((d) => upWord(state, d.name) === "DOWN").map((d) => d.name);
  console.log(`daemon_watchdog: ${up}/${DAEMONS.length} up${dark.length ? ` · DOWN: ${dark.join(", ")}` : ""}${(state.unknown || []).length ? ` · UNKNOWN (probe not takeable): ${state.unknown.join(", ")}` : ""}${actions.launch.length ? ` · relaunched: ${actions.launch.join(", ")} (detached via the VBS cloak — health lives in their own logs)` : ""}${actions.resync ? " · RESYNC dispatched (mcp-memory + harvest) — the outage's dropped deliveries re-driven" : ""}`);
  console.log(`daemon_watchdog: ${morningLine(state.morning_chain)}`);
}

// ── SELFTEST — hermetic, injected, every check can fail ─────────────────────
async function selftest() {
  let pass2 = 0, fail = 0;
  const assert = (n, c) => { if (c) { pass2++; console.log(`  ✓ ${n}`); } else { fail++; console.log(`  ✗ ${n}`); } };
  console.log("== daemon_watchdog selftest ==\n");
  const T = (h) => `2026-08-09T${String(h).padStart(2, "0")}:00:00.000Z`;

  assert("the dugout (:4114) is EXCLUDED — his surface, never the watchdog's",
    !DAEMONS.some((d) => d.port === 4114) && DAEMONS.length === 5
    && DAEMONS.find((d) => d.name === "brain").port === 4116);

  // ---- THE 5th RESIDENT (10 Aug 2026 wire repair) --------------------------
  // Every check here fails if the context bridge falls out of the liveness table
  // again — which is the whole defect: it ran as a logon daemon from 9 Aug and no
  // watcher in the organism could say whether it was alive.
  {
    const ctx = DAEMONS.find((d) => d.name === "context");
    assert("THE 5th RESIDENT — the ambient context bridge is IN the table, probed by process (it holds no port)",
      !!ctx && ctx.port === null && ctx.match === "context.mjs daemon"
      && ctx.args.join(" ") === "scripts/context.mjs daemon");
    // SOURCE TRUTH, not prose: the table's launch args must still name the lane the
    // machine actually starts. Rename or drop that VBS line and this goes red.
    const vbs = (() => { try { return readFileSync(DAEMONS_VBS, "utf8"); } catch { return ""; } })();
    assert("THE 5th RESIDENT — the relaunch args match the REAL logon lane in setup/START_DAEMONS.vbs",
      /context\.mjs daemon/.test(vbs) && vbs.includes(ctx.args[0].replace(/\//g, "\\")));
    assert("THE 5th RESIDENT — the process probe: named ⇒ UP · absent ⇒ DOWN · no process table ⇒ UNKNOWN, never DOWN",
      processProbe("context.mjs daemon", { platform: "win32", procStart: () => 1754800000000 }) === true
      && processProbe("context.mjs daemon", { platform: "win32", procStart: () => null }) === false
      && processProbe("context.mjs daemon", { platform: "linux", procStart: () => { throw new Error("must not shell off Windows"); } }) === null);
    // An unread probe must never become a launch — that is how a live bridge gets a twin.
    const unk = decidePass(null, { turnstile: true, cortex: true, thalamus: true, brain: true, context: null }, T(10));
    assert("THE 5th RESIDENT — an UNKNOWN probe launches NOTHING and prints UNKNOWN, not DOWN",
      unk.actions.launch.length === 0 && unk.state.unknown.join(",") === "context"
      && upWord(unk.state, "context") === "UNKNOWN" && upWord(unk.state, "thalamus") === "UP");
    // No EADDRINUSE guard ⇒ one reading is not enough. A port daemon still relaunches at once.
    const ctxDown = { turnstile: true, cortex: true, thalamus: true, brain: true, context: false };
    const c1 = decidePass(null, ctxDown, T(10));
    const c2 = decidePass(c1.state, ctxDown, T(11));
    assert("THE 5th RESIDENT — a portless daemon takes TWO consecutive DOWN readings to relaunch (a flaky probe must not mint a second bridge)",
      c1.actions.launch.length === 0 && c2.actions.launch.join(",") === "context"
      && upWord(c1.state, "context") === "DOWN");
    assert("THE 5th RESIDENT — …and an UNKNOWN in between RESETS the confirm (we never relaunch off a reading we could not take)",
      decidePass(decidePass(c1.state, { ...ctxDown, context: null }, T(11)).state, ctxDown, T(12)).actions.launch.length === 0);
    assert("THE 5th RESIDENT — the four PORT daemons are unchanged: one failed answer is enough (their lock makes a double start harmless)",
      decidePass(null, { ...ctxDown, thalamus: false, context: true }, T(10)).actions.launch.join(",") === "thalamus");
  }

  const allUp = { turnstile: true, cortex: true, thalamus: true, brain: true, context: true };
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
      procProbe: () => true,          // the portless resident's probe, injected — a selftest never shells the live process table
      launch: (a) => launched.push(a.join(" ")),
      exec: (a) => { execs.push(a.join(" ")); return "ok"; },
    });
    assert("pass() drives the decision: recovery pass runs BOTH resyncs (mcp-memory + harvest), records both",
      launched.length === 0 && execs.length === 2
      && execs[0] === "mcp-memory.mjs resync" && execs[1] === "harvest.mjs resync"
      && r.state.resyncs.length === 1 && r.state.resyncs[0].ran.every((x) => x.ok));
  }

  // ---- THE MORNING REPORT'S READ (10 Aug 2026 wire repair) -----------------
  // Every check below fails the moment conductor.json loses its reader again —
  // which is the whole defect: for weeks the report was correct and unread.
  {
    const DAY = "2026-08-10";
    const rep = {
      started: `${DAY}T09:15:02.000+05:30`, ran: 16, ok: 14, failed: 2,
      steps: [
        { id: "mirror", ok: true },
        { id: "thalamus", ok: false, port: 4113, daemon: "STALE BUILD — running code older than the file on disk", error: "booted 2026-08-08T19:47:26.953Z against a module last written 2026-08-09T17:52:58.217Z; restart it to load the repairs" },
        { id: "cortex", ok: false, port: 4112, daemon: "STALE BUILD — running code older than its module graph (via process table)", error: "booted 2026-08-08T19:47:29.714Z; scripts/brain.mjs last written 2026-08-10T03:16:25.258Z — restart it to load the repairs" },
        { id: "turnstile", ok: true, port: 4111, daemon: "already running (build current — via process table)" },
      ],
    };
    const v = morningDaemonVerdicts(rep, DAY);
    assert("MORNING READ — the live 10 Aug report's BOTH stale daemons are read out, with the conductor's own reason kept",
      v.failed.join(",") === "thalamus,cortex" && v.stale.length === 2
      && v.stale.map((s) => s.name).join(",") === "thalamus,cortex"
      && /module last written/.test(v.stale[0].why) && v.stale[1].port === 4112);

    assert("MORNING READ — a clean chain says nothing, and an absent report is silence not failure (quiet ≠ dead)",
      morningDaemonVerdicts({ started: `${DAY}T09:15:02.000+05:30`, steps: [{ id: "mirror", ok: true }] }, DAY).stale.length === 0
      && morningDaemonVerdicts(null, DAY).stale.length === 0 && morningDaemonVerdicts(null, DAY).day === null);

    assert("MORNING READ — THE DAY GATE: yesterday's STALE verdict never speaks as today's, but its failed steps stay named with their day",
      morningDaemonVerdicts(rep, "2026-08-11").stale.length === 0
      && morningDaemonVerdicts(rep, "2026-08-11").failed.length === 2
      && morningDaemonVerdicts(rep, "2026-08-11").day === DAY);

    const t0 = Date.parse(rep.started);
    assert("MORNING READ — a daemon restarted AFTER the report is VOID; before it still stale; an unknown boot clears NOTHING",
      voidedByRestart(t0, t0 + 60000) === true && voidedByRestart(t0, t0 - 60000) === false
      && voidedByRestart(t0, null) === false && voidedByRestart(null, t0) === false);

    // THE WIRE ITSELF: pass() must read the report and hand each open verdict to
    // captains_call's own CLI — never write the card file, never kill anything.
    const calls = [];
    const r = await pass({
      dry: true, prev: null, now: new Date(`${DAY}T18:00:00+05:30`), today: DAY, report: rep,
      probe: async () => true, launch: () => { throw new Error("a stale daemon must never be relaunched — the double-ingest law"); },
      procStart: (rel) => (rel === "scripts/cortex.mjs" ? Date.parse(rep.started) + 3600000 : Date.parse(rep.started) - 3600000),
      exec: (a) => { calls.push(a.join(" ")); return "captains_call: filed c99"; },
    });
    assert("MORNING WIRE — pass() READS conductor.json into state.morning_chain (the whole defect: it was written and never read)",
      r.state.morning_chain && r.state.morning_chain.report_day === DAY
      && r.state.morning_chain.failed.join(",") === "thalamus,cortex" && r.state.morning_chain.stale.length === 2);
    assert("MORNING WIRE — the OPEN verdict rides an anchor: exactly ONE captains_call card, rolling day-key, filed through the OWNER's cli",
      calls.length === 1 && calls[0].startsWith("captains_call.mjs file --line ")
      && / --key daemon:stale:thalamus:2026-08-10$/.test(calls[0]) && /STALE BUILD/.test(calls[0]));
    assert("MORNING WIRE — the daemon restarted since the report is CLEARED and gets NO card (his fix is not re-asked)",
      r.state.morning_chain.stale.find((s) => s.name === "cortex").cleared === true
      && !r.state.morning_chain.stale.find((s) => s.name === "cortex").card
      && r.state.morning_chain.stale.find((s) => s.name === "thalamus").cleared === false);
    assert("MORNING WIRE — the verdict is VISIBLE in both surfaces (pass + status share morningLine), naming the daemon and whose word restarts it",
      /STALE BUILD: thalamus/.test(morningLine(r.state.morning_chain))
      && /HIS word/.test(morningLine(r.state.morning_chain))
      && /cleared by restart since the report: cortex/.test(morningLine(r.state.morning_chain)));
    assert("MORNING WIRE — an unverifiable boot time is marked UNVERIFIED and still asks (never a fabricated all-clear)",
      (await pass({ dry: true, prev: null, now: new Date(`${DAY}T18:00:00+05:30`), today: DAY, report: rep,
        probe: async () => true, launch: () => {}, procStart: () => null, exec: () => "ok" }))
        .state.morning_chain.stale.every((s) => s.cleared === false && s.verified === false));
    assert("MORNING WIRE — it reads the REAL receipt path (a rename of conductor.json must break this, loudly)",
      MORNING_REPORT().replace(/\\/g, "/").endsWith("/dressing-room/state/conductor.json"));
  }

  console.log(`\ndaemon_watchdog selftest: ${pass2} passed, ${fail} failed`);
  return fail === 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
