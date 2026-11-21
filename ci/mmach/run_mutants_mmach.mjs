#!/usr/bin/env node
// ============================================================================
// ci/mmach/run_mutants_mmach.mjs — UNIT mmach · ONE MUTANT PER CLAUSE, EACH RED BY THE CLAUSE THAT NAMES IT
//   SOLE WRITER of: NOTHING outside its own os.tmpdir() root.
// ----------------------------------------------------------------------------
// USAGE: node ci/mmach/run_mutants_mmach.mjs --org <dir> --base-org <dir>
//   --org       the build tree (its ci/witness/mmach/witness_machine.mjs is the witness mutated / run)
//   --base-org  the BASE tree (ci/mmach/BASE), handed through to the witness unchanged
// Each mutant is ONE exact text replacement that must apply exactly once (a replacement that does not apply is a mutant
// NOT RED, never a silent skip). A `witness` mutant edits a COPY of the witness under the temp root and runs it on --org;
// an `org` mutant edits a COPY of --org (no .git, no node_modules) and runs the unmutated witness on it. A mutant is RED
// by its clause iff the witness exits 1 and its LAST line `RED MMACH · …` names that clause. The control (no mutant) must
// be GREEN, exit 0. Every line read from a process is split on \r?\n; nothing binds a port; no model is called.
// LAST LINE: run_mutants: k of n mutant(s) RED by the clause that names them · control GREEN|RED
// ============================================================================
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, cpSync } from "node:fs";
import { join, resolve, basename } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";

const argv = process.argv.slice(2);
const arg = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined; };
if (!arg("--org") || !arg("--base-org")) { console.log("run_mutants: usage --org <dir> --base-org <dir> · 0 of 0 mutant(s) RED · control RED"); process.exit(1); }
const ORG = resolve(arg("--org")), BASE = resolve(arg("--base-org"));
const WREL = ["ci", "witness", "mmach", "witness_machine.mjs"];
const VREL = ["scripts", "ci_verdict.mjs"];

/** @type {{ id: string, clause: string, kind: "witness"|"org", file?: string[], from?: string, to?: string, add?: [string[], string] }[]} */
const MUTANTS = [
  { id: "M1", clause: "B-machine:broken-red", kind: "witness",
    from: `p.legs.every((l) => l.v === "RED" && namesAmong(l.newText, broken.planted_assert))`,
    to: `p.legs.every((l) => l.v === "RED")` },
  { id: "M2", clause: "B-machine:clean-green", kind: "witness",
    from: `if (p.v === "UNREADABLE" || r.status === 2) return say(2, "UNREAD — the API was not read");`,
    to: `if ((p.v === "UNREADABLE" || r.status === 2) && mode === "clean") return say(0, "MUTANT: UNREADABLE read as green"); if (p.v === "UNREADABLE" || r.status === 2) return say(2, "UNREAD — the API was not read");` },
  { id: "M3", clause: "B-machine:read-no-login", kind: "org", file: VREL,
    from: `"User-Agent": "ci-verdict-reader" }`,
    to: '"User-Agent": "ci-verdict-reader", Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }' },
  { id: "M4", clause: "BOUND", kind: "org", add: [["scripts", "mmach_stray.txt"], "a file outside the named ones\n"] },
  { id: "M5", clause: "LAST", kind: "witness",
    from: `    const live = namingProcs(T);`,
    to: `    spawn(process.execPath, ["-e", "setInterval(() => {})", T], { detached: true, stdio: "ignore" }).unref();\n    const live = namingProcs(T);`,
    also: [`import { spawnSync } from "node:child_process";`, `import { spawnSync, spawn } from "node:child_process";`] },
];

/** exactly-once replacement @param {string} s @param {string} a @param {string} b */
const once = (s, a, b) => { const k = s.split(a).length - 1; return k === 1 ? s.replace(a, () => b) : null; };
/** run the witness file <w> on <org> @returns {{ code: number|null, last: string }} */
function run(w, org) {
  const r = spawnSync(process.execPath, [w, "--org", org, "--base-org", BASE], { encoding: "utf8", windowsHide: true });
  const last = String(r.stdout || "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean).pop() || "";
  return { code: r.status, last };
}
const T = mkdtempSync(join(tmpdir(), "mmach-mut-"));
let red = 0;
try {
  const W = join(ORG, ...WREL);
  const control = run(W, ORG);
  const controlGreen = control.code === 0 && control.last.startsWith("GREEN MMACH ");
  console.log(`  control · exit ${control.code} · ${control.last}`);
  for (const m of MUTANTS) {
    const d = join(T, m.id);
    mkdirSync(d, { recursive: true });
    let w = W, org = ORG, applied = true;
    if (m.kind === "witness") {
      let src = once(readFileSync(W, "utf8"), m.from, m.to);
      if (src !== null && m.also) src = once(src, m.also[0], m.also[1]);
      if (src === null) applied = false;
      else { w = join(d, basename(W)); writeFileSync(w, src); }
    } else {
      org = join(d, "org");
      cpSync(ORG, org, { recursive: true, filter: (p) => !/[\\/](\.git|node_modules)([\\/]|$)/.test(p.slice(ORG.length)) });
      if (m.add) { mkdirSync(join(org, ...m.add[0].slice(0, -1)), { recursive: true }); writeFileSync(join(org, ...m.add[0]), m.add[1]); }
      else {
        const p = join(org, ...m.file), src = once(readFileSync(p, "utf8"), m.from, m.to);
        if (src === null) applied = false; else writeFileSync(p, src);
      }
    }
    const r = applied ? run(w, org) : { code: null, last: "(the replacement did not apply exactly once)" };
    const mm = /^RED MMACH · (.*)$/.exec(r.last);
    const byName = applied && r.code === 1 && !!mm && mm[1].split(", ").map((s) => s.trim()).includes(m.clause);
    if (byName) red++;
    console.log(`  ${byName ? "✓" : "✗"} ${m.id} (${m.clause}, ${m.kind}) · exit ${r.code} · ${r.last}`);
  }
  console.log(`run_mutants: ${red} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${controlGreen ? "GREEN" : "RED"}`);
  process.exitCode = red === MUTANTS.length && controlGreen ? 0 : 1;
} finally {
  try { rmSync(T, { recursive: true, force: true }); } catch {}
}
