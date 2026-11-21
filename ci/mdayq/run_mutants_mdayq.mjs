#!/usr/bin/env node
// ============================================================================
// ci/mdayq/run_mutants_mdayq.mjs — one mutant per clause of ci/mdayq/witness_mdayq.mjs, each RED by the clause that names it
//   node ci/mdayq/run_mutants_mdayq.mjs --org <build tree> --base-org <base tree>
// Each mutant is a COPY under os.tmpdir() of the build tree (everything but .git, node_modules — linked — and
// dressing-room/state, which no plant reads) with ONE edit to ONE file, the build's repair for that clause undone; the edit is
// applied only if its anchor occurs exactly once (else that mutant is itself counted as not RED: an edit that cannot land
// proves nothing). The unit witness runs `--only <clause>` over it with --base-org and must print `RED MDAYQ · <clause>`.
// The control is the build tree itself over every clause at once, with --base-org: GREEN. W11, BOUND and LAST are seat-time
// clauses with no mutant (the spec's M11 "call the real judge" would be a live model call: refused in advance, row 1257).
// Every wait is a child's exit; no port is bound here; no model is called.
// LAST LINE: run_mutants: k of n mutant(s) RED by the clause that names them · control GREEN|RED
// ============================================================================
import { spawnSync } from "node:child_process";
import { mkdtempSync, cpSync, readFileSync, writeFileSync, rmSync, existsSync, symlinkSync } from "node:fs";
import { join, dirname, resolve, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";

const arg = (k) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : null; };
const ORG = arg("--org") && resolve(arg("--org")), BASE = arg("--base-org") && resolve(arg("--base-org"));
if (!ORG || !BASE) { console.log("run_mutants: usage --org <dir> --base-org <dir>"); process.exit(1); }
const WITNESS = join(dirname(fileURLToPath(import.meta.url)), "witness_mdayq.mjs");
const FS = "scripts/forge_session.mjs", SS = "scripts/study_scope.mjs", TG = "scripts/teaching_gate.mjs", GB = "scripts/gaffer_brain.mjs", DM = "scripts/day.mjs";
const ROOT = mkdtempSync(join(os.tmpdir(), "mutants-mdayq-"));
const STEP0 = '  if (q.due && dayq !== "left" && dayq !== "lost") return { ok: true, ask: true, code: 0, lines: dayqAsk(D, q) };';
const STEPS = "  const lines = [], steps = [dayqStep(q, dayq)];";
/** [clause id, mutant name, file, anchor, replacement] */
const MUTANTS = [
  ["W1", "M1 drop day_close from MOMENTS", FS, 'export const MOMENTS = ["pehle_guess", "widget_gate", "check_q", "jirah", "sharp_check", "day_close"];', 'export const MOMENTS = ["pehle_guess", "widget_gate", "check_q", "jirah", "sharp_check"];'],
  ["W2", "M2 day_close in MOMENTS only (the gate's fence drops it)", TG, '"jirah", "sharp_check", "day_close"]);   // unit mdayq', '"jirah", "sharp_check"]);   // unit mdayq'],
  ["W3", "M3 drop day_close from BANKED_MOMENTS", SS, 'export const BANKED_MOMENTS = Object.freeze(["jirah", "sharp_check", "day_close"]);', 'export const BANKED_MOMENTS = Object.freeze(["jirah", "sharp_check"]);'],
  ["W3", "M6 add check_q to BANKED_MOMENTS (a bank per idea)", SS, 'export const BANKED_MOMENTS = Object.freeze(["jirah", "sharp_check", "day_close"]);', 'export const BANKED_MOMENTS = Object.freeze(["jirah", "sharp_check", "day_close", "check_q"]);'],
  ["W4", "M4 default an absent moment to day_close", GB, '    moment: momentRaw === "day_close" ? "day_close" : null,', '    moment: "day_close",'],
  ["W5", "M5 remove the axis-done gate's exclusion", FS, "inWindow(r) && r.moment !== DAY_CLOSE);", "inWindow(r));"],
  ["W5L", "M5L remove the LOCK negative-space exclusion", FS, 'probeIs(r, "negative_space") && r.moment !== DAY_CLOSE)', 'probeIs(r, "negative_space"))'],
  ["W7", "M7 count a deferred mark as a close", FS, "for (const a of (Array.isArray(x.axes_done) ? x.axes_done : [])) {", "for (const a of [...(Array.isArray(x.axes_done) ? x.axes_done : []), ...(Array.isArray(x.axes_deferred) ? x.axes_deferred : [])]) {"],
  ["W8", "M8 step 0 does not stop the close", DM, STEP0, STEP0.replace("if (q.due && ", "if (false && q.due && ")],
  ["W9", "M9 skip the bank read (always ask first)", DM, "D, bank: g.bankRows({}), axisNames:", "D, bank: [], axisNames:"],
  ["W10", "M10 file a card when he left", DM, STEPS, `${STEPS}\n  if (dayq === "left") await ownerRun("captains_call.mjs", ["file", "--line", "day-close: he left before the two questions", "--key", "mdayq:left"]);`],
  ["W14", "M14 let a null session id through", GB, '  if (momentRaw === "day_close" && !(fromPrompt && deps.sessionChecked === true)) {', '  if (momentRaw === "day_close" && !fromPrompt) {'],
];
const slash = (p) => p.split(sep).join("/");
const copyOf = (into) => {
  cpSync(ORG, into, { recursive: true, filter: (p) => {
    const rel = slash(relative(ORG, p)); if (!rel) return true;
    const top = rel.split("/")[0];
    return top !== ".git" && top !== "node_modules" && !(rel === "dressing-room/state" || rel.startsWith("dressing-room/state/"));
  } });
  if (existsSync(join(ORG, "node_modules"))) symlinkSync(join(ORG, "node_modules"), join(into, "node_modules"), process.platform === "win32" ? "junction" : "dir");
};
const lastOf = (r) => String(r.stdout || "").split(/\r?\n/).map((s) => s.trim()).filter(Boolean).pop() || "";
let k = 0;
for (const [id, name, file, anchor, repl] of MUTANTS) {
  const dir = mkdtempSync(join(ROOT, "m-"));
  copyOf(dir);
  const src = readFileSync(join(dir, file), "utf8").replace(/\r\n/g, "\n");
  const hits = src.split(anchor).length - 1;
  if (hits !== 1) { console.log(`  GREEN mutant ${name} · its anchor occurs ${hits} time(s) in ${file}: the edit cannot land`); rmSync(dir, { recursive: true, force: true }); continue; }
  writeFileSync(join(dir, file), src.replace(anchor, repl));
  const t = Date.now();
  const r = spawnSync(process.execPath, [WITNESS, "--org", dir, "--base-org", BASE, "--only", id], { encoding: "utf8", windowsHide: true });
  const last = lastOf(r), why = (String(r.stdout || "").split(/\r?\n/).find((l) => l.includes(` ${id} · `)) || "").trim();
  const ok = r.status === 1 && last === `RED MDAYQ · ${id}`;
  if (ok) k++;
  console.log(`  ${ok ? "RED  " : "GREEN"} mutant ${name} → ${id} (${file}) · ${((Date.now() - t) / 1000).toFixed(1)} s · ${last} · ${why.slice(0, 200)}`);
  rmSync(dir, { recursive: true, force: true });
}
const c = spawnSync(process.execPath, [WITNESS, "--org", ORG, "--base-org", BASE], { encoding: "utf8", windowsHide: true });
const cl = lastOf(c);
console.log(`  control · ${cl.slice(0, 80)}${cl.length > 80 ? " …" : ""}`);
rmSync(ROOT, { recursive: true, force: true });
console.log(`run_mutants: ${k} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${c.status === 0 && cl.startsWith("GREEN MDAYQ ") ? "GREEN" : "RED"}`);
process.exit(k === MUTANTS.length && c.status === 0 ? 0 : 1);
