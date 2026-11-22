#!/usr/bin/env node
// ============================================================================
// ci/mlv2/witness_mlv2.mjs — UNIT mlv2 · CORTEX ADOPTS THE KEEPER WITH A DEFERRED RETIRE (forks rows 1031 / 1053)
// ----------------------------------------------------------------------------
// REWORKED by forks row 1053: no clause addresses a fixed service port. The copy runs on PLANTED ports through
// cortex's own env doors (ARSENAL_CORTEX_PORT · ARSENAL_THALAMUS_PORT · ARSENAL_JUDGE_PORT), which cortex honours ONLY
// for a tree under os.tmpdir(). Every wait is bounded; a clause that cannot run says why and the witness exits 1.
// CONTRACT (judged on --org; the build reads GREEN, the item base reads RED). A REAL keeper (`scripts/cortex.mjs`, no
// mode — the service's own arguments) runs on a COPY of --org under os.tmpdir(), its wake queue planted, and
// ANTHROPIC_API_KEY planted to a non-key so every model lane refuses (no live model call).
//   C1 IDLE      no lane in flight: a closure write RETIRES the worker (a new pid) that booted after the write.
//   C2 LANE      a lane IN FLIGHT (an expired planted wake whose decline POST the planted thalamus holds open): a
//                closure write DEFERS (the same pid); released, the lane closes, THEN it retires; the moment reached
//                home EXACTLY ONCE.
//   C3 JUDGE     the planted judge port held: a closure write DEFERS naming the judge; freed, the next write retires.
//   K5 DOOR      his restart door (POST /restart on the PLANTED port) exits as a RETIRE: a new pid answers.
//   LIVE-SAFE    the real :4112 and :4113 are held by planted counting listeners for the whole run; every clause
//                above is GREEN and those listeners received ZERO connections.
//   XML · BOUND · LAST  as in every unit of this queue.
// Bounds are MEASURED in this run: SLACK = one node start; IMPORT = one fresh process importing the copy's entry (the
// one measurement step); ~~the first boot is bounded by two IMPORTs and three SLACKs (the keeper, then its worker)~~ (struck by unit mrv, below); BOOT = the measured first
// boot, and every later wait is bounded by BOOT + SLACK, plus cortex's own declared dispatch poll where a lane is
// awaited (read from its source).
// UNIT mrv (forks rows 1135 (1)-(3) / 1139 (1), F-1 A: re-cut in place, BASE kept). The changed waits, by name:
//   (a-1) the first boot ~~`waitFor(portUp, BOOT0)`~~ → bootUp(): a keeper START ends on an EVENT, re-read at SLACK steps:
//         /status answers · the keeper's own "keeper waiting" line · a worker exit line before it answered · the keeper's
//         exit. Its outer bound is the member's derived `left`. BOOT0 stays the bound of each request made before BOOT is
//         measured, and of the kill race; BOUND = the measured BOOT + SLACK, as before.
//   (I3)  ~~each clause after the first reads the keeper an earlier clause left (`portUp()`, "cannot run: no daemon up")~~ →
//         ready(): a clause with no keeper answering kills what is left, waits for its planted port to bind (a-2, bounded
//         by BOOT + SLACK, one `PORT_HELD` machine line), starts its OWN keeper and waits for it as a BOOT (a-1).
//   KEPT, none loosened (row 1135 (2)): every DEFERRED wait, every retire wait, the lane and drain waits, their bounds.
// UNIT mt1 (forks row 1276, witness-only, re-cut in place, BASE kept). Every clause whose last wait was the SINGLE-SAMPLE
// shape (the retire AND the respawned worker inside one first-boot sample + SLACK: ~~`waitFor(<a new worker>, BOUND)`~~)
// takes T2's repair (rows 1135 / 1139, unit mrv): the RETIRE keeps its bound (a RETIRING line, or the keeper's clean-retire
// `worker exit … respawn now` line, within BOOT + SLACK of the act that retires it), and the RESPAWNED worker is a BOOT that
// ends on an event: it answers · a worker exit that is not a clean retire, or a second one · "keeper waiting" · the
// keeper's exit. The clause prints `retire <ms> · respawn <ms>`, so a later red carries its own measurement. No claim about
// the code is loosened: what each clause asserts is unchanged, and every DEFERRED / drain / lane wait keeps its bound.
// UNIT mkp24 (forks row 1216 K-F2 C0, in place, BASE kept): a red clause also prints ONE machine line `CAUSE <ID> <CODE>`
// before its RED line, its CODE a key of the family's CAUSES literal below; nothing else this witness prints or waits changes.
// LAST LINE: GREEN MLV2 <what> · <n> clause(s) (exit 0) or RED MLV2 · <clauses> (exit 1)
// ============================================================================
import { mkdtempSync, writeFileSync, readFileSync, appendFileSync, rmSync, readdirSync, cpSync, existsSync, statSync, symlinkSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawn, spawnSync, execFileSync } from "node:child_process";
import { createServer } from "node:net";
import { createServer as httpServer } from "node:http";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

