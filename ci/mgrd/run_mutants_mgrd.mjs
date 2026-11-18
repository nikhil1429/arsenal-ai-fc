#!/usr/bin/env node
// ============================================================================
// ci/mgrd/run_mutants_mgrd.mjs — ONE MUTANT PER CLAUSE of ci/mgrd/witness_mgrd.mjs
// ----------------------------------------------------------------------------
// CONTRACT: node ci/mgrd/run_mutants_mgrd.mjs --org <build tree> --base-org <base tree>
// Each mutant is a copy of --org under os.tmpdir() with ONE text edit to scripts/groundsman.mjs; the witness runs over
// it against --base-org and must print RED naming the clause the mutant names. The control (the unmutated --org) must
// print GREEN. A mutant whose anchor text is not found is itself RED (the mutant no longer bites the code).
// LAST LINE: run_mutants: k of n mutant(s) RED by the clause that names them · control GREEN|RED   (exit 0 iff k == n and GREEN)
// ============================================================================
import { spawnSync } from "node:child_process";
import { mkdtempSync, cpSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";

const arg = (k) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : null; };
const ORG = arg("--org"), BASE = arg("--base-org");
const WITNESS = join(dirname(fileURLToPath(import.meta.url)), "witness_mgrd.mjs");
const FILE = "scripts/groundsman.mjs";
const MUTANTS = [
  { clause: "G1", what: "the rebuild lays NO own state subtree over origin's tree (own bytes lost)",
    from: 'steps.push(run("git", ["read-tree", `--prefix=${STATE_PREFIX}`', to: 'steps.push(run("git", ["rev-parse", `--prefix=${STATE_PREFIX}`' },
  { clause: "G1", what: "a moved state path is never seen (the conflict check is blind)",
    from: "const statePath = movedPaths.find((p) => p.startsWith(STATE_PREFIX));", to: "const statePath = null;" },
  { clause: "G2", what: "no fast-forward when behind (the ff is skipped)",
    from: 'const ff = run("git", ["merge", "--ff-only", o]);', to: 'const ff = { ok: true };' },
  { clause: "G2", what: "a dirty-path refusal files no card",
    from: "const key = cardOnce(run, `Raat ka state push ruka: origin aage gaya aur ${p} par aapka kaam chal raha hai. Aap merge karein; tab tak push band.`, `groundsman:dirty:${o12}`);\n      return { ok: false, idle: \"DIRTY-PATH\"",
    to: "const key = null;\n      return { ok: false, idle: \"DIRTY-PATH\"" },
  { clause: "G3", what: "the nightly fetch is gone",
    from: 'const fetched = run("git", ["fetch", "origin", "main"]);', to: 'const fetched = { ok: true };' },
];
const root = mkdtempSync(join(os.tmpdir(), "mutants-mgrd-"));
const runW = (org) => { const r = spawnSync(process.execPath, [WITNESS, "--org", org, "--base-org", BASE], { encoding: "utf8", windowsHide: true }); const out = (r.stdout || "").trim().split(/\r?\n/); return { code: r.status, last: out[out.length - 1] || "" }; };
let k = 0;
try {
  MUTANTS.forEach((m, i) => {
    const dir = join(root, `m${i + 1}`);
    cpSync(ORG, dir, { recursive: true, filter: (s) => !/[\\/](node_modules|\.git)$/.test(s) });
    const p = join(dir, ...FILE.split("/"));
    const src = readFileSync(p, "utf8").replace(/\r\n/g, "\n");
    if (!src.includes(m.from)) { console.log(`  ✗ M${i + 1} ${m.clause} · anchor not found — ${m.what}`); return; }
    writeFileSync(p, src.replace(m.from, m.to));
    const r = runW(dir);
    const named = r.code !== 0 && new RegExp(`^RED MGRD · .*\\b${m.clause}\\b`).test(r.last);
    if (named) k++;
    console.log(`  ${named ? "✓" : "✗"} M${i + 1} ${m.clause} · ${m.what} → ${r.last}`);
  });
  const c = runW(ORG);
  const control = c.code === 0 && /^GREEN MGRD/.test(c.last);
  console.log(`  ${control ? "✓" : "✗"} control → ${c.last}`);
  console.log(`run_mutants: ${k} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${control ? "GREEN" : "RED"}`);
  process.exitCode = k === MUTANTS.length && control ? 0 : 1;
} finally { rmSync(root, { recursive: true, force: true }); }
