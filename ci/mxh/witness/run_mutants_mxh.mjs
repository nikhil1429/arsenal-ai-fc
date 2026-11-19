#!/usr/bin/env node
// ci/mxh/witness/run_mutants_mxh.mjs — one mutant per clause of witness_mxh.mjs; each must turn ITS clause RED.
// USAGE: node ci/mxh/witness/run_mutants_mxh.mjs --xray <the BUILT xray.mjs (xray_mxh_full.patch applied)> --tree <dir>
// Each mutant is a string replacement on a COPY under os.tmpdir(); an anchor that is not found exactly once is a RED
// runner (the mutant is named UNAPPLIED, never skipped). Control: the unmutated build must be GREEN on every clause.
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const XRAY = resolve(arg("--xray")), TREE = resolve(arg("--tree"));
const WIT = join(dirname(fileURLToPath(import.meta.url)), "witness_mxh.mjs");
const MUTANTS = [
  { id: "M1", kills: "W1", why: "the boundary reverted (json|jsonl, no boundary)",
    from: "line.matchAll(/([A-Za-z0-9_\\-.]+\\.jsonl?)(?![A-Za-z0-9_])/g)", to: "line.matchAll(/([A-Za-z0-9_\\-.]+\\.(?:json|jsonl))/g)" },
  { id: "M2", kills: "W2", why: "the foreign-organ check dropped",
    from: " || foreignNamed(f, clauseBefore(head, m.index + fm.index))", to: "" },
  { id: "M3", kills: "W3", why: "the clause never walks back over a wrapped // line (same-line rule R1)",
    from: "      if (start === 0) return txt;\n", to: "      return txt;\n" },
  { id: "M4", kills: "W4", why: "`;` is not a clause stop (sentence rule R3)",
    from: "const STOP = /\\.(?=\\s|$)|;/g;", to: "const STOP = /\\.(?=\\s|$)/g;" },
  { id: "M5", kills: "W4", why: "the walk-back ignores stops and always takes the line above (rule R2)",
    from: "      const cut = lastStop(txt);\n", to: "      const cut = i ? 0 : -1;\n" },
  { id: "M6", kills: "W5", why: "Q6 reads only the LAST path of a basename (the byName last-wins shape)",
    from: "const named = byBase.get(d.file) || [];", to: "const named = (byBase.get(d.file) || []).slice(-1);" },
  { id: "M7", kills: "W3", why: "a stop between the marker and the token no longer ends the claim (W3's first shape)",
    from: "if (lastStop(line.slice(0, fm.index)) >= 0 || ", to: "if (" },
  { id: "M8", kills: "W6", why: "the whole clause rule dropped (the F2 boundary fix ALONE)",
    from: "        if (lastStop(line.slice(0, fm.index)) >= 0 || foreignNamed(f, clauseBefore(head, m.index + fm.index))) continue;\n", to: "" },
  // N1 (forks row 1128 (3)) — these run only on a build carrying xray_n1_mask.patch (else UNAPPLIED = RED)
  { id: "M9", kills: "W7", why: "the mask only in the fixpoint (pass 1 still leaks)",
    from: "        if (inner !== scope) {\n", to: "        if (false) {\n" },
  { id: "M10", kills: "W7", why: "the mask only in pass 1 (the fixpoint re-analysis still leaks)",
    from: "      let combos = [maskParams(new Map(env), fn.params)];", to: "      let combos = [new Map(env)];" },
  { id: "M11", kills: "W7", why: "patternNames skips ObjectPattern (the destructured slot of mxw PROOF N1 leaks)",
    from: "    else if (p.type === \"ObjectPattern\") p.properties.forEach((q) => go(q.type === \"RestElement\" ? q.argument : q.value)); };", to: "    };" },
];
const T = mkdtempSync(join(tmpdir(), "mxh-mutants-"));
const src = readFileSync(XRAY, "utf8");
const run = (file) => {
  const r = spawnSync(process.execPath, [WIT, "--xray", file, "--tree", TREE, "--live"], { encoding: "utf8", windowsHide: true });
  const lines = String(r.stdout || "").split(/\r?\n/);
  const red = new Set(lines.filter((l) => /^\s+RED\s/.test(l)).map((l) => l.trim().split(/\s+/)[1]));
  return { red, last: lines.filter((l) => l.trim()).pop() };
};
let bad = 0;
const ctl = run(XRAY);
console.log(`  control (unmutated) → ${ctl.last}`); if (ctl.red.size) bad++;
for (const m of MUTANTS) {
  const n = src.split(m.from).length - 1;
  if (n !== 1) { console.log(`  RED   ${m.id} UNAPPLIED — anchor found ${n} times`); bad++; continue; }
  const f = join(T, `xray_${m.id}.mjs`); writeFileSync(f, src.replace(m.from, m.to));
  const r = run(f);
  const ok = r.red.has(m.kills);
  if (!ok) bad++;
  console.log(`  ${ok ? "KILLED" : "ALIVE "} ${m.id} (${m.why}) → ${m.kills} ${ok ? "RED" : "GREEN"} · ${r.last}`);
}
rmSync(T, { recursive: true, force: true });
console.log(bad ? `RED MXH MUTANTS · ${bad}` : `GREEN MXH MUTANTS · ${MUTANTS.length} of ${MUTANTS.length} killed by their clause, control GREEN`);
process.exit(bad ? 1 : 0);
