#!/usr/bin/env node
// ci/mherm/run_mutants_mherm.mjs — unit mherm · ONE MUTANT PER CLAUSE, each RED by the clause that names it, and a control.
// ----------------------------------------------------------------------------------------------------------------------
// USAGE: node ci/mherm/run_mutants_mherm.mjs --org <build checkout> --base-org <base checkout>
//   Each mutant is a plain copy of the build org (node_modules and .git left out) under one temp root, with ONE piece of the
//   build taken back to the base, then judged by ci/mherm/witness_mherm.mjs --org <mutant> --base-org <base>. A mutant counts
//   only when the witness exits 1 and its LAST line `RED MHERM · …` names the mutant's clause. The control is the unmutated
//   copy, judged the same way: it must be GREEN.
//   M-W1 · T1 and F1 B back (scripts/sandbox.mjs and scripts/audit_preload.mjs = the base's): the collar holds by EITHER lock,
//          so the clause's mutant takes both — the sandbox's own temp AND the dropped temp allowance.
//   M-W2 · T4 back (scripts/tone.mjs = the base's): the selftest's failure line lands in scripts/tone.log in the tree.
//   M-W3 · T3 back (the ledger block read again under the hermetic profile, organism_test.mjs).
//   M-W4 · T2 back (the run's temp dir no longer handed to this process nor to a child given its own env).
//   M-W5 · T1, F1 B, T2 and T3 back: the second run differs only when the canary escapes (both collar locks off and the
//          sandbox member's temp an ancestor of the tree, i.e. no T2) AND the ledger block reads the file it left (no T3).
//   Every file of a mutant is the build's or the base's own; no line of either is typed here except the two textual
//   reverts, each matched exactly once or the runner refuses.
// PORT CLASS: as the witness (no port, no service, no POST, no restart); LAST: no process naming the temp root survives.
// LAST LINE: `run_mutants: <k> of <n> mutant(s) RED by the clause that names them · control GREEN|RED`; exit 0 iff k = n and
//   the control is GREEN.
// ----------------------------------------------------------------------------------------------------------------------
import { spawnSync, execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join, resolve, relative, sep, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { survivors, isRepo } from "./witness_mherm.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const org = arg("--org"), base = arg("--base-org");
if (!org || !base || !existsSync(org) || !existsSync(base)) { console.log("run_mutants: USAGE --org <build> --base-org <base>"); process.exit(1); }
const ORG = resolve(org), BASE = resolve(base);
// a checkout's file is read from its HEAD (never its working dir, which may hold edits or gitignored files); a plain tree's as is
const baseIsRepo = isRepo(BASE);
const fromBase = (tree, rel) => writeFileSync(join(tree, rel), baseIsRepo
  ? execFileSync("git", ["-c", "core.autocrlf=false", "show", `HEAD:${rel.split(sep).join("/")}`], { cwd: BASE, maxBuffer: 64 * 1024 * 1024 })
  : readFileSync(join(BASE, rel)));
/** replace <from> by <to> in <tree>/<rel>, exactly once, or refuse */
const revert = (tree, rel, from, to) => {
  const p = join(tree, rel), s = readFileSync(p, "utf8"), n = s.split(from).length - 1;
  if (n !== 1) throw new Error(`mutant refused: ${rel} holds the build's text ${n} time(s), not once — ${from.slice(0, 60)}`);
  writeFileSync(p, s.replace(from, to));
};
const OT = join("scripts", "organism_test.mjs");
const T2 = (t) => {
  revert(t, OT, `for (const k of ["TMPDIR", "TEMP", "TMP"]) process.env[k] = RUN_TMP;`, "");
  revert(t, OT, "env: { ...opts.env, TMPDIR: RUN_TMP, TEMP: RUN_TMP, TMP: RUN_TMP }", "env: opts.env");
};
const T3 = (t) => {
  const s = readFileSync(join(t, OT), "utf8");
  const m = /const ledgerLanes = PROFILE === "hermetic" && liveNamed\([^]*?\) \? null : \(\(\) => \{/.exec(s);
  if (!m) throw new Error("mutant refused: the T3 line is not in the build's organism_test.mjs");
  revert(t, OT, m[0], "const ledgerLanes = (() => {");
};
const COLLAR = (t) => { fromBase(t, join("scripts", "sandbox.mjs")); fromBase(t, join("scripts", "audit_preload.mjs")); };
const MUTANTS = [
  { id: "M-W1", clause: "W1 COLLAR", apply: COLLAR },
  { id: "M-W2", clause: "W2 TREE", apply: (t) => fromBase(t, join("scripts", "tone.mjs")) },
  { id: "M-W3", clause: "W3 LEDGER", apply: T3 },
  { id: "M-W4", clause: "W4 TEMP", apply: T2 },
  { id: "M-W5", clause: "W5 TWICE", apply: (t) => { COLLAR(t); T2(t); T3(t); } },
];

const orgIsRepo = isRepo(ORG);
const R = mkdtempSync(join(tmpdir(), "mherm-m-"));
let k = 0, control = "RED";
try {
  const plain = (id) => {
    const d = join(R, id);
    // a checkout: a clone of its HEAD with .git removed (its gitignored files never leave it); a plain tree: copied
    if (orgIsRepo) { execFileSync("git", ["-c", "core.autocrlf=false", "clone", "-q", "--no-local", "-c", "core.autocrlf=false", ORG, d], { stdio: ["ignore", "pipe", "pipe"] }); rmSync(join(d, ".git"), { recursive: true, force: true }); }
    else cpSync(ORG, d, { recursive: true, filter: (s) => { const r = relative(ORG, s).split(sep)[0]; return r !== "node_modules" && r !== ".git"; } });
    return d;
  };
  const judge = (tree) => {
    const r = spawnSync(process.execPath, [join(HERE, "witness_mherm.mjs"), "--org", tree, "--base-org", BASE], { encoding: "utf8", windowsHide: true, maxBuffer: 64 * 1024 * 1024 });
    const last = String(r.stdout || "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean).pop() || "(no last line)";
    return { code: r.status, last, out: String(r.stdout || "") };
  };
  for (const m of MUTANTS) {
    const t = plain(m.id);
    let line;
    try { m.apply(t); const j = judge(t); const named = j.code === 1 && /^RED MHERM · /.test(j.last) && j.last.slice("RED MHERM · ".length).split(", ").includes(m.clause);
      if (named) k++;
      line = `${named ? "RED " : "MISS"} ${m.id} → ${j.last}`;
    } catch (e) { line = `MISS ${m.id} → ${e instanceof Error ? e.message : String(e)}`; }
    console.log(`  ${line}`);
    rmSync(t, { recursive: true, force: true });
  }
  const c = judge(plain("control"));
  control = c.code === 0 && /^GREEN MHERM /.test(c.last) ? "GREEN" : "RED";
  console.log(`  control → ${c.last}`);
} finally {
  const left = survivors(R);
  for (const p of left) { try { process.kill(p); } catch {} }
  if (left.length) console.log(`  LAST · ${left.length} process(es) named the temp root and were killed`);
  rmSync(R, { recursive: true, force: true });
}
console.log(`run_mutants: ${k} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${control}`);
process.exit(k === MUTANTS.length && control === "GREEN" ? 0 : 1);
