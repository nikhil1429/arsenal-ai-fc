#!/usr/bin/env node
// ci/mcanary/run_mutants_mcanary.mjs --org <build dir> [--base-org <base dir>]
// One mutant per clause (spec ci/mwit/MWIT_SPEC.md @ 88bf69d §B-canary (d)): each is a COPY of --org's scripts/ and
// ci/witness/mcanary/ under os.tmpdir() with ONE edit to the clause's reader, and THIS tree's witness, run in plants mode with
// --org pointing at the copy and --only <that clause>, must read RED on the clause that names it. The control (the copy,
// unedited) runs the WHOLE plants mode and must read GREEN. The edit site is matched in the file's OWN line ending (CRLF-proof)
// and must be unique, or the mutant is NOT APPLIED and counts as surviving. Nothing under --org is written.
// LAST LINE: run_mutants: k of n mutant(s) RED by the clause that names them · control GREEN|RED
import { mkdtempSync, cpSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const ORG = resolve(arg("--org") || ".");
const WITNESS = resolve(dirname(fileURLToPath(import.meta.url)), "..", "witness", "mcanary", "witness_canary.mjs");
const W = "ci/witness/mcanary/witness_canary.mjs";
const MUTANTS = [
  { clause: "launch-no-laptop", file: W, from: '  if (!(Date.parse(r.started_at) > Date.parse(p.at))) return { code: 1, why: "the run started at or before its pass line" };\n', to: "", what: "(d) the started_at > pass.at check dropped" },
  { clause: "opus-vs-fable", file: W, from: "    if (a.unit !== b.unit) return { code: 1, why: `the two seats ran two units (${a.unit} · ${b.unit})` };\n", to: "", what: "(d) two different unit ids accepted" },
  { clause: "design-fleet", file: W, from: "if (back.length !== p.seats.length) return", to: "if (back.length < 1) return", what: "(d) returns counted >= 1 instead of every seat" },
];
const run = (org, extra) => spawnSync(process.execPath, [WITNESS, "plants", "--org", org, ...extra], { encoding: "utf8", windowsHide: true });
const last = (r) => String(r.stdout || "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean).at(-1) || "";
const copy = () => { const d = mkdtempSync(join(tmpdir(), "mcanary-mut-")); for (const p of ["scripts", "ci/witness/mcanary"]) cpSync(join(ORG, p), join(d, p), { recursive: true }); return d; };

let k = 0;
for (const m of MUTANTS) {
  const d = copy();
  try {
    const f = join(d, m.file), text = readFileSync(f, "utf8"), eol = text.includes("\r\n") ? "\r\n" : "\n";
    const from = m.from.replace(/\n/g, eol), to = m.to.replace(/\n/g, eol);
    if (text.split(from).length !== 2) { console.log(`  SURVIVED ${m.clause} · ${m.what} · NOT APPLIED (edit site not unique)`); continue; }
    writeFileSync(f, text.replace(from, to));
    const r = run(d, ["--only", m.clause]), l = last(r);
    const red = r.status === 1 && l.startsWith("RED MCANARY") && l.includes(m.clause);
    if (red) k += 1;
    console.log(`  ${red ? "KILLED  " : "SURVIVED"} ${m.clause} · ${m.what} · ${l}`);
  } finally { rmSync(d, { recursive: true, force: true }); }
}
const c = copy();
let ctl;
try { ctl = run(c, []); } finally { rmSync(c, { recursive: true, force: true }); }
const green = ctl.status === 0 && last(ctl).startsWith("GREEN MCANARY");
console.log(`run_mutants: ${k} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${green ? "GREEN" : "RED"}`);
process.exit(k === MUTANTS.length && green ? 0 : 1);
