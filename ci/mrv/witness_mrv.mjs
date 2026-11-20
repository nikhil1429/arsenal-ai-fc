#!/usr/bin/env node
// ============================================================================
// ci/mrv/witness_mrv.mjs — UNIT mrv · THE KEEPER-FAMILY WITNESSES STAND ON THEIR OWN CLOCKS (forks rows 1135 (4) F-4 A / 1139 (1))
// ----------------------------------------------------------------------------
//   node ci/mrv/witness_mrv.mjs --org <dir> --base-org <dir> [--only "<clause id>"]
// CONTRACT (judged on --org; the build reads GREEN, the base cf1ca54 reads RED). It runs --org's OWN ci/mlv1, ci/mlv2 and
// ci/mlv3 witnesses, each over a COPY of --org under os.tmpdir(), each under ONE plant, and judges the clauses that plant
// is aimed at. The plants (ci/mrv/plant_mrv.mjs, a preload, plus one holder child of this witness) take their sizes from the
// judged witness's OWN measured lines, never from a typed number:
//   M1 RESTART   mlv1 under p1 — I2's RE-started keeper boots slower by mlv1's own measured first BOOT: I1, I2, I3 and LAST GREEN.
//   M1 PORTHELD  mlv1 under p2 — the killed worker's port is held, outside the keeper's tree, and mlv1 learns of the kill
//                only once it is held (win32's teardown lag, made certain on any OS); it is held for mlv1's measured BOOT less
//                mlv1's measured SLACK (a hold AT the bound would judge the timer, not the wait): I2, I3 and LAST GREEN.
//   M1 ALONE     mlv1 under p3 — the keeper exits at I2's after-close retire (the state a red I2 leaves: no keeper): I3 and
//                LAST GREEN (I2 is red by the plant and not judged).
//   M2 BOOT      mlv2 under p1 — its FIRST keeper boots slower by mlv2's own BOOT0 (its header's formula, two IMPORTs and three
//                SLACKs, read from its first line): C1 and LAST GREEN.
//   M2 ALONE     mlv2 under p3 — the keeper exits at C1's retire: C2, C3, K5 and LAST GREEN (C1 red by the plant).
//   M3 BOOT      mlv3 under p1 — as M2 BOOT: T1 and LAST GREEN.
//   M3 RESPAWN   mlv3 under p1w — the worker respawned by T2's retire (its third worker) boots slower by mlv3's own BOOT0:
//                T2 and LAST GREEN (row 1139 (1), the ruling on 03ec8d7).
//   M3 ALONE     mlv3 under p3 — the keeper exits at T2's retire: T3, T4 and LAST GREEN (T2 red by the plant).
//   BOUND        only the named files differ between --base-org and --org (ci/mlv1/ · ci/mlv2/ · ci/mlv3/ · ci/mrv/ ·
//                scripts/organism_test.mjs), by text, CRLF folded.
//   LAST         no node process naming this run's temp dir survives.
// A MEASUREMENT, not a clause (row 1135 (5)): mlv1 runs once with no plant and its `PORT_HELD` machine line is re-printed
// here verbatim, and its figure rides the GREEN last line.
// THE PORT CLASS (row 1053): no fixed port is bound; each child run gets ARSENAL_JUDGE_PORT on an OS-picked port (the
// keeper's door, honoured only under the temp dir); the p2 holder binds only the planted port the keeper was handed (read
// from MRV_DIR/port). No live service is named, nothing is POSTed by this file, nothing outside the temp dir restarts.
// Every wait ends on an EVENT (a child's exit) or is a child's own bounded wait; the member's derived `left` is the outer bound.
// UNIT mkp24 (forks row 1216 K-F2 C0, in place, BASE kept): a red clause also prints ONE machine line `CAUSE <ID> <CODE>`
// before its RED line, its CODE a key of the family's CAUSES literal below; a judged inner clause's own CAUSE code passes
// through as mrv's, mapped to mrv's clause id (spec section 7). NAMED, every plant, wait, clause id and claim is unchanged.
// LAST LINE: GREEN MRV <what> · <n> clause(s) (exit 0) or RED MRV · <clauses> (exit 1)
// ============================================================================
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync, rmSync, readdirSync, cpSync, symlinkSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { tmpdir } from "node:os";
import { spawn, spawnSync, execFileSync } from "node:child_process";
import { createServer } from "node:net";
import { createHash } from "node:crypto";
import { pathToFileURL, fileURLToPath } from "node:url";

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
const ORG = resolve(arg("--org") || "."), BASE = arg("--base-org") ? resolve(arg("--base-org")) : null, ONLY = arg("--only");
const UNIT = "MRV", HERE = dirname(fileURLToPath(import.meta.url)), PLANT = join(HERE, "plant_mrv.mjs");
const NAMED = (f) => /^ci\/(mlv1|mlv2|mlv3|mrv)\//.test(f) || f === "scripts/organism_test.mjs";
const TMP = mkdtempSync(join(tmpdir(), "mrv-witness-"));
const results = [];
const clause = async (id, fn) => {
  const short = id.split(" · ")[0];
  if (ONLY && short !== ONLY && short !== "LAST") return;
  let ok = false, why = "", code = "";
  try { const r = await fn(); ok = r === true || (r && r.ok === true); why = (r && r.why) || ""; code = (r && r.code) || ""; } catch (e) { why = `threw: ${String((e && e.message) || e).split(/\r?\n/)[0].slice(0, 200)}`; code = "THREW"; }
  results.push({ id, ok });
  if (!ok) console.log(`CAUSE ${short} ${Object.hasOwn(CAUSES, code) ? code : "UNCODED"}`);   // UNIT mkp24 (row 1216 K-F2 C0)
  console.log(`  ${ok ? "GREEN" : "RED  "} ${id}${why ? ` · ${why}` : ""}`);
};
const t0 = Date.now(); spawnSync(process.execPath, ["-e", "0"]); const SLACK = Math.max(1, Date.now() - t0);
const freePort = () => new Promise((res) => { const s = createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => res(p)); }); });

