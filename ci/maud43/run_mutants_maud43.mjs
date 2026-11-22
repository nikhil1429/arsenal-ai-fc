#!/usr/bin/env node
// ============================================================================
// ci/maud43/run_mutants_maud43.mjs — one mutant per clause of ci/maud43/witness_maud43.mjs, each RED by the clause that names it
//   node ci/maud43/run_mutants_maud43.mjs --org <build tree> --base-org <base tree>
// Each mutant is a COPY under os.tmpdir() of the build tree's scripts/ (node_modules linked) with its edits to
// scripts/teaching_audit.mjs, the build's rule for that clause undone. Every edit lands only if its anchor occurs exactly
// once (else the mutant is counted as not RED: an edit that cannot land proves nothing). The witness runs `--only <clause>`
// over it with --base-org and must print `RED MAUD43 · <clause>`. The control is the build tree over every clause with
// --base-org: GREEN. BOUND is a seat-time clause with no mutant. No port is bound; no model is called; every wait is a
// child's exit.
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
const WITNESS = join(dirname(fileURLToPath(import.meta.url)), "witness_maud43.mjs");
const TA = "scripts/teaching_audit.mjs";
const ROOT = mkdtempSync(join(os.tmpdir(), "mutants-maud43-"));
const LOCATE = "    if (Number.isFinite(t) && t < rowTs) at = i;";
/** [clause id, mutant name, [[anchor, replacement], …]] — every edit is to scripts/teaching_audit.mjs */
const MUTANTS = [
  ["W1", "M1 his words from the shared prompt slot", [['userText: String(g.turn.prompt || "")', 'userText: String((auditLast && auditLast.prompt && auditLast.prompt.text) || "")']]],
  ["W2", "M2 the old row is rewritten in place", [["  for (const row of plan.rows) appendLogReal(row);", '  writeFileSync(LOG, logText.split("\\"user_text_source\\":\\"session").join("\\"superseded_by\\":\\"rebuilt\\",\\"user_text_source\\":\\"session"));\n  for (const row of plan.rows) appendLogReal(row);']]],
  ["W3", "M3 a lost row does not latch", [["x.r.rebuilt_from === REBUILT_FROM && Array.isArray(x.r.supersedes)).flatMap", "x.r.rebuilt_from === REBUILT_FROM && !x.r.lost && Array.isArray(x.r.supersedes)).flatMap"]]],
  ["W4", "M4 an empty once-latch", [["const done = new Set(all.filter(", "const done = new Set([].filter("]]],
  ["W5", "M5 the dry run appends", [["  if (!apply) { console.log(", "  if (!apply) { for (const row of plan.rows) appendLogReal(row); console.log("]]],
  ["W6", "M6 the FIRST prompt before ts", [[LOCATE, "    if (Number.isFinite(t) && t < rowTs && at < 0) at = i;"]]],
  ["W7", "M7 the < ts bound dropped (the file's first prompt)", [[LOCATE, "    if (at < 0) at = i;"]]],
  ["W8", "M8 the cross-check removed", [["      c.unpairable++; c.cross_check++; continue;\n", ""]]],
  ["W9", "M9 the per-session record ignored", [["      try { path = transcriptOf(sid, records[sid]); } catch { path = null; }", "      try { path = transcriptPathFor(sid); } catch { path = null; }"]]],
  ["W10", "M10 the rebuilt row carries ts, scope and drifts", [["      rebuilt_at: now, rebuilt_from: REBUILT_FROM,\n      supersedes:", '      rebuilt_at: now, rebuilt_from: REBUILT_FROM, ts: g.members[0].x.r.ts, scope: "study", drifts: kept.map((d) => d.rule),\n      supersedes:']]],
  ["W11", "M11 the rebuilt drift is staged through autoHit", [["      staged: [],\n    });", "      staged: kept.map((d) => ({ rule: d.rule, ...autoHit(d) })),\n    });"]]],
  ["W12", "M12 the locator reads every transcript of the folder", [
    ["import { readFileSync, writeFileSync, existsSync,", "import { readdirSync, readFileSync, writeFileSync, existsSync,"],
    ["      files.set(sid, path ? readFile(sid, path) : { lost: true });", '      files.set(sid, path && existsSync(path) ? { lines: readdirSync(dirname(path)).filter((n) => n.endsWith(".jsonl")).sort().flatMap((n) => readFileSync(join(dirname(path), n), "utf8").split("\\n")) } : { lost: true });']]],
  ["W13", "M13 one rebuilt row per old row", [["    const key = `${sid}#${span.at}`;", "    const key = `${sid}#${span.at}#${id}`;"]]],
  ["W14", "M14 new_idea read with an empty message over the whole turn", [["pictureFacts(view.blocks, stopMsg).new_idea", 'pictureFacts(turn.blocks, "").new_idea']]],
];
const copyOf = (into) => {
  for (const p of ["scripts", "package.json"]) if (existsSync(join(ORG, p))) cpSync(join(ORG, p), join(into, p), { recursive: true });
  if (existsSync(join(ORG, "node_modules"))) symlinkSync(join(ORG, "node_modules"), join(into, "node_modules"), process.platform === "win32" ? "junction" : "dir");
};
const lastOf = (r) => String(r.stdout || "").split(/\r?\n/).map((s) => s.trim()).filter(Boolean).pop() || "";
let k = 0;
for (const [id, name, edits] of MUTANTS) {
  const dir = mkdtempSync(join(ROOT, "m-"));
  copyOf(dir);
  let src = readFileSync(join(dir, TA), "utf8").replace(/\r\n/g, "\n");
  const bad = edits.map(([anchor]) => src.split(anchor).length - 1).find((n) => n !== 1);
  if (bad !== undefined) { console.log(`  GREEN mutant ${name} · an anchor occurs ${bad} time(s) in ${TA}: the edit cannot land`); rmSync(dir, { recursive: true, force: true }); continue; }
  for (const [anchor, repl] of edits) src = src.replace(anchor, () => repl);
  writeFileSync(join(dir, TA), src);
  const t = Date.now();
  const r = spawnSync(process.execPath, [WITNESS, "--org", dir, "--base-org", BASE, "--only", id], { encoding: "utf8", windowsHide: true });
  const last = lastOf(r), why = (String(r.stdout || "").split(/\r?\n/).find((l) => l.includes(` ${id} · `)) || "").trim();
  const ok = r.status === 1 && last === `RED MAUD43 · ${id}`;
  if (ok) k++;
  console.log(`  ${ok ? "RED  " : "GREEN"} mutant ${name} → ${id} · ${((Date.now() - t) / 1000).toFixed(1)} s · ${last} · ${why.slice(0, 200)}`);
  rmSync(dir, { recursive: true, force: true });
}
const c = spawnSync(process.execPath, [WITNESS, "--org", ORG, "--base-org", BASE], { encoding: "utf8", windowsHide: true });
const cl = lastOf(c);
console.log(`  control · ${cl.slice(0, 80)}${cl.length > 80 ? " …" : ""}`);
rmSync(ROOT, { recursive: true, force: true });
console.log(`run_mutants: ${k} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${c.status === 0 && cl.startsWith("GREEN MAUD43 ") ? "GREEN" : "RED"}`);
process.exit(k === MUTANTS.length && c.status === 0 ? 0 : 1);
