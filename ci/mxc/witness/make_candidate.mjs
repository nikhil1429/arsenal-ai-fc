#!/usr/bin/env node
// make_candidate.mjs — unit mxc: build the candidate xray.mjs from a base xray.mjs by exact string
// replacements (each anchor must occur EXACTLY once, else REFUSED). --flagged emits the measuring
// prototype (each rule guarded by MXC_RULES, a comma list; unset = all rules). Writes only --out.
// Usage: node make_candidate.mjs --base <xray.mjs> --out <file> [--flagged] [--only cwd,ctx,nest]
import { readFileSync, writeFileSync } from "node:fs";
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const flagged = process.argv.includes("--flagged");
const only = arg("--only") ? new Set(arg("--only").split(",")) : null;
const g = (rule, on, off) => flagged ? `(RULES.has("${rule}") ? (${on}) : (${off}))` : on;
export const EDITS = [
  { rule: "*", why: "isAbsolute joins the path imports (R-CWD)",
    from: `import { join, dirname, basename, resolve as pathResolve, relative } from "node:path";`,
    to: () => `import { join, dirname, basename, resolve as pathResolve, relative, isAbsolute, win32 } from "node:path";` + (flagged ? `\nconst RULES = new Set((process.env.MXC_RULES ?? "cwd,ctx,nest,mask").split(","));` : "") },
  { rule: "cwd", why: "R-CWD (a): join is a join, resolve folds only from an absolute anchor — never from the analysing machine's cwd",
    from: `          case "join":
          case "resolve":
          case "pathResolve":
            if (A.every(isC)) return C(slash(pathResolve(...A.map((a) => a.v))));
            return UNKNOWN;`,
    to: () => `          case "join":
          case "resolve":
          case "pathResolve": {
            // unit mxc R-CWD: a join JOINS (a relative part stays relative); a resolve folds only from its LAST absolute
            // anchor (POSIX or a drive letter, on any OS). Folding onto process.cwd() made the IR depend on where it ran.
            if (!A.every(isC)) return UNKNOWN;${flagged ? `
            if (!RULES.has("cwd")) return C(slash(pathResolve(...A.map((a) => a.v))));` : ""}
            const parts = A.map((a) => a.v);
            if (name === "join") return C(slash(join(...parts)));
            const at = parts.findLastIndex((v) => win32.isAbsolute(v));
            return at < 0 ? UNKNOWN : C(slash(join(...parts.slice(at))));
          }` },
  { rule: "cwd", why: "R-CWD (c): relRepo reports a relative path AS WRITTEN — relative() would resolve it against process.cwd()",
    from: `const relRepo = (abs) => {
  const r = slash(relative(ROOT, abs));`,
    to: () => `const relRepo = (abs) => {
  if (${g("cwd", "!isAbsolute(String(abs))", "false")}) return slash(abs);   // unit mxc R-CWD: never resolved against the analyser's cwd
  const r = slash(relative(ROOT, abs));` },
  { rule: "cwd", why: "R-CWD (b): an EMPTY path at a sink (\"\" or \".\") names no file: it is an unresolved site, never the analysing cwd",
    from: `  const addSink = (map, p, line, verb) => {
    noteResolved(line, verb);`,
    to: () => `  const addSink = (map, p, line, verb) => {
    if (${g("cwd", `/^(\\.[\\\\/]?)?$/.test(String(p))`, "false")}) return noteUnresolved(line, verb, "empty-path"); // unit mxc R-CWD: "" / "." is the RUNTIME cwd, not a file
    noteResolved(line, verb);` },
  { rule: "ctx", why: "R-ACTX: a const bound to an anonymous arrow / function expression names the ctx of its body",
    from: `      const fnName = (n.type === "FunctionDeclaration" || n.type === "FunctionExpression") && n.id ? n.id.name : null;`,
    to: () => `      const fnName = (n.type === "FunctionDeclaration" || n.type === "FunctionExpression") && n.id ? n.id.name
        // unit mxc R-ACTX: a MODULE-scope \`const selftest = () => { … }\` — the binding's name IS its body's ctx (it was
        // "module" in pass 1). Only from "module": a nested \`const gateStat = () => …\` inside selftest keeps selftest's ctx.
        : ${g("ctx", `CTX === "module" && n.type === "VariableDeclarator" && n.id && n.id.type === "Identifier" && n.init && !n.init.id && (n.init.type === "ArrowFunctionExpression" || n.init.type === "FunctionExpression")`, "false")} ? n.id.name : null;` },
  { rule: "nest", why: "R-NEST: a nested function's body is walked with its OWN locals collected over the ENCLOSING scope",
    from: `      if ((n.type === "FunctionDeclaration" || n.type === "FunctionExpression" || n.type === "ArrowFunctionExpression") && n.params.length) {
        const inner = maskParams(scope, n.params);
        if (inner !== scope) {
          n.params.forEach(visit);                              // defaults evaluate in the OUTER scope
          const prevCtx = CTX; if (n.id) CTX = n.id.name;
          walkBody(n.body, inner, ctx);
          CTX = prevCtx; return;
        }
      }`,
    to: () => `      if (n.type === "FunctionDeclaration" || n.type === "FunctionExpression" || n.type === "ArrowFunctionExpression") {
        const masked = n.params.length ? maskParams(scope, n.params) : scope;
        // unit mxc R-NEST: a block body's own declarations are collected over the scope it CLOSES over — the enclosing
        // function's bound parameters and locals — so \`const sidecar = path + ".x"\` inside a nested \`fail\` folds.
        const locals = ${g("nest", `n.body.type === "BlockStatement" && n.body.body.some((s) => s.type === "VariableDeclaration")`, "false")};
        if (masked !== scope || locals) {
          const inner = locals ? new Map(masked) : masked;
          if (locals) collectLocals(n.body.body, inner);
          n.params.forEach(visit);                              // defaults evaluate in the OUTER scope
          const prevCtx = CTX; if (n.id) CTX = n.id.name;
          walkBody(n.body, inner, ctx);
          CTX = prevCtx; return;
        }
      }` },
  { rule: "nest", why: "R-NEST: collectLocals — a nested body's VALUE bindings only (no verb taint, no dispatch table, no localFns entry); a binding it cannot fold MASKS the outer name",
    from: "  const walkBody = (node, scope, ctx) => {",
    to: () => [
      "  // unit mxc R-NEST: the VALUE bindings of a nested function body, folded over the scope it closes over. Unlike",
      "  // collectDecls it records no verb taint, no dispatch table and no localFns entry (those stay the module's), and a local",
      "  // it cannot fold DELETES the outer name, so a shadowing local never reads the enclosing binding of the same name.",
      "  const collectLocals = (body, scope) => {",
      "    for (const stmt of body) {",
      "      if (stmt.type !== \"VariableDeclaration\") continue;",
      "      for (const d of stmt.declarations) {",
      "        for (const nm of bound(d.id)) scope.delete(nm);",
      "        if (!d.init || d.id.type !== \"Identifier\") continue;",
      "        const t = d.init.type;",
      "        if (t === \"ObjectExpression\") {",
      "          for (const pr of d.init.properties) {",
      "            if (pr.type !== \"Property\" || pr.computed) continue;",
      "            const v = evalNode(pr.value, scope);",
      "            if (isC(v)) scope.set(d.id.name + \".\" + (pr.key.name || pr.key.value), v);",
      "          }",
      "        } else if (t === \"ArrayExpression\") {",
      "          const vals = d.init.elements.map((e) => evalNode(e, scope)).filter(isC);",
      "          if (vals.length) scope.set(d.id.name + \"[]\", vals);",
      "        } else if (t !== \"ArrowFunctionExpression\" && t !== \"FunctionExpression\") {",
      "          const v = evalNode(d.init, scope);",
      "          if (isC(v)) scope.set(d.id.name, v);",
      "        }",
      "      }",
      "    }",
      "  };",
      "  const walkBody = (node, scope, ctx) => {",
    ].join("\n") },
  { rule: "mask", why: "R-MASK: in the fixpoint, a function's own top-level declarations MASK the enclosing binding before they are collected (an unfoldable local never reads the module const of its name)",
    from: `      for (const scope of combos) {
        collectDecls(fn.body.type === "BlockStatement" ? fn.body.body : [], scope);`,
    to: () => [
      "      for (const scope of combos) {",
      "        // unit mxc R-MASK: the body's own declarations shadow the module's; collectDecls re-binds those it can fold",
      `        if (${g("mask", "fn.body.type === \"BlockStatement\"", "false")}) for (const st of fn.body.body) if (st.type === "VariableDeclaration") for (const d of st.declarations) for (const nm of bound(d.id)) scope.delete(nm);`,
      "        collectDecls(fn.body.type === \"BlockStatement\" ? fn.body.body : [], scope);",
    ].join("\n") },
];
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split(/[\\/]/).pop())) {
  let src = readFileSync(arg("--base"), "utf8");
  for (const e of EDITS) {
    if (only && e.rule !== "*" && !only.has(e.rule)) continue;
    const n = src.split(e.from).length - 1;
    if (n !== 1) { console.error(`make_candidate: REFUSED — anchor for "${e.why}" found ${n} times (must be exactly 1)`); process.exit(2); }
    src = src.replace(e.from, e.to());
  }
  writeFileSync(arg("--out"), src);
  console.log(`make_candidate: ${flagged ? "flagged prototype" : "candidate"} written (${EDITS.length} edits) -> ${arg("--out")}`);
}
