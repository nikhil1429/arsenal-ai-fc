#!/usr/bin/env node
// ci/mtail/run_mutants.mjs — P3 of unit mtail: ONE mutant per witness clause, each must go RED by the clause that names it;
// ONE control (a comment-only edit of a named file) must stay GREEN.
// USAGE: node ci/mtail/run_mutants.mjs --org <build tree> --base-org <BASE tree>   (both git trees, ci/mtail/sides.mjs)
// Each mutant is a copy of --org under os.tmpdir() (its .git kept, so BOUND reads its tracked files), ONE exact-text edit applied
// (refused by name if the text is not found exactly once), then the witness runs on it. Full outputs: ci/mtail/out/mutant_<id>.txt.
// LAST LINE: run_mutants: k of n mutant(s) RED by the clause that names them · control GREEN|RED
import { cpSync, mkdtempSync, readFileSync, writeFileSync, rmSync, symlinkSync, existsSync, mkdirSync } from "node:fs";
import { join, resolve, dirname, relative, sep } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? resolve(process.argv[i + 1]) : null; };
const ORG = arg("--org"), BASE_ORG = arg("--base-org");
if (!ORG || !BASE_ORG) { console.log("run_mutants: USAGE --org <build tree> --base-org <BASE tree>"); process.exit(2); }
const OUT = join(HERE, "out"); mkdirSync(OUT, { recursive: true });

const MUTANTS = [
  { id: "m_t1", clause: "T1 F-B", file: "scripts/postmatch.mjs", why: "the judge step needs only the OLD budget + card (BASE's fits), so a judge child can start without its margin",
    from: "    const f = fits(JUDGE_CHILD_MS + CHILD_TIMEOUT_MS);", to: "    const f = fits(JUDGE_BUDGET_MS + CHILD_TIMEOUT_MS);" },
  { id: "m_t2", clause: "T2 F-C", file: "scripts/sitting.mjs", why: "the CLI's close wait drops the session grace and the judge's budget (a wait below the longest close)",
    from: "export function closeWaitMs() { return CLOSE_OWNER_STEPS.reduce((a, [file, args]) => a + ownerTimeoutMs(file, args), 0) + SESSION_CLOSE_MS; }",
    to: "export function closeWaitMs() { return CLOSE_OWNER_STEPS.reduce((a, [file, args]) => a + ownerTimeoutMs(file, args), 0) + SESSION_CLOSE_MS - JUDGE_BUDGET_MS; }" },
  { id: "m_t3", clause: "T3 AUTH", file: "scripts/gaffer_brain.mjs", why: "JUDGE_AUTH_RE becomes a RESTATED pattern (an equal RegExp, another object, its own literal)",
    from: "export const JUDGE_AUTH_RE = AUTH_REFUSAL_RE;", to: "export const JUDGE_AUTH_RE = /not logged in|please run \\/login|invalid api key|authenticat|unauthorized|oauth session expired|could not be refreshed/i;" },
  { id: "m_t4", clause: "T4 F1", file: "scripts/postmatch.mjs", why: "postmatch carries its own copy of captureDay again (the import dropped)",
    from: "import { JUDGE_BUDGET_MS, JUDGE_DISPATCH_MS, outstandingBank, captureDay } from \"./gaffer_brain.mjs\";",
    to: "import { JUDGE_BUDGET_MS, JUDGE_DISPATCH_MS, outstandingBank } from \"./gaffer_brain.mjs\";\nfunction captureDay(it) {\n  const ms = Date.parse(String((it && it.ts) || \"\"));\n  if (Number.isFinite(ms)) return { day: new Date(ms + 5.5 * 3600000).toISOString().slice(0, 10), at: new Date(ms).toISOString() };\n  const carried = it && typeof it.day === \"string\" ? it.day : \"\";\n  const isDay = carried.length === 10 && Number.isFinite(Date.parse(`${carried}T00:00:00.000Z`)) && new Date(Date.parse(`${carried}T00:00:00.000Z`)).toISOString().slice(0, 10) === carried;\n  return { day: isDay ? carried : null, at: null };\n}" },
  { id: "m_bound", clause: "BOUND", file: "scripts/daily_green.mjs", why: "a file OUTSIDE the named five changes (one comment line)",
    from: null, append: "\n// mutant m_bound: a file outside the named five\n" },
  { id: "m_last", clause: "LAST", file: "scripts/postmatch.mjs", why: "the close makes a model call (a `claude` spawn the fake claude logs)",
    from: "  const { spawnSync } = await import(\"node:child_process\");\n  const run = (file, args,",
    to: "  const { spawnSync } = await import(\"node:child_process\");\n  spawnSync(\"claude\", [\"-p\", \"mutant\"], { stdio: \"ignore\", shell: process.platform === \"win32\" });\n  const run = (file, args," },
  { id: "control", clause: null, file: "scripts/postmatch.mjs", why: "a comment-only edit of a named file (must stay GREEN)",
    from: null, append: "\n// control: a comment-only edit\n" },
];

const root = mkdtempSync(join(tmpdir(), "mtail-mut-"));
let red = 0, n = 0, controlGreen = false;
try {
  for (const m of MUTANTS) {
    const dst = join(root, m.id);
    cpSync(ORG, dst, { recursive: true, filter: (p) => relative(ORG, p).split(sep)[0] !== "node_modules" });
    if (existsSync(join(ORG, "node_modules"))) symlinkSync(join(ORG, "node_modules"), join(dst, "node_modules"), "junction");
    const f = join(dst, m.file);
    const src = readFileSync(f, "utf8");
    if (m.from !== null) {
      const k = src.split(m.from).length - 1;
      if (k !== 1) { console.log(`  ${m.id} · REFUSED — its text is found ${k} time(s) in ${m.file}, not once`); if (m.clause) n++; continue; }
      writeFileSync(f, src.replace(m.from, () => m.to));
    } else writeFileSync(f, src + m.append);
    const r = spawnSync(process.execPath, [join(HERE, "witness_mtail.mjs"), "--org", dst, "--base-org", BASE_ORG], { encoding: "utf8", windowsHide: true });
    const out = `${r.stdout || ""}${r.stderr || ""}`;
    writeFileSync(join(OUT, `mutant_${m.id}.txt`), out + `exit ${r.status}\n`);
    const last = out.split(/\r?\n/).filter(Boolean).at(-1) || "";
    if (m.clause === null) { controlGreen = r.status === 0 && /^GREEN MTAIL /.test(last); console.log(`  control · ${controlGreen ? "GREEN" : "RED"} · ${last}`); continue; }
    n++;
    const named = new RegExp(`^RED MTAIL · (?:.* · )?${m.clause.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?: · |$)`).test(last) && r.status === 1;
    if (named) red++;
    console.log(`  ${m.id} (${m.clause}) · ${named ? "RED by its clause" : "MISSED"} · ${m.why} · ${last}`);
  }
} finally { try { rmSync(root, { recursive: true, force: true }); } catch { } }
console.log(`run_mutants: ${red} of ${n} mutant(s) RED by the clause that names them · control ${controlGreen ? "GREEN" : "RED"}`);
process.exitCode = red === n && controlGreen ? 0 : 1;
