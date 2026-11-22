#!/usr/bin/env node
// ============================================================================
// ci/mlv3/witness_mlv3.mjs — UNIT mlv3 · THALAMUS (THE CAPTURE NERVE) ADOPTS THE KEEPER (forks rows 1031 / 1053)
// ----------------------------------------------------------------------------
// REWORKED by forks row 1053: no clause addresses a fixed service port. The copy runs on PLANTED ports through
// thalamus's own env doors (ARSENAL_THALAMUS_PORT · ARSENAL_JUDGE_PORT), honoured ONLY for a tree under os.tmpdir().
// Every wait is bounded; a clause that cannot run says why and the witness exits 1.
// CONTRACT (judged on --org; the build reads GREEN, the item base reads RED). A REAL keeper (`scripts/thalamus.mjs`, no
// mode — the service's own arguments) runs on a COPY of --org under os.tmpdir(): its spool a planted temp db
// (ARSENAL_SPOOL_DB), its config planted with the adjudicator and the pre-answer embedding OFF, ANTHROPIC_API_KEY
// planted to a non-key (no ingest can spend). The NERVE is planted by this witness with the copy's own
// scripts/spool.mjs, in hooks/afferent-post.mjs's order: write ahead, POST, mark delivered only on a 2xx.
//   T1 IDLE      spool drained, nothing in flight: a closure write RETIRES the worker (a new boot) after that write.
//   T2 ONCE      a stream of events runs THROUGH a retire (some arrive while nothing listens): every event lands in the
//                copy's afferent record EXACTLY ONCE (none lost, none twice) and the spool ends with 0 pending.
//   T3 INFLIGHT  an /afferent request IN FLIGHT (body half-sent, from a lane that never spools): a closure write DEFERS
//                (the same boot); the body finished, that event lands once, THEN it retires.
//   T4 JUDGE     the planted judge port held: a closure write DEFERS naming the judge; freed, the next write retires.
//   LIVE-SAFE    the real :4112 and :4113 are held by planted counting listeners for the whole run; every clause
//                above is GREEN and those listeners received ZERO connections.
//   XML · BOUND · LAST  as in every unit of this queue.
// Bounds are MEASURED in this run: SLACK = one node start; IMPORT = one fresh process rehearsing a worker's boot short of
// listening (the one measurement step); ~~the first boot is bounded by two IMPORTs and three SLACKs (the keeper, then its worker)~~ (struck by unit mrv, below); BOOT = the measured first
// boot, and every later wait is bounded by BOOT + SLACK, plus the spool drainer's own declared tick where a drain is
// awaited (read from its source).
// UNIT mrv (forks rows 1135 (1)-(3) / 1139 (1), F-1 A: re-cut in place, BASE kept). The changed waits, by name:
//   (a-1) the first boot ~~`waitFor(portUp, BOOT0)`~~ → bootUp(): a keeper START ends on an EVENT, re-read at SLACK steps:
//         /status answers · the keeper's own "keeper waiting" line · a worker exit line before it answered · the keeper's
//         exit. Its outer bound is the member's derived `left`. BOOT0 stays the bound of each request made before BOOT is
//         measured, and of the kill race; BOUND = the measured BOOT + SLACK, as before.
//   (I3)  ~~each clause after the first reads the keeper an earlier clause left (`portUp()`, "cannot run: no daemon up")~~ →
//         ready(): a clause with no keeper answering kills what is left, waits for its planted port to bind (a-2, bounded
//         by BOOT + SLACK, one `PORT_HELD` machine line), starts its OWN keeper and waits for it as a BOOT (a-1).
//   (T2)  row 1139 (1), the ruling on 03ec8d7 (mlv3 red on node 24 on the neutral machine): T2's wait for the RESPAWNED
//         worker ~~`while (!s2 && Date.now() < end)`, one first-boot sample + SLACK~~ → the retire DECISION keeps BOOT + SLACK
//         (its RETIRING line), and the respawn is a BOOT that ends on an event. T2 claims ONCE (none lost, none twice, 0
//         pending), not promptness; T1 still claims the prompt retire and its wait is unchanged.
//   KEPT, none loosened (row 1135 (2)): every DEFERRED wait, every retire wait, the lane and drain waits, their bounds.
// UNIT mt1 (forks row 1276, witness-only, re-cut in place, BASE kept). Every clause whose last wait was the SINGLE-SAMPLE
// shape (the retire AND the respawned worker inside one first-boot sample + SLACK: ~~`waitFor(<a new worker>, BOUND)`~~)
// takes T2's repair (rows 1135 / 1139, unit mrv): the RETIRE keeps its bound (a RETIRING line, or the keeper's clean-retire
// `worker exit … respawn now` line, within BOOT + SLACK of the act that retires it), and the RESPAWNED worker is a BOOT that
// ends on an event: it answers · a worker exit that is not a clean retire, or a second one · "keeper waiting" · the
// keeper's exit. The clause prints `retire <ms> · respawn <ms>`, so a later red carries its own measurement. No claim about
// the code is loosened: what each clause asserts is unchanged, and every DEFERRED / drain / lane wait keeps its bound.
// LAST LINE: GREEN MLV3 <what> · <n> clause(s) (exit 0) or RED MLV3 · <clauses> (exit 1)
// ============================================================================
import { mkdtempSync, writeFileSync, readFileSync, appendFileSync, rmSync, readdirSync, cpSync, existsSync, statSync, symlinkSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawn, spawnSync, execFileSync } from "node:child_process";
import { createServer } from "node:net";
import { createServer as httpServer } from "node:http";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const ORG = resolve(arg("--org") || "."), BASE = arg("--base-org") ? resolve(arg("--base-org")) : null;
const UNIT = "MLV3", NAMED = ["scripts/thalamus.mjs"], LIVE_PORTS = [4112, 4113];
const TMP = mkdtempSync(join(tmpdir(), "mlv3-witness-"));
const results = [];
const clause = async (id, fn) => {
  let ok = false, why = "";
  try { const r = await fn(); ok = r === true || (r && r.ok === true); why = (r && r.why) || ""; } catch (e) { why = `threw: ${String((e && e.message) || e).split(/\r?\n/)[0].slice(0, 200)}`; }
  results.push({ id, ok });
  console.log(`  ${ok ? "GREEN" : "RED  "} ${id}${why ? ` · ${why}` : ""}`);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const t0 = Date.now(); spawnSync(process.execPath, ["-e", "0"]); const SLACK = Math.max(1, Date.now() - t0);
const freePort = () => new Promise((res) => { const s = createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => res(p)); }); });

