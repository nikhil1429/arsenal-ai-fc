// ci/mtail/w_preload.mjs — loaded with `node --import <this file's URL> <organ> …` by witness_mtail.mjs, in THAT organ's process only.
// Two seams, each on only when its env names it; neither types a budget, a timeout or a size.
//   MTAIL_SPAWN_LOG set — child_process.spawnSync is wrapped (and the ESM named export re-synced, so an organ's
//     `const { spawnSync } = await import("node:child_process")` gets the wrapper):
//       · `gaffer_brain.mjs judge-due …` → a FAKE judge child: a real node child that runs MTAIL_JUDGE_RUN_MS on the scaled clock
//         (MTAIL_JUDGE_RUN_MS / MTAIL_SCALE real ms) under the organ's OWN timeout, scaled the same way, so the kill (or not) is
//         spawnSync's own; it prints a judge "not due" line when it finishes. The timeout the organ handed is logged UNSCALED.
//       · any other organ script (archivist, captains_call, notes_compiler, …) → not run: a logged exit-0 stub.
//     Nothing else is touched (git, a shell tool: the real spawnSync).
//   ~~MTAIL_ABORT_LOG set — AbortSignal.timeout(ms) is logged UNSCALED and armed at ms / MTAIL_SCALE real ms (the CLI's own wait,
//     on the scaled clock the fake daemon also runs on).~~  (struck by unit mrt, forks row 1120 (1) T2 fate (a) / row 1112 (1))
//   MTAIL_ABORT_LOG set (RE-CUT by unit mrt, forks row 1120 (1): T2 fate (a) RE-BASE naming unit mday, rows 1075 / 1078 F10 A) —
//     AbortSignal.timeout(ms) arms the organ's REAL wait and remembers ms; a fetch wrapper re-arms ONLY the POST /close wait at
//     ms / MTAIL_SCALE real ms (the CLI's own close wait, on the scaled clock the fake daemon also runs on). Every other wait —
//     mday's GET /status probe (daemonUp) in front of the close — keeps its own real wait. Every wait is logged UNSCALED with
//     { ms, method, path, scaled }.
import cp from "node:child_process";
import { syncBuiltinESMExports } from "node:module";
import { appendFileSync } from "node:fs";

const SCALE = Number(process.env.MTAIL_SCALE);
const log = (file, row) => { try { appendFileSync(file, JSON.stringify(row) + "\n"); } catch { /* the witness reads the log; a lost row reads RED there */ } };
const scaled = (ms) => Math.max(1, Math.round(Number(ms) / SCALE));

if (process.env.MTAIL_SPAWN_LOG && SCALE > 0) {
  const LOG = process.env.MTAIL_SPAWN_LOG;
  const RUN = Number(process.env.MTAIL_JUDGE_RUN_MS);
  const real = cp.spawnSync;
  const wrapped = function spawnSync(cmd, args, opts) {
    const a = Array.isArray(args) ? args.map(String) : [];
    const script = a.find((x) => /\.mjs$/.test(x)) || null;
    const organ = script ? script.split(/[\\/]/).pop() : null;
    if (!organ) return real.apply(this, arguments);
    const verb = a[a.indexOf(script) + 1] || null;
    const o = opts || {};
    if (organ === "gaffer_brain.mjs" && verb === "judge-due") {
      const code = `setTimeout(() => { console.log("gaffer_brain: not due (day.close) — the witness's planted fake judge child ran its full time"); }, ${scaled(RUN)});`;
      const t0 = Date.now();
      const r = real.call(this, process.execPath, ["-e", code], { ...o, env: { ...process.env, ...(o.env || {}) }, timeout: Number.isFinite(o.timeout) ? scaled(o.timeout) : undefined });
      log(LOG, { kind: "judge", timeout: Number.isFinite(o.timeout) ? o.timeout : null, run_ms: RUN, status: r.status, signal: r.signal || null, error: r.error ? String(r.error.code || r.error.message) : null, real_ms: Date.now() - t0 });
      return r;
    }
    log(LOG, { kind: "stub", organ, verb, timeout: Number.isFinite(o.timeout) ? o.timeout : null });
    return { pid: 0, output: [null, `${organ.replace(/\.mjs$/, "")}: witness stub (not run)\n`, ""], stdout: `${organ.replace(/\.mjs$/, "")}: witness stub (not run)\n`, stderr: "", status: 0, signal: null };
  };
  cp.spawnSync = wrapped;
  syncBuiltinESMExports();
}

if (process.env.MTAIL_ABORT_LOG && SCALE > 0) {
  const LOG = process.env.MTAIL_ABORT_LOG;
  const orig = AbortSignal.timeout.bind(AbortSignal);
  // unit mrt (T2 re-base, mday rows 1075 / 1078 F10 A): ONLY the /close POST's wait runs on the scaled clock — the CLI's
  // /status probe (daemonUp, added by mday) keeps its own real wait; every wait is logged UNSCALED with its path and method.
  const ms0 = new WeakMap();
  AbortSignal.timeout = (ms) => { const s = orig(ms); ms0.set(s, ms); return s; };
  const realFetch = globalThis.fetch;
  globalThis.fetch = (url, o = {}) => {
    const ms = o && o.signal ? ms0.get(o.signal) : undefined, method = String((o && o.method) || "GET").toUpperCase();
    const path = (() => { try { return new URL(String(url)).pathname; } catch { return null; } })();
    if (ms === undefined) return realFetch(url, o);
    const close = method === "POST" && path === "/close";
    log(LOG, { kind: "abort", ms, method, path, scaled: close });
    return realFetch(url, close ? { ...o, signal: orig(scaled(ms)) } : o);
  };
}
