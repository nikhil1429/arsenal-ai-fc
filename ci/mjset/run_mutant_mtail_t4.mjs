#!/usr/bin/env node
// ============================================================================
// ci/mjset/run_mutant_mtail_t4.mjs — forks row 1292 (2) (a): the mutant of the mtail witness's T4 as re-cut in place by unit mjset
//   node ci/mjset/run_mutant_mtail_t4.mjs --org <build tree> --mtail-base <the tree of ci/mtail/BASE>
// T4 sets aside BY NAME only the lines row 1245 (1) rules (`JUDGE TRY · …`). This proves the set-aside is not a blanket: a COPY of
// the build tree under os.tmpdir() with ONE edit to scripts/postmatch.mjs — an UNRULED line of the close record changed (the
// machine record's RESULT line) — must read `RED  T4 F1` under ci/mtail/witness_mtail.mjs; the control (the build tree itself)
// must read `ok   T4 F1`. Only the T4 line is read (BOUND against the old mtail base is the witness's own business). The edit
// is applied only if its anchor occurs exactly once. No port is bound here; no model is called (the mtail witness puts its own
// fake claude first on PATH). Every wait is a child's exit.
// LAST LINE: run_mutant_mtail_t4: k of 1 mutant(s) RED by T4 · control GREEN|RED
// ============================================================================
import { spawnSync } from "node:child_process";
import { mkdtempSync, cpSync, readFileSync, writeFileSync, rmSync, existsSync, symlinkSync, readdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";

const arg = (k) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : null; };
const ORG = arg("--org") && resolve(arg("--org")), MB = arg("--mtail-base") && resolve(arg("--mtail-base"));
if (!ORG || !MB) { console.log("run_mutant_mtail_t4: usage --org <dir> --mtail-base <dir>"); process.exit(1); }
const W = join(dirname(fileURLToPath(import.meta.url)), "..", "mtail", "witness_mtail.mjs");
const ROOT = mkdtempSync(join(os.tmpdir(), "mutant-mtail-t4-"));
const ANCHOR = '  L.push("RESULT: absent (his word not given; the day closed itself)");';
const REPL = '  L.push("RESULT: absent (his word not given; the day closed itself) · an unruled change");';
const t4 = (tree) => {
  const r = spawnSync(process.execPath, [W, "--org", tree, "--base-org", MB], { encoding: "utf8", windowsHide: true });
  return (String(r.stdout || "").split(/\r?\n/).find((l) => / T4 F1 · /.test(l)) || "(no T4 line)").trim();
};
const mut = join(ROOT, "m");
for (const e of readdirSync(ORG)) if (e !== "node_modules") cpSync(join(ORG, e), join(mut, e), { recursive: true });
if (existsSync(join(ORG, "node_modules"))) symlinkSync(join(ORG, "node_modules"), join(mut, "node_modules"), process.platform === "win32" ? "junction" : "dir");
const f = join(mut, "scripts", "postmatch.mjs");
const src = readFileSync(f, "utf8").replace(/\r\n/g, "\n");
let k = 0;
if (src.split(ANCHOR).length - 1 !== 1) console.log("  GREEN mutant MT4 · its anchor does not occur exactly once in scripts/postmatch.mjs: the edit cannot land");
else {
  writeFileSync(f, src.replace(ANCHOR, () => REPL));
  const line = t4(mut);
  const red = line.startsWith("RED");
  if (red) k++;
  console.log(`  ${red ? "RED  " : "GREEN"} mutant MT4 an unruled record line changed (the RESULT line) → T4 · ${line.slice(0, 220)}`);
}
const c = t4(ORG);
console.log(`  control · ${c.slice(0, 220)}`);
rmSync(ROOT, { recursive: true, force: true });
console.log(`run_mutant_mtail_t4: ${k} of 1 mutant(s) RED by T4 · control ${c.startsWith("ok") ? "GREEN" : "RED"}`);
process.exit(k === 1 && c.startsWith("ok") ? 0 : 1);
