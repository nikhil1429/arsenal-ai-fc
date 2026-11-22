#!/usr/bin/env node
// ============================================================================
// ci/mg9/witness_mg9.mjs — UNIT mg9 · THE G9 WITNESS'S OWN WAIT, REPAIRED (forks rows 1314 (2) / 1315 (4))
// ----------------------------------------------------------------------------
//   node ci/mg9/witness_mg9.mjs --org <dir> --base-org <dir> [--only "<id>,…"]
// CONTRACT (judged on --org; the build reads GREEN, the base 84cbc03 reads RED). The defect (ci/mcrk2/G9_50.txt and
// G9_PROBE.txt on claude/mcrk2-g9 5e975f6): ci/witness/mcrk2/witness_crack_gap.mjs plants archive records up to 40 ms in the
// FUTURE (`later(20)`, `later(40)`) and lets compileDay read its OWN clock, so a machine that reaches the compile in under
// 20 ms drops them (scripts/exchanges.mjs drops a record after `now`): G9 (ii) NOT PLACED, G8's diff lost. The repair hands
// the compile a clock no earlier than the last planted record. Only the witness changes; no product byte.
//   FAST     the FAST MACHINE, made deterministic, on a temp copy of --org (no repository file is edited): (1) its
//            scripts/notes_compiler.mjs DEFAULT clock (`now = () => new Date()` in compileDay's signature) lags the real time
//            by one second, and (2) its copy of ci/witness/mcrk2/witness_crack_gap.mjs plants the future records a hundred
//            times further ahead (`later(10|20|40)` → `later(1000|2000|4000)`), so the compile is always reached before them,
//            as on a machine faster than any real one. That copy runs `plants --only G8,G9`: both must read GREEN. Only a
//            witness that hands the compile a clock no earlier than the last record it planted survives both; the old wait
//            reads RED.
//   REAL     the same two clauses over --org unchanged: GREEN (the repair breaks nothing on a real clock); at the base it
//            is folded into FAST's line, as a guard, never alone (a clause green at the base proves nothing)
//   STRUCK   --org's witness keeps the old wait's text, struck in place (`~~const compile = (N, p, arc, D) => …~~`), beside
//            the repaired helper, and every compile call in G8 / G9 passes its archive's lastAt
//   BOUND    only ci/witness/mcrk2/witness_crack_gap.mjs and ci/mg9/ differ between --base-org and --org (CRLF folded)
//   LAST     no node process naming this run's temp dir survives
// THE PORT CLASS (row 1053): no port is bound, no service is named, nothing is POSTed, nothing restarts; no model is called
// (the clause witness puts a refusing `claude` / `gemini` shim first on its PATH). Every wait is a child's exit. Windows-safe:
// no POSIX-only shell, every read split on \r?\n.
// LAST LINE: GREEN MG9 <what> · <n> clause(s) (exit 0) or RED MG9 · <clauses> (exit 1)
// ============================================================================
import { mkdtempSync, readFileSync, writeFileSync, existsSync, rmSync, readdirSync, cpSync, symlinkSync, mkdirSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync, execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const ORG = resolve(arg("--org") || "."), BASE = arg("--base-org") ? resolve(arg("--base-org")) : null;
const ONLY = arg("--only") ? arg("--only").split(",").map((s) => s.trim()).filter(Boolean) : null;
const UNIT = "MG9", HERE = dirname(fileURLToPath(import.meta.url));
const NAMED = (f) => f === "ci/witness/mcrk2/witness_crack_gap.mjs" || /^ci\/mg9\//.test(f);
const TMP = mkdtempSync(join(tmpdir(), "mg9-witness-"));
const NM = [ORG, join(HERE, "..", "..")].map((t) => join(t, "node_modules")).find((p) => existsSync(p)) || null;
const results = [];
const want = (id) => !ONLY || ONLY.includes(id);
const record = (id, ok, why) => { if (!want(id) && id !== "LAST") return; results.push({ id, ok }); console.log(`  ${ok ? "GREEN" : "RED  "} ${id}${why ? ` · ${why}` : ""}`); };
const text = (p) => { try { return readFileSync(p, "utf8").replace(/^﻿/, "").replace(/\r\n/g, "\n"); } catch { return null; } };
const env = (() => { const e = { ...process.env }; delete e.CLAUDE_CODE_SESSION_ID; for (const k of Object.keys(e)) if (/^ARSENAL_/i.test(k)) delete e[k]; return e; })();
const CW = (tree) => join(tree, "ci", "witness", "mcrk2", "witness_crack_gap.mjs");
/** clauses — run <tree>'s own clause witness over <tree> for G8,G9: {g8, g9, last} */
const clauses = (tree) => {
  const r = spawnSync(process.execPath, [CW(tree), "plants", "--tree", tree, "--only", "G8,G9", "--tmp", TMP], { cwd: TMP, env, encoding: "utf8", windowsHide: true });
  const ls = String(r.stdout || "").split(/\r?\n/);
  const g = (id) => (ls.find((l) => l.startsWith(`CLAUSE ${id} `)) || `CLAUSE ${id} ABSENT`).trim();
  return { g8: g("G8"), g9: g("G9"), code: r.status };
};
const green = (c) => /^CLAUSE G8 GREEN/.test(c.g8) && /^CLAUSE G9 GREEN/.test(c.g9);
console.log(`witness mg9 · org ${ORG}${BASE ? ` · base ${BASE}` : ""}`);

if (want("FAST")) {
  // a temp copy of --org: scripts/ (the product), package.json, the clause witness; the compile's DEFAULT clock lags a second
  const fast = join(TMP, "fast");
  cpSync(join(ORG, "scripts"), join(fast, "scripts"), { recursive: true });
  if (existsSync(join(ORG, "package.json"))) cpSync(join(ORG, "package.json"), join(fast, "package.json"));
  mkdirSync(join(fast, "ci", "witness"), { recursive: true });
  cpSync(join(ORG, "ci", "witness", "mcrk2"), join(fast, "ci", "witness", "mcrk2"), { recursive: true });
  if (NM) symlinkSync(NM, join(fast, "node_modules"), process.platform === "win32" ? "junction" : "dir");
  const nc = join(fast, "scripts", "notes_compiler.mjs"), src = text(nc) || "";
  const ANCHOR = "correctionsPath = null, capsulesDir = null, now = () => new Date(), guard";
  const wf = CW(fast), ws = text(wf) || "";
  const LITS = [["later(10)", "later(1000)"], ["later(20)", "later(2000)"], ["later(40)", "later(4000)"]];
  const planted = src.split(ANCHOR).length - 1 === 1 && LITS.every(([a]) => ws.includes(a));
  if (planted) {
    writeFileSync(nc, src.replace(ANCHOR, "correctionsPath = null, capsulesDir = null, now = () => new Date(Date.now() - 1000), guard"));
    writeFileSync(wf, LITS.reduce((t, [a, b]) => t.split(a).join(b), ws));
  }
  const f = planted ? clauses(fast) : null, real = clauses(ORG);
  record("FAST", planted && green(f) && green(real),
    !planted ? "the compile's default-clock anchor (once in notes_compiler.mjs) or the witness's future offsets later(10|20|40) are not in --org: the fast machine cannot be planted"
      : `fast machine (the compile's default clock a second behind, the records 100× further ahead): ${f.g8.slice(0, 60)} · ${f.g9.slice(0, 140)} · real clock (guard): G8 ${/GREEN/.test(real.g8) ? "GREEN" : "RED"} G9 ${/GREEN/.test(real.g9) ? "GREEN" : "RED"}`);
}
if (want("STRUCK")) {
  const w = text(CW(ORG)) || "";
  const struck = /\/\/\s+~~const compile = \(N, p, arc, D\) => N\.compileDay\(/.test(w);
  const live = /^const compile = \(N, p, arc, D, lastAt = 0\) => N\.compileDay\(\{[^\n]*\n\s*now: \(\) => new Date\(Math\.max\(Date\.now\(\), lastAt \+ 1\)\)/m.test(w);
  const calls = (w.match(/\bcompile\((?:N|A\.N|B\.N|C\.N|Dd\.N), [a-z], (?:arc|[A-Z]d?\.arc), D[A-D]?, (?:lastAt|[A-Z]d?\.lastAt)\)/g) || []).length;
  const bare = (w.match(/\bcompile\((?:N|A\.N|B\.N|C\.N|Dd\.N), [a-z], (?:arc|[A-Z]d?\.arc), D[A-D]?\)/g) || []).length;
  record("STRUCK", struck && live && calls === 5 && bare === 0, `the old wait ${struck ? "kept, struck in place" : "NOT KEPT STRUCK"} · the repaired helper ${live ? "hands its own clock" : "ABSENT"} · compile calls with their archive's lastAt ${calls} of 5 · without ${bare}`);
}
const walk = (root, dir = "", o = new Map()) => {
  let ents = []; try { ents = readdirSync(join(root, dir), { withFileTypes: true }); } catch { return o; }
  for (const e of ents) {
    const rel = dir ? `${dir}/${e.name}` : e.name;
    if (!dir && (e.name === "node_modules" || e.name === ".git")) continue;
    if (e.isDirectory()) walk(root, rel, o);
    else if (e.isFile()) { const b = readFileSync(join(root, rel)); const t = b.includes(0) ? b : Buffer.from(b.toString("utf8").replace(/\r\n/g, "\n")); o.set(rel, createHash("sha256").update(t).digest("hex")); }
  }
  return o;
};
if (BASE && want("BOUND")) {
  const a = walk(BASE), b = walk(ORG);
  const diff = [...new Set([...a.keys(), ...b.keys()])].filter((k) => a.get(k) !== b.get(k)).sort(), extra = diff.filter((f) => !NAMED(f));
  record("BOUND", extra.length === 0, `${diff.length} file(s) differ${extra.length ? ` · BEYOND THE NAMED: ${extra.slice(0, 12).join(", ")}` : " · outside the named files 0"}`);
}
try { rmSync(TMP, { recursive: true, force: true }); } catch { /* a survivor holds a file: LAST names it */ }
{
  let table = "", why = "";
  try {
    table = process.platform === "win32"
      ? execFileSync("powershell.exe", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | ForEach-Object { $_.CommandLine }"], { encoding: "utf8" })
      : execFileSync("ps", ["-eo", "args"], { encoding: "utf8" });
  } catch (e) { why = `process table unreadable: ${e.message}`; }
  const left = table.split(/\r?\n/).filter((l) => l.includes(TMP) && !/\bps -eo\b/.test(l));
  record("LAST", !why && left.length === 0, why || `${left.length} survivor(s)`);
}
const red = results.filter((r) => !r.ok).map((r) => r.id);
if (red.length) { console.log(`RED ${UNIT} · ${red.join(", ")}`); process.exit(1); }
console.log(`GREEN ${UNIT} the G9 / G8 compile is handed a clock no earlier than the records planted for it, so a fast machine never drops them; the old wait kept, struck · ${results.length} clause(s)`);
process.exit(0);
