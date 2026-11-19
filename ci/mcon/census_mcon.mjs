#!/usr/bin/env node
// ============================================================================
// ci/mcon/census_mcon.mjs — UNIT mcon · forks row 1132 (3): the spec question, answered by census —
//   "how many selftest asserts in the repo are satisfied by their own literal".
// ----------------------------------------------------------------------------
// USAGE: node ci/mcon/census_mcon.mjs --org <dir> [--modules <dir>] [--json]
//   --org      the tree to census (read-only). acorn is loaded from <org>/node_modules (npm ci), else from <modules>/node_modules;
//              neither ⇒ NOT MEASURABLE, exit 2.
//   --json  print every hit as one JSON row instead of the text list
// CONTRACT — READ-ONLY. It reads only *.mjs / *.js source files (never dressing-room/, never .git / node_modules),
//   writes nothing, starts no process, binds no port, calls no model. Text is read with \r\n folded to \n.
// ----------------------------------------------------------------------------
// THE SHAPE, DEFINED BY CODE (selfSatisfied below is the definition; this paragraph only reads it):
//   A PIN is a POSITIVE text check inside a file's own code — `/re/.test(S)`, `S.includes("lit")`, `S.match(/re/)`,
//   `/re/.exec(S)` — that is not directly under a `!`. Its SUBJECT S is SELF-SOURCE when it is the file's OWN text:
//   `readFileSync(<self>)` where <self> is fileURLToPath(import.meta.url) / new URL(import.meta.url) / __filename /
//   process.argv[1] / a path call whose last string literal is the file's own basename — directly, or through a const
//   bound to it, or a `.slice(a, b)` of it whose bounds are `.indexOf("lit"[, n])` / `.lastIndexOf("lit")` / numbers
//   (evaluated on the real text, so the subject is an exact character RANGE of the file).
//   A pin is SATISFIED BY ITS OWN LITERAL when its subject's range COVERS the pin's own literal (the regex or the
//   string) and the pin MATCHES INSIDE THAT LITERAL'S OWN SOURCE TEXT: the check then reads true whatever the code
//   under test says, because the test's own text is in the haystack. That is the census count ("own literal").
//   Listed beside it, counted apart: "own assert" — the match lies inside the enclosing assert call (its label, a
//   sibling literal) but not in the pin's own literal; and UNRESOLVED — a pin on a self-source subject whose range
//   this code cannot evaluate (a derivation other than slice/indexOf), NAMED, never counted.
//   An ASSERT is the innermost enclosing call whose callee is a bare identifier and whose first argument is a string
//   or template literal (its label) — ok(…), assert(…), check(…), …; a pin outside any such call is still a pin.
// LAST LINE: CENSUS MCON · <n> own-literal pin(s) in <a> assert(s) · <m> own-assert · <u> unresolved · <f> file(s) walked
// ============================================================================
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, resolve, relative, sep, basename } from "node:path";
import { createRequire } from "node:module";

const argv = process.argv.slice(2);
const opt = (k) => { const i = argv.indexOf(k); return i >= 0 && argv[i + 1] ? argv[i + 1] : null; };
const ORG = opt("--org") ? resolve(opt("--org")) : null;
const JSON_OUT = argv.includes("--json");
if (!ORG) { console.error("usage: node ci/mcon/census_mcon.mjs --org <dir> [--json]"); process.exit(1); }
const MODS = [ORG, opt("--modules") ? resolve(opt("--modules")) : null].filter(Boolean).find((d) => existsSync(join(d, "node_modules", "acorn", "package.json")) && existsSync(join(d, "node_modules", "acorn-walk", "package.json")));
if (!MODS) { console.log("CENSUS MCON · NOT MEASURABLE — no acorn under <org>/node_modules or <modules>/node_modules (run npm ci)"); process.exit(2); }
const req = createRequire(join(MODS, "package.json"));
const acorn = req("acorn");
const walk = req("acorn-walk");

