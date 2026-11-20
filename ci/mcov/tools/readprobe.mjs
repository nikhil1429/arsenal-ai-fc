// ci/mcov/tools/readprobe.mjs — unit mcov MEASUREMENT preload (never a gate, never run by the suite).
// Loaded with `node --import <this> scripts/<organ>.mjs selftest` (NODE_OPTIONS carries it into every child), it
// journals, one JSON line each, to the file named by MCOV_PROBE_LOG:
//   · every fs call whose path resolves under <MCOV_PROBE_ROOT>/dressing-room/state (his live state bus), and
//   · every outbound net connect (host:port) and every listen.
// It changes no behaviour: each wrapped function calls the original with the same arguments. It writes only the log.
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { syncBuiltinESMExports } from "node:module";

const LOG = process.env.MCOV_PROBE_LOG;
const ROOT = process.env.MCOV_PROBE_ROOT ? path.resolve(process.env.MCOV_PROBE_ROOT) : null;
if (LOG && ROOT) {
  const STATE = path.join(ROOT, "dressing-room", "state");
  const origAppend = fs.appendFileSync;
  const journal = (row) => { try { origAppend(LOG, JSON.stringify({ pid: process.pid, argv: process.argv.slice(1, 3).map((a) => path.basename(String(a))), ...row }) + "\n"); } catch { /* a lost journal row is a measurement gap, named by its absence */ } };
  const under = (p) => {
    try {
      const s = p instanceof URL ? p.pathname : typeof p === "string" ? p : Buffer.isBuffer(p) ? p.toString() : null;
      if (!s) return null;
      const abs = path.resolve(s);
      return abs === STATE || abs.startsWith(STATE + path.sep) ? abs.slice(ROOT.length + 1) : null;
    } catch { return null; }
  };
  const FNS = ["readFileSync", "openSync", "readdirSync", "existsSync", "statSync", "lstatSync", "writeFileSync", "appendFileSync", "readFile", "open", "readdir", "stat", "createReadStream", "createWriteStream", "accessSync", "copyFileSync", "rmSync", "unlinkSync", "mkdirSync", "renameSync"];
  for (const fn of FNS) {
    const orig = fs[fn];
    if (typeof orig !== "function") continue;
    fs[fn] = function (...args) { const u = under(args[0]); if (u) journal({ kind: "fs", fn, path: u }); return orig.apply(this, args); };
  }
  for (const fn of ["readFile", "open", "readdir", "stat", "writeFile", "appendFile"]) {
    const orig = fs.promises[fn];
    if (typeof orig !== "function") continue;
    fs.promises[fn] = function (...args) { const u = under(args[0]); if (u) journal({ kind: "fs", fn: "promises." + fn, path: u }); return orig.apply(this, args); };
  }
  syncBuiltinESMExports();
  const oConnect = net.Socket.prototype.connect;
  net.Socket.prototype.connect = function (...args) {
    const o = args[0];
    const desc = Array.isArray(o) ? o[0] : o;
    if (desc && typeof desc === "object" && (desc.port || desc.path)) journal({ kind: "connect", host: desc.host || null, port: desc.port || null, ipc: desc.path ? "ipc" : null });
    else if (typeof desc === "number" || typeof desc === "string") journal({ kind: "connect", port: desc, host: typeof args[1] === "string" ? args[1] : null });
    return oConnect.apply(this, args);
  };
  const oListen = net.Server.prototype.listen;
  net.Server.prototype.listen = function (...args) { journal({ kind: "listen", port: typeof args[0] === "object" && args[0] ? args[0].port ?? null : args[0] ?? null }); return oListen.apply(this, args); };
}
