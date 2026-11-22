#!/usr/bin/env node
// ci/mq3/run_mutants_mq3.mjs — unit mq3 (forks row 1289 (1)) · THE MUTANTS. Its header is its contract.
// ----------------------------------------------------------------------------------------------------------------------
// USAGE: node ci/mq3/run_mutants_mq3.mjs --org <build tree> --base-org <base tree>
//   Each mutant is a COPY of the build tree (node_modules and .git left out) under ONE temp root (mkdtemp under
//   os.tmpdir()) with ONE edit to its .github/workflows/suite.yml, judged by the unit witness against --base-org. The orgs
//   are read, never written. A mutant must read RED by exactly the clause that names it; the control (the copy, no edit)
//   must read GREEN. Every child is the witness (a node child, bounded by the npm-test job's own timeout-minutes read from
//   the build's suite.yml, never a number typed here). No port, no service, no model call, no git repo planted.
// MUTANTS (one edit each, to the push branches list unless named otherwise):
//   M1 LAND   · land/** dropped (`"!land/**"` appended).
//   M2 MAIN   · main dropped (`"!main"` appended).
//   M3 BUILD  · the build exclusion removed (`"!claude/*-build"` taken out).
//   M4 SPEC   · the spec exclusion removed (`"!claude/*-spec"` taken out).
//   M5 LAND   · a pattern that also swallows land/**: the build exclusion written wide, `"!**-build"` (it swallows
//               land/mq3-build — a land tip must run whatever its unit's name ends in).
//   M6 OTHER  · a pattern that swallows every other claude/* branch: `"!claude/**"` appended.
//   M7 IGNORE · mciq's two exclusions removed (`"!superseded/**"`, `"!claude/*-queue"` taken out).
//   M8 LEGS   · the npm-test job's matrix cut to `[22]`.
//   M9 KEEP   · the concurrency block changed (`cancel-in-progress: false`).
// LAST LINE: `run_mutants: k of n mutant(s) RED by the clause that names them · control GREEN|RED` (exit 0 iff k = n and
//   the control is GREEN).
// ----------------------------------------------------------------------------------------------------------------------
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve, relative, sep, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const WITNESS = join(HERE, "witness_mq3.mjs");
const WF = join(".github", "workflows", "suite.yml");
const PUSH = /^(\s*branches:\s*)\[([^\]\r\n]*)\]/m;
/** the push list with the items <drop> removed @param {string} l @param {string[]} drop */
const without = (l, drop) => l.split(",").map((x) => x.trim()).filter((x) => !drop.includes(x.replace(/^["']|["']$/g, ""))).join(", ");
/** @type {{id: string, clause: string, what: string, edit: (t: string) => string}[]} */
const MUTANTS = [
  { id: "M1", clause: "LAND", what: "land/** dropped", edit: (t) => t.replace(PUSH, (_, k, l) => `${k}[${l}, "!land/**"]`) },
  { id: "M2", clause: "MAIN", what: "main dropped", edit: (t) => t.replace(PUSH, (_, k, l) => `${k}[${l}, "!main"]`) },
  { id: "M3", clause: "BUILD", what: "the build exclusion removed", edit: (t) => t.replace(PUSH, (_, k, l) => `${k}[${without(l, ["!claude/*-build"])}]`) },
  { id: "M4", clause: "SPEC", what: "the spec exclusion removed", edit: (t) => t.replace(PUSH, (_, k, l) => `${k}[${without(l, ["!claude/*-spec"])}]`) },
  { id: "M5", clause: "LAND", what: "a pattern that also swallows land/** (\"!**-build\")", edit: (t) => t.replace(PUSH, (_, k, l) => `${k}[${l.replace(/["']!claude\/\*-build["']/, '"!**-build"')}]`) },
  { id: "M6", clause: "OTHER", what: "every other claude/* branch swallowed (\"!claude/**\")", edit: (t) => t.replace(PUSH, (_, k, l) => `${k}[${l}, "!claude/**"]`) },
  { id: "M7", clause: "IGNORE", what: "mciq's two exclusions removed", edit: (t) => t.replace(PUSH, (_, k, l) => `${k}[${without(l, ["!superseded/**", "!claude/*-queue"])}]`) },
  { id: "M8", clause: "LEGS", what: "npm-test's matrix cut to [22]", edit: (t) => t.replace(/(\n {2}npm-test:[\s\S]*?\n\s+node:\s*)\[22, 24\]/, "$1[22]") },
  { id: "M9", clause: "KEEP", what: "the concurrency block changed", edit: (t) => t.replace(/(\nconcurrency:[\s\S]*?cancel-in-progress:\s*)true/, "$1false") },
];
const a = process.argv.slice(2), arg = (k) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : null; };
const org = arg("--org") ? resolve(String(arg("--org"))) : null, baseOrg = arg("--base-org") ? resolve(String(arg("--base-org"))) : null;
const fail = (why) => { console.log(`run_mutants: 0 of ${MUTANTS.length} mutant(s) RED by the clause that names them · control RED (${why})`); process.exit(1); };
if (!org || !baseOrg || !existsSync(join(org, WF)) || !existsSync(join(baseOrg, WF))) fail("--org and --base-org must each hold suite.yml");
const min = Number((/timeout-minutes:\s*(\d+)/.exec(readFileSync(join(/** @type {string} */ (org), WF), "utf8")) || [])[1]);
if (!(min > 0)) fail("no timeout-minutes in the build's suite.yml");

const R = mkdtempSync(join(tmpdir(), "mq3-mut-"));
/** @param {string} name @param {((t: string) => string) | null} edit */
const plant = (name, edit) => {
  const d = join(R, name), src = /** @type {string} */ (org);
  cpSync(src, d, { recursive: true, filter: (s) => { const r = relative(src, s).split(sep)[0]; return r !== "node_modules" && r !== ".git"; } });
  if (edit) {
    const t = readFileSync(join(d, WF), "utf8"), m = edit(t);
    if (m === t) return null;                       // the edit found nothing to change: the mutant is not planted
    writeFileSync(join(d, WF), m);
  }
  return d;
};
/** @param {string} d */
const judge = (d) => {
  const r = spawnSync(process.execPath, [WITNESS, "--org", d, "--base-org", /** @type {string} */ (baseOrg)], { encoding: "utf8", timeout: min * 60000, windowsHide: true });
  const last = String(r.stdout || "").split(/\r?\n/).map((s) => s.trim()).filter(Boolean).pop() || "(no line)";
  const m = /^RED MQ3 · (.*)$/.exec(last);
  return { code: r.status, last, reds: m ? m[1].split(/,\s*/) : [] };
};
let k = 0, control = false;
try {
  const c = plant("control", null), cj = judge(/** @type {string} */ (c));
  control = cj.code === 0 && cj.last.startsWith("GREEN MQ3 ");
  console.log(`  control · ${cj.last}`);
  for (const mu of MUTANTS) {
    const d = plant(mu.id, mu.edit);
    if (!d) { console.log(`  FAIL ${mu.id} ${mu.clause} · ${mu.what} · not planted (its edit found nothing to change)`); continue; }
    // BOUND is a seat-time clause: a mutant's one edit is inside suite.yml, a named file, so BOUND stays green on it
    const j = judge(d), ok = j.code === 1 && j.reds.length === 1 && j.reds[0] === mu.clause;
    if (ok) k++;
    console.log(`  ${ok ? "ok  " : "FAIL"} ${mu.id} ${mu.clause} · ${mu.what} · ${j.last}`);
  }
} finally {
  rmSync(R, { recursive: true, force: true });
}
console.log(`run_mutants: ${k} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${control ? "GREEN" : "RED"}`);
process.exit(k === MUTANTS.length && control ? 0 : 1);
