#!/usr/bin/env node
// ============================================================================
// ci/mpinr/run_mutants_mpinr.mjs · ONE MUTANT PER CLAUSE of ci/mpinr/witness_mpinr.mjs — header = contract
// ----------------------------------------------------------------------------
// USE:   node ci/mpinr/run_mutants_mpinr.mjs --org <build dir> --base-org <base dir>
// Each mutant is a fresh `git clone -c core.autocrlf=false` of --org under os.tmpdir(), with ONE text mutation applied
// to its working tree by node (the anchor must occur exactly once, or the mutant is NOT APPLIED and counts against the
// run). The witness then judges the clone; the mutant is caught only when the witness exits 1 AND its RED list names the
// mutant's own clause. The control is the same clone unmutated: it must read GREEN.
// THE PORT CLASS (row 1053): no port, no service, no POST, no restart; every child wait is bounded by the base owner's
// STEP_TIMEOUT_MS read here (scripts/conductor.mjs), the bound the witness itself uses. The witness runs at most one bounded
// child per clause plus its detector's wait, so ITS wait here is that bound times (clauses + 1) — derived from MUTANTS (one
// per clause), never typed: a witness given only one bound is killed before it can print the RED it owes (first run,
// 19 Nov 2026: the KILLED mutant read "witness exit null").
// LAST LINE: run_mutants: <k> of <n> mutant(s) RED by the clause that names them · control GREEN|RED   (exit 0 iff k = n and GREEN)
// ============================================================================
import { readFileSync, writeFileSync, mkdtempSync, rmSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { spawnSync, execFileSync } from "node:child_process";

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : undefined; };
const ORG = arg("--org") && resolve(arg("--org")), BASE_ORG = arg("--base-org") && resolve(arg("--base-org"));
if (!ORG || !BASE_ORG || !existsSync(ORG) || !existsSync(BASE_ORG)) { console.error("usage: node ci/mpinr/run_mutants_mpinr.mjs --org <dir> --base-org <dir>"); process.exit(2); }
const WITNESS = join(dirname(fileURLToPath(import.meta.url)), "witness_mpinr.mjs");
const fold = (s) => String(s).replace(/\r\n/g, "\n");
const owner = fold(readFileSync(join(BASE_ORG, "scripts", "conductor.mjs"), "utf8")).split("\n").find((l) => /^const STEP_TIMEOUT_MS = \d+;/.test(l)) || "";
const BOUND = Number((owner.match(/= (\d+);/) || [])[1]);
if (!Number.isSafeInteger(BOUND) || BOUND <= 0) { console.log("run_mutants: the bound did not read from the base owner"); process.exit(2); }

const MOD = "scripts/own_source.mjs";
// [clause, file, anchor, replacement] — each breaks exactly the repair its clause guards.
const MUTANTS = [
  ["SELFTEST", MOD, 'if (mode === "selftest") process.exit(selftest() ? 0 : 1);', 'if (mode === "selftest") process.exit(0);'],
  ["SUITE", "package.json", " && node scripts/own_source.mjs selftest\",", "\","],
  ["NARROW", MOD, "const text = lines.slice(range[0], range[1] + 1);", "const text = lines;"],
  ["KILLED", MOD, "encoding: \"utf8\", timeout: bound, windowsHide: true", "encoding: \"utf8\", windowsHide: true"],
  ["GUARD", MOD, 'throw new Error("own_source guard refused " + k);', "return undefined;"],
  ["COPY", MOD, "for (const f of state) {", 'for (const f of readdirSync(join(root, "dressing-room", "state"))) {'],
  ["LEAF", MOD, 'import { spawnSync } from "node:child_process";', 'import { spawnSync } from "node:child_process";\nimport { CHILD_TIMEOUT_MS } from "./postmatch.mjs";'],
  ["ONLY-NAMED", "scripts/models.mjs", "#!/usr/bin/env node\n", "#!/usr/bin/env node\n// a byte outside the named files\n"],
  ["LAST", MOD, 'const box = mkdtempSync(join(tmpdir(), "own-source-selftest-"));',
    'const box = mkdtempSync(join(tmpdir(), "own-source-selftest-"));\n  spawnLeft(process.execPath, ["-e", "setTimeout(() => {}, " + childBoundMs() + ")", box], { detached: true, stdio: "ignore" }).unref();',
    ['import { spawnSync } from "node:child_process";', 'import { spawnSync, spawn as spawnLeft } from "node:child_process";']],
];

const ROOT = mkdtempSync(join(tmpdir(), "mpinr-mutants-"));
const cloneOf = (name) => {
  const d = join(ROOT, name);
  execFileSync("git", ["clone", "-q", "-c", "core.autocrlf=false", ORG, d], { windowsHide: true, timeout: BOUND });
  const head = fold(execFileSync("git", ["-C", ORG, "rev-parse", "HEAD"], { encoding: "utf8", windowsHide: true })).trim();
  execFileSync("git", ["-C", d, "checkout", "-q", head], { windowsHide: true, timeout: BOUND });
  return d;
};
const judge = (d) => {
  const r = spawnSync(process.execPath, [WITNESS, "--org", d, "--base-org", BASE_ORG], { encoding: "utf8", timeout: BOUND * (MUTANTS.length + 1), windowsHide: true });
  const last = (fold(r.stdout || "").trim().split("\n").pop() || "").trim();
  return { status: r.status, last, timedOut: !!(r.error && r.error.code === "ETIMEDOUT") };
};
const apply = (d, file, pairs) => {
  const p = join(d, file);
  let s = fold(readFileSync(p, "utf8"));
  for (const [a, b] of pairs) { if (s.split(a).length !== 2) return false; s = s.replace(a, b); }
  writeFileSync(p, s);
  return true;
};

let caught = 0;
try {
  for (const [clause, file, anchor, repl, extra] of MUTANTS) {
    const d = cloneOf("m-" + clause.toLowerCase());
    if (!apply(d, file, [[anchor, repl], ...(extra ? [extra] : [])])) { console.log(`  NOT APPLIED ${clause} — its anchor is not exactly once in ${file}`); continue; }
    const j = judge(d);
    const reds = j.last.startsWith("RED MPINR · ") ? j.last.slice("RED MPINR · ".length).split(" · ") : [];
    const ok = j.status === 1 && reds.includes(clause);
    if (ok) caught++;
    console.log(`  ${ok ? "RED " : "MISS"} ${clause} — ${file}: witness exit ${j.status}${j.timedOut ? " (killed at the bound)" : ""} · ${j.last}`);
    rmSync(d, { recursive: true, force: true });
  }
  const c = judge(cloneOf("control"));
  const green = c.status === 0 && /^GREEN MPINR /.test(c.last);
  console.log(`  control — witness exit ${c.status} · ${c.last}`);
  console.log(`run_mutants: ${caught} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${green ? "GREEN" : "RED"}`);
  process.exitCode = caught === MUTANTS.length && green ? 0 : 1;
} finally { rmSync(ROOT, { recursive: true, force: true }); }
