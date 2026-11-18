#!/usr/bin/env node
// ============================================================================
// keeper.mjs · ARSENAL AI FC — A RESIDENT NEVER EXITS ON ITS OWN (15 Oct 2026)
// ----------------------------------------------------------------------------
// WHY (forks rows 746 (2) / 753 (2); cloud/V746/SPEC_KEEPER.md, every cause MEASURED):
//   a resident daemon that EXITS has no one left to relaunch it.
//   · brain.mjs RETIRES by design when its own source changes (the KAAM 1 scar), and
//     the arm that relaunched it, daemon_watchdog.mjs, became a reporter on 28 Aug.
//     15 Oct 01:16 IST: acts.mjs landed, the resident retired, :4116 stayed dark.
//   · under WinSW a child exit made the wrapper a ZOMBIE (11 Oct 21:43): its restart
//     failed opening the SCM database, zero children, SCM still reading RUNNING.
//   · under a fire-and-forget task (hidden_run.vbs) the task has already ended.
// THE FIX, ONE FOR EVERY DAEMON (a brain-only keeper is a patch, row 753 (2)): what
//   the OS launches is the KEEPER. It spawns the real loop as a WORKER, waits, and acts
//   on the worker's exit code. It never exits on its own, so a WinSW wrapper never sees
//   its child exit; its own code going stale is harmless (it only spawns and waits).
//   brain.mjs `daemon` is the first consumer; each other resident adopts it when next
//   touched, one landing each.
//
// THE EXIT-CODE CONTRACT (KEEP_EXIT, the sysexits.h meanings):
//   0   a clean stop (a signal reached the worker)   → the keeper stops too
//   75  RETIRED (EX_TEMPFAIL): its source changed    → respawn AT ONCE, on the new code
//   69  ALREADY RESIDENT (EX_UNAVAILABLE)            → wait poll_ms, then try again
//   78  REFUSED (EX_CONFIG): ANTHROPIC_API_KEY set   → the keeper STOPS, never a loop
//   any other exit, or a death by signal = a CRASH   → respawn after 10 / 30 / 60 s,
//       reset after a worker that ran an hour: the services' own onfailure and
//       resetfailure lines (services.mjs), which the selftest bites.
// BEFORE EVERY SPAWN the keeper bind-tests the worker's port (the worker's own singleton
//   test): held → wait poll_ms and spawn nothing, so a second keeper idles.
// SIGNALS: SIGINT / SIGTERM end the respawning. POSIX: forwarded to the worker. Windows:
//   NOT forwarded, because child.kill() there is a hard kill mid-beat, and the worker
//   shares the console, so the same Ctrl+C reaches it; the keeper waits for its clean stop.
//
// MODES: selftest · help (an unknown mode REFUSES, exit 2). Module: keep(), KEEP_EXIT, portFree,
//   JUDGE_PORT, holdJudgePort, judgeHeld (the judge round's port, unit mlv0), retireWhenIdle,
//   KEEP_POLL_MS (the deferred retire, units mlv1-mlv3).
// WRITES: nothing. One worker at a time, one log line per decision.
// ============================================================================

import { spawn as nodeSpawn } from "node:child_process";
import { createServer } from "node:net";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const KEEP_EXIT = Object.freeze({ CLEAN: 0, ALREADY_RESIDENT: 69, RETIRED: 75, REFUSED: 78 });
const BACKOFF_MS = [10000, 30000, 60000];   // services.mjs: <onfailure action="restart" delay="10 / 30 / 60 sec"/>
const RESET_MS = 3600000;                    // services.mjs: <resetfailure>1 hour</resetfailure>

// decide: PURE. What the keeper does after a worker exits.
function decide(code, signal, { stopping = false, crashes = 0, ranMs = 0, pollMs = KEEP_POLL_MS } = {}) {
  if (stopping) return { act: "stop", crashes, why: "a signal asked the keeper to stop" };
  if (code === KEEP_EXIT.CLEAN && !signal) return { act: "stop", crashes, why: "the worker stopped clean" };
  if (code === KEEP_EXIT.REFUSED) return { act: "stop", crashes, why: "REFUSED, ANTHROPIC_API_KEY is set: unset it and restart" };
  if (code === KEEP_EXIT.RETIRED) return { act: "respawn", waitMs: 0, crashes: 0, why: "RETIRED, its own source changed: the new code runs now" };
  if (code === KEEP_EXIT.ALREADY_RESIDENT) return { act: "respawn", waitMs: pollMs, crashes, why: "ALREADY RESIDENT, another instance holds it" };
  const n = ranMs >= RESET_MS ? 0 : crashes;
  return { act: "respawn", waitMs: BACKOFF_MS[Math.min(n, BACKOFF_MS.length - 1)], crashes: n + 1, why: `a crash (${signal ? `signal ${signal}` : `exit ${code}`})` };
}

