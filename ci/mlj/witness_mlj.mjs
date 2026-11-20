#!/usr/bin/env node
// ============================================================================
// ci/mlj/witness_mlj.mjs — WITNESS of unit mlj (THE JUDGE-HELD REFUSAL: scripts/land.mjs reads keeper.mjs judgeHeld)
// ----------------------------------------------------------------------------
// CONTRACT (forks row 1040 (2) F1 · row 1043 (2) F1 · F4; spec ci/mlv0/PROOF.md FORK 1 on branch claude/mlv0-build):
//   node ci/mlj/witness_mlj.mjs --org <build tree> --base-org <base tree> [--only <clause,…>]
// Real git on copies under os.tmpdir(), every repo made with core.autocrlf=false at init/clone (row 1036): a bare origin,
// a "seat" clone that pushes land/<unit>, a "laptop" clone (HIS tree, main checked out) that runs `node scripts/land.mjs`.
// The tree under judgement gives scripts/land.mjs and scripts/keeper.mjs; every other organ the verb calls is a PLANTED
// stub (ci_verdict GREEN, sitting CLOSED, the archivist's tripwire passes, captains_call records its argv).
// THE PORT CLASS (row 1053): this witness binds NO fixed port and names no live service. The judge round is a planted
// HOLDER process that binds an OS-picked port through keeper's own holdJudgePort; that port reaches every reader only
// through keeper's env door ARSENAL_JUDGE_PORT. The holder lives until its stop file appears under the temp dir or this
// witness is gone, checked once per measured node start (the slack is a node start measured in this run, never typed);
// every wait here is bounded by how long this run has already lasted.
//   J1 HELD     a judge round holds the port → REFUSED JUDGE-HELD, his main and origin unmoved · the round closes → the
//               SAME branch lands (the refusal is a wait that clears itself)
//   J2 DRY      held → `--dry` REFUSED JUDGE-HELD, never DRY · free → DRY
//   J3 COUNT    a landing, then a JUDGE-HELD refusal → `count` still 1 of N, and the refusal's ledger row is human:false
//               (row 1043 (2) F4: the list of stops that reset the count is unchanged)
//   J4 LAST     a round that opens WHILE the verb runs its checks (the planted sitting starts it) → REFUSED JUDGE-HELD:
//               the judge is read last, right before the move · a sitting that opens nothing → lands
//   J5 KEEPER   the predicate IS keeper's export: a keeper.mjs whose judgeHeld answers held (no port bound at all) →
//               REFUSED JUDGE-HELD · a keeper with no judgeHeld → REFUSED JUDGE-UNREADABLE (fail closed) while `count`
//               still answers (keeper is read at the gate, not at load) · the tree's own keeper, nothing held → lands
//   K1 DOOR     keeper's JUDGE_PORT reads ARSENAL_JUDGE_PORT ONLY for a keeper.mjs under the OS temp dir (row 1053 (1),
//               row 1064): under it, a planted port → that port · a non-port → 4118 · unset → 4118; the SAME bytes
//               OUTSIDE the temp dir with a planted port → 4118
// Each clause runs on --base-org (must be RED) and on --org (must be GREEN). BOUND: only scripts/land.mjs,
// scripts/keeper.mjs and ci/mlj/ differ (text, CRLF folded to LF). LAST: no node process naming the temp dir survives.
// LAST LINE: GREEN MLJ the judge-held refusal · <n> clause(s)  (exit 0)  ·  RED MLJ · <clauses>  (exit 1)
// ============================================================================
import { spawnSync } from "node:child_process";
import { pathToFileURL, fileURLToPath } from "node:url";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, statSync, rmSync, existsSync, realpathSync } from "node:fs";
import { join, relative, sep, isAbsolute } from "node:path";
import { createServer } from "node:net";
import { createHash } from "node:crypto";
import os from "node:os";

const arg = (k) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : null; };
const ORG = arg("--org"), BASE = arg("--base-org");
if (!ORG || !BASE) { console.log("RED MLJ · usage: --org <dir> --base-org <dir>"); process.exit(1); }
const NAMED = ["scripts/land.mjs", "scripts/keeper.mjs"], NAMED_DIRS = ["ci/mlj/"];
const ROOT = mkdtempSync(join(os.tmpdir(), "witness-mlj-"));
const T0 = Date.now();
let seq = 0;