// THE COPY: what the keeper witnesses read (they copy it once more into their own temp dirs)
const COPY = join(TMP, "org");
for (const p of [["scripts"], ["setup"], ["package.json"], ["dressing-room", "state"], ["ci", "mlv1"], ["ci", "mlv2"], ["ci", "mlv3"]]) if (existsSync(join(ORG, ...p))) cpSync(join(ORG, ...p), join(COPY, ...p), { recursive: true, filter: (s) => !/\.log$/.test(s) });
if (existsSync(join(ORG, "node_modules"))) symlinkSync(join(ORG, "node_modules"), join(COPY, "node_modules"), process.platform === "win32" ? "junction" : "dir");
console.log(`witness mrv · org ${ORG} · slack ${SLACK} ms · plant ${PLANT}`);

// THE p2 HOLDER — a child of THIS witness (outside the keeper's tree, so a win32 tree kill cannot take it). Armed with the
// planted port and a hold in ms, it binds that port the instant it is free, holds it, then frees it. Its argv names TMP.
const HOLDER = `const net = require("net"); let buf = "", armed = false;
process.stdin.setEncoding("utf8");
process.stdin.on("data", (d) => { buf += d; const m = /ARM (.*)\\n/.exec(buf); if (!m || armed) return; armed = true;
  const { port, ms, flag } = JSON.parse(m[1]), a0 = Date.now();
  const tryBind = () => { const s = net.createServer(); s.once("error", () => setImmediate(tryBind)); s.listen(port, "127.0.0.1", () => { require("fs").writeFileSync(flag, "held"); console.log("HELD " + (Date.now() - a0)); setTimeout(() => s.close(() => { console.log("FREED"); process.exit(0); }), ms); }); };
  tryBind(); });
process.stdin.on("end", () => process.exit(0));`;

let runNo = 0;
/** run --org's ci/<unit> witness over COPY under one plant; resolves at the child's EXIT
 *  @param {string} unit @param {"none"|"p1"|"p1w"|"p2"|"p3"} plant @param {{ at?: number }} [o] */