const SKIP_DIRS = new Set([".git", "node_modules", "dressing-room"]);
function files(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    let st; try { st = statSync(p); } catch { continue; }
    if (st.isDirectory()) { if (!SKIP_DIRS.has(name)) files(p, out); }
    else if (/\.(mjs|js)$/.test(name)) out.push(p);
  }
  return out;
}

const fold = (s) => s.replace(/\r\n/g, "\n");
const lineOf = (src, pos) => src.slice(0, pos).split("\n").length;

/** is this expression a path to the file's own source? */
function isSelfPath(node, own, selfIds) {
  if (!node) return false;
  if (node.type === "Identifier") return node.name === "__filename" || selfIds.has(node.name);
  if (node.type === "MetaProperty") return true;                                       // import.meta
  if (node.type === "MemberExpression") {
    if (node.object && node.object.type === "MetaProperty") return true;                // import.meta.url
    // process.argv[1]
    if (node.object && node.object.type === "MemberExpression" && node.object.object && node.object.object.name === "process" && node.object.property && node.object.property.name === "argv" && node.property && node.property.value === 1) return true;
    return false;
  }
  if (node.type === "CallExpression" || node.type === "NewExpression") {
    const args = node.arguments || [];
    // fileURLToPath(import.meta.url) / new URL(import.meta.url)
    if (args.length && isSelfPath(args[0], own, selfIds) && (node.callee.name === "fileURLToPath" || node.callee.name === "URL")) return true;
    // join(..., "own.mjs") / resolve(..., "own.mjs") — the last string literal names the file itself
    const lits = args.filter((a) => a.type === "Literal" && typeof a.value === "string");
    const last = lits.length ? lits[lits.length - 1].value : null;
    if (last && basename(last) === own && args[args.length - 1].type === "Literal") return true;
    return false;
  }
  return false;
}
const isReadFile = (n) => n && n.type === "CallExpression" && ((n.callee.type === "Identifier" && n.callee.name === "readFileSync") || (n.callee.type === "MemberExpression" && n.callee.property.name === "readFileSync"));

