// ============================================================================
// ci/mrv/plant_mrv.mjs — UNIT mrv (forks rows 1135 / 1139) · THE PLANTS, a preload (`NODE_OPTIONS=--import=<this file's URL>`)
// ----------------------------------------------------------------------------
// Loaded by ci/mrv/witness_mrv.mjs into every node process of ONE keeper-family witness run. It is INERT unless all
// three hold: MRV_PLANT names a plant, MRV_DIR sits under os.tmpdir(), and this process is a planted KEEPER (argv[1] is
// scripts/sitting.mjs, cortex.mjs or thalamus.mjs of a tree under os.tmpdir(), and its argv carries no `daemon-worker`).
// It binds no port, names no live service, POSTs nothing, and writes only under MRV_DIR.
//   p1  the keeper start number MRV_P1_AT (counted across this run's keepers in MRV_DIR/keepers) boots slower by the
//       measured ms the witness_mrv wrote to MRV_DIR/p1_ms (read from the judged witness's OWN first lines). It waits
//       for that file (bounded: the file appears, or this process's parent is gone), then sleeps (Atomics.wait, no
//       busy loop), writing MRV_DIR/p1_engaged as it begins.
//   p1w the WORKER start number MRV_P1_AT (counted across this run's workers in MRV_DIR/workers) boots slower by
//       MRV_DIR/p1_ms, the same size and the same wait as p1 (row 1139 (1), the ruling on 03ec8d7: a respawn is a boot too);
//       MRV_DIR/p1_engaged.
//   p3  at the worker exit number MRV_P3_AT that is a RETIRE (KEEP_EXIT.RETIRED, read from the tree's own keeper.mjs),
//       the keeper exits instead of respawning (the state a red earlier clause leaves: no keeper up); MRV_DIR/p3_engaged.
//   p2  in the JUDGED WITNESS's own process (argv[1] a ci/mlv<n>/witness_mlv<n>.mjs under os.tmpdir()): the FIRST keeper it
//       spawns reports its exit to the witness only once MRV_DIR/p2_held exists (or MRV_DIR/p2_gone) — that is, only once
//       witness_mrv's holder child, OUTSIDE the keeper's tree, has bound the freed port. The kill then returns while the
//       port is still held: C2 of ci/mrv/MRV_SPEC.md (win32's taskkill teardown lag), made certain on any OS. The holder
//       frees the port after the judged witness's own measured BOOT.
// Every keeper also writes its planted service port (the env door it was handed) to MRV_DIR/port: p2's holder reads it.
// ============================================================================
import { appendFileSync, existsSync, readFileSync, writeFileSync, realpathSync } from "node:fs";
import { join, relative, isAbsolute, dirname } from "node:path";
import { tmpdir } from "node:os";
import { createRequire, syncBuiltinESMExports } from "node:module";
import { pathToFileURL } from "node:url";

const under = (p) => { try { const f = (s) => (process.platform === "win32" ? s.toLowerCase() : s); const r = relative(f(realpathSync(tmpdir())), f(realpathSync(p))); return !!r && !r.startsWith("..") && !isAbsolute(r); } catch { return false; } };
const PLANT = process.env.MRV_PLANT, DIR = process.env.MRV_DIR, SCRIPT = process.argv[1] || "";
const KEEPER = /[\\/]scripts[\\/](sitting|cortex|thalamus)\.mjs$/.test(SCRIPT) && !process.argv.includes("daemon-worker")
  && (!/sitting\.mjs$/.test(SCRIPT) || process.argv[2] === "daemon");
