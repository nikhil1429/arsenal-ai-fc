// unit mfix — for each (member, state file) of the read set, the READ SITE by file:line at the sha: the first line of the
// member's own script naming the file; else the first non-comment line of a module it imports (two hops) naming it (the reader it rides).
//   node ci/mfix/tools/readers.mjs <sha> > ci/mfix/census/readers.jsonl
import { execFileSync } from "node:child_process"; import { join } from "node:path";
import { readRows, HERE, REPO } from "./lib.mjs";
const sha = process.argv[2] || "HEAD";
const show = (p) => { try { return execFileSync("git", ["-C", REPO, "show", `${sha}:${p}`], { encoding: "utf8", maxBuffer: 1 << 28 }).split("\n"); } catch { return null; } };
const cache = new Map(); const src = (o) => { if (!cache.has(o)) cache.set(o, show(`scripts/${o}.mjs`)); return cache.get(o); };
const site = (o, f) => { const L = src(o); if (!L) return null; const i = L.findIndex((l) => !/^\s*(\/\/|\*|\/\*)/.test(l) && (l.includes(`"${f}"`) || l.includes(`'${f}'`) || l.includes(`/${f}`))); return i >= 0 ? `scripts/${o}.mjs:${i + 1}` : null; };
for (const r of readRows(join(HERE, "..", "census", "readset.jsonl"))) {
  const impsOf = (o) => [...new Set((src(o) || []).flatMap((l) => [...l.matchAll(/from\s+"\.\/([\w-]+)\.mjs"/g)].map((m) => m[1])))];
  const hop1 = impsOf(r.organ), imps = [...new Set([...hop1, ...hop1.flatMap(impsOf)])];
  const sites = {};
  for (const f of Object.keys(r.files)) sites[f] = site(r.organ, f) || imps.map((i) => site(i, f)).find(Boolean) || "(indirect: a helper beyond two import hops)";
  console.log(JSON.stringify({ organ: r.organ, sites }));
}
