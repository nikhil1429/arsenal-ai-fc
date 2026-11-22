#!/usr/bin/env node
// ci/mq2/run_mutants_mq2.mjs — unit mq2 MUTANTS (forks row 1175 (6); ci/mq2/MQ2_SPEC.md §5 A, M1-M8; row 1305 (2), M9). HEADER = CONTRACT.
//
//   node ci/mq2/run_mutants_mq2.mjs --org <build tree> --base-org <base tree> [--only <Mk>]
//
// For the CONTROL and each mutant: the build tree's tracked files (git ls-files, dressing-room/state/ left out — data,
// never copied) are copied under os.tmpdir(), node_modules is linked in (a junction on Windows), the copy is made a
// git tree with core.autocrlf=false, ONE mutation is applied (its needle must match exactly once, or the mutant is
// NOT APPLIED and counts against the run), and the witness ci/mq2/witness/witness_mq2.mjs runs with --org <copy>
// --base-org <base tree>. A mutant is KILLED when the clause that names it does not hold on the copy.
// The control is the unmutated copy: every clause the build holds must hold there too.
// No port, no service, no model call; every copy is removed at the end. CRLF-proof: needles are matched on text read
// with \r\n folded, and the mutated file is written back in the line ending it was read with.
// LAST LINE: `run_mutants: k of n mutant(s) RED by the clause that names them · control GREEN` (exit 0 iff k = n and
// the control is GREEN), else the same line with `control RED (<clauses>)` and exit 1.
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, copyFileSync, rmSync, symlinkSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const argOf = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const ORG = argOf("--org") && resolve(argOf("--org")), BASE = argOf("--base-org") && resolve(argOf("--base-org"));
if (!ORG || !BASE) { console.log("run_mutants: usage --org <build tree> --base-org <base tree>"); process.exit(1); }
const WITNESS = join(dirname(fileURLToPath(import.meta.url)), "witness", "witness_mq2.mjs");
const TH = "scripts/thalamus.mjs", GT = "scripts/gate_tune.mjs", WM = "scripts/watchman.mjs";
const FS_GT_OLD = 'import { readFileSync, existsSync, readdirSync, appendFileSync } from "node:fs";';
const FS_GT_NEW = 'import { readFileSync, existsSync, readdirSync, appendFileSync, writeFileSync } from "node:fs";';
const MUTANTS = [
  { id: "M1", clause: "A1", why: "the writer emits indent 2", edits: [[TH, "const out = JSON.stringify(next, null, 1);", "const out = JSON.stringify(next, null, 2);"]] },
  { id: "M2", clause: "A2", why: "score's revert keeps its own indent-2 whole-file write", edits: [[GT, FS_GT_OLD, FS_GT_NEW],
    [GT, "const w = applyTiers((cfg) => applyRevert(cfg, live, now), { path: CONFIG() });", 'writeFileSync(CONFIG(), JSON.stringify(applyRevert(JSON.parse(readFileSync(CONFIG(), "utf8")), live, now), null, 2)); const w = { ok: true };']] },
  { id: "M3", clause: "A3", why: "the watchman door removed", edits: [[WM, "const STATE_DIR = process.env.ARSENAL_WATCHMAN_STATE_DIR && tmpDoor(process.env.ARSENAL_WATCHMAN_STATE_DIR) || join(ROOT, \"dressing-room\", \"state\");", "const STATE_DIR = join(ROOT, \"dressing-room\", \"state\");"]] },
  { id: "M4", clause: "A4", why: "the lane-key check dropped", edits: [[TH, '  if (outsideLane(next, lane) !== fence) return refuse("THE LANE FENCE: the edit changed a key outside its own lane");\n', ""]] },
  { id: "M5", clause: "A5", why: "the re-read compare dropped", edits: [[TH, '    if (!readConfigBytes(path).equals(buf)) return refuse("THE STALE GUARD: the file moved between this writer\'s read and its rename");\n', ""]] },
  { id: "M6", clause: "A6", why: "gate_tune apply keeps a direct write of the config", edits: [[GT, FS_GT_OLD, FS_GT_NEW],
    [GT, "    if (!w.ok || !r) { console.error(`gate_tune: NOT applied — ${w.why}`); process.exit(1); }\n", "    if (!w.ok || !r) { console.error(`gate_tune: NOT applied — ${w.why}`); process.exit(1); }\n    writeFileSync(CONFIG(), JSON.stringify(r.cfg, null, 1));\n"]] },
  { id: "M7", clause: "A7", why: "the SOLE WRITER header line removed", edits: [[TH, "//        SOLE WRITER of thalamus_config.json too (unit mq2, forks row 1175 F1 A)", "//        the one writer of the config too (unit mq2, forks row 1175 F1 A)"]] },
  { id: "M8", clause: "A8 BOUND", why: "the stale header sentence kept AND a new state write added to thalamus", edits: [
    [TH, "//        One more file is written, and only as an APPENDER on the", "//        ONE file outside that five is written, and only as an APPENDER on the"],
    [TH, "export function setAdjudicatorRole(edit, opts) { return writeConfigLane(CONFIG_LANES.adjudicator, edit, opts); }\n",
      "export function setAdjudicatorRole(edit, opts) { return writeConfigLane(CONFIG_LANES.adjudicator, edit, opts); }\nexport function mq2Mutant() { writeFileSync(join(STATE_DIR, \"xray_graph.json\"), \"\"); }\n"]] },
  { id: "M9", clause: "A9", why: "the lock dropped (row 1305 (2))", edits: [[TH, "  try { lk = acquireConfigLock(lock); } catch (e) { return refuse(`THE LOCK: cannot take ${basename(lock)} (${(e && /** @type {any} */ (e).code) || e})`); }\n", "  lk = { ok: true, own: false, why: \"\" };\n"]] },
];