const WORKER = /[\\/]scripts[\\/](sitting|cortex|thalamus)\.mjs$/.test(SCRIPT) && process.argv.includes("daemon-worker");
if (PLANT === "p1w" && DIR && WORKER && under(DIR) && under(SCRIPT)) {
  appendFileSync(join(DIR, "workers"), `${process.pid}\n`);
  const nth = readFileSync(join(DIR, "workers"), "utf8").split(/\r?\n/).filter(Boolean).length;
  if (nth === Number(process.env.MRV_P1_AT)) {
    const f = join(DIR, "p1_ms"), nap = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, Math.max(0, ms));
    const parentUp = () => { try { process.kill(process.ppid, 0); return true; } catch { return false; } };
    while (!existsSync(f) && parentUp()) nap(1);
    const ms = existsSync(f) ? Number(readFileSync(f, "utf8")) : 0;
    if (ms > 0) { writeFileSync(join(DIR, "p1_engaged"), `worker ${nth} pid ${process.pid} slowed ${ms} ms\n`); nap(ms); }
  }
}
const WITNESS = /[\\/]ci[\\/]mlv\d[\\/]witness_mlv\d\.mjs$/.test(SCRIPT);
if (PLANT === "p2" && DIR && WITNESS && under(DIR) && under(SCRIPT)) {
  const cp = createRequire(import.meta.url)("node:child_process");
  const orig = cp.spawn;
  let first = true;
  cp.spawn = function (...a) {
    const c = orig.apply(this, a);
    if (first && Array.isArray(a[1]) && a[1].some((x) => /[\\/]scripts[\\/](sitting|cortex|thalamus)\.mjs$/.test(String(x)))) {
      first = false;
      const emit = c.emit;
      c.emit = function (ev, ...rest) {
        if (ev !== "exit") return emit.call(this, ev, ...rest);
        const go = () => (existsSync(join(DIR, "p2_held")) || existsSync(join(DIR, "p2_gone")) ? emit.call(this, ev, ...rest) : setTimeout(go, 1));
        go();
        return true;
      };
    }
    return c;
  };
  syncBuiltinESMExports();
}
if (PLANT && DIR && KEEPER && under(DIR) && under(SCRIPT)) {
  const port = process.env.ARSENAL_SITTING_PORT && /sitting\.mjs$/.test(SCRIPT) ? process.env.ARSENAL_SITTING_PORT
    : /cortex\.mjs$/.test(SCRIPT) ? process.env.ARSENAL_CORTEX_PORT : process.env.ARSENAL_THALAMUS_PORT;
  if (port) writeFileSync(join(DIR, "port"), String(port));
  appendFileSync(join(DIR, "keepers"), `${process.pid}\n`);
  const nth = readFileSync(join(DIR, "keepers"), "utf8").split(/\r?\n/).filter(Boolean).length;
  const nap = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, Math.max(0, ms));
  if (PLANT === "p1" && nth === Number(process.env.MRV_P1_AT)) {
    const f = join(DIR, "p1_ms"), parentUp = () => { try { process.kill(process.ppid, 0); return true; } catch { return false; } };
    while (!existsSync(f) && parentUp()) nap(1);
    const ms = existsSync(f) ? Number(readFileSync(f, "utf8")) : 0;
    if (ms > 0) { writeFileSync(join(DIR, "p1_engaged"), `keeper ${nth} pid ${process.pid} slowed ${ms} ms\n`); nap(ms); }
  }
  if (PLANT === "p3") {
    const k = await import(pathToFileURL(join(dirname(SCRIPT), "keeper.mjs")).href);
    const RETIRED = k.KEEP_EXIT && k.KEEP_EXIT.RETIRED;
    const cp = createRequire(import.meta.url)("node:child_process");
    const orig = cp.spawn;
    cp.spawn = function (...a) {
      const c = orig.apply(this, a);
      if (String(a[1] && a[1].join ? a[1].join(" ") : "").includes("daemon-worker")) c.once("exit", (code) => {
        if (code !== RETIRED) return;
        appendFileSync(join(DIR, "retires"), `${c.pid}\n`);
        const n = readFileSync(join(DIR, "retires"), "utf8").split(/\r?\n/).filter(Boolean).length;
        if (n === Number(process.env.MRV_P3_AT)) { writeFileSync(join(DIR, "p3_engaged"), `retire ${n}: keeper pid ${process.pid} exits, no respawn\n`); process.exit(0); }
      });
      return c;
    };
    syncBuiltinESMExports();
  }
}
