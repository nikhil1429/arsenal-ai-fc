#!/usr/bin/env node
// ============================================================================
// ci/mlv3/witness_mlv3.mjs — UNIT mlv3 · THALAMUS (THE CAPTURE NERVE) ADOPTS THE KEEPER WITH A DEFERRED RETIRE
//                            (forks row 1031, M0 ITEM 4)
// ----------------------------------------------------------------------------
// CONTRACT (judged on --org; the build reads GREEN, the item base reads RED). Every plant runs a REAL keeper
// (`scripts/thalamus.mjs` with no mode, the service's own arguments) on a COPY of --org under os.tmpdir(), its spool a
// planted temp db (ARSENAL_SPOOL_DB), its config planted with the adjudicator and the pre-answer embedding OFF and
// ANTHROPIC_API_KEY planted to a non-key, so no ingest can make a model call. The NERVE is planted too: this witness
// writes each event ahead to the copy's own scripts/spool.mjs, then POSTs it, and marks it delivered only on a 2xx —
// exactly what hooks/afferent-post.mjs does.
//   T1 IDLE      spool drained, nothing in flight: a closure write RETIRES the worker (a new boot) after that write.
//   T2 ONCE      a stream of events runs THROUGH a retire (some arrive while nothing listens): every event lands in the
//                copy's afferent record EXACTLY ONCE (none lost, none twice) and the spool ends with 0 pending.
//   T3 INFLIGHT  an /afferent request IN FLIGHT (its body half-sent, from a lane that never spools): a closure write DEFERS (the DEFERRED line, the
//                same boot); the body finished, that event lands once, THEN it retires.
//   T4 JUDGE     the judge port held: a closure write DEFERS naming the judge; freed, the next write retires it.
//   XML · BOUND · LAST  as in every unit of this queue.
// Bounds are MEASURED in this run: SLACK = one node start; BOOT = the first keeper's spawn → its /status answering;
// every wait is bounded by BOOT + SLACK, plus the spool drainer's own declared tick where a drain is awaited (read from
// the organ's source, never typed).
// LAST LINE: GREEN MLV3 <what> · <n> clause(s) (exit 0) or RED MLV3 · <clauses> (exit 1)
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
const UNIT = "MLV3", NAMED = ["scripts/thalamus.mjs"];
const TMP = mkdtempSync(join(tmpdir(), "mlv3-witness-"));
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
const ENTRY = join(COPY, "scripts", "thalamus.mjs");
const SDIR = join(COPY, "dressing-room", "state");
const PORT = 4113;   // thalamus's own port (scripts/thalamus.mjs), not configurable
const SPOOLDB = join(TMP, "spool.db");
const ENV = { ...process.env, ARSENAL_SPOOL_DB: SPOOLDB, ANTHROPIC_API_KEY: "planted-refusal-not-a-key" };
// the planted config: the copy's own, with the two lanes that could spend switched OFF
{
  const cf = join(SDIR, "thalamus_config.json");
  let c = {}; try { c = JSON.parse(readFileSync(cf, "utf8")); } catch { c = {}; }
  c.adjudicator = { ...(c.adjudicator || {}), enabled: false };
  c.pre_answer = { ...(c.pre_answer || {}), enabled: false };
  writeFileSync(cf, JSON.stringify(c, null, 2));
}
process.env.ARSENAL_SPOOL_DB = SPOOLDB;   // the nerve's spool module reads it at load
const sp = await import(pathToFileURL(join(COPY, "scripts", "spool.mjs")).href);
const AFF = join(SDIR, "afferent.jsonl");
const landed = (id) => { let n = 0; try { for (const l of readFileSync(AFF, "utf8").split(/\r?\n/)) if (l.includes(id)) { try { if (JSON.parse(l).event_id === id) n++; } catch { /* a torn line is not ours */ } } } catch { /* no file yet */ } return n; };
let seq = 0;
const evtOf = (tag) => ({ event_id: `mlv3-${process.pid}-${tag}-${++seq}`, modality: "code", source: "witness-mlv3", text: `planted turn ${tag} ${seq}`, ts: new Date().toISOString() });
// THE PLANTED NERVE: write ahead, then POST, then mark — hooks/afferent-post.mjs's order
async function nerve(evt) {
  const w = sp.write(evt);
  if (!w.ok) return "unspooled";
  try {
    const r = await fetch(`http://127.0.0.1:${PORT}/afferent`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(evt) });
    if (r.ok) { sp.markDelivered(evt.event_id); return "delivered"; }
  } catch { /* nothing listening: the row stays pending, as the nerve leaves it */ }
  return "pending";
}
// the drainer's own tick, read from the organ (SPOOL_DRAIN_EVERY_MS), never typed here
const DRAIN_MS = Number((/const SPOOL_DRAIN_EVERY_MS\s*=\s*([\d_]+)/.exec(readFileSync(ENTRY, "utf8")) || [])[1]?.replace(/_/g, ""));
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
const touchClosure = () => appendFileSync(ENTRY, `\n// witness mlv3 write ${Date.now()}\n`);
const linesSince = (n, re) => out.slice(n).find((l) => re.test(l));

