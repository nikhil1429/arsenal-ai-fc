#!/usr/bin/env node
// @ts-check
// ci/mrulew/run_mutants_mrulew.mjs · unit mrulew — one mutant per way the clause C:rule-witnesses can lie, each run in
// the witness's `plants` mode from a COPY under os.tmpdir() (the repo is never edited), each RED by the plant case that
// names it; the unmutated copy (the control) must read GREEN. Writes nothing outside its temp dir; binds no port; every
// child is bounded by rung_receipt.mjs WITNESS_TIMEOUT_MS (read from its owner). Last line:
//   run_mutants: k of n mutant(s) RED by the clause that names them · control GREEN|RED
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync, cpSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const WDIR = join(ROOT, "ci", "witness", "mrulew");
const SRC = readFileSync(join(WDIR, "witness_rules.mjs"), "utf8");
const { WITNESS_TIMEOUT_MS } = await import(pathToFileURL(join(ROOT, "scripts", "rung_receipt.mjs")).href);

/** [id, the plant case that must name it, ...[from, to] pairs] — each `from` must occur exactly once */
const MUTANTS = [
  ["M-ONEWAY (the spec's: a witness with only a RED plant accepted)", "P-ONEWAY", ["if (!(red === 1 && clean === 0))", "if (!(red === 1))"]],
  ["M-UNMAPPED (a rule without a witness skipped)", "P-UNMAPPED", ["if (typeof cmd !== \"string\") { bad.push(`${id}(none)`); continue; }", "if (typeof cmd !== \"string\") continue;"]],
  ["M-UNPARSED (parseWitness skipped)", "P-UNTRACKED", ["const p = rr.parseWitness(cmd);", "const p = { ok: true, argv: [join(org, cmd.split(\" \")[1]), ...cmd.split(\" \").slice(2)] };"]],
  ["M-SEED (the owner's seed read as his rules)", "P-NOSTATE", ["  if (!existsSync(sp)) return", "  if (false) return"], ["const st = readJ(sp);", "const st = { rules: listIds(org, bound) || [] };"]],
];

const root = mkdtempSync(join(tmpdir(), "mrulew-mut-"));
const run = (name, src) => {
  const d = join(root, name, "ci", "witness", "mrulew");
  mkdirSync(d, { recursive: true });
  cpSync(WDIR, d, { recursive: true });
  writeFileSync(join(d, "witness_rules.mjs"), src);
  const r = spawnSync(process.execPath, [join(d, "witness_rules.mjs"), "plants", "--org", ROOT], { cwd: ROOT, encoding: "utf8", windowsHide: true, timeout: WITNESS_TIMEOUT_MS });
  const last = String(r.stdout || "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean).pop() || "";
  return { exit: r.status, last };
};
let k = 0, control = "RED";
try {
  const c = run("control", SRC);
  control = c.exit === 0 && c.last.startsWith("GREEN MRULEW ") ? "GREEN" : "RED";
  console.log(`control · exit ${c.exit} · ${c.last}`);
  MUTANTS.forEach(([id, want, ...edits], i) => {
    if (edits.some(([from]) => SRC.split(from).length !== 2)) { console.log(`${id} · NOT APPLIED (its text is not in the witness exactly once)`); return; }
    const r = run(`m${i}`, edits.reduce((s, [from, to]) => s.replace(from, to), SRC));
    const ok = r.exit === 1 && new RegExp(`^RED MRULEW · PLANTS .*\\b${want}\\b`).test(r.last);
    if (ok) k++;
    console.log(`${id} · ${ok ? "RED" : "NOT CAUGHT"} by ${want} · exit ${r.exit} · ${r.last}`);
  });
} finally { rmSync(root, { recursive: true, force: true }); }
console.log(`run_mutants: ${k} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${control}`);
process.exit(k === MUTANTS.length && control === "GREEN" ? 0 : 1);