// LIVE-SAFE: the real service ports, held by counting listeners BEFORE anything else runs
const live = {};
for (const p of LIVE_PORTS) {
  const rec = { port: p, planted: false, hits: 0 };
  const srv = createServer((sock) => { rec.hits++; sock.destroy(); });
  rec.planted = await new Promise((r) => { srv.once("error", () => r(false)); srv.listen(p, "127.0.0.1", () => r(true)); });
  rec.srv = srv; live[p] = rec;
}

// THE COPY: scripts/ setup/ package.json and the state dir as bytes, under os.tmpdir() (thalamus honours its port doors there)
const COPY = join(TMP, "org");
for (const p of [["scripts"], ["setup"], ["package.json"], ["dressing-room", "state"]]) if (existsSync(join(ORG, ...p))) cpSync(join(ORG, ...p), join(COPY, ...p), { recursive: true, filter: (s) => !/\.log$/.test(s) });
if (existsSync(join(ORG, "node_modules"))) symlinkSync(join(ORG, "node_modules"), join(COPY, "node_modules"), "junction");
const ENTRY = join(COPY, "scripts", "thalamus.mjs");
const SDIR = join(COPY, "dressing-room", "state");
const [TPORT, JPORT] = [await freePort(), await freePort()];
const SPOOLDB = join(TMP, "spool.db");
const ENV = { ...process.env, ARSENAL_THALAMUS_PORT: String(TPORT), ARSENAL_JUDGE_PORT: String(JPORT), ARSENAL_SPOOL_DB: SPOOLDB, ANTHROPIC_API_KEY: "planted-refusal-not-a-key" };
// the planted config: the copy's own, with the two lanes that could spend switched OFF
{
  const cf = join(SDIR, "thalamus_config.json");
  let c = {}; try { c = JSON.parse(readFileSync(cf, "utf8")); } catch { c = {}; }
  c.adjudicator = { ...(c.adjudicator || {}), enabled: false };
  c.pre_answer = { ...(c.pre_answer || {}), enabled: false };
  writeFileSync(cf, JSON.stringify(c, null, 2));
}
// REHEARSAL: one fresh node process that does a worker's boot work short of listening — imports the copy's entry and
// brain.mjs (main imports it), opens the spool, reads the whole afferent record (the boot seed) — and exits. The ONE
// measurement step; it binds no port and runs none of the unit. The first boot is a keeper start (one node start) plus
// a worker boot: bounded by two rehearsals plus one node start.
const ti = Date.now();
spawnSync(process.execPath, ["--input-type=module", "-e", `const u = (f) => ${JSON.stringify(pathToFileURL(join(COPY, "scripts")).href)} + "/" + f;
  await import(u("thalamus.mjs")).catch(() => {}); await import(u("brain.mjs")).catch(() => {});
  const sp = await import(u("spool.mjs")).catch(() => null); if (sp) { try { sp.stats(); } catch {} }
  try { (await import("node:fs")).readFileSync(${JSON.stringify(join(COPY, "dressing-room", "state", "afferent.jsonl"))}, "utf8").split(String.fromCharCode(10)).forEach((l) => { try { JSON.parse(l); } catch {} }); } catch {}
  process.exit(0);`], { cwd: COPY, env: { ...ENV, ARSENAL_THALAMUS_PORT: "", ARSENAL_JUDGE_PORT: "" }, stdio: "ignore" });
