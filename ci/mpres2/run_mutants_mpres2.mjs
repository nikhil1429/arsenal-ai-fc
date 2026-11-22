#!/usr/bin/env node
// ============================================================================
// ci/mpres2/run_mutants_mpres2.mjs — one mutant per behavioural clause of ci/mpres2/witness_mpres2.mjs, each RED by the clause that names it
//   node ci/mpres2/run_mutants_mpres2.mjs --org <build tree> --base-org <base tree>
// Each mutant is a COPY under os.tmpdir() of the build tree's scripts/ + package.json + dressing-room/state/registry.json (copied by
// node, never a shell write under a state path) with ONE edit to ONE organ — the repair its clause stands on reverted; the edit is
// applied only if its anchor occurs exactly once (else that mutant is itself RED: an edit that cannot land proves nothing). The
// witness runs `--only <clause>` over it and must print `RED MPRES2 · <clause>`. The control is the build tree itself over every
// clause at once (with --base-org, so BOUND runs too): GREEN. NO-REAL-LIST, NO-TRACK, BOUND and LAST are seat-time clauses with no
// mutant. No port is bound, no service named, nothing started: every wait is a child's exit; no timeout, budget or size is typed.
// LAST LINE: run_mutants: k of n mutant(s) RED by the clause that names them · control GREEN|RED
// ============================================================================
import { spawnSync } from "node:child_process";
import { mkdtempSync, cpSync, readFileSync, writeFileSync, rmSync, existsSync, symlinkSync, mkdirSync, copyFileSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";

const arg = (k) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : null; };
const ORG = arg("--org") && resolve(arg("--org")), BASE = arg("--base-org") && resolve(arg("--base-org"));
if (!ORG || !BASE) { console.log("run_mutants: usage --org <dir> --base-org <dir>"); process.exit(1); }
const WITNESS = join(dirname(fileURLToPath(import.meta.url)), "witness_mpres2.mjs");
const ROOT = mkdtempSync(join(os.tmpdir(), "mutants-mpres2-"));
const P = "scripts/presence.mjs", S = "scripts/senses.mjs";

