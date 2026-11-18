// ci/b1/probe.mjs — THE LIVE-READ PROBE (unit B1, 18 Nov 2026). A MEASURING INSTRUMENT, never a gate and never run by CI.
// Preloaded into every node process of one `npm test` run (NODE_OPTIONS=--import=<this file>, inherited by every child that
// keeps the parent env), it journals — one JSON row per event, to B1_PROBE_LOG — the four kinds of LIVE read the hermetic
// profile names: a read of a STATE FILE's bytes (content-hash equal to a file of the checkout's dressing-room/state, so a
// sandbox COPY counts and a planted fixture does not), a PROCESS-TABLE probe (a spawn of tasklist/wmic/ps/schtasks/…, a
// read under /proc), a NETWORK reach (fetch, http(s), net/tls connect, dns — a localhost port this same process listens on
// is planted and journaled as such), and, under B1_CLOCK_SHIFT_MS, a shifted wall clock (Date only: a member whose verdict
// changes when the clock moves reads a clock it does not plant). It journals NAMES only (paths, hosts, commands, argv) —
// never the bytes it hashes. Nothing here is loaded by the suite itself: organism_test.mjs carries the LIVE table this
// probe measured, and that table is the record.
import fs from "node:fs";
import cp from "node:child_process";
import net from "node:net";
import tls from "node:tls";
import http from "node:http";
import https from "node:https";
import dns from "node:dns";
import { createHash } from "node:crypto";
import { syncBuiltinESMExports } from "node:module";

