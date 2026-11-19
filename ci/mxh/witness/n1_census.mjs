// mxh N1 census: every function in scripts/*.mjs whose parameter list binds a name that a MODULE-level
// const/let/var also binds (the exposure), split by shape (plain | defaulted | destructured | rest).
// A bite is measured separately (factdiff.mjs: the IR edges the mask changes). Prints organ:line:name only.
// usage: node ci/mxh/witness/n1_census.mjs <copy>   (needs <copy>/node_modules/acorn)
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";
const root = process.argv[2];
const { parse } = createRequire(join(root, "package.json"))("acorn");
const rows = [];
for (const f of readdirSync(join(root, "scripts")).filter((n) => n.endsWith(".mjs")).sort()) {
  let ast; try { ast = parse(readFileSync(join(root, "scripts", f), "utf8"), { ecmaVersion: "latest", sourceType: "module", locations: true, allowHashBang: true }); } catch { continue; }
  const mod = new Set();
  for (const s of ast.body) {
    const d = s.type === "ExportNamedDeclaration" ? s.declaration : s;
    if (d && d.type === "VariableDeclaration") for (const x of d.declarations) if (x.id.type === "Identifier") mod.add(x.id.name);
  }
  const names = (p, shape, out) => {
    if (!p) return;
    if (p.type === "Identifier") out.push([p.name, shape]);
    else if (p.type === "AssignmentPattern") names(p.left, shape === "plain" ? "defaulted" : shape, out);
    else if (p.type === "RestElement") names(p.argument, "rest", out);
    else if (p.type === "ArrayPattern") p.elements.forEach((e) => names(e, "destructured", out));
    else if (p.type === "ObjectPattern") p.properties.forEach((q) => names(q.type === "RestElement" ? q.argument : q.value, "destructured", out));
  };
  const walk = (n) => {
    if (!n || typeof n.type !== "string") return;
    if (/Function/.test(n.type) && n.params) {
      const out = []; n.params.forEach((p) => names(p, "plain", out));
      for (const [nm, shape] of out) if (mod.has(nm)) rows.push({ organ: f, line: n.loc.start.line, name: nm, shape });
    }
    for (const k of Object.keys(n)) { if (k === "loc") continue; const v = n[k];
      if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v.type === "string") walk(v); }
  };
  walk(ast);
}
const by = (k) => rows.reduce((m, r) => (m[r[k]] = (m[r[k]] || 0) + 1, m), {});
console.log(JSON.stringify({ exposed_n: rows.length, organs_n: new Set(rows.map((r) => r.organ)).size, by_shape: by("shape"), rows: rows.map((r) => `${r.organ}:${r.line} ${r.name} (${r.shape})`) }, null, 1));