// the slack unit: ONE node start, measured in this run
const NODE_START_MS = (() => { const a = Date.now(); spawnSync(process.execPath, ["-e", "0"], { windowsHide: true }); return Math.max(1, Date.now() - a); })();
const bound = () => Math.max(NODE_START_MS, Date.now() - T0);          // a wait never outlasts what the run has already spent

function git(cwd, args, ok = true) {
  const r = spawnSync("git", args, { cwd, encoding: "utf8", windowsHide: true });
  if (ok && r.status !== 0) throw new Error(`git ${args.join(" ")} → ${r.stderr}`);
  return { status: r.status, out: (r.stdout || "").trim() };
}
const cfg = (cwd) => { for (const [k, v] of [["user.name", "witness"], ["user.email", "witness@example.invalid"], ["core.autocrlf", "false"], ["commit.gpgsign", "false"]]) git(cwd, ["config", k, v]); };
const put = (dir, rel, text) => { const p = join(dir, ...rel.split("/")); mkdirSync(join(p, ".."), { recursive: true }); writeFileSync(p, text); };
const src = (tree, rel) => { try { return readFileSync(join(tree, ...rel.split("/")), "utf8"); } catch { return null; } };

// THE HOLDER — a planted judge round: keeper's own holdJudgePort on the planted port, alive until its stop file or the witness goes
const HOLDER = `import { existsSync } from "node:fs";
import { pathToFileURL } from "node:url";
const [keeper, port, stopFile, pid, every] = process.argv.slice(2);
const { holdJudgePort } = await import(pathToFileURL(keeper).href);
const s = await holdJudgePort(Number(port));
console.log(s ? "HELD " + s.address().port : "HOLD-FAILED");
if (!s) process.exit(1);
const alive = () => { try { process.kill(Number(pid), 0); return true; } catch { return false; } };
setInterval(() => { if (existsSync(stopFile) || !alive()) process.exit(0); }, Number(every));
`;
// THE STARTER — spawns a holder detached, returns once it has printed its first line (event-bound: its line or its exit)
const STARTER = `import { spawn } from "node:child_process";
const [holder, ...rest] = process.argv.slice(2);
const c = spawn(process.execPath, [holder, ...rest], { detached: true, stdio: ["ignore", "pipe", "ignore"], windowsHide: true });
let buf = "";
const done = (line) => { console.log(line); try { c.stdout.destroy(); } catch {} c.unref(); process.exit(line.startsWith("HELD") ? 0 : 1); };
c.stdout.on("data", (d) => { buf += d; const i = buf.search(/\\r?\\n/); if (i > -1) done(buf.slice(0, i)); });
c.once("exit", () => done(buf.trim() || "HOLD-FAILED"));
`;
const REC = `import { appendFileSync } from "node:fs";\nappendFileSync(process.env.MLJ_LOG, JSON.stringify(process.argv.slice(1)) + "\\n");\n`;
const VERDICT = `console.log("ci_verdict " + String(process.argv[2]).slice(0, 7) + " GREEN — planted [run 111]");\n`;
// the planted sitting: CLOSED; with MLJ_OPEN_ROUND set it first STARTS a judge round (J4), then answers CLOSED
const SITTING = `import { spawnSync } from "node:child_process";
if (process.env.MLJ_OPEN_ROUND) { const a = JSON.parse(process.env.MLJ_OPEN_ROUND); spawnSync(process.execPath, a, { stdio: "ignore", windowsHide: true }); }
console.log("sitting: daemon DOWN on :1 · file says no open sitting");
`;
const ARCHIVIST = `console.log("tripwire: nothing that may not be published.");\n`;

/** an OS-picked free port (bound to 0, read, released) — never a fixed one */
const pickPort = () => new Promise((res, rej) => { const s = createServer(); s.once("error", rej); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => res(p)); }); });
const portFree = (port) => new Promise((res) => { const s = createServer(); s.once("error", () => res(false)); s.listen(port, "127.0.0.1", () => s.close(() => res(true))); });
const nap = (ms) => new Promise((r) => setTimeout(r, ms));

