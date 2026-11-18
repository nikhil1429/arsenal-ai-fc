#!/usr/bin/env node
// ============================================================================
// run_mutants_mjd5.mjs — unit mjd5: ONE MUTANT PER CLAUSE of witness_mjd5.mjs, each on a copy of the build tree under os.tmpdir().
// CONTRACT:  node ci/mjd5/run_mutants_mjd5.mjs --org <build tree> --base-org <base tree>
//   control  the build tree unmutated                         → the witness must be GREEN
//   R1       the round never calls the retire door            → R1 RED
//   R2       the round retires every capture it re-dispatches, resolved or not → R2 RED
//   R3       the door re-retires a settled card (no "already settled" check)    → R3 RED
//   BOUND    a file beyond the two named ones is touched      → BOUND RED
//   LAST     the door leaves a node process naming its tree behind               → LAST RED
// LAST LINE: run_mutants: k of n mutant(s) RED by the clause that names them · control GREEN|RED
// ============================================================================
import { mkdtempSync, readFileSync, writeFileSync, cpSync, rmSync, appendFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const ORG = arg("--org") && resolve(arg("--org")), BASE = arg("--base-org") && resolve(arg("--base-org"));
if (!ORG || !BASE) { console.log("run_mutants: USAGE (--org <dir> --base-org <dir>)"); process.exit(1); }
const WITNESS = join(dirname(fileURLToPath(import.meta.url)), "witness_mjd5.mjs");
const TMP = mkdtempSync(join(tmpdir(), "mjd5m-"));

const edit = (rel, from, to) => (tree) => {
  const p = join(tree, rel), s = readFileSync(p, "utf8");
  if (!s.includes(from)) throw new Error(`mutant anchor not found in ${rel}: ${from.slice(0, 60)}`);
  writeFileSync(p, s.replace(from, to));
};
const MUTANTS = [
  { id: "R1", apply: edit("scripts/gaffer_brain.mjs", `const cr = cardRetire(\`judge:in-doubt:\${d.of}\`,`, `const cr = ((k, w) => ({ ok: true, out: "" }))(\`judge:in-doubt:\${d.of}\`,`) },
  { id: "R2", apply: edit("scripts/gaffer_brain.mjs", "    let why = null;\n    if (deps.dry)", "    let why = null;\n    cardRetire(`judge:in-doubt:${d.of}`, \"mutant\");\n    if (deps.dry)") },
  { id: "R3", apply: edit("scripts/captains_call.mjs", "  if (c.answer || c.retired_at) return { state: s, card: c, changed: false, note:", "  if (false) return { state: s, card: c, changed: false, note:") },
  { id: "BOUND", apply: (tree) => appendFileSync(join(tree, "scripts", "capture.mjs"), "\n// mutant\n") },
  // the sleeper names this runner's TMP too, so the runner can kill it after its witness has named it (LAST RED)
  { id: "LAST", apply: edit("scripts/captains_call.mjs", "    writeAtomic(CALL, r.state);\n    console.log(`captains_call: retired",
    "    (await import(\"node:child_process\")).spawn(process.execPath, [\"-e\", \"setTimeout(()=>{}, 4000)\", __dirname, " + JSON.stringify(TMP) + "], { detached: true, stdio: \"ignore\" }).unref();\n    writeAtomic(CALL, r.state);\n    console.log(`captains_call: retired") },
];

const runWitness = (tree) => {
  const r = spawnSync(process.execPath, [WITNESS, "--org", tree, "--base-org", BASE], { encoding: "utf8" });
  const out = String(r.stdout || "").split(/\r?\n/).filter(Boolean);
  return { code: r.status, last: out[out.length - 1] || "", red: out.filter((l) => /^RED {3}/.test(l)).map((l) => l.split(" ").filter(Boolean)[1]) };
};
const copy = () => { const d = mkdtempSync(join(TMP, "m-")); cpSync(ORG, d, { recursive: true, verbatimSymlinks: true }); return d; };

const ctl = runWitness(copy());
console.log(`control · exit ${ctl.code} · ${ctl.last}`);
let k = 0;
for (const m of MUTANTS) {
  const t = copy();
  let r;
  try { m.apply(t); r = runWitness(t); } catch (e) { r = { code: null, last: String(e.message), red: [] }; }
  const hit = r.code === 1 && r.red.includes(m.id);
  if (hit) k++;
  console.log(`mutant ${m.id} · ${hit ? "RED by its clause" : "NOT caught"} · reds ${r.red.join(" ") || "none"} · ${r.last}`);
}
// the LAST mutant's sleeper outlives its witness by design; this runner kills it, so it leaves nothing behind either
const procs = () => (process.platform === "win32"
  ? (spawnSync("powershell", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process | ForEach-Object { \"$($_.ProcessId) $($_.CommandLine)\" }"], { encoding: "utf8" }).stdout || "")
  : (spawnSync("ps", ["-eo", "pid=,args="], { encoding: "utf8" }).stdout || ""))
  .split(/\r?\n/).map((l) => l.trim()).filter((l) => l.includes(TMP) && !l.includes("Get-CimInstance") && !/ ps /.test(` ${l}`))
  .map((l) => Number(l.split(/\s+/)[0])).filter((n) => Number.isInteger(n) && n > 0 && n !== process.pid);
for (const pid of procs()) { try { process.kill(pid); } catch { } }
try { rmSync(TMP, { recursive: true, force: true }); } catch { }
const ctlGreen = ctl.code === 0 && /^GREEN MJD5/.test(ctl.last);
console.log(`run_mutants: ${k} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${ctlGreen ? "GREEN" : "RED"}`);
process.exit(k === MUTANTS.length && ctlGreen ? 0 : 1);
