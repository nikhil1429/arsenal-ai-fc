#!/usr/bin/env node
// ci/mfactory/run_mutants_mfactory.mjs [--org <build dir>] [--base-org <base dir>]
// One mutant per witness clause of ci/witness/mfactory/witness_factory.mjs (the spec's μ for P1, plus one for every clause the
// witness adds): each is a COPY of --org under os.tmpdir() with ONE edit (the files the tree's git would commit: tracked and
// untracked-not-ignored; never .git, node_modules or dressing-room/state), and the ORIGINAL witness, run on that copy with
// --only <its group>, must read RED on the clause that names the mutant. The control (the copy, unedited) runs the WHOLE witness
// and must read GREEN. An edit site is matched in the file's OWN line ending and must be unique, or the mutant is NOT APPLIED
// and counts as surviving. Nothing under --org is written; no git repo is planted; no port, no network, no model.
// --org defaults to this repository; --base-org defaults to the witness's own (an LF tree of ci/mfactory/BASE).
// LAST LINE: run_mutants: k of n mutant(s) RED by the clause that names them · control GREEN|RED
import { mkdtempSync, mkdirSync, cpSync, readFileSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const ORG = resolve(arg("--org") || join(HERE, "..", ".."));
const BASE = arg("--base-org") ? resolve(/** @type {string} */ (arg("--base-org"))) : null;
const W_REL = "ci/witness/mfactory/witness_factory.mjs";
const WITNESS = join(ORG, W_REL);
const MUTANTS = [
  { clause: "P1", only: "P1", file: W_REL, edits: [["if (!Number.isFinite(c.value))", "if (!(c.value != null))"]], what: 'μ (spec): Number.isFinite → != null — the "n/a" plant goes 0' },
  { clause: "P2", only: "P2", file: W_REL, edits: [["if (owner && !c.source", "if (false && !c.source"]], what: "the owner match dropped — landings sourced to night.mjs goes 0" },
  { clause: "P3", only: "P3", file: W_REL, edits: [["try { r = JSON.parse(l); } catch { return out(2,", "try { r = JSON.parse(l); } catch { continue; return out(2,"]], what: "a corrupt line skipped — the corrupt-beside-good plant goes 0" },
  { clause: "P4", only: "P4", file: W_REL, edits: [["if (!own.ok) return out(2, own.why);", "void own;"]], what: "the owners not derived — night.mjs without memory goes 0" },
  { clause: "BOUND", only: "BOUND", file: "scripts/land.mjs", edits: [["const UNATTENDED_AFTER = 10;", "const UNATTENDED_AFTER = 10; // mutant"]], what: "a file beyond the named differs (scripts/land.mjs)" },
  { clause: "LAST", only: "P1", file: W_REL, edits: [
    ['import { spawnSync } from "node:child_process";', 'import { spawnSync, spawn } from "node:child_process";'],
    ["  if (!win) return out(2, \"no --window <id> given\");", "  spawn(process.execPath, [\"-e\", \"setTimeout(() => {}, 20000)\", \"--\", ...argv], { detached: true, stdio: \"ignore\" }).unref();\n  if (!win) return out(2, \"no --window <id> given\");"]],
    what: "the reader leaves a detached node naming the temp root" },
];
// the files the tree's git would commit (a tree that is no git work tree: every file but .git / node_modules / state)
const listed = (() => {
  const r = spawnSync("git", ["-C", ORG, "ls-files", "-z", "-co", "--exclude-standard"], { encoding: "utf8", maxBuffer: 1 << 26, windowsHide: true });
  return r.status === 0 ? r.stdout.split("\0").filter(Boolean) : null;
})();
const ROOT = mkdtempSync(join(tmpdir(), "mfactory-mutants-"));
const keep = (rel) => { const top = rel.split("/")[0]; return top !== ".git" && top !== "node_modules" && rel !== "dressing-room/state" && !rel.startsWith("dressing-room/state/"); };
const copyOrg = (name) => {
  const d = join(ROOT, name);
  if (listed) for (const rel of listed.filter(keep)) { const s = join(ORG, rel); if (!existsSync(s)) continue; mkdirSync(dirname(join(d, rel)), { recursive: true }); cpSync(s, join(d, rel)); }
  else cpSync(ORG, d, { recursive: true, filter: (p) => keep(p.slice(ORG.length + 1).split("\\").join("/")) });
  return d;
};
const run = (org, only) => {
  const r = spawnSync(process.execPath, [WITNESS, "plants", "--org", org, ...(BASE_T ? ["--base-org", BASE_T] : []), ...(only ? ["--only", only] : [])], { encoding: "utf8", cwd: ORG, windowsHide: true });
  const ls = String(r.stdout || "").split(/\r?\n/).filter(Boolean);
  return { code: r.status, lines: ls, last: ls[ls.length - 1] || "" };
};
// no --base-org: the LF tree of ci/mfactory/BASE, built from ORG's own git (private index, core.autocrlf=false), once
let BASE_T = BASE;
if (!BASE_T) {
  const b = (() => { try { return readFileSync(join(ORG, "ci", "mfactory", "BASE"), "utf8").trim(); } catch { return ""; } })();
  const into = join(ROOT, "base");
  mkdirSync(into, { recursive: true });
  const r = spawnSync("git", ["-c", "core.autocrlf=false", "-c", "core.eol=lf", "-C", ORG, `--work-tree=${into}`, "checkout", "-q", b, "--", "."], { encoding: "utf8", windowsHide: true, env: { ...process.env, GIT_INDEX_FILE: `${into}.index` } });
  if (r.status === 0) BASE_T = into; else console.log(`  (the BASE tree could not be built: ${String(r.stderr || "").trim().split(/\r?\n/)[0]})`);
}
let red = 0;
for (const m of MUTANTS) {
  const d = copyOrg(`m-${m.clause}`);
  const p = join(d, m.file);
  let s = readFileSync(p, "utf8"), applied = true;
  const eol = s.includes("\r\n") ? "\r\n" : "\n";
  for (const [a, b] of m.edits) {
    const from = a.replace(/\r?\n/g, eol), to = b.replace(/\r?\n/g, eol);
    if (s.split(from).length !== 2) { applied = false; break; }
    s = s.replace(from, () => to);
  }
  if (!applied) { console.log(`  mutant ${m.clause} NOT APPLIED — an edit site is not unique in ${m.file}`); rmSync(d, { recursive: true, force: true }); continue; }
  writeFileSync(p, s);
  const r = run(d, m.only);
  const named = r.lines.find((l) => new RegExp(`^\\s+(GREEN|RED)\\s+${m.clause} `).test(l)) || "";
  const ok = r.code === 1 && /^\s+RED\s/.test(named);
  if (ok) red++;
  console.log(`  mutant ${m.clause} (${m.what}): ${ok ? "RED by its clause" : "SURVIVED"} · ${named.trim().slice(0, 160) || r.last}`);
  rmSync(d, { recursive: true, force: true });
}
const c = run(copyOrg("control"), null);
const control = c.code === 0 && /^GREEN MFACTORY /.test(c.last);
console.log(`  control: ${c.last}`);
rmSync(ROOT, { recursive: true, force: true });
console.log(`run_mutants: ${red} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${control ? "GREEN" : "RED"}`);
process.exit(red === MUTANTS.length && control ? 0 : 1);
