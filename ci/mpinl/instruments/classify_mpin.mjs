#!/usr/bin/env node
// ============================================================================
// ci/mpin/classify_mpin.mjs — UNIT mpin · forks row 1149 (2): a SPEC SEAT's MEASUREMENT, not a build.
//   Answers one spec question by code: "each of the 78 unresolved classified as the same shape or not,
//   by measurement" — and cross-checks the 39 counted own-literal pins with a second, independent method.
// ----------------------------------------------------------------------------
// USAGE: node ci/mpin/classify_mpin.mjs --org <tree> --census <census --json output> [--modules <dir>] [--json]
//   --census  the file written by `node ci/mcon/census_mcon.mjs --org <tree> --json` (mcon's tool, read here, never edited)
// CONTRACT — READ-ONLY. Reads *.mjs source under <org>; never dressing-room/. Writes nothing, starts no process,
//   binds no port, calls no model. Each subject is evaluated in a node:vm context whose ONLY file door is a
//   readFileSync that answers source files under <org>/scripts|hooks|ci (anything else throws), bounded by a vm timeout.
// ----------------------------------------------------------------------------
// THE METHOD (content, where mcon's census is position): for one pin `/re/.test(S)` / `S.includes(lit)` / `S.match(re)`,
//   1. the pin's subject expression S and every const it reads (latest binding before the pin, as the census does) are
//      re-emitted as a tiny program and EVALUATED on the real source text;
//   2. own   = S covers the pin's own literal — by POSITION when S is a verbatim slice of the file (the census's definition),
//              by CONTENT (S contains the literal's source text) only when S is transformed — and the matcher matches inside it
//              ⇒ the pin reads true whatever the code under test says: SAME SHAPE (own-literal);
//      R     = the pin run on S; Rlit = the pin run on S with every copy of its own literal text cut out;
//      Rass  = the pin run on S with the enclosing assert call's whole text cut out;
//      Rcode = the pin run on S with the whole TOP-LEVEL statement holding the pin (its selftest block) cut out — true ⇒ the
//              pinned text lives in code outside the test block (codeLine names the first such line): a narrowed subject
//              keeps an honest reading; false ⇒ only test text satisfies it;
//      codeFn  = the top-level declaration holding codeLineNC (a narrowing's anchor);
//      RcodeNC = Rcode with every COMMENT blanked too (codeLineNC): false while Rcode is true ⇒ only PROSE outside the test
//              block satisfies it, and a narrowing would trade a self-satisfied pin for a prose-satisfied one;
//   3. CLASS  same-shape     own (the census's shape, measured by content)
//             own-assert     !own ∧ R ∧ ¬Rass  (true only by text inside its own assert call — a sibling literal)
//             honest         R ∧ Rass          (the text it pins exists outside its own assert call)
//             reads-false    ¬R               (the pin is false on the evaluated subject — named, never guessed)
//             not-evaluable  the subject could not be evaluated (the error is printed) — NAMED, never counted
// LAST LINE: CLASSIFY MPIN · <n> site(s) · same-shape <a> · own-assert <b> · honest <c> · reads-false <d> · not-evaluable <e>
// ============================================================================
import { readFileSync, existsSync } from "node:fs";
import { join, resolve, dirname, basename, relative, sep } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import vm from "node:vm";

const argv = process.argv.slice(2);
const opt = (k) => { const i = argv.indexOf(k); return i >= 0 && argv[i + 1] ? argv[i + 1] : null; };
const ORG = opt("--org") ? resolve(opt("--org")) : null;
const CENSUS = opt("--census") ? resolve(opt("--census")) : null;
const JSON_OUT = argv.includes("--json");
if (!ORG || !CENSUS) { console.error("usage: node ci/mpin/classify_mpin.mjs --org <tree> --census <census.jsonl> [--modules <dir>] [--json]"); process.exit(1); }
const MODS = [ORG, opt("--modules") ? resolve(opt("--modules")) : null].filter(Boolean).find((d) => existsSync(join(d, "node_modules", "acorn", "package.json")));
if (!MODS) { console.log("CLASSIFY MPIN · NOT MEASURABLE — no acorn (npm ci, or --modules <dir>)"); process.exit(2); }
const req = createRequire(join(MODS, "package.json"));
const acorn = req("acorn");
const walk = req("acorn-walk");

const fold = (s) => s.replace(/\r\n/g, "\n");
const lineOf = (src, pos) => src.slice(0, pos).split("\n").length;
const rows = readFileSync(CENSUS, "utf8").split("\n").filter((l) => l.startsWith("{")).map((l) => JSON.parse(l));

