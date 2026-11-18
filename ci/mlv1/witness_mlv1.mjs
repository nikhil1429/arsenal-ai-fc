#!/usr/bin/env node
// ============================================================================
// ci/mlv1/witness_mlv1.mjs — UNIT mlv1 · SITTING ADOPTS THE KEEPER WITH A DEFERRED RETIRE (forks row 1031, M0 ITEM 2)
// ----------------------------------------------------------------------------
// CONTRACT (judged on --org; the build reads GREEN, the item base reads RED). Every plant runs a REAL keeper
// (`scripts/sitting.mjs daemon`, the service's own arguments) on a COPY of --org under os.tmpdir(), on a free port,
// with the sitting's state in a planted temp dir and ANTHROPIC_API_KEY planted so every model lane refuses (no live
// model call can be made by any plant).
//   I1 IDLE      no sitting open: a write to a file of its closure RETIRES the worker (a new pid) and the new worker
//                booted after that write (the new bytes serve).
//   I2 MID       a sitting OPEN (planted on disk, resumed at boot, with undelivered units): a closure write DEFERS (the
//                DEFERRED line, the same pid, the sitting still open with every unit undelivered and the cursor
//                unmoved); his close lands through the door; THEN it retires, and the closed sitting on disk lost 0
//                items (plan, cursor, every unit row) and carries its own close reason.
//   I3 JUDGE     the judge port held (a planted round): a closure write DEFERS naming the judge, the same pid; the port
//                freed, the next write retires it.
//   XML          the service XML the generator emits for sitting is byte-identical between --base-org and --org.
//   BOUND        only the named files differ (scripts/ + setup/, by bytes).
//   LAST         no node process naming this run's temp dir survives.
// Bounds are MEASURED in this run: SLACK = one node start; BOOT = the first keeper's spawn → its /status answering.
// Every wait is bounded by BOOT + SLACK (a worker respawn is one node start and an import, inside a keeper start).
// LAST LINE: GREEN MLV1 <what> · <n> clause(s) (exit 0) or RED MLV1 · <clauses> (exit 1)
// ============================================================================
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, appendFileSync, rmSync, readdirSync, cpSync, existsSync, statSync, symlinkSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawn, spawnSync, execFileSync } from "node:child_process";
import { createServer } from "node:net";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const ORG = resolve(arg("--org") || "."), BASE = arg("--base-org") ? resolve(arg("--base-org")) : null;
const UNIT = "MLV1", NAMED = ["scripts/sitting.mjs", "scripts/keeper.mjs"];
const TMP = mkdtempSync(join(tmpdir(), "mlv1-witness-"));
const results = [];
const clause = async (id, fn) => {
  let ok = false, why = "";
  try { const r = await fn(); ok = r === true || (r && r.ok === true); why = (r && r.why) || ""; } catch (e) { why = `threw: ${String((e && e.message) || e).split("\n")[0].slice(0, 200)}`; }
  results.push({ id, ok });
  console.log(`  ${ok ? "GREEN" : "RED  "} ${id}${why ? ` · ${why}` : ""}`);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const t0 = Date.now(); spawnSync(process.execPath, ["-e", "0"]); const SLACK = Math.max(1, Date.now() - t0);
const freePort = () => new Promise((res) => { const s = createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => res(p)); }); });

// THE COPY: scripts/ setup/ package.json and the state dir as bytes (owners spawned by a close write THERE, never in --org)
const COPY = join(TMP, "org");
for (const p of [["scripts"], ["setup"], ["package.json"], ["dressing-room", "state"]]) if (existsSync(join(ORG, ...p))) cpSync(join(ORG, ...p), join(COPY, ...p), { recursive: true, filter: (s) => !/\.log$/.test(s) });
if (existsSync(join(ORG, "node_modules"))) symlinkSync(join(ORG, "node_modules"), join(COPY, "node_modules"), "junction");
const ENTRY = join(COPY, "scripts", "sitting.mjs");
const SDIR = join(TMP, "sitting-state"); mkdirSync(SDIR);
const PORT = await freePort();
const ENV = { ...process.env, ARSENAL_SITTING_PORT: String(PORT), ARSENAL_SITTING_STATE_DIR: SDIR, ANTHROPIC_API_KEY: "planted-refusal-not-a-key" };