const ROOT = mkdtempSync(join(tmpdir(), "mq2-mutants-"));
const tracked = (() => { const r = spawnSync("git", ["-C", ORG, "ls-files", "-z"], { encoding: "utf8", windowsHide: true, maxBuffer: 1 << 28 });
  return r.status === 0 ? String(r.stdout).split("\0").filter((p) => p && !p.startsWith("dressing-room/state/")) : null; })();
if (!tracked) { console.log("run_mutants: NOT MEASURABLE — the build tree is not a git tree"); process.exit(1); }
function copyTree(tag, edits) {
  const t = join(ROOT, tag);
  for (const p of tracked) { if (!existsSync(join(ORG, p))) continue; mkdirSync(dirname(join(t, p)), { recursive: true }); copyFileSync(join(ORG, p), join(t, p)); }
  if (existsSync(join(ORG, "node_modules"))) symlinkSync(join(ORG, "node_modules"), join(t, "node_modules"), "junction");
  const missed = [];
  for (const [file, needle, repl] of edits) {
    const raw = readFileSync(join(t, file), "utf8"), crlf = raw.includes("\r\n"), txt = raw.replace(/\r\n/g, "\n");
    if (txt.split(needle).length !== 2) { missed.push(`${file}: needle matched ${txt.split(needle).length - 1}×`); continue; }
    const out = txt.replace(needle, () => repl);
    writeFileSync(join(t, file), crlf ? out.replace(/\n/g, "\r\n") : out);
  }
  const g = (...a) => spawnSync("git", ["-C", t, ...a], { encoding: "utf8", windowsHide: true });
  g("init", "-q"); g("config", "core.autocrlf", "false");
  writeFileSync(join(t, ".git", "info", "exclude"), "node_modules\n");
  g("add", "-A");
  return { t, missed };
}
const witness = (t) => { const r = spawnSync(process.execPath, [WITNESS, "--org", t, "--base-org", BASE], { encoding: "utf8", windowsHide: true, maxBuffer: 1 << 26 });
  return String(r.stdout || "").split(/\r?\n/).filter(Boolean); };
const held = (lines, clause) => { const l = lines.find((x) => x.startsWith(clause + " ")) || ""; return clause === "A8 BOUND" ? /^A8 BOUND base vs build GREEN/.test(l) : / → held$/.test(l); };

const only = argOf("--only"), RUN = MUTANTS.filter((x) => !only || x.id === only);
const out = [];
let killed = 0, controlRed = [];
try {
  const c = copyTree("control", []);
  const cl = witness(c.t);
  controlRed = ["A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8 BOUND", "A9"].filter((k) => !held(cl, k));
  out.push(`control: ${cl[cl.length - 1] || "no output"}`);
  for (const m of RUN) {
    const { t, missed } = copyTree(m.id, m.edits);
    if (missed.length) { out.push(`${m.id} (${m.why}) NOT APPLIED — ${missed.join("; ")}`); continue; }
    const lines = witness(t), dead = !held(lines, m.clause);
    if (dead) killed++;
    out.push(`${m.id} (${m.why}) → ${m.clause} ${dead ? "RED — killed" : "still holds — SURVIVED"} · witness: ${lines[lines.length - 1] || "no output"}`);
  }
} finally { try { rmSync(ROOT, { recursive: true, force: true }); } catch { /* the temp dir goes with the OS */ } }
for (const l of out) console.log(l);
const ctl = controlRed.length ? `control RED (${controlRed.join(", ")})` : "control GREEN";
console.log(`run_mutants: ${killed} of ${RUN.length} mutant(s) RED by the clause that names them · ${ctl}`);
process.exit(RUN.length && killed === RUN.length && !controlRed.length ? 0 : 1);