const cache = new Map();
function load(rel) {
  if (cache.has(rel)) return cache.get(rel);
  const src = fold(readFileSync(join(ORG, rel), "utf8"));
  const comments = [];
  const ast = acorn.parse(src, { ecmaVersion: "latest", sourceType: "module", allowHashBang: true, allowAwaitOutsideFunction: true, allowReturnOutsideFunction: true, onComment: (_b, _t, s0, e0) => comments.push([s0, e0]) });
  // the same text with every comment blanked to spaces (offsets kept): a pin that only a COMMENT satisfies reads prose, not code
  let nc = src;
  for (const [s0, e0] of comments) nc = nc.slice(0, s0) + src.slice(s0, e0).replace(/[^\n]/g, " ") + nc.slice(e0);
  const binds = new Map(), fns = new Map();
  walk.full(ast, (n) => {
    if (n.type === "VariableDeclarator" && n.id.type === "Identifier" && n.init) {
      if (!binds.has(n.id.name)) binds.set(n.id.name, []);
      binds.get(n.id.name).push({ pos: n.start, init: n.init });
    }
    if (n.type === "FunctionDeclaration" && n.id) fns.set(n.id.name, n);
  });
  const pins = [];
  walk.fullAncestor(ast, (n, _s, anc) => {
    if (n.type !== "CallExpression" || n.callee.type !== "MemberExpression" || n.callee.computed) return;
    const m = n.callee.property.name;
    let lit = null, subject = null;
    if ((m === "test" || m === "exec") && n.callee.object.type === "Literal" && n.callee.object.regex) { lit = n.callee.object; subject = n.arguments[0]; }
    else if ((m === "includes" || m === "match") && n.arguments[0] && n.arguments[0].type === "Literal") { lit = n.arguments[0]; subject = n.callee.object; }
    if (!lit || !subject) return;
    const assertCall = [...anc].reverse().find((a) => a !== n && a.type === "CallExpression" && a.callee.type === "Identifier"
      && a.arguments[0] && (a.arguments[0].type === "TemplateLiteral" || (a.arguments[0].type === "Literal" && typeof a.arguments[0].value === "string")));
    pins.push({ n, m, lit, subject, assertCall, line: lineOf(src, lit.start), text: src.slice(lit.start, lit.end) });
  });
  const v = { src, nc, ast, binds, fns, pins };
  cache.set(rel, v);
  return v;
}

const GLOBALS = new Set(["JSON", "Math", "String", "Number", "Array", "Object", "RegExp", "Date", "Boolean", "undefined", "Infinity", "NaN", "Set", "Map", "parseInt", "parseFloat", "Error", "encodeURIComponent", "decodeURIComponent"]);
function freeIds(node) {
  const out = new Set(), local = new Set();
  // names bound INSIDE the expression (arrow / function params, inner consts) are not free
  walk.full(node, (x) => {
    if (/Function/.test(x.type)) for (const p of x.params || []) walk.full(p, (q) => { if (q.type === "Identifier") local.add(q.name); });
    if (x.type === "VariableDeclarator" && x.id.type === "Identifier") local.add(x.id.name);
  });
  walk.fullAncestor(node, (x, _s, anc) => {
    if (x.type !== "Identifier") return;
    const p = anc[anc.length - 2];
    if (p && p.type === "MemberExpression" && p.property === x && !p.computed) return;
    if (p && p.type === "Property" && p.key === x && !p.computed && !p.shorthand) return;
    if (!local.has(x.name)) out.add(x.name);
  });
  return out;
}

/** re-emit the subject with its const chain, so it can be evaluated on the real text */
function program(f, rel, pin) {
  const { src, binds, fns } = f;
  const lines = [], seen = new Set(), seenFn = new Set();
  const need = (node, pos, depth) => {
    if (depth > 12) throw new Error("binding chain deeper than 12");
    for (const id of freeIds(node)) {
      if (seen.has(id) || GLOBALS.has(id) || ["readFileSync", "existsSync", "join", "resolve", "dirname", "basename", "fileURLToPath", "pathToFileURL", "URL", "__dirname", "__filename", "process", "__IMU__", "fold"].includes(id)) continue;
      const l = (binds.get(id) || []).filter((b) => b.pos < pos);
      if (l.length) {
        seen.add(id);
        const init = l[l.length - 1].init;
        need(init, init.start, depth + 1);
        lines.push(`const ${id} = ${src.slice(init.start, init.end)};`);
      } else if (fns.has(id) && !seenFn.has(id)) {
        seenFn.add(id);
        const fn = fns.get(id);
        lines.unshift(src.slice(fn.start, fn.end));
      } else throw new Error(`unbound '${id}' (a parameter or an import — not evaluable from source alone)`);
    }
  };
  need(pin.subject, pin.n.start, 0);
  lines.push(`__out = (${src.slice(pin.subject.start, pin.subject.end)});`);
  return lines.join("\n").replace(/import\.meta\.url/g, "__IMU__").replace(/import\.meta\.dirname/g, "__dirname").replace(/import\.meta\.filename/g, "__filename");
}

