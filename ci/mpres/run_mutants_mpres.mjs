#!/usr/bin/env node
// ============================================================================
// ci/mpres/run_mutants_mpres.mjs — one mutant per clause of ci/mpres/witness_mpres.mjs, each RED by the clause that names it
//   node ci/mpres/run_mutants_mpres.mjs --org <build tree> --base-org <base tree>
// Each mutant is a COPY under os.tmpdir() of the build tree's scripts/ + package.json + dressing-room/state/registry.json with
// ONE edit to ONE organ, the repair its clause stands on reverted; the edit is applied only if its anchor occurs exactly once
// (else that mutant is itself RED: an edit that cannot land proves nothing). The witness runs `--only <clause>` over it and
// must print `RED MPRES · <clause>`. The control is the build tree itself over every clause at once (with --base-org, so BOUND
// runs too): GREEN. BOUND and LAST are seat-time clauses with no mutant. The mutants name no port and no service: the one that
// strips the AW env door leaves the organ's OWN default in place (the anchor is the door, never the address).
// Every wait is a child's exit (each child's own waits are the organ's bounds); no port is bound here, nothing is started.
// LAST LINE: run_mutants: k of n mutant(s) RED by the clause that names them · control GREEN|RED
// ============================================================================
import { spawnSync } from "node:child_process";
import { mkdtempSync, cpSync, readFileSync, writeFileSync, rmSync, existsSync, symlinkSync, mkdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";

const arg = (k) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : null; };
const ORG = arg("--org") && resolve(arg("--org")), BASE = arg("--base-org") && resolve(arg("--base-org"));
if (!ORG || !BASE) { console.log("run_mutants: usage --org <dir> --base-org <dir>"); process.exit(1); }
const WITNESS = join(dirname(fileURLToPath(import.meta.url)), "witness_mpres.mjs");
const ROOT = mkdtempSync(join(os.tmpdir(), "mutants-mpres-"));
const P = "scripts/presence.mjs", T = "scripts/touchline.mjs", D = "scripts/dmn.mjs", C = "scripts/capture.mjs", S = "scripts/senses.mjs", ST = "scripts/state.mjs";

/** [clause id, file, anchor, replacement] — the spec §5 mutant column, plus the ruling's F7 / F9 */
const MUTANTS = [
  ["W1", P, "    const input = await recordDeadInput(deps, now, inputFile);\n", "    const input = null;   // mutant: no snapshot on the null branch\n"],
  ["W2", P, "  const dead_since = p && p.alive === false && p.dead_since ? p.dead_since : at;\n", "  const dead_since = at;   // mutant: reset on every dead pass\n"],
  ["W3", S, "    if (o.alive !== false) return { dead: false };\n", "    return { dead: false };   // mutant: presence is never dead\n"],
  ["W4", ST, "${cd}${ld}${rg}${sn}`;", "${cd}${ld}${rg}`;   // mutant: the senses tail dropped"],
  ["W5", ST, "    : \"\";\n  const line = `STATE", "    : \" · senses ✓\";\n  const line = `STATE"],
  ["W6", T, "  if (inputDead) return { state: \"input_dead\",", "  if (inputDead) return { state: \"no_data\","],
  ["W7", S, "o.dataOk === false && o.mode !== \"selftest\"", "!o.dataOk && o.mode !== \"selftest\""],
  ["W8", S, "o.enumeration && o.enumeration.ok === false && o.have === 0", "o.have === 0"],
  ["W9", S, "o.wired === true && o.last_error ?", "o.last_error ?"],
  ["W10", D, "    if (writeInput) writeInput(dmnInputSnapshot(", "    if (writeInput && false) writeInput(dmnInputSnapshot("],
  ["W11", C, "wired: \"configured-missing\", rejections: []", "wired: false, rejections: []"],
  ["W12", P, "      process.exitCode = 1;\n", "      // mutant: the dead input exits 0\n"],
  ["W13", S, "    if (!o || typeof o !== \"object\") { unknown.push(r.subject); continue; }", "    if (!o || typeof o !== \"object\") { wounds.push({ sensor: r.subject, input: r.input, since: null, since_ist: \"?\", since_kind: \"since\", evidence: null, file: r.file }); continue; }"],
  ["F7", P, "const AW = process.env.AW_API_BASE || process.env.ARSENAL_AW || ", "const AW = "],
  ["F9-ONCE", P, "  if (!snap.repair) {\n", "  if (true) {   // mutant: ask on every dead pass\n"],
  ["F9-RED", P, "result: r && r.ok ? \"asked\" : \"failed\"", "result: \"asked\""],
];
const copyOf = (into) => {
  cpSync(join(ORG, "scripts"), join(into, "scripts"), { recursive: true });
  if (existsSync(join(ORG, "package.json"))) cpSync(join(ORG, "package.json"), join(into, "package.json"));
  const reg = join(ORG, "dressing-room", "state", "registry.json");
  if (existsSync(reg)) { mkdirSync(join(into, "dressing-room", "state"), { recursive: true }); writeFileSync(join(into, "dressing-room", "state", "registry.json"), readFileSync(reg)); }
  if (existsSync(join(ORG, "node_modules"))) symlinkSync(join(ORG, "node_modules"), join(into, "node_modules"), process.platform === "win32" ? "junction" : "dir");
};
const lastOf = (r) => String(r.stdout || "").split(/\r?\n/).map((s) => s.trim()).filter(Boolean).pop() || "";
let k = 0;
for (const [id, file, anchor, repl] of MUTANTS) {
  const dir = mkdtempSync(join(ROOT, "m-"));
  copyOf(dir);
  const src = readFileSync(join(dir, file), "utf8");
  const hits = src.split(anchor).length - 1;
  if (hits !== 1) { console.log(`  RED   mutant ${id} · its anchor occurs ${hits} time(s) in ${file}: the edit cannot land`); rmSync(dir, { recursive: true, force: true }); continue; }
  writeFileSync(join(dir, file), src.replace(anchor, repl));
  const t = Date.now();
  const r = spawnSync(process.execPath, [WITNESS, "--org", dir, "--only", id], { encoding: "utf8", windowsHide: true });
  const last = lastOf(r), why = (String(r.stdout || "").split(/\r?\n/).find((l) => l.includes(` ${id} · `)) || "").trim();
  const ok = r.status === 1 && last === `RED MPRES · ${id}`;
  if (ok) k++;
  console.log(`  ${ok ? "RED  " : "GREEN"} mutant ${id} (${file}) · ${((Date.now() - t) / 1000).toFixed(1)} s · ${last} · ${why.slice(0, 220)}`);
  rmSync(dir, { recursive: true, force: true });
}
const c = spawnSync(process.execPath, [WITNESS, "--org", ORG, "--base-org", BASE], { encoding: "utf8", windowsHide: true });
const cl = lastOf(c);
console.log(`  control · ${cl}`);
rmSync(ROOT, { recursive: true, force: true });
console.log(`run_mutants: ${k} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${c.status === 0 && cl.startsWith("GREEN MPRES ") ? "GREEN" : "RED"}`);
process.exit(k === MUTANTS.length && c.status === 0 ? 0 : 1);
