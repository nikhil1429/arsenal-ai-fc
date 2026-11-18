#!/usr/bin/env node
// ============================================================================
// ci/mlj/run_mutants_mlj.mjs — ONE MUTANT PER CLAUSE of ci/mlj/witness_mlj.mjs
// ----------------------------------------------------------------------------
// CONTRACT: node ci/mlj/run_mutants_mlj.mjs --org <build tree> --base-org <base tree>
// Each mutant is a copy of --org under os.tmpdir() with ONE text edit to the file it names (matched in the file's OWN line
// ending, CRLF-proof); the witness runs over it with --only <clause> against --base-org and must print RED naming that
// clause. The control (the unmutated --org, every clause) must print GREEN. An anchor that is not found is a RED mutant.
// LAST LINE: run_mutants: k of n mutant(s) RED by the clause that names them · control GREEN|RED   (exit 0 iff k == n and GREEN)
// ============================================================================
import { spawnSync } from "node:child_process";
import { mkdtempSync, cpSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";

const arg = (k) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : null; };
const ORG = arg("--org"), BASE = arg("--base-org");
if (!ORG || !BASE) { console.log("run_mutants: usage --org <dir> --base-org <dir>"); process.exit(1); }
const WITNESS = join(dirname(fileURLToPath(import.meta.url)), "witness_mlj.mjs");
const L = "scripts/land.mjs", K = "scripts/keeper.mjs";
const GATE = "  if (jh.held) return stop(1, \"REFUSED\", \"JUDGE-HELD\", `a judge round holds :${jh.port} — land when it closes`, T);\n";
const MUTANTS = [
  { clause: "J1", file: L, what: "the verb never reads the judge (a held round lands)", from: "if (jh.held) return stop(", to: "if (false) return stop(" },
  { clause: "J2", file: L, what: "--dry skips the judge gate", from: "if (jh.held) return stop(", to: "if (jh.held && !opt.dry) return stop(" },
  { clause: "J3", file: L, what: "JUDGE-HELD is counted as a stop a human resolves (resets the count)", from: '"LIVE-RED", "TRIPWIRE"]);', to: '"LIVE-RED", "TRIPWIRE", "JUDGE-HELD"]);' },
  { clause: "J4", file: L, what: "the judge is read FIRST (before the verdict and the sitting), not last before the move",
    edits: [
      { from: "  let jh;\n", to: "" },
      { from: "  // 6 · the verdict at T\n", to: "  let jh;\n  try { const k = await import(\"./keeper.mjs\"); jh = { held: await k.judgeHeld(), port: k.JUDGE_PORT }; } catch { jh = { held: true, port: 0 }; }\n" + GATE + "  // 6 · the verdict at T\n" },
      { from: GATE, to: "", last: true },
    ] },
  { clause: "J5", file: L, what: "the verb bind-tests its own fixed port instead of keeper's judgeHeld",
    from: 'try { const k = await import("./keeper.mjs"); jh = { held: await k.judgeHeld(), port: k.JUDGE_PORT }; }',
    to: 'try { const net = await import("node:net"); jh = { held: await new Promise((r) => { const s = net.createServer(); s.once("error", () => r(true)); s.listen(4118, "127.0.0.1", () => s.close(() => r(false))); }), port: 4118 }; }' },
  { clause: "K1", file: K, what: "keeper's JUDGE_PORT ignores its env door", from: "(Number(process.env.ARSENAL_JUDGE_PORT))", to: "(4118)" },
];
const root = mkdtempSync(join(os.tmpdir(), "mutants-mlj-"));
const runW = (org, only) => { const r = spawnSync(process.execPath, [WITNESS, "--org", org, "--base-org", BASE, ...(only ? ["--only", only] : [])], { encoding: "utf8", windowsHide: true }); const out = (r.stdout || "").trim().split(/\r?\n/); return { code: r.status, last: out[out.length - 1] || "" }; };
let k = 0;
try {
  MUTANTS.forEach((m, i) => {
    const dir = join(root, `m${i + 1}`);
    cpSync(ORG, dir, { recursive: true, filter: (s) => !/[\\/](node_modules|\.git|dressing-room)$/.test(s) });
    const p = join(dir, ...m.file.split("/"));
    const raw = readFileSync(p, "utf8"), eol = raw.includes("\r\n") ? "\r\n" : "\n";
    let text = raw;
    const edits = m.edits || [{ from: m.from, to: m.to }];
    let miss = null;
    for (const e of edits) {
      const from = e.from.replace(/\n/g, eol), to = e.to.replace(/\n/g, eol);
      const at = e.last ? text.lastIndexOf(from) : text.indexOf(from);
      if (at < 0) { miss = e.from.trim().slice(0, 50); break; }
      text = text.slice(0, at) + to + text.slice(at + from.length);
    }
    if (miss) { console.log(`  ✗ M${i + 1} ${m.clause} · anchor not found (${miss}) — ${m.what}`); rmSync(dir, { recursive: true, force: true }); return; }
    writeFileSync(p, text);
    const r = runW(dir, m.clause);
    const named = r.code !== 0 && new RegExp(`^RED MLJ · (.*, )?${m.clause}(,|$)`).test(r.last);
    if (named) k++;
    console.log(`  ${named ? "✓" : "✗"} M${i + 1} ${m.clause} · ${m.what} → ${r.last}`);
    rmSync(dir, { recursive: true, force: true });
  });
  const c = runW(ORG, null);
  const control = c.code === 0 && /^GREEN MLJ/.test(c.last);
  console.log(`  ${control ? "✓" : "✗"} control → ${c.last}`);
  console.log(`run_mutants: ${k} of ${MUTANTS.length} mutant(s) RED by the clause that names them · control ${control ? "GREEN" : "RED"}`);
  process.exitCode = k === MUTANTS.length && control ? 0 : 1;
} finally { rmSync(root, { recursive: true, force: true }); }
