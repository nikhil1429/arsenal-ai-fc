#!/usr/bin/env node
// ============================================================================
// ci/mxh/q5_paths.mjs — UNIT mxh · F7 A (row 1138 (1)): Q5 as it ships (the last-wins basename Map, xray.mjs queries())
//   against Q5 read over EVERY IR path of the basename — the count the RUNNER runs ONCE from HIS repo root at the landing.
// USAGE (from the repo root): node ci/mxh/q5_paths.mjs
//   It imports ./scripts/xray.mjs of the cwd, runs build() + queries() in-process, and writes NOTHING (xray's build() does
//   not write; only its `build` verb does). It prints state PATHS and ORGAN NAMES only — never the content of any file.
// LAST LINE: q5_paths: last-wins <n> · every-path <m> · <equal|DIFFER> (exit 0 when equal, 1 when they differ)
//   A DIFFER is F7's evidence for (B) (Q5 gets Q6's every-path read), named row by row above the last line.
// ============================================================================
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const x = await import(pathToFileURL(join(process.cwd(), "scripts", "xray.mjs")).href);
const ir = x.build();
const q = x.queries(ir);
const base = (p) => p.split("/").pop();
const key = (r) => `${r.path} declared=${r.declared_by} undeclared=${r.undeclared.join("+")}`;
const every = [];
for (const d of ir.declared_sole_writers) {
  if (d.file.endsWith("/")) continue;
  for (const f of ir.files) {
    if (f.is_dir || base(f.path) !== d.file) continue;
    const others = f.writers.filter((w) => w !== d.organ);
    if (others.length) every.push({ path: f.path, declared_by: d.organ, undeclared: others });
  }
}
const a = new Set(q.Q5.map(key)), b = new Set(every.map(key));
for (const k of [...a].filter((k) => !b.has(k))) console.log(`  last-wins only  ${k}`);
for (const k of [...b].filter((k) => !a.has(k))) console.log(`  every-path only ${k}`);
const equal = a.size === b.size && [...a].every((k) => b.has(k));
console.log(`q5_paths: last-wins ${q.Q5.length} · every-path ${every.length} · ${equal ? "equal" : "DIFFER"}`);
process.exit(equal ? 0 : 1);