function sandbox(tree, { keeper = null } = {}) {
  const dir = join(ROOT, `s${++seq}`);
  const origin = join(dir, "origin.git"), seed = join(dir, "seed"), laptop = join(dir, "laptop"), seat = join(dir, "seat");
  mkdirSync(seed, { recursive: true });
  git(dir, ["-c", "core.autocrlf=false", "init", "-q", "--bare", "-b", "main", origin]);
  git(seed, ["-c", "core.autocrlf=false", "init", "-q", "-b", "main"]); cfg(seed);
  for (const f of ["scripts/land.mjs", "scripts/keeper.mjs"]) { const t = src(tree, f); if (t != null) put(seed, f, t); }
  if (keeper != null) put(seed, "scripts/keeper.mjs", keeper);
  put(seed, "scripts/ci_verdict.mjs", VERDICT); put(seed, "scripts/sitting.mjs", SITTING);
  put(seed, "scripts/archivist.mjs", ARCHIVIST); put(seed, "scripts/captains_call.mjs", REC);
  put(seed, "README.md", "seed\n"); put(seed, "notes/x.txt", "x0\n");
  git(seed, ["add", "-A"]); git(seed, ["commit", "-q", "-m", "seed"]);
  git(seed, ["remote", "add", "origin", origin]); git(seed, ["push", "-q", "origin", "main"]);
  for (const c of [laptop, seat]) { git(dir, ["clone", "-q", "-c", "core.autocrlf=false", origin, c]); cfg(c); }
  put(dir, "holder.mjs", HOLDER); put(dir, "starter.mjs", STARTER);
  const log = join(dir, "calls.log");
  const land = (args, port, x = {}) => {
    const env = { ...process.env, MLJ_LOG: log, ARSENAL_JUDGE_PORT: String(port), ...x };
    const r = spawnSync(process.execPath, [join(laptop, "scripts", "land.mjs"), ...args], { cwd: laptop, encoding: "utf8", windowsHide: true, env });
    const o = ((r.stdout || "") + (r.stderr || "")).trim(); return { code: r.status, out: o, last: o.split(/\r?\n/).pop() || "" };
  };
  const branch = (unit, files) => {
    git(seat, ["fetch", "-q", "origin", "main"]); git(seat, ["checkout", "-q", "-B", `land/${unit}`, "origin/main"]);
    for (const [p, t] of Object.entries(files)) put(seat, p, t);
    git(seat, ["add", "-A"]); git(seat, ["commit", "-q", "-m", `unit ${unit}`]);
    git(seat, ["push", "-q", "-f", "origin", `land/${unit}`]);
    return git(seat, ["rev-parse", "HEAD"]).out;
  };
  // the argv that starts a judge round on `port` (the holder runs the SANDBOX's keeper, i.e. the tree's)
  const roundArgv = (port, tag) => [join(dir, "starter.mjs"), join(dir, "holder.mjs"), join(laptop, "scripts", "keeper.mjs"), String(port), join(dir, `stop-${tag}`), String(process.pid), String(NODE_START_MS)];
  const openRound = (port, tag) => { const r = spawnSync(process.execPath, roundArgv(port, tag), { encoding: "utf8", windowsHide: true }); return /^HELD /.test((r.stdout || "").trim()); };
  const closeRound = async (port, tag) => {
    put(dir, `stop-${tag}`, "stop\n");
    const until = Date.now() + bound();
    while (Date.now() < until) { if (await portFree(port)) return true; await nap(NODE_START_MS); }
    return portFree(port);
  };
  const main = () => git(laptop, ["rev-parse", "main"]).out, originMain = () => git(origin, ["rev-parse", "main"]).out;
  const ledger = () => { const p = join(laptop, ".git", "land_ledger.jsonl"); return existsSync(p) ? readFileSync(p, "utf8").split(/\r?\n/).filter(Boolean).map((l) => JSON.parse(l)) : []; };
  return { dir, land, branch, roundArgv, openRound, closeRound, main, originMain, ledger };
}
const landed = (s, r, T) => r.code === 0 && /^LANDED /.test(r.last) && s.main() === T && s.originMain() === T;