// portFree: the worker's own singleton test. Bind 127.0.0.1:<port>, release it at once.
export const portFree = (port) => new Promise((res) => {
  const s = createServer();
  s.once("error", () => res(false));
  s.listen(port, "127.0.0.1", () => s.close(() => res(true)));
});
// nap: a wait that a stop cuts short, read every 500 ms (brain's own beat wait).
const nap = (ms, cut) => new Promise((res) => {
  let el = 0;
  const iv = setInterval(() => { el += 500; if (cut() || el >= ms) { clearInterval(iv); res(); } }, 500);
});

// THE JUDGE PORT (unit mlv0, forks row 1031 M4 A, ci/mcr/MLIVE_SPEC.md §5 M4): a judge round
//   (`gaffer_brain.mjs judge`) HOLDS this port for its life, the brain's singleton-by-bind
//   shape, so a killed round frees it with no marker left behind. Every retire under a keeper
//   and `services.mjs status` read it: held = a round is running = no retire.
//   Port registry: 4111 turnstile · 4112 cortex · 4113 thalamus · 4114 dugout · 4115 brain
//   tick-lock · 4116 brain daemon-singleton · 4117 sitting · 4118 the judge round.
export const JUDGE_PORT = 4118;
/** holdJudgePort: bind JUDGE_PORT for this process's life. Resolves the server (close() it
 *  when the round ends) or null when another round already holds it (never a refusal here).
 *  @param {number} [port] */
export const holdJudgePort = (port = JUDGE_PORT) => new Promise((res) => {
  const s = createServer();
  s.once("error", () => res(null));
  s.listen(port, "127.0.0.1", () => { s.unref(); res(s); });
});
/** judgeHeld: true while a judge round holds its port. @param {number} [port] */
export const judgeHeld = async (port = JUDGE_PORT) => !(await portFree(port));

// RETIRE WHEN IDLE (units mlv1 / mlv2 / mlv3, forks row 1031 M0 A: THE KEEPER WITH A DEFERRED RETIRE). The brain's
//   retire rule (sourceGraph / staleSources: the whole local import closure, strict ">" against this process's own boot
//   instant, no tolerance) for a resident that holds LIVE WORK: it retires ONLY when its own `idle()` predicate says so
//   AND no judge round holds JUDGE_PORT. Busy = the retire is DEFERRED (one log line per reason), never skipped: it is
//   re-checked on every write in the closure's directories (fs.watch), on every `check()` the unit calls at the moment
//   it becomes idle, and on the keeper's own poll as the floor. `retire(moved)` is the unit's own clean exit with
//   KEEP_EXIT.RETIRED; its keeper respawns it on the new bytes at once.
export const KEEP_POLL_MS = 75000;   // the keeper's own default poll (keep()'s pollMs below, brain_config's daemon.poll_ms default)
/** @param {{ name: string, entry: string, idle: () => boolean | Promise<boolean>, retire: (moved: Array<{path: string, mtime_ms: number}>) => any,
 *    log?: (line: string) => void, bootMs?: number, pollMs?: number, judge?: () => Promise<boolean>, watch?: Function | null }} o */