function evalSubject(rel, code) {
  const abs = join(ORG, rel);
  const okRoot = ["scripts", "hooks", "ci"].map((d) => join(ORG, d) + sep);
  const rf = (p) => {
    const s = p instanceof URL ? fileURLToPath(p) : String(p);
    const a = resolve(s.startsWith("file:") ? fileURLToPath(s) : s);
    if (!okRoot.some((r) => a.startsWith(r)) || !/\.(mjs|js|cjs)$/.test(a)) throw new Error(`file door refused ${relative(ORG, a)}`);
    return fold(readFileSync(a, "utf8"));
  };
  const ctx = {
    readFileSync: rf, existsSync, join, resolve, dirname, basename, fileURLToPath, pathToFileURL, URL,
    __dirname: dirname(abs), __filename: abs, __IMU__: pathToFileURL(abs).href, fold,
    process: { argv: [process.execPath, abs], env: {}, platform: process.platform, cwd: () => ORG },
    __out: undefined,
  };
  vm.createContext(ctx);
  vm.runInContext(code, ctx, { timeout: 2000 });
  return ctx.__out;
}

function matcherOf(lit) {
  if (lit.regex) { const re = new RegExp(lit.regex.pattern, lit.regex.flags.replace(/[gy]/g, "")); return (t) => re.test(t); }
  const v = lit.value; return (t) => (Array.isArray(t) ? t.includes(v) : String(t).includes(v));
}

