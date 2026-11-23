#!/usr/bin/env node
// ============================================================================
// ci/mg9/run_mutants_mg9.mjs — mutants of unit mg9, each RED by the clause of ci/mg9/witness_mg9.mjs that names it
//   node ci/mg9/run_mutants_mg9.mjs --org <build tree> --base-org <base tree>
// Each mutant is a COPY under os.tmpdir() of the build tree's parts the witness reads (scripts/ · package.json · ci/witness/mcrk2/
// · ci/mg9/) with ONE edit to ONE file; the edit is applied only if its anchor occurs exactly once. The witness runs
// `--only <clause>` over it and must print `RED MG9 · <clause>`. The control is the build tree itself, every clause, with
// --base-org: GREEN. BOUND and LAST are seat-time clauses with no mutant. Every wait is a child's exit; no port; no model.
// LAST LINE: run_mutants: k of n mutant(s) RED by the clause that names them · control GREEN|RED
// ============================================================================
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, cpSync, readFileSync, writeFileSync, rmSync, existsSync, symlinkSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";

const arg = (k) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : null; };
const ORG = arg("--org") && resolve(arg("--org")), BASE = arg("--base-org") && resolve(arg("--base-org"));
if (!ORG || !BASE) { console.log("run_mutants: usage --org <dir> --base-org <dir>"); process.exit(1); }
const HERE = dirname(fileURLToPath(import.meta.url));
const WITNESS = join(HERE, "witness_mg9.mjs");
const NM = [ORG, join(HERE, "..", "..")].map((t) => join(t, "node_modules")).find((p) => existsSync(p)) || null;
const CW = "ci/witness/mcrk2/witness_crack_gap.mjs";
const ROOT = mkdtempSync(join(os.tmpdir(), "mutants-mg9-"));
/** [clause id, mutant name, file, anchor, replacement] */
const MUTANTS = [
  ["FAST", "M1 the old wait restored (the compile reads its own clock again)", CW, "  now: () => new Date(Math.max(Date.now(), lastAt + 1)), guard:", "  guard:"],
  ["FAST", "M2 G9 (ii)'s compile call drops its archive's lastAt", CW, "compile(B.N, b, B.arc, DB, B.lastAt);", "compile(B.N, b, B.arc, DB);"],
  ["FAST", "M3 the archive reports no planted time (lastAt 0)", CW, "  return { N, arc, lastAt: recs.reduce((m, r) => Math.max(m, r.at.getTime()), 0) };", "  return { N, arc, lastAt: 0 };"],
  ["STRUCK", "M4 the old wait's struck text deleted", CW, "//   ~~const compile = (N, p, arc, D) => N.compileDay(", "//   (deleted) N.compileDay("],
];
const copyOf = (into) => {
  for (const p of ["scripts", "package.json", "ci/witness/mcrk2", "ci/mg9"]) if (existsSync(join(ORG, p))) { mkdirSync(dirname(join(into, p)), { recursive: true }); cpSync(join(ORG, p), join(into, p), { recursive: true }); }
  if (NM) symlinkSync(NM, join(into, "node_modules"), process.platform === "win32" ? "junction" : "dir");
};
const lastOf = (r) => String(r.stdout || "").split(/\r?\n/).map((s) => s.trim()).filter(Boolean).pop() || "";
let k = 0;
for (const [id, name, file, anchor, repl] of MUTANTS) {
  const dir = mkdtempSync(join(ROOT, "m-"));
  copyOf(dir);
  const src = readFileSync(join(dir, file), "utf8");
  const hits = src.split(anchor).length - 1;
  if (hits !== 1) { console.log(`  GREEN mutant ${name} · its anchor occurs ${hits} time(s) in ${file}: the edit cannot land`); rmSync(dir, { recursive: true, force: true }); continue; }
  writeFileSync(join(dir, file), src.replace(anchor, repl));
  const t = Date.now();
  const r = spawnSync(process.execPath, [WITNESS, "--org", dir, "--base-org", BASE, "--only", id], { encoding: "utf8", windowsHide: true });
  const last = lastOf(r), why = (String(r.stdout || "").split(/\r?\n/).find((l) => l.includes(` ${id} · `)) || "").trim();
  const ok = r.status === 1 && last === `RED MG9 · ${id}`;
  if (ok) k++;
  console.log(`  ${ok ? "RED  " : "GREEN"} mutant ${name} → ${id} (${file}) · ${((Date.now() - t) / 1000).toFixed(1)} s · ${last} · ${why.slice(0, 220)}`);
  rmSync(dir, { recursive: true, force: true });
}
const c = spawnSync(process.execPath, [WITNESS, "--org", ORG, "--base-org", BASE], { encoding: "utf8", windowsHide: true });
const cl = lastOf(c);
console.log(`  control · ${cl.slice(0, 160)}`);
rmSync(ROOT, { recursive: true, force: true });
console.log(`run_mutants: ${k} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${c.status === 0 && cl.startsWith("GREEN MG9 ") ? "GREEN" : "RED"}`);
process.exit(k === MUTANTS.length && c.status === 0 ? 0 : 1);
