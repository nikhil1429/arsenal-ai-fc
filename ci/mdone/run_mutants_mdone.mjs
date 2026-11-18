#!/usr/bin/env node
// ============================================================================
// ci/mdone/run_mutants_mdone.mjs — ONE MUTANT PER CLAUSE of ci/mdone/witness_mdone.mjs
// ----------------------------------------------------------------------------
// CONTRACT: node ci/mdone/run_mutants_mdone.mjs --org <build tree> --base-org <base tree> [--node-modules <dir>]
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
const WITNESS = join(dirname(fileURLToPath(import.meta.url)), "witness_mdone.mjs");
const D = "scripts/done.mjs", S = ".claude/skills/matchday/SKILL.md";
const NMARG = arg("--node-modules") ? ["--node-modules", arg("--node-modules")] : [];
const MUTANTS = [
  { clause: "D-ORPH", file: D, what: "the Q3 orphan lanes are dropped", from: "return { lanes: q.Q3.map((f) => f.path).sort(),", to: "return { lanes: [].sort()," },
  { clause: "D-UNREAD", file: D, what: "no campaign reads as 0/0, not UNREAD", from: 'if (!campaign) return { read: false, why: "UNREAD (no --campaign)" };\n  const rd', to: 'if (!campaign) return { read: true, g: 0, n: 0, lg: 0, ln: 0, red: [], lred: [], old: "" };\n  const rd' },
  { clause: "D-METER", file: D, what: "the old recorded day is never asked", from: "&& typeof c.meter_before === \"string\" && c.meter_before === c.meter_after && old.ok;", to: "&& typeof c.meter_before === \"string\" && c.meter_before === c.meter_after;" },
  { clause: "D-RULE", file: D, what: "every RED-planted rule counts as both ways", from: "const both = lp && lp.CLEAN_PLANTS ? red.filter((id) => typeof lp.CLEAN_PLANTS[id] === \"string\") : [];", to: "const both = red;" },
  { clause: "D-REACH", file: D, what: "static reach ignores who reads the file", from: ": (rc.names || []).some((n) => readers.has(n));", to: ": true;" },
  { clause: "D-NOCONS", file: D, what: "a lane naming nobody is not NO CONSUMER", from: "const noCons = !rc.retired && rc.kind !== \"him\" && !(rc.names || []).length;", to: "const noCons = false;" },
  { clause: "D-LINE", file: D, what: "the line carries the lane subjects", from: "return `DONE · orphans lanes ${m.o.lanes.length}", to: "return `${m.re.rows ? m.re.rows.map((x) => x.subject).join(\",\") : \"\"} DONE · orphans lanes ${m.o.lanes.length}" },
  { clause: "D-WRITE", file: D, what: "the organ writes a receipt", from: "const m = await measure();", to: "const m = await measure();\n  (await import(\"node:fs\")).writeFileSync(join(ROOT, \"done_receipt.txt\"), \"x\");" },
  { clause: "D-MORNING", file: S, what: "the anchor no longer prints the line", from: "run `node scripts/done.mjs line` and print", to: "run `node scripts/done.mjs report` and print" },
  { clause: "D-CARD", file: D, what: "a census PENDING prints no card", from: "if (m.c.read && m.c.pending > 0) out.push(", to: "if (false) out.push(" },
];
const root = mkdtempSync(join(os.tmpdir(), "mutants-mdone-"));
const runW = (org, only) => { const r = spawnSync(process.execPath, [WITNESS, "--org", org, "--base-org", BASE, ...NMARG, ...(only ? ["--only", only] : [])], { encoding: "utf8", windowsHide: true }); const out = (r.stdout || "").trim().split(/\r?\n/); return { code: r.status, last: out[out.length - 1] || "" }; };
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
    const named = r.code !== 0 && new RegExp(`^RED MDONE · (.*, )?${m.clause}(,|$)`).test(r.last);
    if (named) k++;
    console.log(`  ${named ? "✓" : "✗"} M${i + 1} ${m.clause} · ${m.what} → ${r.last}`);
    rmSync(dir, { recursive: true, force: true });
  });
  const c = runW(ORG, null);
  const control = c.code === 0 && /^GREEN MDONE/.test(c.last);
  console.log(`  ${control ? "✓" : "✗"} control → ${c.last}`);
  console.log(`run_mutants: ${k} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${control ? "GREEN" : "RED"}`);
  process.exitCode = k === MUTANTS.length && control ? 0 : 1;
} finally { rmSync(root, { recursive: true, force: true }); }
