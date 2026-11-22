#!/usr/bin/env node
// ============================================================================
// ci/mgat/run_mutants_mgat.mjs · unit mgat (forks rows 1145 / 1156 / 1174 / 1200 (2)) · THE MUTANTS, one per witness clause. HEADER = CONTRACT.
//   usage: node ci/mgat/run_mutants_mgat.mjs --org <dir> --base-org <dir>
//   SOLE WRITER of: NOTHING outside os.tmpdir(). Since main 6a6bdff was merged (row 1200 (2)), each mutant is THE MERGED BUILD
//   MINUS ONE FATE: a `git clone -c core.autocrlf=false` of --org's HEAD under the temp dir, with build.mjs mutantOnBuild(Mk) —
//   the fate's own bytes (read through MERGE_MAP) put back to the BASE bytes it replaced — each pair matched EXACTLY ONCE or the
//   runner refuses. CONTROL: every EDIT's merged `to` is present exactly once in --org (the LIVE removal: no `gates:` row left in
//   LIVE_MODES), and the witness reads GREEN on --org for every clause. Each mutant Mk must turn ITS clause RED on the org side.
//   M12 (mf2 F3's mutant) is judged by ci/mf2's witness, PROOF §10.2 / §12.
//   No port, no live service, no model; every child is spawnSync. LAST: no node process naming the temp dir survives.
// LAST LINE: `run_mutants: k of n mutant(s) RED by the clause that names them · control GREEN|RED` (exit 0 iff k = n and GREEN).
// ============================================================================
import { execFileSync, spawnSync } from "node:child_process"; import { mkdtempSync, rmSync, readFileSync, writeFileSync, existsSync, symlinkSync, readdirSync } from "node:fs";
import { join, resolve, dirname } from "node:path"; import { tmpdir } from "node:os"; import { fileURLToPath } from "node:url";
import { MUTANTS, EDITS, mm, mutantOnBuild } from "./tools/build.mjs";
const HERE = dirname(fileURLToPath(import.meta.url)); const argv = process.argv.slice(2);
const opt = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
const ORG = opt("--org") && resolve(opt("--org")); const BASE = opt("--base-org") && resolve(opt("--base-org"));
if (!ORG || !BASE) { console.log("usage: node ci/mgat/run_mutants_mgat.mjs --org <dir> --base-org <dir>"); process.exit(1); }
const RUN = mkdtempSync(join(tmpdir(), "mgat-mut-"));
const CLAUSE = { M1: "W1", M2: "W2", M3: "W3", M4: "W4", M5: "W5", M6: "W6", M7: "W7", M8: "W8", M9: "W9", M10: "W1", M11: "W9" };
const nm = [join(ORG, "node_modules"), join(BASE, "node_modules")].find((p) => existsSync(p));
const files = [...new Set(EDITS.map((e) => e.file))];
function tree(m) {
  const d = join(RUN, m);
  execFileSync("git", ["clone", "-q", "-c", "core.autocrlf=false", "--no-hardlinks", ORG, d], { stdio: "pipe" });
  for (const [from, to] of mutantOnBuild(m)) {
    const f = files.find((x) => readFileSync(join(d, x), "utf8").split(from).length - 1 === 1);
    if (!f) throw new Error(`mutant ${m}: a pair matched no named file exactly once: ${from.slice(0, 80)}`);
    writeFileSync(join(d, f), readFileSync(join(d, f), "utf8").replace(from, () => to));
  }
  if (nm) symlinkSync(nm, join(d, "node_modules"), "junction"); return d;
}
const witness = (d, extra) => { const r = spawnSync(process.execPath, [join(HERE, "witness_mgat.mjs"), "--org", d, "--base-org", BASE, ...extra], { encoding: "utf8", maxBuffer: 1 << 28 });
  return { code: r.status, out: (r.stdout || "") + (r.stderr || "") }; };
// CONTROL
const text = Object.fromEntries(files.map((f) => [f, readFileSync(join(ORG, f), "utf8")]));
const present = EDITS.filter((e) => (e.to === "" ? !/^  gates: "validates/m.test(text[e.file]) : text[e.file].split(mm(e.to)).length - 1 === 1));
const cw = witness(ORG, ["--org-only"]); const cOrg = cw.out.split(/\r?\n/).filter((l) => /^W\d org /.test(l));
const nClauses = new Set(Object.values(CLAUSE)).size;
const cGreen = present.length === EDITS.length && cOrg.length === nClauses && cOrg.every((l) => / org  GREEN /.test(l));
console.log(`CONTROL · fates present in --org ${present.length} of ${EDITS.length}${present.length < EDITS.length ? ` (missing ${EDITS.filter((e) => !present.includes(e)).map((e) => e.id).join(" ")})` : ""} · witness org side ${cOrg.filter((l) => /GREEN/.test(l)).length} of ${cOrg.length} GREEN`);
let k = 0; const ids = Object.keys(MUTANTS).filter((m) => CLAUSE[m]);
for (const m of ids) {
  const w = CLAUSE[m]; let line, red = false;
  try { const d = tree(m); const r = witness(d, ["--org-only", "--only", w]); rmSync(d, { recursive: true, force: true });
    line = r.out.split(/\r?\n/).find((l) => l.startsWith(`${w} org `)) || "(no clause line)"; red = / org  RED /.test(line); }
  catch (e) { line = `REFUSED ${String(e.message).slice(0, 160)}`; }
  if (red) k++;
  console.log(`${m} (${MUTANTS[m].why}) · ${red ? "RED by" : "NOT RED by"} ${w} · ${line.slice(0, 200)}`);
}
rmSync(RUN, { recursive: true, force: true });
let left = 0; if (existsSync("/proc")) for (const p of readdirSync("/proc")) { if (!/^\d+$/.test(p) || Number(p) === process.pid) continue; try { if (readFileSync(`/proc/${p}/cmdline`, "utf8").includes(RUN)) left++; } catch { /* exited meanwhile */ } }
else if (process.platform === "win32") { const r = spawnSync("powershell", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process | ForEach-Object { $_.CommandLine }"], { encoding: "utf8", maxBuffer: 1 << 26 }); left = (r.stdout || "").split(/\r?\n/).filter((l) => l.includes(RUN)).length; }
console.log(`LAST · node processes naming ${RUN}: ${left}`);
console.log(`run_mutants: ${k} of ${ids.length} mutant(s) RED by the clause that names them · control ${cGreen ? "GREEN" : "RED"}`);
process.exitCode = k === ids.length && cGreen && left === 0 ? 0 : 1;
