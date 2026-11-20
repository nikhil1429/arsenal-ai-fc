// unit mfix — a full-profile MODE on a Z tree after owner CLIs derived their files from code (no authored byte):
//   node ci/mfix/tools/derive_mode.mjs <sha> <mode> "<owner argv>" ["<owner argv>"…]
import { mk, suiteSource, WAIT, runIn, rm } from "./lib.mjs";
const [sha, mode, ...owners] = process.argv.slice(2); const wait = WAIT(suiteSource(sha));
const d = mk(sha, "Z"); const ex = [];
for (const o of owners) ex.push((await runIn(d, o.split(/\s+/), wait)).code);
const r = await runIn(d, ["scripts/organism_test.mjs", mode], wait); rm(d);
console.log(JSON.stringify({ mode, owners, owner_exits: ex, exit: r.code, ok: r.asserts.filter((a) => a.v === "ok").length, fail: r.asserts.filter((a) => a.v === "FAIL").map((a) => a.name.replace(/\d+/g, "#").slice(0, 100)) }));
