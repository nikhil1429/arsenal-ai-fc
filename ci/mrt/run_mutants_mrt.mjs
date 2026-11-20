#!/usr/bin/env node
// ============================================================================
// ci/mrt/run_mutants_mrt.mjs — unit mrt (forks row 1120 (1)): ONE mutant per clause of ci/mrt/witness_mrt.mjs. Each mutant is a
// copy of the build tree (--org) under os.tmpdir() with ONE edit; the witness runs on it against --base-org and must go RED BY THE
// CLAUSE THAT NAMES IT. The control (the same copy, no edit) must read GREEN.
// USAGE: node ci/mrt/run_mutants_mrt.mjs --org <build tree> --base-org <BASE tree>
//   M-R1     keeper.mjs re-gains mlv1's `await import("./brain.mjs")` inside retireWhenIdle            → R1 CYCLES
//   M-R2     brain.mjs keeps its OWN copy of sourceGraph / staleSources (the re-export removed)        → R2 LEAF (R1 stays GREEN)
//   M-R3     keeper.mjs retireWhenIdle loses its idle() check (mlv1's deferred retire undone)          → R3 MLV1 KEPT
//   M-R4     lawpack.mjs's frozen depcruise_errors is tightened one below the build's own count        → R4 LAWPACK
//   M-BOUND  a comment line is appended to scripts/state.mjs, a file outside the named five           → BOUND
// Every edit is a string replace that must hit exactly once (a miss is a RED of the runner, never a silent no-op). The copy takes
// the TRACKED files when --org is a git tree (git ls-files), else every file but .git / node_modules; node_modules is linked.
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
const ROOT = mkdtempSync(join(tmpdir(), "mrt-mut-"));
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
/** replace `a` by `b` (or by b(match) for a RegExp) in <tree>/<rel>, exactly once */
function edit(tree, rel, a, b) {
  const f = join(tree, rel);
  const t = readFileSync(f, "utf8");
  const n = typeof a === "string" ? t.split(a).length - 1 : (t.match(new RegExp(a.source, a.flags.includes("g") ? a.flags : a.flags + "g")) || []).length;
  if (n !== 1) throw new Error(`${rel}: the mutant's anchor hit ${n} time(s), not once`);
  writeFileSync(f, typeof a === "string" ? t.replace(a, () => b) : t.replace(a, b));
}
const witness = (tree) => {
  const r = spawnSync(process.execPath, [join(HERE, "witness_mrt.mjs"), "--org", tree, "--base-org", BASE_ORG], { encoding: "utf8", windowsHide: true, maxBuffer: 1 << 28 });
  const last = String(r.stdout || "").split(/\r?\n/).map((s) => s.trim()).filter(Boolean).pop() || "";
  return { code: r.status, last };
};

const MUTANTS = [
  { id: "M-R1", clause: "R1 CYCLES", apply: (t) => edit(t, "scripts/keeper.mjs", `  const { readFileSync, statSync, watch: fsWatch } = await import("node:fs");\n`,
    `  const { sourceGraph, staleSources } = await import("./brain.mjs");\n  const { readFileSync, statSync, watch: fsWatch } = await import("node:fs");\n`) },
  { id: "M-R2", clause: "R2 LEAF", apply: (t) => {
    const k = readFileSync(join(t, "scripts", "keeper.mjs"), "utf8");
    const s0 = k.indexOf("export function sourceGraph(entry, readSrc) {");
    const e0 = k.indexOf("\n}\n", k.indexOf("export function staleSources(paths, bootMs, mtimeOf) {")) + 3;
    if (s0 < 0 || e0 < 3) throw new Error("keeper.mjs: the two functions are not there to copy");
    edit(t, "scripts/brain.mjs", `export { sourceGraph, staleSources } from "./keeper.mjs";\n`, k.slice(s0, e0));
    edit(t, "scripts/brain.mjs", `import { keep, KEEP_EXIT, judgeHeld, sourceGraph, staleSources } from "./keeper.mjs";`, `import { keep, KEEP_EXIT, judgeHeld } from "./keeper.mjs";`);
  } },
  { id: "M-R3", clause: "R3 MLV1 KEPT", apply: (t) => edit(t, "scripts/keeper.mjs", "const why = !(await idle()) ? ", "const why = false ? ") },
  { id: "M-R4", clause: "R4 LAWPACK", apply: (t) => {
    const d = spawnSync(process.execPath, [join(t, "node_modules", "dependency-cruiser", "bin", "dependency-cruise.mjs"), "--config", ".dependency-cruiser.cjs", "--output-type", "json", "scripts", "hooks"], { cwd: t, encoding: "utf8", windowsHide: true, maxBuffer: 1 << 28 });
    const o = String(d.stdout || "");
    const n = (JSON.parse(o.slice(o.indexOf("{"), o.lastIndexOf("}") + 1)).summary.violations || []).filter((v) => v.rule && v.rule.name === "no-circular").length;
    if (!(n > 0)) throw new Error(`the build's own no-circular count is ${n}: no baseline below it to tighten to`);
    edit(t, "scripts/lawpack.mjs", /^(\s*depcruise_errors: )\d+,$/m, `$1${n - 1},`);
  } },
  { id: "M-BOUND", clause: "BOUND", apply: (t) => { const f = join(t, "scripts", "state.mjs"); writeFileSync(f, readFileSync(f, "utf8") + "\n// unit mrt mutant M-BOUND: a line outside the named files\n"); } },
];

let k = 0, control = null;
try {
  const c = witness(copy("control"));
  control = c.code === 0 && /^GREEN MRT /.test(c.last);
  console.log(`  control · ${c.last} (exit ${c.code})`);
  for (const m of MUTANTS) {
    let r;
    try { const t = copy(m.id); m.apply(t); r = witness(t); }
    catch (e) { console.log(`  ${m.id} · NOT BUILT: ${String((e && e.message) || e).slice(0, 160)}`); continue; }
    const reds = /^RED MRT · (.*)$/.exec(r.last);
    const ok = r.code === 1 && !!reds && reds[1].split(" · ").includes(m.clause);
    if (ok) k++;
    console.log(`  ${m.id} · ${ok ? "RED by" : "NOT RED by"} ${m.clause} · ${r.last} (exit ${r.code})`);
  }
} finally {
  try { rmSync(ROOT, { recursive: true, force: true }); } catch { }
}
console.log(`run_mutants: ${k} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${control ? "GREEN" : "RED"}`);
process.exitCode = k === MUTANTS.length && control ? 0 : 1;
