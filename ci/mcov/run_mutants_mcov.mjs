#!/usr/bin/env node
// ci/mcov/run_mutants_mcov.mjs — unit mcov · ONE MUTANT PER WITNESS CLAUSE. Header = contract.
// USAGE: node ci/mcov/run_mutants_mcov.mjs --org <build checkout>
//   Plants the build org under os.tmpdir() (the witness's plantTree: a core.autocrlf=false clone of a checkout), judges the
//   UNMUTATED clone (the control: every clause GREEN), then for each mutant re-plants a fresh clone, applies ONE exact
//   text edit (it refuses if the anchor is not found exactly once: a mutant that does not apply is not a mutant) and
//   judges it with the witness's own judgeAll() (every clause on one planted tree; all trees run concurrently); the mutant
//   counts only if the clause that names it reads RED.
//   No port, no service, no live state; the temp root is removed and no process naming it may survive.
// LAST LINE: run_mutants: k of n mutant(s) RED by the clause that names them · control GREEN|RED  (exit 0 iff k = n and GREEN)
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { plantTree, judgeAll, CLAUSES, BOUND_CLAUSES, survivors } from "./witness_mcov.mjs";

const MUTANTS = [
  { clause: "C1 COVERAGE", file: "package.json", why: "deck_lint dropped from its package.json suite string",
    from: " && node scripts/deck_lint.mjs selftest", to: "" },
  { clause: "C2 HERMETIC", file: "scripts/organism_test.mjs", why: "suites() skips the three hermetic members",
    from: "  for (const m of members) {\n    if (liveSelftest(m)) continue;   // B1 (b)",
    to: "  for (const m of members) {\n    if (/^(deck_lint|probe|study_scope)$/.test(m)) continue;\n    if (liveSelftest(m)) continue;   // B1 (b)" },
  { clause: "C3 LIVE-NAMED", file: "scripts/organism_test.mjs", why: "home_pin's LIVE entry deleted (it would run hermetic)",
    from: '  "home_pin": "reads state/captain.json · reaches a localhost port it does not listen on",\n', to: "" },
  { clause: "C4 VERB", file: "scripts/study_scope.mjs", why: "the selftest verb no longer answers",
    from: 'if (mode === "selftest") {', to: 'if (mode === "selftest-gone") {' },
  { clause: "C5 ONE RECORD", file: "scripts/organism_test.mjs", why: "a second member list beside package.json (the removed roster, re-added)",
    from: 'const SUITE_NAMES = ["organism:selftest", "squad:selftest", "audit:selftest"];\n',
    to: 'const SUITE_NAMES = ["organism:selftest", "squad:selftest", "audit:selftest"];\nexport const SUITE_ROSTER = Object.freeze(["deck_lint", "home_pin", "probe", "study_scope"]);\n' },
  // forks row 1151 (1)
  { clause: "C6 SLOW-GREEN", file: "scripts/organism_test.mjs", why: "the suites member run back on the helper's default bound (a race, not a hang guard)",
    from: "    const r = kept || run(args, { timeout: MEMBER_BOUND_MS });", to: "    const r = kept || run(args);" },
  { clause: "C7 HANG-NAMED", file: "scripts/organism_test.mjs", why: "a kill by the bound read as a bare exit again",
    from: "const redWhy = (r) => r.killed ? `killed by the suite bound (${r.killed} ms) — not an exit code` : `exit ${r.code}`;",
    to: "const redWhy = (r) => `exit ${r.code}`;" },
];

const argv = process.argv.slice(2);
const org = argv[argv.indexOf("--org") + 1];
if (!argv.includes("--org") || !org) { console.log("usage: node ci/mcov/run_mutants_mcov.mjs --org <build checkout>"); process.exit(2); }
const root = mkdtempSync(join(tmpdir(), "mcov-mutants-"));
let k = 0, control = false;
const apply = (m) => {
  const dir = plantTree(org, mkdtempSync(join(root, "m-")));
  const p = join(dir, m.file), src = readFileSync(p, "utf8");
  const hits = src.split(m.from).length - 1;
  if (hits !== 1) { console.log(`mutant ${m.clause} · NOT APPLIED (anchor found ${hits} time(s)) — ${m.why}`); return null; }
  writeFileSync(p, src.replace(m.from, m.to));
  return dir;
};
const tally = (m, v) => { const red = !v[m.clause].green; if (red) k++; console.log(`mutant ${m.clause} · ${red ? "RED" : "SURVIVED"} by its clause (${v[m.clause].why}) — ${m.why}`); };
try {
  const runs = [{ m: null, p: judgeAll(plantTree(org, mkdtempSync(join(root, "control-")))) }];
  for (const m of MUTANTS) { const d = apply(m); if (d) runs.push({ m, p: judgeAll(d) }); }
  for (const { m, p } of runs) {
    const v = await p;
    if (!m) { control = [...CLAUSES, ...BOUND_CLAUSES].every((x) => v[x].green); console.log(`control · ${[...CLAUSES, ...BOUND_CLAUSES].map((x) => `${x} ${v[x].green ? "GREEN" : "RED"}`).join(" · ")}`); }
    else tally(m, v);
  }
} finally {
  const live = survivors(root);
  if (live.length) { console.log(`LAST · ${live.length} process(es) name the temp dir: ${live.join(" | ")}`); control = false; }
  try { rmSync(root, { recursive: true, force: true }); } catch { /* Windows lock: litter, not a verdict */ }
}
console.log(`run_mutants: ${k} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${control ? "GREEN" : "RED"}`);
process.exit(k === MUTANTS.length && control ? 0 : 1);
