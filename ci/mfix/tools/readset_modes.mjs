// unit mfix — the READ SET of the full-profile modes that hold the LIVE asserts (laws · integrity), measured the way
// readset.mjs measures a selftest: one run per mode in a T tree under os.tmpdir() with readprobe.mjs preloaded.
// A mode is the assert's grain of SPAWN, so this is the union over the mode's asserts (names + exits, no value).
//   node ci/mfix/tools/readset_modes.mjs <sha> laws integrity > ci/mfix/census/readset_modes.jsonl
import { mk, suiteSource, WAIT, runIn, rm, readRows } from "./lib.mjs";
import { mkdtempSync } from "node:fs"; import { join } from "node:path"; import { tmpdir } from "node:os";
const [sha, ...modes] = process.argv.slice(2); const wait = WAIT(suiteSource(sha));
for (const m of modes) {
  const d = mk(sha, "T"); const j = join(mkdtempSync(join(tmpdir(), "mfix-rp-")), "rp.jsonl");
  const r = await runIn(d, ["scripts/organism_test.mjs", m], wait, { probe: j }); rm(d);
  const files = {};
  for (const p of readRows(j)) for (const [f, v] of Object.entries(p.files)) { files[f] ??= { read: 0, by: new Set(), paths: new Set() }; files[f].read += v.read; files[f].by.add(p.argv1); v.paths.forEach((x) => files[f].paths.add(x)); }
  for (const f in files) { files[f].by = [...files[f].by].sort(); files[f].paths = [...files[f].paths].sort(); }
  console.log(JSON.stringify({ mode: m, code: r.code, ok: r.asserts.filter((a) => a.v === "ok").length, fail: r.asserts.filter((a) => a.v === "FAIL").length, files }));
}
