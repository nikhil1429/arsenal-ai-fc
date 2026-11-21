#!/usr/bin/env node
// ============================================================================
// ci/mpres2/witness_mpres2.mjs — UNIT mpres2 · THE REPAIR DOOR OF THE ACTIVITY WATCHER: one launcher alive is the bound,
//   and dead means dead, not slow (forks rows 1235 (5) / 1251 / 1259; spec ci/mpres2/MPRES2_SPEC.md @ bfb8e55 on
//   claude/mpres2-spec — where the spec and row 1259 differ, the ROW wins, and ci/mpres2/PROOF.md names the difference)
// ----------------------------------------------------------------------------
// USAGE: node ci/mpres2/witness_mpres2.mjs --org <dir> --base-org <dir> [--only <clause>[,<clause>…]]
//   --org       the tree to witness (the build reads GREEN; the base 7bf008b reads RED on every clause but the seat-time four)
//   --base-org  the BASE tree (main 7bf008b) — BOUND needs it; absent, BOUND is RED
//   --only      run only these clause ids (the mutant runner's door); the seat-time clauses then run only LAST
// CONTRACT — every plant is a COPY of --org's scripts/ + package.json under os.tmpdir(), with its OWN dressing-room/state that is
//   EMPTY but for the tracked registry.json (copied by node, never a shell write under a state path); every row is planted
//   through `deps.repairRow` (module level) or `node scripts/registry.mjs set|retire` with ARSENAL_REGISTRY under the temp root
//   (CLI level — the owner's own CLI). Nothing of his is copied, nothing printed. HOME / USERPROFILE / ARSENAL_ARCHIVE point
//   under the temp root and a refusing `claude` / `gemini` (+ .cmd) sits FIRST on PATH (a planted model, never a live call).
// THE LISTER IS A SEAM, PLANTED IN EVERY CLAUSE (row 1259 F10 C): module clauses hand `deps.lister` and `deps.pidAlive`; in this
//   process node:child_process's execFile / execFileSync / exec / execSync / spawn are REPLACED (syncBuiltinESMExports) by
//   refusers that record, so a call to the organ's default lister or spawn reads RED in NO-REAL-LIST. CLI children run with
//   `--import <temp>/plantnet.mjs`: fetch throws ECONNREFUSED (recording the URL), spawn records and answers ENOENT (nothing
//   starts), execFile records and answers the PLANTED listing (env MPRES2_LISTING, a count) — no clause lists his processes.
// THE PORT CLASS (row 1053): nothing binds a port, names a live service, POSTs at a daemon or restarts anything; the AW door is an
//   RFC 6761 `.invalid` host; ARSENAL_AW_LAUNCHER is UNSET in every child (it would short-circuit the registry door). No git repo
//   is planted (core.autocrlf: nothing to clone or init); every line read from a process is split on \r?\n; BOUND hashes text
//   with CRLF folded to LF; LAST lists processes through PowerShell on Windows and `ps` elsewhere, with the real child_process
//   restored first. No timeout, budget or size is typed: every wait is a child's exit or a planted seam's answer.
// CLAUSES (every one RED at base 7bf008b, GREEN at the build; time = the row-1235 span, dead from 2026-11-20T16:20Z):
//  class one — a `none` record (no ask ran) does not close the span (spec §2, F1 B)
//   M1  CASE          pass 1 no row ⇒ none; passes 2..5 an eligible row ⇒ asked ONCE at pass 2, same span (and: never a row ⇒
//                     five `none`, zero asks)
//   M2  BOUND         over passes 2..5 exactly one ask; pass 5 carries pass 2's record (and: an `asking` record closes the span)
//   M4  INELIGIBLE    a row reversible:false ⇒ none; made eligible in the same span ⇒ one ask
//   M6  END-TO-END    CLI: `presence.mjs sense` (no row) ⇒ `repair none`; `registry.mjs set` seeds the row; `sense` ⇒ `repair
//                     failed (ENOENT)` and senses names `repair FAILED (ENOENT)`; a second tree, listing planted 1 ⇒ `repair
//                     beside-running` and NO spawn recorded
//  class two — never beside a running launcher (spec §11, F8 B, F10 C)
//   R1  NO-RELAUNCH   dead, live, dead, live, dead with a launcher running from the first ask on ⇒ ONE ask, later spans
//                     beside-running (and: launcher not running ⇒ asked)
//   R2  NAMED-RED     R1's last snapshot ⇒ senses evidence `dead beside a running launcher` and the state line names it
//   R4  REASON        abort (no launcher) · refused · no-window-bucket · bad-json ⇒ dead_reason each by name
//   R5  RESEED        CLI: a retired row + a `set` that omits `retired` ⇒ the door still says no row; `retired:false` ⇒ the door
//                     names the launcher; a running launcher planted ⇒ beside-running, zero asks
//   F8  DIED          beside-running twice (the launcher read EACH pass), then the launcher has died ⇒ ONE ask, then closed
//   F10 PID-FIRST     the door's own spawn pid alive ⇒ running by pid and NO listing; pid gone ⇒ ONE listing by the leaf name
//  class three — slow or busy is not dead (spec §12.2, F11 A, F12 A, F13 B)
//   S1  BUSY          abort ×3 beside a running launcher ⇒ busy, no dead_since, busy_since the first, zero asks (and: refused
//                     ×2, no launcher running ⇒ dead, one ask)
//   S3  ANSWERED      no window bucket ⇒ dead `no-window-bucket`, launcher NOT read, nothing asked, senses `watcher absent`;
//                     bad-json the same: not read, not asked
//   S4  BUSY-LIVE     abort, abort, events ⇒ alive, no dead span ever opened, zero asks
//   S6  AMBER         a busy snapshot ⇒ the state line carries `senses ? presence busy since <IST>` and no `senses ✗`
//   S7  NEVER-DEAD    busy passes across three days ⇒ every one busy, dead_since null, busy_since unchanged, zero asks
//   S8  HOLDS-SPAN    dead (asked), busy, dead ⇒ the busy pass holds the span's dead_since; no second ask
//  seat-time (no mutant)
//   NO-REAL-LIST      this process called no real lister and started nothing (the refusers recorded zero calls)
//   NO-TRACK          `git status --porcelain` of the cwd and of --org (where each is a work tree) is unchanged by this run
//   BOUND             only scripts/presence.mjs, scripts/senses.mjs and ci/mpres2/ differ between --base-org and --org
//   LAST              no node process naming the temp root survives
// LAST LINE: GREEN MPRES2 <what> · <n> clause(s) (exit 0) or RED MPRES2 · <clauses> (exit 1)
// ============================================================================
import { cpSync, mkdirSync, mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync, readdirSync, symlinkSync, copyFileSync } from "node:fs";
import { join, resolve, delimiter } from "node:path";
import { tmpdir } from "node:os";
import cp, { spawnSync } from "node:child_process";
import { syncBuiltinESMExports } from "node:module";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : null; };
const ORG = arg("--org") ? resolve(arg("--org")) : null, BASE_ORG = arg("--base-org") ? resolve(arg("--base-org")) : null;
const ONLY = arg("--only") ? arg("--only").split(",") : null;
if (!ORG || !existsSync(join(ORG, "scripts", "presence.mjs"))) { console.log("RED MPRES2 · USAGE (--org <dir> with scripts/presence.mjs)"); process.exit(1); }
const UNIT = "MPRES2";
const NAMED = ["scripts/presence.mjs", "scripts/senses.mjs"];
const NAMED_DIRS = ["ci/mpres2/"];
const lines = (s) => String(s || "").split(/\r?\n/).filter((l) => l.trim());
const gitStatus = (dir) => {
  const r = spawnSync("git", ["-C", dir, "status", "--porcelain"], { encoding: "utf8", windowsHide: true });
  return r.status === 0 ? String(r.stdout || "").replace(/\r\n/g, "\n") : null;
};
const TRACK0 = { cwd: gitStatus(process.cwd()), org: gitStatus(ORG) };
const ROOT = mkdtempSync(join(tmpdir(), "mpres2-wit-"));
const results = [];
const clause = (id, ok, why) => { results.push({ id, ok: !!ok }); console.log(`  ${ok ? "GREEN" : "RED  "} ${id} · ${why}`); };
const want = (...ids) => !ONLY || ids.some((i) => ONLY.includes(i));
const readJson = (p) => { try { return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : null; } catch { return null; } };
const T0 = Date.UTC(2026, 10, 20, 16, 20, 0);                  // 21:50 IST 20 Nov — the row-1235 span opens
const at = (m) => new Date(T0 + m * 60000);
const iso = (m) => at(m).toISOString();

