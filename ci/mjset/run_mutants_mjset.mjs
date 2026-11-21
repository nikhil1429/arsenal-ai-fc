#!/usr/bin/env node
// ============================================================================
// ci/mjset/run_mutants_mjset.mjs — one mutant (or two) per clause of ci/mjset/witness_mjset.mjs, each RED by the clause that names it
//   node ci/mjset/run_mutants_mjset.mjs --org <build tree> --base-org <base tree>
// Each mutant is a COPY under os.tmpdir() of the build tree's parts the clause witness reads (scripts/ · package.json) with ONE
// edit to ONE file, the build's repair for that clause undone; the edit is applied only if its anchor occurs exactly once (else
// that mutant is itself counted as not RED: an edit that cannot land proves nothing). The unit witness runs `--only <clause>`
// over it with --base-org and must print `RED MJSET · <clause>`. The control is the build tree itself over every clause at once,
// with --base-org: GREEN. BOUND and LAST are seat-time clauses with no mutant. Every wait is a child's exit; no port is bound
// here; no model is called.
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
const WITNESS = join(dirname(fileURLToPath(import.meta.url)), "witness_mjset.mjs");
const GB = "scripts/gaffer_brain.mjs", PM = "scripts/postmatch.mjs";
const ROOT = mkdtempSync(join(os.tmpdir(), "mutants-mjset-"));
const GUARD = "    if (sz.size < 1 && !batches.length) {";
/** [clause id, mutant name, file, anchor, replacement] */
const MUTANTS = [
  ["W1", "M1 the estimator reverted: a floor counts as the fast end again", GB,
    "  const margin = rates.length ? Math.max(...rates) - Math.min(...rates) : 0;", "  const margin = Math.max(...rates, ...floors) - Math.min(...rates, ...floors);"],
  ["W2", "M2 the guard removed", GB, GUARD, "    if (false) {"],
  ["W3", "M3 the guarded call gets what remains, no settle tail", GB,
    "      const one = items.slice(at, at + 1), callMs = remaining - settleReserveMs(one);", "      const one = items.slice(at, at + 1), callMs = remaining;"],
  ["W3", "M3b the guard ignores the slowest ok rate (F2 B undone)", GB,
    "      if (one.length && callMs > 0 && (slowOk === null || slowOk <= callMs)) {", "      if (one.length && callMs > 0) {"],
  ["W4", "M4 the guard re-fires after a batch of the same round", GB, GUARD, "    if (sz.size < 1) {"],
  ["W5", "M5 the auth branch files no card", GB,
    '      : (() => { const c = cardFile(line, key, "the login is his hand (row 963 (3)): code cannot log in for him");', '      : (() => { const c = { ok: false, error: "mutant: no card" };'],
  ["W6", "M6 a kill on the history is a do-not-retry marker for the guard", GB, GUARD, "    if (sz.size < 1 && !batches.length && !(ledger.length && ledger[ledger.length - 1].ok === false)) {"],
  ["W7", "M7 the floor read by IST day, not by instant", GB,
    "  if (c.at) { const t = Date.parse(c.at); return Number.isFinite(t) && t < floorMs; }", "  if (c.at) return istDay(new Date(c.at)) < istDay(new Date(floorMs));"],
  ["W8", "M8 the rotation removed", GB,
    "  const queued = declinedLast(judgeOrder(outstanding0.filter((it) => !asideIds.has(it.id))), rows);", "  const queued = judgeOrder(outstanding0.filter((it) => !asideIds.has(it.id)));"],
  ["W9", "M9 the dry gate removed", GB, "  const gen = deps.generate || (deps.dry\n", "  const gen = deps.generate || (false\n"],
  ["W11", "M11 the morning try replaces the evening try", PM, "  lines.splice(last + 1, 0, ...add);", "  lines.splice(ji + 1, last - ji, ...add.slice(-1));"],
  ["W12", "M12 the settled_nothing field dropped", GB, "    ...(nothingWhy ? { settled_nothing: nothingWhy } : {}),", "    ...({}),"],
  ["W13", "M13 an absent cost reads 0", GB, " ? o.total_cost_usd : null,", " ? o.total_cost_usd : 0,"],
];
const copyOf = (into) => {
  for (const p of ["scripts", "package.json"]) if (existsSync(join(ORG, p))) cpSync(join(ORG, p), join(into, p), { recursive: true });
  const nm = [join(ORG, "node_modules"), join(dirname(fileURLToPath(import.meta.url)), "..", "..", "node_modules")].find((x) => existsSync(x));
  if (nm) symlinkSync(nm, join(into, "node_modules"), process.platform === "win32" ? "junction" : "dir");
};
const lastOf = (r) => String(r.stdout || "").split(/\r?\n/).map((s) => s.trim()).filter(Boolean).pop() || "";
let k = 0;
for (const [id, name, file, anchor, repl] of MUTANTS) {
  const dir = mkdtempSync(join(ROOT, "m-"));
  copyOf(dir);
  const src = readFileSync(join(dir, file), "utf8").replace(/\r\n/g, "\n");
  const hits = src.split(anchor).length - 1;
  if (hits !== 1) { console.log(`  GREEN mutant ${name} · its anchor occurs ${hits} time(s) in ${file}: the edit cannot land`); rmSync(dir, { recursive: true, force: true }); continue; }
  writeFileSync(join(dir, file), src.replace(anchor, () => repl));
  const t = Date.now();
  const r = spawnSync(process.execPath, [WITNESS, "--org", dir, "--base-org", BASE, "--only", id], { encoding: "utf8", windowsHide: true });
  const last = lastOf(r), why = (String(r.stdout || "").split(/\r?\n/).find((l) => l.includes(` ${id} · `)) || "").trim();
  const ok = r.status === 1 && last === `RED MJSET · ${id}`;
  if (ok) k++;
  console.log(`  ${ok ? "RED  " : "GREEN"} mutant ${name} → ${id} (${file}) · ${((Date.now() - t) / 1000).toFixed(1)} s · ${last} · ${why.slice(0, 200)}`);
  rmSync(dir, { recursive: true, force: true });
}
const c = spawnSync(process.execPath, [WITNESS, "--org", ORG, "--base-org", BASE], { encoding: "utf8", windowsHide: true });
const cl = lastOf(c);
console.log(`  control · ${cl.slice(0, 80)}${cl.length > 80 ? " …" : ""}`);
rmSync(ROOT, { recursive: true, force: true });
console.log(`run_mutants: ${k} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${c.status === 0 && cl.startsWith("GREEN MJSET ") ? "GREEN" : "RED"}`);
process.exit(k === MUTANTS.length && c.status === 0 ? 0 : 1);