const kids = [];
let out = [];
function startKeeper() {
  out = [];
  const c = spawn(process.execPath, [ENTRY, "daemon"], { cwd: COPY, env: ENV, stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
  c.stdout.on("data", (d) => { out.push(...String(d).split(/\r?\n/).filter(Boolean)); });
  c.stderr.on("data", (d) => { out.push(...String(d).split(/\r?\n/).filter(Boolean)); });
  kids.push(c);
  return c;
}
const killTree = async (c) => {
  if (!c || c.exitCode != null || c.signalCode != null) return;
  if (process.platform === "win32") { try { execFileSync("taskkill", ["/PID", String(c.pid), "/T", "/F"], { stdio: "ignore" }); } catch { /* gone */ } }
  else c.kill("SIGTERM");
  await new Promise((r) => (c.exitCode != null || c.signalCode != null ? r() : c.once("exit", r)));
};
const status = async () => { try { const r = await fetch(`http://127.0.0.1:${PORT}/status`, { ...(BOUNDS.boot ? { signal: AbortSignal.timeout(BOUNDS.boot + SLACK) } : {}) }); return await r.json(); } catch { return null; } };
const BOUNDS = { boot: 0 };
const waitFor = async (pred, bound) => { const end = Date.now() + bound; for (;;) { const v = await pred(); if (v) return v; if (Date.now() > end) return null; await sleep(SLACK); } };
const portUp = async () => { const s = await status(); return s && s.ok ? s : null; };
const touchClosure = () => appendFileSync(ENTRY, `\n// witness mlv1 write ${Date.now()}\n`);
const linesSince = (n, re) => out.slice(n).find((l) => re.test(l));

console.log(`witness mlv1 · org ${ORG} · slack ${SLACK} ms (one node start, measured)`);

// FIRST BOOT — measured, it is every later wait's bound
let keeper = startKeeper();
{
  // unbounded by design: nothing is measured yet, and a keeper that exits ends the wait
  const s0 = Date.now();
  for (;;) { if (await portUp()) break; if (keeper.exitCode != null) break; await sleep(SLACK); }
  BOUNDS.boot = Date.now() - s0;
}
const BOUND = BOUNDS.boot + SLACK;
console.log(`  first keeper up in ${BOUNDS.boot} ms · every wait bounded by ${BOUND} ms (boot + slack)`);

await clause("I1 IDLE · no sitting open: a closure write retires the worker and the new bytes serve", async () => {
  const s1 = await portUp(); if (!s1) return { ok: false, why: `no daemon up · ${out.slice(-2).join(" | ")}` };
  touchClosure();
  const wrote = statSync(ENTRY).mtimeMs;
  const s2 = await waitFor(async () => { const s = await portUp(); return s && s.pid !== s1.pid ? s : null; }, BOUND);
  const ok = !!s2 && Date.parse(s2.booted_at) >= Math.floor(wrote) - 1 && s2.open === false;
  return { ok, why: s2 ? `pid ${s1.pid} → ${s2.pid} · booted ${s2.booted_at}` : `the same pid ${s1.pid} after ${BOUND} ms (no retire)` };
});

await clause("I2 MID · an open sitting defers the retire, loses 0 items, and the close lets it retire", async () => {
  await killTree(keeper);
  const id = "s-mlv1-planted";
  writeFileSync(join(SDIR, "sitting.json"), JSON.stringify({ id, captain: "planted", surfaces: ["code"], task: "planted", route: "FORGE", transport: "code", opened_at: new Date().toISOString(), last_turn_at: new Date().toISOString(), closed_at: null, close_reason: null,
    plan: [{ i: 0, kind: "say", text: "u0", est_seconds: 1 }, { i: 1, kind: "say", text: "u1", est_seconds: 1 }, { i: 2, kind: "say", text: "u2", est_seconds: 1 }], plan_source: "planted", plan_map: null, cursor: 2, unit_seq: 2, pending_question: null,
    stats: { turns: 0, by_class: { deliver: 0, respond: 0, compose: 0, judge: 0 }, tokens: { input: 0, output: 0, cache_creation: 0, cache_read: 0 }, latency_ms: { deliver: [], respond: [], compose: [], judge: [] }, units_composed: 2, units_delivered: 0, banked: 0, owner_calls: 0, head_tokens: null } }));
  writeFileSync(join(SDIR, "sitting_out.jsonl"), [0, 1].map((i) => JSON.stringify({ kind: "unit", id: `${id}-u${i}`, sitting_id: id, text: `u${i}`, est_seconds: 1, question: false, class: "deliver" })).join("\n") + "\n");
  keeper = startKeeper();
  const s1 = await waitFor(async () => { const s = await portUp(); return s && s.open ? s : null; }, BOUND);
  if (!s1) return { ok: false, why: "the planted open sitting did not resume" };
  const n = out.length;
  touchClosure();
  const deferred = await waitFor(async () => linesSince(n, /retire DEFERRED/), BOUND);
  const mid = await portUp();
  const held = !!deferred && mid && mid.pid === s1.pid && mid.open === true && mid.undelivered === s1.undelivered && mid.cursor === s1.cursor;
  if (!held) return { ok: false, why: `mid-sitting: ${deferred ? "DEFERRED" : "no DEFERRED line"} · pid ${s1.pid} → ${mid && mid.pid} · open ${mid && mid.open} · undelivered ${s1.undelivered} → ${mid && mid.undelivered}` };
  const closed = await (await fetch(`http://127.0.0.1:${PORT}/close`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ reason: "his_word" }) })).json();
  const s2 = await waitFor(async () => { const s = await portUp(); return s && s.pid !== s1.pid ? s : null; }, BOUND);
  const disk = JSON.parse(readFileSync(join(SDIR, "sitting.json"), "utf8"));
  const units = readFileSync(join(SDIR, "sitting_out.jsonl"), "utf8").split(/\r?\n/).filter(Boolean).map((l) => JSON.parse(l)).filter((r) => r.kind === "unit" && r.sitting_id === id);
  const lost = (3 - (disk.plan || []).length) + (2 - units.length) + (disk.cursor === 2 ? 0 : 1);
  const ok = closed.ok === true && !!s2 && s2.open === false && disk.closed_at && disk.close_reason === "his_word" && lost === 0;
  return { ok, why: `deferred on pid ${s1.pid} with ${s1.undelivered} undelivered · close ${closed.ok} · after close pid → ${s2 ? s2.pid : "UNCHANGED"} · ${lost} item(s) lost` };
});

