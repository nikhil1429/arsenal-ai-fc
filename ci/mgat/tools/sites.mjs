// unit mgat · every no-empty site eslint reports at <sha> (LF tree, state excluded), and the NEW ones against its first parent.
// usage: node ci/mgat/tools/sites.mjs <sha>            → counts at sha^1 and sha, then each NEW site as file:line  <source line>
//        node ci/mgat/tools/sites.mjs <sha> --all      → every site at sha
// A site is keyed by (file, trimmed source text of its line, occurrence index), so a site that only MOVED is not new.
import { tree, REPO } from "./tree.mjs"; import { spawnSync, execFileSync } from "node:child_process"; import { readFileSync, rmSync } from "node:fs"; import { join, relative } from "node:path";
export function sitesAt(sha) {
  const d = tree(sha, { git: false });
  const r = spawnSync(process.execPath, [join(d, "node_modules", "eslint", "bin", "eslint.js"), "scripts", "hooks", "--format", "json"], { cwd: d, encoding: "utf8", maxBuffer: 1 << 28 });
  const rep = JSON.parse(r.stdout.slice(r.stdout.indexOf("["), r.stdout.lastIndexOf("]") + 1));
  const out = [];
  for (const f of rep) {
    const rel = relative(d, f.filePath); const lines = readFileSync(f.filePath, "utf8").split("\n");
    for (const m of f.messages) if (m.ruleId === "no-empty") out.push({ file: rel, line: m.line, col: m.column, src: (lines[m.line - 1] || "").trim() });
  }
  rmSync(d, { recursive: true, force: true });
  return out;
}
const keyed = (s) => { const n = {}; return s.map((x) => { const k = `${x.file}\u0000${x.src}`; n[k] = (n[k] || 0) + 1; return { ...x, key: `${k}\u0000${n[k]}` }; }); };
if (process.argv[1] && process.argv[1].endsWith("sites.mjs")) {
  const sha = execFileSync("git", ["-C", REPO, "rev-parse", "--short=7", process.argv[2]], { encoding: "utf8" }).trim();
  const kid = keyed(sitesAt(sha));
  if (process.argv.includes("--all")) { for (const x of kid) console.log(`${x.file}:${x.line}:${x.col}  ${x.src.slice(0, 140)}`); console.log(`mgat sites ${sha}: no-empty ${kid.length}`); }
  else {
    const par = execFileSync("git", ["-C", REPO, "rev-parse", "--short=7", sha + "^1"], { encoding: "utf8" }).trim();
    const pk = new Set(keyed(sitesAt(par)).map((x) => x.key)); const ck = new Set(kid.map((x) => x.key));
    const added = kid.filter((x) => !pk.has(x.key)); const gone = [...pk].filter((k) => !ck.has(k));
    for (const x of added) console.log(`NEW  ${x.file}:${x.line}:${x.col}  ${x.src.slice(0, 160)}`);
    for (const k of gone) console.log(`GONE ${k.split("\u0000").slice(0, 2).join("  ").slice(0, 180)}`);
    console.log(`mgat sites ${par} -> ${sha}: no-empty ${pk.size} -> ${kid.length} · new ${added.length} · gone ${gone.length}`);
  }
}
