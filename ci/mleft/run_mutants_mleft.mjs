#!/usr/bin/env node
// ============================================================================
// ci/mleft/run_mutants_mleft.mjs — UNIT mleft · ONE MUTANT PER CLAUSE (spec ci/mwit/MWIT_SPEC.md @ 88bf69d, each clause's (d))
// ----------------------------------------------------------------------------
// USAGE: node ci/mleft/run_mutants_mleft.mjs [--org <dir>]     (default --org: this file's own tree)
// Each mutant: a COPY of --org under os.tmpdir() (no .git, no node_modules, no dressing-room/state), ONE text edit to the
//   copy's ci/witness/mleft/witness_left.mjs (the original text must occur exactly once, else the mutant is RED as unapplied),
//   then `node <copy>/ci/witness/mleft/witness_left.mjs --org <copy> --only <clause>` — the mutant is KILLED iff it exits 1
//   and its last line is `RED MLEFT · …` naming that clause. CONTROL: the unmutated copy, every clause, exits 0 GREEN.
//   node_modules rides each copy as a link/junction (from --org, else this tree); the witness's own plants copy again. Nothing is written
//   outside os.tmpdir(); the temp root is removed. No port, no service, no model (row 1053).
// LAST LINE: run_mutants: k of n mutant(s) RED by the clause that names them · control GREEN|RED
// ============================================================================
import { cpSync, mkdtempSync, readFileSync, writeFileSync, rmSync, existsSync, symlinkSync } from "node:fs";
import { join, resolve, relative, sep, dirname } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const argv = process.argv.slice(2);
const org = resolve(argv.includes("--org") ? argv[argv.indexOf("--org") + 1] : ROOT);
const W = "ci/witness/mleft/witness_left.mjs";
const MUTANTS = [
  { clause: "B-left:one-command", what: "treat rungs.read === false as answered",
    from: "if (!(j.rungs && j.rungs.read === true)) un.push(", to: "if (false) un.push(" },
  { clause: "C:census-510", what: "drop the row-count check",
    from: "if (rows.length !== size) red.push(", to: "if (false) red.push(" },
  { clause: "C:capability-c29", what: "count static reach alone",
    from: "!(x.reached === true && x.window === true)", to: "!(x.static === true)" },
  { clause: "C:finish-zero", what: "drop lanes === 0",
    from: "if (!(o.lanes === 0)) red.push(", to: "if (false) red.push(" },
];
const lines = (s) => String(s || "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
const T = mkdtempSync(join(tmpdir(), "mleft-mutants-"));
const copy = (dst) => cpSync(org, dst, { recursive: true, filter: (s) => { const r = relative(org, s).split(sep).join("/"); return r === "" || !(/^(\.git|node_modules)(\/|$)/.test(r) || /^dressing-room\/state\//.test(r)); } });
const NM = [join(org, "node_modules"), join(ROOT, "node_modules")].find((p) => existsSync(p)) || null;
const copyNm = (dst) => { copy(dst); if (NM) symlinkSync(NM, join(dst, "node_modules"), "junction"); };
const run = (dir, only) => {
  const env = { ...process.env }; delete env.ORGANISM_TEST_PROFILE;
  const r = spawnSync(process.execPath, [join(dir, W), "--org", dir, ...(only ? ["--only", only] : [])], { cwd: dir, env, encoding: "utf8", windowsHide: true });
  return { code: r.status, last: lines(r.stdout).at(-1) || lines(r.stderr).at(-1) || "" };
};
let killed = 0, control = false;
try {
  if (!existsSync(join(org, W))) throw new Error(`--org carries no ${W}`);
  MUTANTS.forEach((m, i) => {
    const d = join(T, `m${i}`); copyNm(d);
    const src = readFileSync(join(d, W), "utf8");
    if (src.split(m.from).length !== 2) { console.log(`MUTANT ${m.clause} UNAPPLIED · the original text is not there exactly once`); return; }
    writeFileSync(join(d, W), src.replace(m.from, m.to));
    const r = run(d, m.clause);
    const ok = r.code === 1 && /^RED MLEFT · /.test(r.last) && r.last.includes(m.clause);
    if (ok) killed++;
    console.log(`MUTANT ${m.clause} (${m.what}) exit ${r.code} ${ok ? "KILLED" : "SURVIVED"} · ${r.last}`);
  });
  const d = join(T, "control"); copyNm(d);
  const r = run(d, null);
  control = r.code === 0 && /^GREEN MLEFT /.test(r.last);
  console.log(`CONTROL exit ${r.code} ${control ? "GREEN" : "RED"} · ${r.last}`);
} catch (e) { console.log(`run_mutants: setup failed · ${String(e && e.message)}`); }
finally { rmSync(T, { recursive: true, force: true }); }
console.log(`run_mutants: ${killed} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${control ? "GREEN" : "RED"}`);
process.exitCode = killed === MUTANTS.length && control ? 0 : 1;