await clause("I3 JUDGE · a held judge port defers the retire; freed, the next write retires", async () => {
  const k = await import(pathToFileURL(join(ORG, "scripts", "keeper.mjs")).href);
  const jport = k.JUDGE_PORT;
  if (!jport) return { ok: false, why: "keeper.mjs names no JUDGE_PORT" };
  const judge = spawn(process.execPath, ["-e", `require("net").createServer().listen(${jport}, "127.0.0.1", () => console.log("HELD")); setInterval(() => {}, 1 << 30); // ${TMP}`], { stdio: ["ignore", "pipe", "inherit"] });
  kids.push(judge);
  const held = await new Promise((res) => { judge.stdout.on("data", (d) => /HELD/.test(String(d)) && res(true)); judge.once("exit", () => res(false)); });
  if (!held) return { ok: false, why: `the judge port :${jport} could not be held` };
  const s1 = await portUp(); if (!s1) { await killTree(judge); return { ok: false, why: "no daemon up" }; }
  const n = out.length;
  touchClosure();
  const deferred = await waitFor(async () => linesSince(n, /retire DEFERRED.*judge/), BOUND);
  const mid = await portUp();
  await killTree(judge);
  touchClosure();
  const s2 = await waitFor(async () => { const s = await portUp(); return s && s.pid !== s1.pid ? s : null; }, BOUND);
  const ok = !!deferred && mid && mid.pid === s1.pid && !!s2;
  return { ok, why: `${deferred ? "DEFERRED naming the judge" : "no DEFERRED line"} · held pid ${s1.pid} → ${mid && mid.pid} · freed → ${s2 ? s2.pid : "no retire"}` };
});

