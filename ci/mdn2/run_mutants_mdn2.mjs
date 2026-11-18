#!/usr/bin/env node
// ============================================================================
// ci/mdn2/run_mutants_mdn2.mjs — ONE MUTANT PER CLAUSE of ci/mdn2/witness_mdn2.mjs
// ----------------------------------------------------------------------------
// CONTRACT: node ci/mdn2/run_mutants_mdn2.mjs --org <build tree> --base-org <base tree> [--node-modules <dir>]
// Each mutant is a copy of --org under os.tmpdir() with ONE text edit to the file it names; the witness runs over it
// (with --only <clause>, the clause the mutant names) against --base-org and must print RED naming that clause. The
// control (the unmutated --org, every clause) must print GREEN. An anchor that is not found is a RED mutant. Anchors
// are matched on LF text (a CRLF checkout is normalised first). No port, no service, no git repo is planted; every
// child is node-direct and bounded by the witness's own wait.
// LAST LINE: run_mutants: k of n mutant(s) RED by the clause that names them · control GREEN|RED   (exit 0 iff k == n and GREEN)
// ============================================================================
import { spawnSync } from "node:child_process";
import { mkdtempSync, cpSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join, dirname, resolve, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";

const arg = (k) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : null; };
const ORG = arg("--org") ? resolve(arg("--org")) : null, BASE = arg("--base-org") ? resolve(arg("--base-org")) : null;
if (!ORG || !BASE) { console.log("run_mutants: usage --org <dir> --base-org <dir> [--node-modules <dir>] · control RED"); process.exit(1); }
const WITNESS = join(dirname(fileURLToPath(import.meta.url)), "witness_mdn2.mjs");
const NM = resolve(arg("--node-modules") || join(ORG, "node_modules"));
const R = "scripts/registry.mjs", D = "scripts/done.mjs", L = "scripts/lawpack.mjs", O = "scripts/organism_test.mjs";
const MUTANTS = [
  { clause: "N-FIELD", file: R, what: "the registry no longer checks a lane's files", from: "if (row.files !== undefined) {", to: "if (false) {" },
  { clause: "N-REACH", file: D, what: "the declared files are a UNION with the subject-name guess, not the reading", from: "if (decl) return decl.includes(p);", to: "if (decl && decl.includes(p)) return true;" },
  { clause: "N-CLEAN", file: L, what: "a clean plant is one the rule bites (a window of two)", from: '"trailing-n-slice": "export const last = (rows) => rows.slice(-1);\\n",', to: '"trailing-n-slice": "export const last = (rows) => rows.slice(-2);\\n",' },
  { clause: "N-SUITE", file: O, what: "the suite member counts RED-planted as planted both ways", from: "m[1] === m[2] && m[3] === m[2]", to: "m[3] === m[2]" },
];
// THE BOUNDED WAIT, derived in the run (the witness's own form, one level up): THIS process's node start, measured; a
// witness run spawns at most CHILDREN children, each bounded by CHILDREN² node starts — so CHILDREN³ starts bound it.
const NODE_START = Math.max(1, Math.round(process.uptime() * 1000));
const CHILDREN = 2 * (11 + 1 + 2 + 4);   // the witness's own count (witness_mdn2.mjs CHILDREN)
const WAIT = NODE_START * CHILDREN * CHILDREN * CHILDREN;
const root = mkdtempSync(join(os.tmpdir(), "mutants-mdn2-"));
const runW = (org, only) => {
  const r = spawnSync(process.execPath, [WITNESS, "--org", org, "--base-org", BASE, "--node-modules", NM, ...(only ? ["--only", only] : [])], { encoding: "utf8", windowsHide: true, timeout: WAIT });
  const out = `${r.stdout || ""}`.trim().split(/\r?\n/); return { code: r.status, last: out[out.length - 1] || "" };
};
let k = 0;
try {
  MUTANTS.forEach((m, i) => {
    const dir = join(root, `m${i + 1}`);
    cpSync(ORG, dir, { recursive: true, filter: (s) => { const r = relative(ORG, s).split(sep).join("/"); return !(r === "node_modules" || r.startsWith("node_modules/") || r === ".git" || r.startsWith(".git/")); } });
    const p = join(dir, ...m.file.split("/"));
    const src = readFileSync(p, "utf8").replace(/\r\n/g, "\n");
    if (!src.includes(m.from)) { console.log(`  ✗ M${i + 1} ${m.clause} · anchor not found — ${m.what}`); rmSync(dir, { recursive: true, force: true }); return; }
    writeFileSync(p, src.replace(m.from, m.to));
    const r = runW(dir, m.clause);
    const named = r.code !== 0 && new RegExp(`^RED MDN2 · (.*, )?${m.clause}(,|$)`).test(r.last);
    if (named) k++;
    console.log(`  ${named ? "✓" : "✗"} M${i + 1} ${m.clause} · ${m.what} → ${r.last}`);
    rmSync(dir, { recursive: true, force: true });
  });
  const c = runW(ORG, null);
  const control = c.code === 0 && /^GREEN MDN2/.test(c.last);
  console.log(`  ${control ? "✓" : "✗"} control → ${c.last}`);
  console.log(`run_mutants: ${k} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${control ? "GREEN" : "RED"}`);
  process.exitCode = k === MUTANTS.length && control ? 0 : 1;
} finally { rmSync(root, { recursive: true, force: true }); }
