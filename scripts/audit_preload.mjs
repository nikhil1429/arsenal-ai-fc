#!/usr/bin/env node
// ============================================================================
// audit_preload.mjs · ARSENAL AI FC — THE COLLAR AND THE TRACER (12 Aug 2026)
// ----------------------------------------------------------------------------
// WHAT THIS IS. A Node `--import` preload. It is never run on its own; it is
// injected via NODE_OPTIONS so that it reaches not only the organ we launch but
// EVERY GRANDCHILD that organ spawns. That propagation is the whole point: this
// repo's organs shell each other constantly (~25 execFileSync(process.execPath,
// ["scripts/x.mjs", …]) sites), so a collar that only wrapped the first process
// would be a collar with a hole exactly the size of the organism.
//
// WHY IT EXISTS. This repo has already been bitten once: a test suite fired 131
// real paid calls and burned ~20 lakh tokens. "The sandbox is safe" was a
// hypothesis, and CLAUDE.md's own law is that an unrun system IS a hypothesis.
// This file makes the collar a MEASURED, ASSERTED fact — see `sandbox.mjs
// canary`, which deliberately attempts four escapes and asserts all four denied.
//
// IT DOES TWO JOBS, selected by env (both may run at once):
//   ARSENAL_AUDIT_COLLAR=<sandboxRoot>  → DENY: fs writes outside the sandbox,
//        spawns of billing/network binaries, and all outbound network.
//   ARSENAL_AUDIT_TRACE=<file>          → RECORD: every path opened for read or
//        write, every ENOENT, every spawn, exit code and wall clock.
//
// THE ONE MODELING RULE THAT MATTERS (and the reason a naive version is useless):
//   writeAtomic(p,o){ const tmp=p+".tmp"; writeFileSync(tmp,…); renameSync(tmp,p) }
// 20+ organs each clone their own writeAtomic. A tracer that only watches
// writeFileSync therefore records a write to `foo.json.tmp` and NEVER to
// `foo.json`, and concludes that every state file in the repo has zero writers.
// So renameSync/rename is modelled as WRITE(dst) + KILL(src), and `*.tmp` is
// canonicalised out of the recorded domain. Same rule as xray.mjs, so the static
// and runtime graphs are comparable — reconciling them is the point.
//
// EMPIRICALLY VERIFIED BEFORE BEING RELIED ON (12 Aug 2026), because the obvious
// worry is that Node's ESM facade for `node:fs` snapshots its named exports at
// instantiation, which would make patching the CJS object useless for the ~76
// organs that all write `import { writeFileSync } from "node:fs"`:
//   · patching via createRequire("fs") DOES reach destructured ESM named imports
//   · `--import` in NODE_OPTIONS DOES propagate to grandchildren automatically
// Both were run and observed, not assumed. If a future Node changes either, the
// heartbeat assertion below turns that into a loud REFUSAL, never a silent hole.
//
// FAIL-CLOSED. At load this writes a heartbeat file. `sandbox.mjs` refuses to run
// the audit at all if the heartbeat is absent after a probe child — an unprotected
// run is strictly worse than no run.
//
// WHO ELSE COULD ACT ON THIS OUTPUT? blackbox.mjs consumes the trace (runtime
// truth), audit.mjs consumes the tripwire (the money oracle), and organism_test's
// `collar` mode asserts on the canary. Named, and all three are wired.
// ============================================================================
import { createRequire } from "node:module";

const require_ = createRequire(import.meta.url);
const fs = require_("fs");
const cp = require_("child_process");
const path = require_("path");
const os = require_("os");

// ── Original handles, captured BEFORE any patching. Everything this file does
//    internally goes through these, so the collar can never deny itself.
const _appendFileSync = fs.appendFileSync;
const _writeFileSync = fs.writeFileSync;
const _mkdirSync = fs.mkdirSync;
const _existsSync = fs.existsSync;

const COLLAR = process.env.ARSENAL_AUDIT_COLLAR || "";
const TRACE = process.env.ARSENAL_AUDIT_TRACE || "";
const TRIPWIRE = process.env.ARSENAL_AUDIT_TRIPWIRE || "";
const HEARTBEAT = process.env.ARSENAL_AUDIT_HEARTBEAT || "";
const LABEL = process.env.ARSENAL_AUDIT_LABEL || path.basename(process.argv[1] || "unknown");

