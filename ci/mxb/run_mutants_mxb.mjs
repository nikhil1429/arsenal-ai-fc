#!/usr/bin/env node
// ============================================================================
// ci/mxb/run_mutants_mxb.mjs — UNIT mxb · ONE MUTANT PER CLAUSE of ci/mxb/witness_mxb.mjs; each must turn ITS clause RED
// ----------------------------------------------------------------------------
// USAGE: node ci/mxb/run_mutants_mxb.mjs --org <the build tree> --base-org <the base tree>
// CONTRACT — every mutant is a PLANT of --org (ci/mxb/plant_mxb.mjs: a copy, no .git, no ci/, an EMPTY dressing-room/state)
//   under ONE os.tmpdir() root, carrying ONE change: an xray mutant is ONE string replacement in the plant's
//   scripts/xray.mjs; a tree mutant (M12-M15) is ONE edit to one other organ of the plant. An anchor not found exactly once
//   is UNAPPLIED (a RED runner, never skipped). --org and --base-org are read, never written. The witness runs in a
//   SYNCHRONOUS child (spawnSync: each wait is bounded by the child's own exit; nothing typed), its own plants under this
//   runner's temp root (the env door MXB_WITNESS_TMP); each mutant's plant is removed after it is judged and the root at
//   the end. No port, no service, no daemon, no git repo planted, no model (ANTHROPIC_API_KEY blanked in the child).
//   Control: the unmutated --org must read GREEN on every clause. LAST: no node process naming the temp root survives.
// LAST LINE: run_mutants: k of n mutant(s) RED by the clause that names them · control GREEN|RED
// ============================================================================
import { mkdtempSync, readFileSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { plant, nodeModulesOf } from "./plant_mxb.mjs";

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : null; };
const ORG = arg("--org") ? resolve(arg("--org")) : null, BASE = arg("--base-org") ? resolve(arg("--base-org")) : null;
if (!ORG || !BASE || !existsSync(join(ORG, "scripts", "xray.mjs")) || !existsSync(join(BASE, "scripts", "xray.mjs"))) {
  console.log("run_mutants: USAGE --org <dir> --base-org <dir> · 0 of 0 mutant(s) RED by the clause that names them · control RED"); process.exit(1);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const SELF_REPO = resolve(HERE, "..", "..");
const NM = nodeModulesOf(ORG, BASE, SELF_REPO);
const T = mkdtempSync(join(tmpdir(), "mxb-mut-"));
const lines = (s) => String(s || "").split(/\r?\n/).filter((l) => l.trim());
const NUL = String.fromCharCode(0);

// xray mutants (file: scripts/xray.mjs) and tree mutants (another organ of the plant)
const MUTANTS = [
  { id: "M1", kills: "W1", why: "an object value no longer binds an ObjectPattern parameter (finishProbe's `{ path }`)",
    from: "          else if (pat) for (const q of pat.properties) {", to: "          else if (false) for (const q of pat.properties) {" },
  { id: "M2", kills: "W2", why: "an object literal's arrow property is no longer a function value (`F.sitting`)",
    from: "                if ((pr.value.type === \"ArrowFunctionExpression\"", to: "                if (false && (pr.value.type === \"ArrowFunctionExpression\"" },
  { id: "M3", kills: "W3", why: "an object value no longer flattens into a plain parameter (`deps.outPath`)",
    from: "          if (id) { for (const [k, v] of a.p) if (isC(v)) put(`${id.name}.${k}`, v.v); }", to: "          if (id) { }" },
  { id: "M4", kills: "W4", why: "a closure returned by a call is not kept in scope (`const P = mkP(dir)`)",
    from: "            else if (v && (v.k === \"f\" || v.k === \"o\")) scope.set(d.id.name, v);\n", to: "\n" },
  { id: "M5", kills: "W5", why: "writeSync on an openSync descriptor is not a write (the sink class without the fd rule)",
    from: "          if (name === \"writeSync\" && n.arguments[0]", to: "          if (false && name === \"writeSync\" && n.arguments[0]" },
  { id: "M6", kills: "W6", why: "an expression-bodied function's return value is not evaluated (`GATE_LOG(dir)`)",
    from: "      if (!isBlock) return evalNode(fv.body, s);", to: "      if (!isBlock) return UNKNOWN;" },
  { id: "M7", kills: "W7", why: "`probe` is a test word again (finishProbe's write is a fixture, B1 stays in Q6) — F-CTX0 reversed",
    from: "const FIX_CTX = /selftest|selfTest|_test|fixture|demo|canary/i;", to: "const FIX_CTX = /selftest|selfTest|_test|fixture|demo|canary|probe/i;" },
  { id: "M8", kills: "W8 BOUND", why: "openSync is a WRITE whatever its flag (the naive sink-class fix for B5: a read-open becomes a writer)",
    from: "            if (isC(v)) scope.set(`${n.id.name}#fd`, v);", to: "            if (isC(v)) { scope.set(`${n.id.name}#fd`, v); addSink(writes, v.v, n.loc.start.line, \"openSync\"); }" },
  { id: "M9", kills: "W9 BOUND", why: "a writeSync on a descriptor the IR cannot follow is counted as an unresolved site",
    from: "            if (isC(v)) addSink(writes, v.v, line, \"writeSync→WRITE(fd)\");", to: "            if (isC(v)) addSink(writes, v.v, line, \"writeSync→WRITE(fd)\"); else noteUnresolved(line, name, \"fd\");" },
  { id: "M10", kills: "W10", why: "an object value built at a TEST call site binds a production parameter (G-FIX off)",
    from: "            const fixSite = FIX_CTX.test(String(CTX));", to: "            const fixSite = false;" },
  { id: "M11", kills: "W11", why: "the NUL asserts state the dead trap again (`raw.includes(0)`, red on main since forks row 616)",
    from: "rawNul === 0 && esc > 0,", to: "raw.includes(0)," },
  { id: "M12", kills: "W11", file: "scripts/calibration.mjs", why: "a raw NUL byte comes back into calibration.mjs (the grep trap re-opened)",
    from: "\n", to: `\n// mutant M12 ${NUL}\n`, first: true },
  { id: "M13", kills: "W11", file: "scripts/dmn.mjs", why: "a raw NUL byte comes back into dmn.mjs (the grep trap re-opened)",
    from: "\n", to: `\n// mutant M13 ${NUL}\n`, first: true },
  { id: "M14", kills: "W11", file: "scripts/rejirah.mjs", why: "a raw NUL byte comes back into rejirah.mjs (the grep trap re-opened)",
    from: "\n", to: `\n// mutant M14 ${NUL}\n`, first: true },
  { id: "M15", kills: "BOUND", file: "scripts/state.mjs", why: "a file beyond the named one differs from the base (one comment line in state.mjs)",
    from: "\n", to: "\n// mutant M15: a byte beyond the named file\n", first: true },
];

const judge = (org) => {
  const r = spawnSync(process.execPath, [join(HERE, "witness_mxb.mjs"), "--org", org, "--base-org", BASE], { encoding: "utf8", env: { ...process.env, MXB_WITNESS_TMP: T, ANTHROPIC_API_KEY: "" } });
  const ls = lines(r.stdout);
  return { red: ls.filter((l) => /^\s+RED\s+\S/.test(l)).map((l) => l.trim().replace(/^RED\s+/, "").split(" · ")[0].trim()), last: ls[ls.length - 1] || "(no output)", code: r.status };
};

const ctl = judge(ORG);
console.log(`control: ${ctl.last} (exit ${ctl.code})`);
let k = 0;
for (const m of MUTANTS) {
  const rel = m.file || "scripts/xray.mjs";
  const src = readFileSync(join(ORG, rel), "utf8");
  const n = src.split(m.from).length - 1;
  if (m.first ? n < 1 : n !== 1) { console.log(`${m.id} UNAPPLIED · anchor found ${n} time(s) in ${rel} · ${m.why}`); continue; }
  const P = plant(ORG, join(T, `org_${m.id}`), { nm: NM });
  writeFileSync(join(P, rel), src.replace(m.from, m.to));
  const r = judge(P);
  rmSync(P, { recursive: true, force: true });
  const ok = r.red.includes(m.kills);
  if (ok) k++;
  console.log(`${m.id} ${ok ? "RED by" : "SURVIVED"} ${m.kills} · red=[${r.red.join(",")}] · ${m.why}`);
}
const listing = process.platform === "win32"
  ? spawnSync("powershell.exe", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | ForEach-Object { $_.CommandLine }"], { encoding: "utf8", windowsHide: true })
  : spawnSync("ps", ["-eo", "args"], { encoding: "utf8" });
const left = lines(listing.stdout).filter((l) => l.includes(T) && !/\bps -eo\b/.test(l));
rmSync(T, { recursive: true, force: true });
console.log(`LAST: ${left.length} node process(es) naming the temp root survive${listing.status === 0 ? "" : " · the process table could not be read"} · the temp root removed`);
const cg = ctl.code === 0 && left.length === 0 && listing.status === 0;
console.log(`run_mutants: ${k} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${cg ? "GREEN" : "RED"}`);
process.exit(k === MUTANTS.length && cg ? 0 : 1);