// ── THIS PROCESS LISTS NOTHING, STARTS NOTHING, DIALS NOTHING ─────────────────────────────────────────────────────────────
const REAL = { execFile: cp.execFile, execFileSync: cp.execFileSync, exec: cp.exec, execSync: cp.execSync, spawn: cp.spawn };
const refusedCalls = [];
const refuser = (name) => (...a) => { refusedCalls.push(`${name} ${String(a[0])}`); throw new Error(`REFUSED — ${name} in a witness (unit mpres2): no real process is listed or started`); };
for (const k of Object.keys(REAL)) cp[k] = refuser(k);
syncBuiltinESMExports();
globalThis.fetch = async (url) => { refusedCalls.push(`fetch ${String(url)}`); const e = new TypeError("fetch failed"); e.cause = { code: "ECONNREFUSED" }; throw e; };
const DOOR = "http://aw-door.invalid";
process.env.AW_API_BASE = DOOR; delete process.env.ARSENAL_AW; delete process.env.ARSENAL_AW_LAUNCHER;

// ── PLANTS ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const SHIM = join(ROOT, "shim");
mkdirSync(SHIM);
for (const tool of ["claude", "gemini"]) {
  writeFileSync(join(SHIM, tool), "#!/bin/sh\necho \"REFUSED — no live model call in a witness (unit mpres2)\" >&2\nexit 1\n", { mode: 0o755 });
  writeFileSync(join(SHIM, `${tool}.cmd`), "@echo REFUSED — no live model call in a witness (unit mpres2) 1>&2\r\n@exit /b 1\r\n");
}
const CHILD_LOG = join(ROOT, "child-calls.txt");
const PLANTNET = join(ROOT, "plantnet.mjs");
writeFileSync(PLANTNET, [
  "import cp from 'node:child_process';",
  "import { syncBuiltinESMExports } from 'node:module';",
  "import { EventEmitter } from 'node:events';",
  "import { appendFileSync } from 'node:fs';",
  "const LOG = process.env.MPRES2_CHILD_LOG;",
  "const rec = (s) => { try { if (LOG) appendFileSync(LOG, `${process.pid} ${s}\\n`); } catch { /* the record is best-effort; the refusal is the plant */ } };",
  "globalThis.fetch = async (url) => { rec(`fetch ${String(url && url.url ? url.url : url)}`); const e = new TypeError('fetch failed'); e.cause = Object.assign(new Error('connect ECONNREFUSED (planted by ci/mpres2)'), { code: 'ECONNREFUSED' }); throw e; };",
  "cp.spawn = (cmd) => { rec(`spawn ${cmd}`); const c = new EventEmitter(); c.unref = () => {}; setImmediate(() => c.emit('error', Object.assign(new Error('spawn ENOENT (planted by ci/mpres2)'), { code: 'ENOENT' }))); return c; };",
  "cp.execFile = (cmd, ...rest) => { rec(`list ${cmd}`); const cb = rest.find((x) => typeof x === 'function'); const n = String(process.env.MPRES2_LISTING || '0');",
  "  const leaf = String(process.env.MPRES2_LEAF || '');",
  "  const out = /powershell/i.test(String(cmd)) ? `${n}\\r\\n` : Array.from({ length: Number(n) }, () => `/planted/${leaf} --planted`).join('\\n') + '\\n';",
  "  setImmediate(() => cb && cb(null, out, '')); return new EventEmitter(); };",
  "for (const k of ['execFileSync', 'exec', 'execSync']) cp[k] = (...a) => { rec(`${k} ${a[0]}`); throw new Error(`REFUSED ${k} (planted by ci/mpres2)`); };",
  "syncBuiltinESMExports();",
].join("\n") + "\n");
const childCalls = () => { try { return lines(readFileSync(CHILD_LOG, "utf8")).map((l) => l.slice(l.indexOf(" ") + 1)); } catch { return []; } };