const CLAUSES = {
  async J1(tree) {
    const s = sandbox(tree), port = await pickPort(); const m0 = s.main(); const T = s.branch("x", { "notes/x.txt": "x1\n" });
    if (!s.openRound(port, "j1")) return { ok: false, why: "the planted round could not hold its port" };
    const r = s.land(["x"], port);
    const red = r.code === 1 && /^REFUSED JUDGE-HELD · x \w+/.test(r.last) && s.main() === m0 && s.originMain() === m0;
    const freed = await s.closeRound(port, "j1");
    const g = s.land(["x"], port);
    return { ok: red && freed && landed(s, g, T), why: `held refuses ${red} · round closed ${freed} · then lands ${landed(s, g, T)} (${r.last.slice(0, 70)})` };
  },
  async J2(tree) {
    const s = sandbox(tree), port = await pickPort(); const m0 = s.main(); s.branch("x", { "notes/x.txt": "x1\n" });
    if (!s.openRound(port, "j2")) return { ok: false, why: "the planted round could not hold its port" };
    const r = s.land(["x", "--dry"], port);
    const red = r.code === 1 && /^REFUSED JUDGE-HELD/.test(r.last) && !/^DRY /m.test(r.out) && s.main() === m0;
    const freed = await s.closeRound(port, "j2");
    const g = s.land(["x", "--dry"], port);
    const green = g.code === 0 && /^DRY x /.test(g.last) && s.main() === m0;
    return { ok: red && freed && green, why: `dry held refuses ${red} · dry free ${green} (${r.last.slice(0, 70)})` };
  },
  async J3(tree) {
    const s = sandbox(tree), port = await pickPort(); const T1 = s.branch("y", { "README.md": "y1\n" });
    const first = landed(s, s.land(["y"], port), T1);
    s.branch("x", { "notes/x.txt": "x1\n" });
    if (!s.openRound(port, "j3")) return { ok: false, why: "the planted round could not hold its port" };
    const r = s.land(["x"], port);
    const c = s.land(["count"], port);
    await s.closeRound(port, "j3");
    const row = s.ledger().find((x) => x.name === "JUDGE-HELD");
    const ok = first && /^REFUSED JUDGE-HELD/.test(r.last) && /^unattended 1 of \d+ /.test(c.last) && !!row && row.human === false;
    return { ok, why: `first lands ${first} · held refuses ${/^REFUSED JUDGE-HELD/.test(r.last)} · ${c.last.slice(0, 40)} · row human ${row ? row.human : "absent"}` };
  },
  async J4(tree) {
    const s = sandbox(tree), port = await pickPort(); const m0 = s.main(); s.branch("x", { "notes/x.txt": "x1\n" });
    const r = s.land(["x"], port, { MLJ_OPEN_ROUND: JSON.stringify(s.roundArgv(port, "j4")) });   // the round opens at step 7
    const red = r.code === 1 && /^REFUSED JUDGE-HELD/.test(r.last) && s.main() === m0;
    const freed = await s.closeRound(port, "j4");
    const g = sandbox(tree), gp = await pickPort(); const T = g.branch("x", { "notes/x.txt": "x1\n" });
    const ok = landed(g, g.land(["x"], gp), T);
    return { ok: red && freed && ok, why: `a round opened mid-checks refuses ${red} · no round lands ${ok} (${r.last.slice(0, 70)})` };
  },
  async J5(tree) {
    const port = await pickPort();
    const s = sandbox(tree, { keeper: "export const JUDGE_PORT = 1;\nexport const judgeHeld = async () => true;\nexport const holdJudgePort = async () => null;\n" });
    const m0 = s.main(); s.branch("x", { "notes/x.txt": "x1\n" });
    const r = s.land(["x"], port);
    const red = r.code === 1 && /^REFUSED JUDGE-HELD/.test(r.last) && s.main() === m0;
    const u = sandbox(tree, { keeper: "export const keep = () => 0;\n" });   // a keeper that cannot answer (mland's stub shape)
    const mu = u.main(); u.branch("x", { "notes/x.txt": "x1\n" });
    const ru = u.land(["x"], port);
    const closed = ru.code === 1 && /^REFUSED JUDGE-UNREADABLE/.test(ru.last) && u.main() === mu && /^unattended 0 of /.test(u.land(["count"], port).last);
    const g = sandbox(tree); const T = g.branch("x", { "notes/x.txt": "x1\n" });
    const ok = landed(g, g.land(["x"], port), T);
    return { ok: red && closed && ok, why: `keeper's judgeHeld says held → refuses ${red} · no judgeHeld → fail closed, count still answers ${closed} · the tree's keeper, free → lands ${ok} (${r.last.slice(0, 70)})` };
  },
  async K1(tree) {
    const k = join(tree, "scripts", "keeper.mjs"); if (!existsSync(k)) return { ok: false, why: "no keeper.mjs" };
    const body = readFileSync(k);
    // INSIDE: the tree's keeper copied under the OS temp dir (a planted tree) · OUTSIDE: the same bytes in a dir that is NOT
    //   under it (his home, else this witness's own repo), removed again before the clause returns
    const tmpReal = realpathSync(os.tmpdir()), fold = (x) => (process.platform === "win32" ? x.toLowerCase() : x);
    const underTmp = (d) => { const r = relative(fold(tmpReal), fold(realpathSync(d))); return !!r && !r.startsWith("..") && !isAbsolute(r); };
    const inDir = join(ROOT, `k1-${++seq}`); mkdirSync(inDir, { recursive: true }); writeFileSync(join(inDir, "keeper.mjs"), body);
    const here = join(fileURLToPath(new URL(".", import.meta.url)), "..", "..");
    const home = [os.homedir(), here].find((d) => { try { return existsSync(d) && !underTmp(d); } catch { return false; } });
    if (!home) return { ok: false, why: "no directory outside the temp dir to plant the OUTSIDE case in (named, not guessed)" };
    const outDir = mkdtempSync(join(home, ".mlj-k1-"));
    try {
      writeFileSync(join(outDir, "keeper.mjs"), body);
      const port = await pickPort();
      const read = (dir, v) => { const env = { ...process.env }; if (v == null) delete env.ARSENAL_JUDGE_PORT; else env.ARSENAL_JUDGE_PORT = v;
        const r = spawnSync(process.execPath, ["--input-type=module", "-e", `const m = await import(${JSON.stringify(pathToFileURL(join(dir, "keeper.mjs")).href)}); console.log(m.JUDGE_PORT);`], { encoding: "utf8", windowsHide: true, env });
        return (r.stdout || "").trim(); };
      const a = read(inDir, String(port)), b = read(inDir, "not-a-port"), c = read(inDir, null), d = read(outDir, String(port));
      return { ok: a === String(port) && b === "4118" && c === "4118" && d === "4118",
        why: `under tmp: door ${a} (planted ${port}) · non-port ${b} · unset ${c} · outside tmp, planted ${port}: ${d}` };
    } finally { rmSync(outDir, { recursive: true, force: true }); }
  },
};