console.log(`witness mlv3 · org ${ORG} · slack ${SLACK} ms (one node start, measured) · drainer tick ${DRAIN_MS} ms (read from the organ)`);

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

const newBoot = (s1) => async () => { const s = await portUp(); return s && s.booted_at !== s1.booted_at ? s : null; };

await clause("T1 IDLE · spool drained: a closure write retires the worker and the new bytes serve", async () => {
  const s1 = await portUp(); if (!s1) return { ok: false, why: `no daemon up · ${out.slice(-2).join(" | ")}` };
  const pend0 = sp.stats().pending;
  touchClosure();
  const wrote = statSync(ENTRY).mtimeMs;
  const s2 = await waitFor(newBoot(s1), BOUND);
  const ok = !!s2 && Date.parse(s2.booted_at) >= Math.floor(wrote) - 1;
  return { ok, why: s2 ? `booted ${s1.booted_at} → ${s2.booted_at} · spool pending before ${pend0}` : `the same boot ${s1.booted_at} after ${BOUND} ms (no retire)` };
});

await clause("T2 ONCE · events streamed through a retire land exactly once, none lost, the spool drained", async () => {
  const s1 = await portUp(); if (!s1) return { ok: false, why: "no daemon up" };
  const sent = [], fates = { delivered: 0, pending: 0, unspooled: 0 };
  const send = async (tag) => { const e = evtOf(tag); sent.push(e.event_id); fates[await nerve(e)]++; };
  for (let i = 0; i < 3; i++) await send("before");
  touchClosure();
  // keep the nerve firing, one event per measured node start, until a NEW worker has answered, then three more
  let s2 = null; const end = Date.now() + BOUND;
  while (!s2 && Date.now() < end) { await send("during"); s2 = await newBoot(s1)(); if (!s2) await sleep(SLACK); }
  for (let i = 0; i < 3; i++) await send("after");
  // the new worker drains at boot and then every drainer tick: wait for 0 pending, bounded by that tick + BOUND
  const drained = await waitFor(async () => sp.stats().pending === 0, (Number.isFinite(DRAIN_MS) ? DRAIN_MS : 0) + BOUND);
  const counts = sent.map(landed), lost = counts.filter((n) => n === 0).length, twice = counts.filter((n) => n > 1).length;
  const ok = !!s2 && !!drained && lost === 0 && twice === 0 && fates.pending > 0;
  return { ok, why: `${sent.length} event(s) · ${fates.delivered} delivered live, ${fates.pending} arrived while nothing listened · retire ${s2 ? "yes" : "NO"} · spool ${drained ? "drained" : `${sp.stats().pending} still pending`} · lost ${lost} · twice ${twice}` };
});