if (!COLLAR && !TRACE) {
  // Neither job requested: do nothing at all. This is what makes the preload safe
  // to leave on a PATH — it is inert unless deliberately armed.
} else {
  const norm = (p) => {
    try {
      let s = typeof p === "string" ? p : p && p.href ? decodeURIComponent(new URL(p.href).pathname).replace(/^\/([A-Za-z]:)/, "$1") : String(p);
      s = path.resolve(s);
      return s.replace(/\\/g, "/");
    } catch { return String(p); }
  };
  // *.tmp is an implementation detail of writeAtomic, never a lane of its own.
  const canon = (p) => p.replace(/\.tmp$/i, "");
  const under = (child, parent) => {
    if (!parent) return false;
    const c = child.toLowerCase(), q = parent.replace(/\\/g, "/").toLowerCase().replace(/\/$/, "");
    return c === q || c.startsWith(q + "/");
  };

  const SANDBOX = COLLAR ? norm(COLLAR) : "";
  const TMP = norm(os.tmpdir());
  // Where the audit's own bookkeeping lives; always writable, never traced as a
  // finding — otherwise the tracer would trip its own collar on its first line.
  const SELF_FILES = [TRACE, TRIPWIRE, HEARTBEAT].filter(Boolean).map(norm);

  const rows = [];
  let flushed = false;
  const emit = (rec) => {
    if (!TRACE) return;
    rows.push({ organ: LABEL, pid: process.pid, ...rec });
    if (rows.length > 4000) flush();
  };
  const flush = () => {
    if (!TRACE || !rows.length) return;
    try { _appendFileSync(TRACE, rows.map((r) => JSON.stringify(r)).join("\n") + "\n"); } catch { /* the tracer must never break the traced */ }
    rows.length = 0;
  };
  const trip = (kind, detail) => {
    const rec = { at: new Date().toISOString(), organ: LABEL, pid: process.pid, kind, ...detail };
    if (TRIPWIRE) { try { _appendFileSync(TRIPWIRE, JSON.stringify(rec) + "\n"); } catch { /* ignore */ } }
    emit({ ev: "DENIED", kind, ...detail });
  };

  // ── HEARTBEAT — proof the collar actually loaded in THIS process ───────────
  if (HEARTBEAT) {
    try {
      _mkdirSync(path.dirname(HEARTBEAT), { recursive: true });
      _appendFileSync(HEARTBEAT, JSON.stringify({ at: new Date().toISOString(), pid: process.pid, organ: LABEL, collar: !!COLLAR, trace: !!TRACE }) + "\n");
    } catch { /* ignore */ }
  }

  // ── FS ────────────────────────────────────────────────────────────────────
  const isSelf = (p) => SELF_FILES.some((s) => s === p);
  const writeAllowed = (p) => {
    if (!COLLAR) return true;
    if (isSelf(p)) return true;
    if (under(p, SANDBOX)) return true;
    // os.tmpdir() is permitted because several organs legitimately mkdtemp there
    // (claudegen builds a fake %APPDATA% to walk the npm-shim lane). A temp write
    // cannot reach live state or the network, so it is recorded, never denied.
    if (under(p, TMP)) return true;
    return false;
  };

  const guardWrite = (verb, p) => {
    const n = norm(p);
    const c = canon(n);
    if (!writeAllowed(n)) {
      trip("fs-write-escape", { verb, path: n });
      const e = new Error(`ARSENAL COLLAR: ${verb} outside the sandbox is denied → ${n}`);
      e.code = "EACCES";
      throw e;
    }
    if (!isSelf(n)) emit({ ev: "write", verb, path: c });
    return n;
  };
  const noteRead = (verb, p) => {
    const n = norm(p);
    if (!isSelf(n)) emit({ ev: "read", verb, path: canon(n) });
    return n;
  };

  const wrapWrite = (name) => {
    const orig = fs[name];
    if (typeof orig !== "function") return;
    fs[name] = function (p, ...rest) { guardWrite(name, p); return orig.call(this, p, ...rest); };
  };
  const wrapRead = (name) => {
    const orig = fs[name];
    if (typeof orig !== "function") return;
    fs[name] = function (p, ...rest) {
      noteRead(name, p);
      try { return orig.call(this, p, ...rest); }
      catch (e) { if (e && e.code === "ENOENT") emit({ ev: "ENOENT", verb: name, path: canon(norm(p)) }); throw e; }
    };
  };

  ["writeFileSync", "appendFileSync", "mkdirSync", "rmSync", "rmdirSync", "unlinkSync", "truncateSync", "writeFile", "appendFile", "createWriteStream", "mkdir", "rm", "unlink"].forEach(wrapWrite);
  ["readFileSync", "readdirSync", "statSync", "lstatSync", "accessSync", "opendirSync", "readFile", "readdir", "stat", "createReadStream"].forEach(wrapRead);

  // existsSync must never throw — a probe is not a read failure. Recorded only.
  {
    const orig = fs.existsSync;
    fs.existsSync = function (p) { const r = orig.call(this, p); emit({ ev: r ? "exists" : "missing", verb: "existsSync", path: canon(norm(p)) }); return r; };
  }

  // THE writeAtomic RULE: rename is the real write. Without this every state file
  // in the repo reads as having zero writers — a false result this audit
  // reproduced by hand before the rule was added.
  for (const name of ["renameSync", "rename", "copyFileSync", "cpSync"]) {
    const orig = fs[name];
    if (typeof orig !== "function") continue;
    fs[name] = function (src, dst, ...rest) {
      guardWrite(name, dst);
      emit({ ev: "write", verb: name, path: canon(norm(dst)), from: canon(norm(src)) });
      return orig.call(this, src, dst, ...rest);
    };
  }

  // openSync with any write-ish flag is a write; with 'r' it is a read.
  {
    const orig = fs.openSync;
    if (typeof orig === "function") {
      fs.openSync = function (p, flags, ...rest) {
        const f = String(flags === undefined ? "r" : flags);
        if (/[wa+]/.test(f)) guardWrite("openSync", p); else noteRead("openSync", p);
        return orig.call(this, p, flags, ...rest);
      };
    }
  }

  // fs.promises mirrors the same surface and is a real bypass if left unpatched.
  try {
    const fsp = fs.promises;
    for (const name of ["writeFile", "appendFile", "mkdir", "rm", "unlink", "rmdir"]) {
      const orig = fsp[name];
      if (typeof orig !== "function") continue;
      fsp[name] = function (p, ...rest) { guardWrite(`promises.${name}`, p); return orig.call(this, p, ...rest); };
    }
    for (const name of ["readFile", "readdir", "stat"]) {
      const orig = fsp[name];
      if (typeof orig !== "function") continue;
      fsp[name] = function (p, ...rest) { noteRead(`promises.${name}`, p); return orig.call(this, p, ...rest); };
    }
    const origRename = fsp.rename;
    if (typeof origRename === "function") {
      fsp.rename = function (src, dst, ...rest) { guardWrite("promises.rename", dst); emit({ ev: "write", verb: "promises.rename", path: canon(norm(dst)) }); return origRename.call(this, src, dst, ...rest); };
    }
  } catch { /* ignore */ }

  // ── CHILD PROCESS ─────────────────────────────────────────────────────────
  // Denied by argv0 basename. `claude` and `gemini` are the ONLY token-spend
  // edges in the organism (~4 sites) and this is the layer that actually stops
  // them; ANTHROPIC_API_KEY poisoning is only the fourth line of defence.
  const BILLING = /^(claude|gemini|ntfy|curl|wget|schtasks|mshta|bitsadmin|certutil|ssh|scp)(\.(exe|cmd|bat|ps1))?$/i;
  const SHELLY = /^(cmd|powershell|pwsh|bash|sh|wscript|cscript)(\.(exe|com))?$/i;
  const ALLOW_SHELL = process.env.ARSENAL_AUDIT_ALLOW_SHELL === "1";

  const guardSpawn = (verb, file, args) => {
    const base = path.basename(String(file || "")).toLowerCase();
    const argv = Array.isArray(args) ? args.map(String) : [];
    emit({ ev: "spawn", verb, file: String(file), args: argv.slice(0, 6) });
    if (!COLLAR) return;
    if (BILLING.test(base)) {
      trip("spawn-billing", { verb, file: String(file), args: argv.slice(0, 6) });
      const e = new Error(`ARSENAL COLLAR: spawning "${base}" is denied inside the audit sandbox`);
      e.code = "EACCES";
      throw e;
    }
    if (SHELLY.test(base) && !ALLOW_SHELL) {
      // A shell is a hole the size of every binary on the box. Denied unless a
      // caller explicitly opts in, and the opt-in is itself recorded.
      trip("spawn-shell", { verb, file: String(file), args: argv.slice(0, 6) });
      const e = new Error(`ARSENAL COLLAR: spawning a shell ("${base}") is denied inside the audit sandbox`);
      e.code = "EACCES";
      throw e;
    }
  };

  for (const name of ["execFileSync", "execFile", "spawnSync", "spawn"]) {
    const orig = cp[name];
    if (typeof orig !== "function") continue;
    cp[name] = function (file, args, ...rest) { guardSpawn(name, file, args); return orig.call(this, file, args, ...rest); };
  }
  for (const name of ["execSync", "exec"]) {
    const orig = cp[name];
    if (typeof orig !== "function") continue;
    cp[name] = function (cmd, ...rest) {
      const first = String(cmd || "").trim().split(/\s+/)[0].replace(/^["']|["']$/g, "");
      guardSpawn(name, first, String(cmd || "").trim().split(/\s+/).slice(1));
      return orig.call(this, cmd, ...rest);
    };
  }

  // ── NETWORK ───────────────────────────────────────────────────────────────
  // Three doors, all of them real in this repo: fetch (ntfy pushes, the GitHub
  // REST reads), https.request, and raw net.connect (the four localhost daemons
  // on 4111/4112/4113/5600 — see E1: those daemons answer on his laptop and never
  // on CI, which is the single variable no local reproduction could hold
  // constant. Inside this collar they are unreachable BY CONSTRUCTION, which is
  // the CI world reproduced honestly rather than assumed).
  if (COLLAR) {
    const denyNet = (kind, target) => {
      trip("network", { kind, target: String(target).slice(0, 200) });
      const e = new Error(`ARSENAL COLLAR: network access is denied inside the audit sandbox → ${String(target).slice(0, 120)}`);
      e.code = "ENETUNREACH";
      return e;
    };
    const g = globalThis;
    if (typeof g.fetch === "function") {
      g.fetch = function (u) { throw denyNet("fetch", (u && u.url) || u); };
    }
    for (const mod of ["http", "https"]) {
      try {
        const m = require_(mod);
        for (const fn of ["request", "get"]) {
          const orig = m[fn];
          if (typeof orig !== "function") continue;
          m[fn] = function (u) { throw denyNet(`${mod}.${fn}`, (u && u.host) || u); };
        }
      } catch { /* ignore */ }
    }
    try {
      const net = require_("net");
      for (const fn of ["connect", "createConnection"]) {
        const orig = net[fn];
        if (typeof orig !== "function") continue;
        net[fn] = function (o) { throw denyNet(`net.${fn}`, (o && (o.port || o.path)) || o); };
      }
    } catch { /* ignore */ }
  } else {
    // Trace-only mode still records that a door was used, without closing it.
    const g = globalThis;
    if (typeof g.fetch === "function") {
      const orig = g.fetch;
      g.fetch = function (u, ...r) { emit({ ev: "net", kind: "fetch", target: String((u && u.url) || u).slice(0, 200) }); return orig.call(this, u, ...r); };
    }
  }

  // ── EXIT ──────────────────────────────────────────────────────────────────
  const t0 = Date.now();
  const done = (code) => {
    if (flushed) return;
    flushed = true;
    if (TRACE) { rows.push({ organ: LABEL, pid: process.pid, ev: "exit", code, ms: Date.now() - t0 }); flush(); }
  };
  process.on("exit", (c) => done(c));
  process.on("uncaughtException", (e) => { emit({ ev: "uncaught", msg: String((e && e.message) || e).slice(0, 300) }); done(1); throw e; });
}
