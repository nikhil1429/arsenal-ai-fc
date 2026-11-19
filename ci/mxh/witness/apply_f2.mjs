// mxh: apply the F2 parser fix to an xray.mjs COPY (never the repo's own file). Exits 3 if the base
// line is not found exactly once, so a drifted base is named, never silently patched.
// usage: node ci/mxh/witness/apply_f2.mjs <copy>/scripts/xray.mjs [variant=fix|fp]
//   fix: the boundary fix alone (§1 of MXH_SPEC.md)
//   fp : the boundary fix + the false-positive rule (§2, fork F6)
import { readFileSync, writeFileSync } from "node:fs";
const [file, variant = "fix"] = process.argv.slice(2);
const BASE = "for (const fm of line.matchAll(/([A-Za-z0-9_\\-.]+\\.(?:json|jsonl))/g)) declared.push({ organ: f, file: fm[1] });";
const FIX = "for (const fm of line.matchAll(/([A-Za-z0-9_\\-.]+\\.jsonl?)(?![A-Za-z0-9_])/g)) declared.push({ organ: f, file: fm[1] });";
const src = readFileSync(file, "utf8");
const n = src.split(BASE).length - 1;
if (n !== 1) { console.error(`apply_f2: base line found ${n} times`); process.exit(3); }
let out = src.replace(BASE, FIX);
if (variant === "fp") {
  // the FP rule: only the FIRST file named on the sole-writer line is the declared one, and only when
  // it follows the marker within the line's own clause (no other organ's .mjs named before it).
  const M = "const line = m[0];\n      " + FIX;
  const FP = "const line = m[0];\n      for (const fm of [...line.matchAll(/([A-Za-z0-9_\\-.]+\\.jsonl?)(?![A-Za-z0-9_])/g)].filter((fm) => !/[A-Za-z0-9_\\-]+\\.mjs/.test(line.slice(0, fm.index))).slice(0, 1)) declared.push({ organ: f, file: fm[1] });";
  if (out.split(M).length - 1 !== 1) { console.error("apply_f2: fp anchor not found"); process.exit(3); }
  out = out.replace(M, FP);
}
writeFileSync(file, out);
console.log(`apply_f2: ${variant} applied to ${file}`);
