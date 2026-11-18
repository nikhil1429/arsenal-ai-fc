#!/usr/bin/env node
// ============================================================================
// ci/mlv0/witness_mlv0.mjs — UNIT mlv0 · THE STATUS LINE AND THE JUDGE PORT (forks row 1031, M0 ITEM 1)
// ----------------------------------------------------------------------------
// CONTRACT (each clause judged on --org; run once on the build = GREEN, once on the base = RED):
//   S1 CLOSURE   services.mjs status: a planted RUNNING unit whose IMPORTED module moved after its boot reads
//                STALE naming that module; the same tree with nothing moved reads current.
//   S2 K6        conductor's daemon step, a /status stamp whose module_mtime_ms IS the entry's (the 18 Nov hole):
//                an imported module moved after booted_at → STALE BUILD naming it (the base reads "build current").
//   S3 UNVERIFIED a RUNNING unit with no readable boot instant reads UNVERIFIED, never "current".
//   M2 BOOT      cortex answers GET /status with booted_at (and never module_mtime_ms); brain's singleton answers it.
//   M4 JUDGE     a process holding the judge port (keeper.holdJudgePort) reads "a round is RUNNING" on the status
//                line, and its death frees it; the judge CLI holds the port before gradeJudge; the brain's and the
//                context's retire read judgeHeld() before RETIRING.
//   BOUND        only the named files differ between --base-org and --org (scripts/ and setup/ compared by bytes).
//   LAST         no node process naming this run's temp dir survives.
// Plants live on copies under os.tmpdir(); nothing under dressing-room/state is read for a verdict or written.
// A clock-bound plant derives its slack from a node start measured in this run (row 1025 (2)), never a typed ratio.
// Windows-safe: no shell, CRLF-proof source reads, process listing by the platform's own tool.
// LAST LINE: GREEN MLV0 <what> · <n> clause(s)  (exit 0)  or  RED MLV0 · <clauses>  (exit 1)
// ============================================================================
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, utimesSync, rmSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, resolve, relative } from "node:path";
import { tmpdir } from "node:os";
import { spawn, spawnSync, execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const ORG = resolve(arg("--org") || "."), BASE = arg("--base-org") ? resolve(arg("--base-org")) : null;
const NAMED = ["scripts/keeper.mjs", "scripts/gaffer_brain.mjs", "scripts/cortex.mjs", "scripts/brain.mjs", "scripts/context.mjs", "scripts/conductor.mjs", "scripts/services.mjs"];
const TMP = mkdtempSync(join(tmpdir(), "mlv0-witness-"));
const results = [];
const clause = async (id, fn) => {
  let ok = false, why = "";
  try { const r = await fn(); ok = r === true || (r && r.ok === true); why = (r && r.why) || ""; } catch (e) { ok = false; why = `threw: ${String((e && e.message) || e).split("\n")[0].slice(0, 200)}`; }
  results.push({ id, ok });
  console.log(`  ${ok ? "GREEN" : "RED  "} ${id}${why ? ` · ${why}` : ""}`);
};
const imp = (rel) => import(pathToFileURL(join(ORG, rel)).href);
const src = (rel) => readFileSync(join(ORG, rel), "utf8").replace(/\r\n/g, "\n");

// THE SLACK: one node start, measured in this run.
const t0 = Date.now(); spawnSync(process.execPath, ["-e", "0"]); const SLACK = Math.max(1, Date.now() - t0);

// a planted unit tree: scripts/<entry> imports ./planted_dep.mjs
function plantTree(entryName) {
  const root = mkdtempSync(join(TMP, "tree-"));
  mkdirSync(join(root, "scripts"));
  writeFileSync(join(root, "scripts", entryName), `import { x } from "./planted_dep.mjs";\nexport const y = x;\n`);
  writeFileSync(join(root, "scripts", "planted_dep.mjs"), "export const x = 1;\n");
  return root;
}
const setMtime = (p, ms) => utimesSync(p, new Date(ms), new Date(ms));

console.log(`witness mlv0 · org ${ORG} · slack ${SLACK} ms (one node start, measured)`);

await clause("S1 CLOSURE · an imported module moved after boot reads STALE naming it; nothing moved reads current", async () => {
  const svc = await imp("scripts/services.mjs");
  if (typeof svc.unitLines !== "function") return { ok: false, why: "services.mjs has no per-unit status line (unitLines absent)" };
  const root = plantTree("sitting.mjs");
  const boot = Date.now() - SLACK * 4;
  for (const f of ["sitting.mjs", "planted_dep.mjs"]) setMtime(join(root, "scripts", f), boot - SLACK);
  const rows = svc.headless().map((r) => ({ name: r.name, kind: "service", installed: true, running: r.name === "sitting" }));
  const deps = { root, stamp: async () => ({ booted_at: new Date(boot).toISOString() }), judgeHeld: async () => false };
  const clean = (await svc.unitLines(rows, deps)).find((l) => /^\s+sitting /.test(l)) || "";
  setMtime(join(root, "scripts", "planted_dep.mjs"), boot + SLACK);
  const moved = (await svc.unitLines(rows, deps)).find((l) => /^\s+sitting /.test(l)) || "";
  const ok = /· current/.test(clean) && /STALE/.test(moved) && /scripts\/planted_dep\.mjs/.test(moved) && !/scripts\/sitting\.mjs @/.test(moved);
  return { ok, why: ok ? "" : `clean "${clean.trim()}" · moved "${moved.trim()}"` };
});

await clause("S2 K6 · conductor reads the closure against booted_at, never the entry stamp alone", async () => {
  const c = await imp("scripts/conductor.mjs");
  const root = plantTree("thalamus.mjs");
  const boot = Date.now() - SLACK * 4;
  setMtime(join(root, "scripts", "thalamus.mjs"), boot - SLACK);
  setMtime(join(root, "scripts", "planted_dep.mjs"), boot + SLACK);
  const entryMs = statSync(join(root, "scripts", "thalamus.mjs")).mtimeMs;
  const rep = await c.conduct([{ id: "thalamus", args: ["scripts/thalamus.mjs"], daemon: { port: 1 } }], {
    noReport: true, dayInfo: { day: "2026-11-18" }, root, probe: async () => true, launch: () => { throw new Error("must not launch"); },
    buildStamp: async () => ({ booted_at: new Date(boot).toISOString(), module_mtime_ms: entryMs }),
    mtimeOf: (rel) => statSync(join(root, rel)).mtimeMs, processStartMs: () => null, newestGraphMtime: () => ({ ms: null, file: null }) });
  const s = rep.steps[0] || {};
  const ok = s.ok === false && /STALE/.test(s.daemon || "") && /scripts\/planted_dep\.mjs/.test(s.error || "");
  return { ok, why: ok ? "" : `reads "${s.daemon}"${s.error ? ` · ${s.error}` : ""}` };
});

await clause("S3 UNVERIFIED · no readable boot instant is never current", async () => {
  const svc = await imp("scripts/services.mjs");
  if (typeof svc.unitLines !== "function") return { ok: false, why: "unitLines absent" };
  const root = plantTree("sitting.mjs");
  const rows = svc.headless().map((r) => ({ name: r.name, kind: "service", installed: true, running: true }));
  const lines = await svc.unitLines(rows, { root, stamp: async () => null, contextStamp: () => ({}), judgeHeld: async () => false });
  const running = lines.filter((l) => !/^\s+judge /.test(l));
  const ok = running.length > 0 && running.every((l) => /UNVERIFIED/.test(l) && !/· current/.test(l));
  return { ok, why: ok ? "" : running.map((l) => l.trim()).join(" | ") };
});

await clause("M2 BOOT · cortex and brain publish booted_at on /status", async () => {
  const cx = await imp("scripts/cortex.mjs");
  const r = typeof cx.lockRoute === "function" ? cx.lockRoute("GET", "/status") : null;
  const cortexOk = !!r && r.status === 200 && Number.isFinite(Date.parse(r.body && r.body.booted_at)) && !("module_mtime_ms" in (r.body || {})) && r.arm === false;
  const b = src("scripts/brain.mjs");
  const arm = (b.split(/if \(mode === "daemon-worker"\) \{/)[1] || "").split("RETIRING")[0];
  const brainOk = /createSingleton\(\(req, res\) => \{[\s\S]{0,300}"\/status"[\s\S]{0,300}booted_at/.test(arm);
  return { ok: cortexOk && brainOk, why: `cortex GET /status ${r ? r.status : "no route"} · brain singleton ${brainOk ? "answers /status" : "answers nothing"}` };
});

await clause("M4 JUDGE · a held judge port reads RUNNING, its death frees it; the judge CLI and every retire read it", async () => {
  const k = await imp("scripts/keeper.mjs");
  if (typeof k.holdJudgePort !== "function" || typeof k.judgeHeld !== "function") return { ok: false, why: "keeper.mjs exports no judge port" };
  const port = k.JUDGE_PORT;
  const child = spawn(process.execPath, ["--input-type=module", "-e",
    `const k = await import(${JSON.stringify(pathToFileURL(join(ORG, "scripts/keeper.mjs")).href)}); const s = await k.holdJudgePort(); if (!s) process.exit(3); s.ref(); console.log("HELD"); setInterval(() => {}, 1 << 30); // ${TMP}`], { stdio: ["ignore", "pipe", "inherit"] });
  const held = await new Promise((res) => { child.stdout.on("data", (d) => { if (/HELD/.test(String(d))) res(true); }); child.once("exit", () => res(false)); });
  const svc = await imp("scripts/services.mjs");
  const rows = svc.headless().map((r) => ({ name: r.name, kind: "service", installed: false, running: false }));
  const whileHeld = held ? (await svc.unitLines(rows, {})).find((l) => /^\s+judge /.test(l)) || "" : "";
  child.kill(); await new Promise((res) => child.exitCode != null || child.signalCode != null ? res() : child.once("exit", res));
  const after = (await svc.unitLines(rows, {})).find((l) => /^\s+judge /.test(l)) || "";
  const g = src("scripts/gaffer_brain.mjs");
  const jarm = (g.split(/if \(mode === "judge-round" \|\| mode === "judge-due"\) \{/)[1] || "");
  const cliOk = jarm.indexOf("await holdJudgePort()") > -1 && jarm.indexOf("await holdJudgePort()") < jarm.indexOf("await gradeJudge(");
  const b = src("scripts/brain.mjs"), barm = (b.split(/if \(mode === "daemon-worker"\) \{/)[1] || "").split("--daemon stopped")[0];
  const brainOk = /stale\.length && await judgeHeld\(\)/.test(barm) && barm.indexOf("judgeHeld()") < barm.indexOf("--daemon RETIRING");
  const cx = src("scripts/context.mjs"), carm = (cx.split(/if \(mode === "daemon-worker"\) \{/)[1] || "").split("--daemon stopped")[0];
  const ctxOk = /await judgeHeld\(\)/.test(carm) && /bv\.checked && bv\.stale && !judgeRunning/.test(carm) && carm.indexOf("judgeHeld()") < carm.indexOf("--daemon RETIRING");
  const ok = held && /RUNNING/.test(whileHeld) && new RegExp(`:${port} held`).test(whileHeld) && /no round running/.test(after) && cliOk && brainOk && ctxOk;
  return { ok, why: `port ${port} held ${held} · while "${whileHeld.trim()}" · after "${after.trim()}" · cli ${cliOk} · brain retire ${brainOk} · context retire ${ctxOk}` };
});

// BOUND: compare scripts/ and setup/ by bytes, base vs org
const walk = (root, dir, out = new Map()) => {
  let ents = [];
  try { ents = readdirSync(join(root, dir), { withFileTypes: true }); } catch { return out; }
  for (const e of ents) {
    const rel = `${dir}/${e.name}`;
    if (e.isDirectory()) walk(root, rel, out);
    else if (/\.(mjs|js|json|ps1|xml|vbs|cmd|md)$/.test(e.name) && !/\.log$/.test(e.name)) out.set(rel, createHash("sha256").update(readFileSync(join(root, rel))).digest("hex"));
  }
  return out;
};
if (BASE) {
  await clause("BOUND · only the named files differ (scripts/ + setup/, by bytes)", () => {
    const a = new Map([...walk(BASE, "scripts"), ...walk(BASE, "setup")]), b = new Map([...walk(ORG, "scripts"), ...walk(ORG, "setup")]);
    const diff = [...new Set([...a.keys(), ...b.keys()])].filter((k) => a.get(k) !== b.get(k)).sort();
    const extra = diff.filter((f) => !NAMED.includes(f));
    return { ok: extra.length === 0, why: `${diff.length} file(s) differ${extra.length ? ` · BEYOND THE NAMED: ${extra.join(", ")}` : ""}` };
  });
}

rmSync(TMP, { recursive: true, force: true });
await clause("LAST · no node process naming the temp dir survives", () => {
  let table = "";
  try {
    table = process.platform === "win32"
      ? execFileSync("powershell.exe", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | ForEach-Object { $_.CommandLine }"], { encoding: "utf8" })
      : execFileSync("ps", ["-eo", "args"], { encoding: "utf8" });
  } catch (e) { return { ok: false, why: `process table unreadable: ${e.message}` }; }
  const left = table.split(/\r?\n/).filter((l) => l.includes(TMP) && !l.includes("ps -eo"));
  return { ok: left.length === 0, why: `${left.length} survivor(s)` };
});

const red = results.filter((r) => !r.ok).map((r) => r.id.split(" ")[0] + (r.id.split(" ")[1] && !/·/.test(r.id.split(" ")[1]) ? ` ${r.id.split(" ")[1]}` : ""));
if (red.length) { console.log(`RED MLV0 · ${red.join(", ")}`); process.exit(1); }
console.log(`GREEN MLV0 the status line reads the closure, and the judge port defers every retire · ${results.length} clause(s)`);
process.exit(0);
