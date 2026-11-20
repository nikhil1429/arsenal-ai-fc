// unit mfix — W6's plant, measured on the base: mode `atlas` on a tree whose state is ONLY a synthetic registry (synth.mjs
// `ids` transform) + the owner-derived xray_graph.json (`xray.mjs build`) + flow_atlas.json (`flow_atlas.mjs build`);
// then the same after one organ's source gains a state read the atlas never saw (the code moved, the atlas did not).
//   node ci/mfix/tools/atlas_real.mjs <sha>
import { mk, suiteSource, WAIT, runIn, rm, SD, REPO } from "./lib.mjs";
import { readFileSync, writeFileSync, appendFileSync } from "node:fs"; import { join } from "node:path"; import { execFileSync } from "node:child_process";
const sha = process.argv[2] || "HEAD"; const wait = WAIT(suiteSource(sha));
const base = JSON.parse(execFileSync("git", ["-C", REPO, "show", `${sha}:${SD}/registry.json`], { encoding: "utf8", maxBuffer: 1 << 28 }));
const KEEP = new Set(["subject", "id", "version"]);
const tx = (v, k) => Array.isArray(v) ? (k === "rulings" ? [] : v.map((x) => tx(x, null))) : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([kk, x]) => [kk, tx(x, kk)])) : typeof v === "string" ? (KEEP.has(k) ? v : "fx") : typeof v === "number" ? (v === 0 ? 0 : 1) : v;
for (const edit of [false, true]) {
  const d = mk(sha, "Z"); writeFileSync(join(d, SD, "registry.json"), JSON.stringify(tx(base, null), null, 1));
  const pre = [(await runIn(d, ["scripts/xray.mjs", "build"], wait)).code, (await runIn(d, ["scripts/flow_atlas.mjs", "build"], wait)).code];
  if (edit) appendFileSync(join(d, "scripts", "outbox.mjs"), `\nexport const __mfixPlant = () => readFileSync(join(STATE_DIR, "mfix_planted_edge.json"), "utf8");\n`);
  const r = await runIn(d, ["scripts/organism_test.mjs", "atlas"], wait); rm(d);
  const a = r.asserts.find((x) => /^FLOW ATLAS/.test(x.name));
  console.log(JSON.stringify({ variant: edit ? "edited-after-build" : "seeded", owner_exits: pre, exit: r.code, atlas_assert: a ? `${a.v} ${a.name.slice(0, 60)}` : null }));
}
