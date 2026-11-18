#!/usr/bin/env node
// ci/mpm/run_mutants.mjs — unit mpm P3: one mutant per witness clause, each applied to a COPY of the build tree under
// os.tmpdir() and witnessed against the BASE tree; each must be RED by the clause that names it; the unmutated copy (the
// control) must be GREEN. USAGE: node ci/mpm/run_mutants.mjs --org <build tree> --base-org <BASE tree>
// LAST LINE: run_mutants: k of n mutant(s) RED by the clause that names them · control GREEN|RED   (exit 0 only when k = n and GREEN)
import { cpSync, mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join, resolve, dirname, relative, sep } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? resolve(process.argv[i + 1]) : null; };
const ORG = arg("--org"), BASE_ORG = arg("--base-org");
const WITNESS = join(dirname(fileURLToPath(import.meta.url)), "witness_mpm.mjs");
const PM = "scripts/postmatch.mjs";
const MUTANTS = [
  { clause: "Q1", why: "the queue never opens a day (BASE's gate)", file: PM, from: "const queueOnly = !!queue && queue.count > 0;", to: "const queueOnly = false;" },
  { clause: "Q2", why: "the no-evidence gate removed: a day with neither runs on", file: PM, from: "if (!studySeen && !queueOnly) {", to: "if (false) {" },
  { clause: "Q3", why: "the capture's UTC date instead of its IST day", file: PM, from: "if (Number.isFinite(ms)) return { day: istDayOf(new Date(ms)),", to: "if (Number.isFinite(ms)) return { day: new Date(ms).toISOString().slice(0, 10)," },
  { clause: "BOUND", why: "a second file touched", file: "scripts/daykey.mjs", from: null, to: "\n// mpm mutant: a byte outside the named file\n" },
  { clause: "LAST", why: "the close spawns claude", file: PM, from: "  const day = dres.day;\n", to: "  const day = dres.day;\n  try { (await import(\"node:child_process\")).spawnSync(\"claude\", [\"-p\", \"mutant\"], { shell: true, stdio: \"ignore\" }); } catch {}\n" },
];
const lastLine = (s) => String(s || "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean).at(-1) || "";
const witness = (org) => { const r = spawnSync(process.execPath, [WITNESS, "--org", org, "--base-org", BASE_ORG], { encoding: "utf8", windowsHide: true }); return { status: r.status, last: lastLine(r.stdout) }; };
const ROOT = mkdtempSync(join(tmpdir(), "mpm-mut-"));
let k = 0, control = "RED";
try {
  for (const [i, m] of MUTANTS.entries()) {
    const copy = join(ROOT, `m${i}`);
    cpSync(ORG, copy, { recursive: true, filter: (p) => { const rel = relative(ORG, p).split(sep).join("/"); return !(rel === "node_modules" || rel === ".git"); } });
    const f = join(copy, m.file), src = readFileSync(f, "utf8");
    const out = m.from == null ? src + m.to : src.split(m.from).join(m.to);
    if (m.from != null && !src.includes(m.from)) { console.log(`  MISS ${m.clause} · the mutant's anchor is not in ${m.file} — not applied`); continue; }
    writeFileSync(f, out);
    const w = witness(copy);
    const reds = /^RED MPM · (.*)$/.exec(w.last);
    const ok = w.status === 1 && !!reds && reds[1].split(/\s+/).includes(m.clause);
    if (ok) k++;
    console.log(`  ${ok ? "RED by name" : "NOT KILLED "} ${m.clause} · ${m.why} · witness exit ${w.status} · ${w.last}`);
  }
  const c = witness(ORG);
  control = c.status === 0 && /^GREEN MPM /.test(c.last) ? "GREEN" : "RED";
  console.log(`  control · the build tree unmutated · witness exit ${c.status} · ${c.last}`);
} finally { try { rmSync(ROOT, { recursive: true, force: true }); } catch {} }
console.log(`run_mutants: ${k} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${control}`);
process.exitCode = k === MUTANTS.length && control === "GREEN" ? 0 : 1;