function files(dir) {
  const out = new Map();
  const walk = (d) => { for (const n of readdirSync(d)) { if (n === ".git" || n === "node_modules") continue; const p = join(d, n); if (statSync(p).isDirectory()) walk(p); else out.set(relative(dir, p).split(sep).join("/"), createHash("sha256").update(readFileSync(p, "latin1").replace(/\r\n/g, "\n")).digest("hex")); } };
  walk(dir); return out;
}
function boundClause() {
  // the base copy may hold a subset of the tree (scripts/ is enough for this unit): BOUND compares scripts/ and ci/mlj/
  const scope = (m) => new Map([...m].filter(([k]) => k.startsWith("scripts/") || k.startsWith("ci/mlj/") || k.startsWith("setup/")));
  const a = scope(files(BASE)), b = scope(files(ORG)), diff = [];
  // a gitignored file (a *.log an organ wrote at run time) is no landing path: the witness's OWN repo's .gitignore says so
  const here = join(fileURLToPath(new URL(".", import.meta.url)), "..", "..");
  const all = [...new Set([...a.keys(), ...b.keys()])];
  const ig = spawnSync("git", ["-C", here, "check-ignore", "--no-index", "--stdin"], { input: all.join("\n") + "\n", encoding: "utf8", windowsHide: true });
  const ignored = new Set(String(ig.stdout || "").split(/\r?\n/).filter(Boolean));
  for (const k of ignored) { a.delete(k); b.delete(k); }
  for (const k of new Set([...a.keys(), ...b.keys()])) if (a.get(k) !== b.get(k)) diff.push(k);
  const off = diff.filter((p) => !NAMED.includes(p) && !NAMED_DIRS.some((d) => p.startsWith(d)));
  return { ok: off.length === 0 && diff.includes("scripts/land.mjs"), why: off.length ? `off-bound: ${off.slice(0, 5).join(", ")}` : `${diff.length} differing path(s) under scripts/, setup/, ci/mlj/, all named` };
}
function survivors() {
  if (process.platform === "win32") {
    const r = spawnSync("powershell", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | ForEach-Object { \"$($_.ProcessId) $($_.CommandLine)\" }"], { encoding: "utf8", windowsHide: true });
    return String(r.stdout || "").split(/\r?\n/).filter((l) => l.includes(ROOT) && !l.includes("witness_mlj")).map((l) => Number(l.split(" ")[0])).filter(Boolean);
  }
  const out = [];
  for (const p of existsSync("/proc") ? readdirSync("/proc") : []) {
    if (!/^\d+$/.test(p) || Number(p) === process.pid) continue;
    try { if (readFileSync(`/proc/${p}/cmdline`, "utf8").replace(/\0/g, " ").includes(ROOT)) out.push(Number(p)); } catch {}
  }
  return out;
}

