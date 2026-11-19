#!/usr/bin/env node
// ============================================================================
// ci/mlaw/run_mutants_mlaw.mjs — unit mlaw (forks rows 1137 (1)-(3)): ONE mutant per clause of ci/mlaw/witness_mlaw.mjs (RISE has
// two: the rise unseen, and a fall made red). Each mutant is a copy of the build tree (--org) under os.tmpdir() with ONE edit; the
// witness runs on it against --base-org and must go RED BY THE CLAUSE THAT NAMES IT. The control (the same copy, no edit) must
// read GREEN.
// USAGE: node ci/mlaw/run_mutants_mlaw.mjs --org <build tree> --base-org <BASE tree>
//   M-LEGS     ci_verdict.mjs's REQUIRED_LEGS typed back as the two literal leg names                         → LEGS
//   M-JUGAD    one literal subject list appended to scripts/usage_tap.mjs (a named file: BOUND stays GREEN)   → JUGAD
//   M-SURFACES done.mjs's SURFACES typed back as a literal pair (the row unread)                              → SURFACES
//   M-LAWHOME  usage_tap.mjs's LAW_HOME typed back as two path segments                                      → JUGAD
//   M-HERMETIC lawpack put back into organism_test.mjs's LIVE_MODES                                           → HERMETIC
//   M-RISE     ci_verdict.mjs judge() no longer reads the law pack line (names only, as at BASE)             → RISE
//   M-FALL     lawpackRises reds on head !== base (a FALL turns red)                                         → RISE
//   M-NOLINE   a base with no law pack line judges nothing (BASELINE never read)                             → NOLINE
//   M-PORT     conductor's closed-port probe back on the fixed port of BASE                                  → PORT
//   M-BOUND    a comment line appended to scripts/state.mjs, a file outside the named five                   → BOUND
//   M-LAST     conductor's selftest leaves a detached node process naming its tree behind                    → LAST
// Every edit is a string replace that must hit exactly once (a miss is a RED of the runner, never a silent no-op). The copy takes
// the TRACKED files when --org is a git tree (git ls-files), else every file but .git / node_modules; node_modules is linked.
// After each witness run the runner ends any node process naming the M-LAST marker (bounded: one listing, one kill each).
// LAST LINE: run_mutants: k of n mutant(s) RED by the clause that names them · control GREEN|RED   (exit 0 iff k = n and GREEN)
// ============================================================================
import { cpSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync, existsSync, rmSync, readdirSync, symlinkSync } from "node:fs";
import { join, resolve, relative, sep, dirname } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? resolve(process.argv[i + 1]) : null; };
const ORG = arg("--org"), BASE_ORG = arg("--base-org");
if (!ORG || !BASE_ORG) { console.log("run_mutants: USAGE --org <build tree> --base-org <BASE tree> · control RED"); process.exit(1); }
const ROOT = mkdtempSync(join(tmpdir(), "mlaw-mut-"));
const MARK = "mlaw-mutant-last";
const slash = (p) => p.split(sep).join("/");

function tracked(root) {
  if (existsSync(join(root, ".git"))) {
    const g = spawnSync("git", ["-C", root, "ls-files", "-z"], { encoding: "utf8", maxBuffer: 1 << 28, windowsHide: true });
    if (g.status === 0) return String(g.stdout).split("\0").filter(Boolean);
  }
  const out = [];
  const walk = (d) => { for (const e of readdirSync(d, { withFileTypes: true })) { const p = join(d, e.name), rel = slash(relative(root, p)); if ([".git", "node_modules"].includes(rel.split("/")[0])) continue; if (e.isDirectory()) walk(p); else if (e.isFile()) out.push(rel); } };
  walk(root);
  return out;
}
const FILES = tracked(ORG);
let seq = 0;
function copy(tag) {
  const dst = join(ROOT, `${tag}-${++seq}`);
  for (const rel of FILES) { const from = join(ORG, rel); if (!existsSync(from)) continue; mkdirSync(dirname(join(dst, rel)), { recursive: true }); cpSync(from, join(dst, rel)); }
  if (existsSync(join(ORG, "node_modules"))) symlinkSync(join(ORG, "node_modules"), join(dst, "node_modules"), "junction");
  return dst;
}
/** replace `a` by `b` in <tree>/<rel>, exactly once */
function edit(tree, rel, a, b) {
  const f = join(tree, rel);
  const t = readFileSync(f, "utf8").replace(/\r\n/g, "\n");
  const n = t.split(a).length - 1;
  if (n !== 1) throw new Error(`${rel}: the mutant's anchor hit ${n} time(s), not once`);
  writeFileSync(f, t.replace(a, () => b));
}
const append = (tree, rel, text) => { const f = join(tree, rel); writeFileSync(f, readFileSync(f, "utf8") + text); };
/** end every process naming the M-LAST marker (one listing; never a process this runner did not plant) */
function sweep() {
  const r = process.platform === "win32"
    ? spawnSync("powershell", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | ForEach-Object { \"$($_.ProcessId) $($_.CommandLine)\" }"], { encoding: "utf8", windowsHide: true })
    : spawnSync("ps", ["-eo", "pid,args"], { encoding: "utf8" });
  for (const l of String(r.stdout || "").split(/\r?\n/)) {
    if (!l.includes(MARK) || /\b(ps|powershell)\b/.test(l)) continue;
    const pid = Number(l.trim().split(/\s+/)[0]);
    if (pid && pid !== process.pid) { try { process.kill(pid); } catch { /* already gone */ } }
  }
}
const witness = (tree) => {
  const r = spawnSync(process.execPath, [join(HERE, "witness_mlaw.mjs"), "--org", tree, "--base-org", BASE_ORG], { encoding: "utf8", windowsHide: true, maxBuffer: 1 << 28 });
  sweep();
  const last = String(r.stdout || "").split(/\r?\n/).map((s) => s.trim()).filter(Boolean).pop() || "";
  return { code: r.status, last };
};

