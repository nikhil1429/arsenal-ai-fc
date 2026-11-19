#!/usr/bin/env node
// diff.mjs a.json b.json — unit mxc: edge, query-row, per-organ unresolved and verb differences between two measure.mjs dumps.
import { readFileSync } from "node:fs";
const [A, B] = process.argv.slice(2).filter((a) => !a.startsWith("--")).map((f) => JSON.parse(readFileSync(f, "utf8")));
const sa = new Set(A.edges), sb = new Set(B.edges);
const quiet = process.argv.includes("--quiet");
const rm = A.edges.filter((e) => !sb.has(e)), add = B.edges.filter((e) => !sa.has(e));
if (!quiet) { for (const e of rm) console.log("- " + e); for (const e of add) console.log("+ " + e); }
for (const k of Object.keys(A.q)) {
  const a = new Set(A.q[k]), b = new Set(B.q[k]);
  for (const p of A.q[k]) if (!b.has(p)) console.log(`${k} - ${p}`);
  for (const p of B.q[k]) if (!a.has(p)) console.log(`${k} + ${p}`);
  if (k === "Q2") for (const p of B.q[k]) if (a.has(p) && A.writersOf?.[p] !== B.writersOf?.[p]) console.log(`Q2 ~ ${p} writers ${A.writersOf[p]} -> ${B.writersOf[p]}`);
}
const up = [], down = [];
for (const o of Object.keys(A.perOrgan)) { const d = (B.perOrgan[o] ?? 0) - A.perOrgan[o]; if (d > 0) up.push(`${o} ${A.perOrgan[o]}->${B.perOrgan[o]}`); if (d < 0) down.push(`${o} ${A.perOrgan[o]}->${B.perOrgan[o]}`); }
let vd = 0; for (const o of Object.keys(A.verbs)) if (JSON.stringify(A.verbs[o]) !== JSON.stringify(B.verbs[o])) { vd++; if (!quiet) console.log(`verbs ${o}: ${A.verbs[o]} -> ${B.verbs[o]}`); }
console.log(`unresolved rises: ${up.join(" · ") || "none"}`);
console.log(`unresolved falls: ${down.join(" · ") || "none"}`);
console.log(`edges -${rm.length} +${add.length} · unresolved ${A.unresolved} -> ${B.unresolved} · verb sets changed ${vd}`);