const IMPORT = Date.now() - ti;
// the first boot, step by step, each a MEASURED quantity: the keeper's start (one IMPORT) · the worker's start (one
// IMPORT) · the keeper's port probe and the worker's listen (one SLACK) · this witness's poll step (one SLACK) · the
// /status round trip (one SLACK)
const BOOT0 = IMPORT + IMPORT + SLACK + SLACK + SLACK;
process.env.ARSENAL_SPOOL_DB = SPOOLDB;   // the planted nerve's spool module reads it at load
const sp = await import(pathToFileURL(join(COPY, "scripts", "spool.mjs")).href);
const AFF = join(SDIR, "afferent.jsonl");
const landed = (id) => { let n = 0; try { for (const l of readFileSync(AFF, "utf8").split(/\r?\n/)) if (l.includes(id)) { try { if (JSON.parse(l).event_id === id) n++; } catch { /* a torn line is not ours */ } } } catch { /* no file yet */ } return n; };
let seq = 0;
const evtOf = (tag) => ({ event_id: `mlv3-${process.pid}-${tag}-${++seq}`, modality: "code", source: "witness-mlv3", text: `planted turn ${tag} ${seq}`, ts: new Date().toISOString() });
const DRAIN_MS = Number((/const SPOOL_DRAIN_EVERY_MS\s*=\s*([\d_]+)/.exec(readFileSync(ENTRY, "utf8")) || [])[1]?.replace(/_/g, ""));
const kids = [];
let out = [];
let BOUND = BOOT0;   // replaced by the measured first boot + SLACK
function startKeeper() {
  out = [];
  const c = spawn(process.execPath, [ENTRY], { cwd: COPY, env: ENV, stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
  c.stdout.on("data", (d) => { out.push(...String(d).split(/\r?\n/).filter(Boolean)); });
  c.stderr.on("data", (d) => { out.push(...String(d).split(/\r?\n/).filter(Boolean)); });
  kids.push(c);
  return c;
}
const exited = (c) => c.exitCode != null || c.signalCode != null;
const killTree = async (c) => {
  if (!c || exited(c)) return;
  if (process.platform === "win32") { try { execFileSync("taskkill", ["/PID", String(c.pid), "/T", "/F"], { stdio: "ignore" }); } catch { /* gone */ } }
  else c.kill("SIGTERM");
  const gone = await Promise.race([new Promise((r) => (exited(c) ? r(true) : c.once("exit", () => r(true)))), sleep(BOUND).then(() => false)]);
  if (!gone && process.platform !== "win32") { try { c.kill("SIGKILL"); } catch { /* gone */ } }
};
// every request this witness makes goes through call(): a fixed service port is REFUSED here, never addressed
const calls = { fixed: 0 };
const call = async (port, path, init = {}) => {
  if (LIVE_PORTS.includes(port)) { calls.fixed++; throw new Error(`refused: :${port} is a live service port`); }
  return fetch(`http://127.0.0.1:${port}${path}`, { ...init, signal: AbortSignal.timeout(BOUND) });
};
const status = async () => { try { return await (await call(TPORT, "/status")).json(); } catch { return null; } };
const waitFor = async (pred, bound) => { const end = Date.now() + bound; for (;;) { const v = await pred(); if (v) return v; if (Date.now() > end) return null; await sleep(SLACK); } };
const portUp = async () => { const s = await status(); return s && s.ok ? s : null; };
const touchClosure = () => appendFileSync(ENTRY, `\n// witness mlv3 write ${Date.now()}\n`);
// THE PLANTED NERVE: write ahead, then POST (bounded), then mark — hooks/afferent-post.mjs's order
async function nerve(evt) {
  const w = sp.write(evt);
  if (!w.ok) return "unspooled";
  try { const r = await call(TPORT, "/afferent", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(evt) }); if (r.ok) { sp.markDelivered(evt.event_id); return "delivered"; } }
  catch { /* nothing listening: the row stays pending, as the nerve leaves it */ }
  return "pending";
}
const linesSince = (n, re) => out.slice(n).find((l) => re.test(l));
// UNIT mrv (row 1135 (1) / row 1139 (1)) (a-1): a keeper START is a BOOT — it ends on an event, never on one sample's clock
const bootUp = async (pred) => {
  const s0 = Date.now();
  for (;;) {
    const s = await portUp();
    if (s && pred(s)) return { s, why: `up in ${Date.now() - s0} ms` };
    const w = out.find((l) => /keeper waiting/.test(l)), x = out.find((l) => /worker exit/.test(l));
    if (w || x || exited(keeper)) return { s: null, why: w ? `the keeper is WAITING: :${TPORT} is held (${w.slice(0, 120)})` : x ? `its worker exited before it answered (${x.slice(0, 120)})` : `the keeper exited (${keeper.exitCode ?? keeper.signalCode})` };
    await sleep(SLACK);
  }
};
// (a-2): after a kill, the planted port binds before the next keeper starts
const freeHere = () => new Promise((res) => { const s = createServer(); s.once("error", () => res(false)); s.listen(TPORT, "127.0.0.1", () => s.close(() => res(true))); });
const portFreed = async () => {
  const k0 = Date.now(); let probes = 0;
  const ok = await waitFor(async () => { probes++; return freeHere(); }, BOUND);
  console.log(`PORT_HELD mlv3 · ${process.platform} · node ${process.version} · held ${Date.now() - k0} ms after the kill · ${probes} probe(s) · bound ${BOUND} ms`);
  return ok ? { ok: true } : { ok: false, why: `:${TPORT} still held ${BOUND} ms after the kill` };
};
// (I3): a clause stands on its OWN keeper, never on the one an earlier clause left
let READY_WHY = "";
const ready = async () => {
  const s = await portUp(); if (s) { READY_WHY = "inherited a keeper"; return s; }
  await killTree(keeper);
  const f = await portFreed(); if (!f.ok) { READY_WHY = f.why; return null; }
  keeper = startKeeper();
  const b = await bootUp(() => true); READY_WHY = `started its own keeper (${b.why})`;
  return b.s;
};

console.log(`witness mlv3 · org ${ORG} · slack ${SLACK} ms · import ${IMPORT} ms · drainer tick ${DRAIN_MS} ms (read from the organ) · planted ports thalamus :${TPORT} judge :${JPORT} · live ports ${LIVE_PORTS.map((p) => `:${p} ${live[p].planted ? "held by a counting listener" : "HELD BY ANOTHER PROCESS"}`).join(", ")}`);

let keeper = startKeeper();
{
  const s0 = Date.now();
  // UNIT mrv (a-1): ~~const up = await waitFor(portUp, BOOT0);~~
  const b = await bootUp(() => true), up = b.s;
  BOUND = up ? Date.now() - s0 + SLACK : BOOT0;
  console.log(up ? `  first keeper up in ${Date.now() - s0} ms · every later wait bounded by ${BOUND} ms` : `  first keeper NOT up · ${b.why} · ${out.slice(-2).join(" | ")}`);
}

const BEHAVIOUR = [];
const behaviour = async (id, fn) => { await clause(id, fn); BEHAVIOUR.push(results[results.length - 1]); };

const newBoot = (s1) => async () => { const s = await portUp(); return s && s.booted_at !== s1.booted_at ? s : null; };

// UNIT mt1 (row 1276): the retire keeps its bound; the respawn is a BOOT that ends on an event (T2's shape)
const retireThenBoot = async (n0, isNew) => {
  const w0 = Date.now(), end = w0 + BOUND; let retireAt = null;
  for (;;) {
    const s2 = await isNew(), now = Date.now();
    if (retireAt === null && (linesSince(n0, /RETIRING/) || linesSince(n0, /worker exit.*respawn now$/))) retireAt = now;
    if (s2) { if (retireAt === null) retireAt = now; return { s2, why: `retire ${retireAt - w0} ms · respawn ${now - retireAt} ms` }; }
    if (retireAt === null && now > end) return { s2: null, why: `no RETIRING line within ${BOUND} ms of the act` };
    const ex = out.slice(n0).filter((l) => /worker exit/.test(l));
    if (ex.length > 1 || ex.some((l) => !/respawn now$/.test(l)) || linesSince(n0, /keeper waiting/) || keeper.exitCode != null || keeper.signalCode != null)
      return { s2: null, why: `retire ${retireAt === null ? "unseen" : `${retireAt - w0} ms`} · the respawn did not come up (${(ex.pop() || "keeper waiting or exited").slice(0, 120)})` };
    await sleep(SLACK);
  }
};
await behaviour("T1 IDLE · spool drained: a closure write retires the worker and the new bytes serve", async () => {
  const s1 = await portUp(); if (!s1) return { ok: false, why: "cannot run: no daemon answers its planted port" };
  const pend0 = sp.stats().pending;
  const nR = out.length;
  touchClosure();
  const wrote = statSync(ENTRY).mtimeMs;
  // UNIT mt1 (row 1276): ~~const s2 = await waitFor(newBoot(s1), BOUND);~~
  const rb = await retireThenBoot(nR, newBoot(s1)), s2 = rb.s2;
  const ok = !!s2 && Date.parse(s2.booted_at) >= Math.floor(wrote) - 1;
  return { ok, why: s2 ? `booted ${s1.booted_at} → ${s2.booted_at} · ${rb.why} · spool pending before ${pend0}` : `the same boot ${s1.booted_at} · ${rb.why} (no retire)` };
});

await behaviour("T2 ONCE · events streamed through a retire land exactly once, none lost, the spool drained", async () => {
  const s1 = await ready(); /* UNIT mrv (I3): ~~const s1 = await portUp(); if (!s1)~~ */ if (!s1) return { ok: false, why: `cannot run: no daemon up · ${READY_WHY}` };
  const sent = [], fates = { delivered: 0, pending: 0, unspooled: 0 };
  const send = async (tag) => { const e = evtOf(tag); sent.push(e.event_id); fates[await nerve(e)]++; };
  for (let i = 0; i < 3; i++) await send("before");
  const n0 = out.length;
  touchClosure();
  // keep the nerve firing, one event per measured node start, until a NEW worker has answered, then three more
  // UNIT mrv (row 1139 (1), the ruling on 03ec8d7): ~~let s2 = null; const end = Date.now() + BOUND;~~
  // ~~while (!s2 && Date.now() < end) { await send("during"); s2 = await newBoot(s1)(); if (!s2) await sleep(SLACK); }~~
  // The RETIRE decision keeps its bound: a RETIRING line within BOOT + SLACK of the write. The RESPAWNED worker is a BOOT,
  // and an event ends it: it answers · a worker exit that is not a clean retire, or a second one · "keeper waiting" · the
  // keeper's exit.
  let s2 = null, why2 = ""; const end = Date.now() + BOUND;
  for (;;) {
    await send("during"); s2 = await newBoot(s1)(); if (s2) break;
    const retiring = linesSince(n0, /RETIRING/);
    if (!retiring && Date.now() > end) { why2 = `no RETIRING line within ${BOUND} ms of the write`; break; }
    const ex = out.slice(n0).filter((l) => /worker exit/.test(l));
    if (ex.length > 1 || ex.some((l) => !/respawn now$/.test(l)) || linesSince(n0, /keeper waiting/) || exited(keeper)) { why2 = `the respawn did not come up (${(ex.pop() || "keeper waiting or exited").slice(0, 120)})`; break; }
    await sleep(SLACK);
  }
  for (let i = 0; i < 3; i++) await send("after");
  // the new worker drains at boot and then every drainer tick: wait for 0 pending, bounded by that tick + BOUND
  if (!Number.isFinite(DRAIN_MS)) return { ok: false, why: "cannot run: the drainer's tick is not readable from its source" };
  const drained = await waitFor(async () => sp.stats().pending === 0, DRAIN_MS + BOUND);
  const counts = sent.map(landed), lost = counts.filter((n) => n === 0).length, twice = counts.filter((n) => n > 1).length;
  const ok = !!s2 && !!drained && lost === 0 && twice === 0 && fates.pending > 0;
  return { ok, why: `${sent.length} event(s) · ${fates.delivered} delivered live, ${fates.pending} arrived while nothing listened · retire ${s2 ? "yes" : `NO${why2 ? ` (${why2})` : ""}`} · spool ${drained ? "drained" : `${sp.stats().pending} still pending`} · lost ${lost} · twice ${twice}` };
});

await behaviour("T3 INFLIGHT · a capture request in flight defers the retire; it lands once, then it retires", async () => {
  const s1 = await ready(); /* UNIT mrv (I3): ~~const s1 = await portUp(); if (!s1)~~ */ if (!s1) return { ok: false, why: `cannot run: no daemon up · ${READY_WHY}` };
  const { request } = await import("node:http");
  // NOT spooled: a request from a lane that never spools (the bus/market lanes), so ONLY the in-flight count can hold it
  const e = evtOf("inflight");
  const body = JSON.stringify(e), half = Math.floor(body.length / 2);
  let answered = null;
  const req = request({ host: "127.0.0.1", port: TPORT, path: "/afferent", method: "POST", timeout: BOUND, headers: { "content-type": "application/json", "content-length": Buffer.byteLength(body) } }, (res) => { res.resume(); res.on("end", () => { answered = res.statusCode; }); });
  req.on("error", () => { answered = -1; }); req.on("timeout", () => { answered = -2; req.destroy(); });
  req.write(body.slice(0, half));
  await sleep(SLACK);
  const n = out.length;
  touchClosure();
  const deferred = await waitFor(async () => linesSince(n, /retire DEFERRED/), BOUND);
  const mid = await portUp();
  const nR = out.length;
  req.end(body.slice(half));
  await waitFor(async () => answered !== null, BOUND);
  // UNIT mt1 (row 1276): ~~const s2 = await waitFor(newBoot(s1), BOUND);~~
  const rb = await retireThenBoot(nR, newBoot(s1)), s2 = rb.s2;
  const times = landed(e.event_id);
  const ok = !!deferred && mid && mid.booted_at === s1.booted_at && answered === 200 && times === 1 && !!s2;
  return { ok, why: `${deferred ? "DEFERRED" : "no DEFERRED line"} with the body half-sent · boot ${mid && mid.booted_at === s1.booted_at ? "unchanged" : "CHANGED"} · answered ${answered} · landed ${times} time(s) · then ${s2 ? "retired" : "no retire"} · ${rb.why}` };
});

await behaviour("T4 JUDGE · a held judge port defers the retire; freed, the next write retires", async () => {
  const judge = createServer();
  const held = await new Promise((r) => { judge.once("error", () => r(false)); judge.listen(JPORT, "127.0.0.1", () => r(true)); });
  if (!held) return { ok: false, why: `cannot run: the planted judge port :${JPORT} could not be held` };
  const s1 = await ready(); /* UNIT mrv (I3): ~~const s1 = await portUp(); if (!s1)~~ */ if (!s1) { judge.close(); return { ok: false, why: `cannot run: no daemon up · ${READY_WHY}` }; }
  const n = out.length;
  touchClosure();
  const deferred = await waitFor(async () => linesSince(n, /retire DEFERRED.*judge/), BOUND);
  const mid = await portUp();
  await new Promise((r) => judge.close(r));
  const nR = out.length;
  touchClosure();
  // UNIT mt1 (row 1276): ~~const s2 = await waitFor(newBoot(s1), BOUND);~~
  const rb = await retireThenBoot(nR, newBoot(s1)), s2 = rb.s2;
  const ok = !!deferred && mid && mid.booted_at === s1.booted_at && !!s2;
  return { ok, why: `${deferred ? "DEFERRED naming the judge" : "no DEFERRED line"} · boot while held ${mid && mid.booted_at === s1.booted_at ? "unchanged" : "CHANGED"} · freed → ${s2 ? "retired" : "no retire"} · ${rb.why}` };
});

await killTree(keeper);

await clause("LIVE-SAFE · the real :4112 and :4113 held by counting listeners: every clause GREEN and zero connections reached them", () => {
  const notPlanted = LIVE_PORTS.filter((p) => !live[p].planted), hits = LIVE_PORTS.reduce((n, p) => n + live[p].hits, 0);
  const allGreen = BEHAVIOUR.length > 0 && BEHAVIOUR.every((r) => r.ok);
  const ok = notPlanted.length === 0 && allGreen && hits === 0 && calls.fixed === 0;
  return { ok, why: `${notPlanted.length ? `cannot plant :${notPlanted.join(", :")} (held by another process — a live service) · ` : ""}behaviour ${allGreen ? "all GREEN" : "NOT all GREEN"} · ${hits} connection(s) reached a live port · ${calls.fixed} witness call(s) refused at a live port` };
});

const walk = (root, dir, o = new Map()) => {
  let ents = []; try { ents = readdirSync(join(root, dir), { withFileTypes: true }); } catch { return o; }
  for (const e of ents) { const rel = `${dir}/${e.name}`; if (e.isDirectory()) walk(root, rel, o); else if (/\.(mjs|js|json|ps1|xml|vbs|cmd|md)$/.test(e.name)) o.set(rel, createHash("sha256").update(readFileSync(join(root, rel), "utf8").replace(/\r\n/g, "\n")).digest("hex")); }
  return o;
};
if (BASE) {
  await clause("XML · the service XML emitted for thalamus keeps its exact bytes (no reinstall by his hand)", async () => {
    const a = await import(pathToFileURL(join(BASE, "scripts", "services.mjs")).href), b = await import(pathToFileURL(join(ORG, "scripts", "services.mjs")).href);
    const norm = (x, root) => x.split(root).join("<ROOT>").replace(/\r\n/g, "\n");
    const xa = norm(a.winswXml(a.headless().find((r) => r.name === "thalamus")), BASE), xb = norm(b.winswXml(b.headless().find((r) => r.name === "thalamus")), ORG);
    return { ok: xa === xb && /scripts[\\/]thalamus\.mjs/.test(xb), why: xa === xb ? "identical" : "the XML CHANGED" };
  });
  await clause("BOUND · only the named files differ (scripts/ + setup/, by text, CRLF folded)", () => {
    const a = new Map([...walk(BASE, "scripts"), ...walk(BASE, "setup")]), b = new Map([...walk(ORG, "scripts"), ...walk(ORG, "setup")]);
    const diff = [...new Set([...a.keys(), ...b.keys()])].filter((k) => a.get(k) !== b.get(k)).sort(), extra = diff.filter((f) => !NAMED.includes(f));
    return { ok: extra.length === 0, why: `${diff.length} file(s) differ${extra.length ? ` · BEYOND THE NAMED: ${extra.join(", ")}` : ""}` };
  });
}
for (const c of kids) await killTree(c);
try { sp._reset(); } catch { /* the spool handle is already closed */ }
for (const p of LIVE_PORTS) if (live[p].planted) await new Promise((r) => live[p].srv.close(r));
rmSync(TMP, { recursive: true, force: true });
await clause("LAST · no node process naming the temp dir survives", () => {
  let table = "";
  try {
    table = process.platform === "win32"
      ? execFileSync("powershell.exe", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | ForEach-Object { $_.CommandLine }"], { encoding: "utf8", timeout: BOOT0 + BOUND })
      : execFileSync("ps", ["-eo", "args"], { encoding: "utf8" });
  } catch (e) { return { ok: false, why: `process table unreadable: ${e.message}` }; }
  const left = table.split(/\r?\n/).filter((l) => l.includes(TMP) && !/\bps -eo\b/.test(l));
  return { ok: left.length === 0, why: `${left.length} survivor(s)` };
});
const red = results.filter((r) => !r.ok).map((r) => r.id.split(" · ")[0]);
if (red.length) { console.log(`RED ${UNIT} · ${red.join(", ")}`); process.exit(1); }
console.log(`GREEN ${UNIT} the capture nerve retires only when its spool is drained, every event lands exactly once across a retire, and no live port is touched · ${results.length} clause(s)`);
process.exit(0);