const CIV = "scripts/ci_verdict.mjs", OT = "scripts/organism_test.mjs", COND = "scripts/conductor.mjs";
const MUTANTS = [
  { id: "M-LEGS", clause: "LEGS", apply: (t) => edit(t, CIV, `export const REQUIRED_LEGS = Object.freeze(legsOf((() => { try { return readFileSync(SUITE_YML, "utf8"); } catch { return ""; } })()));`,
    `export const REQUIRED_LEGS = ["npm test · node 22", "npm test · node 24"];`) },
  { id: "M-JUGAD", clause: "JUGAD", apply: (t) => append(t, "scripts/usage_tap.mjs", `\nconst MLAW_MUTANT_LIST = ["alpha", "beta"];\nexport { MLAW_MUTANT_LIST };\n`) },
  { id: "M-SURFACES", clause: "SURFACES", apply: (t) => edit(t, "scripts/done.mjs", `const SURFACES = lazySubjects(SURFACES_ROW);`, `const SURFACES = ["manager.mjs", "captains_call.mjs"];`) },
  { id: "M-LAWHOME", clause: "JUGAD", apply: (t) => { edit(t, "scripts/usage_tap.mjs", `const LAW_HOME = "tools/model_law.mjs";`, `const LAW_HOME = ["tools", "model_law.mjs"];`); edit(t, "scripts/usage_tap.mjs", "join(root, LAW_HOME)", "join(root, ...LAW_HOME)"); } },
  { id: "M-HERMETIC", clause: "HERMETIC", apply: (t) => edit(t, OT, `  // lawpack LEFT this table at unit mlaw (forks row 1137 (2) F2 A) — see LIVE_SELFTESTS: the mode rides the hermetic profile.\n`,
    `  lawpack: "walks the whole tree, dressing-room/state included",\n`) },
  { id: "M-RISE", clause: "RISE", apply: (t) => edit(t, CIV, `  fresh.push(...lawpackRises(head.lawpack, base.lawpack, baseline));\n`, "") },
  { id: "M-FALL", clause: "RISE", apply: (t) => edit(t, CIV, `    if (h > b) out.push(`, `    if (h !== b) out.push(`) },
  { id: "M-NOLINE", clause: "NOLINE", apply: (t) => edit(t, CIV, `  if (!baseLp && !baseline) return [`, `  if (!baseLp) return [];\n  if (!baseLp && !baseline) return [`) },
  { id: "M-PORT", clause: "PORT", apply: (t) => edit(t, COND, `Number(closedPort) > 0 && (await portOpen(Number(closedPort), 200)) === false`, `(await portOpen(59999, 200)) === false`) },
  { id: "M-BOUND", clause: "BOUND", apply: (t) => append(t, "scripts/state.mjs", "\n// unit mlaw mutant M-BOUND: a line outside the named files\n") },
  { id: "M-LAST", clause: "LAST", apply: (t) => edit(t, COND, `      const closedPort = await new Promise(`,
    `      spawn(process.execPath, ["-e", "setInterval(() => {}, 1 << 30)", process.cwd(), "${MARK}"], { detached: true, stdio: "ignore", windowsHide: true }).unref();\n      const closedPort = await new Promise(`) },
];

let k = 0, control = null;
try {
  const c = witness(copy("control"));
  control = c.code === 0 && /^GREEN MLAW /.test(c.last);
  console.log(`  control · ${c.last} (exit ${c.code})`);
  for (const m of MUTANTS) {
    let r;
    try { const t = copy(m.id); m.apply(t); r = witness(t); }
    catch (e) { console.log(`  ${m.id} · NOT BUILT: ${String((e && e.message) || e).slice(0, 160)}`); continue; }
    const reds = /^RED MLAW · (.*)$/.exec(r.last);
    const ok = r.code === 1 && !!reds && reds[1].split(" · ").includes(m.clause);
    if (ok) k++;
    console.log(`  ${m.id} · ${ok ? "RED by" : "NOT RED by"} ${m.clause} · ${r.last} (exit ${r.code})`);
  }
} finally {
  sweep();
  try { rmSync(ROOT, { recursive: true, force: true }); } catch { /* the temp root is the OS's to reap if it is still held */ }
}
console.log(`run_mutants: ${k} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${control ? "GREEN" : "RED"}`);
process.exitCode = k === MUTANTS.length && control ? 0 : 1;
