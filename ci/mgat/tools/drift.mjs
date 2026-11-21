// unit mgat build seat · the MAIN DRIFT between two shas, for the two gate counts the build does NOT own: eslint no-unused-vars
// MGAT_RULE=<rule[,rule]> (env) chooses the eslint rule(s) compared (default no-unused-vars); a site is keyed by rule, file and trimmed line.
// and tsc checkJs diagnostics. A site is keyed by (file, trimmed source line / tsc message) so a site that only moved is not new.
// usage: node ci/mgat/tools/drift.mjs <old> <new>   (LF trees under os.tmpdir(), state excluded; writes nothing else)
import { tree } from "./tree.mjs"; import { spawnSync } from "node:child_process"; import { readFileSync, rmSync } from "node:fs"; import { join, relative } from "node:path";
function at(sha) {
  const d = tree(sha, { git: false });
  const e = spawnSync(process.execPath, [join(d, "node_modules/eslint/bin/eslint.js"), "scripts", "hooks", "--format", "json"], { cwd: d, encoding: "utf8", maxBuffer: 1 << 28 });
  const rep = JSON.parse(e.stdout.slice(e.stdout.indexOf("["), e.stdout.lastIndexOf("]") + 1)); const lint = [];
  for (const f of rep) { const L = readFileSync(f.filePath, "utf8").split("\n"); for (const m of f.messages) if ((process.env.MGAT_RULE || "no-unused-vars").split(",").includes(m.ruleId)) lint.push(`${m.ruleId} ${relative(d, f.filePath)}  ${(L[m.line - 1] || "").trim().slice(0, 120)}  [${m.message.slice(0, 80)}]`); }
  const t = spawnSync(process.execPath, [join(d, "node_modules/typescript/bin/tsc"), "-p", join(d, "tsconfig.json"), "--noEmit"], { cwd: d, encoding: "utf8", maxBuffer: 1 << 28 });
  const ts = (t.stdout || "").split("\n").filter((l) => /error TS\d+/.test(l)).map((l) => l.replace(/\(\d+,\d+\)/, "").trim().slice(0, 200));
  const lines = (t.stdout || "").split("\n").filter((l) => /error TS\d+/.test(l));
  rmSync(d, { recursive: true, force: true }); return { lint, ts, tsRaw: lines };
}
const diff = (a, b) => { const m = new Map(); for (const x of a) m.set(x, (m.get(x) || 0) + 1); const out = []; for (const x of b) { const n = m.get(x) || 0; if (n) m.set(x, n - 1); else out.push(x); } return out; };
const [o, n] = process.argv.slice(2); const A = at(o), B = at(n);
for (const x of diff(A.lint, B.lint)) console.log(`NEW  ${x}`);
for (const x of diff(A.ts, B.ts)) console.log(`NEW tsc  ${x}  @ ${(B.tsRaw.find((r) => r.replace(/\(\d+,\d+\)/, "").trim().startsWith(x.slice(0, 60))) || "").match(/\(\d+,\d+\)/)?.[0] || ""}`);
console.log(`mgat drift ${o} -> ${n}: ${process.env.MGAT_RULE || "no-unused-vars"} ${A.lint.length} -> ${B.lint.length} · tsc ${A.ts.length} -> ${B.ts.length}`);
