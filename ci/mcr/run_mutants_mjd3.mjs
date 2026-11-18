#!/usr/bin/env node
// run_mutants_mjd3.mjs — one mutant per clause of ci/mcr/witness_mjd3.mjs, each on a COPY of the build tree under
// os.tmpdir(); a mutant counts only when the witness goes RED BY THE CLAUSE THAT NAMES IT. The control (no mutation) must
// be GREEN. LAST has no mutant: it is a property of the witness's own cleanup, named here, never counted.
//   node ci/mcr/run_mutants_mjd3.mjs --org <build tree> --base-org <base tree>
// LAST LINE: run_mutants: k of n mutant(s) RED by the clause that names them · control GREEN|RED
import { mkdtempSync, cpSync, readFileSync, writeFileSync, rmSync, appendFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const ORG = resolve(arg("--org")), BASE = resolve(arg("--base-org"));
const WIT = join(dirname(fileURLToPath(import.meta.url)), "witness_mjd3.mjs");
const GB = "scripts/gaffer_brain.mjs";
const MUTANTS = [
  { clause: "J1", what: "the tail reserve is zero (the call is killed at all that remains)", file: GB,
    from: "return (items || []).reduce((sum, it) => sum + 2 * JUDGE_DISPATCH_MS + (SECOND_JUDGE_TYPES.includes(it && it.type) ? WATCHER_DEADLINE_MS : 0), 0);", to: "return 0;" },
  { clause: "J2", what: "the settle never re-reads what remains", file: GB,
    from: "  const settleBatch = async (items, prompt, r) => {\n", to: "  const settleBatch = async (items, prompt, r) => {\n    const left = () => Infinity;\n" },
  { clause: "J3", what: "the second opinion is handed no deadline", file: GB,
    from: "const two = await secondWithin(item, Math.min(WATCHER_DEADLINE_MS, room));", to: "const two = await second(item);" },
  { clause: "J4", what: "a write-ahead row does not take a capture out of the queue", file: GB,
    from: "(r.kind === \"settled\" || r.kind === DISPATCHING_KIND)", to: "r.kind === \"settled\"" },
  { clause: "BOUND", what: "a caller moves too (scripts/sitting.mjs touched)", file: "scripts/sitting.mjs", append: "\n// mutant\n" },
];
const runWitness = (org) => {
  const r = spawnSync(process.execPath, [WIT, "--org", org, "--base-org", BASE], { encoding: "utf8" });
  const lines = String(r.stdout || "").trim().split(/\r?\n/);
  return { code: r.status, last: lines[lines.length - 1] || "" };
};
let k = 0;
for (const m of MUTANTS) {
  const dir = mkdtempSync(join(tmpdir(), "mjd3mut-"));
  cpSync(ORG, dir, { recursive: true });
  const p = join(dir, m.file);
  if (m.append) appendFileSync(p, m.append);
  else {
    const s = readFileSync(p, "utf8");
    if (s.split(m.from).length !== 2) { console.log(`MUTANT ${m.clause} · NOT APPLIED (its anchor is not exactly once in ${m.file}) — counts as not RED`); rmSync(dir, { recursive: true, force: true }); continue; }
    writeFileSync(p, s.replace(m.from, m.to));
  }
  const w = runWitness(dir);
  const redBy = w.code === 1 && new RegExp(`^RED MJD3 · (.* )?${m.clause}( |$)`).test(w.last);
  if (redBy) k++;
  console.log(`MUTANT ${m.clause} · ${m.what} → ${w.last} · ${redBy ? "RED by its clause" : "NOT RED by its clause"}`);
  rmSync(dir, { recursive: true, force: true });
}
const c = runWitness(ORG);
const ctrl = c.code === 0 && /^GREEN MJD3 /.test(c.last);
console.log(`CONTROL · ${c.last}`);
console.log(`run_mutants: ${k} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${ctrl ? "GREEN" : "RED"} (LAST has no mutant: the witness's own cleanup)`);
process.exit(k === MUTANTS.length && ctrl ? 0 : 1);
