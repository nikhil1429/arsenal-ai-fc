#!/usr/bin/env node
// ============================================================================
// ci/mbank/run_mutants_mbank.mjs — one mutant per clause of ci/mbank/witness_mbank.mjs, each RED by the clause that names it
//   node ci/mbank/run_mutants_mbank.mjs --org <build tree> --base-org <base tree>
// Each mutant is a COPY under os.tmpdir() of the build tree's parts the clause witness reads (scripts/ · package.json ·
// .claude/skills/) with ONE edit to ONE file, the build's repair for that clause undone; the edit is applied only if its
// anchor occurs exactly once (else that mutant is itself counted as not RED: an edit that cannot land proves nothing). The
// unit witness runs `--only <clause>` over it with --base-org and must print `RED MBANK · <clause>`. The control is the
// build tree itself over every clause at once, with --base-org: GREEN. BOUND and LAST are seat-time clauses with no
// mutant. Every wait is a child's exit; no port is bound here; no model is called.
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
const WITNESS = join(dirname(fileURLToPath(import.meta.url)), "witness_mbank.mjs");
const OT = "scripts/organism_test.mjs", GB = "scripts/gaffer_brain.mjs", FS = "scripts/forge_session.mjs", SS = "scripts/study_scope.mjs", TB = "scripts/teaching_bar.mjs", NC = "scripts/notes_compiler.mjs", TA = "scripts/teaching_audit.mjs";
const ROOT = mkdtempSync(join(os.tmpdir(), "mutants-mbank-"));
const DOOR = "  const spoken = said === undefined ? prompt.text : sliceOf(prompt.text, said);";
const CODE = '    const codeDoor = said !== undefined || String(flag("surface") || "").trim().toLowerCase() === "code";';
/** [clause id, mutant name, file, anchor, replacement] */
const MUTANTS = [
  ["B1", "M1 store the --said flag, not his slice", GB, DOOR, "  const spoken = said === undefined ? prompt.text : (sliceOf(prompt.text, said) === null ? null : String(said));"],
  ["B2", "M2 drop the inside-his-message check", GB, DOOR, "  const spoken = said === undefined ? prompt.text : (sliceOf(prompt.text, said) || String(said));"],
  ["B3", "M3 skip consumed_at", GB, "      prompt = readHisPrompt({ sessionId, fresh: true, needTurn: true });", "      prompt = readHisPrompt({ sessionId, fresh: false, needTurn: true });"],
  ["B4", "M4 require --said for the code door", GB, CODE, "    const codeDoor = said !== undefined;"],
  ["B5", "M5 trust --gut over his message", GB, '  if (typed && typed !== hisFlag) return { ok: false, reason: "gut-not-his"', '  if (false) return { ok: false, reason: "gut-not-his"'],
  ["B6", "M6 count hedges over the whole prompt", GB, "    hedges: countHedges(answerOf(said)),", "    hedges: countHedges(said),"],
  ["B7", "M7 drop turn_id from the bank row", GB, '    turn_id: fromPrompt && deps.prompt && typeof deps.prompt.turn_id === "string" ? deps.prompt.turn_id : null,', "    turn_id: null,"],
  ["B8", "M8 route stdin through the door", GB, CODE, "    const codeDoor = true;"],
  ["B18", "M18 the clock reads the shared Stop again", FS, "  const own = sessionId ? ownStopOf(auditLast, sessionId) : null;", "  const own = null;"],
  ["B19", "M19 prevMomentKinds ignores his own Stop", TB, "  if (own && Array.isArray(own.kinds)) return own.kinds;", ""],
  ["B20", "M20 the lane plants no prompt record", OT, "const bank = (...a) => { hisTurn(a); return", "const bank = (...a) => { return"],
  ["B9", "M9 a second reader of the record in gaffer_brain", GB, "export const spokenSrcOf =", 'export const secondReader = () => readFileSync(join(STATE_DIR, "teaching_audit_last.json"), "utf8");\nexport const spokenSrcOf ='],
  ["B10", "M10 drop the idempotence key", GB, "  if (fromPrompt && row.turn_id && Array.isArray(deps.prior)) {", "  if (false) {"],
  ["B11", "M11 rename spoken", GB, "    spoken: clip(said, 4000),", "    words_spoken: clip(said, 4000),"],
  ["B12", "M12 change a crackRow why", FS, '  if (!p.ok) return { ok: false, why: "his words are not on disk (the UserPromptSubmit record is absent)', '  if (!p.ok) return { ok: false, why: "his words are not on disk (the prompt record is gone)'],
  ["B13", "M13 no turn_id on the compiled crack item", NC, 'turn_id: typeof r.turn_id === "string" ? r.turn_id : null, words_at: r.prompt_at };', "turn_id: null, words_at: r.prompt_at };"],
  ["B14", "M14 the record's owner mints no turn_id", TA, "      turn_id: randomUUID(),\n", ""],
  ["B16", "M16 the Stop pairs with the shared slot again", TA, "  const p = ownRec || shared;", "  const p = shared;"],
  ["B17", "M17 the crack verb reads the shared slot again", FS, "auditLast: ownC ? { ...alC, prompt: ownC } : alC,", "auditLast: alC,"],
  ["B15", "M15 the door reads the shared slot again", SS, "  if (!opts.sessionId) return hisPrompt(last, opts);", "  return hisPrompt(last, opts);"],
];
const copyOf = (into) => {
  for (const p of ["scripts", "package.json", ".claude/skills", "learning-layer"]) if (existsSync(join(ORG, p))) cpSync(join(ORG, p), join(into, p), { recursive: true });
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
  const ok = r.status === 1 && last === `RED MBANK · ${id}`;
  if (ok) k++;
  console.log(`  ${ok ? "RED  " : "GREEN"} mutant ${name} → ${id} (${file}) · ${((Date.now() - t) / 1000).toFixed(1)} s · ${last} · ${why.slice(0, 200)}`);
  rmSync(dir, { recursive: true, force: true });
}
const c = spawnSync(process.execPath, [WITNESS, "--org", ORG, "--base-org", BASE], { encoding: "utf8", windowsHide: true });
const cl = lastOf(c);
console.log(`  control · ${cl.slice(0, 80)}${cl.length > 80 ? " …" : ""}`);
rmSync(ROOT, { recursive: true, force: true });
console.log(`run_mutants: ${k} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${c.status === 0 && cl.startsWith("GREEN MBANK ") ? "GREEN" : "RED"}`);
process.exit(k === MUTANTS.length && c.status === 0 ? 0 : 1);
