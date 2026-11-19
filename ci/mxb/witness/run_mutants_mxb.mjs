#!/usr/bin/env node
// unit mxb · ONE MUTANT PER CLAUSE of ci/mxb/witness/witness_mxb.mjs; each must turn ITS clause RED.
//   node ci/mxb/witness/run_mutants_mxb.mjs --repo <dir> --xray <the candidate xray.mjs> --base-org <base tree>
// Each mutant is ONE string replacement in a copy of --xray, written under ONE os.tmpdir() root; plant_tree.mjs plants
// its org tree and its P10 mini tree; the witness runs in a synchronous child (each wait bounded by the child's own
// exit, nothing typed — the mxh runner's precedent). An anchor not found exactly once is a RED runner (UNAPPLIED,
// never skipped). Control: the unmutated --xray must be GREEN on every clause. No port, no service, no daemon, no model.
// LAST LINE: run_mutants_mxb: k of n mutant(s) RED by the clause that names them · control GREEN|RED
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const arg = (k) => { const i = process.argv.indexOf(k); return i >= 0 ? process.argv[i + 1] : null; };
const REPO = resolve(arg("--repo") || "."), XRAY = arg("--xray") && resolve(arg("--xray")), BASE = arg("--base-org") && resolve(arg("--base-org"));
if (!XRAY || !BASE) { console.log("run_mutants_mxb: USAGE --repo <dir> --xray <file> --base-org <tree>"); process.exit(1); }
const HERE = dirname(fileURLToPath(import.meta.url));
const node = (script, args) => spawnSync(process.execPath, [join(HERE, script), ...args], { encoding: "utf8" });
const lastLine = (s) => String(s || "").trim().split("\n").pop();

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
  { id: "M7", kills: "W7", why: "`probe` is a test word again (finishProbe's write is a fixture, B1 stays in Q6)",
    from: "const FIX_CTX = /selftest|selfTest|_test|fixture|demo|canary/i;", to: "const FIX_CTX = /selftest|selfTest|_test|fixture|demo|canary|probe/i;" },
  { id: "M8", kills: "W8", why: "openSync is a WRITE whatever its flag (the naive sink-class fix for B5: a read-open becomes a writer)",
    from: "            if (isC(v)) scope.set(`${n.id.name}#fd`, v);", to: "            if (isC(v)) { scope.set(`${n.id.name}#fd`, v); addSink(writes, v.v, n.loc.start.line, \"openSync\"); }" },
  { id: "M9", kills: "W9", why: "a writeSync on a descriptor the IR cannot follow is counted as an unresolved site",
    from: "            if (isC(v)) addSink(writes, v.v, line, \"writeSync→WRITE(fd)\");", to: "            if (isC(v)) addSink(writes, v.v, line, \"writeSync→WRITE(fd)\"); else noteUnresolved(line, name, \"fd\");" },
  { id: "M10", kills: "W10", why: "an object value built at a TEST call site binds a production parameter",
    from: "            const fixSite = FIX_CTX.test(String(CTX));", to: "            const fixSite = false;" },
];

const T = mkdtempSync(join(tmpdir(), "mxb-mut-"));
const src = readFileSync(XRAY, "utf8");
const judge = (xrayFile, tag) => {
  const org = lastLine(node("plant_tree.mjs", ["--repo", REPO, "--xray", xrayFile, "--tag", tag]).stdout);
  const p10 = lastLine(node("plant_tree.mjs", ["--repo", REPO, "--xray", xrayFile, "--plant-p10", "--tag", tag + "p"]).stdout);
  const r = node("witness_mxb.mjs", ["--org", org, "--base-org", BASE, "--p10", p10]);
  const ls = String(r.stdout || "").trim().split("\n");
  return { red: new Set(ls.filter((l) => / RED /.test(l)).map((l) => l.split(" ")[0])), last: ls.pop(), code: r.status };
};
const ctl = judge(XRAY, "ctl");
console.log(`control: ${ctl.last} (exit ${ctl.code})`);
let k = 0;
for (const m of MUTANTS) {
  const n = src.split(m.from).length - 1;
  if (n !== 1) { console.log(`${m.id} UNAPPLIED · anchor found ${n} time(s) · ${m.why}`); continue; }
  const f = join(T, `xray_${m.id}.mjs`);
  writeFileSync(f, src.replace(m.from, m.to));
  const r = judge(f, m.id.toLowerCase());
  const ok = r.red.has(m.kills);
  if (ok) k++;
  console.log(`${m.id} ${ok ? "RED by" : "SURVIVED"} ${m.kills} · red=[${[...r.red].join(",")}] · ${m.why}`);
}
const cg = ctl.code === 0;
console.log(`run_mutants_mxb: ${k} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${cg ? "GREEN" : "RED"}`);
process.exit(k === MUTANTS.length && cg ? 0 : 1);