// UNIT mkp24 (forks row 1216 K-F2 C0): THE FAMILY'S CAUSE CODES, one literal, byte-identical in ci/mlv1, ci/mlv2, ci/mlv3 and
// ci/mrv (ci/mkp24 K5 holds that). A red clause prints `CAUSE <ID> <CODE>` before its RED line: the CODE is a key below,
// chosen by the code path, never built from runtime text, and scripts/witness_cause.mjs re-reads its text from this tracked
// source (no key and no text carries a digit). No wait, bound, clause id, claim or printed reason of this witness changes.
const CAUSES = {
  "NOT-UP": "no keeper answered its planted port when the clause began",
  "NOT-UP-PORT": "the planted port was still held by the bound after the kill, so no keeper of its own could start",
  "NOT-UP-WAITING": "the keeper it started is waiting: its planted port is held by another instance",
  "NOT-UP-WORKER": "the keeper it started saw its worker exit before the worker answered",
  "NOT-UP-KEEPER": "the keeper it started exited before its worker answered",
  "RETIRE-LATE": "no RETIRING line by the bound after the closure write: the watch event or the poll floor came late",
  "RESPAWN-LATE": "the worker logged RETIRING but no new boot answered by the bound: the respawn came late",
  "BOOT-BEFORE-WRITE": "a new boot answered but it booted before the closure write, so the new bytes do not serve",
  "RESPAWN-FAIL": "the respawn did not come up: a worker exit that is not a clean retire, a second exit, or a waiting or exited keeper",
  "NO-TICK": "a tick the wait needs is not readable from the organ's own source",
  "DRAIN-LATE": "the spool still held pending rows after the drainer's tick plus the bound",
  "NO-GAP": "no event arrived while nothing listened, so the stream never ran through a retire",
  "LOST": "an event or item the clause held never landed: lost",
  "TWICE": "an event or item landed more than once",
  "DEFER-MISSING": "no retire DEFERRED line by the bound while the work was held",
  "DEFER-BROKEN": "the worker retired while the work was held: the pid or boot changed",
  "ANSWER-FAIL": "the request held in flight was not answered with a success",
  "NO-RETIRE-AFTER": "after the hold ended no retire came by the bound",
  "JUDGE-UNHELD": "the planted judge port could not be held",
  "NO-JUDGE-PORT": "the keeper names no judge port",
  "THAL-UNBOUND": "the planted thalamus could not bind its planted port",
  "LANE-UNOPENED": "the planted lane never opened: no request reached the planted thalamus",
  "OPEN-AFTER": "the new worker does not report the sitting closed",
  "OPEN-LOST": "the held sitting changed while the retire was deferred: open, undelivered or cursor moved",
  "CLOSE-FAIL": "his close through the door did not succeed, or no idle keeper followed it",
  "CLOSE-UNRECORDED": "the closed sitting on disk carries no close stamp or not its own close reason",
  "DOOR-UNARMED": "his restart door did not answer armed",
  "DOOR-DOWN": "his restart door was armed but no new worker answered by the bound",
  "LIVE-PORT-HELD": "a real service port was held by another process, so no counting listener could be planted",
  "BEHAVIOUR-RED": "a behaviour clause above is red",
  "LIVE-HIT": "a connection reached a counting listener on a real service port",
  "LIVE-CALL": "this witness tried to address a real service port and was refused",
  "XML-CHANGED": "the service XML the generator emits changed",
  "BEYOND-NAMED": "a file beyond the named ones differs",
  "TABLE-UNREADABLE": "the process table could not be read in time",
  "SURVIVOR": "a node process naming the temp dir survived",
  "NOT-ENGAGED": "the plant aimed at the judged witness did not engage",
  "INNER-ABSENT": "a judged clause of the inner witness is absent from its run",
  "INNER-RED": "a judged clause of the inner witness is red with no code this family carries",
  "THREW": "the clause threw",
  "UNCODED": "a red branch this witness gives no code",
};

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const ORG = resolve(arg("--org") || "."), BASE = arg("--base-org") ? resolve(arg("--base-org")) : null;
const UNIT = "MLV2", NAMED = ["scripts/cortex.mjs"], LIVE_PORTS = [4112, 4113];
const TMP = mkdtempSync(join(tmpdir(), "mlv2-witness-"));
const results = [];
const clause = async (id, fn) => {
  let ok = false, why = "", code = "";
  try { const r = await fn(); ok = r === true || (r && r.ok === true); why = (r && r.why) || ""; code = (r && r.code) || ""; } catch (e) { why = `threw: ${String((e && e.message) || e).split(/\r?\n/)[0].slice(0, 200)}`; code = "THREW"; }
  results.push({ id, ok });
  if (!ok) console.log(`CAUSE ${id.split(" · ")[0]} ${Object.hasOwn(CAUSES, code) ? code : "UNCODED"}`);   // UNIT mkp24 (row 1216 K-F2 C0)
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

// THE COPY: scripts/ setup/ package.json and the state dir as bytes, under os.tmpdir() (cortex honours its port doors there)
const COPY = join(TMP, "org");
for (const p of [["scripts"], ["setup"], ["package.json"], ["dressing-room", "state"]]) if (existsSync(join(ORG, ...p))) cpSync(join(ORG, ...p), join(COPY, ...p), { recursive: true, filter: (s) => !/\.log$/.test(s) });
if (existsSync(join(ORG, "node_modules"))) symlinkSync(join(ORG, "node_modules"), join(COPY, "node_modules"), "junction");
const ENTRY = join(COPY, "scripts", "cortex.mjs");
const SDIR = join(COPY, "dressing-room", "state");
const [CPORT, TPORT, JPORT] = [await freePort(), await freePort(), await freePort()];
const ENV = { ...process.env, ARSENAL_CORTEX_PORT: String(CPORT), ARSENAL_THALAMUS_PORT: String(TPORT), ARSENAL_JUDGE_PORT: String(JPORT), ANTHROPIC_API_KEY: "planted-refusal-not-a-key" };
writeFileSync(join(SDIR, "wake_queue.jsonl"), "");
rmSync(join(SDIR, "wake.json"), { force: true });

// COLD: one fresh node process that imports the copy's entry and exits (main() does not run: it has no argv[1]).
// The ONE measurement step; it addresses no port and runs none of the unit. The first boot is a keeper start plus a
// worker start: bounded by two of these plus one node start.
const ti = Date.now();
spawnSync(process.execPath, ["--input-type=module", "-e", `await import(${JSON.stringify(pathToFileURL(ENTRY).href)}).catch(() => {}); process.exit(0);`], { cwd: COPY, env: { ...ENV, ARSENAL_CORTEX_PORT: "", ARSENAL_THALAMUS_PORT: "", ARSENAL_JUDGE_PORT: "" }, stdio: "ignore" });
const IMPORT = Date.now() - ti;
// the first boot, step by step, each a MEASURED quantity: the keeper's start (one IMPORT) · the worker's start (one
// IMPORT) · the keeper's port probe and the worker's listen (one SLACK) · this witness's poll step (one SLACK) · the
// /status round trip (one SLACK)
const BOOT0 = IMPORT + IMPORT + SLACK + SLACK + SLACK;

// THE PLANTED THALAMUS on a free port: records every /deep-answer, writes the resolution row the real owner would, and
// holds its answer while `hold` is set (that keeps a lane IN FLIGHT)
const posts = []; let hold = false; const parked = [];
const thal = httpServer(async (req, res) => {
  let raw = ""; for await (const c of req) raw += c;
  let b = {}; try { b = JSON.parse(raw); } catch { /* recorded as is */ }
  posts.push(b);
  if (b.moment_id) appendFileSync(join(SDIR, "wake_queue.jsonl"), JSON.stringify({ moment_id: b.moment_id, status: "declined", ts: new Date().toISOString() }) + "\n");
  const answer = () => { res.writeHead(200, { "content-type": "application/json" }); res.end(JSON.stringify({ ok: true })); };
  if (hold) parked.push(answer); else answer();
});
const thalUp = await new Promise((r) => { thal.once("error", () => r(false)); thal.listen(TPORT, "127.0.0.1", () => r(true)); });

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
const status = async () => { try { return await (await call(CPORT, "/status")).json(); } catch { return null; } };
const waitFor = async (pred, bound) => { const end = Date.now() + bound; for (;;) { const v = await pred(); if (v) return v; if (Date.now() > end) return null; await sleep(SLACK); } };
const portUp = async () => { const s = await status(); return s && s.ok ? s : null; };
const touchClosure = () => appendFileSync(ENTRY, `\n// witness mlv2 write ${Date.now()}\n`);
const linesSince = (n, re) => out.slice(n).find((l) => re.test(l));
// UNIT mrv (row 1135 (1) / row 1139 (1)) (a-1): a keeper START is a BOOT — it ends on an event, never on one sample's clock
const bootUp = async (pred) => {
  const s0 = Date.now();
  for (;;) {
    const s = await portUp();
    if (s && pred(s)) return { s, why: `up in ${Date.now() - s0} ms` };
    const w = out.find((l) => /keeper waiting/.test(l)), x = out.find((l) => /worker exit/.test(l));
    if (w || x || exited(keeper)) return { s: null, why: w ? `the keeper is WAITING: :${CPORT} is held (${w.slice(0, 120)})` : x ? `its worker exited before it answered (${x.slice(0, 120)})` : `the keeper exited (${keeper.exitCode ?? keeper.signalCode})`, code: w ? "NOT-UP-WAITING" : x ? "NOT-UP-WORKER" : "NOT-UP-KEEPER" };
    await sleep(SLACK);
  }
};
// (a-2): after a kill, the planted port binds before the next keeper starts
const freeHere = () => new Promise((res) => { const s = createServer(); s.once("error", () => res(false)); s.listen(CPORT, "127.0.0.1", () => s.close(() => res(true))); });
const portFreed = async () => {
  const k0 = Date.now(); let probes = 0;
  const ok = await waitFor(async () => { probes++; return freeHere(); }, BOUND);
  console.log(`PORT_HELD mlv2 · ${process.platform} · node ${process.version} · held ${Date.now() - k0} ms after the kill · ${probes} probe(s) · bound ${BOUND} ms`);
  return ok ? { ok: true } : { ok: false, why: `:${CPORT} still held ${BOUND} ms after the kill`, code: "NOT-UP-PORT" };
};
// (I3): a clause stands on its OWN keeper, never on the one an earlier clause left
let READY_WHY = "", READY_CODE = "";   // UNIT mkp24 (C0): READY_CODE names why no keeper is up
const ready = async () => {
  const s = await portUp(); if (s) { READY_WHY = "inherited a keeper"; return s; }
  await killTree(keeper);
  const f = await portFreed(); if (!f.ok) { READY_WHY = f.why; READY_CODE = f.code; return null; }
  keeper = startKeeper();
  const b = await bootUp(() => true); READY_WHY = `started its own keeper (${b.why})`; READY_CODE = b.code || "";
  return b.s;
};

console.log(`witness mlv2 · org ${ORG} · slack ${SLACK} ms · import ${IMPORT} ms · planted ports cortex :${CPORT} thalamus :${TPORT} judge :${JPORT} · live ports ${LIVE_PORTS.map((p) => `:${p} ${live[p].planted ? "held by a counting listener" : "HELD BY ANOTHER PROCESS"}`).join(", ")}`);

let keeper = startKeeper();
{
  const s0 = Date.now();
  // UNIT mrv (a-1): ~~const up = await waitFor(portUp, BOOT0);~~
  const b = await bootUp(() => true), up = b.s;
  BOUND = up ? Date.now() - s0 + SLACK : BOOT0;
  console.log(up ? `  first keeper up in ${Date.now() - s0} ms · every later wait bounded by ${BOUND} ms` : `  first keeper NOT up · ${b.why} · ${out.slice(-2).join(" | ")}`);
}
const POLL = Number((/setInterval\(\(\) => \{ retireIfArmed\(\); fire\(\); \}, (\d+)\)/.exec(readFileSync(ENTRY, "utf8")) || [])[1]);

const BEHAVIOUR = [];
const behaviour = async (id, fn) => { await clause(id, fn); BEHAVIOUR.push(results[results.length - 1]); };

// UNIT mt1 (row 1276): the retire keeps its bound; the respawn is a BOOT that ends on an event (T2's shape)
const retireThenBoot = async (n0, isNew) => {
  const w0 = Date.now(), end = w0 + BOUND; let retireAt = null;
  for (;;) {
    const s2 = await isNew(), now = Date.now();
    if (retireAt === null && (linesSince(n0, /RETIRING/) || linesSince(n0, /worker exit.*respawn now$/))) retireAt = now;
    if (s2) { if (retireAt === null) retireAt = now; return { s2, why: `retire ${retireAt - w0} ms · respawn ${now - retireAt} ms` }; }
    if (retireAt === null && now > end) return { s2: null, why: `no RETIRING line within ${BOUND} ms of the act`, code: "RETIRE-LATE" };
    const ex = out.slice(n0).filter((l) => /worker exit/.test(l));
    if (ex.length > 1 || ex.some((l) => !/respawn now$/.test(l)) || linesSince(n0, /keeper waiting/) || keeper.exitCode != null || keeper.signalCode != null)
      return { s2: null, why: `retire ${retireAt === null ? "unseen" : `${retireAt - w0} ms`} · the respawn did not come up (${(ex.pop() || "keeper waiting or exited").slice(0, 120)})`, code: "RESPAWN-FAIL" };
    await sleep(SLACK);
  }
};
await behaviour("C1 IDLE · no lane in flight: a closure write retires the worker and the new bytes serve", async () => {
  const s1 = await portUp(); if (!s1) return { ok: false, why: "cannot run: no daemon answers its planted port", code: "NOT-UP" };
  const nR = out.length;
  touchClosure();
  const wrote = statSync(ENTRY).mtimeMs;
  // UNIT mt1 (row 1276): ~~const s2 = await waitFor(async () => { const s = await portUp(); return s && s.pid !== s1.pid ? s : null; }, BOUND);~~
  const rb = await retireThenBoot(nR, async () => { const s = await portUp(); return s && s.pid !== s1.pid ? s : null; }), s2 = rb.s2;
  return { ok: !!s2 && Date.parse(s2.booted_at) >= Math.floor(wrote) - 1, why: s2 ? `pid ${s1.pid} → ${s2.pid} · ${rb.why}` : `the same pid ${s1.pid} · ${rb.why} (no retire)`, code: !s2 ? (rb.code || "RETIRE-LATE") : "BOOT-BEFORE-WRITE" };
});

await behaviour("C2 LANE · a lane in flight defers the retire; its close lets it retire; the moment reached home exactly once", async () => {
  if (!thalUp) return { ok: false, why: `cannot run: the planted thalamus could not bind :${TPORT}`, code: "THAL-UNBOUND" };
  if (!Number.isFinite(POLL)) return { ok: false, why: "cannot run: cortex's dispatch poll is not readable from its source", code: "NO-TICK" };
  const s1 = await ready(); /* UNIT mrv (I3): ~~const s1 = await portUp(); if (!s1)~~ */ if (!s1) return { ok: false, why: `cannot run: no daemon up · ${READY_WHY}`, code: READY_CODE };
  const mid = "m-mlv2-planted";
  hold = true;
  appendFileSync(join(SDIR, "wake_queue.jsonl"), JSON.stringify({ moment_id: mid, status: "pending", ts: new Date(0).toISOString() }) + "\n");
  const inflight = await waitFor(async () => posts.some((p) => p.moment_id === mid) && parked.length > 0, POLL + BOUND);
  if (!inflight) { hold = false; return { ok: false, why: "the planted lane never opened (no POST reached the planted thalamus)", code: "LANE-UNOPENED" }; }
  const n = out.length;
  touchClosure();
  const deferred = await waitFor(async () => linesSince(n, /retire DEFERRED/), BOUND);
  const during = await portUp();
  const nR = out.length;
  hold = false; for (const a of parked.splice(0)) a();
  // UNIT mt1 (row 1276): ~~const s2 = await waitFor(async () => { const s = await portUp(); return s && s.pid !== s1.pid ? s : null; }, BOUND);~~
  const rb = await retireThenBoot(nR, async () => { const s = await portUp(); return s && s.pid !== s1.pid ? s : null; }), s2 = rb.s2;
  if (s2) await sleep(BOUND);   // the new worker's boot dispatch has run: a re-dispatch would be counted below
  const times = posts.filter((p) => p.moment_id === mid).length;
  return { ok: !!deferred && during && during.pid === s1.pid && !!s2 && times === 1,
    why: `${deferred ? "DEFERRED" : "no DEFERRED line"} with the lane in flight · pid ${s1.pid} → ${during && during.pid} · after the lane closed → ${s2 ? s2.pid : "no retire"} (${rb.why}) · the moment reached home ${times} time(s)`,
    code: !deferred ? "DEFER-MISSING" : !(during && during.pid === s1.pid) ? "DEFER-BROKEN" : !s2 ? (rb.code || "NO-RETIRE-AFTER") : times === 0 ? "LOST" : "TWICE" };
});

await behaviour("C3 JUDGE · a held judge port defers the retire; freed, the next write retires", async () => {
  const judge = createServer();
  const held = await new Promise((r) => { judge.once("error", () => r(false)); judge.listen(JPORT, "127.0.0.1", () => r(true)); });
  if (!held) return { ok: false, why: `cannot run: the planted judge port :${JPORT} could not be held`, code: "JUDGE-UNHELD" };
  const s1 = await ready(); /* UNIT mrv (I3): ~~const s1 = await portUp(); if (!s1)~~ */ if (!s1) { judge.close(); return { ok: false, why: `cannot run: no daemon up · ${READY_WHY}`, code: READY_CODE }; }
  const n = out.length;
  touchClosure();
  const deferred = await waitFor(async () => linesSince(n, /retire DEFERRED.*judge/), BOUND);
  const mid = await portUp();
  await new Promise((r) => judge.close(r));
  const nR = out.length;
  touchClosure();
  // UNIT mt1 (row 1276): ~~const s2 = await waitFor(async () => { const s = await portUp(); return s && s.pid !== s1.pid ? s : null; }, BOUND);~~
  const rb = await retireThenBoot(nR, async () => { const s = await portUp(); return s && s.pid !== s1.pid ? s : null; }), s2 = rb.s2;
  return { ok: !!deferred && mid && mid.pid === s1.pid && !!s2, why: `${rb.why} · ${deferred ? "DEFERRED naming the judge" : "no DEFERRED line"} · held pid ${s1.pid} → ${mid && mid.pid} · freed → ${s2 ? s2.pid : "no retire"}`, code: !deferred ? "DEFER-MISSING" : !(mid && mid.pid === s1.pid) ? "DEFER-BROKEN" : (rb.code || "NO-RETIRE-AFTER") };
});

await behaviour("K5 DOOR · his restart door exits as a retire and the keeper brings the fresh build up", async () => {
  const s1 = await ready(); /* UNIT mrv (I3): ~~const s1 = await portUp(); if (!s1)~~ */ if (!s1) return { ok: false, why: `cannot run: no daemon up · ${READY_WHY}`, code: READY_CODE };
  let r = {};
  const nR = out.length;
  try { r = await (await call(CPORT, "/restart", { method: "POST" })).json(); } catch (e) { r = { error: String(e.message || e) }; }
  // UNIT mt1 (row 1276): ~~const s2 = await waitFor(async () => { const s = await portUp(); return s && s.pid !== s1.pid ? s : null; }, BOUND);~~
  const rb = await retireThenBoot(nR, async () => { const s = await portUp(); return s && s.pid !== s1.pid ? s : null; }), s2 = rb.s2;
  return { ok: r.armed === true && !!s2, why: `armed ${r.armed} · ${rb.why} · pid ${s1.pid} → ${s2 ? s2.pid : `NOTHING answers :${CPORT} (the clean stop: the unit is down)`}`, code: r.armed !== true ? "DOOR-UNARMED" : "DOOR-DOWN" };
});

await killTree(keeper);

await clause("LIVE-SAFE · the real :4112 and :4113 held by counting listeners: every clause GREEN and zero connections reached them", () => {
  const notPlanted = LIVE_PORTS.filter((p) => !live[p].planted), hits = LIVE_PORTS.reduce((n, p) => n + live[p].hits, 0);
  const allGreen = BEHAVIOUR.length > 0 && BEHAVIOUR.every((r) => r.ok);
  const ok = notPlanted.length === 0 && allGreen && hits === 0 && calls.fixed === 0;
  return { ok, why: `${notPlanted.length ? `cannot plant :${notPlanted.join(", :")} (held by another process — a live service) · ` : ""}behaviour ${allGreen ? "all GREEN" : "NOT all GREEN"} · ${hits} connection(s) reached a live port · ${calls.fixed} witness call(s) refused at a live port`,
    code: notPlanted.length ? "LIVE-PORT-HELD" : !allGreen ? "BEHAVIOUR-RED" : hits ? "LIVE-HIT" : "LIVE-CALL" };
});

const walk = (root, dir, o = new Map()) => {
  let ents = []; try { ents = readdirSync(join(root, dir), { withFileTypes: true }); } catch { return o; }
  for (const e of ents) { const rel = `${dir}/${e.name}`; if (e.isDirectory()) walk(root, rel, o); else if (/\.(mjs|js|json|ps1|xml|vbs|cmd|md)$/.test(e.name)) o.set(rel, createHash("sha256").update(readFileSync(join(root, rel), "utf8").replace(/\r\n/g, "\n")).digest("hex")); }
  return o;
};
if (BASE) {
  await clause("XML · the service XML emitted for cortex keeps its exact bytes (no reinstall by his hand)", async () => {
    const a = await import(pathToFileURL(join(BASE, "scripts", "services.mjs")).href), b = await import(pathToFileURL(join(ORG, "scripts", "services.mjs")).href);
    const norm = (x, root) => x.split(root).join("<ROOT>").replace(/\r\n/g, "\n");
    const xa = norm(a.winswXml(a.headless().find((r) => r.name === "cortex")), BASE), xb = norm(b.winswXml(b.headless().find((r) => r.name === "cortex")), ORG);
    return { ok: xa === xb && /scripts[\\/]cortex\.mjs/.test(xb), why: xa === xb ? "identical" : "the XML CHANGED", code: "XML-CHANGED" };
  });
  await clause("BOUND · only the named files differ (scripts/ + setup/, by text, CRLF folded)", () => {
    const a = new Map([...walk(BASE, "scripts"), ...walk(BASE, "setup")]), b = new Map([...walk(ORG, "scripts"), ...walk(ORG, "setup")]);
    const diff = [...new Set([...a.keys(), ...b.keys()])].filter((k) => a.get(k) !== b.get(k)).sort(), extra = diff.filter((f) => !NAMED.includes(f));
    return { ok: extra.length === 0, why: `${diff.length} file(s) differ${extra.length ? ` · BEYOND THE NAMED: ${extra.join(", ")}` : ""}`, code: "BEYOND-NAMED" };
  });
}
for (const c of kids) await killTree(c);
await new Promise((r) => thal.close(r));
for (const p of LIVE_PORTS) if (live[p].planted) await new Promise((r) => live[p].srv.close(r));
rmSync(TMP, { recursive: true, force: true });
await clause("LAST · no node process naming the temp dir survives", () => {
  let table = "";
  try {
    table = process.platform === "win32"
      ? execFileSync("powershell.exe", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | ForEach-Object { $_.CommandLine }"], { encoding: "utf8", timeout: BOOT0 + BOUND })
      : execFileSync("ps", ["-eo", "args"], { encoding: "utf8" });
  } catch (e) { return { ok: false, why: `process table unreadable: ${e.message}`, code: "TABLE-UNREADABLE" }; }
  const left = table.split(/\r?\n/).filter((l) => l.includes(TMP) && !/\bps -eo\b/.test(l));
  return { ok: left.length === 0, why: `${left.length} survivor(s)`, code: "SURVIVOR" };
});
const red = results.filter((r) => !r.ok).map((r) => r.id.split(" · ")[0]);
if (red.length) { console.log(`RED ${UNIT} · ${red.join(", ")}`); process.exit(1); }
console.log(`GREEN ${UNIT} cortex retires on a source change only when no lane is in flight and no judge round runs, its door is a retire, and no live port is touched · ${results.length} clause(s)`);
process.exit(0);
