// mxh N1: apply the PARAMETER-SHADOW mask to an xray.mjs COPY (never the repo's own file). A function's
// parameters (every name its patterns bind: plain, defaulted, destructured, rest) SHADOW a same-name
// module binding — in pass 1 (the module walk descends into every function body) and in the fixpoint
// re-analysis. Exits 3 when an anchor is not found exactly once.
// usage: node ci/mxh/witness/apply_n1.mjs <copy>/scripts/xray.mjs [variant=mask|fixpoint-only|pass1-only]
import { readFileSync, writeFileSync } from "node:fs";
const [file, variant = "mask"] = process.argv.slice(2);
let s = readFileSync(file, "utf8");
const rep = (a, b) => { const n = s.split(a).length - 1; if (n !== 1) { console.error(`apply_n1: anchor found ${n} times: ${a.slice(0, 60)}`); process.exit(3); } s = s.replace(a, b); };
const HELPER = `  // unit mxh N1: every name a parameter list binds — plain, defaulted, destructured (any depth), rest.
  const patternNames = (ps) => { const out = []; const go = (p) => { if (!p) return;
    if (p.type === "Identifier") out.push(p.name);
    else if (p.type === "AssignmentPattern") go(p.left);
    else if (p.type === "RestElement") go(p.argument);
    else if (p.type === "ArrayPattern") p.elements.forEach(go);
    else if (p.type === "ObjectPattern") p.properties.forEach((q) => go(q.type === "RestElement" ? q.argument : q.value)); };
    ps.forEach(go); return out; };
  const maskParams = (scope, ps) => { const sh = patternNames(ps).filter((nm) => scope.has(nm)); if (!sh.length) return scope; const m = new Map(scope); for (const nm of sh) m.delete(nm); return m; };
`;
rep("  const walkBody = (node, scope, ctx) => {\n    const visit = (n) => {\n      if (!n || typeof n.type !== \"string\") return;\n",
  HELPER + "  const walkBody = (node, scope, ctx) => {\n    const visit = (n) => {\n      if (!n || typeof n.type !== \"string\") return;\n" +
  (variant === "fixpoint-only" ? "" :
  `      // N1: a function's parameters SHADOW the enclosing binding of the same name (pass 1 descends here)
      if ((n.type === "FunctionDeclaration" || n.type === "FunctionExpression" || n.type === "ArrowFunctionExpression") && n.params.length) {
        const inner = maskParams(scope, n.params);
        if (inner !== scope) {
          n.params.forEach(visit);                              // defaults evaluate in the OUTER scope
          const prevCtx = CTX; if (n.id) CTX = n.id.name;
          walkBody(n.body, inner, ctx);
          CTX = prevCtx; return;
        }
      }
`));
if (variant !== "pass1-only") rep("      let combos = [new Map(env)];", "      let combos = [maskParams(new Map(env), fn.params)];");
writeFileSync(file, s);
console.log(`apply_n1: ${variant} applied to ${file}`);
