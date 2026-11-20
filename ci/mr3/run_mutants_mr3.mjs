#!/usr/bin/env node
// ============================================================================
// run_mutants_mr3.mjs — unit mr3: one mutant per clause of ci/mr3/witness_mr3.mjs, each planted on a COPY of --org under
// os.tmpdir() (nothing under either tree is written), each judged by the witness of --org.
//   node ci/mr3/run_mutants_mr3.mjs --org <build tree> --base-org <base tree>
//   M-J4    scripts/gaffer_brain.mjs: the capture door's `argv.push(...idemArgv(s));` removed (the key is load-bearing)
//   M-K1    scripts/organism_test.mjs: the ‹mjd3› KNOWN_RED entry of --base-org put back
//   M-K2    ci/mjd3/witness_mjd3.mjs: the old J4 text un-struck (every ~~ dropped)
//   M-K3    scripts/organism_test.mjs: another ruled entry (‹mtail›) dropped from KNOWN_RED
//   M-BOUND scripts/gaffer_brain.mjs: one comment line appended (a file beyond the named ones)
//   M-LAST  ci/mjd3/witness_mjd3.mjs: a detached node that names its cwd (the mr3 witness's temp dir) and lives one
//           child cap (the mjd3 witness's own measured cap, never typed); swept by this runner after the run
//   A mutant counts only when the witness's RED line names ITS clause. CONTROL = the unmutated copy, must be GREEN.
//   Every witness run gets TMPDIR/TEMP/TMP under this runner's temp dir, so the sweep after it kills every process
//   naming that dir (a planted survivor included). No port, no service, no model, no POST (row 1053).
// LAST LINE: run_mutants: <k> of <n> mutant(s) RED by the clause that names them · control GREEN|RED  (exit 0 iff k = n and GREEN)
// ============================================================================
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, cpSync, existsSync, readdirSync, rmSync } from "node:fs";
import { join, resolve, basename } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const ORG = arg("--org") && resolve(arg("--org")), BASE = arg("--base-org") && resolve(arg("--base-org"));
if (!ORG || !BASE) { console.log("run_mutants: USAGE (--org <dir> --base-org <dir>) · control RED"); process.exit(1); }
const RUN = mkdtempSync(join(tmpdir(), "mr3m-"));
const W = join(ORG, "ci", "mr3", "witness_mr3.mjs");
const lf = (p) => readFileSync(p, "utf8").replace(/\r\n/g, "\n");

function edit(rel, fn) {
  return (tree) => {
    const p = join(tree, rel), s = lf(p), t = fn(s);
    if (t === s) throw new Error(`the mutant's anchor is not in ${rel}`);
    writeFileSync(p, t);
  };
}
const MJD3 = "WITNESS ‹mjd3› · GREEN at head against its BASE";
const baseEntry = () => (lf(join(BASE, "scripts", "organism_test.mjs")).split("\n").find((l) => l.includes(`assert: "${MJD3}"`)) || "") + "\n";
const MUTANTS = [
  { id: "M-J4", clause: "J4", plant: edit("scripts/gaffer_brain.mjs", (s) => s.replace("    argv.push(...idemArgv(s));\n", "")) },
  { id: "M-K1", clause: "K1", plant: edit("scripts/organism_test.mjs", (s) => s.replace(/^const KNOWN_RED = \[\n/m, (m) => m + (baseEntry().trim() ? baseEntry() : ""))) },
  { id: "M-K2", clause: "K2", plant: edit("ci/mjd3/witness_mjd3.mjs", (s) => s.split("~~").join("")) },
  { id: "M-K3", clause: "K3", plant: edit("scripts/organism_test.mjs", (s) => s.split("\n").filter((l) => !l.includes('assert: "WITNESS ‹mtail› · GREEN at head against its BASE"')).join("\n")) },
  { id: "M-BOUND", clause: "BOUND", plant: edit("scripts/gaffer_brain.mjs", (s) => s + "// mutant M-BOUND: a file beyond the named ones\n") },
  { id: "M-LAST", clause: "LAST", plant: edit("ci/mjd3/witness_mjd3.mjs", (s) => s.replace("  const cap = 2 * boundReal + 20 * S;\n",
    (m) => m + "  spawn(process.execPath, [\"-e\", `setTimeout(() => {}, ${Math.ceil(cap)})`, process.cwd()], { detached: true, stdio: \"ignore\", windowsHide: true }).unref();   // mutant M-LAST\n")) },
];

function sweep(dir) {
  const pids = [];
  if (process.platform === "win32") {
    const r = spawnSync("powershell", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process | ForEach-Object { \"$($_.ProcessId) $($_.CommandLine)\" }"], { encoding: "utf8", windowsHide: true });
    for (const l of String(r.stdout || "").split(/\r?\n/)) if (l.toLowerCase().includes(dir.toLowerCase()) && !l.includes("Get-CimInstance")) { const p = Number(l.trim().split(" ")[0]); if (p && p !== process.pid) pids.push(p); }
  } else if (existsSync("/proc")) {
    for (const p of readdirSync("/proc")) {
      if (!/^\d+$/.test(p) || Number(p) === process.pid) continue;
      try { if (readFileSync(`/proc/${p}/cmdline`, "utf8").replace(/\0/g, " ").includes(dir)) pids.push(Number(p)); } catch { }
    }
  }
  for (const p of pids) { try { process.kill(p, "SIGKILL"); } catch { } }
  return pids.length;
}
function copyTree(into) {
  cpSync(ORG, into, { recursive: true, filter: (src) => !["node_modules", ".git"].includes(basename(src)) });
}
function judge(tree, label) {
  const tmp = join(RUN, `${label}-tmp`); mkdirSync(tmp, { recursive: true });
  const env = { ...process.env, TMPDIR: tmp, TEMP: tmp, TMP: tmp };
  const r = spawnSync(process.execPath, [W, "--org", tree, "--base-org", BASE], { cwd: RUN, env, encoding: "utf8", windowsHide: true });
  const swept = sweep(tmp);
  const lines = String(r.stdout || "").split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  return { code: r.status, last: lines[lines.length - 1] || `(no output · ${String(r.stderr || "").trim().split(/\r?\n/).pop()})`, swept };
}

let killed = 0;
for (const m of MUTANTS) {
  const tree = join(RUN, m.id);
  copyTree(tree);
  let j;
  try { m.plant(tree); j = judge(tree, m.id); } catch (e) { j = { code: null, last: `PLANT FAILED: ${e.message}`, swept: 0 }; }
  const ids = (/^RED MR3 · (.*)$/.exec(j.last) || [])[1];
  const hit = j.code === 1 && !!ids && ids.split(/\s+/).includes(m.clause);
  if (hit) killed++;
  console.log(`${hit ? "KILLED" : "SURVIVED"} ${m.id} (clause ${m.clause}) · exit ${j.code} · ${j.last}${j.swept ? ` · swept ${j.swept} survivor(s)` : ""}`);
  try { rmSync(tree, { recursive: true, force: true }); } catch { }
}
const ctree = join(RUN, "CONTROL");
copyTree(ctree);
const c = judge(ctree, "CONTROL");
const cg = c.code === 0 && c.last.startsWith("GREEN MR3 ");
console.log(`CONTROL · exit ${c.code} · ${c.last}`);
const left = sweep(RUN);
try { rmSync(RUN, { recursive: true, force: true }); } catch { }
console.log(`run_mutants: ${killed} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${cg ? "GREEN" : "RED"}${left ? ` · swept ${left} left` : ""}`);
process.exit(killed === MUTANTS.length && cg ? 0 : 1);
