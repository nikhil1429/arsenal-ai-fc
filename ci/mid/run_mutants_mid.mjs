#!/usr/bin/env node
// ci/mid/run_mutants_mid.mjs — unit mid (forks row 1159 (3)) · the eight mutants of ci/mid/MID_SPEC.md, one per clause.
// USAGE  node ci/mid/run_mutants_mid.mjs --org <build tree> --base-org <base tree>
// For each mutant: copy the build's tracked files under os.tmpdir() (node_modules linked, never copied), apply ONE exact
// replacement (a mutant whose text is not found exactly once is NOT APPLIED and counts as not RED), run
// ci/mid/witness_mid.mjs --org <copy> --base-org <base>, and read the clause that names the mutant off its output.
// The control is the same copy with no replacement: its witness last line must be GREEN.
// Writes nothing under either tree; binds no port; every wait is bounded by the base tree's rung_receipt.mjs WITNESS_TIMEOUT_MS.
// LAST LINE  `run_mutants: k of n mutant(s) RED by the clause that names them · control GREEN|RED` (exit 0 iff k = n and GREEN).
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, copyFileSync, existsSync, symlinkSync, readdirSync, statSync, rmSync } from "node:fs";
import { join, resolve, dirname, relative, sep } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { pathToFileURL, fileURLToPath } from "node:url";

const argOf = (f) => { const i = process.argv.indexOf(f); return i > 0 ? process.argv[i + 1] : null; };
const ORG = argOf("--org") ? resolve(argOf("--org")) : null, BASE = argOf("--base-org") ? resolve(argOf("--base-org")) : null;
if (!ORG || !BASE) { console.log("usage: node ci/mid/run_mutants_mid.mjs --org <build tree> --base-org <base tree>"); process.exit(1); }
const WITNESS = join(dirname(fileURLToPath(import.meta.url)), "witness_mid.mjs");
const BOUND = (await import(pathToFileURL(join(BASE, "scripts", "rung_receipt.mjs")).href)).WITNESS_TIMEOUT_MS;

// each mutant: [id, clause it must turn RED, file, exact text, replacement]
const MUTANTS = [
  ["M1", "W1", "scripts/mint.mjs", "const s = (seq++).toString(36);", "const s = (seq).toString(36);"],
  ["M2", "W2", "scripts/mint.mjs", "return `${String(prefix)}${ms}${p}${s}${b}`;", "return `${String(prefix)}${ms}${s}${b}`;"],
  ["M3", "W3", "scripts/mint.mjs", ".toString(36).padStart(PID_WIDTH, \"0\");", ".toString(36);"],
  ["M4", "W4", "scripts/outbox.mjs", "    if (o.ambiguous > 1) return { ok: false, why: ambiguousWhy(id, o.ambiguous) };\n    if (o.acked_at)", "    if (o.acked_at)"],
  ["M5", "W5", "scripts/tasks.mjs", "    if (t.ambiguous > 1) return { ok: false, why: ambiguousWhy(id, t.ambiguous), task: t };\n", ""],
  ["M6", "W6", "scripts/registry.mjs", "  if (held.has(id)) id = mint(\"rul-\", new Date(at));\n  if (held.has(id)) return", "  if (false) return"],
  ["M7", "W7", "scripts/sitting.mjs", "    if (closes && agendaAmbiguous(id, rows)) {", "    if (false) {"],
  ["M8", "W1", "scripts/sitting.mjs", "  const id = mintId(\"ag\", now);", "  const id = `ag${now.getTime().toString(36)}`;"],
];

const git = (cwd, args) => spawnSync("git", args, { cwd, encoding: "utf8", timeout: BOUND, windowsHide: true });
const tracked = (d) => {
  const r = git(d, ["ls-files", "-z"]);
  if (r.status === 0 && r.stdout) return r.stdout.split("\0").filter(Boolean);
  const out = [];
  const walk = (p) => { for (const e of readdirSync(p)) { if (e === "node_modules" || e === ".git") continue; const f = join(p, e); if (statSync(f).isDirectory()) walk(f); else out.push(relative(d, f).split(sep).join("/")); } };
  walk(d); return out;
};
const FILES = tracked(ORG).filter((f) => existsSync(join(ORG, f)));
const ROOT_T = mkdtempSync(join(tmpdir(), "mid-mut-"));
const copyTree = (name) => {
  const d = join(ROOT_T, name);
  for (const f of FILES) { const to = join(d, f); mkdirSync(dirname(to), { recursive: true }); copyFileSync(join(ORG, f), to); }
  if (existsSync(join(ORG, "node_modules"))) symlinkSync(join(ORG, "node_modules"), join(d, "node_modules"), "junction");
  return d;
};
const witness = (tree) => {
  const r = spawnSync(process.execPath, [WITNESS, "--org", tree, "--base-org", BASE], { encoding: "utf8", timeout: BOUND, windowsHide: true });
  return String(r.stdout || "").split(/\r?\n/).filter(Boolean);
};

let red = 0;
for (const [id, cl, file, from, to] of MUTANTS) {
  const d = copyTree(id), p = join(d, file);
  const src = readFileSync(p, "utf8").replace(/\r\n/g, "\n");
  const n = src.split(from).length - 1;
  if (n !== 1) { console.log(`  ${id} → ${cl} · NOT APPLIED (the text is found ${n} time(s) in ${file})`); continue; }
  writeFileSync(p, src.replace(from, to));
  const out = witness(d);
  const line = out.find((l) => new RegExp(`^(GREEN|RED)\\s+${cl} ·`).test(l)) || "(no line)";
  const isRed = /^RED/.test(line);
  if (isRed) red++;
  console.log(`  ${id} → ${cl} · ${isRed ? "RED" : "SURVIVED"} · ${line.trim()} · witness: ${out.at(-1) || "(none)"}`);
}
const control = witness(copyTree("control"));
const cGreen = /^GREEN MID /.test(control.at(-1) || "");
console.log(`  control · ${control.at(-1) || "(none)"}`);
try { rmSync(ROOT_T, { recursive: true, force: true }); } catch { /* the OS's temp sweep names a dir left behind */ }
console.log(`run_mutants: ${red} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${cGreen ? "GREEN" : "RED"}`);
process.exit(red === MUTANTS.length && cGreen ? 0 : 1);
