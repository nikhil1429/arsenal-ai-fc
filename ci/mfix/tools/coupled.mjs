// unit mfix — THE CODE-COUPLED ROWS, measured: for a member that goes red on the synthetic registry (synth.mjs ids),
// start from every row of the named tables VERBATIM and drop rows one at a time while the member stays green (every
// dropped row becomes synthetic, as synth.mjs makes it). What is left is the smallest set of rows whose REAL values the
// member's asserts need — the code's own enumerations, which a fixture must carry. Names + exits only.
//   node ci/mfix/tools/coupled.mjs <sha> <file> <table[,table…]> <organ…> > ci/mfix/census/coupled.jsonl
import { mk, suiteSource, cmdOf, WAIT, runIn, pool, rm, SD, REPO, block } from "./lib.mjs";
import { readFileSync, writeFileSync } from "node:fs"; import { join } from "node:path"; import { execFileSync } from "node:child_process";
const [sha, file, tablesArg, ...organs] = process.argv.slice(2);
const tables = tablesArg.split(","); const src = suiteSource(sha), cmd = cmdOf(sha, src), wait = WAIT(src);
const base = JSON.parse(execFileSync("git", ["-C", REPO, "show", `${sha}:${SD}/${file}`], { encoding: "utf8", maxBuffer: 1 << 28 }));
const KEEP = new Set(["subject", "id", "version"]);
const tx = (v, k, REAL) => {
  if (v && typeof v === "object" && !Array.isArray(v) && REAL.has(v.subject)) return v;
  if (Array.isArray(v)) return k === "rulings" ? [] : v.map((x) => tx(x, null, REAL));
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([kk, x]) => [kk, tx(x, kk, REAL)]));
  if (typeof v === "string") return KEEP.has(k) ? v : "fx";
  if (typeof v === "number") return v === 0 ? 0 : 1;
  return v;
};
const all = tables.flatMap((t) => (base.tables[t] || []).map((r) => r.subject)).filter(Boolean);
// a member "mode:<m>" runs the full-profile mode; green = every LIVE assert ok on the verbatim plant is still ok.
// COUPLED_ALSO=f,g — other plant files kept verbatim beside the transformed one (their own synthesis is measured apart).
const also = (process.env.COUPLED_ALSO || "").split(",").filter(Boolean);
const fold = (n) => String(n).replace(/\d+/g, "#"), LA = block(src, "LIVE_ASSERTS");
const okLive = (r) => LA.filter((k) => { const h = r.asserts.filter((a) => { const f = fold(a.name); return f.startsWith(k.key) || f.slice(0, 90) === k.key; }); return h.length && h.every((a) => a.v === "ok"); }).map((k) => k.line);
const target = new Map();
const green = async (o, REAL) => { const d = mk(sha, { keep: [file, ...also] }); writeFileSync(join(d, SD, file), JSON.stringify(tx(base, null, new Set(REAL)), null, 1));
  const r = await runIn(d, o.startsWith("mode:") ? ["scripts/organism_test.mjs", o.slice(5)] : cmd(o), wait); rm(d);
  if (!o.startsWith("mode:")) return r.code === 0;
  const ok = okLive(r); if (!target.has(o)) { target.set(o, ok); return true; } return target.get(o).every((l) => ok.includes(l)); };
const rows = await pool(organs, 3, async (o) => {
  let keep = [...all]; const start = await green(o, keep);
  if (start) for (const s of [...all]) { const w = keep.filter((x) => x !== s); if (await green(o, w)) keep = w; }
  const row = { organ: o, file, tables, also, ...(target.has(o) ? { live_ok: target.get(o) } : {}), all_real_green: start, real_rows: start ? keep : null };
  console.log(JSON.stringify(row)); return row;
});
console.error(`coupled ${file} ${tables.join("+")}: ${rows.length} members · green with all rows real ${rows.filter((r) => r.all_real_green).length} · rows kept real (sum) ${rows.reduce((a, r) => a + (r.real_rows || []).length, 0)}`);
