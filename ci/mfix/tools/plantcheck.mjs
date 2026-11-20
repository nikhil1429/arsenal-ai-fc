// unit mfix — per PLANT member: (1) the MINIMAL plant, by one-at-a-time removal from the files its read set names
// (census/readset.jsonl ∩ the sha's tracked state); (2) the LOAD-BEARING keys: for each file of the minimal plant and
// each read key path of depth ≤ 2, the plant with that key DELETED (jsonl: from every row; and the file emptied of
// rows) — a key whose deletion turns the member red is one its asserts really judge. Runs in temp trees under
// os.tmpdir() only; the mutation is made by this node script inside the temp tree. Output: names + exits, no value.
//   node ci/mfix/tools/plantcheck.mjs <sha> [organ…] > ci/mfix/census/plantcheck.jsonl
import { mk, suiteSource, cmdOf, WAIT, runIn, pool, rm, readRows, tracked, SD, HERE } from "./lib.mjs";
import { readFileSync, writeFileSync } from "node:fs"; import { join } from "node:path";
const sha = process.argv[2] || "HEAD", only = process.argv.slice(3);
const src = suiteSource(sha), cmd = cmdOf(sha, src), wait = WAIT(src), T = new Set(tracked(sha));
const sf = new Map(readRows(join(HERE, "..", "census", "selftests.jsonl")).map((r) => [r.organ, r]));
const rs = readRows(join(HERE, "..", "census", "readset.jsonl")).filter((r) => { const s = sf.get(r.organ); return s && s.Z.code !== 0 && s.T.code === 0 && (!only.length || only.includes(r.organ)); });
const runWith = async (organ, keep, mutate) => { const d = mk(sha, { keep }); if (mutate) mutate(join(d, SD)); const r = await runIn(d, cmd(organ), wait); rm(d); return r.code; };
const del = (o, segs) => { if (!o || typeof o !== "object") return false; const [h, ...t] = segs; if (!t.length) { if (Object.prototype.hasOwnProperty.call(o, h)) { delete o[h]; return true; } return false; } return del(o[h], t); };
const out = await pool(rs, 3, async (r) => {
  let M = Object.keys(r.files).filter((f) => T.has(f)).sort();
  const full = await runWith(r.organ, M);
  if (full === 0) for (const f of [...M]) { const without = M.filter((x) => x !== f); if ((await runWith(r.organ, without)) === 0) M = without; }
  const minimal = full === 0 ? M : null, muts = [];
  for (const f of minimal || []) {
    const keys = [...new Set(r.files[f].paths.map((p) => p.split(":")[0]).map((p) => p.replace(/^\$\[\]/, "$").split(".").slice(1, 3)).filter((s) => s.length && s.every((x) => x !== "*" && !x.includes("[]"))).map((s) => s.join(".")))];
    const prefixes = [...new Set(keys.flatMap((k) => { const s = k.split("."); return s.length > 1 ? [s[0], k] : [k]; }))].sort();
    if (f.endsWith(".jsonl")) muts.push({ file: f, key: "(no rows)", exit: await runWith(r.organ, minimal, (sd) => writeFileSync(join(sd, f), "")) });
    for (const k of prefixes) {
      const exit = await runWith(r.organ, minimal, (sd) => { const p = join(sd, f), t = readFileSync(p, "utf8");
        if (f.endsWith(".jsonl")) writeFileSync(p, t.split(/\r?\n/).filter((l) => l.trim()).map((l) => { try { const o = JSON.parse(l); del(o, k.split(".")); return JSON.stringify(o); } catch { return l; } }).join("\n") + "\n");
        else { const o = JSON.parse(t); del(o, k.split(".")); writeFileSync(p, JSON.stringify(o, null, 1)); } });
      muts.push({ file: f, key: k, exit });
    }
  }
  const row = { organ: r.organ, line: r.line, read: Object.keys(r.files).sort(), full, minimal, bearing: muts.filter((m) => m.exit !== 0).map((m) => `${m.file}:${m.key}`), inert: muts.filter((m) => m.exit === 0).map((m) => `${m.file}:${m.key}`) };
  console.log(JSON.stringify(row)); return row;
});
console.error(`plantcheck ${sha}: ${out.length} PLANT members · minimal plant green: ${out.filter((r) => r.minimal).length} · with ≥1 load-bearing key: ${out.filter((r) => r.bearing.length).length} · wait ${wait} ms (run() default)`);
