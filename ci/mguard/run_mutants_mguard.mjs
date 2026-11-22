#!/usr/bin/env node
// ci/mguard/run_mutants_mguard.mjs — THE MUTANTS of unit mguard (spec ci/mguard/MGUARD_SPEC.md §5; forks rows 1176 / 1177 (3)).
// HEADER = CONTRACT.
//
//   node ci/mguard/run_mutants_mguard.mjs --org <dir> --base-org <dir>
//
// Each mutant is ONE textual change to a COPY of --org (its scripts/*.mjs, the judge ci/witness/mguard/witness_guard.mjs
// and .github/workflows/suite.yml, copied under one os.tmpdir() dir); the witness beside this file
// (ci/mguard/witness_mguard.mjs) is then run with --org <the mutant copy> --base-org <dir>, and the mutant is CAUGHT iff
// the witness's LAST line is `RED MGUARD · …` and names the clause the mutant is aimed at. A mutant whose anchor text is
// not found is NOT APPLIED and counts as a miss (never a catch). The CONTROL is the unmutated copy: it must read GREEN.
// It binds no port, names no live service, POSTs nothing, calls no model; each child is capped at the job's own
// timeout-minutes read from --org's suite.yml (never typed). LAST: no node process naming the temp dir survives.
//
// LAST LINE   run_mutants: <k> of <n> mutant(s) RED by the clause that names them · control GREEN|RED     (exit 0 iff k = n and GREEN)

import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readdirSync, readFileSync, writeFileSync, copyFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const argOf = (n) => { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : undefined; };
const ORG = argOf("--org") && resolve(argOf("--org")), BASE = argOf("--base-org") && resolve(argOf("--base-org"));
if (!ORG || !BASE) { console.error("usage: node ci/mguard/run_mutants_mguard.mjs --org <dir> --base-org <dir>"); console.log("run_mutants: 0 of 0 mutant(s) RED by the clause that names them · control RED"); process.exit(1); }
const WITNESS = join(HERE, "witness_mguard.mjs");
const JUDGE_REL = ["ci", "witness", "mguard", "witness_guard.mjs"];
const TAP_REL = ["scripts", "usage_tap.mjs"];
const CAP_MS = (() => { try { const m = /timeout-minutes:\s*(\d+)/.exec(readFileSync(join(ORG, ".github", "workflows", "suite.yml"), "utf8")); return m ? Number(m[1]) * 60 * 1000 : undefined; } catch { return undefined; } })();
const TMP = mkdtempSync(join(tmpdir(), "mguard-mutants-"));

// [id, the clause that must name it, the file, the anchor, the replacement, what it breaks]
const MUTANTS = [
  ["M0", "R1176.3", TAP_REL, "const noRootRed = (shown) => `RED · usage tap · no campaign root (${ROOT_DOOR} unset) — this reading (${shown}) is DROPPED, nothing written`;",
    "const noRootRed = (shown) => `${shown} · no campaign root (${ROOT_DOOR} unset) — nothing written`;", "no root fails open into a reading-shaped line again"],
  ["M1177", "U1177", JUDGE_REL, 'say("U1177", UNREAD, `no away-span rows', 'say("U1177", HOLDS, `no away-span rows', "a day with no away-span rows reads as holding (no spend)"],
  ["M1", "G1", JUDGE_REL, 'if (!spans.size) { say("G1", UNREAD,', 'if (!spans.size) { say("G1", HOLDS,', "no closed span is treated as holds"],
  ["M2", "G2", TAP_REL, "for (const r of rows) if (tOf(r) <= s) r0 = r;", "r0 = rows[0] || null;", "the bracket starts at the day's first reading, not the span's edge"],
  ["M2b", "G2", TAP_REL, 'if (s - tOf(r0) >= bound || tOf(r1) - e >= bound) return U("unbracketed", bracket);', "", "the age bound is dropped"],
  ["M3", "G3", JUDGE_REL, "return NAMES_HISTORY.test(c) && WRITE.test(c);", 'return f === "usage_tap.mjs";', "the static writer scan is skipped"],
  ["M4", "G4", JUDGE_REL, 'if (bad.length) say("G4", RED,', 'if (false) say("G4", RED,', "any shown row is accepted (no equality)"],
];

function copyOrg(into) {
  mkdirSync(join(into, "scripts"), { recursive: true });
  for (const f of readdirSync(join(ORG, "scripts"))) if (f.endsWith(".mjs")) copyFileSync(join(ORG, "scripts", f), join(into, "scripts", f));
  mkdirSync(join(into, ...JUDGE_REL.slice(0, -1)), { recursive: true });
  if (existsSync(join(ORG, ...JUDGE_REL))) copyFileSync(join(ORG, ...JUDGE_REL), join(into, ...JUDGE_REL));
  mkdirSync(join(into, ".github", "workflows"), { recursive: true });
  if (existsSync(join(ORG, ".github", "workflows", "suite.yml"))) copyFileSync(join(ORG, ".github", "workflows", "suite.yml"), join(into, ".github", "workflows", "suite.yml"));
}
const children = [];
function witness(org) {
  const r = spawnSync(process.execPath, [WITNESS, "--org", org, "--base-org", BASE], { encoding: "utf8", timeout: CAP_MS, windowsHide: true });
  if (r.pid) children.push(r.pid);
  const last = String(r.stdout || "").split(/\r?\n/).map((s) => s.trim()).filter(Boolean).pop() || "";
  return { code: r.status, last };
}

let caught = 0, control = false;
const survivors = [];
try {
  const c0 = join(TMP, "control"); copyOrg(c0);
  const cw = witness(c0);
  control = cw.code === 0 && /^GREEN MGUARD /.test(cw.last);
  console.log(`  ${control ? "ok  " : "FAIL"} CONTROL · ${cw.last} (exit ${cw.code})`);
  for (const [id, clause, rel, anchor, repl, what] of MUTANTS) {
    const at = join(TMP, id); copyOrg(at);
    const p = join(at, ...rel);
    const src = existsSync(p) ? readFileSync(p, "utf8") : "";
    if (!src.includes(anchor)) { console.log(`  FAIL ${id} → ${clause} · NOT APPLIED (anchor absent in ${rel.join("/")})`); continue; }
    writeFileSync(p, src.replace(anchor, repl));
    const w = witness(at);
    const m = /^RED MGUARD · (.*)$/.exec(w.last);
    const names = !!m && m[1].split(/,\s*/).includes(clause);
    if (names) caught++;
    console.log(`  ${names ? "ok  " : "FAIL"} ${id} → ${clause} · ${what} · ${w.last} (exit ${w.code})`);
  }
} finally {
  for (const pid of children) { try { process.kill(pid, 0); survivors.push(pid); try { process.kill(pid); } catch { /* gone */ } } catch { /* dead — good */ } }
  if (existsSync("/proc")) {
    for (const p of readdirSync("/proc")) {
      if (!/^\d+$/.test(p) || Number(p) === process.pid) continue;
      try { const cl = readFileSync(join("/proc", p, "cmdline"), "utf8"); if (cl.includes(TMP) && /node/.test(cl)) { survivors.push(Number(p)); try { process.kill(Number(p)); } catch { /* gone */ } } } catch { /* raced */ }
    }
  }
  rmSync(TMP, { recursive: true, force: true });
}
console.log(`  ${survivors.length ? "FAIL" : "ok  "} LAST · no node process naming the temp dir survives`);
console.log(`run_mutants: ${caught} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${control ? "GREEN" : "RED"}`);
process.exit(caught === MUTANTS.length && control && !survivors.length ? 0 : 1);