/** census of ONE file: every positive pin on a self-source subject */
export function censusFile(path, rel) {
  const src = fold(readFileSync(path, "utf8"));
  let ast;
  try { ast = acorn.parse(src, { ecmaVersion: "latest", sourceType: "module", allowHashBang: true, allowAwaitOutsideFunction: true, allowReturnOutsideFunction: true }); }
  catch { return { parsed: false, pins: [] }; }
  const own = basename(path);
  // pass 1: const/let/var bindings, in source order (name → [{pos, init}])
  const binds = new Map();
  walk.full(ast, (n) => {
    if (n.type === "VariableDeclarator" && n.id.type === "Identifier" && n.init) {
      if (!binds.has(n.id.name)) binds.set(n.id.name, []);
      binds.get(n.id.name).push({ pos: n.start, init: n.init });
    }
  });
  const selfIds = new Set();
  for (const [name, list] of binds) if (list.every((b) => isSelfPath(b.init, own, selfIds))) selfIds.add(name);
  const bindingAt = (name, pos) => { const l = (binds.get(name) || []).filter((b) => b.pos < pos); return l.length ? l[l.length - 1].init : null; };

  // RANGE of a subject expression over src: [a, b) for self-source; "unresolved" for a self-derived we cannot evaluate; null for not-self
  function range(node, pos, depth = 0) {
    if (!node || depth > 8) return null;
    if (node.type === "ChainExpression") return range(node.expression, pos, depth + 1);
    if (isReadFile(node)) return isSelfPath(node.arguments[0], own, selfIds) ? [0, src.length] : null;
    if (node.type === "Identifier") { const init = bindingAt(node.name, pos); return init ? range(init, init.start, depth + 1) : null; }
    if (node.type === "CallExpression" && node.callee.type === "MemberExpression") {
      const base = range(node.callee.object, pos, depth + 1);
      if (!base) return null;
      if (base === "unresolved") return "unresolved";
      const m = node.callee.property.name;
      if (m === "slice" || m === "substring") {
        const text = src.slice(base[0], base[1]);
        const ev = (a) => {
          if (!a) return null;
          if (a.type === "Literal" && typeof a.value === "number") return a.value;
          if (a.type === "UnaryExpression" && a.operator === "-" && a.argument.type === "Literal") return -a.argument.value;
          if (a.type === "BinaryExpression" && (a.operator === "+" || a.operator === "-")) { const l = ev(a.left), r = ev(a.right); return l == null || r == null ? null : a.operator === "+" ? l + r : l - r; }
          if (a.type === "CallExpression" && a.callee.type === "MemberExpression" && ["indexOf", "lastIndexOf"].includes(a.callee.property.name)) {
            const on = range(a.callee.object, pos, depth + 1);
            if (!on || on === "unresolved" || on[0] !== base[0] || on[1] !== base[1]) return null;
            const [lit, from] = a.arguments;
            if (!lit || lit.type !== "Literal" || typeof lit.value !== "string") return null;
            const f = from ? ev(from) : undefined;
            if (from && f == null) return null;
            return a.callee.property.name === "indexOf" ? text.indexOf(lit.value, f) : text.lastIndexOf(lit.value, f);
          }
          return null;
        };
        const args = node.arguments;
        let a = args[0] ? ev(args[0]) : 0, b = args[1] ? ev(args[1]) : text.length;
        if (a == null || b == null) return "unresolved";
        const L = text.length;
        const norm = (x) => (x < 0 ? Math.max(0, L + x) : Math.min(x, L));
        a = norm(a); b = norm(b);
        if (m === "substring" && a > b) [a, b] = [b, a];
        if (b < a) b = a;
        return [base[0] + a, base[0] + b];
      }
      if (["replace", "replaceAll", "split", "match", "toLowerCase", "toUpperCase", "trim", "join", "normalize", "slice"].includes(m)) return "unresolved";
      return "unresolved";
    }
    if (node.type === "MemberExpression") { const base = range(node.object, pos, depth + 1); return base ? "unresolved" : null; }
    if (node.type === "BinaryExpression" && node.operator === "+") { const l = range(node.left, pos, depth + 1), r = range(node.right, pos, depth + 1); return l || r ? "unresolved" : null; }
    if (node.type === "TemplateLiteral") { return node.expressions.some((e) => range(e, pos, depth + 1)) ? "unresolved" : null; }
    if (node.type === "LogicalExpression" || node.type === "ConditionalExpression") {
      const parts = node.type === "LogicalExpression" ? [node.left, node.right] : [node.consequent, node.alternate];
      return parts.some((p) => range(p, pos, depth + 1)) ? "unresolved" : null;
    }
    return null;
  }

  // pass 2: pins, with their ancestors (for the `!` test and the enclosing assert)
  const pins = [];
  walk.fullAncestor(ast, (n, _st, anc) => {
    if (n.type !== "CallExpression" || n.callee.type !== "MemberExpression" || n.callee.computed) return;
    const m = n.callee.property.name;
    let lit = null, subject = null, matcher = null;
    if ((m === "test" || m === "exec") && n.callee.object.type === "Literal" && n.callee.object.regex) {
      lit = n.callee.object; subject = n.arguments[0];
      matcher = new RegExp(lit.regex.pattern, lit.regex.flags.replace(/[gy]/g, ""));
    } else if ((m === "includes" || m === "match") && n.arguments[0] && n.arguments[0].type === "Literal") {
      lit = n.arguments[0]; subject = n.callee.object;
      if (lit.regex) matcher = new RegExp(lit.regex.pattern, lit.regex.flags.replace(/[gy]/g, ""));
      else if (typeof lit.value === "string") { const v = lit.value; matcher = { test: (t) => t.includes(v) }; }
    }
    if (!lit || !subject || !matcher) return;
    const parent = anc[anc.length - 2];
    if (parent && parent.type === "UnaryExpression" && parent.operator === "!") return;   // a NEGATIVE pin — not this census
    // `.match(…)[0]` / `.exec(…).index` USE the result as a value: a derivation, not a boolean pin
    if ((m === "match" || m === "exec") && parent && (parent.type === "MemberExpression" || (parent.type === "ChainExpression"))) return;
    const r = range(subject, n.start);
    if (!r) return;
    const assertCall = [...anc].reverse().find((a) => a !== n && a.type === "CallExpression" && a.callee.type === "Identifier"
      && a.arguments[0] && (a.arguments[0].type === "TemplateLiteral" || (a.arguments[0].type === "Literal" && typeof a.arguments[0].value === "string")));
    const at = `${rel}:${lineOf(src, lit.start)}`;
    const pinText = src.slice(lit.start, lit.end);
    const label = assertCall ? (assertCall.arguments[0].type === "Literal" ? assertCall.arguments[0].value : src.slice(assertCall.arguments[0].start + 1, assertCall.arguments[0].end - 1)) : null;
    const row = { at, pin: pinText.slice(0, 120), assert: assertCall ? `${assertCall.callee.name}(…) @ ${rel}:${lineOf(src, assertCall.start)}` : null, label: label ? label.slice(0, 120) : null };
    if (r === "unresolved") { pins.push({ ...row, kind: "unresolved" }); return; }
    const [a, b] = r;
    const within = (s, e) => a <= s && e <= b;
    if (selfSatisfied(matcher, src, lit.start, lit.end, a, b)) { pins.push({ ...row, kind: "own-literal", range: `${rel}:${lineOf(src, a)}-${lineOf(src, b)}` }); return; }
    if (assertCall && within(assertCall.start, assertCall.end) === false) {
      // the assert call partly inside the subject: test the covered part of the call
      const s = Math.max(a, assertCall.start), e = Math.min(b, assertCall.end);
      if (s < e && matcher.test(src.slice(s, e))) pins.push({ ...row, kind: "own-assert", range: `${rel}:${lineOf(src, a)}-${lineOf(src, b)}` });
      return;
    }
    if (assertCall && matcher.test(src.slice(assertCall.start, assertCall.end))) pins.push({ ...row, kind: "own-assert", range: `${rel}:${lineOf(src, a)}-${lineOf(src, b)}` });
  });
  return { parsed: true, pins };
}

