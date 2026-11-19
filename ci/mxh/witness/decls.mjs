// mxh triage: every SOLE-WRITER header declaration xray's parser makes (F2-fixed regex), one row each,
// with the source line number, whether a FOREIGN organ (`<other>.mjs`) is named on that source line
// before the file token, and what the IR (of the xray.mjs named) says writes that file.
// Prints organ names, file names, line numbers and booleans only — never a line's text.
// usage: node ci/mxh/witness/decls.mjs <copy>/scripts/xray.mjs
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
const xp = process.argv[2];
const x = await import(xp);
const ir = x.build();
const scripts = dirname(xp);
const byPath = ir.files;
const rows = [];
for (const f of readdirSync(scripts).filter((n) => n.endsWith(".mjs")).sort()) {
  const src = readFileSync(join(scripts, f), "utf8");
  const head = src.slice(0, 12000);
  for (const m of head.matchAll(/(?:SOLE WRITER|sole writer|Single writer|single writer|SINGLE WRITER)[^\n]{0,160}/g)) {
    const lineNo = head.slice(0, m.index).split("\n").length;
    const lineStart = head.lastIndexOf("\n", m.index) + 1;
    for (const fm of m[0].matchAll(/([A-Za-z0-9_\-.]+\.jsonl?)(?![A-Za-z0-9_])/g)) {
      const before = head.slice(lineStart, m.index + fm.index);
      const foreign = [...before.matchAll(/([A-Za-z0-9_\-]+)\.mjs/g)].map((t) => t[1] + ".mjs").filter((o) => o !== f);
      const hits = byPath.filter((p) => p.path.split("/").pop() === fm[1]);
      rows.push({
        organ: f, line: lineNo, file: fm[1],
        foreign_before: [...new Set(foreign)],
        ir: hits.map((h) => ({ path: h.path, writers: h.writers, fixture_writers: h.fixture_writers.length })),
      });
    }
  }
}
for (const r of rows) console.log(JSON.stringify(r));
