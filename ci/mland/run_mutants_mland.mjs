#!/usr/bin/env node
// ============================================================================
// ci/mland/run_mutants_mland.mjs — ONE MUTANT PER CLAUSE of ci/mland/witness_mland.mjs
// ----------------------------------------------------------------------------
// CONTRACT: node ci/mland/run_mutants_mland.mjs --org <build tree> --base-org <base tree>
// Each mutant is a copy of --org under os.tmpdir() with ONE text edit to the file it names; the witness runs over it
// (with --only <clause>, the clause the mutant names) against --base-org and must print RED naming that clause. The
// control (the unmutated --org, every clause) must print GREEN. An anchor that is not found is a RED mutant.
// LAST LINE: run_mutants: k of n mutant(s) RED by the clause that names them · control GREEN|RED   (exit 0 iff k == n and GREEN)
// ============================================================================
import { spawnSync } from "node:child_process";
import { mkdtempSync, cpSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";

const arg = (k) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : null; };
const ORG = arg("--org"), BASE = arg("--base-org");
const WITNESS = join(dirname(fileURLToPath(import.meta.url)), "witness_mland.mjs");
const L = "scripts/land.mjs", G = "scripts/groundsman.mjs";
const MUTANTS = [
  { clause: "V1", file: L, what: "the verdict at T is never read", from: 'if (!v.ok) return stop(1, "REFUSED", /** @type {string} */ (v.name), v.line, T);', to: "" },
  { clause: "V2", file: L, what: "a moved origin is not seen", from: 'if (O !== P) return stop(1, "REFUSED", "MAIN-MOVED"', to: 'if (false) return stop(1, "REFUSED", "MAIN-MOVED"' },
  { clause: "V3", file: L, what: "a local-ahead main is not seen", from: 'if (isAnc(O, M)) return stop(1, "REFUSED", "LOCAL-AHEAD"', to: 'if (false) return stop(1, "REFUSED", "LOCAL-AHEAD"' },
  { clause: "V4", file: L, what: "a dirty named path is not named", from: "const p = touched.find((x) => dirty.has(x));", to: "const p = null;" },
  { clause: "V5", file: L, what: "a refused push undoes the landing (main reset to P)", from: "  if (!pushed) {\n", to: '  if (!pushed) {\n    git(["reset", "-q", "--keep", P]);\n' },
  { clause: "V6", file: L, what: "an open sitting is not seen", from: 'if (s === "OPEN") return', to: "if (false) return" },
  { clause: "V7", file: L, what: "a state path is not seen", from: "const st = touched.find((p) => p.startsWith(STATE_PREFIX));", to: "const st = null;" },
  { clause: "V8", file: L, what: "a moved lockfile names no npm ci", from: 'const acts = touched.includes("package-lock.json") ? ["npm ci"] : [];', to: "const acts = [];" },
  { clause: "CR1", file: L, what: "hits is always false", from: "const hit = [...touched].find((p) => r.reads.some((x) => hits(p, x)));", to: "const hit = null;" },
  { clause: "CR2", file: L, what: "a witness with no list is given one", from: "if (!out.length) return { valid: false", to: "if (false) return { valid: false" },
  { clause: "CR3", file: L, what: "touched is read from the net diff, not per commit", from: 'git(["log", "--no-renames", "--format=", "--name-only", `${H0}..${H1}`])', to: 'git(["diff", "--no-renames", "--name-only", H0, H1])' },
  { clause: "CR4", file: L, what: "an undeclared open is not named", from: "if (undeclared.length) {", to: "if (false) {" },
  { clause: "L2", file: L, what: "a human stop never resets the count", from: "else if (r.human) n = 0;", to: "else if (false) n = 0;" },
  { clause: "L3", file: L, what: "two commits pass the one-commit gate", from: 'if (n !== 1) return stop(1, "REFUSED", "MULTI-COMMIT"', to: 'if (n > 2) return stop(1, "REFUSED", "MULTI-COMMIT"' },
  { clause: "L4", file: G, what: "the groundsman does not know a landing (held again)", from: "if (tips.has(sha)) { landed.push(sha); continue; }", to: "" },
  { clause: "Q4", file: L, what: "an absent names-gate result passes", from: "if (!file) return { ok: false,", to: "if (!file) return { ok: true," },
  { clause: "S8", file: L, what: "a RED live witness is not a stop", from: 'if (r.code !== 0 || !/^GREEN\\b/.test(r.last)) return stop(3, "STOP", "LIVE-RED"', to: 'if (false) return stop(3, "STOP", "LIVE-RED"' },
];
const root = mkdtempSync(join(os.tmpdir(), "mutants-mland-"));
const runW = (org, only) => { const r = spawnSync(process.execPath, [WITNESS, "--org", org, "--base-org", BASE, ...(only ? ["--only", only] : [])], { encoding: "utf8", windowsHide: true }); const out = (r.stdout || "").trim().split(/\r?\n/); return { code: r.status, last: out[out.length - 1] || "" }; };
let k = 0;
try {
  MUTANTS.forEach((m, i) => {
    const dir = join(root, `m${i + 1}`);
    cpSync(ORG, dir, { recursive: true, filter: (s) => !/[\\/](node_modules|\.git)$/.test(s) });
    const p = join(dir, ...m.file.split("/"));
    const src = readFileSync(p, "utf8").replace(/\r\n/g, "\n");
    if (!src.includes(m.from)) { console.log(`  ✗ M${i + 1} ${m.clause} · anchor not found — ${m.what}`); rmSync(dir, { recursive: true, force: true }); return; }
    writeFileSync(p, src.replace(m.from, m.to));
    const r = runW(dir, m.clause);
    const named = r.code !== 0 && new RegExp(`^RED MLAND · (.*, )?${m.clause}(,|$)`).test(r.last);
    if (named) k++;
    console.log(`  ${named ? "✓" : "✗"} M${i + 1} ${m.clause} · ${m.what} → ${r.last}`);
    rmSync(dir, { recursive: true, force: true });
  });
  const c = runW(ORG, null);
  const control = c.code === 0 && /^GREEN MLAND/.test(c.last);
  console.log(`  ${control ? "✓" : "✗"} control → ${c.last}`);
  console.log(`run_mutants: ${k} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${control ? "GREEN" : "RED"}`);
  process.exitCode = k === MUTANTS.length && control ? 0 : 1;
} finally { rmSync(root, { recursive: true, force: true }); }
