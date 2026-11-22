#!/usr/bin/env node
// ci/mstrike/run_mutants_mstrike.mjs — unit mstrike · one mutant per clause (C:capability-c22, spec (d)) plus its sibling.
// USAGE: node ci/mstrike/run_mutants_mstrike.mjs --org <build tree> --base-org <base tree>
// Each mutant: a copy of the whole --org tree (never .git, never node_modules) under os.tmpdir(), ONE anchored edit to the copied reader (the anchor must occur exactly once), then the copied witness runs its plants
// with --org <the copy> --only c22. A mutant is KILLED when that run exits 1 and its last line names C22. The control (no
// edit) must read GREEN. Binds no port, names no live service; every spawn is bounded by suite.yml timeout-minutes of --org.
import { readFileSync, writeFileSync, mkdtempSync, cpSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";

const argv = process.argv.slice(2);
const flag = (k) => { const i = argv.indexOf(k); return i > -1 ? argv[i + 1] : null; };
const org = flag("--org"), base = flag("--base-org");
const W = ["ci", "witness", "mstrike", "witness_strike.mjs"];
const MUTANTS = [
  // spec (d): accept "asked anywhere in the sitting" → the asked-third plant (C22.2) goes 0
  { id: "M1 C22 asked anywhere in the sitting", from: "const turn = T.firstTurn;", to: "const turn = T.all;" },
  // the "before any other question" law dropped → the other-question-first plant (C22.3) goes 0
  { id: "M2 C22 another question may come first", from: "return q < 0 || i < q;", to: "return true;" },
];
if (!org || !base) { console.log("run_mutants: usage --org <dir> --base-org <dir>"); process.exit(2); }
const m = /timeout-minutes:\s*(\d+)/.exec(readFileSync(join(org, ".github", "workflows", "suite.yml"), "utf8"));
const JOB_MS = m ? Number(m[1]) * 60000 : 0;
if (!JOB_MS) { console.log("run_mutants: the bound (suite.yml timeout-minutes) is unreadable in --org"); process.exit(2); }
function run(mu) {
  const root = mkdtempSync(join(tmpdir(), "mstrike-mut-"));
  try {
    cpSync(org, root, { recursive: true, filter: (src) => !/[\\/](\.git|node_modules)$/.test(src) });
    const p = join(root, ...W);
    if (mu) {
      const src = readFileSync(p, "utf8");
      const n = src.split(mu.from).length - 1;
      if (n !== 1) return { exit: null, last: `anchor occurs ${n} time(s), not once` };
      writeFileSync(p, src.replace(mu.from, mu.to));
    }
    const r = spawnSync(process.execPath, [p, "--org", root, "--base-org", base, "--only", "c22"], { cwd: root, encoding: "utf8", windowsHide: true, timeout: JOB_MS });
    return { exit: r.status, last: String(r.stdout || "").split(/\r?\n/).filter((l) => l.trim()).at(-1) || "" };
  } finally { rmSync(root, { recursive: true, force: true }); }
}
let k = 0;
for (const mu of MUTANTS) {
  const r = run(mu);
  const killed = r.exit === 1 && /^RED MSTRIKE · .*\bC22\b/.test(r.last);
  if (killed) k++;
  console.log(`  ${killed ? "KILLED" : "LIVE  "} ${mu.id} · exit ${r.exit} · ${r.last.slice(0, 160)}`);
}
const c = run(null);
const controlGreen = c.exit === 0 && /^GREEN MSTRIKE /.test(c.last);
console.log(`  control · exit ${c.exit} · ${c.last.slice(0, 160)}`);
console.log(`run_mutants: ${k} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${controlGreen ? "GREEN" : "RED"}`);
process.exitCode = k === MUTANTS.length && controlGreen ? 0 : 1;
