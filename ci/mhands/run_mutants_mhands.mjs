#!/usr/bin/env node
// ci/mhands/run_mutants_mhands.mjs [--org <build dir>]   (default: the tree this file sits in)
// One mutant per clause of unit mhands (spec ci/mwit/MWIT_SPEC.md @ 88bf69d, (d) of B-hands:clicks-off and B-hands:fresh-runner).
// Each mutant is a COPY under os.tmpdir() of the three files the witness's plants read (the witness, scripts/study_scope.mjs, the
// runner skill) with ONE edit to the witness copy; the copy's `plants` verb must print RED on the clause that names the mutant. The
// control (the copy, unedited) must print GREEN on every clause. The edit site is matched in the file's own line ending (CRLF-proof)
// and must be unique, or the mutant is NOT APPLIED and counts as surviving. Nothing under --org is written; no git, no port, no model.
// LAST LINE: run_mutants: k of n mutant(s) RED by the clause that names them · control GREEN|RED
import { mkdtempSync, cpSync, readFileSync, writeFileSync, rmSync, mkdirSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const ORG = resolve(arg("--org") || join(dirname(fileURLToPath(import.meta.url)), "..", ".."));
const W = "ci/witness/mhands/witness_hands.mjs";
const FILES = [W, "scripts/study_scope.mjs", ".claude/skills/runner/SKILL.md"];
const MUTANTS = [
  { clause: "B-hands:clicks-off", what: "read only the project file (the user-file-only plant goes 1)",
    from: "  return chain;   // highest precedence first", to: "  return chain.filter((f) => f.scope === \"project\");" },
  { clause: "B-hands:fresh-runner", what: "dedupe by unit id instead of session id (the two-units-one-session plant goes 0)",
    from: "const k = r.session_id.toLowerCase(); if (!unitsBySession.has(k)) unitsBySession.set(k, new Set()); unitsBySession.get(k).add(r.unit);",
    to: "const k = r.unit; if (!unitsBySession.has(k)) unitsBySession.set(k, new Set()); unitsBySession.get(k).add(r.session_id.toLowerCase());" },
];

function run(m) {
  const root = mkdtempSync(join(tmpdir(), "mhands-mut-"));
  try {
    for (const rel of FILES) { const d = join(root, ...rel.split("/")); mkdirSync(dirname(d), { recursive: true }); cpSync(join(ORG, ...rel.split("/")), d); }
    if (m) {
      const p = join(root, ...W.split("/")); const src = readFileSync(p, "utf8"); const eol = src.includes("\r\n") ? "\r\n" : "\n";
      const from = m.from.replace(/\n/g, eol), to = m.to.replace(/\n/g, eol);
      if (src.split(from).length !== 2) return { applied: false, lines: [] };
      writeFileSync(p, src.replace(from, to));
    }
    const r = spawnSync(process.execPath, [join(root, ...W.split("/")), "plants"], { cwd: root, encoding: "utf8", windowsHide: true });
    return { applied: true, code: r.status, lines: String((r.stdout || "") + (r.stderr || "")).split(/\r?\n/).filter((l) => l.trim()) };
  } finally { rmSync(root, { recursive: true, force: true }); }
}
if (!FILES.every((f) => existsSync(join(ORG, ...f.split("/"))))) { console.log(`run_mutants: the --org tree lacks ${FILES.join(" / ")} · control RED`); process.exit(1); }
let k = 0;
for (const m of MUTANTS) {
  const r = run(m);
  const red = r.applied && r.lines.some((l) => new RegExp(`^CLAUSE ${m.clause.replace(/[-:]/g, "\\$&")} RED `).test(l));
  if (red) k++;
  console.log(`  ${red ? "KILLED " : "SURVIVED"} ${m.clause} · ${m.what}${r.applied ? "" : " · NOT APPLIED"}`);
}
const c = run(null);
const controlGreen = c.code === 0 && /^PLANTS mhands · (\d+) of \1 plant\(s\) as expected$/.test(c.lines.at(-1) || "");
console.log(`  control · ${c.lines.at(-1) || "(no output)"}`);
console.log(`run_mutants: ${k} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${controlGreen ? "GREEN" : "RED"}`);
process.exit(k === MUTANTS.length && controlGreen ? 0 : 1);
