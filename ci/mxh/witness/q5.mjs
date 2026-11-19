// mxh measurement: Q5 (declared sole writer, IR disagrees) and the F5 census (declared, ZERO writers),
// from ONE in-process build() of the xray.mjs named. Prints paths and organ names only — never content.
// usage: node ci/mxh/witness/q5.mjs <copy>/scripts/xray.mjs [--detail]
const x = await import(process.argv[2]);
const ir = x.build();
const q = x.queries(ir);
const byName = new Map(); for (const f of ir.files) byName.set(f.path.split("/").pop(), f);
const silent = new Set(), absent = new Set();
for (const d of ir.declared_sole_writers) {
  const f = byName.get(d.file);
  if (!f) { absent.add(`${d.organ}→${d.file}`); continue; }
  if (f.is_dir) continue;
  if (f.writers.length === 0) silent.add(`${d.organ}→${f.path}${f.fixture_writers?.length ? " (fixture-only)" : ""}`);
}
// guarded: a declaration Q5 really checks — some IR path with that basename has the declarer as a writer
const guarded = new Set(ir.declared_sole_writers.filter((d) => ir.files.some((f) => f.path.split("/").pop() === d.file && f.writers.includes(d.organ))).map((d) => d.organ + "→" + d.file));
const out = {
  guarded_n: guarded.size,
  declared: ir.declared_sole_writers.length,
  declared_jsonl: ir.declared_sole_writers.filter((d) => d.file.endsWith(".jsonl")).length,
  Q2: q.Q2.map((f) => f.path),
  Q5_n: q.Q5.length,
  Q5: q.Q5.map((r) => `${r.path} declared=${r.declared_by} undeclared=${r.undeclared.join("+")}`),
  F5_n: silent.size, F5: [...silent].sort(),
  not_in_ir_n: absent.size,
};
if (process.argv.includes("--detail")) out.not_in_ir = [...absent].sort();
console.log(JSON.stringify(out, null, 1));
