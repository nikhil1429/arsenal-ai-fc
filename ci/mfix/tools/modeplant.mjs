// unit mfix — the PLANT asserts at their spawn grain (a full-profile mode): run the mode on variants of a plant and read
// each LIVE_ASSERTS key's verdict, exactly as census_modes.mjs keys them (digits folded to #, prefix or the 90-char cut).
// Variants: R = the named tracked files · R-<f> = R without f · S = R with every file SYNTHETIC (synth.mjs `ids`
// transform) · S+<rows> = S with SYNTH_REAL_ROWS kept verbatim. Names + verdicts only.
//   node ci/mfix/tools/modeplant.mjs <sha> <mode> <file,file…> [--real a,b] > ci/mfix/census/modeplant_<mode>.jsonl
import { mk, suiteSource, block, WAIT, runIn, rm, SD } from "./lib.mjs";
import { readFileSync, writeFileSync } from "node:fs"; import { join } from "node:path";
const [sha, mode, filesArg] = process.argv.slice(2); const realArg = process.argv.includes("--real") ? process.argv[process.argv.indexOf("--real") + 1] : "";
const files = filesArg.split(","); const src = suiteSource(sha), wait = WAIT(src), keys = block(src, "LIVE_ASSERTS");
const fold = (n) => String(n).replace(/\d+/g, "#");
const KEEP = new Set(["subject", "id", "version"]);
const tx = (v, k, REAL) => {
  if (v && typeof v === "object" && !Array.isArray(v) && REAL.has(v.subject)) return v;
  if (Array.isArray(v)) return k === "rulings" ? [] : v.map((x) => tx(x, null, REAL));
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([kk, x]) => [kk, tx(x, kk, REAL)]));
  if (typeof v === "string") return KEEP.has(k) ? v : "fx";
  if (typeof v === "number") return v === 0 ? 0 : 1;
  return v;
};
const synthIn = (d, REAL) => { for (const f of files) { const p = join(d, SD, f), t = readFileSync(p, "utf8");
  writeFileSync(p, f.endsWith(".jsonl") ? t.split(/\r?\n/).filter((l) => l.trim()).map((l) => JSON.stringify(tx(JSON.parse(l), null, REAL))).join("\n") + "\n" : JSON.stringify(tx(JSON.parse(t), null, REAL), null, 1)); } };
const variant = async (name, keep, mut) => { const d = mk(sha, keep.length ? { keep } : "Z"); if (mut) mut(d); const r = await runIn(d, ["scripts/organism_test.mjs", mode], wait); rm(d);
  const v = {}; for (const k of keys) { const hit = r.asserts.filter((a) => { const f = fold(a.name); return f.startsWith(k.key) || f.slice(0, 90) === k.key; }); if (hit.length) v[k.line] = hit.every((a) => a.v === "ok") ? "ok" : "FAIL"; }
  console.log(JSON.stringify({ mode, variant: name, exit: r.code, verdicts: v })); };
await variant("Z", []);
await variant("R", files);
for (const f of files) await variant(`R-${f}`, files.filter((x) => x !== f));
await variant("S", files, (d) => synthIn(d, new Set()));
if (realArg) await variant(`S+${realArg}`, files, (d) => synthIn(d, new Set(realArg.split(","))));
