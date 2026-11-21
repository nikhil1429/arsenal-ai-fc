#!/usr/bin/env node
// ============================================================================
// ci/mcap/run_mutants_mcap.mjs — UNIT mcap · ONE MUTANT PER CLAUSE (brief: "mutants one per clause")
// ----------------------------------------------------------------------------
// Each mutant is applied to a COPY of the org (its scripts/ and ci/witness/mcap/) under os.tmpdir() (prefix mcap-mut-), and
// the copied witness runs `plants --org <copy>`. A mutant is KILLED iff the CLAUSE line of the clause that names it reads RED.
// The CONTROL (no mutation) must read every clause GREEN. Each mutation must match its site EXACTLY ONCE, or it is reported
// as not applied (a mutant that changes nothing proves nothing). No port, no network, no model; every child is spawnSync.
// USAGE: node ci/mcap/run_mutants_mcap.mjs [--org <dir>]
// LAST LINE: run_mutants: k of n mutant(s) RED by the clause that names them · control GREEN|RED   (exit 0 iff k === n, GREEN)
// ============================================================================
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, rmSync, cpSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const W = join("ci", "witness", "mcap", "witness_capability.mjs"), M = join("ci", "witness", "mcap", "capability_map.json");
const lines = (t) => String(t || "").split(/\r?\n/).filter((l) => l.trim());
const mapEdit = (fn) => ({ file: M, apply: (txt) => { const m = JSON.parse(txt); fn(m); return JSON.stringify(m, null, 2) + "\n"; } });
const textEdit = (from, to) => ({ file: W, apply: (txt) => (txt.split(from).length === 2 ? txt.replace(from, to) : null) });
const MUTANTS = [
  { clause: "c07", what: "the map drops A.new-terms", ...mapEdit((m) => { m.c07.checks = m.c07.checks.filter((x) => x !== "A.new-terms"); }) },
  { clause: "c10", what: "the map keeps A.position only (A.count-form dropped)", ...mapEdit((m) => { m.c10.checks = ["A.position"]; }) },
  { clause: "c12", what: "the map drops B.bank", ...mapEdit((m) => { m.c12.checks = m.c12.checks.filter((x) => x !== "B.bank"); }) },
  { clause: "c13", what: "a question is read as an answer (question dropped from the non-answer kinds)", ...mapEdit((m) => { m.c13.nonanswer_kinds = m.c13.nonanswer_kinds.filter((x) => x !== "question"); }) },
  { clause: "c18", what: "the text comparison is restored in place of the turn-identity join (row 1194 (1) refuses it)", ...textEdit("rows.find((r) => r && r[e.join.crack_field] === cap[e.join.capture_field])", "rows.find((r) => r && fold(r.words) === fold(cap.spoken))") },
  { clause: "c28", what: "the map drops the audit id no-system-mid-concept", ...mapEdit((m) => { m.c28.audit = []; }) },
  { clause: "c32", what: "the close half is dropped (an open moment at close is never red)", ...textEdit("if (!answered) return { code: 1,", "if (false) return { code: 1,") },
];

function runOn(org, mutant) {
  const T = mkdtempSync(join(tmpdir(), "mcap-mut-"));
  try {
    const R = join(T, "org");
    mkdirSync(join(R, "ci", "witness", "mcap"), { recursive: true });
    cpSync(join(org, "scripts"), join(R, "scripts"), { recursive: true });
    for (const f of [W, M]) writeFileSync(join(R, f), readFileSync(join(org, f), "utf8"));
    if (mutant) {
      const p = join(R, mutant.file), out = mutant.apply(readFileSync(p, "utf8"));
      if (out === null) return { applied: false };
      writeFileSync(p, out);
    }
    const r = spawnSync(process.execPath, [join(R, W), "plants", "--org", R], { encoding: "utf8", windowsHide: true });
    const verdict = Object.fromEntries(lines(r.stdout).map((l) => /^CLAUSE C:capability-(c\d\d) (GREEN|RED) /.exec(l)).filter(Boolean).map((m) => [m[1], m[2]]));
    return { applied: true, code: r.status, verdict, last: lines(r.stdout).pop() || "" };
  } finally { rmSync(T, { recursive: true, force: true }); }
}

const a = process.argv.slice(2);
const org = a.indexOf("--org") >= 0 ? resolve(a[a.indexOf("--org") + 1]) : REPO;
const ctl = runOn(org, null);
const ctlGreen = ctl.code === 0 && ["c07", "c10", "c12", "c13", "c18", "c28", "c32"].every((c) => ctl.verdict[c] === "GREEN");
console.log(`  control · ${ctlGreen ? "GREEN" : "RED"} · ${ctl.last}`);
let k = 0;
for (const m of MUTANTS) {
  const r = runOn(org, m);
  const killed = r.applied && r.verdict[m.clause] === "RED";
  if (killed) k++;
  const others = r.applied ? Object.entries(r.verdict).filter(([c, v]) => c !== m.clause && v === "RED").map(([c]) => c) : [];
  console.log(`  ${killed ? "RED " : "MISS"} C:capability-${m.clause} · ${m.what}${r.applied ? ` · clause ${r.verdict[m.clause] || "?"}${others.length ? ` (also red: ${others.join(", ")})` : ""}` : " · NOT APPLIED (its site did not match exactly once)"}`);
}
console.log(`run_mutants: ${k} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${ctlGreen ? "GREEN" : "RED"}`);
process.exitCode = k === MUTANTS.length && ctlGreen ? 0 : 1;
