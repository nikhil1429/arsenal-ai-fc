// unit mgat build seat · apply build.mjs EDITS (the spec's exact bytes, 370c5e6) to a tree: each `from` must match EXACTLY ONCE
// or applyBuild throws, naming the edit, and nothing is written (byFile is written only after every edit matched).
// usage: node ci/mgat/tools/apply.mjs <dir> [--check]   (--check: count the matches, write nothing)
import { EDITS, applyBuild } from "./build.mjs"; import { readFileSync } from "node:fs"; import { join, resolve } from "node:path";
const d = resolve(process.argv[2] || "."); const check = process.argv.includes("--check");
if (check) {
  let bad = 0; const byFile = {};
  for (const e of EDITS) { const s = byFile[e.file] ?? readFileSync(join(d, e.file), "utf8"); const n = s.split(e.from).length - 1;
    const at = n === 1 ? s.slice(0, s.indexOf(e.from)).split("\n").length : "-"; console.log(`${e.id} ${e.file}:${at} matched ${n}`); if (n !== 1) bad++; byFile[e.file] = n === 1 ? s.replace(e.from, () => e.to) : s; }
  console.log(`mgat apply --check: ${EDITS.length - bad} of ${EDITS.length} edit(s) matched exactly once`); process.exitCode = bad ? 1 : 0;
} else { const files = applyBuild(d); console.log(`mgat apply: ${EDITS.length} edit(s) applied · files ${files.join(" ")}`); }
