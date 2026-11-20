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
// ~~Every wait is bounded by BOOT + SLACK (a worker respawn is one node start and an import, inside a keeper start).~~
//   struck by UNIT mrv (forks rows 1135 (1)-(3) / 1139 (1), F-1 A: re-cut in place, BASE kept). Every wait for a WORKER
//   (a retire, a deferral, a respawn) is bounded by BOOT + SLACK, as before. A keeper START is not a worker and is no longer
//   waited on one sample: each one is a BOOT, waited as the first is. The changed waits, by name:
//   (a-1) I2's re-started keeper ~~`waitFor(open, BOUND)`~~ → bootUp(): ends on an EVENT, re-read at SLACK steps: /status
//         answers (open) · the keeper's own "keeper waiting" line (a named red: the port outlived the kill) · a worker exit
//         line before it answered · the keeper's exit. Its outer bound is the member's derived `left`.
//   (a-2) after I2's kill, NEW: portFreed() — the next keeper starts only when a test bind of PORT succeeds, bounded by
//         BOOT + SLACK; red `:<port> still held …`. It prints ONE machine line (row 1135 (5)):
//         `PORT_HELD mlv1 · <platform> · node <v> · held <ms> ms after the kill · <k> probe(s) · bound <ms>`.
//   (I3)  ~~I3 reads the keeper and the sitting I2 left (`portUp()`, "no daemon up")~~ → I3 stands on its own precondition:
//         no keeper answering → kill, portFreed(), its own keeper, bootUp(); an OPEN sitting answering → POST /close through
//         the planted keeper's own door (F-3 B: the owner writes its own file), the close bounded by BOOT + SLACK and the
//         idle answer after it bounded by BOOT + SLACK.
//   KEPT, neither loosened (row 1135 (2)): I2's DEFERRED wait and its after-close retire wait, BOOT + SLACK each; I1; I3's
//   DEFERRED and freed waits. The keeper's one-poll sleep on a held port is its designed contract and is NOT changed (F-2 A).
// UNIT mkp24 (forks row 1216 K-F2 C0, in place, BASE kept): a red clause also prints ONE machine line `CAUSE <ID> <CODE>`
// before its RED line, its CODE a key of the family's CAUSES literal below; nothing else this witness prints or waits changes.
// LAST LINE: GREEN MLV1 <what> · <n> clause(s) (exit 0) or RED MLV1 · <clauses> (exit 1)
// ============================================================================
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, appendFileSync, rmSync, readdirSync, cpSync, existsSync, statSync, symlinkSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawn, spawnSync, execFileSync } from "node:child_process";
import { createServer } from "node:net";
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
const UNIT = "MLV1", NAMED = ["scripts/sitting.mjs", "scripts/keeper.mjs"];
const TMP = mkdtempSync(join(tmpdir(), "mlv1-witness-"));
const results = [];
const clause = async (id, fn) => {
  let ok = false, why = "", code = "";
  try { const r = await fn(); ok = r === true || (r && r.ok === true); why = (r && r.why) || ""; code = (r && r.code) || ""; } catch (e) { why = `threw: ${String((e && e.message) || e).split("\n")[0].slice(0, 200)}`; code = "THREW"; }
  results.push({ id, ok });
  if (!ok) console.log(`CAUSE ${id.split(" · ")[0]} ${Object.hasOwn(CAUSES, code) ? code : "UNCODED"}`);   // UNIT mkp24 (row 1216 K-F2 C0)
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
// UNIT mrv (row 1135) (a-1): a keeper START is a BOOT — it ends on an event, never on one sample's clock
const bootUp = async (pred) => {
  const s0 = Date.now();
  for (;;) {
    const s = await portUp();
    if (s && pred(s)) return { s, why: `up in ${Date.now() - s0} ms` };
    const w = out.find((l) => /keeper waiting/.test(l)), x = out.find((l) => /worker exit/.test(l));
    if (w || x || keeper.exitCode != null || keeper.signalCode != null) return { s: null, why: w ? `the keeper is WAITING: :${PORT} outlived the kill (${w.slice(0, 120)})` : x ? `its worker exited before it answered (${x.slice(0, 120)})` : `the keeper exited (${keeper.exitCode ?? keeper.signalCode})`, code: w ? "NOT-UP-WAITING" : x ? "NOT-UP-WORKER" : "NOT-UP-KEEPER" };
    await sleep(SLACK);
  }
};
// UNIT mrv (row 1135) (a-2): after a kill, the port binds before the next keeper starts; the held time is printed (row 1135 (5))
const freeHere = () => new Promise((res) => { const s = createServer(); s.once("error", () => res(false)); s.listen(PORT, "127.0.0.1", () => s.close(() => res(true))); });
const portFreed = async () => {
  const k0 = Date.now(); let probes = 0;
  const ok = await waitFor(async () => { probes++; return freeHere(); }, BOUND);
  console.log(`PORT_HELD mlv1 · ${process.platform} · node ${process.version} · held ${Date.now() - k0} ms after the kill · ${probes} probe(s) · bound ${BOUND} ms`);
  return ok ? { ok: true } : { ok: false, why: `:${PORT} still held ${BOUND} ms after the kill`, code: "NOT-UP-PORT" };
};

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
  const s1 = await portUp(); if (!s1) return { ok: false, why: `no daemon up · ${out.slice(-2).join(" | ")}`, code: "NOT-UP" };
  const n = out.length;   // UNIT mkp24 (C0): read only, to name which link of the chain came late
  touchClosure();
  const wrote = statSync(ENTRY).mtimeMs;
  const s2 = await waitFor(async () => { const s = await portUp(); return s && s.pid !== s1.pid ? s : null; }, BOUND);
  const ok = !!s2 && Date.parse(s2.booted_at) >= Math.floor(wrote) - 1 && s2.open === false;
  return { ok, why: s2 ? `pid ${s1.pid} → ${s2.pid} · booted ${s2.booted_at}` : `the same pid ${s1.pid} after ${BOUND} ms (no retire)`,
    code: !s2 ? (linesSince(n, /RETIRING/) ? "RESPAWN-LATE" : "RETIRE-LATE") : Date.parse(s2.booted_at) >= Math.floor(wrote) - 1 ? "OPEN-AFTER" : "BOOT-BEFORE-WRITE" };
});

