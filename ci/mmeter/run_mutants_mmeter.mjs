#!/usr/bin/env node
// ============================================================================
// ci/mmeter/run_mutants_mmeter.mjs — UNIT mmeter · ONE MUTANT PER CLAUSE (spec ci/mwit/MWIT_SPEC.md @ 88bf69d, (d) of each)
// ----------------------------------------------------------------------------
// USAGE: node ci/mmeter/run_mutants_mmeter.mjs
//   For the control and each mutant: a COPY of this tree's scripts/, ci/witness/mmeter/, package.json and the TRACKED
//   registry.json (read, never printed) under os.tmpdir() (prefix mmeter-mut-), node_modules riding as a link (a junction on
//   Windows); the mutant's ONE text replacement is applied there (it must match exactly once, else the mutant is INVALID);
//   then the copy's own witness runs `plants` and the CLAUSE line of the clause the mutant names is read.
//   A mutant counts iff THAT clause reads RED. The control (no mutation) must read every clause GREEN.
// No port, no network, no model, no service; every child is spawnSync; the copies are removed before exit.
// LAST LINE: run_mutants: k of n mutant(s) RED by the clause that names them · control GREEN|RED   (exit 0 iff k === n, GREEN)
// ============================================================================
import { readFileSync, writeFileSync, cpSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const MUTANTS = [
  { id: "M1", clause: "A:day-11", file: "scripts/daily_green.mjs", from: "process.exit(exitOf(out.row));", to: "process.exit(0);",
    what: "the owner's strict exit → always 0 (spec (d): the planted 5/11 day exits 0)" },
  { id: "M2", clause: "A:day-11", file: "ci/witness/mmeter/witness_meter.mjs", from: "const ok = row.greens === 11 && row.study", to: "const ok = row.greens >= 5 && row.study",
    what: "the witness's `greens === 11` → `greens >= 5` (spec (d) witness mutant)" },
  { id: "M3", clause: "A:old-day-red", file: "ci/witness/mmeter/witness_meter.mjs", from: "return last.green === true ?", to: "return last.green !== false ?",
    what: "the old-day verdict `green === true` → `green !== false` (spec (d): the null row must stay 2)" },
];

function copyOf() {
  const root = mkdtempSync(join(tmpdir(), "mmeter-mut-"));
  cpSync(join(REPO, "scripts"), join(root, "scripts"), { recursive: true });
  cpSync(join(REPO, "ci", "witness", "mmeter"), join(root, "ci", "witness", "mmeter"), { recursive: true });
  cpSync(join(REPO, "package.json"), join(root, "package.json"));
  mkdirSync(join(root, "dressing-room", "state"), { recursive: true });
  writeFileSync(join(root, "dressing-room", "state", "registry.json"), readFileSync(join(REPO, "dressing-room", "state", "registry.json")));
  if (existsSync(join(REPO, "node_modules"))) symlinkSync(join(REPO, "node_modules"), join(root, "node_modules"), process.platform === "win32" ? "junction" : "dir");
  return root;
}
function clausesOf(root) {
  const r = spawnSync(process.execPath, [join(root, "ci", "witness", "mmeter", "witness_meter.mjs"), "plants"], { cwd: root, encoding: "utf8", windowsHide: true });
  const by = {};
  for (const l of String(r.stdout || "").split(/\r?\n/)) { const m = /^CLAUSE (\S+) (GREEN|RED) · /.exec(l); if (m) by[m[1]] = m[2]; }
  return { by, exit: r.status };
}

let k = 0;
for (const m of MUTANTS) {
  const root = copyOf();
  try {
    const p = join(root, m.file), src = readFileSync(p, "utf8");
    if (src.split(m.from).length !== 2) { console.log(`  ${m.id} INVALID · ${m.file}: the replacement matches ${src.split(m.from).length - 1} time(s), not once`); continue; }
    writeFileSync(p, src.replace(m.from, m.to));
    const c = clausesOf(root);
    const red = c.by[m.clause] === "RED";
    if (red) k++;
    console.log(`  ${m.id} ${red ? "RED " : "LIVE"} by ${m.clause} (${c.by[m.clause] || "no CLAUSE line"}) · ${m.what}`);
  } finally { rmSync(root, { recursive: true, force: true }); }
}
const root = copyOf();
let control;
try { control = clausesOf(root); } finally { rmSync(root, { recursive: true, force: true }); }
const cg = control.exit === 0 && ["A:day-11", "A:old-day-red"].every((id) => control.by[id] === "GREEN");
console.log(`  control ${cg ? "GREEN" : "RED"} · ${JSON.stringify(control.by)} · exit ${control.exit}`);
console.log(`run_mutants: ${k} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${cg ? "GREEN" : "RED"}`);
process.exitCode = k === MUTANTS.length && cg ? 0 : 1;