await clause("T3 INFLIGHT · a capture request in flight defers the retire; it lands once, then it retires", async () => {
  const s1 = await portUp(); if (!s1) return { ok: false, why: "no daemon up" };
  const { request } = await import("node:http");
  // NOT spooled: a request from a lane that never spools (the bus/market lanes), so ONLY the in-flight count can hold it
  const e = evtOf("inflight");
  const body = JSON.stringify(e), half = Math.floor(body.length / 2);
  let answered = null;
  const req = request({ host: "127.0.0.1", port: PORT, path: "/afferent", method: "POST", headers: { "content-type": "application/json", "content-length": Buffer.byteLength(body) } }, (res) => { res.resume(); res.on("end", () => { answered = res.statusCode; }); });
  req.on("error", () => { answered = -1; });
  req.write(body.slice(0, half));
  await sleep(SLACK);
  const n = out.length;
  touchClosure();
  const deferred = await waitFor(async () => linesSince(n, /retire DEFERRED/), BOUND);
  const mid = await portUp();
  req.end(body.slice(half));
  await waitFor(async () => answered !== null, BOUND);
  const s2 = await waitFor(newBoot(s1), BOUND);
  const times = landed(e.event_id);
  const ok = !!deferred && mid && mid.booted_at === s1.booted_at && answered === 200 && times === 1 && !!s2;
  return { ok, why: `${deferred ? "DEFERRED" : "no DEFERRED line"} with the body half-sent · boot ${mid && mid.booted_at === s1.booted_at ? "unchanged" : "CHANGED"} · answered ${answered} · landed ${times} time(s) · then ${s2 ? "retired" : "no retire"}` };
});

await clause("T4 JUDGE · a held judge port defers the retire; freed, the next write retires", async () => {
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
  const s2 = await waitFor(newBoot(s1), BOUND);
  const ok = !!deferred && mid && mid.booted_at === s1.booted_at && !!s2;
  return { ok, why: `${deferred ? "DEFERRED naming the judge" : "no DEFERRED line"} · boot while held ${mid && mid.booted_at === s1.booted_at ? "unchanged" : "CHANGED"} · freed → ${s2 ? "retired" : "no retire"}` };
});

await killTree(keeper);

const walk = (root, dir, o = new Map()) => {
  let ents = []; try { ents = readdirSync(join(root, dir), { withFileTypes: true }); } catch { return o; }
  for (const e of ents) { const rel = `${dir}/${e.name}`; if (e.isDirectory()) walk(root, rel, o); else if (/\.(mjs|js|json|ps1|xml|vbs|cmd|md)$/.test(e.name)) o.set(rel, createHash("sha256").update(readFileSync(join(root, rel))).digest("hex")); }
  return o;
};
if (BASE) {
  await clause("XML · the service XML emitted for thalamus keeps its exact bytes (no reinstall by his hand)", async () => {
    const a = await import(pathToFileURL(join(BASE, "scripts", "services.mjs")).href), b = await import(pathToFileURL(join(ORG, "scripts", "services.mjs")).href);
    const norm = (x, root) => x.split(root).join("<ROOT>").replace(/\r\n/g, "\n");   // the working directory is each org's own root
    const xa = norm(a.winswXml(a.headless().find((r) => r.name === "thalamus")), BASE), xb = norm(b.winswXml(b.headless().find((r) => r.name === "thalamus")), ORG);
    return { ok: xa === xb && /scripts[\\/]thalamus\.mjs/.test(xb), why: xa === xb ? "identical" : "the XML CHANGED" };
  });
  await clause("BOUND · only the named files differ (scripts/ + setup/, by bytes)", () => {
    const a = new Map([...walk(BASE, "scripts"), ...walk(BASE, "setup")]), b = new Map([...walk(ORG, "scripts"), ...walk(ORG, "setup")]);
    const diff = [...new Set([...a.keys(), ...b.keys()])].filter((k) => a.get(k) !== b.get(k)).sort(), extra = diff.filter((f) => !NAMED.includes(f));
    return { ok: extra.length === 0, why: `${diff.length} file(s) differ${extra.length ? ` · BEYOND THE NAMED: ${extra.join(", ")}` : ""}` };
  });
}
for (const c of kids) await killTree(c);
try { sp._reset(); } catch { /* the spool handle is already closed */ }
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
console.log(`GREEN ${UNIT} the capture nerve retires only when its spool is drained, and every event lands exactly once across a retire · ${results.length} clause(s)`);
process.exit(0);