/** [clause id, file, anchor, replacement] — the spec §5 / §11.4 / §12 mutant columns, as row 1259 rules them */
const MUTANTS = [
  // class one
  ["M1", P, "const REOPEN = Object.freeze([\"none\", \"beside-running\"]);", "const REOPEN = Object.freeze([\"beside-running\"]);   // mutant: a none record closes the door again"],
  ["M2", P, "  if (p && p.alive === false && p.repair && p.repair.span === dead_since && !REOPEN.includes(p.repair.result)) out.repair = p.repair;\n", "  // mutant: the span's record is carried by nothing — every dead pass asks\n"],
  ["M4", P, "!REOPEN.includes(p.repair.result)) out.repair = p.repair;", "!(p.repair.result === \"beside-running\" || /^no self_repair row/.test(p.repair.why || \"\"))) out.repair = p.repair;   // mutant: only the absent-row none reopens"],
  ["M6", P, "(await import(\"./registry.mjs\")).rowOf(\"self_repair\", \"activitywatch\")", "null   /* mutant: the CLI never reads the row */"],
  // class two
  ["R1", P, "    else if (seen.running === true) snap.repair = {", "    else if (false) snap.repair = {   // mutant: the running launcher is not checked\n     "],
  ["R2", S, "r.result === \"beside-running\" ? \"dead beside a running launcher\" :", "r.result === \"beside-running\" ? null :"],
  ["R4", P, "function awReason(e) {\n", "function awReason(e) { return \"unreachable\";   // mutant: every reason collapsed to one string\n"],
  ["R5", P, "  const seen = answered ? null : await launcherRunning(door, prior, deps);\n", "  const seen = answered ? null : { running: false, via: \"mutant\", why: \"mutant: never read\" };\n"],
  ["F8", P, "const REOPEN = Object.freeze([\"none\", \"beside-running\"]);", "const REOPEN = Object.freeze([\"none\"]);   // mutant: beside-running closes the span"],
  ["F10", P, "  if (l && Number.isInteger(l.pid) && await (deps.pidAlive || pidAliveDefault)(l.pid))", "  if (false)   /* mutant: the door's own pid is never read */"],
  // class three
  ["S1", P, "  const busy = reason === \"abort\" && !!seen && seen.running === true;\n", "  const busy = false;   // mutant: an abort beside a running launcher reads dead\n"],
  ["S3", P, "const ANSWERED = Object.freeze([\"no-window-bucket\", \"bad-json\"]);", "const ANSWERED = Object.freeze([]);   // mutant: a server that answered is relaunched"],
  ["S4", P, "    const held = p && p.alive === false && p.dead_since ? p.dead_since : null;\n", "    const held = p && p.alive === false && p.dead_since ? p.dead_since : (p && p.busy === true ? p.busy_since : null);   // mutant: busy carried into dead_since\n"],
  ["S6", S, "amber.push(a); unknown.push(`${a.sensor} ${a.state} since ${a.since_ist}`);", "amber.push(a);   // mutant: the amber never reaches the line"],
  ["S7", P, "  const busy = reason === \"abort\" && !!seen && seen.running === true;\n", "  const busy = reason === \"abort\" && !!seen && seen.running === true && !(prior && prior.busy === true);   // mutant: a repeated busy pass turns dead\n"],
  ["S8", P, "    const held = p && p.alive === false && p.dead_since ? p.dead_since : null;\n", "    const held = null;   // mutant: a busy pass drops the open span\n"],
];
const copyOf = (into) => {
  cpSync(join(ORG, "scripts"), join(into, "scripts"), { recursive: true });
  if (existsSync(join(ORG, "package.json"))) cpSync(join(ORG, "package.json"), join(into, "package.json"));
  const reg = join(ORG, "dressing-room", "state", "registry.json");
  if (existsSync(reg)) { mkdirSync(join(into, "dressing-room", "state"), { recursive: true }); copyFileSync(reg, join(into, "dressing-room", "state", "registry.json")); }
  if (existsSync(join(ORG, "node_modules"))) symlinkSync(join(ORG, "node_modules"), join(into, "node_modules"), process.platform === "win32" ? "junction" : "dir");
};
const lastOf = (r) => String(r.stdout || "").split(/\r?\n/).map((s) => s.trim()).filter(Boolean).pop() || "";
let k = 0;
for (const [id, file, anchor, repl] of MUTANTS) {
  const dir = mkdtempSync(join(ROOT, "m-"));
  copyOf(dir);
  const src = readFileSync(join(dir, file), "utf8").replace(/\r\n/g, "\n");
  const hits = src.split(anchor).length - 1;
  if (hits !== 1) { console.log(`  RED   mutant ${id} · its anchor occurs ${hits} time(s) in ${file}: the edit cannot land`); rmSync(dir, { recursive: true, force: true }); continue; }
  writeFileSync(join(dir, file), src.replace(anchor, repl));
  const t = Date.now();
  const r = spawnSync(process.execPath, [WITNESS, "--org", dir, "--only", id], { encoding: "utf8", windowsHide: true });
  const last = lastOf(r), why = (String(r.stdout || "").split(/\r?\n/).find((l) => l.includes(` ${id} · `)) || "").trim();
  const ok = r.status === 1 && last === `RED MPRES2 · ${id}`;
  if (ok) k++;
  console.log(`  ${ok ? "RED  " : "GREEN"} mutant ${id} (${file}) · ${((Date.now() - t) / 1000).toFixed(1)} s · ${last} · ${why.slice(0, 220)}`);
  rmSync(dir, { recursive: true, force: true });
}
const c = spawnSync(process.execPath, [WITNESS, "--org", ORG, "--base-org", BASE], { encoding: "utf8", windowsHide: true });
const cl = lastOf(c);
console.log(`  control · ${cl}`);
rmSync(ROOT, { recursive: true, force: true });
console.log(`run_mutants: ${k} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${c.status === 0 && cl.startsWith(`GREEN MPRES2 `) ? "GREEN" : "RED"}`);
process.exit(k === MUTANTS.length && c.status === 0 ? 0 : 1);