export async function retireWhenIdle({ name, entry, idle, retire, log = console.log, bootMs = Date.now() - process.uptime() * 1000,
  pollMs = KEEP_POLL_MS, judge = () => judgeHeld(), watch = null } = {}) {
  const { sourceGraph, staleSources } = await import("./brain.mjs");
  const { readFileSync, statSync, watch: fsWatch } = await import("node:fs");
  const files = sourceGraph(entry, (p) => readFileSync(p, "utf8"));
  let done = false, deferred = null, running = false, again = false;
  const watchers = [];
  const stop = () => { done = true; clearInterval(iv); for (const w of watchers) { try { w.close(); } catch { /* gone */ } } };
  const check = async () => {
    if (done) return false;
    if (running) { again = true; return false; }   // a check asked for mid-check runs once more after it, never lost
    running = true;
    try {
      const moved = staleSources(files, bootMs, (p) => statSync(p).mtimeMs);
      if (!moved.length) return false;
      const why = !(await idle()) ? "it is holding live work" : (await judge()) ? `a judge round holds :${JUDGE_PORT}` : null;
      if (why) {
        if (deferred !== why) log(`${name}: retire DEFERRED — ${moved.length} file(s) of its closure moved after boot (${moved.map((m) => m.path.split(/[\\/]/).pop()).join(", ")}), but ${why}; it retires the moment that ends.`);
        deferred = why;
        return false;
      }
      stop();
      log(`${name}: RETIRING — booted ${new Date(bootMs).toISOString()}, and ${moved.length} file(s) of its closure moved after that: ${moved.map((m) => `${m.path.split(/[\\/]/).pop()} @ ${new Date(m.mtime_ms).toISOString()}`).join(" · ")}. Idle, no judge round: exiting ${KEEP_EXIT.RETIRED}, its keeper respawns it on the new bytes at once.`);
      await retire(moved);
      return true;
    } finally { running = false; if (again && !done) { again = false; setImmediate(() => { check(); }); } }
  };
  const iv = setInterval(() => { check(); }, pollMs);
  if (iv.unref) iv.unref();
  const w = watch === null ? fsWatch : watch;
  if (w) {
    for (const dir of [...new Set(files.map((f) => f.replace(/[\\/][^\\/]+$/, "")))]) {
      try { const h = w(dir, () => { check(); }); if (h && h.unref) h.unref(); watchers.push(h); } catch { /* the poll is the floor */ }
    }
  }
  return { check, stop, files };
}

/** keep: run `worker` (an argv, [0] the executable) for ever under the contract above.
 *  Every effect is injected, so the selftest drives each branch with a FAKE spawn.
 *  @param {{ name: string, worker: string[], port?: number | null, pollMs?: number, log?: (line: string) => void,
 *    spawn?: (argv: string[]) => any, sleep?: (ms: number, cut: () => boolean) => Promise<void>,
 *    portIsFree?: (port: number) => Promise<boolean>, now?: () => number, platform?: string, signals?: any }} [opts] */
export async function keep({ name, worker, port = null, pollMs = KEEP_POLL_MS, log = console.log,
  spawn = (argv) => nodeSpawn(argv[0], argv.slice(1), { stdio: "inherit" }),
  sleep = nap, portIsFree = portFree, now = Date.now, platform = process.platform, signals = process } = {}) {
  let stopping = false, child = null, crashes = 0, spawns = 0, waiting = false;
  const onSig = (sig) => {
    stopping = true;
    const fwd = !!child && platform !== "win32";
    log(`${name}: keeper got ${sig}, no more respawns${fwd ? "; forwarded to the worker" : ""}`);
    if (fwd) { try { child.kill(sig); } catch { /* the worker is already gone */ } }
  };
  const onInt = () => onSig("SIGINT"), onTerm = () => onSig("SIGTERM");
  signals.on("SIGINT", onInt); signals.on("SIGTERM", onTerm);
  log(`${name}: keeper up (pid ${process.pid}), worker \`${worker.slice(1).join(" ")}\`: a retire respawns it at once, a crash after ${BACKOFF_MS.map((m) => m / 1000).join(" / ")} s, a refusal stops it`);
  try {
    while (!stopping) {
      if (port != null && !(await portIsFree(port))) {
        if (!waiting) log(`${name}: keeper waiting, :${port} is held by another instance; spawning nothing, probing every ${Math.round(pollMs / 1000)} s`);
        waiting = true;
        await sleep(pollMs, () => stopping);
        continue;
      }
      waiting = false;
      const t0 = now();
      child = spawn(worker); spawns++;
      const { code, signal } = await new Promise((res) => {
        child.once("exit", (c, s) => res({ code: c, signal: s }));
        child.once("error", (e) => res({ code: null, signal: String((e && e.code) || e) }));
      });
      child = null;
      const ran = now() - t0, d = decide(code, signal, { stopping, crashes, ranMs: ran, pollMs });
      crashes = d.crashes;
      log(`${name}: worker exit ${code == null ? `by ${signal}` : code} after ${Math.round(ran / 1000)} s: ${d.why}; ${d.act === "stop" ? "keeper stops" : d.waitMs ? `respawn in ${d.waitMs / 1000} s` : "respawn now"}`);
      if (d.act === "stop") return { stopped: d.why, spawns };
      if (d.waitMs) await sleep(d.waitMs, () => stopping);
    }
    return { stopped: "a signal asked the keeper to stop", spawns };
  } finally {
    signals.off("SIGINT", onInt); signals.off("SIGTERM", onTerm);
  }
}

