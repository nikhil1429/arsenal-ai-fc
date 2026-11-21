#!/usr/bin/env node
// ============================================================================
// ci/mtrap/run_mutants_mtrap.mjs — one mutant per clause of ci/mtrap/witness_mtrap.mjs, each RED by the clause that names it
//   node ci/mtrap/run_mutants_mtrap.mjs --org <build tree> --base-org <base tree>
// Each mutant is a COPY under os.tmpdir() of the build tree's parts the clause witness reads (scripts/ · package.json ·
// .claude/skills/ · dressing-room/state/registry.json, the TRACKED registry the plants copy) with ONE edit to ONE file, the
// build's repair for that clause undone; the edit is applied only if its anchor occurs exactly once (else that mutant is
// itself GREEN: an edit that cannot land proves nothing). The witness runs `--only <clause>` over it (with --base-org) and
// must print `RED MTRAP · <clause>`. The control is the build tree itself over every clause at once, with --base-org:
// GREEN. BOUND and LAST are seat-time clauses with no mutant. Every wait is a child's exit; no port is bound here; no
// model is called.
// LAST LINE: run_mutants: k of n mutant(s) RED by the clause that names them · control GREEN|RED
// ============================================================================
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, cpSync, readFileSync, writeFileSync, rmSync, existsSync, symlinkSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";

const arg = (k) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : null; };
const ORG = arg("--org") && resolve(arg("--org")), BASE = arg("--base-org") && resolve(arg("--base-org"));
if (!ORG || !BASE) { console.log("run_mutants: usage --org <dir> --base-org <dir>"); process.exit(1); }
const WITNESS = join(dirname(fileURLToPath(import.meta.url)), "witness_mtrap.mjs");
const FS = "scripts/forge_session.mjs", NC = "scripts/notes_compiler.mjs", LS = "scripts/learnstate.mjs", SK = ".claude/skills/forge/SKILL.md";
const ROOT = mkdtempSync(join(os.tmpdir(), "mutants-mtrap-"));
/** [clause id, mutant name, file, anchor, replacement] */
const MUTANTS = [
  ["W1", "M1 gateDay ignores gateableOf", NC, "    if (!gq.gateable) {\n      results.push({ of: n.id", "    if (false) {\n      results.push({ of: n.id"],
  ["W1", "M2 pad traps to the bar with a filler", NC, "  traps.forEach((t, i) => { t.id = `T${i + 1}`; });",
    "  while (traps.length < 3) traps.push({ from: \"compiler\", bait: `filler ${traps.length}`, truth: null });\n  traps.forEach((t, i) => { t.id = `T${i + 1}`; });"],
  ["W2", "M3 the CLI say drops not-gateable", NC, "  const say = (r) => { const line =", "  const say = (r) => { if (r.op === \"not-gateable\") return; const line ="],
  ["W3", "M4 count distinct by id, not by folded bait", FS, "    if (b && b !== foldBait(NO_BAIT)) seen.add(b);", "    seen.add(t.id);"],
  ["W4", "M5 gateableOf returns false always", FS, "  return { gateable: have >= TRAP_BAR, have,", "  return { gateable: false, have,"],
  ["W5", "M6 drop the contract fragment", FS, "    + (owed && owed.owed > 0 && owed.axis === s.current_axis", "    + (false && owed && owed.owed > 0 && owed.axis === s.current_axis"],
  ["W6", "M7 append a not_gateable row for the old notes", NC, "  // an ABSENT row is not a verdict: the note stays un-judged and the next gate reads it again",
    "  for (const x of st.live) if (!gateableOf(x.note).gateable) appendFileSync(ledger, JSON.stringify({ v: 1, kind: \"not_gateable\", id: `ng-${x.id}`, of: x.id }) + \"\\n\");\n  // an ABSENT row is not a verdict: the note stays un-judged and the next gate reads it again"],
  ["W7", "M8 covered reads >= 2", NC, "new Set(wrong.map((w) => w.trap)).size === TRAP_BAR;", "new Set(wrong.map((w) => w.trap)).size >= 2;"],
  ["W8", "M9 call every failed note not gateable", LS, "    else if (!gateable) seen.thin++;", "    else if (!gateable || verdictRows.at(-1).verdict === \"fail\") seen.thin++;"],
  ["W9", "M10 a capsule trap counted", FS, "export const COUNTED_FROM = Object.freeze([\"crack\", \"correction\"]);", "export const COUNTED_FROM = Object.freeze([\"crack\", \"correction\", \"capsule\"]);"],
  ["SKILL", "M11 no forge SKILL trap-owed line", SK, "never write one to reach a count — capsule traps teach", "write one when the count is short — capsule traps teach"],
];
const copyOf = (into) => {
  for (const p of ["scripts", "package.json", ".claude/skills"]) if (existsSync(join(ORG, p))) cpSync(join(ORG, p), join(into, p), { recursive: true });
  const reg = join(ORG, "dressing-room", "state", "registry.json");
  if (existsSync(reg)) { mkdirSync(join(into, "dressing-room", "state"), { recursive: true }); cpSync(reg, join(into, "dressing-room", "state", "registry.json")); }
  if (existsSync(join(ORG, "node_modules"))) symlinkSync(join(ORG, "node_modules"), join(into, "node_modules"), process.platform === "win32" ? "junction" : "dir");
};
const lastOf = (r) => String(r.stdout || "").split(/\r?\n/).map((s) => s.trim()).filter(Boolean).pop() || "";
let k = 0;
for (const [id, name, file, anchor, repl] of MUTANTS) {
  const dir = mkdtempSync(join(ROOT, "m-"));
  copyOf(dir);
  const src = readFileSync(join(dir, file), "utf8").replace(/\r\n/g, "\n");
  const hits = src.split(anchor).length - 1;
  if (hits !== 1) { console.log(`  GREEN mutant ${name} · its anchor occurs ${hits} time(s) in ${file}: the edit cannot land`); continue; }
  writeFileSync(join(dir, file), src.replace(anchor, repl));
  const t = Date.now();
  const r = spawnSync(process.execPath, [WITNESS, "--org", dir, "--base-org", BASE, "--only", id], { encoding: "utf8", windowsHide: true });
  const last = lastOf(r), why = (String(r.stdout || "").split(/\r?\n/).find((l) => l.includes(` ${id} · `)) || "").trim();
  const ok = r.status === 1 && last === `RED MTRAP · ${id}`;
  if (ok) k++;
  console.log(`  ${ok ? "RED  " : "GREEN"} mutant ${name} → ${id} (${file}) · ${((Date.now() - t) / 1000).toFixed(1)} s · ${last} · ${why.slice(0, 220)}`);
  rmSync(dir, { recursive: true, force: true });
}
const c = spawnSync(process.execPath, [WITNESS, "--org", ORG, "--base-org", BASE], { encoding: "utf8", windowsHide: true });
const cl = lastOf(c);
console.log(`  control · ${cl}`);
rmSync(ROOT, { recursive: true, force: true });
console.log(`run_mutants: ${k} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${c.status === 0 && cl.startsWith("GREEN MTRAP ") ? "GREEN" : "RED"}`);
process.exit(k === MUTANTS.length && c.status === 0 ? 0 : 1);
