#!/usr/bin/env node
// ============================================================================
// ci/mgs/run_mutants_mgs.mjs · unit mgs (forks row 1087 (3)) — ONE MUTANT PER CLAUSE of ci/mgs/witness_mgs.mjs.
// CONTRACT: node ci/mgs/run_mutants_mgs.mjs --org <build dir> --base-org <base dir>
//   · each mutant is ONE exact text replacement in <org>/scripts/groundsman.mjs (it must apply exactly once, else the
//     mutant itself is RED), written with the groundsman's relative-import closure (read from the source, never a typed
//     list) into a fresh dir under os.tmpdir(); the witness then runs with --org <mutant dir> --base-org <base dir>.
//   · a mutant COUNTS only when the witness exits 1 AND the clause that names it is RED.
//   · the control (the unmutated org) must end GREEN, exit 0; each mutant's run is bounded by the control's own
//     measured wall time, counted twice (derived in this run, never typed).
//   · no port, no network, no model: the witness's own contract holds for every run.
// LAST LINE: `run_mutants: k of n mutant(s) RED by the clause that names them · control GREEN` (exit 0 iff k = n and
//   the control is GREEN; else the same line with `control RED` / k < n, exit 1).
// ============================================================================
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { join, resolve, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";

const arg = (k) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : null; };
const ORG = resolve(arg("--org") || "."), BASE = arg("--base-org");
if (!BASE) { console.log("run_mutants: usage --org <dir> --base-org <dir>"); process.exit(1); }
const WITNESS = join(dirname(fileURLToPath(import.meta.url)), "witness_mgs.mjs");
const SRC = join(ORG, "scripts", "groundsman.mjs");
const src = readFileSync(SRC, "utf8");

const MUTANTS = [
  ["C1", "the unattended push never waits", "  if (lw.holding.length) return withVerdict({", "  if (false) return withVerdict({"],
  ["C2", "a land ref main (or this push) already holds still holds",
    '    if (run("git", ["merge-base", "--is-ancestor", x.sha, "@{u}"]).ok) continue;   // landed: main already holds it\n    if (run("git", ["merge-base", "--is-ancestor", x.sha, "HEAD"]).ok) continue;   // carried by this push (the L4 landing)\n', ""],
  ["C3", "the age is never consulted (an abandoned ref holds for ever)", "(ageH > LAND_HOLD_MAX_H ? stale : holding)", "(false ? stale : holding)"],
  ["C4", "the land refs are read once per process (the next pass never reads again)",
    "function landHold(run, now = new Date()) {\n", "let _lhc = null;\nfunction landHold(run, now = new Date()) { if (!_lhc) _lhc = landHold0(run, now); return _lhc; }\nfunction landHold0(run, now = new Date()) {\n"],
  ["C5", "the L4 landing this push carries is held like a judged ref",
    '    if (run("git", ["merge-base", "--is-ancestor", x.sha, "HEAD"]).ok) continue;   // carried by this push (the L4 landing)\n', ""],
  ["C6", "a remote that cannot be read is taken as no land refs (a silent push)",
    "  if (!ls.ok) return fail(\"origin's land refs could not be read\", ls);", "  if (!ls.ok) return { ok: true, holding: [], stale: [], line: \"\" };"],
  ["C7", "the Kennel's night pass never waits", "  if (lw.holding.length) return { ok: true, ticked: true,", "  if (false) return { ok: true, ticked: true,"],
];

// the relative-import closure of the groundsman, read from the source itself
function closure(entry) {
  const seen = new Set(), todo = [entry];
  while (todo.length) {
    const f = todo.pop(); if (seen.has(f)) continue; seen.add(f);
    const s = readFileSync(f, "utf8");
    for (const m of s.matchAll(/(?:^|[\s;])(?:import|export)\s[^;]*?\bfrom\s*["'](\.{1,2}\/[^"']+)["']/g)) { const p = resolve(dirname(f), m[1]); if (existsSync(p)) todo.push(p); }
  }
  return [...seen];
}
const FILES = closure(SRC);
const ROOT = mkdtempSync(join(os.tmpdir(), "mgs-mutants-"));
function tree(name, text) {
  const d = join(ROOT, name);
  for (const f of FILES) { const to = join(d, relative(ORG, f)); mkdirSync(dirname(to), { recursive: true }); writeFileSync(to, f === SRC ? text : readFileSync(f)); }
  return d;
}
function witness(org, bound) {
  const r = spawnSync(process.execPath, [WITNESS, "--org", org, "--base-org", BASE], { encoding: "utf8", windowsHide: true, stdio: ["ignore", "pipe", "pipe"], ...(bound ? { timeout: bound } : {}) });
  const out = String(r.stdout || "") + String(r.stderr || "");
  const ls = out.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  return { code: r.status, last: ls[ls.length - 1] || "", red: ls.filter((l) => /^RED\s+C\d/.test(l)).map((l) => l.split(/\s+/)[1]), err: r.error ? String(r.error.message) : "" };
}

const t0 = Date.now();
const control = witness(tree("control", src), 0);
const BOUND = (Date.now() - t0) + (Date.now() - t0);
const controlGreen = control.code === 0 && /^GREEN MGS/.test(control.last);
console.log(`control · exit ${control.code} · ${control.last}`);
let k = 0;
for (const [clause, what, from, to] of MUTANTS) {
  const hits = src.split(from).length - 1;
  if (hits !== 1) { console.log(`RED   mutant ${clause} (${what}) · its text applies ${hits} time(s), not once — the mutant is void`); continue; }
  const w = witness(tree(`m${clause}`, src.replace(from, to)), BOUND);
  const killed = w.code === 1 && w.red.includes(clause);
  if (killed) k++;
  console.log(`${killed ? "KILLED" : "SURVIVED"} mutant ${clause} (${what}) · exit ${w.code} · RED clauses [${w.red.join(", ")}]${w.err ? " · " + w.err : ""} · ${w.last}`);
}
try { rmSync(ROOT, { recursive: true, force: true }); } catch {}
const ok = controlGreen && k === MUTANTS.length;
console.log(`run_mutants: ${k} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${controlGreen ? "GREEN" : "RED"}`);
process.exit(ok ? 0 : 1);
