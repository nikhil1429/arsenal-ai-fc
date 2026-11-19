#!/usr/bin/env node
// ============================================================================
// ci/mgat/run_mutants_mgat.mjs · unit mgat (forks row 1145) · THE MUTANTS, one per witness clause. HEADER = CONTRACT.
//   usage: node ci/mgat/run_mutants_mgat.mjs --org <dir> --base-org <dir>
//   SOLE WRITER of: NOTHING outside os.tmpdir(). Each mutant tree is a `git clone -c core.autocrlf=false` of --base-org
//   (its HEAD, the cut: LF bytes on any machine) under the temp dir, with ci/mgat/tools/build.mjs applyBuild(tree, Mk)
//   applied — the spec's exact EDITS minus ONE clause's reason (MUTANTS M1..M7, MGAT_SPEC.md §5).
//   CONTROL: applyBuild(tree) with no mutant must give the four named files byte-for-byte (line endings normalised)
//   as --org carries them, and the witness must read GREEN on it for every clause. Each mutant Mk must turn ITS
//   clause Wk RED on the org side (`witness_mgat.mjs --org-only --only Wk`).
//   No port, no live service, no model; every child is spawnSync. LAST: no node process naming the temp dir survives.
// LAST LINE: `run_mutants: k of n mutant(s) RED by the clause that names them · control GREEN` (exit 0 iff k = n and
//   the control is GREEN), else the same line with `control RED` and exit 1.
// ============================================================================
import { execFileSync, spawnSync } from "node:child_process"; import { mkdtempSync, rmSync, readFileSync, existsSync, symlinkSync, readdirSync } from "node:fs";
import { join, resolve, dirname } from "node:path"; import { tmpdir } from "node:os"; import { fileURLToPath } from "node:url";
import { applyBuild, MUTANTS, EDITS } from "./tools/build.mjs";
const HERE = dirname(fileURLToPath(import.meta.url)); const argv = process.argv.slice(2);
const opt = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
const ORG = opt("--org") && resolve(opt("--org")); const BASE = opt("--base-org") && resolve(opt("--base-org"));
if (!ORG || !BASE) { console.log("usage: node ci/mgat/run_mutants_mgat.mjs --org <dir> --base-org <dir>"); process.exit(1); }
const RUN = mkdtempSync(join(tmpdir(), "mgat-mut-"));
const CLAUSE = { M1: "W1", M2: "W2", M3: "W3", M4: "W4", M5: "W5", M6: "W6", M7: "W7", M8: "W8", M9: "W9" };
const nm = [join(ORG, "node_modules"), join(BASE, "node_modules")].find((p) => existsSync(p));
function tree(m) {
  const d = join(RUN, m || "control");
  execFileSync("git", ["clone", "-q", "-c", "core.autocrlf=false", "--no-hardlinks", BASE, d], { stdio: "pipe" });
  applyBuild(d, m); if (nm) symlinkSync(nm, join(d, "node_modules"), "junction"); return d;
}
const witness = (d, extra) => { const r = spawnSync(process.execPath, [join(HERE, "witness_mgat.mjs"), "--org", d, "--base-org", BASE, ...extra], { encoding: "utf8", maxBuffer: 1 << 28 });
  return { code: r.status, out: (r.stdout || "") + (r.stderr || "") }; };
const norm = (p) => readFileSync(p).toString("latin1").split("\r\n").join("\n");
// CONTROL
const c = tree(null); const files = [...new Set(EDITS.map((e) => e.file))];
const same = files.filter((f) => norm(join(c, f)) === norm(join(ORG, f)));
const cw = witness(c, ["--org-only"]); const cOrg = cw.out.split(/\r?\n/).filter((l) => /^W\d org /.test(l));
const cGreen = same.length === files.length && cOrg.length === Object.keys(CLAUSE).length && cOrg.every((l) => / org  GREEN /.test(l));
console.log(`CONTROL · named files equal to --org ${same.length} of ${files.length} · witness org side ${cOrg.filter((l) => /GREEN/.test(l)).length} of ${cOrg.length} GREEN`);
rmSync(c, { recursive: true, force: true });
let k = 0; const ids = Object.keys(MUTANTS);
for (const m of ids) {
  const w = CLAUSE[m]; const d = tree(m); const r = witness(d, ["--org-only", "--only", w]); rmSync(d, { recursive: true, force: true });
  const line = r.out.split(/\r?\n/).find((l) => l.startsWith(`${w} org `)) || "(no clause line)"; const red = / org  RED /.test(line); if (red) k++;
  console.log(`${m} (${MUTANTS[m].why}) · ${red ? "RED by" : "NOT RED by"} ${w} · ${line.slice(0, 200)}`);
}
rmSync(RUN, { recursive: true, force: true });
let left = 0; if (existsSync("/proc")) for (const p of readdirSync("/proc")) { if (!/^\d+$/.test(p) || Number(p) === process.pid) continue; try { if (readFileSync(`/proc/${p}/cmdline`, "utf8").includes(RUN)) left++; } catch { /* exited meanwhile */ } }
else if (process.platform === "win32") { const r = spawnSync("powershell", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process | ForEach-Object { $_.CommandLine }"], { encoding: "utf8", maxBuffer: 1 << 26 }); left = (r.stdout || "").split(/\r?\n/).filter((l) => l.includes(RUN)).length; }
console.log(`LAST · node processes naming ${RUN}: ${left}`);
const ok = k === ids.length && cGreen && left === 0;
console.log(`run_mutants: ${k} of ${ids.length} mutant(s) RED by the clause that names them · control ${cGreen ? "GREEN" : "RED"}`);
process.exitCode = ok ? 0 : 1;