// ---- selftest: a FAKE spawn, a fake clock, fake signals; each branch planted both ways ----
async function selftest() {
  const { EventEmitter } = await import("node:events");
  let pass = 0, fail = 0;
  const ok = (what, cond, got = "") => { if (cond) pass++; else { fail++; console.log(`  FAIL ${what}${got ? ` · ${got}` : ""}`); } };
  // run: worker k exits as script[k] says ({code, signal, ranMs}); held[i] = probe i finds the port held
  const run = async (script, { port = null, held = [], platform = "linux", sigAt = -1 } = {}) => {
    const sleeps = [], argvs = [], killed = [], sig = new EventEmitter(), probes = [...held];
    let clock = 0;
    const spawn = (argv) => {
      const c = new EventEmitter(), k = argvs.length;
      c.kill = (s) => { killed.push(s); };
      argvs.push(argv);
      setImmediate(() => {
        if (k === sigAt) sig.emit("SIGTERM");
        const r = script[k] || { code: 0 };
        clock += r.ranMs || 1000;
        c.emit("exit", r.code === undefined ? null : r.code, r.signal || null);
      });
      return c;
    };
    const res = await keep({ name: "t", worker: ["node", "w.mjs", "daemon-worker", "--dry"], port, pollMs: 75000, log: () => {},
      spawn, sleep: async (ms) => { sleeps.push(ms); }, portIsFree: async () => !probes.shift(), now: () => clock, platform, signals: sig });
    return { res, sleeps: sleeps.join(","), spawns: argvs.length, argv: argvs[0], killed: killed.join(","), left: sig.listenerCount("SIGINT") + sig.listenerCount("SIGTERM") };
  };
  let r = await run([{ code: 75 }, { code: 0 }]);
  ok("RETIRED (75) respawns AT ONCE: two spawns and no wait", r.spawns === 2 && r.sleeps === "", `spawns ${r.spawns} · waits [${r.sleeps}]`);
  r = await run([{ code: 69 }, { code: 0 }]);
  ok("ALREADY RESIDENT (69) waits poll_ms, then respawns", r.spawns === 2 && r.sleeps === "75000", `spawns ${r.spawns} · waits [${r.sleeps}]`);
  r = await run([{ code: 78 }, { code: 0 }]);
  ok("REFUSED (78) STOPS the keeper: one spawn, no wait, the refusal named", r.spawns === 1 && r.sleeps === "" && /REFUSED/.test(r.res.stopped), `spawns ${r.spawns} · ${r.res.stopped}`);
  r = await run([{ code: 1 }, { code: 1 }, { code: 1 }, { code: 1 }, { code: 0 }]);
  ok("a CRASH backs off 10 / 30 / 60 s and holds at 60", r.spawns === 5 && r.sleeps === "10000,30000,60000,60000", `waits [${r.sleeps}]`);
  r = await run([{ code: 1 }, { code: 1, ranMs: 3600000 }, { code: 0 }]);
  ok("a worker that ran an hour resets the backoff (10 s again, never 30)", r.sleeps === "10000,10000", `waits [${r.sleeps}]`);
  r = await run([{ signal: "SIGKILL" }, { code: 0 }]);
  ok("a death by signal is a crash, never a clean stop", r.spawns === 2 && r.sleeps === "10000", `spawns ${r.spawns} · waits [${r.sleeps}]`);
  r = await run([{ code: 0 }, { code: 0 }]);
  ok("a clean exit (0) stops the keeper: one spawn, no wait", r.spawns === 1 && r.sleeps === "" && /clean/.test(r.res.stopped), `spawns ${r.spawns}`);
  ok("the worker argv reaches spawn untouched (flags ride through)", JSON.stringify(r.argv) === JSON.stringify(["node", "w.mjs", "daemon-worker", "--dry"]), JSON.stringify(r.argv));
  r = await run([{ code: 0 }], { port: 4116, held: [true, true] });
  ok("a HELD port spawns nothing and waits poll_ms per probe (a second keeper idles)", r.spawns === 1 && r.sleeps === "75000,75000", `spawns ${r.spawns} · waits [${r.sleeps}]`);
  r = await run([{ code: 0 }], { port: 4116 });
  ok("a FREE port spawns at once", r.spawns === 1 && r.sleeps === "", `waits [${r.sleeps}]`);
  r = await run([{ code: 75 }, { code: 0 }], { sigAt: 0, platform: "linux" });
  ok("POSIX: SIGTERM is forwarded to the worker, and even a RETIRED exit is not respawned after it", r.killed === "SIGTERM" && r.spawns === 1, `killed [${r.killed}] · spawns ${r.spawns}`);
  r = await run([{ code: 75 }, { code: 0 }], { sigAt: 0, platform: "win32" });
  ok("Windows: SIGTERM is NOT forwarded (a hard kill there), and nothing is respawned after it", r.killed === "" && r.spawns === 1, `killed [${r.killed}] · spawns ${r.spawns}`);
  ok("the keeper removes its signal handlers when it returns", r.left === 0, `${r.left} left`);
  ok("KEEP_EXIT is frozen and its four codes are distinct", Object.isFrozen(KEEP_EXIT) && new Set(Object.values(KEEP_EXIT)).size === 4);
  const jh = await holdJudgePort(0);   // port 0: the OS picks a free one, so the selftest never touches the live judge port
  const jp = jh && jh.address().port;
  const held = jp ? await judgeHeld(jp) : null;
  if (jh) await new Promise((r) => jh.close(r));
  const freed = jp ? !(await judgeHeld(jp)) : null;
  ok("THE JUDGE PORT: a held round reads held, and its close frees it (unit mlv0, row 1031 M4 A)", held === true && freed === true, `held ${held} · freed ${freed}`);
  {
    const { mkdtempSync, writeFileSync: wf, utimesSync, rmSync } = await import("node:fs");
    const { tmpdir } = await import("node:os");
    const d = mkdtempSync(join(tmpdir(), "keeper-st-")), e = join(d, "u.mjs");
    wf(e, 'import "./dep.mjs";\n'); wf(join(d, "dep.mjs"), "export {};\n");
    const boot = Date.now() - 60000; utimesSync(e, new Date(boot - 1000), new Date(boot - 1000)); utimesSync(join(d, "dep.mjs"), new Date(boot + 1000), new Date(boot + 1000));
    let busy = true, judging = false; const retired = [], logs = [];
    const r = await retireWhenIdle({ name: "t", entry: e, bootMs: boot, idle: () => !busy, judge: async () => judging, retire: (m) => { retired.push(m.map((x) => x.path)); }, log: (l) => logs.push(l), watch: false, pollMs: 1 << 30 });
    const a1 = await r.check(); busy = false; judging = true; const a2 = await r.check(); judging = false; const a3 = await r.check();
    r.stop(); rmSync(d, { recursive: true, force: true });
    ok("RETIRE WHEN IDLE: busy defers, a held judge port defers, idle + free retires ONCE naming the moved import (units mlv1-mlv3)",
      a1 === false && a2 === false && a3 === true && retired.length === 1 && /dep\.mjs$/.test(retired[0][0]) && logs.filter((l) => /DEFERRED/.test(l)).length === 2, `${a1}/${a2}/${a3} · retired ${retired.length} · ${logs.length} log line(s)`);
  }
  const svc = join(dirname(fileURLToPath(import.meta.url)), "services.mjs");
  const xml = existsSync(svc) ? readFileSync(svc, "utf8") : "";
  const delays = [...xml.matchAll(/<onfailure action="restart" delay="(\d+) sec"\/>/g)].map((m) => Number(m[1]) * 1000);
  ok("the backoff IS the services' own: services.mjs's onfailure delays and its 1-hour resetfailure", delays.join(",") === BACKOFF_MS.join(",") && /<resetfailure>1 hour<\/resetfailure>/.test(xml) && RESET_MS === 3600000, xml ? `services.mjs delays [${delays.join(",")}]` : "no services.mjs beside keeper.mjs");
  console.log(`keeper selftest: ${pass} passed, ${fail} failed`);
  return fail === 0;
}

async function main() {
  const mode = (process.argv[2] || "help").toLowerCase();
  if (mode === "selftest") process.exit((await selftest()) ? 0 : 1);
  if (mode === "help") { console.log("keeper: a module (brain.mjs `daemon` runs keep() over `daemon-worker`); modes: selftest | help"); return; }
  console.error(`keeper: unknown mode "${mode}", REFUSING; modes: selftest | help`);
  process.exit(2);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();