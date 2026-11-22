#!/usr/bin/env node
// ci/mciq/run_mutants_mciq.mjs — unit mciq (forks row 1256 (2)) · THE MUTANTS. Its header is its contract.
// ----------------------------------------------------------------------------------------------------------------------
// USAGE: node ci/mciq/run_mutants_mciq.mjs --org <build tree> --base-org <base tree>
//   Each mutant is a COPY of the build tree (node_modules and .git left out) under ONE temp root (mkdtemp under
//   os.tmpdir()) with ONE edit to its .github/workflows/suite.yml, judged by the unit witness against --base-org. The orgs
//   are read, never written. A mutant must read RED by exactly the clause that names it; the control (the copy, no edit)
//   must read GREEN. Every child is the witness (a node child, bounded by the npm-test job's own timeout-minutes read from
//   the build's suite.yml, never a number typed here). No port, no service, no model call.
// MUTANTS:
//   M1 LAND   · the land/** trigger dropped (`"!land/**"` appended to the push branches) — row 1256 (2)'s one named mutant.
//   M2 MAIN   · main dropped (`"!main"` appended).
//   M3 IGNORE · the ignore removed ~~(the push branches back to the match-all alone)~~ RE-CUT by unit mq3: the two mciq
//              negations (superseded/**, claude/*-queue) dropped, every other pattern kept — so it is RED by IGNORE alone.
//   M4 BUILD  · the old list restored (unit mq3, row 1289 (1)): `["**", "!superseded/**", "!claude/*-queue"]`, so a build
//              and a spec tip draw a run again.
// LAST LINE: `run_mutants: k of n mutant(s) RED by the clause that names them · control GREEN|RED` (exit 0 iff k = n and
//   the control is GREEN).
// ----------------------------------------------------------------------------------------------------------------------
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve, relative, sep, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const WITNESS = join(HERE, "witness_mciq.mjs");
const WF = join(".github", "workflows", "suite.yml");
const a = process.argv.slice(2), arg = (k) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : null; };
const org = arg("--org") ? resolve(String(arg("--org"))) : null, baseOrg = arg("--base-org") ? resolve(String(arg("--base-org"))) : null;
if (!org || !baseOrg || !existsSync(join(org, WF)) || !existsSync(join(baseOrg, WF))) { console.log("run_mutants: 0 of 4 mutant(s) RED by the clause that names them · control RED (--org and --base-org must each hold suite.yml)"); process.exit(1); }
const min = Number((/timeout-minutes:\s*(\d+)/.exec(readFileSync(join(org, WF), "utf8")) || [])[1]);
if (!(min > 0)) { console.log("run_mutants: 0 of 4 mutant(s) RED by the clause that names them · control RED (no timeout-minutes in the build's suite.yml)"); process.exit(1); }

const PUSH = /^(\s*branches:\s*)\[([^\]\r\n]*)\]/m;
/** @type {{id: string, clause: string, what: string, edit: (t: string) => string}[]} */
const MUTANTS = [
  { id: "M1", clause: "LAND", what: "the land/** trigger dropped", edit: (t) => t.replace(PUSH, (_, k, l) => `${k}[${l}, "!land/**"]`) },
  { id: "M2", clause: "MAIN", what: "main dropped", edit: (t) => t.replace(PUSH, (_, k, l) => `${k}[${l}, "!main"]`) },
  // ~~{ id: "M3", ..., edit: (t) => t.replace(PUSH, (_, k) => `${k}["**"]`) }~~ RE-CUT by unit mq3 (would also redden BUILD)
  { id: "M3", clause: "IGNORE", what: "the ignore removed", edit: (t) => t.replace(PUSH, (_, k, l) => `${k}[${l.split(",").map((x) => x.trim()).filter((x) => !/^["']!(superseded\/\*\*|claude\/\*-queue)["']$/.test(x)).join(", ")}]`) },
  { id: "M4", clause: "BUILD", what: "the old list restored (mq3's two exclusions dropped)", edit: (t) => t.replace(PUSH, (_, k) => `${k}["**", "!superseded/**", "!claude/*-queue"]`) },
];
const R = mkdtempSync(join(tmpdir(), "mciq-mut-"));
const plant = (name, edit) => {
  const d = join(R, name);
  cpSync(org, d, { recursive: true, filter: (s) => { const r = relative(org, s).split(sep)[0]; return r !== "node_modules" && r !== ".git"; } });
  if (edit) {
    const t = readFileSync(join(d, WF), "utf8"), m = edit(t);
    if (m === t) return null;                       // the edit found nothing to change: the mutant is not planted
    writeFileSync(join(d, WF), m);
  }
  return d;
};
const judge = (d) => {
  const r = spawnSync(process.execPath, [WITNESS, "--org", d, "--base-org", baseOrg], { encoding: "utf8", timeout: min * 60000, windowsHide: true });
  const last = String(r.stdout || "").split(/\r?\n/).map((s) => s.trim()).filter(Boolean).pop() || "(no line)";
  const m = /^RED MCIQ · (.*)$/.exec(last);
  return { code: r.status, last, reds: m ? m[1].split(/,\s*/) : [] };
};
let k = 0, control = false;
try {
  const c = plant("control", null), cj = judge(/** @type {string} */ (c));
  control = cj.code === 0 && cj.last.startsWith("GREEN MCIQ ");
  console.log(`  control · ${cj.last}`);
  for (const mu of MUTANTS) {
    const d = plant(mu.id, mu.edit);
    if (!d) { console.log(`  FAIL ${mu.id} ${mu.clause} · ${mu.what} · not planted (the push branches line was not found)`); continue; }
    const j = judge(d), ok = j.code === 1 && j.reds.length === 1 && j.reds[0] === mu.clause;
    if (ok) k++;
    console.log(`  ${ok ? "ok  " : "FAIL"} ${mu.id} ${mu.clause} · ${mu.what} · ${j.last}`);
  }
} finally {
  rmSync(R, { recursive: true, force: true });
}
console.log(`run_mutants: ${k} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${control ? "GREEN" : "RED"}`);
process.exit(k === MUTANTS.length && control ? 0 : 1);
