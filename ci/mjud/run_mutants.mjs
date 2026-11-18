#!/usr/bin/env node
// ci/mjud/run_mutants.mjs — P3. node ci/mjud/run_mutants.mjs --org <build tree> --base-org <BASE tree>
// Each mutant is ONE exact replacement (asserted to match once) on a fresh copy of the build tree under os.tmpdir();
// the witness runs on the copy, and the mutant counts only when the clause that NAMES it reads RED. The control (no
// mutation) must read GREEN MJUD. Full witness outputs → ci/mjud/out/mutant_<id>.txt.
import { cpSync, mkdtempSync, readFileSync, writeFileSync, rmSync, mkdirSync } from "node:fs";
import { join, dirname, resolve, relative } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? resolve(process.argv[i + 1]) : null; };
const ORG = arg("--org"), BASE = arg("--base-org");
const OUT = join(HERE, "out"); mkdirSync(OUT, { recursive: true });

const MUTANTS = [
  { id: "m1", clause: "M1 SITTING", file: "scripts/sitting.mjs", from: "JUDGE_VERBS.includes(args[0]) ? JUDGE_BUDGET_MS + JUDGE_DISPATCH_MS", to: "JUDGE_VERBS.includes(args[1]) ? JUDGE_BUDGET_MS + JUDGE_DISPATCH_MS",
    why: "the owner funnel reads the wrong argv slot: judge-due falls back to 20 s" },
  { id: "m2", clause: "M2 DUGOUT", file: "scripts/dugout.mjs", from: "JUDGE_VERBS.includes(argv[0]) ? JUDGE_BUDGET_MS + JUDGE_DISPATCH_MS", to: "JUDGE_VERBS.includes(argv[1]) ? JUDGE_BUDGET_MS + JUDGE_DISPATCH_MS",
    why: "the tool funnel reads the wrong argv slot: judge-round falls back to 60 s" },
  { id: "m3", clause: "M3 CENSUS", file: "scripts/zz_mutant_caller.mjs", create: 'import { execFileSync } from "node:child_process";\nimport { join } from "node:path";\nexport function rogue(HERE) { return execFileSync(process.execPath, [join(HERE, "gaffer_brain.mjs"), "judge-round"], { timeout: 1000 }); }\n',
    why: "a new caller spawns judge-round under its own 1 s, outside both resolvers" },
  { id: "m4", clause: "M4 F3-EAT", file: "scripts/gaffer_brain.mjs", from: "const ate = !batches.length && ", to: "const ate = false && !batches.length && ",
    why: "a check that ate the budget is reported as a plain cannot-fit, the check unnamed" },
  { id: "m5", clause: "M5 F3-CLIP", file: "scripts/gaffer_brain.mjs", from: "let spent = extMs, at = 0, stop = null;", to: "let spent = 0, at = 0, stop = null;",
    why: "the check's own time is not charged to the ONE budget: the first batch gets a fresh budget" },
  { id: "m6", clause: "M6 MJD2", file: "scripts/gaffer_brain.mjs", from: "const floors = judgeFloors(ledger);", to: "const floors = [];",
    why: "the round ignores killed rows: a killed size teaches nothing (BASE's behaviour)" },
  { id: "m7", clause: "M7 NOFLOOR", file: "scripts/gaffer_brain.mjs", from: "&& (r.killed === true || r.timed_out === true || JUDGE_KILL_RE.test(String(r.error_envelope || r.error || \"\"))))", to: "&& true)",
    why: "every failed judge row is taken as a floor: a 3 s auth refusal shrinks the size" },
  { id: "m8", clause: "M8 MAUTH", file: "scripts/brain.mjs", from: "const AUTH_FAIL_RE = JUDGE_AUTH_RE;", to: "const AUTH_FAIL_RE = /not logged in|please run \\/login|invalid api key|authenticat|unauthorized/i;",
    why: "brain restates its own narrower pattern again (BASE's line): the OAuth refusal is missed, two literals" },
  { id: "m9", clause: "M9 KEPT", file: "scripts/gaffer_brain.mjs", from: "batches, sizing: sizing0, stopped: stop ? stop.kind : null, stopped_why:", to: "batches, sizing: sizing0, stopped_why:",
    why: "an ok round drops a field a caller reads (stopped)" },
  { id: "mb", clause: "BOUND", file: "scripts/postmatch.mjs", append: "\n// mutant: a byte outside the named files\n",
    why: "a file outside the four named files differs from BASE" },
  { id: "ml", clause: "LAST", file: "scripts/sitting.mjs", from: "    const out = { ok: true, id: S.id, review, intent_ok: ir.ok };",
    to: "    await new Promise((res) => { import(\"node:worker_threads\").then(({ Worker }) => new Worker(\"require('node:child_process').spawnSync('claude', ['-p', 'mutant'], { stdio: 'ignore', shell: process.platform === 'win32' })\", { eval: true }).on(\"exit\", res)); });\n    const out = { ok: true, id: S.id, review, intent_ok: ir.ok };",
    why: "the close reaches a model call through a thread the recorder does not patch: the fake claude logs it" },
];

const witness = (org) => spawnSync(process.execPath, [join(HERE, "witness_mjud.mjs"), "--org", org, "--base-org", BASE], { encoding: "utf8", timeout: 900000, windowsHide: true });
const copyOf = () => { const d = join(mkdtempSync(join(tmpdir(), "mjud-mut-")), "org"); cpSync(ORG, d, { recursive: true, filter: (s) => !/^(node_modules|\.git)(\/|\\|$)/.test(relative(ORG, s)) }); return d; };
let red = 0;
for (const m of MUTANTS) {
  const d = copyOf(); const p = join(d, m.file);
  if (m.create) writeFileSync(p, m.create);
  else if (m.append) writeFileSync(p, readFileSync(p, "utf8") + m.append);
  else { const s = readFileSync(p, "utf8"); const n = s.split(m.from).length - 1; if (n !== 1) { console.log(`  ${m.id} NOT APPLIED — the replacement matched ${n} time(s) in ${m.file}`); continue; } writeFileSync(p, s.replace(m.from, () => m.to)); }
  const r = witness(d);
  const text = `${r.stdout || ""}${r.stderr || ""}`;
  writeFileSync(join(OUT, `mutant_${m.id}.txt`), text);
  const named = text.split(/\r?\n/).some((l) => l.startsWith(`  RED   ${m.clause} `));
  if (named && r.status === 1) red++;
  console.log(`  ${m.id} ${named && r.status === 1 ? "RED " : "MISS"} by ${m.clause} — ${m.why} · ${text.trim().split(/\r?\n/).at(-1)}`);
  rmSync(dirname(d), { recursive: true, force: true });
}
const c = copyOf(); const rc = witness(c);
const ctext = `${rc.stdout || ""}${rc.stderr || ""}`; writeFileSync(join(OUT, "mutant_control.txt"), ctext);
const green = rc.status === 0 && /^GREEN MJUD /.test(ctext.trim().split(/\r?\n/).at(-1));
rmSync(dirname(c), { recursive: true, force: true });
console.log(`run_mutants: ${red} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${green ? "GREEN" : "NOT GREEN"}`);
process.exit(red === MUTANTS.length && green ? 0 : 1);
