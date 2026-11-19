// mxh: the IR fact diff between two xray.mjs builds of the SAME tree — every (file, organ, writer|reader) edge
// gained or lost, production vs fixture, plus per-organ unresolved deltas and Q counts. Paths + organ names only.
// usage: node ci/mxh/witness/factdiff.mjs <A>/scripts/xray.mjs <B>/scripts/xray.mjs
import { spawnSync } from "node:child_process";
import { writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os"; import { join } from "node:path"; import { pathToFileURL } from "node:url";
const T = mkdtempSync(join(tmpdir(), "mxh-factdiff-"));
const facts = (x) => {
  const f = join(T, `c${Math.random().toString(36).slice(2)}.mjs`);
  writeFileSync(f, `const x = await import(${JSON.stringify(pathToFileURL(x).href)}); const ir = x.build(); const q = x.queries(ir);
const e = []; for (const f of ir.files) { for (const w of f.writers) e.push("W " + f.path + " " + w); for (const r of f.readers) e.push("R " + f.path + " " + r);
  for (const w of f.fixture_writers) e.push("FW " + f.path + " " + w); for (const r of f.fixture_readers) e.push("FR " + f.path + " " + r); }
console.log(JSON.stringify({ e, un: Object.fromEntries(Object.entries(ir.organs).map(([o, v]) => [o, v.unresolved])), total: ir.unresolved_sinks, q: Object.fromEntries(Object.entries(q).map(([k, v]) => [k, v.length])) }));`);
  const r = spawnSync(process.execPath, [f], { encoding: "utf8", maxBuffer: 1 << 28 });
  return JSON.parse(String(r.stdout).trim().split("\n").pop());
};
const A = facts(process.argv[2]), B = facts(process.argv[3]);
const a = new Set(A.e), b = new Set(B.e);
const lost = [...a].filter((x) => !b.has(x)).sort(), gained = [...b].filter((x) => !a.has(x)).sort();
const worse = Object.keys(B.un).filter((o) => B.un[o] > (A.un[o] ?? 0)).map((o) => `${o} ${A.un[o]}→${B.un[o]}`);
const better = Object.keys(B.un).filter((o) => B.un[o] < (A.un[o] ?? 0)).map((o) => `${o} ${A.un[o]}→${B.un[o]}`);
console.log(JSON.stringify({ lost_n: lost.length, gained_n: gained.length, lost, gained, total: `${A.total}→${B.total}`, organs_worse: worse, organs_better: better, qA: A.q, qB: B.q }, null, 1));
rmSync(T, { recursive: true, force: true });
