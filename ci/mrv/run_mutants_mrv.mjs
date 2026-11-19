#!/usr/bin/env node
// ============================================================================
// ci/mrv/run_mutants_mrv.mjs — one mutant per clause of ci/mrv/witness_mrv.mjs, each RED by the clause that names it
//   node ci/mrv/run_mutants_mrv.mjs --org <build tree> --base-org <base tree>
// Each mutant is a COPY under os.tmpdir() of the build tree's parts the witness reads (scripts/ setup/ package.json the state
// dir ci/mlv1 ci/mlv2 ci/mlv3) with ONE edit to ONE keeper witness, the repair its clause stands on reverted; the edit is
// applied only if its anchor occurs exactly once (else that mutant is itself RED: an edit that cannot land proves nothing).
// The witness runs `--only <clause>` over it and must print `RED MRV · <clause>`. The control is the build tree itself over
// every clause at once (with --base-org, so BOUND runs too): GREEN. BOUND and LAST are seat-time clauses with no mutant.
// Every wait is a child's exit (each child's own waits are bounded); no port is bound here.
// LAST LINE: run_mutants: k of n mutant(s) RED by the clause that names them · control GREEN|RED
// ============================================================================
import { spawnSync } from "node:child_process";
import { mkdtempSync, cpSync, readFileSync, writeFileSync, rmSync, existsSync, symlinkSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";

const arg = (k) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : null; };
const ORG = arg("--org") && resolve(arg("--org")), BASE = arg("--base-org") && resolve(arg("--base-org"));
if (!ORG || !BASE) { console.log("run_mutants: usage --org <dir> --base-org <dir>"); process.exit(1); }
const WITNESS = join(dirname(fileURLToPath(import.meta.url)), "witness_mrv.mjs");
const W1 = "ci/mlv1/witness_mlv1.mjs", W2 = "ci/mlv2/witness_mlv2.mjs", W3 = "ci/mlv3/witness_mlv3.mjs";
const ROOT = mkdtempSync(join(os.tmpdir(), "mutants-mrv-"));

const BOOT_REVERT = ["const b = await bootUp(() => true), up = b.s;", "const up = await waitFor(portUp, BOOT0), b = { why: \"mutant: one sample\" };"];
const READY_REMOVED = ['const s = await portUp(); if (s) { READY_WHY = "inherited a keeper"; return s; }', 'const s = await portUp(); if (s) { READY_WHY = "inherited a keeper"; return s; } READY_WHY = "mutant: no keeper of its own"; return null;'];
/** [clause id, file, anchor, replacement] */
const MUTANTS = [
  ["M1 RESTART", W1, "const b = await bootUp((s) => s.open), s1 = b.s;", "const s1 = await waitFor(async () => { const s = await portUp(); return s && s.open ? s : null; }, BOUND), b = { why: \"mutant: one sample\" };"],
  ["M1 PORTHELD", W1, "{ const f = await portFreed(); if (!f.ok) return f; }   // UNIT mrv (a-2)", "// mutant: no port-free wait after the kill"],
  ["M1 ALONE", W1, 'let s1 = await portUp(), pre = "inherited an idle keeper";', 'let s1 = await portUp(), pre = "inherited an idle keeper"; if (!s1) { await killTree(judge); return { ok: false, why: "no daemon up (mutant: no keeper of its own)" }; }'],
  ["M2 BOOT", W2, ...BOOT_REVERT],
  ["M2 ALONE", W2, ...READY_REMOVED],
  ["M3 BOOT", W3, ...BOOT_REVERT],
  ["M3 ALONE", W3, ...READY_REMOVED],
];
const copyOf = (into) => {
  for (const p of ["scripts", "setup", "package.json", "dressing-room/state", "ci/mlv1", "ci/mlv2", "ci/mlv3"]) if (existsSync(join(ORG, p))) cpSync(join(ORG, p), join(into, p), { recursive: true });
  if (existsSync(join(ORG, "node_modules"))) symlinkSync(join(ORG, "node_modules"), join(into, "node_modules"), process.platform === "win32" ? "junction" : "dir");
};
const lastOf = (r) => String(r.stdout || "").split(/\r?\n/).map((s) => s.trim()).filter(Boolean).pop() || "";
let k = 0;
for (const [id, file, anchor, repl] of MUTANTS) {
  const name = id;
  const dir = mkdtempSync(join(ROOT, "m-"));
  copyOf(dir);
  const src = readFileSync(join(dir, file), "utf8");
  const hits = src.split(anchor).length - 1;
  if (hits !== 1) { console.log(`  RED   mutant ${name} · its anchor occurs ${hits} time(s) in ${file}: the edit cannot land`); continue; }
  writeFileSync(join(dir, file), src.replace(anchor, repl));
  const t = Date.now();
  const r = spawnSync(process.execPath, [WITNESS, "--org", dir, "--only", id], { encoding: "utf8", windowsHide: true });
  const last = lastOf(r), why = (String(r.stdout || "").split(/\r?\n/).find((l) => l.includes(` ${id} · `)) || "").trim();
  const ok = r.status === 1 && last === `RED MRV · ${name}`;
  if (ok) k++;
  console.log(`  ${ok ? "RED  " : "GREEN"} mutant ${name} (${file}) · ${((Date.now() - t) / 1000).toFixed(1)} s · ${last} · ${why.slice(0, 260)}`);
  rmSync(dir, { recursive: true, force: true });
}
const c = spawnSync(process.execPath, [WITNESS, "--org", ORG, "--base-org", BASE], { encoding: "utf8", windowsHide: true });
const cl = lastOf(c);
console.log(`  control · ${cl}`);
rmSync(ROOT, { recursive: true, force: true });
console.log(`run_mutants: ${k} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${c.status === 0 && cl.startsWith("GREEN MRV ") ? "GREEN" : "RED"}`);
process.exit(k === MUTANTS.length && c.status === 0 ? 0 : 1);
