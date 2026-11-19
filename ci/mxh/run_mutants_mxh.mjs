#!/usr/bin/env node
// ============================================================================
// ci/mxh/run_mutants_mxh.mjs — UNIT mxh · one mutant per clause of ci/mxh/witness_mxh.mjs; each must turn ITS clause RED.
// USAGE: node ci/mxh/run_mutants_mxh.mjs --org <the BUILD tree> --base-org <the BASE tree>
// CONTRACT: each mutant is a COPY of --org under ONE os.tmpdir() root (never .git; node_modules rides as a link), with ONE
//   string replacement in its scripts/xray.mjs (or, for BOUND, one line appended to a file beyond the named one); the witness then runs
//   on that copy against --base-org in a synchronous child (each wait bounded by the child's own exit, nothing typed). An
//   anchor not found exactly once is a RED runner (the mutant is named UNAPPLIED, never skipped). Control: the unmutated
//   --org must be GREEN on every clause. The LAST mutant plants a detached node child naming the temp root; the runner reads
//   the process table (PowerShell on Windows, ps elsewhere) and kills every survivor naming its root before it ends.
//   The witness's temp root is pointed under this root through its env door MXH_WITNESS_TMP. No port, no service, no daemon, no git repo, no model.
// LAST LINE: run_mutants: k of n mutant(s) RED by the clause that names them · control GREEN|RED (exit 0 iff k = n and GREEN)
// ============================================================================
import { mkdtempSync, readFileSync, writeFileSync, rmSync, cpSync, existsSync, symlinkSync, appendFileSync } from "node:fs";
import { join, resolve, dirname, relative, sep } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync, execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : null; };
const ORG = arg("--org") ? resolve(arg("--org")) : null, BASE_ORG = arg("--base-org") ? resolve(arg("--base-org")) : null;
if (!ORG || !BASE_ORG || !existsSync(join(ORG, "scripts", "xray.mjs"))) { console.log("run_mutants: USAGE --org <build> --base-org <base>"); process.exit(1); }
const WIT = join(dirname(fileURLToPath(import.meta.url)), "witness_mxh.mjs");
const SELF_REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const NM = [ORG, BASE_ORG, SELF_REPO].map((d) => join(d, "node_modules")).find((d) => existsSync(join(d, "acorn")));
const slash = (p) => p.split(sep).join("/");
const lines = (s) => String(s || "").split(/\r?\n/).filter((l) => l.trim());
const XR = (from, to) => ({ file: "scripts/xray.mjs", from, to });
const MUTANTS = [
  { id: "M1", kills: "W1", why: "the boundary reverted (json|jsonl, no boundary)",
    ...XR("line.matchAll(/([A-Za-z0-9_\\-.]+\\.jsonl?)(?![A-Za-z0-9_])/g)", "line.matchAll(/([A-Za-z0-9_\\-.]+\\.(?:json|jsonl))/g)") },
  { id: "M2", kills: "W2", why: "the foreign-organ check dropped", ...XR(" || foreignNamed(f, clauseBefore(head, m.index + fm.index))", "") },
  { id: "M3", kills: "W3", why: "the clause never walks back over a wrapped // line (same-line rule R1)", ...XR("      if (start === 0) return txt;\n", "      return txt;\n") },
  { id: "M4", kills: "W4", why: "`;` is not a clause stop (sentence rule R3)", ...XR("const STOP = /\\.(?=\\s|$)|;/g;", "const STOP = /\\.(?=\\s|$)/g;") },
  { id: "M5", kills: "W4", why: "the walk-back ignores stops and always takes the line above (rule R2)", ...XR("      const cut = lastStop(txt);\n", "      const cut = txt.includes(\"\\n\") ? 0 : -1;\n") },
  { id: "M6", kills: "W5", why: "Q6 reads only the LAST path of a basename (the last-wins shape)", ...XR("const named = byBase.get(d.file) || [];", "const named = (byBase.get(d.file) || []).slice(-1);") },
  { id: "M7", kills: "W3", why: "a stop between the marker and the token no longer ends the claim", ...XR("if (lastStop(line.slice(0, fm.index)) >= 0 || ", "if (") },
  { id: "M8", kills: "W6", why: "the whole clause rule dropped (the F2 boundary fix ALONE)",
    ...XR("        if (lastStop(line.slice(0, fm.index)) >= 0 || foreignNamed(f, clauseBefore(head, m.index + fm.index))) continue;\n", "") },
  { id: "M9", kills: "W7", why: "the N1 mask only in the fixpoint (pass 1 still leaks)", ...XR("        if (inner !== scope) {\n", "        if (false) {\n") },
  { id: "M10", kills: "W7", why: "the N1 mask only in pass 1 (the fixpoint re-analysis still leaks)", ...XR("      let combos = [maskParams(new Map(env), fn.params)];", "      let combos = [new Map(env)];") },
  { id: "M11", kills: "W7", why: "patternNames skips ObjectPattern (the destructured slot of mxw PROOF N1 leaks)",
    ...XR("    else if (p.type === \"ObjectPattern\") p.properties.forEach((q) => go(q.type === \"RestElement\" ? q.argument : q.value)); };", "    };") },
  { id: "M12", kills: "BOUND", why: "a file beyond the named one changes (scripts/rails.mjs gains a trailing comment line)", file: "scripts/rails.mjs", append: "\n// mxh mutant M12\n" },
  { id: "M13", kills: "LAST", why: "the judged xray leaves a detached node child naming the temp root alive",
    ...XR("export function queries(ir) {", "{ const { spawn } = await import(\"node:child_process\"); spawn(process.execPath, [\"-e\", \"setInterval(() => {})\", (await import(\"node:url\")).fileURLToPath(import.meta.url)], { detached: true, stdio: \"ignore\", windowsHide: true }).unref(); }\nexport function queries(ir) {") },
];
const T = mkdtempSync(join(tmpdir(), "mxh-mut-"));
const copy = (dst) => {
  cpSync(ORG, dst, { recursive: true, filter: (p) => { const top = slash(relative(ORG, p)).split("/")[0]; return top !== ".git" && top !== "node_modules"; } });
  if (NM) symlinkSync(NM, join(dst, "node_modules"), process.platform === "win32" ? "junction" : "dir");
};
const table = () => lines((process.platform === "win32"
  ? spawnSync("powershell.exe", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | ForEach-Object { \"$($_.ProcessId) $($_.CommandLine)\" }"], { encoding: "utf8", windowsHide: true })
  : spawnSync("ps", ["-eo", "pid=,args="], { encoding: "utf8" })).stdout).map((l) => l.trim()).filter((l) => l.includes(T) && !/\bps -eo\b/.test(l));
