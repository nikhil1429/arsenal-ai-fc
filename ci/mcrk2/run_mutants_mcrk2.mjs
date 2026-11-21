#!/usr/bin/env node
// ============================================================================
// ci/mcrk2/run_mutants_mcrk2.mjs — mutants of the build, each RED by the clause of ci/mcrk2/witness_mcrk2.mjs that names it
//   node ci/mcrk2/run_mutants_mcrk2.mjs --org <build tree> --base-org <base tree>
// Each mutant is a COPY under os.tmpdir() of the build tree's parts the clause witness reads (scripts/ · package.json ·
// .claude/skills/ · ci/witness/mcrk/) with ONE edit to ONE file, the build's repair for that clause undone; the edit is applied
// only if its anchor occurs exactly once (else that mutant is itself GREEN-failed: an edit that cannot land proves nothing).
// The witness runs `--only <clause>` over it and must print `RED MCRK2 · <clause>`. The control is the build tree itself over
// every clause at once, with --base-org: GREEN. BOUND and LAST are seat-time clauses with no mutant. Every wait is a child's
// exit; no port is bound here; no model is called (the clause witness's shim refuses one).
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
const HERE = dirname(fileURLToPath(import.meta.url));
const WITNESS = join(HERE, "witness_mcrk2.mjs");
const NM = [ORG, join(HERE, "..", "..")].map((t) => join(t, "node_modules")).find((p) => existsSync(p)) || null;
const FS = "scripts/forge_session.mjs", NC = "scripts/notes_compiler.mjs", TG = "scripts/teaching_gate.mjs", TA = "scripts/teaching_audit.mjs", CW = "ci/witness/mcrk/witness_crack.mjs";
const ROOT = mkdtempSync(join(os.tmpdir(), "mutants-mcrk2-"));
/** [clause id, mutant name, file, anchor, replacement] */
const MUTANTS = [
  ["G2", "M1 gap set on every row (the guard leg)", FS, 'const gap = axisOn ? (m ? null : "moment-undeclared")', 'const gap = axisOn ? (m ? "moment-undeclared" : "moment-undeclared")'],
  ["G2", "M2 the no-moment refusal restored", FS, '  const gap = axisOn ? (m ? null', '  if (axisOn && !m) return { ok: false, why: `no moment declared on axis ${axisOn} before his answer` };\n  const gap = axisOn ? (m ? null'],
  ["G3", "M3 the no-axis refusal restored", FS, "  const axisOn = axis;", '  if (!axis) return { ok: false, why: "no axis is ON — declare it with `axis <x> now` first" };\n  const axisOn = axis;'],
  ["G3b", "M3b the axis check back ahead of the prompt check", FS, "  // branch 4, ahead of the axis (spec §2.1 step 3)", '  if (!(s.current_axis && AXES.includes(s.current_axis))) return { ok: false, why: "no axis is ON — declare it with `axis <x> now` first" };\n  // branch 4, ahead of the axis (spec §2.1 step 3)'],
  ["G4", "M4d fresh dropped (a consumed record is written)", FS, "sessionId: process.env.CLAUDE_CODE_SESSION_ID || null, fresh: true }, AUDIT_LAST);", "sessionId: process.env.CLAUDE_CODE_SESSION_ID || null, fresh: false }, AUDIT_LAST);"],
  ["G4", "M4e the calling session id dropped (another session's slot is written)", FS, "sessionId: process.env.CLAUDE_CODE_SESSION_ID || null, fresh: true }, AUDIT_LAST);", "sessionId: null, fresh: true }, AUDIT_LAST);"],
  ["G5", "M5 the crack case writes the session (a save that touches updated_at)", FS, "      const r = crackRow({ session: s, prompt: door,", "      save({ ...s, updated_at: new Date().toISOString() });\n      const r = crackRow({ session: s, prompt: door,"],
  ["G6", "M6a the gap red is a patch (it blocks)", TG, "— the teacher's miss`).join(\" · \"), \"count\");", "— the teacher's miss`).join(\" · \"), \"patch\");"],
  ["G6", "M6b the once-latch dropped", TG, "&& sid && c.prompt_session_id === sid && !named.has(c.id));", "&& sid && c.prompt_session_id === sid);"],
  ["G6", "M6c the turn joined by text, not the session id (another session's gap reds)", TG, "&& sid && c.prompt_session_id === sid && !named.has(c.id));", "&& sid && !named.has(c.id));"],
  ["G7", "M7a the drift emitter dropped", TA, "    if (gapDrift) res.drifts.push(gapDrift);\n", "\n"],
  ["G7", "M7b crack-gap undeclared (no seed row, no SEED_GAP)", TA, 'export const SEED_GAP = ["act-mueywvag", "crack-gap"];', 'export const SEED_GAP = ["act-mueywvag"];'],
  ["G7", "M7c the emitter files a card", TA, "    if (gapDrift) res.drifts.push(gapDrift);\n", "    if (gapDrift) { res.drifts.push(gapDrift); try { writeFileSync(join(STATE_DIR, \"captains_call.json\"), \"{}\\n\"); } catch { /* mutant */ } }\n"],
  ["G8", "M8 a group holding a gap row is skipped (a note blocked)", NC, "    const note = buildNote({ concept: c, axis: a, ex, bank, capsule,", "    if (cracks.some((r) => r.gap)) { results.push({ concept: c, axis: a, op: \"skipped\", why: \"a gap\" }); continue; }\n    const note = buildNote({ concept: c, axis: a, ex, bank, capsule,"],
  ["G8", "M8b the gap is not named in GAPS", NC, "    if (stamp.gap) gaps.push(", "    if (false) gaps.push("],
  ["G9", "M9a an unsettled row placed by a guess (the last moment's axis)", NC, '  return { axis: null, why: "no axis in the pacer ledger of its turn" };', '  { const lm = own.flatMap(({ s }) => (Array.isArray(s.moments_log) ? s.moments_log : [])).filter((m) => m && m.axis).at(-1); return { axis: lm ? lm.axis : "a", by: "a guess", at: r.prompt_at }; }'],
  ["G9", "M9b settling dropped", NC, "    const st = settleCrackAxis(r, pacer, { turnEnd });", '    const st = { axis: null, why: "settling dropped" };'],
  ["G10", "M10 readCracks drops gap rows", FS, '!Array.isArray(o) && o.kind === "crack");', '!Array.isArray(o) && o.kind === "crack" && !o.gap);'],
  ["G10", "M10b the verb line does not print the gap", FS, "        + (row.gap ? ` · GAP ${row.gap}", "        + (false ? ` · GAP ${row.gap}"],
  ["G12", "M12e a direct record read back in the crack case", FS, "      const r = crackRow({ session: s, prompt: door,", "      const r = crackRow({ session: s, auditLast: loadAuditLast(), prompt: undefined,"],
  ["MCRK CARRY", "M-carry the seat's session id reaches the mcrk plants again", CW, "const ENV = (() => { const e = { ...process.env }; delete e.CLAUDE_CODE_SESSION_ID; const pk", "const ENV = (() => { const e = { ...process.env }; const pk"],
];
const copyOf = (into) => {
  for (const p of ["scripts", "package.json", ".claude/skills", "ci/witness/mcrk"]) if (existsSync(join(ORG, p))) { mkdirSync(dirname(join(into, p)), { recursive: true }); cpSync(join(ORG, p), join(into, p), { recursive: true }); }
  if (NM) symlinkSync(NM, join(into, "node_modules"), process.platform === "win32" ? "junction" : "dir");
};
const lastOf = (r) => String(r.stdout || "").split(/\r?\n/).map((s) => s.trim()).filter(Boolean).pop() || "";
let k = 0;
for (const [id, name, file, anchor, repl] of MUTANTS) {
  const dir = mkdtempSync(join(ROOT, "m-"));
  copyOf(dir);
  const src = readFileSync(join(dir, file), "utf8");
  const hits = src.split(anchor).length - 1;
  if (hits !== 1) { console.log(`  GREEN mutant ${name} · its anchor occurs ${hits} time(s) in ${file}: the edit cannot land`); rmSync(dir, { recursive: true, force: true }); continue; }
  writeFileSync(join(dir, file), src.replace(anchor, repl));
  const t = Date.now();
  const r = spawnSync(process.execPath, [WITNESS, "--org", dir, "--base-org", BASE, "--only", id], { encoding: "utf8", windowsHide: true });
  const last = lastOf(r), why = (String(r.stdout || "").split(/\r?\n/).find((l) => l.includes(` ${id} · `)) || "").trim();
  const ok = r.status === 1 && last === `RED MCRK2 · ${id}`;
  if (ok) k++;
  console.log(`  ${ok ? "RED  " : "GREEN"} mutant ${name} → ${id} (${file}) · ${((Date.now() - t) / 1000).toFixed(1)} s · ${last} · ${why.slice(0, 220)}`);
  rmSync(dir, { recursive: true, force: true });
}
const c = spawnSync(process.execPath, [WITNESS, "--org", ORG, "--base-org", BASE], { encoding: "utf8", windowsHide: true });
const cl = lastOf(c);
console.log(`  control · ${cl.slice(0, 160)}`);
rmSync(ROOT, { recursive: true, force: true });
console.log(`run_mutants: ${k} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${c.status === 0 && cl.startsWith("GREEN MCRK2 ") ? "GREEN" : "RED"}`);
process.exit(k === MUTANTS.length && c.status === 0 ? 0 : 1);
