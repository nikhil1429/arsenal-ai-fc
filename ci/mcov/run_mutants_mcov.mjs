#!/usr/bin/env node
// ci/mcov/run_mutants_mcov.mjs — unit mcov · ONE MUTANT PER WITNESS CLAUSE. Header = contract.
// USAGE: node ci/mcov/run_mutants_mcov.mjs --org <build checkout>
//   Clones the build org's HEAD under os.tmpdir() (core.autocrlf=false, via the witness's plantClone), judges the
//   UNMUTATED clone (the control: every clause GREEN), then for each mutant re-plants a fresh clone, applies ONE exact
//   text edit (it refuses if the anchor is not found exactly once: a mutant that does not apply is not a mutant) and
//   judges it with the witness's own judge(); the mutant counts only if the clause that names it reads RED.
//   No port, no service, no live state; the temp root is removed and no process naming it may survive.
// LAST LINE: run_mutants: k of n mutant(s) RED by the clause that names them · control GREEN|RED  (exit 0 iff k = n and GREEN)
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { plantClone, judge, CLAUSES, survivors } from "./witness_mcov.mjs";

const MUTANTS = [
  { clause: "C1 COVERAGE", file: "scripts/organism_test.mjs", why: "deck_lint dropped from the roster",
    from: 'SUITE_ROSTER = Object.freeze(["deck_lint", "home_pin"', to: 'SUITE_ROSTER = Object.freeze(["home_pin"' },
  { clause: "C2 HERMETIC", file: "scripts/organism_test.mjs", why: "suites() skips the roster's hermetic members",
    from: "  for (const m of members) {\n    if (liveSelftest(m)) continue;   // B1 (b)",
    to: "  for (const m of members) {\n    if (SUITE_ROSTER.includes(m) && m !== \"home_pin\") continue;\n    if (liveSelftest(m)) continue;   // B1 (b)" },
  { clause: "C3 LIVE-NAMED", file: "scripts/organism_test.mjs", why: "home_pin's LIVE entry deleted (it would run hermetic)",
    from: '  "home_pin": "reads state/captain.json · reaches a localhost port it does not listen on",\n', to: "" },
  { clause: "C4 VERB", file: "scripts/study_scope.mjs", why: "the selftest verb no longer answers",
    from: 'if (mode === "selftest") {', to: 'if (mode === "selftest-gone") {' },
];

const argv = process.argv.slice(2);
const org = argv[argv.indexOf("--org") + 1];
if (!argv.includes("--org") || !org) { console.log("usage: node ci/mcov/run_mutants_mcov.mjs --org <build checkout>"); process.exit(2); }
const root = mkdtempSync(join(tmpdir(), "mcov-mutants-"));
let k = 0, control = false;
try {
  const c = judge(plantClone(org, mkdtempSync(join(root, "control-"))));
  control = CLAUSES.every((x) => c[x].green);
  console.log(`control · ${CLAUSES.map((x) => `${x} ${c[x].green ? "GREEN" : "RED"}`).join(" · ")}`);
  for (const m of MUTANTS) {
    const dir = plantClone(org, mkdtempSync(join(root, "m-")));
    const p = join(dir, m.file), src = readFileSync(p, "utf8");
    const hits = src.split(m.from).length - 1;
    if (hits !== 1) { console.log(`mutant ${m.clause} · NOT APPLIED (anchor found ${hits} time(s)) — ${m.why}`); continue; }
    writeFileSync(p, src.replace(m.from, m.to));
    const v = judge(dir);
    const red = !v[m.clause].green;
    if (red) k++;
    console.log(`mutant ${m.clause} · ${red ? "RED" : "SURVIVED"} by its clause (${v[m.clause].why}) — ${m.why}`);
  }
} finally {
  const live = survivors(root);
  if (live.length) { console.log(`LAST · ${live.length} process(es) name the temp dir: ${live.join(" | ")}`); control = false; }
  try { rmSync(root, { recursive: true, force: true }); } catch { /* Windows lock: litter, not a verdict */ }
}
console.log(`run_mutants: ${k} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${control ? "GREEN" : "RED"}`);
process.exit(k === MUTANTS.length && control ? 0 : 1);
