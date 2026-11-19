#!/usr/bin/env node
// measure.mjs — unit mxc: in-process build()+queries() of a tree's OWN scripts/xray.mjs (code only: the IR lists
// state FILE NAMES for on_disk; no state file's content is read). --cwd runs it from another working directory.
// --json <file> writes {edges, q, unresolved, perOrgan, files} for diffing (to a path the caller names, never the repo).
import { pathToFileURL } from "node:url";
import { join, resolve } from "node:path";
import { writeFileSync } from "node:fs";
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const tree = resolve(arg("--tree"));
if (arg("--cwd")) process.chdir(arg("--cwd"));
const x = await import(pathToFileURL(join(tree, "scripts", "xray.mjs")).href);
const ir = x.build(); const q = x.queries(ir);
const edges = [];
for (const [o, v] of Object.entries(ir.organs)) {
  for (const r of v.reads) edges.push([o, "R", r.path, r.fixture ? "fx" : "live"].join("\t"));
  for (const w of v.writes) edges.push([o, "W", w.path, w.fixture ? "fx" : "live"].join("\t"));
  for (const sp of v.spawns) if (sp.kind === "organ") edges.push([o, "S", `${sp.script} ${sp.verb ?? ""}`.trim(), `ctx=${sp.ctx}`].join("\t"));
}
const writersOf = Object.fromEntries(ir.files.map((f) => [f.path, f.writers.join("+")]));
const rows = Object.fromEntries(Object.entries(q).map(([k, v]) => [k, v.map((f) => f.path || f.file).sort()]));
const perOrgan = Object.fromEntries(Object.entries(ir.organs).map(([o, v]) => [o, v.unresolved]));
const out = { writersOf, edges: edges.sort(), q: rows, unresolved: ir.unresolved_sinks, perOrgan, files: ir.files.length, verbs: Object.fromEntries(Object.entries(ir.organs).map(([o, v]) => [o, v.verbs])) };
if (arg("--json")) writeFileSync(arg("--json"), JSON.stringify(out));
console.log(`unresolved ${out.unresolved} · files ${out.files} · ` + Object.entries(rows).map(([k, v]) => `${k} ${v.length}`).join(" · "));
