// ci/mjud/w_preload.mjs — loaded with `node --import` into a witness driver child ONLY. It replaces node:child_process's
// spawning functions (and, through syncBuiltinESMExports, every ESM named binding of them) with recorders: each call is
// appended to MJUD_SPAWN_LOG as {fn, file, args, timeout} and answered with a planted reply. NOTHING IS EVER SPAWNED from
// a driver, so no organ child, no claude, no model call can run under it.
import cp from "node:child_process";
import { syncBuiltinESMExports } from "node:module";
import { appendFileSync } from "node:fs";
import { EventEmitter } from "node:events";

const LOG = process.env.MJUD_SPAWN_LOG;
const argvOf = (args) => (Array.isArray(args) ? args : []).map((a) => String(a).replace(/\\/g, "/"));
const rec = (fn, file, args, opts) => {
  if (!LOG) return;
  appendFileSync(LOG, JSON.stringify({ fn, file: String(file).replace(/\\/g, "/"), args: argvOf(args), timeout: opts && opts.timeout != null ? opts.timeout : null }) + "\n");
};
// the planted owner replies: the judge's read-only queue verb says one capture waits; a judge verb says it graded one
const reply = (args) => {
  const a = argvOf(args);
  const gaffer = a.some((x) => /(^|\/)gaffer_brain\.mjs$/.test(x));
  if (gaffer && a.includes("queue")) return "gaffer_brain: 1 captured item(s) waiting for judge-round:\n";
  if (gaffer && (a.includes("judge-due") || a.includes("judge-round"))) return "gaffer_brain: 1 item(s) graded in ONE Opus call · types: voice_rep\n";
  return "";
};
const fakeChild = () => {
  const c = new EventEmitter();
  c.stdout = new EventEmitter(); c.stderr = new EventEmitter(); c.stdin = { write() { }, end() { } };
  c.pid = 0; c.unref = () => c; c.ref = () => c; c.kill = () => true;
  setImmediate(() => { c.emit("exit", 0, null); c.emit("close", 0, null); });
  return c;
};
cp.spawnSync = (file, args, opts) => { rec("spawnSync", file, args, opts); const out = reply(args); return { pid: 0, status: 0, signal: null, stdout: out, stderr: "", output: [null, out, ""] }; };
cp.execFileSync = (file, args, opts) => { rec("execFileSync", file, args, opts); return reply(args); };
cp.execSync = (cmd, opts) => { rec("execSync", cmd, [], opts); return ""; };
cp.spawn = (file, args, opts) => { rec("spawn", file, args, opts); return fakeChild(); };
cp.execFile = (file, args, opts, cb) => { rec("execFile", file, args, opts); const done = [cb, opts, args].find((f) => typeof f === "function"); if (done) setImmediate(() => done(null, reply(args), "")); return fakeChild(); };
cp.fork = (file, args, opts) => { rec("fork", file, args, opts); return fakeChild(); };
syncBuiltinESMExports();