const reap = () => { for (const l of table()) { const pid = Number(l.split(/\s+/)[0]); try { if (process.platform === "win32") execFileSync("taskkill", ["/PID", String(pid), "/T", "/F"], { stdio: "ignore" }); else process.kill(pid, "SIGKILL"); } catch { /* gone */ } } };
const run = (org) => {
  const r = spawnSync(process.execPath, [WIT, "--org", org, "--base-org", BASE_ORG], { encoding: "utf8", windowsHide: true, env: { ...process.env, MXH_WITNESS_TMP: T } });
  const ls = lines(r.stdout);
  return { red: new Set(ls.filter((l) => /^\s*RED\s/.test(l) && !/^\s*RED MXH/.test(l)).map((l) => l.trim().split(/\s+/)[1])), last: ls.pop() || `exit ${r.status}`, code: r.status };
};
let killed = 0;
const ctl = run(ORG);
const ctlGreen = ctl.code === 0 && ctl.red.size === 0;
console.log(`  control (unmutated) → ${ctl.last}`);
let n = 0;
for (const m of MUTANTS) {
  const d = join(T, m.id); n++;
  copy(d);
  const p = join(d, m.file), src = readFileSync(p, "utf8"), hits = m.append ? 1 : src.split(m.from).length - 1;
  if (hits !== 1) { console.log(`  RED   ${m.id} UNAPPLIED — anchor found ${hits} time(s) in ${m.file}`); rmSync(d, { recursive: true, force: true }); continue; }
  writeFileSync(p, m.append ? src + m.append : src.replace(m.from, m.to));
  const r = run(d);
  reap();
  const ok = r.red.has(m.kills);
  if (ok) killed++;
  console.log(`  ${ok ? "KILLED" : "ALIVE "} ${m.id} (${m.why}) → ${m.kills} ${ok ? "RED" : "GREEN"} · ${r.last}`);
  rmSync(d, { recursive: true, force: true });
}
reap();
const left = table().length;
rmSync(T, { recursive: true, force: true });
if (left) appendFileSync(process.stdout.fd, `  ${left} node process(es) naming the mutant root were still alive at the end\n`);
console.log(`run_mutants: ${killed} of ${n} mutant(s) RED by the clause that names them · control ${ctlGreen ? "GREEN" : "RED"}`);
process.exit(killed === n && ctlGreen && !left ? 0 : 1);
