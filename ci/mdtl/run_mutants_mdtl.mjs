#!/usr/bin/env node
// ============================================================================
// ci/mdtl/run_mutants_mdtl.mjs — unit mdtl's mutants, one per clause of ci/mdtl/witness_mdtl.mjs.
// CONTRACT:  node ci/mdtl/run_mutants_mdtl.mjs [--org <tree>] [--base-org <tree>]
//   With no tree named, the --org tree is this clone's HEAD and the --base-org tree is ci/mdtl/BASE, each built as an LF
//   tree under os.tmpdir() through a private index (core.autocrlf=false, core.eol=lf). Each mutant is a COPY of the --org
//   tree with ONE planted edit (each edit must match exactly once, or the mutant is NOT APPLIED and counts as not red);
//   the witness runs on it against the --base-org tree and must go RED on the clause that names the mutant. The control
//   (no edit) must read GREEN. No port, no service, no network, no model call; every wait is bounded by the --org tree's
//   own suite.yml timeout-minutes (read, never typed).
// LAST LINE: run_mutants: k of n mutant(s) RED by the clause that names them · control GREEN|RED
// ============================================================================
import { mkdtempSync, readFileSync, writeFileSync, rmSync, cpSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const T0 = Date.now();
const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, "..", "..");
const WITNESS = join(HERE, "witness_mdtl.mjs");
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const TMP = mkdtempSync(join(tmpdir(), "mdtl-mut-"));

function lfTree(sha, into) {
  mkdirSync(into, { recursive: true });
  const r = spawnSync("git", ["-c", "core.autocrlf=false", "-c", "core.eol=lf", "-C", REPO, `--work-tree=${into}`, "checkout", "-q", sha, "--", "."],
    { encoding: "utf8", windowsHide: true, env: { ...process.env, GIT_INDEX_FILE: `${into}.index` } });
  return r.status === 0 ? null : String(r.stderr || "").trim().split(/\r?\n/)[0];
}
let ORG = arg("--org") && resolve(arg("--org")), BASE = arg("--base-org") && resolve(arg("--base-org"));
if (!ORG) { ORG = join(TMP, "org"); const e = lfTree("HEAD", ORG); if (e) { console.log(`run_mutants: the --org tree could not be built (${e})`); process.exit(1); } }
if (!BASE) {
  BASE = join(TMP, "base");
  const sha = readFileSync(join(HERE, "BASE"), "utf8").trim();
  const e = lfTree(sha, BASE); if (e) { console.log(`run_mutants: the --base-org tree could not be built (${e})`); process.exit(1); }
}
const wf = (() => { try { return readFileSync(join(ORG, ".github", "workflows", "suite.yml"), "utf8"); } catch { return ""; } })();
const jobMin = Number((/timeout-minutes:\s*(\d+)/.exec(wf) || [])[1]);
if (!(jobMin > 0)) { console.log("run_mutants: the --org tree's suite.yml names no timeout-minutes"); process.exit(1); }
const left = () => Math.max(1, T0 + jobMin * 60000 - Date.now());

const MUTANTS = [
  { id: "D1-m", clause: "D1", why: "compareLines drops the cause line and the payload's cause field", edits: [
    ["scripts/ci_verdict.mjs", "const shown = j.fresh.map((n) => (cause[n] ? [n, ...cause[n].map((c) => `cause · ${c}`)].join(\"\\n\") : n));", "const shown = j.fresh;"],
    ["scripts/ci_verdict.mjs", ", ...(Object.keys(cause).length ? { cause } : {}) };", " };"]] },
  { id: "D2-m", clause: "D2", why: "the literal-of-source check is removed: any ID-grammar token is a clause id", edits: [
    ["scripts/witness_cause.mjs", "if (ID.test(t) && ids.has(t))", "if (ID.test(t))"],
    ["scripts/witness_cause.mjs", "return !!src && idsInSource(src).has(id) && text ===", "return text ==="]] },
  { id: "D3-m", clause: "D3", why: "the member writes the cause into the judged detail", edits: [
    ["scripts/organism_test.mjs", "j.ok ? \"\" : `red beyond BOUND: ${j.left}`);", "j.ok ? \"\" : `red beyond BOUND: ${j.left} · cause`);"]] },
  { id: "D4-m", clause: "D4", why: "the payload always carries cause: {}", edits: [
    ["scripts/ci_verdict.mjs", ", ...(Object.keys(cause).length ? { cause } : {}) };", ", cause };"]] },
  { id: "D5-m", clause: "D5", why: "verifyCause is reduced to the grammar check only (no source rebuild)", edits: [
    ["scripts/witness_cause.mjs", "return ok ? { member, cause: `${id} · ${text}` } : withheld;", "return { member, cause: `${id} · ${text}` };"]] },
  { id: "BOUND-m", clause: "BOUND", why: "suite.yml's head grep gains a widened log channel (|^  witness ‹)", edits: [
    [".github/workflows/suite.yml", "grep -E \"^  (ok  |FAIL|LIVE) |^organism_test:|^── \" \"$RUNNER_TEMP/b1_head.txt\"", "grep -E \"^  (ok  |FAIL|LIVE) |^organism_test:|^── |^  witness ‹\" \"$RUNNER_TEMP/b1_head.txt\""]] },
  { id: "LAST-m", clause: "LAST", why: "compare's module spawns a detached node that outlives its parent", edits: [
    ["scripts/ci_verdict.mjs", "import { pathToFileURL } from \"node:url\";\n", "import { pathToFileURL } from \"node:url\";\nimport { spawn as __mutSpawn } from \"node:child_process\";\n__mutSpawn(process.execPath, [\"-e\", \"setInterval(() => {})\", import.meta.url], { detached: true, stdio: \"ignore\", windowsHide: true }).unref();\n"]] },
];

