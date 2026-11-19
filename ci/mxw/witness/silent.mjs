// mxw measurement: header-declared SOLE WRITER files the IR holds with ZERO writers (the shape Q5 never reports).
// Prints paths and organ names only — never a file's content.
const x = await import(process.argv[2]);
const ir = x.build();
const byName = new Map(); for (const f of ir.files) byName.set(f.path.split("/").pop(), f);
const silent = [];
for (const d of ir.declared_sole_writers) {
  const f = byName.get(d.file);
  if (!f || f.is_dir) continue;
  if (f.writers.length === 0) silent.push(`${d.organ}→${f.path}${f.fixture_writers && f.fixture_writers.length ? " (fixture-only)" : ""}`);
}
const absent = ir.declared_sole_writers.filter((d) => !byName.get(d.file)).map((d) => `${d.organ}→${d.file}`);
console.log(JSON.stringify({ declared: ir.declared_sole_writers.length, silent_n: [...new Set(silent)].length, silent: [...new Set(silent)], not_in_ir_n: [...new Set(absent)].length }));