await clause("I2 MID · an open sitting defers the retire, loses 0 items, and the close lets it retire", async () => {
  await killTree(keeper);
  { const f = await portFreed(); if (!f.ok) return f; }   // UNIT mrv (a-2)
  const id = "s-mlv1-planted";
  writeFileSync(join(SDIR, "sitting.json"), JSON.stringify({ id, captain: "planted", surfaces: ["code"], task: "planted", route: "FORGE", transport: "code", opened_at: new Date().toISOString(), last_turn_at: new Date().toISOString(), closed_at: null, close_reason: null,
    plan: [{ i: 0, kind: "say", text: "u0", est_seconds: 1 }, { i: 1, kind: "say", text: "u1", est_seconds: 1 }, { i: 2, kind: "say", text: "u2", est_seconds: 1 }], plan_source: "planted", plan_map: null, cursor: 2, unit_seq: 2, pending_question: null,
    stats: { turns: 0, by_class: { deliver: 0, respond: 0, compose: 0, judge: 0 }, tokens: { input: 0, output: 0, cache_creation: 0, cache_read: 0 }, latency_ms: { deliver: [], respond: [], compose: [], judge: [] }, units_composed: 2, units_delivered: 0, banked: 0, owner_calls: 0, head_tokens: null } }));
  writeFileSync(join(SDIR, "sitting_out.jsonl"), [0, 1].map((i) => JSON.stringify({ kind: "unit", id: `${id}-u${i}`, sitting_id: id, text: `u${i}`, est_seconds: 1, question: false, class: "deliver" })).join("\n") + "\n");
  keeper = startKeeper();
  // UNIT mrv (a-1): ~~const s1 = await waitFor(async () => { const s = await portUp(); return s && s.open ? s : null; }, BOUND);~~
  const b = await bootUp((s) => s.open), s1 = b.s;
  if (!s1) return { ok: false, why: `the planted open sitting did not resume · ${b.why}`, code: b.code };
  const n = out.length;
  touchClosure();
  const deferred = await waitFor(async () => linesSince(n, /retire DEFERRED/), BOUND);
  const mid = await portUp();
  const held = !!deferred && mid && mid.pid === s1.pid && mid.open === true && mid.undelivered === s1.undelivered && mid.cursor === s1.cursor;
  if (!held) return { ok: false, why: `mid-sitting: ${deferred ? "DEFERRED" : "no DEFERRED line"} · pid ${s1.pid} → ${mid && mid.pid} · open ${mid && mid.open} · undelivered ${s1.undelivered} → ${mid && mid.undelivered}`,
    code: !deferred ? "DEFER-MISSING" : !(mid && mid.pid === s1.pid) ? "DEFER-BROKEN" : "OPEN-LOST" };
  const closed = await (await fetch(`http://127.0.0.1:${PORT}/close`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ reason: "his_word" }) })).json();
  const s2 = await waitFor(async () => { const s = await portUp(); return s && s.pid !== s1.pid ? s : null; }, BOUND);
  const disk = JSON.parse(readFileSync(join(SDIR, "sitting.json"), "utf8"));
  const units = readFileSync(join(SDIR, "sitting_out.jsonl"), "utf8").split(/\r?\n/).filter(Boolean).map((l) => JSON.parse(l)).filter((r) => r.kind === "unit" && r.sitting_id === id);
  const lost = (3 - (disk.plan || []).length) + (2 - units.length) + (disk.cursor === 2 ? 0 : 1);
  const ok = closed.ok === true && !!s2 && s2.open === false && disk.closed_at && disk.close_reason === "his_word" && lost === 0;
  return { ok, why: `deferred on pid ${s1.pid} with ${s1.undelivered} undelivered · close ${closed.ok} · after close pid → ${s2 ? s2.pid : "UNCHANGED"} · ${lost} item(s) lost`,
    code: closed.ok !== true ? "CLOSE-FAIL" : !s2 ? "NO-RETIRE-AFTER" : s2.open !== false ? "OPEN-AFTER" : lost ? "LOST" : "CLOSE-UNRECORDED" };
});