await killTree(keeper);

const walk = (root, dir, o = new Map()) => {
  let ents = []; try { ents = readdirSync(join(root, dir), { withFileTypes: true }); } catch { return o; }
  for (const e of ents) { const rel = `${dir}/${e.name}`; if (e.isDirectory()) walk(root, rel, o); else if (/\.(mjs|js|json|ps1|xml|vbs|cmd|md)$/.test(e.name)) o.set(rel, createHash("sha256").update(readFileSync(join(root, rel), "utf8").replace(/\r\n/g, "\n")).digest("hex")   /* CRLF-proof: a line ending is not a change */); }
  return o;
};
if (BASE) {
  await clause("XML · the service XML emitted for sitting keeps its exact bytes (no reinstall by his hand)", async () => {
    const a = await import(pathToFileURL(join(BASE, "scripts", "services.mjs")).href), b = await import(pathToFileURL(join(ORG, "scripts", "services.mjs")).href);
    const norm = (x, root) => x.split(root).join("<ROOT>").replace(/\r\n/g, "\n");   // the working directory is each org's own root
    const xa = norm(a.winswXml(a.headless().find((r) => r.name === "sitting")), BASE), xb = norm(b.winswXml(b.headless().find((r) => r.name === "sitting")), ORG);
    return { ok: xa === xb && /scripts\/sitting\.mjs daemon|scripts\\sitting\.mjs daemon/.test(xb), why: xa === xb ? "identical" : "the XML CHANGED" };
  });
  await clause("BOUND · only the named files differ (scripts/ + setup/, by bytes)", () => {
    const a = new Map([...walk(BASE, "scripts"), ...walk(BASE, "setup")]), b = new Map([...walk(ORG, "scripts"), ...walk(ORG, "setup")]);
    const diff = [...new Set([...a.keys(), ...b.keys()])].filter((k) => a.get(k) !== b.get(k)).sort(), extra = diff.filter((f) => !NAMED.includes(f));
    return { ok: extra.length === 0, why: `${diff.length} file(s) differ${extra.length ? ` · BEYOND THE NAMED: ${extra.join(", ")}` : ""}` };
  });
}
for (const c of kids) await killTree(c);
rmSync(TMP, { recursive: true, force: true });
await clause("LAST · no node process naming the temp dir survives", () => {
  let table = "";
  try {
    table = process.platform === "win32"
      ? execFileSync("powershell.exe", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | ForEach-Object { $_.CommandLine }"], { encoding: "utf8" })
      : execFileSync("ps", ["-eo", "args"], { encoding: "utf8" });
  } catch (e) { return { ok: false, why: `process table unreadable: ${e.message}` }; }
  const left = table.split(/\r?\n/).filter((l) => l.includes(TMP) && !/\bps -eo\b/.test(l));
  return { ok: left.length === 0, why: `${left.length} survivor(s)` };
});
const red = results.filter((r) => !r.ok).map((r) => r.id.split(" · ")[0]);
if (red.length) { console.log(`RED ${UNIT} · ${red.join(", ")}`); process.exit(1); }
console.log(`GREEN ${UNIT} sitting retires on a source change only when no sitting is open and no judge round runs · ${results.length} clause(s)`);
process.exit(0);
