#!/usr/bin/env node
// run_mutants_mjd4.mjs — one mutant per clause of ci/mcr/witness_mjd4.mjs, each on a COPY of the build tree under
// os.tmpdir(); a mutant counts only when the witness goes RED BY THE CLAUSE THAT NAMES IT. The control (no mutation) must
// be GREEN. LAST has no mutant: it is a property of the witness's own cleanup, named here, never counted.
//   node ci/mcr/run_mutants_mjd4.mjs --org <build tree> --base-org <base tree>
// LAST LINE: run_mutants: k of n mutant(s) RED by the clause that names them · control GREEN|RED
import { mkdtempSync, cpSync, readFileSync, writeFileSync, rmSync, appendFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const ORG = resolve(arg("--org")), BASE = resolve(arg("--base-org"));
const WIT = join(dirname(fileURLToPath(import.meta.url)), "witness_mjd4.mjs");
const GB = "scripts/gaffer_brain.mjs";
const MUTANTS = [
  { clause: "I1", what: "a capture in doubt is never re-dispatched", file: GB,
    from: "const pend = inDoubtDispatches(rows);", to: "const pend = [];" },
  { clause: "I2", what: "the judge hands no idempotency key", file: GB,
    from: 'const idemArgv = (s) => (s && s.of ? ["--idem", String(s.of)] : []);', to: "const idemArgv = (s) => [];" },
  { clause: "I3", what: "capture.mjs ignores the key on ingest", file: "scripts/capture.mjs",
    from: "if (v.rep.idem && idemSeen.has(v.rep.idem)) { duplicates++; continue; }", to: "" },
  { clause: "I4", what: "rejirah.mjs ignores the key", file: "scripts/rejirah.mjs",
    from: "if (idem && readLog(LOG, { raw: true }).some((r) => r && r.idem === idem)) {", to: "if (false) {" },
  { clause: "I5", what: "an unresolved capture files no card", file: GB,
    from: "if (why && !deps.dry) {", to: "if (false) {" },
  { clause: "BOUND", what: "a caller moves too (scripts/sitting.mjs touched)", file: "scripts/sitting.mjs", append: "\n// mutant\n" },
];
const runWitness = (org) => {
  const r = spawnSync(process.execPath, [WIT, "--org", org, "--base-org", BASE], { encoding: "utf8" });
  const lines = String(r.stdout || "").trim().split(/\r?\n/);
  return { code: r.status, last: lines[lines.length - 1] || "" };
};
let k = 0;
for (const m of MUTANTS) {
  const dir = mkdtempSync(join(tmpdir(), "mjd4mut-"));
  cpSync(ORG, dir, { recursive: true });
  const p = join(dir, m.file);
  if (m.append) appendFileSync(p, m.append);
  else {
    const s = readFileSync(p, "utf8");
    if (s.split(m.from).length !== 2) { console.log(`MUTANT ${m.clause} · NOT APPLIED (its anchor is not exactly once in ${m.file}) — counts as not RED`); rmSync(dir, { recursive: true, force: true }); continue; }
    writeFileSync(p, s.replace(m.from, m.to));
  }
  const w = runWitness(dir);
  const redBy = w.code === 1 && new RegExp(`^RED MJD4 · (.* )?${m.clause}( |$)`).test(w.last);
  if (redBy) k++;
  console.log(`MUTANT ${m.clause} · ${m.what} → ${w.last} · ${redBy ? "RED by its clause" : "NOT RED by its clause"}`);
  rmSync(dir, { recursive: true, force: true });
}
const c = runWitness(ORG);
const ctrl = c.code === 0 && /^GREEN MJD4 /.test(c.last);
console.log(`CONTROL · ${c.last}`);
console.log(`run_mutants: ${k} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${ctrl ? "GREEN" : "RED"} (LAST has no mutant: the witness's own cleanup)`);
process.exit(k === MUTANTS.length && ctrl ? 0 : 1);