const out = [];
for (const r of rows) {
  if (r.kind !== "unresolved" && r.kind !== "own-literal" && r.kind !== "own-assert") continue;
  const [rel, ln] = [r.at.slice(0, r.at.lastIndexOf(":")), Number(r.at.slice(r.at.lastIndexOf(":") + 1))];
  const f = load(rel);
  const cands = f.pins.filter((p) => p.line === ln && p.text.slice(0, 120) === r.pin);
  const idx = out.filter((o) => o.at === r.at && o.pin === r.pin).length;   // the same pin twice on one line (forge_session:2398)
  const pin = cands[idx] || cands[0];
  const row = { at: r.at, census: r.kind, pin: r.pin, assert: r.assert };
  if (!pin) { out.push({ ...row, cls: "not-evaluable", why: "pin not re-found at that line" }); continue; }
  let S;
  try { S = evalSubject(rel, program(f, rel, pin)); }
  catch (e) { out.push({ ...row, cls: "not-evaluable", why: String(e && e.message || e).split("\n")[0].slice(0, 160) }); continue; }
  const test = matcherOf(pin.lit);
  const Sstr = Array.isArray(S) ? S.join("\n") : String(S);
  const cut = (s, piece) => (piece ? s.split(piece).join("") : s);
  // POSITION first (the census's own definition): when the subject is a verbatim slice of the file, own ⇔ its range covers
  // the pin's literal. Only a TRANSFORMED subject (filter / join / replace) falls back to CONTENT (it contains the literal's text).
  const at0 = Array.isArray(S) ? -1 : f.src.indexOf(Sstr);
  const method = at0 >= 0 && f.src.indexOf(Sstr, at0 + 1) < 0 ? "position" : "content";
  const own = (method === "position" ? at0 <= pin.lit.start && pin.lit.end <= at0 + Sstr.length : Sstr.includes(pin.text)) && test(pin.text);
  const R = Array.isArray(S) ? test(S) : test(Sstr);
  // the cuts are POSITIONAL when the subject is a verbatim slice (only THIS copy of the literal / THIS assert call is removed),
  // and by content otherwise
  const blank = (s0, e0) => { const x = Math.max(at0, s0), y = Math.min(at0 + Sstr.length, e0); return y > x ? Sstr.slice(0, x - at0) + Sstr.slice(y - at0) : Sstr; };
  const assertText = pin.assertCall ? f.src.slice(pin.assertCall.start, pin.assertCall.end) : null;
  const Rlit = method === "position" ? test(blank(pin.lit.start, pin.lit.end)) : test(cut(Sstr, pin.text));
  const Rass = !pin.assertCall ? Rlit : method === "position" ? test(blank(pin.assertCall.start, pin.assertCall.end)) : test(cut(Sstr, assertText));
  // Rcode — the pin on its subject with the WHOLE top-level statement that holds the pin cut out (the selftest block):
  // true ⇒ the pinned text lives in code outside the test block, so a NARROWED subject keeps an honest reading; codeLine names it.
  const stmt = f.ast.body.find((b) => b.start <= pin.n.start && pin.n.end <= b.end);
  let Rcode = null, codeLine = null, RcodeNC = null, codeLineNC = null;
  if (stmt && !Array.isArray(S)) {
    const a = f.src.indexOf(Sstr);
    if (a >= 0) {
      const b = a + Sstr.length;
      const parts = [[a, Math.max(a, Math.min(b, stmt.start))], [Math.min(b, Math.max(a, stmt.end)), b]];
      Rcode = parts.some(([x, y]) => y > x && test(f.src.slice(x, y)));
      for (const [x, y] of parts) {
        if (codeLine || y <= x) continue;
        const seg = f.src.slice(x, y);
        const lit = pin.lit;
        let pos = -1;
        if (lit.regex) { const m = new RegExp(lit.regex.pattern, lit.regex.flags.replace(/[gy]/g, "")).exec(seg); pos = m ? m.index : -1; } else pos = seg.indexOf(lit.value);
        if (pos >= 0) codeLine = lineOf(f.src, x + pos);
      }
      RcodeNC = parts.some(([x, y]) => y > x && test(f.nc.slice(x, y)));
      for (const [x, y] of parts) {
        if (codeLineNC || y <= x) continue;
        const seg = f.nc.slice(x, y);
        const lit = pin.lit;
        let pos = -1;
        if (lit.regex) { const m = new RegExp(lit.regex.pattern, lit.regex.flags.replace(/[gy]/g, "")).exec(seg); pos = m ? m.index : -1; } else pos = seg.indexOf(lit.value);
        if (pos >= 0) codeLineNC = lineOf(f.src, x + pos);
      }
    } else Rcode = test(cut(Sstr, f.src.slice(stmt.start, stmt.end)));
  }
  const block = stmt ? `${lineOf(f.src, stmt.start)}-${lineOf(f.src, stmt.end)}` : null;
  // codeFn — the top-level declaration that holds codeLineNC (what a narrowed subject would be anchored on)
  let codeFn = null;
  if (codeLineNC) {
    const off = f.src.split("\n").slice(0, codeLineNC - 1).join("\n").length + 1;
    const d = f.ast.body.find((b) => b.start <= off && off < b.end);
    const decl = d && (d.type === "ExportNamedDeclaration" || d.type === "ExportDefaultDeclaration") && d.declaration ? d.declaration : d;
    codeFn = !decl ? null : decl.id && decl.id.name ? `${decl.type === "FunctionDeclaration" ? "function " : ""}${decl.id.name}`
      : decl.type === "VariableDeclaration" ? `const ${decl.declarations.map((x) => x.id && x.id.name).join(",")}`
      : `${decl.type} @${lineOf(f.src, decl.start)}-${lineOf(f.src, decl.end)}`;
  }
  const cls = own ? "same-shape" : !R ? "reads-false" : !Rass ? "own-assert" : "honest";
  out.push({ ...row, cls, method, subject_chars: Sstr.length, subject_kind: Array.isArray(S) ? "array" : typeof S, own, R, Rlit, Rass, Rcode, codeLine, RcodeNC, codeLineNC, codeFn, block });
}

if (JSON_OUT) for (const o of out) console.log(JSON.stringify(o));
else for (const o of out) console.log(`  ${o.at}  [census ${o.census}] → ${o.cls}${o.why ? `  (${o.why})` : `  subject ${o.subject_kind} ${o.subject_chars} chars by ${o.method} · own ${o.own} · R ${o.R} · Rlit ${o.Rlit} · Rass ${o.Rass} · Rcode ${o.Rcode}${o.codeLine ? ` @${o.codeLine}` : ""} · RcodeNC ${o.RcodeNC}${o.codeLineNC ? ` @${o.codeLineNC} in ${o.codeFn}` : ""} · block ${o.block}`}  ${o.pin.slice(0, 70)}`);
const c = (k) => out.filter((o) => o.cls === k).length;
console.log(`CLASSIFY MPIN · ${out.length} site(s) · same-shape ${c("same-shape")} · own-assert ${c("own-assert")} · honest ${c("honest")} · reads-false ${c("reads-false")} · not-evaluable ${c("not-evaluable")}`);
