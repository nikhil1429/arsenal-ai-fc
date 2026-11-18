#!/usr/bin/env node
// ============================================================================
// ci/mlv2/witness_mlv2.mjs — UNIT mlv2 · CORTEX ADOPTS THE KEEPER WITH A DEFERRED RETIRE (forks row 1031, M0 ITEM 3)
// ----------------------------------------------------------------------------
// CONTRACT (judged on --org; the build reads GREEN, the item base reads RED). Every plant runs a REAL keeper
// (`scripts/cortex.mjs` with no mode, the service's own arguments) on a COPY of --org under os.tmpdir(), with the
// copy's wake queue planted and ANTHROPIC_API_KEY planted so every model lane refuses (no live model call). Cortex's
// ports are its own fixed ones (:4112 lock, :4113 the thalamus it posts to); a PLANTED thalamus answers :4113.
//   C1 IDLE      no lane in flight: a closure write RETIRES the worker (a new pid) and the new worker booted after it.
//   C2 LANE      a lane IN FLIGHT (an expired planted wake whose decline POST the planted thalamus holds open): a
//                closure write DEFERS (the DEFERRED line, the same pid); the POST released, the lane closes, THEN it
//                retires — and the planted thalamus received that moment EXACTLY ONCE, answered (0 lost, 0 twice).
//   C3 JUDGE     the judge port held: a closure write DEFERS naming the judge, the same pid; freed, the next write
//                retires it.
//   K5 DOOR      his restart door (POST /restart, no lane in flight) exits as a RETIRE: the keeper respawns it (a new
//                pid answers :4112), never the clean stop that left the service STOPPED.
//   XML          the service XML emitted for cortex keeps its exact bytes (roots normalised).
//   BOUND        only the named files differ (scripts/ + setup/, by bytes).
//   LAST         no node process naming this run's temp dir survives.
// Bounds are MEASURED in this run: SLACK = one node start; BOOT = the first keeper's spawn → its /status answering.
// Every wait is bounded by BOOT + SLACK.
// LAST LINE: GREEN MLV2 <what> · <n> clause(s) (exit 0) or RED MLV2 · <clauses> (exit 1)
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
const UNIT = "MLV2", NAMED = ["scripts/cortex.mjs"];
const TMP = mkdtempSync(join(tmpdir(), "mlv2-witness-"));
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
const ENTRY = join(COPY, "scripts", "cortex.mjs");
const SDIR = join(COPY, "dressing-room", "state");
const PORT = 4112;   // cortex's own lock port (scripts/cortex.mjs), not configurable
const ENV = { ...process.env, ANTHROPIC_API_KEY: "planted-refusal-not-a-key" };
// the planted queue: nothing pending, so no lane opens until a plant puts one there
writeFileSync(join(SDIR, "wake_queue.jsonl"), "");
rmSync(join(SDIR, "wake.json"), { force: true });
// THE PLANTED THALAMUS on :4113: records every /deep-answer, writes the resolution row the real owner would, and
// holds the response while `hold` is set (that is what keeps a lane IN FLIGHT)
const posts = []; let hold = false; const parked = [];
const { createServer: httpServer } = await import("node:http");
const thal = httpServer(async (req, res) => {
  let raw = ""; for await (const c of req) raw += c;
  let b = {}; try { b = JSON.parse(raw); } catch { /* recorded as is */ }
  posts.push(b);
  if (b.moment_id) appendFileSync(join(SDIR, "wake_queue.jsonl"), JSON.stringify({ moment_id: b.moment_id, status: "declined", ts: new Date().toISOString() }) + "\n");
  const answer = () => { res.writeHead(200, { "content-type": "application/json" }); res.end(JSON.stringify({ ok: true })); };
  if (hold) parked.push(answer); else answer();
});
const thalUp = await new Promise((r) => { thal.once("error", () => r(false)); thal.listen(4113, "127.0.0.1", () => r(true)); });

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
const touchClosure = () => appendFileSync(ENTRY, `\n// witness mlv2 write ${Date.now()}\n`);
const linesSince = (n, re) => out.slice(n).find((l) => re.test(l));

console.log(`witness mlv2 · org ${ORG} · slack ${SLACK} ms (one node start, measured) · planted thalamus on :4113 ${thalUp ? "up" : "NOT BOUND (held by another process)"}`);

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

await clause("C1 IDLE · no lane in flight: a closure write retires the worker and the new bytes serve", async () => {
  const s1 = await portUp(); if (!s1) return { ok: false, why: `no daemon up · ${out.slice(-2).join(" | ")}` };
  touchClosure();
  const wrote = statSync(ENTRY).mtimeMs;
  const s2 = await waitFor(async () => { const s = await portUp(); return s && s.pid !== s1.pid ? s : null; }, BOUND);
  const ok = !!s2 && Date.parse(s2.booted_at) >= Math.floor(wrote) - 1;
  return { ok, why: s2 ? `pid ${s1.pid} → ${s2.pid} · booted ${s2.booted_at}` : `the same pid ${s1.pid} after ${BOUND} ms (no retire)` };
});