const plant = (name) => {
  const dir = join(ROOT, name);
  cpSync(join(ORG, "scripts"), join(dir, "scripts"), { recursive: true });
  if (existsSync(join(ORG, "package.json"))) cpSync(join(ORG, "package.json"), join(dir, "package.json"));
  const sd = join(dir, "dressing-room", "state");
  mkdirSync(sd, { recursive: true });
  const reg = join(ORG, "dressing-room", "state", "registry.json");
  if (existsSync(reg)) copyFileSync(reg, join(sd, "registry.json"));
  else writeFileSync(join(sd, "registry.json"), JSON.stringify({ version: 1, tables: {} }));
  if (existsSync(join(ORG, "node_modules"))) symlinkSync(join(ORG, "node_modules"), join(dir, "node_modules"), process.platform === "win32" ? "junction" : "dir");
  return { dir, sd, reg: join(sd, "registry.json") };
};
const childEnv = (p, extra = {}) => {
  const env = { ...process.env };
  for (const k of ["ARSENAL_AW", "ARSENAL_AW_LAUNCHER", "ARSENAL_REPS_INBOX", "NODE_OPTIONS", "ANTHROPIC_API_KEY"]) delete env[k];
  const home = join(ROOT, "home"); mkdirSync(home, { recursive: true });
  Object.assign(env, { HOME: home, USERPROFILE: home, ARSENAL_ARCHIVE: join(home, "archive"), AW_API_BASE: DOOR, ARSENAL_REGISTRY: p.reg, MPRES2_CHILD_LOG: CHILD_LOG, MPRES2_LISTING: "0", MPRES2_LEAF: LEAF });
  const pk = Object.keys(env).find((k) => k.toUpperCase() === "PATH") || "PATH";
  env[pk] = `${SHIM}${delimiter}${env[pk] || ""}`;
  for (const [k, v] of Object.entries(extra)) { if (v === null) delete env[k]; else env[k] = v; }
  return env;
};
const runNode = (p, args, extra = {}) => {
  const r = spawnSync(process.execPath, ["--import", pathToFileURL(PLANTNET).href, ...args], { cwd: p.dir, env: childEnv(p, extra), encoding: "utf8", windowsHide: true });
  return { code: r.status, out: String(r.stdout || "") + String(r.stderr || ""), lines: lines(r.stdout) };
};
const mod = (p, rel) => import(pathToFileURL(join(p.dir, rel)).href);
const guard = async (id, fn) => { try { const v = await fn(); clause(id, v.ok, v.why); } catch (e) { clause(id, false, `threw: ${String((e && e.message) || e).slice(0, 200)}`); } };