const only = arg("--only");
const red = [];
try {
  for (const [name, fn] of Object.entries(CLAUSES)) {
    if (only && !only.split(",").includes(name)) continue;
    let onBase, onBuild;
    try { onBase = await fn(BASE); } catch (e) { onBase = { ok: false, why: "threw: " + String(e.message).split("\n")[0] }; }
    try { onBuild = await fn(ORG); } catch (e) { onBuild = { ok: false, why: "threw: " + String(e.message).split("\n")[0] }; }
    const pass = !onBase.ok && onBuild.ok;
    console.log(`  ${pass ? "✓" : "✗"} ${name} · base ${onBase.ok ? "GREEN (does not discriminate)" : "RED"} · build ${onBuild.ok ? "GREEN" : "RED"} — ${onBuild.why}`);
    if (!pass) red.push(name);
  }
  if (!only) { let b; try { b = boundClause(); } catch (e) { b = { ok: false, why: "threw: " + String(e.message).split("\n")[0] }; } console.log(`  ${b.ok ? "✓" : "✗"} BOUND · ${b.why}`); if (!b.ok) red.push("BOUND"); }
} finally {
  // every planted round is told to stop; a holder that outlives its stop file is the LAST clause's red, then killed
  for (const d of existsSync(ROOT) ? readdirSync(ROOT) : []) { for (const t of ["j1", "j2", "j3", "j4"]) { try { writeFileSync(join(ROOT, d, `stop-${t}`), "stop\n"); } catch {} } }
  const until = Date.now() + bound();
  let left = survivors();
  while (left.length && Date.now() < until) { await nap(NODE_START_MS); left = survivors(); }
  console.log(`  ${left.length === 0 ? "✓" : "✗"} LAST · ${left.length} node process(es) naming the temp dir survive`);
  if (left.length) { red.push("LAST"); for (const p of left) { try { process.kill(p); } catch {} } }
  try { rmSync(ROOT, { recursive: true, force: true }); } catch {}
}
const total = (only ? only.split(",").length : Object.keys(CLAUSES).length + 1) + 1;
console.log(red.length ? `RED MLJ · ${red.join(", ")}` : `GREEN MLJ the judge-held refusal · ${total} clause(s)`);
process.exit(red.length ? 1 : 0);
