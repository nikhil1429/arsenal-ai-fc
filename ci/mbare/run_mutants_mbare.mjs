// unit mbare · THE MUTANTS — one per witness clause (ci/mbare/witness_mbare.mjs), each turning ITS clause RED on the build.
//   node ci/mbare/run_mutants_mbare.mjs --org <dir> --base-org <dir>
// Each mutant is ONE edit of a COPY of <org>'s scripts/organism_test.mjs, made under one temp dir (os.tmpdir()) and removed at
// the end; the witness then runs with --org <the mutated copy> --base-org <base-org>. A mutant counts only if the witness exits 1
// and its RED line names the mutant's clause; an edit whose anchor is absent is NOT APPLIED and does not count. The control is
// the unmutated <org>: it must read GREEN. CR-tolerant (every anchor matched with \r? line ends). No port, no service, no model.
// LAST LINE: run_mutants: k of n mutant(s) RED by the clause that names them · control GREEN|RED
import { spawnSync } from "node:child_process"; import { cpSync, mkdtempSync, readFileSync, writeFileSync, rmSync, symlinkSync, existsSync, realpathSync } from "node:fs";
import { join, dirname, relative, sep } from "node:path"; import { tmpdir } from "node:os"; import { fileURLToPath } from "node:url";
const HERE = dirname(fileURLToPath(import.meta.url));
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const ORG = arg("--org"), BASEORG = arg("--base-org");
if (!ORG || !BASEORG) { console.log("run_mutants: usage --org <dir> --base-org <dir>"); process.exit(2); }
const TMP = mkdtempSync(join(tmpdir(), "mbare-m-"));
/** @type {{ clause: string, what: string, edit: (s: string) => string | null }[]} */
const MUTANTS = [
  { clause: "REACH", what: "laws() ends silently after the A9 block on a bare state dir (no throw, later blocks unreached)",
    edit: (s) => { const re = /\r?\n(\s*)\/\/ THE FOUR LEGAL QUESTION-MOMENTS/; return re.test(s) ? s.replace(re, (m, ind) => `\n${ind}if (!readdirSync(STATE).includes("registry.json")) return;${m}`) : null; } },
  { clause: "NEVER-A-PASS", what: "the guard's red becomes a PASS (assert(..., true, ...))",
    edit: (s) => { const a = "is absent, so the block is not judged (a blocked block is never a pass)`, false,"; return s.includes(a) ? s.replace(a, a.replace("`, false,", "`, true,")) : null; } },
  { clause: "TRANSPARENT", what: "the guard adds one ok line to every block that ran (it is no longer invisible where the inputs exist)",
    edit: (s) => { const a = "try { await body(); } catch (e) {"; return s.includes(a) ? s.replace(a, 'try { await body(); assert("BARE GUARD · the block ran", true); } catch (e) {') : null; } },
  { clause: "RETHROW", what: "absentStateInput calls EVERY throw an absent input (a defect is swallowed as BLOCKED)",
    edit: (s) => { const re = /function absentStateInput\(e\) \{\r?\n/; return re.test(s) ? s.replace(re, (m) => `${m}  return "(any throw)";\n`) : null; } },
];
const copyOf = (tree, tag) => { const d = join(TMP, tag);
  cpSync(tree, d, { recursive: true, filter: (src) => { const r = relative(tree, src).split(sep).join("/"); return r !== "node_modules" && !r.startsWith("node_modules/") && r !== ".git" && !r.startsWith(".git/"); } });
  if (existsSync(join(tree, "node_modules"))) symlinkSync(realpathSync(join(tree, "node_modules")), join(d, "node_modules"), process.platform === "win32" ? "junction" : "dir");
  return d; };
const witness = (org) => { const r = spawnSync(process.execPath, [join(HERE, "witness_mbare.mjs"), "--org", org, "--base-org", BASEORG], { encoding: "utf8", maxBuffer: 1 << 28, windowsHide: true });
  const last = ((r.stdout || "") + (r.stderr || "")).split(/\r?\n/).map((l) => l.trim()).filter(Boolean).pop() || ""; return { code: r.status, last }; };
let k = 0, control = "RED";
try {
  MUTANTS.forEach((m, i) => {
    const d = copyOf(ORG, `m${i}`); const f = join(d, "scripts", "organism_test.mjs");
    const out = m.edit(readFileSync(f, "utf8"));
    if (out === null) { console.log(`NOT APPLIED  ${m.clause} — its anchor is absent in org's organism_test.mjs`); return; }
    writeFileSync(f, out);
    const w = witness(d); const reds = w.code === 1 && /^RED MBARE · /.test(w.last) ? w.last.replace(/^RED MBARE · /, "").split(" · ") : [];
    const hit = reds.includes(m.clause); if (hit) k++;
    console.log(`${hit ? "RED  " : "ALIVE"} mutant ${m.clause} — ${m.what} · witness exit ${w.code} · ${w.last}`);
    rmSync(d, { recursive: true, force: true });
  });
  const c = witness(ORG); control = c.code === 0 && /^GREEN MBARE /.test(c.last) ? "GREEN" : "RED";
  console.log(`control (unmutated org) · witness exit ${c.code} · ${c.last}`);
} finally { try { rmSync(TMP, { recursive: true, force: true }); } catch { /* nothing else to do */ } }
console.log(`run_mutants: ${k} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${control}`);
process.exit(k === MUTANTS.length && control === "GREEN" ? 0 : 1);