// the planted fetch outcomes (nothing is dialled: each is a function handed to the organ as deps.fetchFn)
const REFUSED = async () => { const e = new TypeError("fetch failed"); e.cause = Object.assign(new Error("connect ECONNREFUSED (planted)"), { code: "ECONNREFUSED" }); throw e; };
const ABORT = async () => { throw new DOMException("This operation was aborted", "AbortError"); };
const NO_WINDOW = async () => ({ json: async () => ({ "aw-watcher-afk_planted": {} }) });
const BAD_JSON = async () => ({ json: async () => { throw new SyntaxError("Unexpected token < in JSON (planted)"); } });
const LEAF = "aw-mpres2-planted";
const ROW = { subject: "activitywatch", artifact: "activitywatch", verified_by: "the next sense pass reads alive", report_anchor: "the state line", witness: "ci/mpres2/witness_mpres2.mjs", reversible: true, launcher: LEAF };
const TONE = { arousal: "open", effects: {} };

const P = plant("m");
const m = await mod(P, "scripts/presence.mjs");
const sm = existsSync(join(P.dir, "scripts", "senses.mjs")) ? await mod(P, "scripts/senses.mjs") : null;
const st = await mod(P, "scripts/state.mjs");
let seqN = 0;
/** one planted sequence: its own snapshot file, its asks, its listings and pid checks — every seam planted */
const seq = (o = {}) => {
  const f = join(ROOT, `seq-${++seqN}.json`);
  const s = { f, asks: [], lists: [], pidChecks: [], running: o.running || false, pidAlive: o.pidAlive || false, launchPid: o.launchPid || null, launchOk: o.launchOk || false };
  const lister = async (leaf) => { s.lists.push(leaf); return { running: s.running, why: `${s.running ? 1 : 0} ${leaf} listed (planted)` }; };
  const pidAlive = async (pid) => { s.pidChecks.push(pid); return s.pidAlive; };
  const launch = async (cmd) => { s.asks.push(cmd); if (o.onAsk) o.onAsk(s); return s.launchOk ? { ok: true, why: "the launcher started", pid: s.launchPid || undefined } : { ok: false, why: "ENOENT" }; };
  s.dead = async (min, fetchFn = REFUSED, repairRow = ROW) => { await m.sense({ now: at(min), tone: TONE, fetchFn, inputFile: f, env: {}, repairRow, launch, lister, pidAlive }); return readJson(f); };
  s.live = async (min) => {
    await m.sense({ now: at(min), events: [{ timestamp: iso(min - 1), duration: 1, data: { app: "Code.exe", title: "a" } }], inputFile: f, tone: TONE,
      signature: m.SIGNATURE, matcher: m.bucketsMatcher({ browsers: [], rules: {} }), afk: null, roll: null,
      registry: { conceptAlias: new Map(), skillAlias: new Map(), loaded: false }, sprint: null, prevEdge: null, prevFocus: null,
      post: async () => true, append: () => {} });
    return readJson(f);
  };
  s.snap = () => readJson(f);
  return s;
};
// the senses fold and the state line over ONE planted presence snapshot (every other sensor planted healthy)
const lineOver = (snap) => {
  const sd = mkdtempSync(join(ROOT, "s-")), reg = join(sd, "registry.json");
  if (!sm) return { facts: null, line: "(senses.mjs is not in this tree)" };
  writeFileSync(reg, JSON.stringify({ version: 1, tables: { mechanisms: [sm.SEED_ROW] } }));
  const put = (f, o) => writeFileSync(join(sd, f), JSON.stringify(o));
  put("pitch_read.json", { tunnel: { state: "clear" }, input: { activitywatch: true } });
  put("timeaudit.json", { dataOk: true, generatedAt: iso(0) });
  put("dmn_input.json", { alive: true });
  put("mirror_manifest.json", { enumeration: { ok: true }, have: 0, need: 0 });
  put("capture_pull.json", { configured: false, alive: null });
  put("throwin_state.json", { wired: false });
  put("presence_input.json", snap);
  const facts = sm.senseFacts({ stateDir: sd, registryPath: reg });
  return { facts, line: st.stateFrom({ cards: { known: true, live: 0 }, senses: facts }, at(600)).line };
};
const r = (s) => (s && s.repair ? `${s.repair.result}${s.repair.why ? ` (${s.repair.why})` : ""}` : "no record");

