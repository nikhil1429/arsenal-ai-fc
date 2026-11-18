#!/usr/bin/env node
// ci/mcr2/run_mutants.mjs — P3 of unit mcr2: one mutant per witness clause, each must read RED BY THE CLAUSE THAT
// NAMES IT; the unmutated build is the control and must read GREEN.
//   node ci/mcr2/run_mutants.mjs --org <build dir> --base-org <BASE dir>
// Every mutant is a COPY of --org under os.tmpdir() (node_modules linked, a junction on Windows); --org is never
// written. The witness is run from THIS directory on each copy. LAST LINE:
//   run_mutants: k of n mutant(s) RED by the clause that names them · control GREEN|RED   (exit 0 iff k = n and control GREEN)
import { readFileSync, writeFileSync, mkdtempSync, rmSync, existsSync, cpSync, symlinkSync, realpathSync, appendFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const opt = (/** @type {string} */ k) => { const i = argv.indexOf(k); return i >= 0 && argv[i + 1] ? resolve(argv[i + 1]) : null; };
const ORG = opt("--org"), BASE_ORG = opt("--base-org");
if (!ORG || !BASE_ORG) { console.log("usage: node ci/mcr2/run_mutants.mjs --org <dir> --base-org <dir>"); console.log("run_mutants: 0 of 0 mutant(s) RED by the clause that names them · control RED"); process.exit(1); }

const NORM = '.replace(/\\r\\n/g, "\\n")';
/** revert the k-th (0-based) normalised own-source read in a file */
const revert = (/** @type {string} */ s, /** @type {number} */ k) => { let n = -1; return s.replace(/readFileSync\(fileURLToPath\(import\.meta\.url\), "utf8"\)\.replace\(\/\\r\\n\/g, "\\n"\)/g, (m) => (++n === k ? m.slice(0, -NORM.length) : m)); };
const edit = (/** @type {string} */ root, /** @type {string} */ p, /** @type {(s: string) => string} */ f) => { const at = join(root, ...p.split("/")); const was = readFileSync(at, "utf8"); const now = f(was); if (now === was) throw new Error(`mutant did not change ${p}`); writeFileSync(at, now); };

const TMP = mkdtempSync(join(tmpdir(), "mutants-mcr2-"));
// THE LAST PLANT: a preload every child node runs; inside a witness child (its tmpdir sits under the witness's
// temp root) it leaves a detached node naming that dir and spawns `claude` once — the leak LAST exists to catch.
const LEAK = join(TMP, "leak.cjs");
writeFileSync(LEAK, `const os=require("os"),cp=require("child_process"),path=require("path");
if (os.tmpdir().includes("witness-mcr2-") && !process.env.MCR2_LEAKED) { process.env.MCR2_LEAKED="1";
  const f=path.join(os.tmpdir(),"sleeper.js"); require("fs").writeFileSync(f,"setInterval(()=>{},1<<30)");
  const c=cp.spawn(process.execPath,[f],{detached:true,stdio:"ignore",env:{...process.env,NODE_OPTIONS:""}}); c.unref();
  require("fs").appendFileSync(${JSON.stringify(join(TMP, "sleepers.txt"))}, c.pid + "\\n");
  try { cp.spawnSync("claude",["-p","planted"],{stdio:"ignore",shell:process.platform==="win32"}); } catch {} }
`);

/** @type {{ name: string, clause: string, apply?: (root: string) => void, env?: Record<string, string> }[]} */
const MUTANTS = [
  { name: "M1 context.mjs:1192 read un-normalised", clause: "C-context", apply: (r) => edit(r, "scripts/context.mjs", (s) => revert(s, 1)) },
  { name: "M2 fuelboard.mjs:620 read un-normalised", clause: "C-fuelboard", apply: (r) => edit(r, "scripts/fuelboard.mjs", (s) => revert(s, 0)) },
  { name: "M3 learnstate.mjs:2014 read un-normalised", clause: "C-learnstate", apply: (r) => edit(r, "scripts/learnstate.mjs", (s) => revert(s, 0)) },
  { name: "M4 a file outside the named set differs (README.md gains a line)", clause: "BOUND", apply: (r) => edit(r, "README.md", (s) => s + "\nmutant line\n") },
  { name: "M5 a child leaves a node naming the temp root and spawns claude (NODE_OPTIONS preload)", clause: "LAST", env: { NODE_OPTIONS: `--require "${LEAK}"` } },
];

/** @param {string} label @param {(root: string) => void} [apply] @param {Record<string, string>} [env] */
function runOne(label, apply, env) {
  const root = join(TMP, label.split(" ")[0]);
  cpSync(ORG, root, { recursive: true, filter: (s) => !/[\\/](node_modules|\.git)$/.test(s) });
  if (existsSync(join(ORG, "node_modules"))) symlinkSync(realpathSync(join(ORG, "node_modules")), join(root, "node_modules"), "junction");
  if (apply) apply(root);
  const r = spawnSync(process.execPath, [join(HERE, "witness_mcr2.mjs"), "--org", root, "--base-org", BASE_ORG], { encoding: "utf8", env: { ...process.env, ...(env || {}) } });
  const last = String(r.stdout || "").split(/\r?\n/).filter(Boolean).pop() || "(no output)";
  return { code: r.status, last };
}

let k = 0;
for (const m of MUTANTS) {
  const r = runOne(m.name, m.apply, m.env);
  const red = /^RED MCR2 · /.test(r.last) ? r.last.replace(/^RED MCR2 · /, "").split(" ") : [];
  const hit = r.code === 1 && red.includes(m.clause);
  if (hit) k++;
  console.log(`  ${hit ? "✓" : "✗"} ${m.name} — want RED by ${m.clause} · got exit ${r.code}: ${r.last}`);
}
// the planted sleepers are killed here, after M5's LAST has seen them (each names a temp root the witness removed)
const SLEEPERS = join(TMP, "sleepers.txt");
if (existsSync(SLEEPERS)) for (const pid of readFileSync(SLEEPERS, "utf8").split(/\r?\n/).filter(Boolean)) { try { process.kill(Number(pid)); } catch { /* already gone */ } }
const ctl = runOne("control");
const ctlGreen = ctl.code === 0 && /^GREEN MCR2 /.test(ctl.last);
console.log(`  ${ctlGreen ? "✓" : "✗"} control (the build, unmutated) — want GREEN · got exit ${ctl.code}: ${ctl.last}`);
try { rmSync(TMP, { recursive: true, force: true }); } catch (e) { appendFileSync(join(HERE, "out", "run_mutants_cleanup.txt"), String(e) + "\n"); }
console.log(`run_mutants: ${k} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${ctlGreen ? "GREEN" : "RED"}`);
process.exit(k === MUTANTS.length && ctlGreen ? 0 : 1);
