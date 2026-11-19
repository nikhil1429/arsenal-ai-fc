#!/usr/bin/env node
// ============================================================================
// run_mutants_mjd7.mjs — unit mjd7: ONE mutant per behavioural clause of witness_mjd7.mjs.
// CONTRACT:  node ci/mjd7/run_mutants_mjd7.mjs --org <build tree> --base-org <base tree>
//   Each mutant is a COPY of --org under os.tmpdir() with ONE edit to scripts/captains_call.mjs (the edit must match its
//   source exactly once, or the mutant is RED as unplantable). The witness (this directory's witness_mjd7.mjs) runs on each
//   mutant; a mutant counts only when the witness exits 1 AND prints `RED   <its clause>`. The CONTROL is --org unmutated,
//   and it must end GREEN (exit 0).
//   M-C1 every sync reads the whole queue (the cursor is seated but never used)          → RED by C1
//   M-F1 a cursor ahead of the queue is read as "nothing arrived" and kept               → RED by F1
//   M-F2 the anchor line is never checked: a rewritten queue is read from the old offset → RED by F2
//   M-F3 a missing cursor is seated at the end without reading what is already there    → RED by F3
// THE PORT CLASS (row 1053): no port, no service; each child is spawnSync with a bound derived from a measured node start.
// LAST LINE: run_mutants: k of n mutant(s) RED by the clause that names them · control GREEN|RED  (exit 0 iff k = n ∧ GREEN)
// ============================================================================
import { mkdtempSync, readFileSync, writeFileSync, cpSync, rmSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const ORG = arg("--org") && resolve(arg("--org")), BASE = arg("--base-org") && resolve(arg("--base-org"));
if (!ORG || !BASE) { console.log("run_mutants: USAGE (--org <dir> --base-org <dir>)"); process.exit(1); }
const WITNESS = join(dirname(fileURLToPath(import.meta.url)), "witness_mjd7.mjs");
const TMP = mkdtempSync(join(tmpdir(), "mjd7m-"));
const t0 = process.hrtime.bigint();
spawnSync(process.execPath, ["-e", ""], { encoding: "utf8" });
const BOUND_MS = Math.ceil(Math.max(1, Number(process.hrtime.bigint() - t0) / 1e6) * 1000);   // the same derivation as the witness's own bound (mjd6 precedent)

const MUTANTS = [
  { id: "M-C1", clause: "C1", from: `  if (plan.mode === "whole") return whole(plan.why);\n`, to: `  return whole(plan.why);\n` },
  { id: "M-F1", clause: "F1", from: `  const plan = planGradeRead(cursor, size);\n`,
    to: `  if (validGradeCursor(cursor) && cursor.offset > size) return { rows: [], cursor, mode: "tail", why: "since" };\n  const plan = planGradeRead(cursor, size);\n` },
  { id: "M-F2", clause: "F2", from: `  if (anchorBuf.length !== cursor.anchor_len || sha256(anchorBuf) !== cursor.anchor) return whole("rewritten");\n`, to: `` },
  { id: "M-F3", clause: "F3", from: `  if (plan.mode === "whole") return whole(plan.why);\n`,
    to: `  if (plan.mode === "whole" && plan.why === "missing") { const b = io.readAll(path); return { rows: [], cursor: seatGradeCursor(b, 0, 0, null, "seat"), mode: "whole", why: "missing" }; }\n  if (plan.mode === "whole") return whole(plan.why);\n` },
];

const runWitness = (tree) => {
  const r = spawnSync(process.execPath, [WITNESS, "--org", tree, "--base-org", BASE], { encoding: "utf8", timeout: BOUND_MS, windowsHide: true });
  const lines = String(r.stdout || "").split(/\r?\n/).filter(Boolean);
  return { code: r.status, lines, last: lines[lines.length - 1] || `(no output · ${String(r.stderr || "").split(/\r?\n/).filter(Boolean).pop() || r.error || ""})` };
};

// a mutant tree is the whole --org minus .git and node_modules, so the witness's BOUND walk still sees one file differ.
const copyTree = (to) => cpSync(ORG, to, { recursive: true, verbatimSymlinks: true,
  filter: (p) => { const r = p.slice(ORG.length).replace(/\\/g, "/"); return !/^\/(\.git|node_modules)(\/|$)/.test(r); } });
let k = 0;
for (const m of MUTANTS) {
  const tree = mkdtempSync(join(TMP, `${m.id}-`));
  copyTree(tree);
  const f = join(tree, "scripts", "captains_call.mjs");
  const src = readFileSync(f, "utf8").replace(/\r\n/g, "\n");
  const n = src.split(m.from).length - 1;
  if (n !== 1) { console.log(`RED   ${m.id} · unplantable: its edit matches ${n} time(s) (must be 1)`); continue; }
  writeFileSync(f, src.replace(m.from, m.to));
  const w = runWitness(tree);
  const named = w.lines.some((l) => l.startsWith(`RED   ${m.clause} `));
  const ok = w.code === 1 && named;
  if (ok) k++;
  console.log(`${ok ? "GREEN" : "RED  "} ${m.id} · witness exit ${w.code} · RED by ${m.clause} ${named} · ${w.last}`);
}
const c = runWitness(ORG);
const ctlGreen = c.code === 0 && /^GREEN MJD7 /.test(c.last);
console.log(`${ctlGreen ? "GREEN" : "RED  "} CONTROL · witness exit ${c.code} · ${c.last}`);
try { rmSync(TMP, { recursive: true, force: true }); } catch { }
console.log(`run_mutants: ${k} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${ctlGreen ? "GREEN" : "RED"}`);
process.exit(k === MUTANTS.length && ctlGreen ? 0 : 1);
