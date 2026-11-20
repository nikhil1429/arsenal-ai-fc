// unit mfix — THE SYNTHETIC-FIXTURE PROBE. Each plant file is rebuilt by a TRANSFORM in a temp tree (never a copy):
//   ids     — keep the JSON SHAPE and only the strings the CODE asks for by name (a row's `subject` / `id`, which the
//             reader's literal looks up); every other string becomes "fx-<n>", every number keeps its type (0 → 0,
//             else 1), every boolean is kept; rows of `rulings` (his words) are dropped to zero.
//   SYNTH_REAL_ROWS=a,b — rows whose `subject` is named stay VERBATIM: the code-coupled enumerations, measured as the
//             smallest set the member needs real (the rest stays synthetic).
//   tokens  — the same, with `subject`/`id` replaced too (the control: does the member need the code's own ids?).
// Then the member runs on the transformed plant (exits only). The transform is applied by this node script inside
// the temp tree; the output is names + exits, never a value.
//   node ci/mfix/tools/synth.mjs <sha> <ids|tokens> <file[,file…]> <organ…>
import { mk, suiteSource, cmdOf, WAIT, runIn, pool, rm, SD } from "./lib.mjs";
import { readFileSync, writeFileSync } from "node:fs"; import { join } from "node:path";
const [sha, how, filesArg, ...organs] = process.argv.slice(2);
const files = filesArg.split(","); const src = suiteSource(sha), cmd = cmdOf(sha, src), wait = WAIT(src);
const KEEP = how === "ids" ? new Set(["subject", "id", "version"]) : new Set(["version"]);
let n = 0;
const REAL = new Set((process.env.SYNTH_REAL_ROWS || "").split(",").filter(Boolean));   // rows kept VERBATIM (code-coupled)
const tx = (v, k) => {
  if (v && typeof v === "object" && !Array.isArray(v) && REAL.has(v.subject)) return v;
  if (Array.isArray(v)) return k === "rulings" ? [] : v.map((x) => tx(x, null));
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([kk, x]) => [kk, tx(x, kk)]));
  if (typeof v === "string") return KEEP.has(k) ? v : `fx-${++n}`;
  if (typeof v === "number") return v === 0 ? 0 : 1;
  return v;
};
const rows = await pool(organs, 4, async (o) => {
  const d = mk(sha, { keep: files });
  for (const f of files) { const p = join(d, SD, f), t = readFileSync(p, "utf8");
    writeFileSync(p, f.endsWith(".jsonl") ? t.split(/\r?\n/).filter((l) => l.trim()).map((l) => JSON.stringify(tx(JSON.parse(l), null))).join("\n") + "\n" : JSON.stringify(tx(JSON.parse(t), null), null, 1)); }
  const r = await runIn(d, cmd(o), wait); rm(d);
  const row = { organ: o, how, files, real: [...REAL], exit: r.code, pass: r.pass, fail: r.fail, failed: r.asserts.filter((a) => a.v === "FAIL").length };
  console.log(JSON.stringify(row)); return row;
});
console.error(`synth ${how} ${files.join("+")}: ${rows.length} members · green ${rows.filter((r) => r.exit === 0).length}`);
