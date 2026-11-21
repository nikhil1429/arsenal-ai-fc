#!/usr/bin/env node
// ============================================================================
// ci/mdtl2/run_mutants_mdtl2.mjs — unit mdtl2's mutants, one per clause of ci/mdtl2/witness_mdtl2.mjs (spec §6).
// CONTRACT:  node ci/mdtl2/run_mutants_mdtl2.mjs [--org <tree>] [--base-org <tree>]
//   With no tree named, the --org tree is this clone's HEAD and the --base-org tree is ci/mdtl2/BASE, each built as an LF
//   tree under os.tmpdir() through a private index (core.autocrlf=false, core.eol=lf). Each mutant is a COPY of the --org
//   tree with ONE planted edit (each edit must match exactly once, or the mutant is NOT APPLIED and counts as not red);
//   the witness runs on it against the --base-org tree and must go RED on the clause that names the mutant. The control
//   (no edit) must read GREEN. This clone's node_modules (the pinned parser the witness needs) is LINKED into every tree it
//   builds and every mutant, never copied, and unlinked before the tree is removed. No port, no service, no network, no model call; every wait is bounded by the --org tree's
//   own suite.yml timeout-minutes (read, never typed).
// LAST LINE: run_mutants: k of n mutant(s) RED by the clause that names them · control GREEN|RED
// ============================================================================
import { mkdtempSync, readFileSync, writeFileSync, rmSync, cpSync, mkdirSync, existsSync, readdirSync, symlinkSync, unlinkSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const T0 = Date.now();
const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, "..", "..");
const WITNESS = join(HERE, "witness_mdtl2.mjs");
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const TMP = mkdtempSync(join(tmpdir(), "mdtl2-mut-"));
const NM = join(REPO, "node_modules"), links = [];
const link = (t) => { if (existsSync(NM) && !existsSync(join(t, "node_modules"))) { symlinkSync(NM, join(t, "node_modules"), process.platform === "win32" ? "junction" : "dir"); links.push(join(t, "node_modules")); } };

function lfTree(sha, into) {
  mkdirSync(into, { recursive: true });
  const r = spawnSync("git", ["-c", "core.autocrlf=false", "-c", "core.eol=lf", "-C", REPO, `--work-tree=${into}`, "checkout", "-q", sha, "--", "."],
    { encoding: "utf8", windowsHide: true, env: { ...process.env, GIT_INDEX_FILE: `${into}.index` } });
  return r.status === 0 ? null : String(r.stderr || "").trim().split(/\r?\n/)[0];
}
let ORG = arg("--org") && resolve(arg("--org")), BASE = arg("--base-org") && resolve(arg("--base-org"));
if (!ORG) { ORG = join(TMP, "org"); const e = lfTree("HEAD", ORG); if (e) { console.log(`run_mutants: the --org tree could not be built (${e})`); process.exit(1); } link(ORG); }
if (!BASE) {
  BASE = join(TMP, "base");
  const sha = readFileSync(join(HERE, "BASE"), "utf8").trim();
  const e = lfTree(sha, BASE); if (e) { console.log(`run_mutants: the --base-org tree could not be built (${e})`); process.exit(1); }
  link(BASE);
}
const wf = (() => { try { return readFileSync(join(ORG, ".github", "workflows", "suite.yml"), "utf8"); } catch { return ""; } })();
const jobMin = Number((/timeout-minutes:\s*(\d+)/.exec(wf) || [])[1]);
if (!(jobMin > 0)) { console.log("run_mutants: the --org tree's suite.yml names no timeout-minutes"); process.exit(1); }
const left = () => Math.max(1, T0 + jobMin * 60000 - Date.now());