const LOG = process.env.B1_PROBE_LOG;
const MAP = process.env.B1_PROBE_STATE_HASHES;
if (LOG) {
  const append = fs.appendFileSync.bind(fs), readF = fs.readFileSync.bind(fs);
  const T0 = performance.timeOrigin;
  const now = () => T0 + performance.now();
  let seq = 0;
  const emit = (kind, what, extra = {}) => { try { append(LOG, JSON.stringify({ t: now(), s: seq++, pid: process.pid, ppid: process.ppid, kind, what: String(what).slice(0, 300), ...extra }) + "\n"); } catch { /* the probe never kills its host */ } };
  emit("boot", process.argv.slice(1).join(" "), { argv: process.argv.slice(1), cwd: process.cwd() });
  /** @type {Set<string>} */ let hashes = new Set();
  try { hashes = new Set(JSON.parse(readF(MAP, "utf8"))); } catch { /* no map: no state reads are classified */ }
  const isStatePath = (p) => /[\\/]dressing-room[\\/]state[\\/]/.test(String(p));
  const sha = (b) => createHash("sha256").update(b).digest("hex");
  const onRead = (p, bytes) => {
    if (typeof p !== "string" && !(p instanceof URL)) return;
    const s = String(p instanceof URL ? p.pathname : p);
    if (/^\/proc\/\d+/.test(s)) { emit("proc", s); return; }
    if (!isStatePath(s) || !bytes || !bytes.length) return;
    try { if (hashes.has(sha(bytes))) emit("state", s.replace(/^.*?[\\/]dressing-room[\\/]state[\\/]/, "state/")); } catch { /* */ }
  };
  const origRFS = fs.readFileSync;
  fs.readFileSync = function (p, ...a) { const r = origRFS.call(this, p, ...a); try { onRead(p, typeof r === "string" ? Buffer.from(r) : r); } catch { /* */ } return r; };
  const origPRF = fs.promises.readFile;
  fs.promises.readFile = async function (p, ...a) { const r = await origPRF.call(this, p, ...a); try { onRead(p, typeof r === "string" ? Buffer.from(r) : r); } catch { /* */ } return r; };
  const origCRS = fs.createReadStream;
  fs.createReadStream = function (p, ...a) { try { if (isStatePath(p)) onRead(p, origRFS(p)); } catch { /* */ } return origCRS.call(this, p, ...a); };
  const origOpen = fs.openSync;
  fs.openSync = function (p, flags, ...a) { const fd = origOpen.call(this, p, flags, ...a); try { if (!flags || flags === "r" || flags === "r+" || flags === "rs+" || flags === fs.constants.O_RDONLY) if (isStatePath(p)) onRead(p, origRFS(p)); } catch { /* */ } return fd; };

  const PT = /\b(?:tasklist|wmic|Get-Process|Get-CimInstance|Get-WmiObject|Win32_Process|schtasks|Get-ScheduledTask|taskkill|pgrep|pidof|netstat|Get-NetTCPConnection)\b|(?:^|[\s/\\"'])ps(?:\.exe)?(?:\s|$|")/i;
  const cmdOf = (c, a) => [c, ...(Array.isArray(a) ? a : [])].map(String).join(" ");
  for (const name of ["spawn", "spawnSync", "exec", "execSync", "execFile", "execFileSync"]) {
    const orig = cp[name];
    cp[name] = function (c, a, ...rest) {
      const cmd = cmdOf(c, a);
      if (PT.test(cmd)) emit("ptable", cmd);
      const r = orig.call(this, c, a, ...rest);
      try { if (r && r.pid) emit("spawn", cmd, { child: r.pid }); } catch { /* */ }
      return r;
    };
  }
  const listening = new Set();
  const origListen = net.Server.prototype.listen;
  net.Server.prototype.listen = function (...a) { this.once("listening", () => { try { const ad = this.address(); if (ad && typeof ad === "object") listening.add(ad.port); } catch { /* */ } }); return origListen.apply(this, a); };
  const LOCAL = /^(?:localhost|127\.\d+\.\d+\.\d+|::1|\[::1\]|0\.0\.0\.0)$/i;
  const reach = (host, port, via) => {
    const h = String(host || "localhost");
    if (LOCAL.test(h)) emit(listening.has(Number(port)) ? "net-planted" : "daemon", `${h}:${port}`, { via });
    else emit("net", `${h}:${port}`, { via });
  };
  const argHP = (a) => {
    const [x, y] = a;
    if (typeof x === "object" && x) { if (x instanceof URL) return [x.hostname, x.port]; return [x.host || x.hostname, x.port]; }
    if (typeof x === "string") { try { const u = new URL(x); return [u.hostname, u.port || (u.protocol === "https:" ? 443 : 80)]; } catch { return [y, x]; } }
    return [y, x];
  };
  for (const [mod, names] of [[net, ["connect", "createConnection"]], [tls, ["connect"]], [http, ["request", "get"]], [https, ["request", "get"]]]) {
    for (const n of names) { const orig = mod[n]; mod[n] = function (...a) { try { const [h, p] = argHP(a); reach(h, p, n); } catch { /* */ } return orig.apply(this, a); }; }
  }
  const origLookup = dns.lookup;
  dns.lookup = function (host, ...a) { if (!LOCAL.test(String(host))) emit("net", `${host}:dns`, { via: "dns" }); return origLookup.call(this, host, ...a); };
  if (typeof globalThis.fetch === "function") {
    const origFetch = globalThis.fetch;
    globalThis.fetch = function (u, ...a) { try { const url = new URL(String(u && u.url ? u.url : u)); reach(url.hostname, url.port || (url.protocol === "https:" ? 443 : 80), "fetch"); } catch { /* */ } return origFetch.call(this, u, ...a); };
  }
  const SHIFT = Number(process.env.B1_CLOCK_SHIFT_MS || 0);
  if (SHIFT) {
    const RealDate = Date;
    class ShiftedDate extends RealDate {
      constructor(...a) { if (a.length === 0) super(RealDate.now() + SHIFT); else super(...a); }
      static now() { return RealDate.now() + SHIFT; }
    }
    globalThis.Date = ShiftedDate;
  }
  // a line the suite prints for an assert or a member is a BOUNDARY: everything this process did before it belongs to it
  const origLog = console.log;
  console.log = function (...a) {
    try { const s = a.map(String).join(" "); for (const l of s.split("\n")) { const m = /^  (ok  |FAIL) (.*)$/.exec(l); if (m) emit("boundary", m[2], { ok: m[1] === "ok  " }); } } catch { /* */ }
    return origLog.apply(this, a);
  };
  syncBuiltinESMExports();
}
