// ============================================================================
// ci/mkp24/plant_mkp24.mjs — UNIT mkp24 (forks rows 1185 (5) / 1186 (4) / 1216) · THE PLANTS, a preload
// (`NODE_OPTIONS=--import=<this file's URL>`), loaded by ci/mkp24/witness_mkp24.mjs into every node process of ONE
// keeper-family witness run. It is INERT unless all three hold: MKP24_PLANT names a plant, MKP24_DIR sits under
// os.tmpdir(), and this process is the plant's own target, its script a file of a tree under os.tmpdir():
//   p-stale  a thalamus WORKER (scripts/thalamus.mjs `daemon-worker`): the closure write is never SURFACED to it — node:fs
//            `watch` is handed a no-op watcher, and `statSync` of a .mjs file of a scripts/ dir reads an mtime no later
//            than this process's start — so the keeper's retireWhenIdle (scripts/keeper.mjs staleSources) finds nothing
//            moved and logs no RETIRING line (the filesystem-event class). The organ's bytes are not touched.
//            (The spec's p-watch, the watch alone, does NOT hold T1: measured 2026-11-20, thalamus calls check() itself as
//            each request ends, so a write is seen without any event. Named in ci/mkp24/PROOF.md.)
//   p-gap    the mlv3 WITNESS process (ci/mlv3/witness_mlv3.mjs): a POST to /afferent that finds nothing listening is
//            re-sent until it is answered, bounded by the witness's OWN AbortSignal (its measured BOUND) — so no event of
//            T2's stream arrives while nothing listens (the respawn falls between two sends).
//   p-hold   the mlv1 WITNESS process (ci/mlv1/witness_mlv1.mjs): when the FIRST keeper it spawned exits (I2's kill), the
//            witness learns of the exit only once THIS process has bound that keeper's planted port (its own env door,
//            ARSENAL_SITTING_PORT, read from the spawn's env) — a bind retried until it holds, bounded by that keeper's own
//            measured lifetime. The port stays held for the rest of the run (an unref'd server; it dies with the process).
//   p-drop   a thalamus WORKER: the FIRST append (across the run's workers, one MKP24_DIR/dropped file made exclusively) of
//            a planted mlv3 event to the afferent record is dropped AFTER the organ took it, so its 2xx stands and the
//            event never lands (an organ defect, planted).
// Each plant writes MKP24_DIR/engaged as it engages. It binds no port but p-hold's (the planted port of the keeper the
// witness itself was handed), names no live service, POSTs nothing of its own, and writes only under MKP24_DIR.
// ============================================================================
import { appendFileSync, writeFileSync, realpathSync } from "node:fs";
import { join, relative, isAbsolute } from "node:path";
import { tmpdir } from "node:os";
import { createRequire, syncBuiltinESMExports } from "node:module";

const under = (p) => { try { const f = (s) => (process.platform === "win32" ? s.toLowerCase() : s); const r = relative(f(realpathSync(tmpdir())), f(realpathSync(p))); return !!r && !r.startsWith("..") && !isAbsolute(r); } catch { return false; } };
const PLANT = process.env.MKP24_PLANT, DIR = process.env.MKP24_DIR, SCRIPT = process.argv[1] || "";
const live = !!(PLANT && DIR && under(DIR) && SCRIPT && under(SCRIPT));
const THAL_WORKER = /[\\/]scripts[\\/]thalamus\.mjs$/.test(SCRIPT) && process.argv.includes("daemon-worker");
const engaged = (what) => { try { appendFileSync(join(DIR, "engaged"), `${PLANT} · ${what} · pid ${process.pid}\n`); } catch { /* DIR removed */ } };
const req = createRequire(import.meta.url);

if (live && PLANT === "p-stale" && THAL_WORKER) {
  const fs = req("node:fs");
  const { EventEmitter } = req("node:events");
  const born = Date.now() - process.uptime() * 1000 - 1;
  const stat = fs.statSync;
  fs.watch = function () { const w = new EventEmitter(); w.close = () => {}; w.ref = () => w; w.unref = () => w; return w; };
  fs.statSync = function (p, ...rest) {
    const st = stat.call(this, p, ...rest);
    if (st && /[\\/]scripts[\\/][^\\/]+\.mjs$/.test(String(p)) && st.mtimeMs > born) { st.mtimeMs = born; engaged("a closure write not surfaced to the worker"); }
    return st;
  };
  syncBuiltinESMExports();
}

if (live && PLANT === "p-drop" && THAL_WORKER) {
  const fs = req("node:fs");
  const orig = fs.appendFileSync;
  fs.appendFileSync = function (p, data, ...rest) {
    if (/afferent\.jsonl$/.test(String(p)) && /"event_id":"mlv3-/.test(String(data))) {
      let first = false;
      try { writeFileSync(join(DIR, "dropped"), String(process.pid), { flag: "wx" }); first = true; } catch { /* already dropped once */ }
      if (first) { engaged("one acknowledged event dropped before it landed"); return undefined; }
    }
    return orig.call(this, p, data, ...rest);
  };
  syncBuiltinESMExports();
}

if (live && PLANT === "p-gap" && /[\\/]ci[\\/]mlv3[\\/]witness_mlv3\.mjs$/.test(SCRIPT)) {
  const orig = globalThis.fetch;
  let said = false;
  globalThis.fetch = async function (url, init = {}) {
    const resend = /\/afferent$/.test(String(url)) && init && init.method === "POST" && init.signal;
    for (;;) {
      try { return await orig(url, init); }
      catch (e) {
        if (!resend || init.signal.aborted) throw e;
        if (!said) { said = true; engaged("a send that found nothing listening waits for the respawn"); }
        await new Promise((r) => setImmediate(r));
      }
    }
  };
}

if (live && PLANT === "p-hold" && /[\\/]ci[\\/]mlv1[\\/]witness_mlv1\.mjs$/.test(SCRIPT)) {
  const cp = req("node:child_process"), net = req("node:net");
  const orig = cp.spawn;
  let first = true;
  cp.spawn = function (...a) {
    const c = orig.apply(this, a);
    const keeper = Array.isArray(a[1]) && a[1].some((x) => /[\\/]scripts[\\/]sitting\.mjs$/.test(String(x))) && a[1].includes("daemon");
    const port = keeper && a[2] && a[2].env ? Number(a[2].env.ARSENAL_SITTING_PORT) : 0;
    if (first && keeper && port > 0) {
      first = false;
      const born = Date.now(), emit = c.emit;
      c.emit = function (ev, ...rest) {
        if (ev !== "exit") return emit.call(this, ev, ...rest);
        const life = Math.max(1, Date.now() - born), t0 = Date.now();
        const tryBind = () => {
          const s = net.createServer();
          s.once("error", () => { if (Date.now() - t0 > life) emit.call(this, ev, ...rest); else setImmediate(tryBind); });
          s.listen(port, "127.0.0.1", () => { s.unref(); engaged(`the killed keeper's planted port held after its exit`); emit.call(this, ev, ...rest); });
        };
        tryBind();
        return true;
      };
    }
    return c;
  };
  syncBuiltinESMExports();
}