const RC = "scripts/red_cause.mjs", CV = "scripts/ci_verdict.mjs", OT = "scripts/organism_test.mjs";
const MUTANTS = [
  { id: "E1-m", clause: "E1", why: "memberCause drops the failing-check entry", edits: [
    [RC, "  if (checks.length) {\n    const r = repOf(checks[0], alphabetOf(src));", "  if (checks.length && !checks.length) {\n    const r = repOf(checks[0], alphabetOf(src));"]] },
  { id: "E2-m", clause: "E2", why: "a skeleton keeps its fill bytes (F4 B undone): the salad leaves", edits: [
    [RC, "  if (best !== null) return best;", "  if (best !== null) return t;"]] },
  { id: "E3-m", clause: "E3", why: "the roll-up cause copies the tail", edits: [
    [RC, "slotOf(m[2] === \"null\" ? null : Number(m[2]))}`);", "slotOf(m[2] === \"null\" ? null : Number(m[2]))} · ${l}`);"]] },
  { id: "E4-m", clause: "E4", why: "PATH drops the tracked check (any basename-shaped token is a path)", edits: [
    [RC, "return !m[2] && /^[A-Za-z0-9_.\\-]+$/.test(m[1]) && (tracked.has(", "return !m[2] && /^[A-Za-z0-9_.\\-]+$/.test(m[1]) || (tracked.has("]] },
  { id: "E5-m", clause: "E5", why: "throwCause keeps the message", edits: [
    [RC, "const out = e && ERRORS.has(e[1]) ? [e[1]] : [];", "const out = e && ERRORS.has(e[1]) ? [parts[0]] : [];"]] },
  { id: "E6-m", clause: "E6", why: "the clause id check (idsInSource) is skipped, by the builder and by the second check", edits: [
    [RC, "if (/^[A-Z][A-Z0-9-]*$/.test(m[1]) && ids.has(m[1]) &&", "if (/^[A-Z][A-Z0-9-]*$/.test(m[1]) &&"],
    [RC, "idsInSource(w).has(m[1]) && m[4] === (claimOf(w, m[1]) ?? NO_CLAIM);", "true;"]] },
  { id: "E7-m", clause: "E7", why: "the last section is copied raw", edits: [
    [RC, "return r === null ? WITHHELD : `last section · ${r}`;", "return `last section · ${last.slice(3)}`;"]] },
  { id: "E8-m", clause: "E8", why: "the reader prints the step name unchecked", edits: [
    [CV, "${stepCause(String(st.name), String(st.conclusion), yml)}", "step ${st.name} · ${st.conclusion}"]] },
  { id: "E9-m", clause: "E9", why: "verify is reduced to its grammar check (no rebuild from source, no tracked check)", edits: [
    [RC, "(piece.startsWith(\"FAIL \") && inAlphabet(piece.slice(5), alphabetOf(src(k.file))));", "piece.startsWith(\"FAIL \");"],
    [RC, "return !!m && tracked.has(`scripts/${m[1]}.mjs`); }", "return !!m; }"]] },
  { id: "E10-m", clause: "E10", why: "the cause is written into the judged detail", edits: [
    [OT, "fail++; fails.push({ name, detail }); console.log(", "fail++; fails.push({ name, detail: rc && detail ? `${detail} · ${rc.causesOfDetail(name, String(detail), rcIO).join(\" ; \")}` : detail }); console.log("]] },
  { id: "E11-m", clause: "E11", why: "the payload always carries cause: {}", edits: [
    [CV, ", ...(Object.keys(cause).length ? { cause } : {}) };", ", cause };"]] },
  { id: "E12-m", clause: "E12", why: "causesFor routes WITNESS reds to red_cause.verify", edits: [
    [CV, "kindOf(red).kind === \"witness\" ? verifyCause", "false ? verifyCause"]] },
  { id: "BOUND-m", clause: "BOUND", why: "suite.yml's head grep gains the detail lines (|^         )", edits: [
    [".github/workflows/suite.yml", "grep -E \"^  (ok  |FAIL|LIVE) |^organism_test:|^── \" \"$RUNNER_TEMP/b1_head.txt\"", "grep -E \"^  (ok  |FAIL|LIVE) |^organism_test:|^── |^         \" \"$RUNNER_TEMP/b1_head.txt\""]] },
  { id: "LAST-m", clause: "LAST", why: "compare's module spawns a detached node that outlives its parent", edits: [
    [CV, "import { pathToFileURL, fileURLToPath } from \"node:url\";\n", "import { pathToFileURL, fileURLToPath } from \"node:url\";\nimport { spawn as __mutSpawn } from \"node:child_process\";\n__mutSpawn(process.execPath, [\"-e\", \"setInterval(() => {})\", import.meta.url], { detached: true, stdio: \"ignore\", windowsHide: true }).unref();\n"]] },
];

function runWitness(org) {
  const r = spawnSync(process.execPath, [WITNESS, "--org", org, "--base-org", BASE], { encoding: "utf8", windowsHide: true, timeout: left() });
  const out = `${r.stdout || ""}${r.stderr || ""}`;
  const last = out.split(/\r?\n/).map((s) => s.trim()).filter(Boolean).pop() || "";
  const redIds = (/^RED MDTL2 · (.*)$/.exec(last) || ["", ""])[1].split(/\s+/).filter(Boolean);
  return { code: r.status, last, redIds };
}

const control = runWitness(ORG);
const controlGreen = control.code === 0 && control.last.startsWith("GREEN MDTL2 ");
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
    writeFileSync(p, s.replace(from, () => to));
  }
  link(t);
  if (!applied) { console.log(`MUTANT ${m.id} · NOT APPLIED (an edit did not match exactly once) · ${m.why}`); continue; }
  const r = runWitness(t);
  const bit = r.code === 1 && r.redIds.includes(m.clause);
  if (bit) k++;
  console.log(`MUTANT ${m.id} · ${bit ? "RED" : "NOT RED"} by ${m.clause} · ${m.why} · ${r.last}`);
  const li = links.indexOf(join(t, "node_modules"));
  if (li >= 0) { try { unlinkSync(links[li]); } catch { } links.splice(li, 1); }
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
for (const l of links) { try { unlinkSync(l); } catch { } }
try { rmSync(TMP, { recursive: true, force: true }); } catch { }
console.log(`run_mutants: ${k} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${controlGreen ? "GREEN" : "RED"}`);
process.exit(k === MUTANTS.length && controlGreen ? 0 : 1);