async function runUnder(unit, plant, { at = 0 } = {}) {
  const dir = join(TMP, `plant-${++runNo}-${unit}-${plant}`); mkdirSync(dir);
  const env = { ...process.env, ARSENAL_JUDGE_PORT: String(await freePort()), MRV_PLANT: plant, MRV_DIR: dir, MRV_P1_AT: String(at), MRV_P3_AT: String(at),
    NODE_OPTIONS: `${process.env.NODE_OPTIONS ? `${process.env.NODE_OPTIONS} ` : ""}--import=${pathToFileURL(PLANT).href}` };
  const w = join(COPY, "ci", unit, `witness_${unit}.mjs`);
  if (!existsSync(w)) return { clauses: {}, lines: [], last: `no ${unit} witness in --org`, engaged: "", code: null };
  const holder = plant === "p2" ? spawn(process.execPath, ["-e", HOLDER, TMP], { stdio: ["pipe", "pipe", "ignore"], windowsHide: true }) : null;
  const held = [];
  if (holder) {
    holder.stdout.on("data", (d) => held.push(...String(d).split(/\r?\n/).filter(Boolean)));
    // a holder that ends without holding releases the deferred exit (p2_gone): the witness is never left waiting on it
    holder.once("exit", () => { if (!existsSync(join(dir, "p2_held"))) { try { writeFileSync(join(dir, "p2_gone"), "gone"); } catch { /* TMP removed */ } } });
  }
  const c = spawn(process.execPath, [w, "--org", COPY], { cwd: TMP, env, stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
  const lines = [];
  let boot = null, wslack = null;
  const onLine = (l) => {
    lines.push(l);
    const fb = /first keeper up in (\d+) ms/.exec(l);
    if (fb && boot === null) boot = Number(fb[1]);
    const ws = /^witness mlv\d .*· slack (\d+) ms/.exec(l);
    if (ws && wslack === null) wslack = Number(ws[1]);
    const sl = /· slack (\d+) ms · import (\d+) ms/.exec(l);
    // p1's size: mlv1's measured first BOOT (it slows the SECOND keeper); mlv2/mlv3's own BOOT0 (it slows the FIRST)
    if ((plant === "p1" || plant === "p1w") && !existsSync(join(dir, "p1_ms"))) {
      if (unit === "mlv1" && fb) writeFileSync(join(dir, "p1_ms"), fb[1]);
      if (unit !== "mlv1" && sl) writeFileSync(join(dir, "p1_ms"), String(Number(sl[2]) + Number(sl[2]) + Number(sl[1]) + Number(sl[1]) + Number(sl[1])));
    }
    // p2 arms at mlv1's I1 verdict: the next act of mlv1 is I2's kill
    if (holder && boot !== null && /^\s+(GREEN|RED)\s+I1 IDLE/.test(l) && existsSync(join(dir, "port"))) holder.stdin.write(`ARM ${JSON.stringify({ port: Number(readFileSync(join(dir, "port"), "utf8").trim()), ms: Math.max(1, boot - (wslack || 0)), flag: join(dir, "p2_held") })}\n`);
  };
  let pend = "";
  const feed = (d) => { pend += String(d); const parts = pend.split(/\r?\n/); pend = parts.pop() || ""; for (const l of parts) if (l) onLine(l); };
  c.stdout.on("data", feed); c.stderr.on("data", feed);
  const code = await new Promise((r) => c.once("exit", (x) => r(x)));
  if (pend) onLine(pend);
  if (holder) { try { holder.stdin.end(); } catch { /* gone */ } await new Promise((r) => (holder.exitCode != null || holder.signalCode != null ? r() : holder.once("exit", r))); }
  const clauses = {};
  for (const l of lines) { const m = /^\s+(GREEN|RED)\s+(.+?) · /.exec(l); if (m) clauses[m[2]] = { ok: m[1] === "GREEN", line: l.trim() }; }
  // UNIT mkp24 (C0): the inner witness's own CAUSE codes, by its clause id (the first per id)
  const causes = {};
  for (const l of lines) { const m = /^CAUSE (\S.*?) (\S+)$/.exec(l.trim()); if (m && !Object.hasOwn(causes, m[1])) causes[m[1]] = m[2]; }
  const engaged = plant === "p2" ? (held.find((l) => /^HELD/.test(l)) || "") : ["p1_engaged", "p3_engaged"].map((f) => (existsSync(join(dir, f)) ? readFileSync(join(dir, f), "utf8").trim() : "")).join("");
  const last = lines.filter((l) => /^(GREEN|RED) /.test(l)).pop() || "(no last line)";
  return { clauses, lines, last, engaged, code, causes, portHeld: lines.find((l) => /^PORT_HELD /.test(l)) || "" };
}
/** a plant's verdict: engaged, and each judged clause GREEN @param {Awaited<ReturnType<typeof runUnder>>} r @param {string[]} ids */
const verdict = (r, ids, plant) => {
  const bad = ids.filter((id) => !(r.clauses[id] && r.clauses[id].ok));
  const ok = plant === "none" || !!r.engaged;
  return { ok: ok && bad.length === 0, why: `${ok ? `plant ${plant} engaged (${r.engaged.replace(/\s+/g, " ").slice(0, 90)})` : `plant ${plant} DID NOT ENGAGE`} · ${ids.map((id) => `${id} ${r.clauses[id] ? (r.clauses[id].ok ? "GREEN" : "RED") : "ABSENT"}`).join(" · ")}${bad.length ? ` · ${bad.map((id) => (r.clauses[id] ? r.clauses[id].line.slice(0, 200) : `${id}: absent`)).join(" | ")}` : ""} · ${r.last.slice(0, 80)}`,
    // UNIT mkp24 (C0): the first judged inner red's own code passes through when the family carries it
    code: !ok ? "NOT-ENGAGED" : !bad.length ? "" : !r.clauses[bad[0]] ? "INNER-ABSENT" : Object.hasOwn(CAUSES, (r.causes || {})[bad[0]] || "") ? r.causes[bad[0]] : "INNER-RED" };
};

let figure = "no PORT_HELD line";
if (!ONLY) {
  const n = await runUnder("mlv1", "none");
  if (n.portHeld) { console.log(n.portHeld); const m = /held (\d+) ms after the kill/.exec(n.portHeld); if (m) figure = `port held ${m[1]} ms after the kill (${process.platform}, node ${process.version})`; }
  else console.log(`PORT_HELD mlv1 · ${process.platform} · node ${process.version} · none printed (this mlv1 has no port-free wait) · ${n.last.slice(0, 80)}`);
}
await clause("M1 RESTART · mlv1's re-started keeper is waited as a BOOT, not one sample", async () => verdict(await runUnder("mlv1", "p1", { at: 2 }), ["I1 IDLE", "I2 MID", "I3 JUDGE", "LAST"], "p1"));
await clause("M1 PORTHELD · after the kill mlv1 waits for its port, then starts the next keeper", async () => {
  const r = await runUnder("mlv1", "p2");
  const v = verdict(r, ["I2 MID", "I3 JUDGE", "LAST"], "p2");
  return { ...v, why: `${v.why}${r.portHeld ? ` · ${r.portHeld}` : ""}` };
});
await clause("M1 ALONE · mlv1's I3 stands on its own keeper when I2 left none", async () => verdict(await runUnder("mlv1", "p3", { at: 2 }), ["I3 JUDGE", "LAST"], "p3"));
await clause("M2 BOOT · mlv2's first keeper is waited as a BOOT", async () => verdict(await runUnder("mlv2", "p1", { at: 1 }), ["C1 IDLE", "LAST"], "p1"));
await clause("M2 ALONE · mlv2's later clauses stand on their own keeper", async () => verdict(await runUnder("mlv2", "p3", { at: 1 }), ["C2 LANE", "C3 JUDGE", "K5 DOOR", "LAST"], "p3"));
await clause("M3 BOOT · mlv3's first keeper is waited as a BOOT", async () => verdict(await runUnder("mlv3", "p1", { at: 1 }), ["T1 IDLE", "LAST"], "p1"));
await clause("M3 RESPAWN · mlv3's T2 waits its respawned worker as a BOOT", async () => verdict(await runUnder("mlv3", "p1w", { at: 3 }), ["T2 ONCE", "LAST"], "p1w"));
await clause("M3 ALONE · mlv3's later clauses stand on their own keeper", async () => verdict(await runUnder("mlv3", "p3", { at: 2 }), ["T3 INFLIGHT", "T4 JUDGE", "LAST"], "p3"));

const walk = (root, dir = "", o = new Map()) => {
  let ents = []; try { ents = readdirSync(join(root, dir), { withFileTypes: true }); } catch { return o; }
  for (const e of ents) {
    const rel = dir ? `${dir}/${e.name}` : e.name;
    if (!dir && (e.name === "node_modules" || e.name === ".git")) continue;
    if (e.isDirectory()) walk(root, rel, o);
    else if (e.isFile()) { const b = readFileSync(join(root, rel)); const t = b.includes(0) ? b : Buffer.from(b.toString("utf8").replace(/\r\n/g, "\n")); o.set(rel, createHash("sha256").update(t).digest("hex")); }
  }
  return o;
};
if (BASE && !ONLY) await clause("BOUND · only the named files differ (ci/mlv1/ ci/mlv2/ ci/mlv3/ ci/mrv/ scripts/organism_test.mjs; by text, CRLF folded)", () => {
  const a = walk(BASE), b = walk(ORG);
  const diff = [...new Set([...a.keys(), ...b.keys()])].filter((k) => a.get(k) !== b.get(k)).sort(), extra = diff.filter((f) => !NAMED(f));
  return { ok: extra.length === 0, why: `${diff.length} file(s) differ${extra.length ? ` · BEYOND THE NAMED: ${extra.slice(0, 12).join(", ")}${extra.length > 12 ? ` (+${extra.length - 12})` : ""}` : ""}`, code: "BEYOND-NAMED" };
});
try { rmSync(TMP, { recursive: true, force: true }); } catch { /* a survivor holds a file: LAST names it */ }
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
console.log(`GREEN ${UNIT} the keeper-family witnesses wait a keeper start as a boot, free the port after a kill, and stand each clause on its own keeper · ${figure} · ${results.length} clause(s)`);
process.exit(0);