await clause("C2 LANE · a lane in flight defers the retire; its close lets it retire; the moment reached home exactly once", async () => {
  if (!thalUp) return { ok: false, why: ":4113 is held by another process — the planted thalamus could not bind" };
  const s1 = await portUp(); if (!s1) return { ok: false, why: "no daemon up" };
  const mid = "m-mlv2-planted";
  hold = true;
  appendFileSync(join(SDIR, "wake_queue.jsonl"), JSON.stringify({ moment_id: mid, status: "pending", ts: new Date(0).toISOString() }) + "\n");
  // the lane opens on cortex's own dispatch: its fs.watch debounce or, at the latest, its own poll — read from ITS source
  const poll = Number((/setInterval\(\(\) => \{ retireIfArmed\(\); fire\(\); \}, (\d+)\)/.exec(readFileSync(ENTRY, "utf8")) || [])[1]);
  const inflight = await waitFor(async () => posts.some((p) => p.moment_id === mid) && parked.length > 0, (Number.isFinite(poll) ? poll : 0) + BOUND);
  if (!inflight) { hold = false; return { ok: false, why: "the planted lane never opened (no POST reached the planted thalamus)" }; }
  const n = out.length;
  touchClosure();
  const deferred = await waitFor(async () => linesSince(n, /retire DEFERRED/), BOUND);
  const during = await portUp();
  hold = false; for (const a of parked.splice(0)) a();
  const s2 = await waitFor(async () => { const s = await portUp(); return s && s.pid !== s1.pid ? s : null; }, BOUND);
  if (s2) await sleep(BOUND);   // the new worker's boot fire has run: a re-dispatch would be counted below
  const times = posts.filter((p) => p.moment_id === mid).length;
  const ok = !!deferred && during && during.pid === s1.pid && !!s2 && times === 1;
  return { ok, why: `${deferred ? "DEFERRED" : "no DEFERRED line"} with the lane in flight · pid ${s1.pid} → ${during && during.pid} · after the lane closed → ${s2 ? s2.pid : "no retire"} · the moment reached home ${times} time(s)` };
});

await clause("C3 JUDGE · a held judge port defers the retire; freed, the next write retires", async () => {
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

await clause("K5 DOOR · his restart door exits as a retire and the keeper brings the fresh build up", async () => {
  const s1 = await portUp(); if (!s1) return { ok: false, why: "no daemon up" };
  const r = await (await fetch(`http://127.0.0.1:${PORT}/restart`, { method: "POST" })).json().catch(() => ({}));
  const s2 = await waitFor(async () => { const s = await portUp(); return s && s.pid !== s1.pid ? s : null; }, BOUND);
  return { ok: r.armed === true && !!s2, why: `armed ${r.armed} · pid ${s1.pid} → ${s2 ? s2.pid : "NOTHING answers :4112 (the clean stop: the unit is down)"}` };
});

await killTree(keeper);

const walk = (root, dir, o = new Map()) => {
  let ents = []; try { ents = readdirSync(join(root, dir), { withFileTypes: true }); } catch { return o; }
  for (const e of ents) { const rel = `${dir}/${e.name}`; if (e.isDirectory()) walk(root, rel, o); else if (/\.(mjs|js|json|ps1|xml|vbs|cmd|md)$/.test(e.name)) o.set(rel, createHash("sha256").update(readFileSync(join(root, rel))).digest("hex")); }
  return o;
};
if (BASE) {
  await clause("XML · the service XML emitted for cortex keeps its exact bytes (no reinstall by his hand)", async () => {
    const a = await import(pathToFileURL(join(BASE, "scripts", "services.mjs")).href), b = await import(pathToFileURL(join(ORG, "scripts", "services.mjs")).href);
    const norm = (x, root) => x.split(root).join("<ROOT>").replace(/\r\n/g, "\n");   // the working directory is each org's own root
    const xa = norm(a.winswXml(a.headless().find((r) => r.name === "cortex")), BASE), xb = norm(b.winswXml(b.headless().find((r) => r.name === "cortex")), ORG);
    return { ok: xa === xb && /scripts[\\/]cortex\.mjs/.test(xb), why: xa === xb ? "identical" : "the XML CHANGED" };
  });
  await clause("BOUND · only the named files differ (scripts/ + setup/, by bytes)", () => {
    const a = new Map([...walk(BASE, "scripts"), ...walk(BASE, "setup")]), b = new Map([...walk(ORG, "scripts"), ...walk(ORG, "setup")]);
    const diff = [...new Set([...a.keys(), ...b.keys()])].filter((k) => a.get(k) !== b.get(k)).sort(), extra = diff.filter((f) => !NAMED.includes(f));
    return { ok: extra.length === 0, why: `${diff.length} file(s) differ${extra.length ? ` · BEYOND THE NAMED: ${extra.join(", ")}` : ""}` };
  });
}
for (const c of kids) await killTree(c);
await new Promise((r) => thal.close(r));
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
console.log(`GREEN ${UNIT} cortex retires on a source change only when no lane is in flight and no judge round runs, and its door is a retire · ${results.length} clause(s)`);
process.exit(0);
