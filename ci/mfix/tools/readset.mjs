// unit mfix — the READ SET of every LIVE selftest, measured: each organ's suite command runs ONCE in a T tree (the
// sha's tracked state copied under os.tmpdir(); his bytes never leave the temp tree and never reach this output) with
// readprobe.mjs preloaded. Output: one row per organ {organ, line, code, files:{name:{read, paths}}}: key SHAPES only.
//   node ci/mfix/tools/readset.mjs <sha> [organ…] > ci/mfix/census/readset.jsonl
import { mk, suiteSource, block, cmdOf, WAIT, runIn, pool, rm, readRows } from "./lib.mjs";
import { mkdtempSync } from "node:fs"; import { join } from "node:path"; import { tmpdir } from "node:os";
const sha = process.argv[2] || "HEAD", only = process.argv.slice(3);
const src = suiteSource(sha), cmd = cmdOf(sha, src), wait = WAIT(src);
const organs = block(src, "LIVE_SELFTESTS").filter((x) => !only.length || only.includes(x.key));
const rows = await pool(organs, 4, async (o) => {
  const d = mk(sha, "T"); const j = join(mkdtempSync(join(tmpdir(), "mfix-rp-")), "rp.jsonl");
  const r = await runIn(d, cmd(o.key), wait, { probe: j }); rm(d);
  const files = {};
  for (const p of readRows(j)) for (const [f, v] of Object.entries(p.files)) { files[f] ??= { read: 0, paths: new Set() }; files[f].read += v.read; v.paths.forEach((x) => files[f].paths.add(x)); }
  for (const f in files) files[f].paths = [...files[f].paths].sort();
  const row = { organ: o.key, line: o.line, code: r.code, pass: r.pass, fail: r.fail, files };
  console.log(JSON.stringify(row)); return row;
});
console.error(`readset ${sha}: ${rows.length} LIVE selftests probed on T · exit 0 under the probe: ${rows.filter((r) => r.code === 0).length} · wait ${wait} ms (run() default)`);
