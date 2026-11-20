// unit mfix — THE OWNER-DERIVED PLANT probe. In a Z tree (state dir planted EMPTY, none of his bytes) run an owner's
// own CLI that derives a state file FROM CODE, then run the member on that tree. Shows whether a file needs no
// authored fixture at all: its owner writes it inside the plant (owners-only holds inside the temp tree too).
//   node ci/mfix/tools/derive.mjs <sha> "<owner argv>" <organ…>
import { mk, suiteSource, cmdOf, WAIT, runIn, rm } from "./lib.mjs";
import { existsSync, statSync } from "node:fs"; import { join } from "node:path";
const [sha, ownerCmd, ...organs] = process.argv.slice(2);
const src = suiteSource(sha), cmd = cmdOf(sha, src), wait = WAIT(src);
for (const o of organs) {
  const d = mk(sha, "Z"); const owner = await runIn(d, ownerCmd.split(/\s+/), wait);
  const made = ownerCmd.match(/scripts\/(\w+)\.mjs/)[1];
  const r = await runIn(d, cmd(o), wait); rm(d);
  console.log(JSON.stringify({ organ: o, owner: ownerCmd, owner_exit: owner.code, exit: r.code, pass: r.pass, fail: r.fail, enoent: r.enoent, failed: r.asserts.filter((a) => a.v === "FAIL").length }));
}
