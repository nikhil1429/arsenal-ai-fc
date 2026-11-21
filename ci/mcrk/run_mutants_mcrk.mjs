#!/usr/bin/env node
// ============================================================================
// ci/mcrk/run_mutants_mcrk.mjs — one mutant per clause of ci/mcrk/witness_mcrk.mjs, each RED by the clause that names it
//   node ci/mcrk/run_mutants_mcrk.mjs --org <build tree> --base-org <base tree>
// Each mutant is a COPY under os.tmpdir() of the build tree's parts the clause witness reads (scripts/ · package.json ·
// .claude/skills/) with ONE edit to ONE file, the build's repair for that clause undone; the edit is applied only if its
// anchor occurs exactly once (else that mutant is itself RED: an edit that cannot land proves nothing). The witness runs
// `--only <clause>` over it (with --base-org, for CODEC BOUND and K2c) and must print `RED MCRK · <clause>`. The control
// is the build tree itself over every clause at once, with --base-org: GREEN. BOUND and LAST are seat-time clauses with
// no mutant. Every wait is a child's exit; no port is bound here; no model is called.
// LAST LINE: run_mutants: k of n mutant(s) RED by the clause that names them · control GREEN|RED
// ============================================================================
import { spawnSync } from "node:child_process";
import { mkdtempSync, cpSync, readFileSync, writeFileSync, rmSync, existsSync, symlinkSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";

const arg = (k) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : null; };
const ORG = arg("--org") && resolve(arg("--org")), BASE = arg("--base-org") && resolve(arg("--base-org"));
if (!ORG || !BASE) { console.log("run_mutants: usage --org <dir> --base-org <dir>"); process.exit(1); }
const WITNESS = join(dirname(fileURLToPath(import.meta.url)), "witness_mcrk.mjs");
const FS = "scripts/forge_session.mjs", NC = "scripts/notes_compiler.mjs", SK = ".claude/skills/forge/SKILL.md";
const ROOT = mkdtempSync(join(os.tmpdir(), "mutants-mcrk-"));
/** [clause id, mutant name, file, anchor, replacement] */
const MUTANTS = [
  ["K1", "M1 no crack case", FS, '    case "crack": {', '    case "crack-mutant": {'],
  ["K2", "M2 crack saves the session", FS, "      const w = appendCrack(r.row);", "      const w = appendCrack(r.row); save({ ...s, updated_at: new Date().toISOString() });"],
  ["CODEC BOUND", "M3 load re-stamps updated_at", FS, '      updated_at: typeof j.updated_at === "string" ? j.updated_at : undefined,', "      updated_at: new Date().toISOString(),"],
  ["K2c", "M4 no contract carrier", FS, 'const CRACK_CONTRACT = " · crack → ```diff likho to usi turn mein: node scripts/forge_session.mjs crack (no args)";', 'const CRACK_CONTRACT = "";'],
  ["K3", "M5 a placeholder for a missing prompt", FS, '  const p = auditLast && typeof auditLast === "object" ? auditLast.prompt : null;', '  const p = (auditLast && typeof auditLast === "object" ? auditLast.prompt : null) || { text: "(no record)", at: now.toISOString() };'],
  ["K3b", "M6 no idempotence", FS, "      const dup = sameCrack(prior.rows, r.row);", "      const dup = null;"],
  ["K4", "M7 the FIRST moment", FS, "  const m = log.length ? log[log.length - 1] : null;", "  const m = log.length ? log[0] : null;"],
  ["K5", "M8 words from the archive record", NC, "    const stamp = { moment: r.moment, words: r.words, crack_id: r.id, words_at: r.prompt_at };", '    const stamp = { moment: r.moment, words: (ex.find((e) => e.role === "him") || {}).text, crack_id: r.id, words_at: r.prompt_at };'],
  ["K6", "M9 sahi filled from his words", NC, '      items.push({ mark: "T", kind: "crack", at: r.at, rid: null, galat: [], sahi: [], ...stamp });', '      items.push({ mark: "T", kind: "crack", at: r.at, rid: null, galat: [], sahi: [r.words], ...stamp });'],
  ["K7", "M10 the axis of moments_log[0]", FS, "  const axis = s.current_axis && AXES.includes(s.current_axis) ? s.current_axis : null;", "  const axis = (Array.isArray(s.moments_log) && s.moments_log[0] && s.moments_log[0].axis) || null;"],
  ["K8", "M11 no forge SKILL line", SK, "  `crack` (`node scripts/forge_session.mjs crack`, no args)", "  `crack` (no args)"],
  ["K9", "M12 unknown verb exits 0", FS, "        process.exitCode = 1;", "        process.exitCode = 0;"],
];
const copyOf = (into) => {
  for (const p of ["scripts", "package.json", ".claude/skills"]) if (existsSync(join(ORG, p))) cpSync(join(ORG, p), join(into, p), { recursive: true });
  if (existsSync(join(ORG, "node_modules"))) symlinkSync(join(ORG, "node_modules"), join(into, "node_modules"), process.platform === "win32" ? "junction" : "dir");
};
const lastOf = (r) => String(r.stdout || "").split(/\r?\n/).map((s) => s.trim()).filter(Boolean).pop() || "";
let k = 0;
for (const [id, name, file, anchor, repl] of MUTANTS) {
  const dir = mkdtempSync(join(ROOT, "m-"));
  copyOf(dir);
  const src = readFileSync(join(dir, file), "utf8");
  const hits = src.split(anchor).length - 1;
  if (hits !== 1) { console.log(`  GREEN mutant ${name} · its anchor occurs ${hits} time(s) in ${file}: the edit cannot land`); continue; }
  writeFileSync(join(dir, file), src.replace(anchor, repl));
  const t = Date.now();
  const r = spawnSync(process.execPath, [WITNESS, "--org", dir, "--base-org", BASE, "--only", id], { encoding: "utf8", windowsHide: true });
  const last = lastOf(r), why = (String(r.stdout || "").split(/\r?\n/).find((l) => l.includes(` ${id} · `)) || "").trim();
  const ok = r.status === 1 && last === `RED MCRK · ${id}`;
  if (ok) k++;
  console.log(`  ${ok ? "RED  " : "GREEN"} mutant ${name} → ${id} (${file}) · ${((Date.now() - t) / 1000).toFixed(1)} s · ${last} · ${why.slice(0, 220)}`);
  rmSync(dir, { recursive: true, force: true });
}
const c = spawnSync(process.execPath, [WITNESS, "--org", ORG, "--base-org", BASE], { encoding: "utf8", windowsHide: true });
const cl = lastOf(c);
console.log(`  control · ${cl}`);
rmSync(ROOT, { recursive: true, force: true });
console.log(`run_mutants: ${k} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${c.status === 0 && cl.startsWith("GREEN MCRK ") ? "GREEN" : "RED"}`);
process.exit(k === MUTANTS.length && c.status === 0 ? 0 : 1);