// ── CLASS ONE ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
if (want("M1", "M2")) {
  const a = seq();
  const s1 = await a.dead(0, REFUSED, null);
  const after = [];
  for (const min of [2, 130, 580, 880]) after.push({ s: await a.dead(min), asks: a.asks.length });
  const s5 = after[3].s;
  const never = seq();
  const nones = [];
  for (const min of [0, 2, 130, 580, 880]) nones.push(await never.dead(min, REFUSED, null));
  if (want("M1")) await guard("M1", () => ({
    ok: !!(s1 && s1.repair && s1.repair.result === "none" && after[0].asks === 1 && s5 && s5.repair && s5.repair.result === "failed" && s5.repair.span === s5.dead_since && s5.dead_since === iso(0)
      && never.asks.length === 0 && nones.every((x) => x && x.repair && x.repair.result === "none" && /no self_repair row/.test(x.repair.why || ""))),
    why: `pass 1 (no row) ${r(s1)} · asks after passes 2..5 [${after.map((x) => x.asks).join(",")}] (want 1 at pass 2) · pass 5 ${r(s5)}, span ${s5 && s5.repair && s5.repair.span === s5.dead_since ? "same" : "other"} · never a row: ${never.asks.length} ask(s), ${nones.filter((x) => x && x.repair && x.repair.result === "none").length}/5 none` }));
  if (want("M2")) {
    const k = seq();
    const f0 = { at: iso(0), input: "activitywatch", alive: false, dead_since: iso(0), last_live_at: null, repair: { span: iso(0), at: iso(0), result: "asking", source: "registry self_repair/activitywatch" } };
    writeFileSync(k.f, JSON.stringify(f0));
    const k1 = await k.dead(1);
    await guard("M2", () => ({
      ok: after.map((x) => x.asks).join(",") === "1,1,1,1" && !!(s5 && s5.repair && s5.repair.at === iso(2)) && k.asks.length === 0 && !!(k1 && k1.repair && k1.repair.result === "asking"),
      why: `asks after passes 2..5 [${after.map((x) => x.asks).join(",")}] (want 1,1,1,1) · pass 5's record at ${s5 && s5.repair ? s5.repair.at : "?"} (want pass 2 ${iso(2)}) · an \`asking\` record: ${k.asks.length} ask(s), carried ${r(k1)}` }));
  }
}
if (want("M4")) {
  const a = seq();
  const s1 = await a.dead(0, REFUSED, { ...ROW, reversible: false });
  const s2 = await a.dead(1);
  await guard("M4", () => ({ ok: !!(s1 && s1.repair && s1.repair.result === "none" && a.asks.length === 1 && s2 && s2.repair && s2.repair.span === s2.dead_since && s2.dead_since === iso(0)),
    why: `pass 1 (row not eligible) ${r(s1)} · pass 2 (eligible, same span) ${r(s2)} · ${a.asks.length} ask(s) (want 1)` }));
}
if (want("M6")) await guard("M6", async () => {
  const p = plant("m6");
  const seedRow = (row) => runNode(p, ["scripts/registry.mjs", "set", "--table", "self_repair", "--json", JSON.stringify(row)]);
  const n0 = childCalls().length;
  const one = runNode(p, ["scripts/presence.mjs", "sense"]);
  const seeded = seedRow(ROW);
  const n1 = childCalls().length;
  const two = runNode(p, ["scripts/presence.mjs", "sense"]);
  const callsTwo = childCalls().slice(n1);
  let senses = "(no senses)";
  if (sm) {
    const ps = await mod(p, "scripts/senses.mjs");
    const sr = runNode(p, ["scripts/registry.mjs", "set", "--table", "mechanisms", "--json", JSON.stringify(ps.SEED_ROW)]);
    const w = sr.code === 0 ? ps.senseFacts({ stateDir: p.sd, registryPath: p.reg }).wounds.find((x) => x.sensor === "presence") : null;
    senses = w ? String(w.evidence) : `no presence wound (seed exit ${sr.code})`;
  }
  const q = plant("m6b");
  const seededB = runNode(q, ["scripts/registry.mjs", "set", "--table", "self_repair", "--json", JSON.stringify(ROW)]);
  const n2 = childCalls().length;
  const three = runNode(q, ["scripts/presence.mjs", "sense"], { MPRES2_LISTING: "1" });
  const callsThree = childCalls().slice(n2);
  const l1 = one.lines.find((l) => /input DEAD/.test(l)) || one.lines.pop() || "", l2 = two.lines.find((l) => /input DEAD/.test(l)) || "", l3 = three.lines.find((l) => /input DEAD/.test(l)) || "";
  const spawnsTwo = callsTwo.filter((c) => c.startsWith("spawn ")), spawnsThree = callsThree.filter((c) => c.startsWith("spawn "));
  return {
    ok: / · repair none \(no self_repair row activitywatch\)/.test(l1) && seeded.code === 0 && / · repair failed \(ENOENT\)/.test(l2) && spawnsTwo.length === 1 && senses === "repair FAILED (ENOENT)"
      && seededB.code === 0 && / · repair beside-running \(/.test(l3) && spawnsThree.length === 0 && callsThree.some((c) => c.startsWith("list ")) && childCalls().slice(n0).every((c) => !c.startsWith("exec")),
    why: `pass 1 …${l1.slice(l1.indexOf("·"), l1.indexOf("→")).trim() || l1.slice(0, 60)} · seed exit ${seeded.code} · pass 2 …${l2.slice(l2.indexOf("·"), l2.indexOf("→")).trim()} (${spawnsTwo.length} spawn) · senses: ${senses} · listing planted 1: …${l3.slice(l3.indexOf("·"), l3.indexOf("→")).trim()} (${spawnsThree.length} spawn, ${callsThree.filter((c) => c.startsWith("list ")).length} listing)`,
  };
});

// ── CLASS TWO ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
if (want("R1", "R2")) {
  const a = seq({ onAsk: (s) => { s.running = true; } });   // the launcher the first ask started is running from then on
  await a.dead(0); await a.dead(1); await a.live(2); const s2 = await a.dead(3); await a.live(4); const s3 = await a.dead(5);
  const g = seq();
  const g1 = await g.dead(0);
  if (want("R1")) await guard("R1", () => ({ ok: a.asks.length === 1 && !!(s2 && s2.repair && s2.repair.result === "beside-running" && s3 && s3.repair && s3.repair.result === "beside-running" && s3.dead_since === iso(5)) && g.asks.length === 1 && !!(g1 && g1.repair && g1.repair.result === "failed"),
    why: `3 dead spans, launcher running after the first ask: ${a.asks.length} ask(s) (want 1) · span 2 ${r(s2)} · span 3 ${r(s3)} · not running: ${g.asks.length} ask, ${r(g1)}` }));
  if (want("R2")) await guard("R2", () => {
    const { facts, line } = lineOver(s3);
    const w = facts ? facts.wounds.find((x) => x.sensor === "presence") : null;
    return { ok: !!(w && w.evidence === "dead beside a running launcher") && / · senses ✗ presence: activitywatch dead since .* · dead beside a running launcher/.test(line),
      why: `evidence ${w ? w.evidence : "(no wound)"} · line tail …${line.slice(-90)}` };
  });
}
if (want("R4")) {
  const out = {};
  for (const [k, fn] of [["abort", ABORT], ["refused", REFUSED], ["no-window-bucket", NO_WINDOW], ["bad-json", BAD_JSON]]) { const s = seq(); out[k] = await s.dead(0, fn); }
  await guard("R4", () => ({ ok: Object.entries(out).every(([k, s]) => s && s.alive === false && s.dead_reason === k),
    why: Object.entries(out).map(([k, s]) => `${k} → ${s ? (s.dead_reason === undefined ? "(no dead_reason)" : s.dead_reason) : "(no snapshot)"}`).join(" · ") }));
}
if (want("R5")) await guard("R5", async () => {
  const p = plant("r5");
  const pr = await mod(p, "scripts/registry.mjs");
  const set = (row) => runNode(p, ["scripts/registry.mjs", "set", "--table", "self_repair", "--json", JSON.stringify(row)]).code;
  const c1 = set(ROW);
  const c2 = runNode(p, ["scripts/registry.mjs", "retire", "--table", "self_repair", "--subject", "activitywatch", "--why", "the held door (planted by ci/mpres2)"]).code;
  const { retired: _r, ...noRetired } = ROW;
  const c3 = set(noRetired);
  const merged = pr.rowOf("self_repair", "activitywatch", p.reg);
  const d1 = await m.launcherDoor({ env: {}, repairRow: merged });
  const c4 = set({ ...ROW, retired: false });
  const live = pr.rowOf("self_repair", "activitywatch", p.reg);
  const d2 = await m.launcherDoor({ env: {}, repairRow: live });
  const a = seq({ running: true });
  const s = await a.dead(0, REFUSED, live);
  return { ok: [c1, c2, c3, c4].every((c) => c === 0) && !!(merged && merged.retired === true) && d1.launcher === null && /no self_repair row/.test(d1.why || "")
      && !!(live && live.retired === false) && d2.launcher === LEAF && a.asks.length === 0 && !!(s && s.repair && s.repair.result === "beside-running"),
    why: `CLI exits ${[c1, c2, c3, c4].join("/")} · a set without retired keeps retired:${merged ? merged.retired : "?"} ⇒ door ${d1.launcher || d1.why} · retired:false ⇒ door ${d2.launcher || d2.why} · beside a running launcher: ${a.asks.length} ask(s), ${r(s)}` };
});
if (want("F8")) {
  const a = seq({ running: true });
  const s1 = await a.dead(0); const s2 = await a.dead(1);
  const listed = a.lists.length;
  a.running = false;
  const s3 = await a.dead(2); const s4 = await a.dead(3);
  await guard("F8", () => ({ ok: !!(s1 && s1.repair && s1.repair.result === "beside-running" && s2 && s2.repair && s2.repair.result === "beside-running") && listed === 2 && a.lists[0] === LEAF
      && a.asks.length === 1 && !!(s3 && s3.repair && s3.repair.result === "failed" && s4 && s4.repair && s4.repair.at === iso(2) && s4.dead_since === iso(0)),
    why: `running: ${r(s1)}, ${r(s2)} (${listed} listing(s), leaf ${a.lists[0] || "-"}) · died: ${r(s3)} · next pass ${r(s4)} · ${a.asks.length} ask(s) (want 1)` }));
}
if (want("F10")) {
  const a = seq({ launchOk: true, launchPid: 424242 });
  const s1 = await a.dead(0);
  const asks1 = a.asks.length, lists1 = a.lists.length;
  await a.live(1);
  a.pidAlive = true;
  const s2 = await a.dead(2);
  const lists2 = a.lists.length;
  await a.live(3);
  a.pidAlive = false; a.running = false;
  const s3 = await a.dead(4);
  await guard("F10", () => ({ ok: asks1 === 1 && !!(s1 && s1.launched && s1.launched.pid === 424242 && s1.launched.leaf === LEAF) && lists2 === lists1 && a.pidChecks.includes(424242)
      && !!(s2 && s2.repair && s2.repair.result === "beside-running") && a.asks.length === 2 && a.lists.length === lists1 + 1 && a.lists[a.lists.length - 1] === LEAF && !!(s3 && s3.repair && s3.repair.result === "asked"),
    why: `the door's spawn recorded pid ${s1 && s1.launched ? s1.launched.pid : "(none)"} · new span, pid alive: ${r(s2)}, listings ${lists1}→${lists2} (want no new one) · pid gone: listings → ${a.lists.length} (want +1, by leaf), ${r(s3)} · ${a.asks.length} ask(s)` }));
}

// ── CLASS THREE ───────────────────────────────────────────────────────────────────────────────────────────────────────────
if (want("S1")) {
  const a = seq({ running: true });
  const b = [await a.dead(0, ABORT), await a.dead(1, ABORT), await a.dead(2, ABORT)];
  const d = seq();
  const d1 = await d.dead(0); const d2 = await d.dead(1);
  await guard("S1", () => ({ ok: b.every((s) => s && s.busy === true && s.dead_since === null && s.busy_since === iso(0)) && a.asks.length === 0
      && !!(d2 && d2.alive === false && !d2.busy && d2.dead_since === iso(0)) && d.asks.length === 1,
    why: `abort ×3 beside a running launcher: ${b.map((s) => (s && s.busy ? "busy" : s && s.alive === false ? `dead(${s.dead_since === iso(0) ? "span" : "?"})` : "?")).join(",")}, ${a.asks.length} ask(s) · refused ×2, none running: ${d2 && d2.alive === false ? "dead" : "?"}, ${d.asks.length} ask(s) (${r(d1)})` }));
}
if (want("S3")) {
  const a = seq({ running: true });
  const s1 = await a.dead(0, NO_WINDOW); const s2 = await a.dead(1, NO_WINDOW);
  const b = seq({ running: true });
  const j = await b.dead(0, BAD_JSON);
  const { facts } = lineOver(s2);
  const w = facts ? facts.wounds.find((x) => x.sensor === "presence") : null;
  await guard("S3", () => ({ ok: !!(s2 && s2.alive === false && s2.dead_reason === "no-window-bucket" && !s2.repair) && a.asks.length === 0 && a.lists.length === 0 && !!(w && w.evidence === "watcher absent")
      && !!(j && j.dead_reason === "bad-json") && b.asks.length === 0 && b.lists.length === 0,
    why: `no window bucket: ${s2 ? `dead_reason ${s2.dead_reason}` : "?"}, ${a.asks.length} ask(s), ${a.lists.length} listing(s), senses ${w ? w.evidence : "(no wound)"} · bad-json: ${j ? j.dead_reason : "?"}, ${b.asks.length} ask(s), ${b.lists.length} listing(s) (${r(s1)})` }));
}
if (want("S4")) {
  const a = seq({ running: true });
  const s1 = await a.dead(0, ABORT); const s2 = await a.dead(1, ABORT); const s3 = await a.live(2);
  await guard("S4", () => ({ ok: [s1, s2].every((s) => s && s.busy === true && s.dead_since === null) && !!(s3 && s3.alive === true && s3.dead_since === null && !s3.busy && !s3.busy_since) && a.asks.length === 0,
    why: `abort, abort: dead_since ${s1 ? s1.dead_since : "?"}, ${s2 ? s2.dead_since : "?"} (want null, null) · then events: alive:${s3 ? s3.alive : "?"} busy_since ${s3 ? s3.busy_since : "?"} · ${a.asks.length} ask(s)` }));
}
if (want("S6")) await guard("S6", async () => {
  const a = seq({ running: true });
  await a.dead(0, ABORT); const s = await a.dead(5, ABORT);
  const { line } = lineOver(s);
  return { ok: / · senses \? presence busy since 20 Nov 21:50 IST$/.test(line) && !/senses ✗/.test(line),
    why: `line tail …${line.slice(-80)}` };
});
if (want("S7")) {
  const a = seq({ running: true });
  const snaps = [];
  for (let h = 0; h < 72; h++) snaps.push(await a.dead(h * 60, ABORT));
  await guard("S7", () => ({ ok: snaps.every((s) => s && s.busy === true && s.dead_since === null && s.busy_since === iso(0)) && a.asks.length === 0,
    why: `${snaps.filter((s) => s && s.busy === true).length}/${snaps.length} hourly abort passes over three days read busy · last ${snaps[71] ? (snaps[71].busy ? `busy since ${snaps[71].busy_since}` : `dead since ${snaps[71].dead_since}`) : "?"} · ${a.asks.length} ask(s)` }));
}
if (want("S8")) {
  const a = seq({ launchOk: true, onAsk: (s) => { s.running = true; } });
  const s1 = await a.dead(0); const s2 = await a.dead(1, ABORT);
  a.running = false;
  const s3 = await a.dead(2);
  await guard("S8", () => ({ ok: !!(s1 && s1.repair && s1.repair.result === "asked" && s2 && s2.busy === true && s2.dead_since === iso(0) && s3 && s3.dead_since === iso(0) && s3.repair && s3.repair.at === iso(0)) && a.asks.length === 1,
    why: `dead ${r(s1)} · busy pass holds dead_since ${s2 ? s2.dead_since : "?"} (busy:${s2 ? !!s2.busy : "?"}) · dead again: span ${s3 ? s3.dead_since : "?"}, ${r(s3)} · ${a.asks.length} ask(s) (want 1)` }));
}

// ── SEAT-TIME: NO-REAL-LIST · NO-TRACK · BOUND · LAST ────────────────────────────────────────────────────────────────────
if (!ONLY) await guard("NO-REAL-LIST", () => ({ ok: refusedCalls.length === 0 && childCalls().every((c) => !/^(execFileSync|exec|execSync) /.test(c)),
  why: `${refusedCalls.length} refused call(s) in this process${refusedCalls.length ? ` (${refusedCalls.slice(0, 3).join("; ")})` : ""} · CLI children: ${childCalls().filter((c) => c.startsWith("list ")).length} planted listing(s), ${childCalls().filter((c) => c.startsWith("spawn ")).length} planted spawn(s), every one answered by the plant` }));
const walk = (root, dir = "", o = new Map()) => {
  for (const e of readdirSync(join(root, dir), { withFileTypes: true })) {
    const rel = dir ? `${dir}/${e.name}` : e.name;
    if (!dir && (e.name === "node_modules" || e.name === ".git")) continue;
    if (e.isDirectory()) walk(root, rel, o);
    else if (e.isFile()) { const b = readFileSync(join(root, rel)); const t = b.includes(0) ? b : Buffer.from(b.toString("utf8").replace(/\r\n/g, "\n")); o.set(rel, createHash("sha256").update(t).digest("hex")); }
  }
  return o;
};
if (!ONLY) await guard("BOUND", () => {
  if (!BASE_ORG) return { ok: false, why: "no --base-org: the bound cannot be measured" };
  const a = walk(BASE_ORG), b = walk(ORG);
  const diff = [...new Set([...a.keys(), ...b.keys()])].filter((k) => a.get(k) !== b.get(k)).sort();
  const extra = diff.filter((f) => !NAMED.includes(f) && !NAMED_DIRS.some((d) => f.startsWith(d)));
  return { ok: extra.length === 0, why: `${diff.length} file(s) differ (${diff.slice(0, 8).join(", ")})${extra.length ? ` · BEYOND THE NAMED: ${extra.slice(0, 12).join(", ")}${extra.length > 12 ? ` (+${extra.length - 12})` : ""}` : ""}` };
});
try { rmSync(ROOT, { recursive: true, force: true }); } catch { /* a survivor holds a file: LAST names it */ }
for (const [k, v] of Object.entries(REAL)) cp[k] = v;
syncBuiltinESMExports();
if (!ONLY) await guard("NO-TRACK", () => {
  const now = { cwd: gitStatus(process.cwd()), org: gitStatus(ORG) };
  return { ok: now.cwd === TRACK0.cwd && now.org === TRACK0.org,
    why: `git status --porcelain: cwd ${TRACK0.cwd === null ? "not a work tree" : now.cwd === TRACK0.cwd ? "unchanged" : "MOVED"} · --org ${TRACK0.org === null ? "not a work tree" : now.org === TRACK0.org ? "unchanged" : "MOVED"}` };
});
await guard("LAST", () => {
  let table = "";
  try {
    table = process.platform === "win32"
      ? cp.execFileSync("powershell.exe", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | ForEach-Object { $_.CommandLine }"], { encoding: "utf8", windowsHide: true })
      : cp.execFileSync("ps", ["-eo", "args"], { encoding: "utf8" });
  } catch (e) { return { ok: false, why: `process table unreadable: ${e.message}` }; }
  const left = table.split(/\r?\n/).filter((l) => l.includes(ROOT) && !/\bps -eo\b/.test(l));
  return { ok: left.length === 0, why: `${left.length} survivor(s)` };
});
const red = results.filter((x) => !x.ok).map((x) => x.id);
if (red.length) { console.log(`RED ${UNIT} · ${red.join(", ")}`); process.exit(1); }
console.log(`GREEN ${UNIT} the repair door asks once per span, never beside a running launcher, and reads busy, not dead, while the port is held · ${results.length} clause(s)`);
process.exit(0);
