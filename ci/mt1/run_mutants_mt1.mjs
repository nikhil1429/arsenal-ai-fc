#!/usr/bin/env node
// ============================================================================
// ci/mt1/run_mutants_mt1.mjs — one mutant per changed clause of ci/mt1/witness_mt1.mjs, each RED by the clause that names it
//   node ci/mt1/run_mutants_mt1.mjs --org <build tree> --base-org <base tree>
// Each mutant is a COPY under os.tmpdir() of the build tree (node_modules linked; .git and dressing-room skipped) with ONE
// edit to ONE unit witness: the k-th `retireThenBoot(…)` site of ci/<u>/witness_<u>.mjs (the clause it names, in file
// order) put back to the single-sample wait it replaced (`waitFor(<a new worker>, BOUND)`). The edit is applied only when
// the file holds exactly the expected number of sites (else that mutant is not RED: an edit that cannot land proves
// nothing). The witness runs `--only P-<u>-<id>` over it with --base-org and must print `RED MT1 · P-<u>-<id>`. The control
// is the build tree itself over every clause, with --base-org: GREEN. Every wait is a child's exit; no port is bound here
// (the unit witnesses plant their own); no model is called; no number is typed.
// LAST LINE: run_mutants: k of n mutant(s) RED by the clause that names them · control GREEN|RED
// ============================================================================
import { spawnSync } from "node:child_process";
import { mkdtempSync, cpSync, readFileSync, writeFileSync, rmSync, existsSync, symlinkSync, readdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";

const arg = (k) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : null; };
const ORG = arg("--org") && resolve(arg("--org")), BASE = arg("--base-org") && resolve(arg("--base-org"));
if (!ORG || !BASE) { console.log("run_mutants: usage --org <dir> --base-org <dir>"); process.exit(1); }
const WITNESS = join(dirname(fileURLToPath(import.meta.url)), "witness_mt1.mjs");
const CHANGED = { mlv1: ["I1", "I2", "I3"], mlv2: ["C1", "C2", "C3", "K5"], mlv3: ["T1", "T3", "T4"] };
const ROOT = mkdtempSync(join(os.tmpdir(), "mutants-mt1-"));
const SITE = /const rb = await retireThenBoot\(nR, ([\s\S]*?)\), s2 = rb\.s2;/g;
const copyOf = (into) => {
  for (const e of readdirSync(ORG)) if (e !== "node_modules" && e !== ".git" && e !== "dressing-room") cpSync(join(ORG, e), join(into, e), { recursive: true });
  if (existsSync(join(ORG, "node_modules"))) symlinkSync(join(ORG, "node_modules"), join(into, "node_modules"), process.platform === "win32" ? "junction" : "dir");
};
const lastOf = (r) => String(r.stdout || "").split(/\r?\n/).map((s) => s.trim()).filter(Boolean).pop() || "";
let k = 0, n = 0;
for (const [u, ids] of Object.entries(CHANGED)) {
  ids.forEach((id, idx) => {
    n++;
    const name = `M-${u}-${id} the ${id} retire back to one single-sample wait`, cid = `P-${u}-${id}`;
    const dir = mkdtempSync(join(ROOT, "m-"));
    copyOf(dir);
    const file = join(dir, "ci", u, `witness_${u}.mjs`), src = readFileSync(file, "utf8");
    const sites = [...src.matchAll(SITE)];
    if (sites.length !== ids.length) { console.log(`  GREEN mutant ${name} · ${sites.length} site(s) in ci/${u}/witness_${u}.mjs, ${ids.length} expected: the edit cannot land`); rmSync(dir, { recursive: true, force: true }); return; }
    const m = sites[idx];
    writeFileSync(file, src.slice(0, m.index) + `const s2 = await waitFor(${m[1]}, BOUND), rb = { why: "MUTANT: one single-sample wait" };` + src.slice(m.index + m[0].length));
    const t = Date.now();
    const r = spawnSync(process.execPath, [WITNESS, "--org", dir, "--base-org", BASE, "--only", cid], { encoding: "utf8", windowsHide: true });
    const last = lastOf(r), why = (String(r.stdout || "").split(/\r?\n/).find((l) => l.includes(` ${cid} · `)) || "").trim();
    const ok = r.status === 1 && last === `RED MT1 · ${cid}`;
    if (ok) k++;
    console.log(`  ${ok ? "RED  " : "GREEN"} mutant ${name} → ${cid} · ${((Date.now() - t) / 1000).toFixed(1)} s · ${last} · ${why.slice(0, 200)}`);
    rmSync(dir, { recursive: true, force: true });
  });
}
const c = spawnSync(process.execPath, [WITNESS, "--org", ORG, "--base-org", BASE], { encoding: "utf8", windowsHide: true });
const cl = lastOf(c);
console.log(`  control · ${cl.slice(0, 90)}${cl.length > 90 ? " …" : ""}`);
rmSync(ROOT, { recursive: true, force: true });
console.log(`run_mutants: ${k} of ${n} mutant(s) RED by the clause that names them · control ${c.status === 0 && cl.startsWith("GREEN MT1 ") ? "GREEN" : "RED"}`);
process.exit(k === n && c.status === 0 ? 0 : 1);