await clause("I3 JUDGE · a held judge port defers the retire; freed, the next write retires", async () => {
  const k = await import(pathToFileURL(join(ORG, "scripts", "keeper.mjs")).href);
  const jport = k.JUDGE_PORT;
  if (!jport) return { ok: false, why: "keeper.mjs names no JUDGE_PORT", code: "NO-JUDGE-PORT" };
  const judge = spawn(process.execPath, ["-e", `require("net").createServer().listen(${jport}, "127.0.0.1", () => console.log("HELD")); setInterval(() => {}, 1 << 30); // ${TMP}`], { stdio: ["ignore", "pipe", "inherit"] });
  kids.push(judge);
  const held = await new Promise((res) => { judge.stdout.on("data", (d) => /HELD/.test(String(d)) && res(true)); judge.once("exit", () => res(false)); });
  if (!held) return { ok: false, why: `the judge port :${jport} could not be held`, code: "JUDGE-UNHELD" };
  // UNIT mrv (I3 stands alone): ~~const s1 = await portUp(); if (!s1) { await killTree(judge); return { ok: false, why: "no daemon up" }; }~~
  let s1 = await portUp(), pre = "inherited an idle keeper";
  if (!s1) {
    await killTree(keeper);
    const f = await portFreed(); if (!f.ok) { await killTree(judge); return f; }
    keeper = startKeeper();
    const b = await bootUp(() => true); s1 = b.s; pre = `started its own keeper (${b.why})`;
    if (!s1) { await killTree(judge); return { ok: false, why: `no daemon up · ${b.why}`, code: b.code }; }
  }
  if (s1.open) {
    const c0 = Date.now();
    let closed = null;
    try { closed = await (await fetch(`http://127.0.0.1:${PORT}/close`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ reason: "planted-by-I3" }), signal: AbortSignal.timeout(BOUND) })).json(); } catch (e) { closed = { ok: false, error: String((e && e.name) || e) }; }
    const idle = closed && closed.ok ? await waitFor(async () => { const s = await portUp(); return s && !s.open ? s : null; }, BOUND) : null;
    pre += ` · closed the open sitting it found through the door in ${Date.now() - c0} ms (bound ${BOUND} ms each)`;
    if (!idle) { await killTree(judge); return { ok: false, why: `${pre} · close ${closed && closed.ok} ${closed && closed.error ? closed.error : ""} · no idle keeper after it`, code: "CLOSE-FAIL" }; }
    s1 = idle;
  }
  const n = out.length;
  touchClosure();
  const deferred = await waitFor(async () => linesSince(n, /retire DEFERRED.*judge/), BOUND);
  const mid = await portUp();
  await killTree(judge);
  touchClosure();
  const s2 = await waitFor(async () => { const s = await portUp(); return s && s.pid !== s1.pid ? s : null; }, BOUND);
  const ok = !!deferred && mid && mid.pid === s1.pid && !!s2;
  return { ok, why: `${pre} · ${deferred ? "DEFERRED naming the judge" : "no DEFERRED line"} · held pid ${s1.pid} → ${mid && mid.pid} · freed → ${s2 ? s2.pid : "no retire"}`,
    code: !deferred ? "DEFER-MISSING" : !(mid && mid.pid === s1.pid) ? "DEFER-BROKEN" : "NO-RETIRE-AFTER" };
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
    return { ok: xa === xb && /scripts\/sitting\.mjs daemon|scripts\\sitting\.mjs daemon/.test(xb), why: xa === xb ? "identical" : "the XML CHANGED", code: "XML-CHANGED" };
  });
  await clause("BOUND · only the named files differ (scripts/ + setup/, by bytes)", () => {
    const a = new Map([...walk(BASE, "scripts"), ...walk(BASE, "setup")]), b = new Map([...walk(ORG, "scripts"), ...walk(ORG, "setup")]);
    const diff = [...new Set([...a.keys(), ...b.keys()])].filter((k) => a.get(k) !== b.get(k)).sort(), extra = diff.filter((f) => !NAMED.includes(f));
    return { ok: extra.length === 0, why: `${diff.length} file(s) differ${extra.length ? ` · BEYOND THE NAMED: ${extra.join(", ")}` : ""}`, code: "BEYOND-NAMED" };
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
  } catch (e) { return { ok: false, why: `process table unreadable: ${e.message}`, code: "TABLE-UNREADABLE" }; }
  const left = table.split(/\r?\n/).filter((l) => l.includes(TMP) && !/\bps -eo\b/.test(l));
  return { ok: left.length === 0, why: `${left.length} survivor(s)`, code: "SURVIVOR" };
});
const red = results.filter((r) => !r.ok).map((r) => r.id.split(" · ")[0]);
if (red.length) { console.log(`RED ${UNIT} · ${red.join(", ")}`); process.exit(1); }
console.log(`GREEN ${UNIT} sitting retires on a source change only when no sitting is open and no judge round runs · ${results.length} clause(s)`);
process.exit(0);