// THE DEFINITION: the subject range [a, b) covers the pin's own literal [s, e), and the pin matches inside that literal's text.
export function selfSatisfied(matcher, src, s, e, a, b) {
  return a <= s && e <= b && matcher.test(src.slice(s, e));
}

const all = files(ORG).sort();
const hits = [];
let walked = 0, unparsed = [];
for (const p of all) {
  const rel = relative(ORG, p).split(sep).join("/");
  const r = censusFile(p, rel);
  walked++;
  if (!r.parsed) { unparsed.push(rel); continue; }
  hits.push(...r.pins);
}
const by = (k) => hits.filter((h) => h.kind === k);
const own = by("own-literal"), ownAssert = by("own-assert"), unres = by("unresolved");
const asserts = new Set(own.map((h) => h.assert || h.at));
if (JSON_OUT) for (const h of hits) console.log(JSON.stringify(h));
else {
  for (const [title, list] of [["OWN LITERAL (counted)", own], ["OWN ASSERT (listed, counted apart)", ownAssert], ["UNRESOLVED (named, not counted)", unres]]) {
    console.log(`== ${title}`);
    for (const h of list) console.log(`  ${h.at}  ${h.pin}${h.assert ? `  in ${h.assert}` : "  (no enclosing assert)"}${h.range ? `  subject ${h.range}` : ""}`);
  }
  if (unparsed.length) console.log(`== NOT PARSED (named): ${unparsed.join(", ")}`);
}
console.log(`CENSUS MCON · ${own.length} own-literal pin(s) in ${asserts.size} assert(s) · ${ownAssert.length} own-assert · ${unres.length} unresolved · ${walked} file(s) walked`);
