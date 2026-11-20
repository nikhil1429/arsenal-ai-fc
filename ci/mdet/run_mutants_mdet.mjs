#!/usr/bin/env node
// ci/mdet/run_mutants_mdet.mjs — unit mdet · ONE MUTANT PER WITNESS CLAUSE. Header = contract.
// USAGE: node ci/mdet/run_mutants_mdet.mjs --org <build checkout>
//   Plants the build org under os.tmpdir() (the witness's plantTree: a core.autocrlf=false clone of a checkout, or a copy of
//   a plain tree), judges the UNMUTATED tree (the control: every clause GREEN), then for each mutant plants a fresh tree,
//   applies ONE exact text edit to scripts/organism_test.mjs (it refuses if the anchor is not found exactly once: a mutant
//   that does not apply is not a mutant) and judges it with the witness's own judgeAll(); the mutant counts only if the
//   clause that names it reads RED.
//   No port, no service, no live state; the temp root is removed and no process naming it may survive.
// LAST LINE: run_mutants: k of n mutant(s) RED by the clause that names them · control GREEN|RED  (exit 0 iff k = n and GREEN)
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { plantTree, judgeAll, CLAUSES, survivors } from "./witness_mdet.mjs";

const F = "scripts/organism_test.mjs";
const MUTANTS = [
  { clause: "C1 COMMENT", why: "line comments are no longer blanked (a commented dispatch reads as code)",
    from: 'if (c === "/" && d === "/") { while', to: 'if (false && c === "/" && d === "/") { while' },
  { clause: "C2 STRING", why: "any whole selftest literal counts, whatever stands beside it (the legacy reading)",
    from: "    if (/(?:[!=]==?|\\bcase)\\s*$/.test(", to: "    if (true || /(?:[!=]==?|\\bcase)\\s*$/.test(" },
  { clause: "C3 DISPATCH", why: "a dispatch on the word is no longer accepted",
    from: 'return { form: "dispatch", at: lineOf(l.s) };', to: "continue;" },
  { clause: "C4 CENSUS", why: "the census drops its last row",
    from: "for (const r of censusRows()) console.log(r);", to: "for (const r of censusRows().slice(0, -1)) console.log(r);" },
  { clause: "C5 SELF-RUN", why: "a script run bare is no longer read as its own selftest (claudegen would leave the law)",
    from: 'return { form: "self-run", at: lineOf(k) };', to: "continue;" },
];

const argv = process.argv.slice(2);
const org = argv[argv.indexOf("--org") + 1];
if (!argv.includes("--org") || !org) { console.log("usage: node ci/mdet/run_mutants_mdet.mjs --org <build checkout>"); process.exit(2); }
const root = mkdtempSync(join(tmpdir(), "mdet-mutants-"));
let k = 0, control = false;
try {
  const v0 = judgeAll(plantTree(org, mkdtempSync(join(root, "control-"))));
  control = CLAUSES.every((x) => v0[x].green);
  console.log(`control · ${CLAUSES.map((x) => `${x} ${v0[x].green ? "GREEN" : "RED"}`).join(" · ")}`);
  for (const m of MUTANTS) {
    const dir = plantTree(org, mkdtempSync(join(root, "m-")));
    const p = join(dir, F), src = readFileSync(p, "utf8");
    const hits = src.split(m.from).length - 1;
    if (hits !== 1) { console.log(`mutant ${m.clause} · NOT APPLIED (anchor found ${hits} time(s)) — ${m.why}`); continue; }
    writeFileSync(p, src.replace(m.from, m.to));
    const v = judgeAll(dir), red = !v[m.clause].green;
    if (red) k++;
    console.log(`mutant ${m.clause} · ${red ? "RED" : "SURVIVED"} by its clause (${v[m.clause].why.slice(0, 160)}) — ${m.why}`);
  }
} finally {
  const live = survivors(root);
  if (live.length) { console.log(`LAST · ${live.length} process(es) name the temp dir: ${live.join(" | ")}`); control = false; }
  try { rmSync(root, { recursive: true, force: true }); } catch { /* Windows lock: litter, not a verdict */ }
}
console.log(`run_mutants: ${k} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${control ? "GREEN" : "RED"}`);
process.exit(k === MUTANTS.length && control ? 0 : 1);
