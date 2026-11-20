#!/usr/bin/env node
// ============================================================================
// run_mutants_mrf.mjs — unit MRF: ONE mutant per clause of ci/mrf/witness_mrf.mjs, each must turn RED the clause that names it.
// CONTRACT:  node ci/mrf/run_mutants_mrf.mjs --org <build tree> --base-org <tree>
//   Each mutant copies <org> under os.tmpdir(), breaks ONE thing in the copy (a tree file, or the copy's own witness source),
//   and runs the copy's witness `--only "<its clause>"`: it must exit 1 with the last line `RED MRF · <its clause>`.
//   The CONTROL runs the unmutated witness over <org>, every clause: it must exit 0 with a GREEN MRF last line.
//   No port is typed: the A2.4 mutant writes an OS-picked port as a digit literal (listen 0, read, released); nothing binds it.
//   Every child runs with TMPDIR / TMP / TEMP under this run's temp dir; after each mutant every node process naming that
//   dir is killed (the LAST mutant plants one on purpose). Every spawn is bounded by <org>'s job timeout-minutes, read from
//   .github/workflows/suite.yml at run time, never typed.
// LAST LINE: run_mutants: k of n mutant(s) RED by the clause that names them · control GREEN|RED (exit 0 iff k = n and GREEN)
// ============================================================================
import { mkdtempSync, readFileSync, writeFileSync, cpSync, rmSync, readdirSync, existsSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { createServer } from "node:net";

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const ORG = arg("--org") && resolve(arg("--org")), BASE = arg("--base-org") && resolve(arg("--base-org"));
if (!ORG || !BASE) { console.log("run_mutants: USAGE (--org <dir> --base-org <dir>)"); process.exit(1); }
const T0 = Date.now();
const jobMin = Number((/timeout-minutes:\s*(\d+)/.exec((() => { try { return readFileSync(join(ORG, ".github", "workflows", "suite.yml"), "utf8"); } catch { return ""; } })()) || [])[1]);
if (!(jobMin > 0)) { console.log("run_mutants: 0 of 0 mutant(s) · control RED (no timeout-minutes in .github/workflows/suite.yml)"); process.exit(1); }
const left = () => Math.max(1, T0 + jobMin * 60000 - Date.now());
const TMP = mkdtempSync(join(tmpdir(), "mrfmut-"));
const freePort = () => new Promise((res, rej) => { const s = createServer(); s.once("error", rej); s.listen(0, "127.0.0.1", () => { const a = s.address(); s.close(() => res(typeof a === "object" && a ? a.port : 0)); }); });

/** replace the first `from` (at or after `after`) with `to` in <tree>/<rel> @returns {string|null} why it failed */
const edit = (tree, rel, after, from, to) => {
  const p = join(tree, rel); let s; try { s = readFileSync(p, "utf8"); } catch { return `${rel} absent`; }
  const a = after ? s.indexOf(after) : 0; if (a < 0) return `anchor not found in ${rel}`;
  const i = s.indexOf(from, a); if (i < 0) return `site not found in ${rel}: ${from.slice(0, 60)}`;
  writeFileSync(p, s.slice(0, i) + to + s.slice(i + from.length)); return null;
};
const OT = "scripts/organism_test.mjs", A2N = "A2 · `sitting.mjs open --no-spawn`";
const MATCH = "/^sitting: (?:OPEN|JOINED) \\S+ .* · door local$/m.test(ns.out)";
const MUTANTS = [
  { clause: "A2.1 LINE", what: "A2's matcher reverted to /no-spawn/", m: (t) => edit(t, OT, A2N, MATCH, "/no-spawn/.test(ns.out)") },
  { clause: "A2.2 BITES", what: "A2's never-a-daemon guard dropped", m: (t) => edit(t, OT, A2N, " && !/could not start the daemon/.test(ns.out)", "") },
  { clause: "A2.3 SHAPE", what: "A2's matcher loosened to any sitting line", m: (t) => edit(t, OT, A2N, MATCH, "/^sitting: /m.test(ns.out)") },
  { clause: "A2.4 PORT", what: "a typed ARSENAL_SITTING_PORT digit literal back in the suite (an OS-picked number, bound by nothing)", m: async (t) => edit(t, OT, null, "const KNOWN_RED = [", `// ARSENAL_SITTING_PORT: "${await freePort()}"\nconst KNOWN_RED = [`) },
  { clause: "MONO", what: "monotone.mjs no longer reads ok → FAIL", m: (t) => edit(t, "ci/mf2/monotone.mjs", null, 'else if (v === "ok" && ws[k] === "FAIL") moved.push(n);', "else if (false) moved.push(n);") },
  { clause: "RECUT", what: "F2's old text no longer struck", m: (t) => edit(t, "ci/mf2/witness_mf2.mjs", null, "~~every member the BASE", "every member the BASE") },
  { clause: "KR", what: "the ‹mf2› KNOWN_RED entry put back", m: (t) => edit(t, OT, null, "const KNOWN_RED = [\n", 'const KNOWN_RED = [\n  { assert: "WITNESS ‹mf2› · GREEN at head against its BASE", detail: "red beyond BOUND: F2 F4", row: 1107, owner: "unit mrf", until: "mrf re-judges mf2 F2, F4 and lands it" },\n') },
  { clause: "BOUND", what: "scripts/sitting.mjs touched", m: (t) => { const p = join(t, "scripts", "sitting.mjs"); if (!existsSync(p)) return "sitting.mjs absent"; writeFileSync(p, readFileSync(p, "utf8") + "\n// planted by run_mutants_mrf (BOUND)\n"); return null; } },
  { clause: "LAST", what: "the witness leaves a node process naming its temp dir", m: (t) => {
    const e = edit(t, "ci/mrf/witness_mrf.mjs", null, 'import { spawnSync } from "node:child_process";', 'import { spawnSync, spawn as __mut } from "node:child_process";');
    return e || edit(t, "ci/mrf/witness_mrf.mjs", null, "// ── LAST ──\n{", '// ── LAST ──\n__mut(process.execPath, ["-e", "setInterval(() => {}, 1 << 30)", TMP], { detached: true, stdio: "ignore" }).unref();\n{');
  } },
];

const namingProcs = (dir) => {
  if (process.platform === "win32") {
    const r = spawnSync("powershell", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | ForEach-Object { \"$($_.ProcessId) $($_.CommandLine)\" }"], { encoding: "utf8", windowsHide: true, timeout: left() });
    return String(r.stdout || "").split(/\r?\n/).filter((l) => l.toLowerCase().includes(dir.toLowerCase())).map((l) => Number(l.trim().split(" ")[0])).filter((p) => p && p !== process.pid);
  }
  const out = [];
  for (const p of existsSync("/proc") ? readdirSync("/proc") : []) {
    if (!/^\d+$/.test(p) || Number(p) === process.pid) continue;
    try { if (readFileSync(`/proc/${p}/cmdline`, "utf8").replace(/\0/g, " ").includes(dir)) out.push(Number(p)); } catch { }
  }
  return out;
};
const witness = (tree, only) => {
  const ct = mkdtempSync(join(TMP, "ct-"));
  const env = { ...process.env, TMPDIR: ct, TMP: ct, TEMP: ct };
  const r = spawnSync(process.execPath, [join(tree, "ci", "mrf", "witness_mrf.mjs"), "--org", tree, "--base-org", BASE, ...(only ? ["--only", only] : [])], { cwd: tree, env, encoding: "utf8", timeout: left(), maxBuffer: 1 << 28, windowsHide: true });
  for (const p of namingProcs(ct)) { try { process.kill(p); } catch { } }
  const last = String(r.stdout || "").split(/\r?\n/).map((s) => s.trim()).filter(Boolean).pop() || "";
  return { code: r.status, last };
};

let k = 0;
for (const mu of MUTANTS) {
  const t = mkdtempSync(join(TMP, "m-"));
  cpSync(ORG, t, { recursive: true, verbatimSymlinks: true });
  const e = await mu.m(t);
  const r = e ? { code: null, last: `mutation not applied: ${e}` } : witness(t, mu.clause);
  const ok = r.code === 1 && r.last === `RED MRF · ${mu.clause}`;
  if (ok) k++;
  console.log(`${ok ? "RED  " : "MISS "} ${mu.clause} · ${mu.what} · ${r.last} (exit ${r.code})`);
  try { rmSync(t, { recursive: true, force: true }); } catch { }
}
const c = witness(ORG, null);
const cg = c.code === 0 && c.last.startsWith("GREEN MRF ");
console.log(`control · ${c.last} (exit ${c.code})`);
for (const p of namingProcs(TMP)) { try { process.kill(p); } catch { } }
try { rmSync(TMP, { recursive: true, force: true }); } catch { }
console.log(`run_mutants: ${k} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${cg ? "GREEN" : "RED"}`);
process.exit(k === MUTANTS.length && cg ? 0 : 1);
