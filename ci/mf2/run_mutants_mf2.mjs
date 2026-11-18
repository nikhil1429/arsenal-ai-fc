#!/usr/bin/env node
// ============================================================================
// run_mutants_mf2.mjs — unit MF2: ONE MUTANT PER CLAUSE of witness_mf2.mjs, each on a copy of the build tree under os.tmpdir().
// CONTRACT:  node ci/mf2/run_mutants_mf2.mjs --org <build tree> --base-org <base tree>
//   control  the build tree unmutated                                              → the witness must be GREEN
//   F1       skipLive never skips (computed then ignored, the base's behaviour)     → F1 RED
//   F2       a hermetic assert's verdict moves (FOUR-MOMENTS judged inverted)       → F2 RED
//   F3       a hermetic member joins LIVE_ASSERTS without a row (the count rises)   → F3 RED
//   F4       skipLive skips under the FULL profile too                              → F4 RED
//   BOUND    a file beyond scripts/organism_test.mjs is touched                     → BOUND RED
//   LAST     the suite leaves a node process naming its tree behind                 → LAST RED
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
const WITNESS = join(dirname(fileURLToPath(import.meta.url)), "witness_mf2.mjs");
const TMP = mkdtempSync(join(tmpdir(), "mf2m-"));
const OT = "scripts/organism_test.mjs";

const edit = (rel, from, to) => (tree) => {
  const p = join(tree, rel), s = readFileSync(p, "utf8");
  if (!s.includes(from)) throw new Error(`mutant anchor not found in ${rel}: ${from.slice(0, 60)}`);
  writeFileSync(p, s.replace(from, to));
};
const MUTANTS = [
  { id: "F1", apply: edit(OT, `  if (PROFILE !== "hermetic" || !names.length) return false;\n  const keyOf`, `  if (true) return false;\n  const keyOf`) },
  { id: "F2", apply: edit(OT, `forge_session refuses a question-moment outside the four", badMoment.code !== 0);`, `forge_session refuses a question-moment outside the four", badMoment.code === 0);`) },
  { id: "F3", apply: edit(OT, `const LIVE_ASSERTS = Object.freeze({\n`, `const LIVE_ASSERTS = Object.freeze({\n  "FOUR-MOMENTS LAW · forge_session refuses a question-moment outside the four": "mutant: a member joined without a row",\n`) },
  { id: "F4", apply: edit(OT, `  if (PROFILE !== "hermetic" || !names.length) return false;\n  const keyOf`, `  if (!names.length) return false;\n  const keyOf`) },
  { id: "BOUND", apply: (tree) => appendFileSync(join(tree, "scripts", "capture.mjs"), "\n// mutant\n") },
  // the sleeper names this runner's TMP too, so the runner can kill it after its witness has named it (LAST RED)
  { id: "LAST", apply: edit(OT, `const PROFILE = process.env.ORGANISM_TEST_PROFILE`,
    `(await import("node:child_process")).spawn(process.execPath, ["-e", "setTimeout(()=>{}, 600000)", ROOT, ${JSON.stringify(TMP)}], { detached: true, stdio: "ignore" }).unref();\nconst PROFILE = process.env.ORGANISM_TEST_PROFILE`) },
];

const runWitness = (tree) => {
  const r = spawnSync(process.execPath, [WITNESS, "--org", tree, "--base-org", BASE], { encoding: "utf8", maxBuffer: 1 << 26 });
  const out = String(r.stdout || "").split(/\r?\n/).filter(Boolean);
  return { code: r.status, last: out[out.length - 1] || "", red: out.filter((l) => /^RED {3}/.test(l)).map((l) => l.split(" ").filter(Boolean)[1]) };
};
const copy = () => { const d = mkdtempSync(join(TMP, "m-")); cpSync(ORG, d, { recursive: true, verbatimSymlinks: true }); return d; };
const only = process.argv.includes("--only") ? String(arg("--only")).split(",") : null;

const ctl = only && !only.includes("control") ? null : runWitness(copy());
if (ctl) console.log(`control · exit ${ctl.code} · ${ctl.last}`);
let k = 0, n = 0;
for (const m of MUTANTS) {
  if (only && !only.includes(m.id)) continue;
  n++;
  const t = copy();
  let r;
  try { m.apply(t); r = runWitness(t); } catch (e) { r = { code: null, last: String(e.message), red: [] }; }
  const hit = r.code === 1 && r.red.includes(m.id);
  if (hit) k++;
  console.log(`mutant ${m.id} · ${hit ? "RED by its clause" : "NOT caught"} · reds ${r.red.join(" ") || "none"} · ${r.last}`);
}
// the LAST mutant's sleepers outlive their witness by design; this runner kills them, so it leaves nothing behind either
const procs = () => (process.platform === "win32"
  ? (spawnSync("powershell", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process | ForEach-Object { \"$($_.ProcessId) $($_.CommandLine)\" }"], { encoding: "utf8" }).stdout || "")
  : (spawnSync("ps", ["-eo", "pid=,args="], { encoding: "utf8" }).stdout || ""))
  .split(/\r?\n/).map((l) => l.trim()).filter((l) => l.includes(TMP) && !l.includes("Get-CimInstance") && !/ ps /.test(` ${l}`))
  .map((l) => Number(l.split(/\s+/)[0])).filter((x) => Number.isInteger(x) && x > 0 && x !== process.pid);
for (const pid of procs()) { try { process.kill(pid); } catch { } }
try { rmSync(TMP, { recursive: true, force: true }); } catch { }
const ctlGreen = !!ctl && ctl.code === 0 && /^GREEN MF2/.test(ctl.last);
console.log(`run_mutants: ${k} of ${n} mutant(s) RED by the clause that names them · control ${ctl ? (ctlGreen ? "GREEN" : "RED") : "not run"}`);
process.exit(k === n && ctlGreen ? 0 : 1);