function runWitness(org) {
  const r = spawnSync(process.execPath, [WITNESS, "--org", org, "--base-org", BASE], { encoding: "utf8", windowsHide: true, timeout: left() });
  const out = `${r.stdout || ""}${r.stderr || ""}`;
  const last = out.split(/\r?\n/).map((s) => s.trim()).filter(Boolean).pop() || "";
  const redIds = (/^RED MDTL · (.*)$/.exec(last) || ["", ""])[1].split(/\s+/).filter(Boolean);
  return { code: r.status, last, redIds };
}

const control = runWitness(ORG);
const controlGreen = control.code === 0 && control.last.startsWith("GREEN MDTL ");
console.log(`CONTROL · ${controlGreen ? "GREEN" : "RED"} · ${control.last}`);
let k = 0;
for (const m of MUTANTS) {
  const t = join(TMP, `mut-${m.id}`);
  cpSync(ORG, t, { recursive: true, filter: (s) => !/[\\/](node_modules|\.git)([\\/]|$)/.test(s) });
  let applied = true;
  for (const [f, from, to] of m.edits) {
    const p = join(t, f);
    const s = existsSync(p) ? readFileSync(p, "utf8").replace(/\r\n/g, "\n") : "";
    if (s.split(from).length !== 2) { applied = false; break; }
    writeFileSync(p, s.replace(from, to));
  }
  if (!applied) { console.log(`MUTANT ${m.id} · NOT APPLIED (an edit did not match exactly once) · ${m.why}`); continue; }
  const r = runWitness(t);
  const bit = r.code === 1 && r.redIds.includes(m.clause);
  if (bit) k++;
  console.log(`MUTANT ${m.id} · ${bit ? "RED" : "NOT RED"} by ${m.clause} · ${m.why} · ${r.last}`);
  try { rmSync(t, { recursive: true, force: true }); } catch { }
}
// LAST: no node process naming this run's temp dir survives (the witness sweeps its own)
const naming = () => {
  if (process.platform === "win32") {
    const r = spawnSync("powershell", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | ForEach-Object { \"$($_.ProcessId) $($_.CommandLine)\" }"], { encoding: "utf8", windowsHide: true, timeout: left() });
    return String(r.stdout || "").split(/\r?\n/).filter((l) => l.toLowerCase().includes(TMP.toLowerCase())).map((l) => Number(l.trim().split(" ")[0])).filter((p) => p && p !== process.pid);
  }
  const out = [];
  for (const p of existsSync("/proc") ? readdirSync("/proc") : []) {
    if (!/^\d+$/.test(p) || Number(p) === process.pid) continue;
    try { if (readFileSync(`/proc/${p}/cmdline`, "utf8").replace(/\0/g, " ").includes(TMP)) out.push(Number(p)); } catch { }
  }
  return out;
};
for (const p of naming()) { try { process.kill(p); } catch { } }
try { rmSync(TMP, { recursive: true, force: true }); } catch { }
console.log(`run_mutants: ${k} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${controlGreen ? "GREEN" : "RED"}`);
process.exit(k === MUTANTS.length && controlGreen ? 0 : 1);
