#!/usr/bin/env node
// ============================================================================
// xray.mjs · ARSENAL AI FC — STATIC TRUTH, AS ONE IR (12 Aug 2026)
//   SOLE WRITER of dressing-room/state/xray_graph.json
//   NARROWED-BY-ADDITION 20 Aug 2026 (AUDIT §10-C rung S3): the SYNTACTIC half of the
//   owners-only law — a write call whose argument tree names the state dir — is now
//   `laws/owners-only-state-write.yml`, judged by scripts/lawpack.mjs. It sees write SITES;
//   it cannot see through a variable. Everything it cannot resolve is handed HERE, because
//   resolving `join(STATE_DIR, x)` into a real path is exactly what this IR is for, and Q2
//   and Q5 remain the law's mechanical check. Neither replaces the other, and an IR gap is
//   itself a finding (rung S6's witness rule).
// ----------------------------------------------------------------------------
// WHY AN IR AND NOT SIX ANALYSES. Every bug class this repo actually suffers is
// a QUERY over the same two facts: who reads a file, and who calls a verb. Build
// those once, correctly, and "dead read", "two writers", "orphan lane", "ghost
// state", "doc drift" and "half-built feature" stop being six bespoke greps that
// each rot on their own schedule and become five lines of set arithmetic.
//
// WHY NOT GREP — THIS IS NOT A STYLE PREFERENCE, IT IS A CORRECTNESS BUG.
// Three files in this repo contain literal NUL bytes, DELIBERATELY (composite
// map keys, `${a}\u0000${b}`): calibration.mjs · dmn.mjs · rejirah.mjs. `grep -rn`
// prints "Binary file … matches" and DROPS THE LINES. So every verification
// recipe written in prose, and any doc-claim checker built on grep, is SILENTLY
// BLIND on 3 of 76 organs and reports false GREEN. An AST cannot be blinded that
// way. This file therefore ASSERTS it parsed all 76 and fails loudly on a skip.
//
// ── (a) POINTS-TO, over the file-path domain ────────────────────────────────
// Abstract domain { Const(string) | Unknown }. Transfer functions: Literal →
// Const · Identifier → env · join/resolve → Const if all parts Const ·
// TemplateLiteral → Const if all parts Const · `p + ".tmp"` → Const(concat) ·
// `process.env.X || e` → e (the default is the real value on his machine).
//
// THE INTERPROCEDURAL STEP THAT CANNOT BE SKIPPED. ~115 readFileSync(p) and ~65
// writeFileSync(tmp,…) take the path as a PARAMETER. So the analysis binds
// arguments into parameter slots and iterates to fixpoint. Without it the answer
// is not "less precise", it is EMPTY.
//
// ⚠ THE ONE MODELING RULE THAT DECIDES IF THIS WORKS AT ALL:
//     writeAtomic(p,o){ const tmp=p+".tmp"; writeFileSync(tmp,…); renameSync(tmp,p) }
// 20+ organs each clone their own writeAtomic. A naive "who calls writeFileSync"
// therefore concludes EVERY state file has ZERO writers — a false result this
// audit reproduced by hand before writing this line. renameSync(src,dst) is
// modelled as WRITE(dst) + KILL(src), and `*.tmp` is canonicalised out of the
// domain. This single rule is the difference between a useful organ and 150
// false positives.
//
// UNSOUNDNESS IS A BUDGET, NOT A SECRET. Nothing is ever reported on `Unknown`.
// Instead `unresolved_sinks` is a COUNT in the IR, and the suite asserts it is
// NON-INCREASING — which converts the analysis's blind spot from a silent gap
// into a visible, monotone budget that can only get better.
//
// ── (b) SWALLOWED EXCEPTIONS ────────────────────────────────────────────────
// 884 catch sites exist, 488 completely empty — and a swallow is WHY the two
// dead wires of 12 Aug survived (a read of `rejirah_state.json`, a file nothing
// writes, failed silently forever). But the 1-statement `try{JSON.parse(read())}
// catch{}` is the INTENDED idiom here, so reporting all 488 is noise. Reported
// only: swallow ∧ contains_fs_sink ∧ try_stmts > 3 — a long try that swallows is
// where a whole feature dies quietly.
//
// ── (c) TWO-LAYER CALL GRAPH ────────────────────────────────────────────────
// Layer A intra-module. Layer B INTER-PROCESS — execFileSync(process.execPath,
// ["scripts/x.mjs","verb"]) is how this organism actually composes, so a call
// graph that stops at the module boundary sees 76 disconnected islands. Root
// sets include setup/INSTALL_TASKS.ps1 (the schtasks rota), .claude/skills/* and
// the .claude/settings.json hooks — without those, every scheduled-only organ
// reads as dead code.
//
// LAWS: READ-ONLY on everything except its own xray_graph.json · never reports on
//   Unknown · never "harmonises" a documented deliberate exception (brain_ledger
//   .jsonl is a SHARED APPEND LANE by design and this repo nearly had it
//   "repaired" once already).
// WHO ELSE COULD ACT ON THIS OUTPUT? mutagen.mjs (picks which files to mutate
//   from the reader sets), blackbox.mjs (reconciles its runtime edges against
//   this static graph), audit.mjs (runs the queries), herd.mjs (needs the
//   schedule roots). All four wired.
// CLI: node scripts/xray.mjs [build|report|q|verbs|swallow|selftest]
// ============================================================================
import { readFileSync, writeFileSync, readdirSync, existsSync, renameSync, mkdirSync, statSync } from "node:fs";
import { join, dirname, basename, resolve as pathResolve, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parse } from "acorn";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const STATE_DIR = join(ROOT, "dressing-room", "state");
// The repo walk descends into everything EXCEPT the VCS tree. node_modules was skipped in the
// first draft of F-01 and it left exactly one residual — `node_modules/ts-fsrs/package.json`
// still drawn as a ghost read on a page whose whole claim is "this file was never born". A
// skip list is a predicate assuming a shape (SHAPE 7), and the honest predicate here is
// existence. Measured cost of not skipping: 6,169 files, 154 ms.
const SKIP_WALK = /^\.git$/;
const OUT = join(STATE_DIR, "xray_graph.json");

// ── path helpers ─────────────────────────────────────────────────────────────
const slash = (p) => String(p).replace(/\\/g, "/");
// `relative(ROOT, ROOT)` is the EMPTY STRING, and the old fallback then emitted
// the ABSOLUTE path — so the committed IR carried `C:/Users/<name>/GitHub/...`
// into a PUBLIC repo. Not a secret, but a machine-specific path baked into a
// shared artefact is exactly the kind of thing that rots on the next machine.
const relRepo = (abs) => {
  const r = slash(relative(ROOT, abs));
  if (r === "") return ".";
  return r.startsWith("..") ? slash(abs) : r;
};
// *.tmp is an implementation detail of writeAtomic, never a lane of its own.
const canon = (p) => slash(p).replace(/\.tmp$/i, "");

// ── the abstract domain ──────────────────────────────────────────────────────
const UNKNOWN = { k: "u" };
const C = (v) => ({ k: "c", v: String(v) });
const isC = (a) => a && a.k === "c";

// ============================================================================
// PER-FILE ANALYSIS
// ============================================================================
function analyzeFile(absPath, src) {
  const ast = parse(src, { ecmaVersion: 2023, sourceType: "module", locations: true, allowHashBang: true });
  const selfDir = slash(dirname(absPath));
  const selfFile = slash(absPath);

  const reads = new Map();      // canonPath -> [{line, verb}]
  const writes = new Map();
  const spawns = [];            // inter-process edges
  const swallows = [];
  const localFns = new Map();   // name -> {params:[], body}
  const moduleObjects = new Map(); // name -> [keys]  (for `MODES[mode]` dispatch)
  const dispatchTableKeys = new Set(); // keys of shape-recognised dispatch tables
  const exportedNames = new Set();
  // ⚠ UNRESOLVED SINKS ARE COUNTED AS DISTINCT SITES, NOT AS VISITS (15 Aug 2026).
  // This was a bare `let unresolved = 0` incremented on every Unknown path argument
  // the walker met — and the walker meets each one MANY times, because the
  // interprocedural fixpoint below re-analyses every local function once per known
  // parameter-value combination, for up to five iterations. So the number was
  // "unresolved sink VISITS", and it moved whenever the fixpoint ran one more
  // iteration, which ANY new code can cause without adding a single unanalysable
  // line.
  //
  // MEASURED the day this was fixed: ~600 lines of new code in dugout.mjs took the
  // count 964 → 998 (+34) while the DISTINCT sites went 71 → 72. One real
  // regression, thirty-four phantom ones — and the per-organ ratchet in the selftest
  // fails on exactly this number, so it was about to red on noise and teach the next
  // session to "fix" code that was already perfectly legible. The same effect would
  // have fired on any commit that added a `deps = {}` entry point anywhere.
  //
  // A budget that moves when you add an unrelated function is not a budget. The set
  // below keys on line + verb + kind, which is exactly one entry per PLACE in the
  // source the analyser could not follow — the thing this file's header has always
  // promised ("UNSOUNDNESS IS A BUDGET, NOT A SECRET"). Every baseline number in the
  // committed IR therefore changes once, in the commit that made this true.
  // A SITE THAT IS EVER RESOLVED IS NOT AN UNRESOLVED SITE. This half is not
  // pedantry — it is most of the number. The fixpoint's FIRST walk runs before any
  // parameter has a value, so `function readIt(p) { readFileSync(p) }` is Unknown on
  // that pass and constant on every pass after it; counting the first walk reports
  // the house dependency-injection idiom as a blind spot in every organ that uses
  // it, which is all of them. The budget is places the analyser could NEVER follow.
  const unresolvedSites = new Set();
  const resolvedSites = new Set();
  const noteUnresolved = (line, verb, kind) => unresolvedSites.add(`${line}|${verb}|${kind}`);
  const noteResolved = (line, verb) => resolvedSites.add(`${line}|${verb}`);
  const trulyUnresolved = () => [...unresolvedSites].filter((s) => !resolvedSites.has(s.split("|").slice(0, 2).join("|"))).length;
  const argvVerbs = new Set();
  // WHICH IDENTIFIERS CARRY THE CLI VERB. This started as a hardcoded name list
  // (mode/cmd/verb/sub/action) and that was wrong in a way that MANUFACTURED
  // BUGS: brain.mjs's `tick`, widget.mjs's `list` and learnstate.mjs's `brief`
  // all went unseen, so the verb graph reported the live schedule invoking verbs
  // that "do not exist" — 29 BROKEN EDGEs, most of them the detector's fault, not
  // the repo's. It is now a TAINT SET: any binding whose initialiser mentions
  // process.argv is tainted, including array destructuring
  // (`const [cmd,...rest] = process.argv.slice(2)`), and the `|| "default"` arm
  // of the dispatch line is itself a verb.
  // ⚠ NOTHING IS PRE-SEEDED HERE, AND THAT MATTERS. This set started as the
  // guessed names {mode, cmd, verb, sub, action}, and the guess `action` was
  // actively harmful: captains_call.mjs dispatches CARD ACTIONS as
  // `action.kind === "at-source"`, so every dispatch KIND was harvested as a CLI
  // verb. The auto-fixer was one dry-run away from writing `at-source`,
  // `restart-dispatch`, `gem.sync_due` and `RED` into 31 organ headers as if they
  // were commands. A taint set must be EARNED from process.argv, never assumed
  // from a variable's name.
  const argvTainted = new Set();
  const noteArgvTaint = (d) => {
    if (!d.init) return;
    const text = src.slice(d.init.start, d.init.end);
    if (!/process\.argv/.test(text)) {
      // Second hop: `const mode = String(cmd || "list").toLowerCase()` where cmd
      // is already tainted. Bounded to a SHORT expression on purpose — an
      // unbounded "does any tainted name appear anywhere in this initialiser"
      // rule spreads taint through whole objects and harvests unrelated string
      // literals as verbs.
      if (text.length > 90) return;
      const ids = [...text.matchAll(/\b([A-Za-z_$][\w$]*)\b/g)].map((m) => m[1]);
      if (!ids.some((i) => argvTainted.has(i))) return;
    }
    const names = d.id.type === "Identifier" ? [d.id.name]
      : d.id.type === "ArrayPattern" ? d.id.elements.filter((e) => e && e.type === "Identifier").map((e) => e.name)
        : [];
    for (const n of names) argvTainted.add(n);
    // The default arm IS a verb: `(process.argv[2] || "tick")`.
    //
    // ⚠ BUT NOT INSIDE A FUNCTION-VALUED DECLARATION, AND NOT INSIDE A COMMENT.
    // `const noteArgvTaint = (d) => { … }` has an init span covering the WHOLE
    // arrow body, comments included — so this very function's own explanatory
    // comments (which quote `|| "list"` and `|| "tick"` as examples) were
    // harvested as xray's CLI verbs, and the auto-fixer then wrote `list|tick`
    // into xray's own header. A parser reading its own documentation as code is
    // the purest form of the rot this audit exists to remove.
    if (d.init.type === "ArrowFunctionExpression" || d.init.type === "FunctionExpression") return;
    const code = text.replace(/\/\/[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
    for (const m of code.matchAll(/\|\|\s*"([a-z][a-z0-9\-]*)"/g)) argvVerbs.add(m[1]);
    for (const m of code.matchAll(/\|\|\s*'([a-z][a-z0-9\-]*)'/g)) argvVerbs.add(m[1]);
  };

  // ctx = the enclosing function name. It is carried because a sink reached ONLY
  // from a `selftest` body is a FIXTURE, not a lane — this repo deliberately
  // probes `__no_such_ledger__.jsonl` to prove a missing file degrades honestly,
  // and reporting that as a dead read would be the audit inventing its own noise.
  let CTX = "module";
  const addSink = (map, p, line, verb) => {
    noteResolved(line, verb);        // this site DID fold on at least one pass (see trulyUnresolved)
    const key = canon(p);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push({ line, verb, ctx: CTX });
  };

  // ── module-scope environment ───────────────────────────────────────────────
  // Flow-insensitive on purpose: 95% of the path constants in this repo are
  // module-scope `const`, so a full SSA would cost a great deal and buy almost
  // nothing.
  const env = new Map();

  const evalNode = (n, scope) => {
    if (!n) return UNKNOWN;
    switch (n.type) {
      case "Literal":
        return typeof n.value === "string" ? C(n.value) : UNKNOWN;
      case "Identifier": {
        const v = scope.get(n.name);
        return v || UNKNOWN;
      }
      case "TemplateLiteral": {
        let out = "";
        for (let i = 0; i < n.quasis.length; i++) {
          out += n.quasis[i].value.cooked ?? "";
          if (i < n.expressions.length) {
            const e = evalNode(n.expressions[i], scope);
            if (!isC(e)) return UNKNOWN;
            out += e.v;
          }
        }
        return C(out);
      }
      case "BinaryExpression": {
        if (n.operator !== "+") return UNKNOWN;
        const l = evalNode(n.left, scope), r = evalNode(n.right, scope);
        return isC(l) && isC(r) ? C(l.v + r.v) : UNKNOWN;
      }
      case "LogicalExpression":
        // `process.env.X || join(...)` — the right side is the real value here;
        // the env override is a test hook, not the production lane.
        if (n.operator === "||" || n.operator === "??") {
          const r = evalNode(n.right, scope);
          if (isC(r)) return r;
          return evalNode(n.left, scope);
        }
        return UNKNOWN;
      case "ConditionalExpression": {
        const a = evalNode(n.consequent, scope);
        return isC(a) ? a : evalNode(n.alternate, scope);
      }
      case "MemberExpression": {
        // import.meta.url → this file
        if (n.object && n.object.type === "MetaProperty" && n.property && n.property.name === "url") return C(selfFile);
        const flat = flatMember(n);
        if (flat) { const v = scope.get(flat); if (v) return v; }
        return UNKNOWN;
      }
      case "NewExpression":
        return UNKNOWN;
      case "CallExpression": {
        const name = calleeName(n);
        const A = n.arguments.map((a) => evalNode(a, scope));
        switch (name) {
          case "join":
          case "resolve":
          case "pathResolve":
            if (A.every(isC)) return C(slash(pathResolve(...A.map((a) => a.v))));
            return UNKNOWN;
          case "dirname":
            return isC(A[0]) ? C(slash(dirname(A[0].v))) : UNKNOWN;
          case "basename":
            return isC(A[0]) ? C(basename(A[0].v)) : UNKNOWN;
          case "fileURLToPath":
            // fileURLToPath(import.meta.url) is the single most load-bearing
            // seed in this whole analysis: it is how every organ finds ROOT.
            return isC(A[0]) ? C(A[0].v.startsWith("file:") ? slash(fileURLToPath(A[0].v)) : A[0].v) : UNKNOWN;
          case "String":
            return A[0] || UNKNOWN;
          default: {
            // zero-arg path thunk, seeded above
            if (name && n.arguments.length === 0) { const v = scope.get(`${name}()`); if (v) return v; }
            return UNKNOWN;
          }
        }
      }
      default:
        return UNKNOWN;
    }
  };

  const flatMember = (n) => {
    const parts = [];
    let cur = n;
    while (cur && cur.type === "MemberExpression" && !cur.computed) {
      if (!cur.property || cur.property.type !== "Identifier") return null;
      parts.unshift(cur.property.name);
      cur = cur.object;
    }
    if (cur && cur.type === "Identifier") { parts.unshift(cur.name); return parts.join("."); }
    return null;
  };

  // Walk a call/member chain down to its base identifier: for
  // `(process.argv[2] || "").toLowerCase()` that is `process.argv`; for
  // `String(cmd || "list").toLowerCase()` it is `cmd`.
  const rootIdentOf = (n, depth = 0) => {
    if (!n || depth > 8) return null;
    switch (n.type) {
      case "Identifier": return n.name;
      case "MemberExpression": return rootIdentOf(n.object, depth + 1);
      case "CallExpression": {
        const viaCallee = rootIdentOf(n.callee, depth + 1);
        if (viaCallee && viaCallee !== "String" && viaCallee !== "Boolean") return viaCallee;
        for (const a of n.arguments || []) { const r = rootIdentOf(a, depth + 1); if (r) return r; }
        return viaCallee;
      }
      case "LogicalExpression": return rootIdentOf(n.left, depth + 1) || rootIdentOf(n.right, depth + 1);
      case "ChainExpression": return rootIdentOf(n.expression, depth + 1);
      default: return null;
    }
  };
  const isArgvRooted = (n) => {
    const r = rootIdentOf(n);
    if (!r) return false;
    if (argvTainted.has(r)) return true;
    const txt = src.slice(n.start, n.end);
    return /process\.argv/.test(txt) && txt.length < 200;
  };

  const calleeName = (call) => {
    const c = call.callee;
    if (!c) return null;
    if (c.type === "Identifier") return c.name;
    if (c.type === "MemberExpression" && c.property && c.property.type === "Identifier") return c.property.name;
    return null;
  };

  // ── collect declarations (module scope AND, later, per-function locals) ────
  const collectDecls = (body, scope) => {
    for (const stmt of body) {
      if (stmt.type === "VariableDeclaration") {
        for (const d of stmt.declarations) {
          if (!d.init) continue;
          noteArgvTaint(d);
          if (d.id.type === "Identifier") {
            if (d.init.type === "ArrowFunctionExpression" || d.init.type === "FunctionExpression") {
              localFns.set(d.id.name, { params: d.init.params, body: d.init.body });
              // THE ZERO-ARG PATH HELPER: `const LEDGER = () => join(STATE_DIR,
              // "gate_tune_ledger.jsonl")`. gate_tune.mjs declares itself SOLE
              // WRITER of that ledger in its header and writes it only through
              // this thunk, so without modelling it the file showed ZERO writers
              // and captains_call.mjs's perfectly good read of it was reported as
              // a DEAD READ — a fabricated bug on a working lane.
              if (d.init.params.length === 0 && d.init.body.type !== "BlockStatement") {
                const v = evalNode(d.init.body, scope);
                if (isC(v)) scope.set(`${d.id.name}()`, v);
              }
              continue;
            }
            if (d.init.type === "ObjectExpression") {
              // `const F = { a: join(STATE,"a.json") }` — a very common lane map.
              const keys = [];
              for (const pr of d.init.properties) {
                if (pr.type !== "Property" || pr.computed) continue;
                const key = pr.key.name || pr.key.value;
                keys.push(String(key));
                const v = evalNode(pr.value, scope);
                if (isC(v)) scope.set(`${d.id.name}.${key}`, v);
              }
              // remembered so `MODES[mode]` can yield the organ's verb list
              if (keys.length) moduleObjects.set(d.id.name, keys);
              // A DISPATCH TABLE, recognised by SHAPE not by name: every property
              // is shorthand and names a function. `const MODES = { coverage,
              // integrity, laws, hermetic, path, suites }` in organism_test.mjs is
              // exactly this, and because it is indexed as `MODES[c]` (c untainted)
              // no taint rule could ever reach it — so `npm test`'s own
              // `organism_test.mjs suites` read as a broken edge.
              if (d.init.properties.length >= 3 && d.init.properties.every((pr) => pr.type === "Property" && pr.shorthand)) {
                for (const k of keys) dispatchTableKeys.add(k);
              }
              continue;
            }
            // `const MODES = new Set(["stage","status","served",…])` — examiner's
            // dispatch, and a shape the ObjectExpression branch below cannot see.
            if (d.init.type === "NewExpression" && d.init.callee && d.init.callee.name === "Set"
              && d.init.arguments[0] && d.init.arguments[0].type === "ArrayExpression") {
              const keys = d.init.arguments[0].elements.filter((e) => e && e.type === "Literal" && typeof e.value === "string").map((e) => e.value);
              if (keys.length) moduleObjects.set(d.id.name, keys);
              continue;
            }
            if (d.init.type === "ArrayExpression") {
              // `const LANES = [join(...), join(...)]` — bind the element SET so
              // `for (const p of LANES) read(p)` resolves instead of going Unknown.
              const vals = d.init.elements.map((e) => evalNode(e, scope)).filter(isC);
              if (vals.length) scope.set(`${d.id.name}[]`, vals);
              continue;
            }
            const v = evalNode(d.init, scope);
            if (isC(v)) scope.set(d.id.name, v);
          }
        }
      } else if (stmt.type === "FunctionDeclaration" && stmt.id) {
        localFns.set(stmt.id.name, { params: stmt.params, body: stmt.body });
      } else if (stmt.type === "ExportNamedDeclaration") {
        if (stmt.declaration) collectDecls([stmt.declaration], scope);
        for (const s of stmt.specifiers || []) exportedNames.add(s.exported.name);
        if (stmt.declaration && stmt.declaration.id) exportedNames.add(stmt.declaration.id.name);
        if (stmt.declaration && stmt.declaration.declarations) for (const d of stmt.declaration.declarations) if (d.id.type === "Identifier") exportedNames.add(d.id.name);
      }
    }
  };
  collectDecls(ast.body, env);
  // module-scope seeds every organ relies on
  if (!env.has("__dirname")) env.set("__dirname", C(selfDir));

  // ── the sink table ────────────────────────────────────────────────────────
  const READ_FNS = new Set(["readFileSync", "readFile", "createReadStream", "readdirSync", "readdir", "statSync", "lstatSync", "stat", "existsSync", "accessSync", "opendirSync"]);
  const WRITE_FNS = new Set(["writeFileSync", "writeFile", "appendFileSync", "appendFile", "createWriteStream", "unlinkSync", "unlink", "rmSync", "rm", "truncateSync"]);
  const MKDIR_FNS = new Set(["mkdirSync", "mkdir"]);

  // ── walk any function body / program with a scope, recording sinks ─────────
  const paramEnv = new Map();   // fnName -> Map(param -> Set<string>)
  const callArgs = [];          // deferred: [fnName, [AbsVal]]

  const walkBody = (node, scope, ctx) => {
    const visit = (n) => {
      if (!n || typeof n.type !== "string") return;
      switch (n.type) {
        case "TryStatement": {
          const c = n.handler;
          if (c) {
            const stmts = c.body.body || [];
            const bodyStmts = (n.block.body || []).length;
            const src2 = src.slice(n.block.start, n.block.end);
            const hasFs = /\b(readFileSync|writeFileSync|appendFileSync|renameSync|existsSync|readdirSync|execFileSync|spawnSync|fetch)\s*\(/.test(src2);
            const swallowed = stmts.length === 0 || !/\bthrow\b|console\.|process\.exit|logg?|report|assert|warn|error\(/.test(src.slice(c.body.start, c.body.end));
            if (swallowed && hasFs && bodyStmts > 3) {
              swallows.push({ line: n.loc.start.line, try_stmts: bodyStmts, catch_stmts: stmts.length });
            }
          }
          break;
        }
        case "ForOfStatement": {
          // bind `for (const p of LANES)` to the array's element set
          if (n.left && n.left.type === "VariableDeclaration" && n.left.declarations[0] && n.left.declarations[0].id.type === "Identifier"
            && n.right && n.right.type === "Identifier") {
            const set = scope.get(`${n.right.name}[]`);
            if (Array.isArray(set) && set.length) {
              // analyse the loop body once per element value
              for (const v of set) {
                const s2 = new Map(scope);
                s2.set(n.left.declarations[0].id.name, v);
                walkBody(n.body, s2, ctx);
              }
              return; // already walked
            }
          }
          break;
        }
        case "CallExpression": {
          const name = calleeName(n);
          const line = n.loc.start.line;
          if (name && (READ_FNS.has(name) || WRITE_FNS.has(name) || MKDIR_FNS.has(name))) {
            const v = evalNode(n.arguments[0], scope);
            if (isC(v)) {
              if (READ_FNS.has(name)) addSink(reads, v.v, line, name);
              else if (WRITE_FNS.has(name)) addSink(writes, v.v, line, name);
              // mkdir is a directory op — deliberately NOT counted as a writer of
              // a state FILE, or every organ would "write" the whole state dir.
            } else noteUnresolved(line, name, "arg0");
          } else if (name === "renameSync" || name === "rename") {
            // THE writeAtomic RULE. rename IS the write; without this every state
            // file in the repo reads as having zero writers.
            const d = evalNode(n.arguments[1], scope);
            if (isC(d)) addSink(writes, d.v, line, "renameSync→WRITE(dst)");
            else noteUnresolved(line, name, "rename-dst");
          } else if (name === "cpSync" || name === "copyFileSync") {
            const s = evalNode(n.arguments[0], scope), d = evalNode(n.arguments[1], scope);
            if (isC(s)) addSink(reads, s.v, line, name); else noteUnresolved(line, name, "cp-src");
            if (isC(d)) addSink(writes, d.v, line, name); else noteUnresolved(line, name, "cp-dst");
          } else if (name === "execFileSync" || name === "spawnSync" || name === "execFile" || name === "spawn") {
            recordSpawn(n, scope, line);
          } else if (name === "runOrgan") {
            // LAYER B′ — THE IN-PROCESS EDGE (18 Aug 2026, Block 1). turn_hook.mjs
            // imports a sibling organ with its argv shimmed instead of spawning a
            // node for it; the callee's OWN dispatch runs, so `runOrgan("x.mjs",
            // "verb")` IS an organ→verb edge for the verb graph — a process
            // boundary is not what makes an edge. Without this, the eight hook
            // verbs the collapse folded (contract · print · hook · recall-hint ·
            // reset-turns · brief · boot · deal) would read as ORPHAN VERBS the
            // moment settings.json stopped naming them. Literal args only, the
            // same discipline as recordSpawn; anything else is counted unresolved.
            const s = evalNode(n.arguments[0], scope), v = evalNode(n.arguments[1], scope);
            if (isC(s) && /\.mjs$/i.test(s.v)) spawns.push({ kind: "organ", script: basename(s.v), verb: isC(v) ? v.v : null, line, ctx: CTX, inproc: true });
            else noteUnresolved(line, name, "inproc-script");
          } else if ((name === "includes" || name === "has") && n.arguments.length === 1 && isArgvRooted(n.arguments[0])
            && n.callee.type === "MemberExpression" && n.callee.object) {
            // `["reminders","fire-reminders"].includes(process.argv[2]…)` —
            // dugout.mjs's real dispatch for a task that fires EVERY MINUTE — and
            // `MODES.has(mode)`, which is examiner.mjs's.
            const o = n.callee.object;
            if (o.type === "ArrayExpression") {
              for (const e of o.elements) if (e && e.type === "Literal" && typeof e.value === "string") argvVerbs.add(e.value);
            } else if (o.type === "Identifier" && moduleObjects.has(o.name)) {
              for (const k of moduleObjects.get(o.name)) argvVerbs.add(k);
            }
          } else if (name && localFns.has(name)) {
            // INTERPROCEDURAL: bind arguments into parameter slots.
            callArgs.push([name, n.arguments.map((a) => evalNode(a, scope))]);
          }
          break;
        }
        case "SwitchStatement": {
          if (n.discriminant && n.discriminant.type === "Identifier" && argvTainted.has(n.discriminant.name)) {
            for (const c of n.cases) if (c.test && c.test.type === "Literal" && typeof c.test.value === "string") argvVerbs.add(c.test.value);
          }
          break;
        }
        case "MemberExpression": {
          // `MODES[mode]` / `HANDLERS[cmd]` — the dispatch-table idiom. The KEYS
          // of that table are the organ's verbs, and organism_test.mjs itself
          // dispatches exactly this way, so missing it would make the suite
          // runner look verbless.
          if (n.computed && n.property && n.property.type === "Identifier" && argvTainted.has(n.property.name)
            && n.object && n.object.type === "Identifier") {
            const tbl = moduleObjects.get(n.object.name);
            if (tbl) for (const k of tbl) argvVerbs.add(k);
          }
          break;
        }
        case "BinaryExpression": {
          // `mode === "report"` — and, far more common in this repo than the bare
          // form, `(process.argv[2] || "").toLowerCase() === "shadow-detect"`.
          // Matching only the bare identifier missed the whole `.toLowerCase()`
          // family, which is how a LIVE SCHEDULED TASK (ArsenalFC-DugoutReminders,
          // every minute) got reported as invoking a verb that does not exist.
          // rootIdentOf walks the call/member chain down to its base.
          if ((n.operator === "===" || n.operator === "==") && n.right && n.right.type === "Literal" && typeof n.right.value === "string") {
            if (isArgvRooted(n.left)) argvVerbs.add(n.right.value);
          }
          break;
        }
        default: break;
      }
      // CTX must follow the AST into nested functions. The module-level walk
      // descends into every function body (that is how sinks inside a function
      // are seen at all), so without this every edge in the file was stamped
      // ctx="module" — and the fixture rule that depends on ctx silently did
      // nothing. Symptom: manager.mjs's DELIBERATE `sefltest` typo-regression
      // fixture reported as a broken edge, three times over.
      const fnName = (n.type === "FunctionDeclaration" || n.type === "FunctionExpression") && n.id ? n.id.name : null;
      const prevCtx = CTX;
      if (fnName) CTX = fnName;
      for (const k of Object.keys(n)) {
        if (k === "loc" || k === "start" || k === "end" || k === "type") continue;
        const v = n[k];
        if (Array.isArray(v)) v.forEach((x) => x && typeof x.type === "string" && visit(x));
        else if (v && typeof v.type === "string") visit(v);
      }
      CTX = prevCtx;
    };
    visit(node);
  };

  // LAYER B — the inter-process edge. This is what makes the organism analysable
  // at all: 76 files that mostly talk by spawning each other.
  const recordSpawn = (n, scope, line) => {
    const a0 = n.arguments[0];
    const a0v = evalNode(a0, scope);
    const isNode = (a0 && a0.type === "MemberExpression" && flatMember(a0) === "process.execPath")
      || (isC(a0v) && /(^|[\\/])node(\.exe)?$/i.test(a0v.v))
      || (a0 && a0.type === "Identifier" && /^NODE$/.test(a0.name));
    const argsNode = n.arguments[1];
    let script = null, verb = null;
    if (argsNode && argsNode.type === "ArrayExpression") {
      const vals = argsNode.elements.map((e) => evalNode(e, scope));
      const first = vals.find((v) => isC(v) && /\.mjs$/i.test(v.v));
      if (first) script = basename(first.v);
      const idx = vals.findIndex((v) => isC(v) && /\.mjs$/i.test(v.v));
      if (idx >= 0 && isC(vals[idx + 1])) verb = vals[idx + 1].v;
    }
    if (isNode && script) spawns.push({ kind: "organ", script, verb, line, ctx: CTX });
    else if (isC(a0v)) {
      const b = basename(a0v.v).toLowerCase().replace(/\.(exe|cmd|bat)$/, "");
      // THE ONLY TOKEN-SPEND EDGES IN THE ORGANISM. Enumerated, not estimated.
      if (["claude", "gemini"].includes(b)) spawns.push({ kind: "llm", bin: b, line });
      else spawns.push({ kind: "bin", bin: b, line });
    } else noteUnresolved(line, "spawn", "bin-unknown");
  };

  // ── pass 1: module top level ──────────────────────────────────────────────
  walkBody({ type: "Program", body: ast.body, loc: ast.loc }, env, "module");

  // ── DEFAULT PARAMETER VALUES ──────────────────────────────────────────────
  // `export function ledgerRows(stateDir = STATE_DIR)` then `readLines(join(
  // stateDir, LEDGER))`. This dependency-injection-with-a-default shape is the
  // house idiom (7 organs, and every `deps = {}` entry point), and with defaults
  // unmodelled the parameter is Unknown on the PRODUCTION path — so harvest.mjs
  // read as writing its ledger and never reading it, which is precisely the
  // "orphan lane" false positive that would have sent a session to repair a
  // working organ. Measured 12 Aug 2026: this one gap alone accounted for
  // harvest_log.jsonl and every `= STATE_DIR)` reader in the repo.
  const seedDefaults = () => {
    for (const [fname, fn] of localFns) {
      for (const p of fn.params) {
        if (p.type !== "AssignmentPattern" || p.left.type !== "Identifier") continue;
        const v = evalNode(p.right, env);
        if (!isC(v)) continue;
        if (!paramEnv.has(fname)) paramEnv.set(fname, new Map());
        const pe = paramEnv.get(fname);
        if (!pe.has(p.left.name)) pe.set(p.left.name, new Set());
        pe.get(p.left.name).add(v.v);
      }
    }
  };
  seedDefaults();

  // ── fixpoint: propagate Const args into parameter slots ───────────────────
  // Cap 5 per the design. In practice this settles in 2-3 on this repo.
  //
  // ⚠ THE CAP THAT WAS WRONG THE FIRST TIME. The per-parameter value cap started
  // at 8, which looked harmless and was not: dugout.mjs funnels ~40 DISTINCT
  // paths through one module-scope `readJson(p)` helper, so a cap of 8 silently
  // dropped 32 of them — and `fsrs_store.json` landed past the cut, making a file
  // with SEVEN readers report as an orphan lane written by fsrs.mjs and read by
  // nobody. A truncation that produces a plausible-looking wrong answer is worse
  // than one that crashes. The cap now bounds the CARTESIAN PRODUCT (the only
  // thing that can actually explode) rather than the per-parameter set.
  const PARAM_CAP = 64, COMBO_CAP = 256;
  for (let iter = 0; iter < 5; iter++) {
    let changed = false;
    const pending = callArgs.splice(0, callArgs.length);
    for (const [fname, argv] of pending) {
      const fn = localFns.get(fname);
      if (!fn) continue;
      if (!paramEnv.has(fname)) paramEnv.set(fname, new Map());
      const pe = paramEnv.get(fname);
      fn.params.forEach((p, i) => {
        const id = p.type === "Identifier" ? p : (p.type === "AssignmentPattern" && p.left.type === "Identifier" ? p.left : null);
        if (!id) return;
        const a = argv[i];
        if (!isC(a)) return;
        if (!pe.has(id.name)) pe.set(id.name, new Set());
        if (pe.get(id.name).size < PARAM_CAP && !pe.get(id.name).has(a.v)) { pe.get(id.name).add(a.v); changed = true; }
      });
    }
    if (!changed && iter > 0) break;
    // re-analyse every function whose parameter set is known, once per known value
    for (const [fname, fn] of localFns) {
      const pe = paramEnv.get(fname);
      let combos = [new Map(env)];
      if (pe) {
        for (const [pname, vals] of pe) {
          const next = [];
          for (const base of combos) {
            for (const v of vals) { const m = new Map(base); m.set(pname, C(v)); next.push(m); if (next.length >= COMBO_CAP) break; }
            if (next.length >= COMBO_CAP) break;
          }
          if (next.length) combos = next;
        }
      }
      CTX = fname;
      for (const scope of combos) {
        collectDecls(fn.body.type === "BlockStatement" ? fn.body.body : [], scope);
        walkBody(fn.body, scope, fname);
      }
      CTX = "module";
    }
  }

  // HEADER-DECLARED VERBS. Nearly every organ writes `// CLI: node scripts/x.mjs
  // [a|b|c]` in its own header. That is a SECOND, independent statement of the
  // same fact, so it is parsed rather than trusted: used to widen the denominator
  // for BROKEN_EDGE (never invent a bug out of a parser gap), and separately
  // diffed against the built set to surface doc↔code drift in the organ's own
  // first twelve lines — the cheapest documentation check in the repo.
  const headerVerbs = new Set();
  {
    // TWO header idioms are in live use and both must be read: `// CLI: node
    // scripts/x.mjs [a|b|c]` and `// MODES: node scripts/x.mjs status → …`.
    // fuelboard.mjs uses the second, and its `status` verb is a FALL-THROUGH
    // DEFAULT with no comparison anywhere — unreachable by any dispatch rule —
    // so without the header the /organism-doctor skill read as calling a verb
    // that does not exist. It exists; it is just the default.
    const head = src.slice(0, 20000);
    for (const m of head.matchAll(/^\/\/\s*(?:CLI|MODES|USAGE|Usage):.*$/gim)) {
      for (const w of m[0].matchAll(/[[|\s]([a-z][a-z0-9\-]{1,24})(?=[\]|\s<]|$)/g)) headerVerbs.add(w[1]);
    }
    for (const m of head.matchAll(VERB_AFTER_PATH)) if (m[2] && `${m[1]}.mjs` === basename(absPath)) headerVerbs.add(m[2]);
  }
  for (const v of ["node", "scripts", "mjs", "cli", "modes", "usage"]) headerVerbs.delete(v);
  for (const k of dispatchTableKeys) argvVerbs.add(k);
  // A CLI VERB IS A BARE LOWERCASE WORD. Flags (`--daemon`), dotted keys
  // (`gem.sync_due`) and SHOUTED status constants (`RED`) are none of them, and
  // each of those three actually appeared in the first pass. Filtering by SHAPE
  // is safe here in a way that filtering by name never is.
  for (const v of [...argvVerbs]) {
    if (/^-/.test(v) || /[.\s/\\]/.test(v) || v !== v.toLowerCase() || v.length < 2 || v.length > 24) argvVerbs.delete(v);
    // a date literal is not a verb — deep.mjs compares argv against "2026-06-24"
    else if (/^[\d-]+$/.test(v)) argvVerbs.delete(v);
  }
  // `selftest` is universal in this repo and is dispatched half a dozen ways
  // (`(arg||"").toLowerCase()===`, `argv.includes`, a bare `if (mode)`). Rather
  // than chase every shape, take the DEFINITION as the evidence: an organ that
  // defines `function selftest(` has the verb, full stop. Without this, package
  // .json's own `oura_coach.mjs selftest` read as a broken edge.
  if (/\b(?:async\s+)?function\s+selftest\s*\(/.test(src) || /\bselftest\s*=\s*(?:async\s*)?\(/.test(src)) argvVerbs.add("selftest");

  // The fixpoint re-walks each function once per parameter binding, so the same
  // physical call site is recorded many times. Deduped by (kind, target, line) —
  // an IR that reports one spawn as three would make every downstream count wrong.
  const seenSpawn = new Set();
  const spawnsDedup = spawns.filter((s) => {
    const k = `${s.kind}|${s.script || s.bin}|${s.verb || ""}|${s.line}`;
    if (seenSpawn.has(k)) return false;
    seenSpawn.add(k); return true;
  });

  return { reads, writes, spawns: spawnsDedup, swallows, unresolved: trulyUnresolved(), verbs: [...argvVerbs], headerVerbs: [...headerVerbs], exports: [...exportedNames], loc: src.split("\n").length };
}

// ============================================================================
// ROOT SETS — without these, every scheduled-only organ reads as dead code
// ============================================================================
// `scripts/scout.mjs mission` — the verb, and ONLY when it is on the SAME LINE.
// The first version used `\s+`, which matches a newline, so a doc that ended a
// sentence with `scripts/scout.mjs` and began the next line with "dressing-room"
// yielded the verb `dressing-room`, and the verb graph then reported the /fire
// skill invoking a verb scout.mjs does not have. Four fabricated BROKEN EDGEs
// from one metacharacter. `[ \t]` cannot cross a line; the negative lookahead
// stops a following path segment from being read as a verb.
const VERB_AFTER_PATH = /scripts[\\/]([A-Za-z0-9_\-]+)\.mjs(?:[ \t]+"?([a-z][a-z0-9\-]*)(?![\w\-]*[\\/.]))?/gi;

function rootSets() {
  const sched = [];      // {task, script, verb, schedule, time}
  const skills = [];
  const hooks = [];
  const docCited = new Map();  // script -> Set(verb)

  const noteDoc = (script, verb) => {
    if (!docCited.has(script)) docCited.set(script, new Set());
    if (verb) docCited.get(script).add(verb);
  };

  // 1. THE SCHTASKS ROTA — ~50 live tasks, and the single most important root
  //    set: without it every scheduled-only organ reads as dead code.
  //    ⚠ TWO SHAPES, and missing the second one is not a small miss. The obvious
  //    `node $repo\scripts\x.mjs` form appears only ~12 times; the installers'
  //    ACTUAL idiom is a helper — `Mk "ArsenalFC-Mirror" "mirror.mjs" @(…)` —
  //    with NO `scripts/` prefix at all. A prefix-anchored regex therefore found
  //    12 of ~50 and would have declared three quarters of the rota unscheduled.
  //    Measured 12 Aug 2026 against `Get-ScheduledTask` (50 live ArsenalFC-*).
  const SCHED_FILES = ["INSTALL_TASKS.ps1", "INSTALL_CONDUCTOR.ps1", "INSTALL_CYBORG_TASKS.ps1", "INSTALL_EVENING_CONDUCTOR.ps1", "CLOAK_TASKS.ps1", "WALLPAPER.ps1", "open_dugout.ps1"];
  for (const extra of SCHED_FILES) {
    const p = join(ROOT, "setup", extra);
    if (!existsSync(p)) continue;
    const txt = readFileSync(p, "utf8");
    for (const m of txt.matchAll(/scripts[\\/]([A-Za-z0-9_\-]+)\.mjs(?:"?\s+"?([a-z][a-z0-9\-]*))?/gi)) {
      sched.push({ script: `${m[1]}.mjs`, verb: m[2] || null, source: extra, form: "path" });
    }
    // the `Mk "ArsenalFC-Name" "organ.mjs verb" @(...)` helper form
    for (const m of txt.matchAll(/(?:^|\s)(?:Mk|Add-Task)\s+"([^"]+)"\s+"([A-Za-z0-9_\-]+)\.mjs(?:\s+([a-z][a-z0-9\- ]*))?"/gim)) {
      sched.push({ task: m[1], script: `${m[2]}.mjs`, verb: (m[3] || "").trim().split(/\s+/)[0] || null, source: extra, form: "Mk" });
    }
  }

  // 2. the skills
  const skillDir = join(ROOT, ".claude", "skills");
  if (existsSync(skillDir)) {
    for (const d of readdirSync(skillDir)) {
      const f = join(skillDir, d, "SKILL.md");
      if (!existsSync(f)) continue;
      const txt = readFileSync(f, "utf8");
      for (const m of txt.matchAll(VERB_AFTER_PATH)) {
        skills.push({ skill: d, script: `${m[1]}.mjs`, verb: m[2] || null });
      }
    }
  }

  // 3. the hooks
  const settings = join(ROOT, ".claude", "settings.json");
  if (existsSync(settings)) {
    const txt = readFileSync(settings, "utf8");
    for (const m of txt.matchAll(VERB_AFTER_PATH)) {
      hooks.push({ script: `${m[1]}.mjs`, verb: m[2] || null, source: "settings.json" });
    }
    for (const m of txt.matchAll(/hooks[\\/]([A-Za-z0-9_\-]+)\.mjs/gi)) hooks.push({ script: `hooks/${m[1]}.mjs`, verb: null, source: "settings.json" });
  }

  // 4. npm scripts — a verb `npm test` reaches is not orphaned
  const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
  for (const [, v] of Object.entries(pkg.scripts || {})) {
    for (const m of String(v).matchAll(VERB_AFTER_PATH)) {
      hooks.push({ script: `${m[1]}.mjs`, verb: m[2] || null, source: "package.json" });
    }
  }

  // 5. the docs. NOT an invocation — but a verb he is TOLD to type is not
  //    "unreachable code", it is a human-driven lane, and conflating the two
  //    would bury the real orphans under a hundred false ones.
  //    ⚠ Read with the AST-equivalent discipline: readFileSync, never grep. The
  //    three NUL-byte organs make grep silently drop lines (see the header).
  const mdFiles = [];
  const walkMd = (d, depth) => {
    if (depth > 3) return;
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.name === "node_modules" || e.name === ".git") continue;
      const p = join(d, e.name);
      if (e.isDirectory()) walkMd(p, depth + 1);
      else if (e.name.endsWith(".md")) mdFiles.push(p);
    }
  };
  walkMd(ROOT, 0);
  for (const f of mdFiles) {
    if (basename(f) === "ARSENAL_FC_FULL_REPO_BUNDLE.md") continue;  // a generated mirror of the repo; citing it would cite everything
    const txt = readFileSync(f, "utf8");
    // ⚠ ONLY INSIDE CODE SPANS. Running the verb regex over raw prose harvests
    // the next ENGLISH WORD after a path: `scripts/conductor.mjs and …` yielded
    // the verb `and`, and `scripts/course.mjs is …` yielded `is`. 16 doc-cited
    // "broken edges" of which 10 were sentences. A command in these docs is
    // always written in backticks or a fence, so that is the only place to look —
    // which is a rule about how the corpus is WRITTEN, not a stopword list to
    // maintain forever.
    const codeSpans = [
      ...[...txt.matchAll(/`([^`\n]+)`/g)].map((m) => m[1]),
      ...[...txt.matchAll(/```[a-z]*\n([\s\S]*?)```/g)].map((m) => m[1]),
    ].join("\n");
    for (const m of codeSpans.matchAll(VERB_AFTER_PATH)) noteDoc(`${m[1]}.mjs`, m[2]);
    // the ORGAN itself is still counted from the whole document — a doc merely
    // NAMING an organ is a real citation, even in prose.
    for (const m of txt.matchAll(VERB_AFTER_PATH)) noteDoc(`${m[1]}.mjs`, null);
  }

  return { sched, skills, hooks, docCited, mdFiles };
}

// ============================================================================
// BUILD THE IR
// ============================================================================
export function build() {
  const scriptDir = join(ROOT, "scripts");
  const files = readdirSync(scriptDir).filter((f) => f.endsWith(".mjs")).sort();
  const organs = {};
  const parseErrors = [];
  let unresolved = 0;

  for (const f of files) {
    const abs = join(scriptDir, f);
    let src;
    try { src = readFileSync(abs, "utf8"); } catch (e) { parseErrors.push({ file: f, error: `read: ${e.message}` }); continue; }
    try {
      const a = analyzeFile(abs, src);
      unresolved += a.unresolved;
      // FIXTURE-ONLY is carried per edge. A path touched ONLY from a selftest
      // body is a test fixture, not a lane: this repo deliberately reads
      // `__no_such_ledger__.jsonl` to prove a missing file degrades honestly, and
      // an audit that reported that as a dead read would be manufacturing its own
      // noise — the exact failure mode §1 of the brief forbids.
      // A path is a FIXTURE if every touch of it comes from a test/demo context,
      // OR if it is named by the repo's own negative-probe convention. Both are
      // needed: `__no_such_ledger__.jsonl` is read from inside an assert helper
      // whose name says nothing about testing, so the ctx rule alone still
      // reported four deliberate "this file is missing on purpose" probes as
      // dead reads — the audit inventing findings out of the repo's own tests.
      const NEGATIVE_PROBE = /(^|\/)__[^/]*__\.(json|jsonl|txt)$|CANARY|__no_such/i;
      const fixtureOnly = (s, p) => NEGATIVE_PROBE.test(p) || s.every((x) => /selftest|selfTest|_test|fixture|demo|canary|probe/i.test(String(x.ctx)));
      organs[f] = {
        loc: a.loc,
        reads: [...a.reads].map(([p, s]) => ({ path: relRepo(p), lines: s.map((x) => x.line), fixture: fixtureOnly(s, p) })),
        writes: [...a.writes].map(([p, s]) => ({ path: relRepo(p), lines: s.map((x) => x.line), verbs: [...new Set(s.map((x) => x.verb))], fixture: fixtureOnly(s, p) })),
        spawns: a.spawns,
        swallows: a.swallows,
        verbs: a.verbs.sort(),
        header_verbs: a.headerVerbs.sort(),
        exports: a.exports.sort(),
        unresolved: a.unresolved,
      };
    } catch (e) {
      parseErrors.push({ file: f, error: `parse: ${e.message}` });
    }
  }

  // ⚠ THE ASSERTION THAT MAKES THIS TRUSTWORTHY. Any tool that measures 76 files
  // must PROVE it read all 76 and fail loudly on a skip — otherwise a skipped
  // file reads exactly like a clean one, which is the failure mode of every grep
  // recipe in this repo (the three NUL-byte organs).
  if (parseErrors.length) {
    console.error(`xray: REFUSING — ${parseErrors.length} of ${files.length} organs did not parse. A partial IR reports false GREEN.`);
    for (const e of parseErrors) console.error(`  · ${e.file}: ${e.error}`);
    process.exit(2);
  }

  // ── file → readers / writers ──────────────────────────────────────────────
  const fileIndex = new Map();
  const touch = (p) => { if (!fileIndex.has(p)) fileIndex.set(p, { readers: new Set(), writers: new Set(), fixtureR: new Set(), fixtureW: new Set() }); return fileIndex.get(p); };
  for (const [organ, o] of Object.entries(organs)) {
    for (const r of o.reads) { const e = touch(r.path); if (r.fixture) e.fixtureR.add(organ); else e.readers.add(organ); }
    for (const w of o.writes) { const e = touch(w.path); if (w.fixture) e.fixtureW.add(organ); else e.writers.add(organ); }
  }

  // ── what is actually on disk ──────────────────────────────────────────────
  // DIRECTORIES ARE RECORDED TOO. existsSync/readdirSync are legitimately aimed
  // at DIRECTORIES (`state/capsules`, `state/archive`, `state/brain_out`), and
  // with only files recorded every such probe looked like a read of a file that
  // does not exist and nobody writes — i.e. a dead read. `state/capsules` is on
  // disk right now; it was reported dead purely because the walker skipped dirs.
  const onDisk = new Set();
  const dirsOnDisk = new Set();
  // ONE walker, called twice (S6-F · F-01). The obvious repair — `existsSync(join(ROOT, p))`
  // in the file mapping — was written first and xray's OWN selftest bit it: a variable-path
  // fs call is an unresolvable sink, and the per-organ ratchet went 8→9 on xray itself. A gate
  // may only get stricter (§10-D rule 6), so the walker is reused instead of a new call site
  // being added. Same fs calls as before, one more traversal.
  const walkInto = (d, fileSet, dirSet) => {
    if (!existsSync(d)) return;
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (SKIP_WALK.test(e.name)) continue;
      const p = join(d, e.name);
      if (e.isDirectory()) { dirSet.add(relRepo(p)); walkInto(p, fileSet, dirSet); }
      else fileSet.add(relRepo(p));
    }
  };
  dirsOnDisk.add(relRepo(STATE_DIR));
  walkInto(STATE_DIR, onDisk, dirsOnDisk);
  // …and the whole repo, so that EXISTENCE IS EXISTENCE WHEREVER THE PATH LIVES.
  const repoFiles = new Set(), repoDirs = new Set();
  walkInto(ROOT, repoFiles, repoDirs);

  // ── declared SOLE WRITER headers (doc↔code drift, Q5) ─────────────────────
  const declared = [];
  for (const f of files) {
    const src = readFileSync(join(scriptDir, f), "utf8");
    const head = src.slice(0, 12000);
    for (const m of head.matchAll(/(?:SOLE WRITER|sole writer|Single writer|single writer|SINGLE WRITER)[^\n]{0,160}/g)) {
      const line = m[0];
      for (const fm of line.matchAll(/([A-Za-z0-9_\-.]+\.(?:json|jsonl))/g)) declared.push({ organ: f, file: fm[1] });
      if (/capsules\//.test(line)) declared.push({ organ: f, file: "capsules/" });
    }
  }

  const roots = rootSets();

  const ir = {
    built_at: new Date().toISOString(),
    organs_parsed: files.length,
    organs_expected: files.length,
    parse_errors: parseErrors,
    unresolved_sinks: unresolved,
    organs,
    files: [...fileIndex].map(([p, e]) => ({
      path: p,
      readers: [...e.readers].sort(),
      writers: [...e.writers].sort(),
      fixture_readers: [...e.fixtureR].sort(),
      fixture_writers: [...e.fixtureW].sort(),
      // EXISTENCE IS EXISTENCE, WHEREVER THE PATH LIVES (S6-F · F-01, 28 Aug 2026).
      // The walk above enumerates STATE_DIR and nothing else, and `on_disk` used to BE that
      // walk — so every path outside dressing-room/state/ reported false whether or not it
      // was there, and a directory inside it reported false too because dirs go to their own
      // set. That is not a display bug: `flow_atlas.mjs` uses `!f.on_disk` as a FILTER, so
      // CLAUDE.md, package.json, THE_GAFFER.md, the four learning-layer docs and seven live
      // state directories were all being drawn as "read by somebody, never born" — 24 of the
      // atlas's 57 ghost reads, and 4 of its 11 orphan on_disk flags. Measured at S6-R.
      // The walk stays (ir.on_disk is its own enumeration, and Q4 reads it); only the FIELD
      // is corrected, and it is corrected to the only honest predicate there is.
      on_disk: onDisk.has(p) || dirsOnDisk.has(p) || repoFiles.has(p) || repoDirs.has(p),
      is_dir: dirsOnDisk.has(p),
    })).sort((a, b) => a.path.localeCompare(b.path)),
    on_disk: [...onDisk].sort(),
    dirs_on_disk: [...dirsOnDisk].sort(),
    declared_sole_writers: declared,
    roots: {
      scheduled: roots.sched,
      skills: roots.skills,
      hooks: roots.hooks,
      doc_cited: [...roots.docCited].map(([s, v]) => ({ script: s, verbs: [...v].sort() })),
      md_files: roots.mdFiles.length,
    },
  };
  return ir;
}

export function save(ir) {
  mkdirSync(STATE_DIR, { recursive: true });
  const tmp = OUT + ".tmp";
  writeFileSync(tmp, JSON.stringify(ir, null, 1));
  renameSync(tmp, OUT);
  return OUT;
}
export const load = () => JSON.parse(readFileSync(OUT, "utf8"));

// ============================================================================
// THE QUERIES — every bug class is set arithmetic over the IR
// ============================================================================
// A DOCUMENTED DELIBERATE EXCEPTION IS NOT A DEFECT. CLAUDE.md declares
// brain_ledger.jsonl a SHARED APPEND LANE with six live appenders and brain.mjs
// owning the SCHEMA only. This repo nearly had that lane "repaired" once already
// by a session reading the single-writer law as absolute. Never harmonise it.
export const MULTI_WRITER_ALLOWLIST = [
  "dressing-room/state/brain_ledger.jsonl",
];

const STATE_RE = /^dressing-room\/state\//;

// THREE EXCLUSIONS, each one measured rather than guessed, and each one removing
// a whole CLASS of false positive that would otherwise have buried the real
// findings. §1 of the brief is explicit: an audit that emits 200 findings
// reproduces the 27-unanswered-cards failure at 8× scale, so precision here is
// not tidiness, it is the deliverable.
//   · demo_sandbox/  — organism_live_demo builds this AT RUNTIME. Every path
//     under it read as "written by nobody" because the writer is a fixture.
//   · brain_out/ + archive/ + capsules/ + date-partitioned lanes — written with
//     DATE-TEMPLATED paths (`${day}.md`), which are Unknown statically by
//     construction. 338 of 338 Q4 "ghosts" were this. Reporting them would be
//     reporting the analysis's own blind spot as the repo's defect.
//   · directories — see dirsOnDisk above.
const NOISE_RE = /^dressing-room\/state\/(demo_sandbox|brain_out|archive|capsules|backups|capsule_backups)\//;
const DATED_RE = /\d{4}-\d{2}(-\d{2})?/;

export function queries(ir) {
  const out = { Q1: [], Q2: [], Q3: [], Q4: [], Q5: [] };
  for (const f of ir.files) {
    if (!STATE_RE.test(f.path)) continue;
    if (f.is_dir || NOISE_RE.test(f.path) || DATED_RE.test(f.path)) continue;
    // a directory that does not exist yet is still a directory probe, not a file
    if (!/\.(json|jsonl|txt|md|html|log|csv)$/i.test(f.path)) continue;
    const R = f.readers.length, W = f.writers.length;
    // Q1 DEAD READ — read by somebody, written by nobody, absent from disk.
    // This is bug class 1 exactly: `rejirah_state.json`, read inside a try/catch,
    // so the feature simply never fired and nothing ever said so.
    if (R > 0 && W === 0 && !f.on_disk) out.Q1.push(f);
    // Q2 LAW BREACH — the single-writer law, total over every file instead of
    // one bespoke grep per suspicion.
    if (W > 1 && !MULTI_WRITER_ALLOWLIST.includes(f.path)) out.Q2.push(f);
    // Q3 ORPHAN — a lane written and never consumed.
    if (W > 0 && R === 0) out.Q3.push(f);
    // Q4 GHOST — state on disk that no live code touches at all.
    if (f.on_disk && R === 0 && W === 0) out.Q4.push(f);
  }
  // Q4 also has to consider files on disk that never appear in the IR at all.
  const seen = new Set(ir.files.map((f) => f.path));
  for (const p of ir.on_disk) {
    if (seen.has(p) || NOISE_RE.test(p) || DATED_RE.test(p)) continue;
    if (!/\.(json|jsonl|txt)$/i.test(p)) continue;
    out.Q4.push({ path: p, readers: [], writers: [], on_disk: true });
  }

  // Q5 UNDECLARED — a header says "SOLE WRITER of X" and the IR disagrees.
  const byName = new Map();
  for (const f of ir.files) byName.set(basename(f.path), f);
  for (const d of ir.declared_sole_writers) {
    const f = byName.get(d.file);
    if (!f) continue;
    const others = f.writers.filter((w) => w !== d.organ);
    if (others.length) out.Q5.push({ path: f.path, declared_by: d.organ, actual_writers: f.writers, undeclared: others });
  }
  return out;
}

// ── the verb graph: built vs callable ────────────────────────────────────────
export function verbGraph(ir) {
  const invoked = new Map();   // script -> Set(verb|null)
  const note = (s, v) => { if (!invoked.has(s)) invoked.set(s, new Set()); invoked.get(s).add(v || "*"); };
  for (const [, o] of Object.entries(ir.organs)) for (const sp of o.spawns) if (sp.kind === "organ") note(sp.script, sp.verb);
  for (const r of ir.roots.scheduled) note(r.script, r.verb);
  for (const r of ir.roots.skills) note(r.script, r.verb);
  for (const r of ir.roots.hooks) note(r.script, r.verb);

  const docs = new Map();
  for (const d of ir.roots.doc_cited) docs.set(d.script, new Set(d.verbs));

  const orphanVerbs = [], brokenEdges = [], humanOnly = [], headerDrift = [];
  for (const [organ, o] of Object.entries(ir.organs)) {
    const built = new Set(o.verbs);
    const inv = invoked.get(organ) || new Set();
    const doc = docs.get(organ) || new Set();
    for (const v of built) {
      if (inv.has(v) || inv.has("*")) continue;
      if (doc.has(v)) { humanOnly.push({ organ, verb: v }); continue; }
      orphanVerbs.push({ organ, verb: v });
    }
    // the organ's OWN header vs the organ's OWN dispatch — cheapest doc check
    // in the repo, and it needs no .md file at all.
    const hdr = new Set(o.header_verbs || []);
    const missing = [...hdr].filter((v) => !built.has(v) && v !== "all");
    if (hdr.size && missing.length) headerDrift.push({ organ, declared_in_header: [...hdr], not_dispatched: missing });
  }
  // BROKEN EDGE — somebody invokes a verb the callee does not have. This is a
  // real bug, not a style note: the call silently does the DEFAULT thing.
  //
  // THE DENOMINATOR IS DELIBERATELY GENEROUS: built verbs ∪ header-declared
  // verbs ∪ exported names. A verb the parser merely failed to see is NOT a bug,
  // and the first run of this query produced 29 edges of which the large majority
  // were the parser's own gaps (brain `tick`, widget `list`, learnstate `brief`).
  // An audit whose findings are mostly its own blind spots trains its reader to
  // ignore it — which is exactly how this repo got 27 unanswered cards.
  const known = (organ) => {
    const o = ir.organs[organ];
    if (!o) return null;
    return new Set([...(o.verbs || []), ...(o.header_verbs || []), ...(o.exports || [])]);
  };
  for (const [caller, o] of Object.entries(ir.organs)) {
    for (const sp of o.spawns) {
      if (sp.kind !== "organ" || !sp.verb) continue;
      // manager.mjs spawns itself with the verb `sefltest` — a DELIBERATE typo,
      // and its own regression test for the day a typo silently regenerated real
      // state instead of erroring. Reporting a test's own fixture as a broken
      // edge is the audit reading a scar as a wound.
      if (/selftest|selfTest|_test|fixture|demo|canary|probe/i.test(String(sp.ctx || ""))) continue;
      const callee = ir.organs[sp.script];
      if (!callee) { brokenEdges.push({ caller, callee: sp.script, verb: sp.verb, why: "callee organ does not exist", line: sp.line }); continue; }
      const k = known(sp.script);
      if (k.size && !k.has(sp.verb)) {
        brokenEdges.push({ caller, callee: sp.script, verb: sp.verb, why: "callee has no such verb", line: sp.line, callee_verbs: callee.verbs });
      }
    }
  }
  for (const r of [...ir.roots.scheduled, ...ir.roots.skills, ...ir.roots.hooks]) {
    if (!r.verb) continue;
    const k = known(r.script);
    if (!k || !k.size) continue;
    if (!k.has(r.verb)) {
      brokenEdges.push({ caller: r.source || r.skill || "root", callee: r.script, verb: r.verb, why: "root set invokes a verb the organ does not have", callee_verbs: ir.organs[r.script].verbs });
    }
  }

  // DOC-CITED BROKEN EDGE — a doc, a skill or a card TELLS HIM to type a verb the
  // organ cannot take. This is not a documentation nit; it is precisely how the
  // captain's-call bug reached him. Twenty-seven cards each printed
  // `captains_call.mjs answer <id>` and nothing on the other end could receive the
  // word, and no organ→organ edge existed to catch it because the caller was HIM.
  const docBrokenEdges = [];
  for (const d of ir.roots.doc_cited) {
    const k = known(d.script);
    if (!k || !k.size) continue;
    for (const verb of d.verbs) {
      if (!verb || k.has(verb)) continue;
      docBrokenEdges.push({ caller: "docs/skills", callee: d.script, verb, why: "a doc or skill instructs a verb the organ does not dispatch" });
    }
  }

  // DANGLING LANE — "27 dealt / 0 answerable", stated as a graph property: a file
  // whose WRITERS are all reachable and whose READERS are all unreachable.
  const dangling = [];
  const reachable = (organ) => (invoked.get(organ) && invoked.get(organ).size > 0) || (docs.get(organ) && docs.get(organ).size > 0);
  for (const f of ir.files) {
    if (!STATE_RE.test(f.path)) continue;
    if (!f.writers.length || !f.readers.length) continue;
    const wOk = f.writers.some(reachable);
    const rOk = f.readers.some(reachable);
    if (wOk && !rOk) dangling.push({ path: f.path, writers: f.writers, readers: f.readers });
  }

  return { orphanVerbs, brokenEdges, docBrokenEdges, humanOnly, headerDrift, dangling, invoked: [...invoked].map(([s, v]) => ({ script: s, verbs: [...v] })) };
}

// ── the token-spend edges, enumerated ────────────────────────────────────────
export function spendEdges(ir) {
  const out = [];
  for (const [organ, o] of Object.entries(ir.organs)) for (const sp of o.spawns) if (sp.kind === "llm") out.push({ organ, bin: sp.bin, line: sp.line });
  return out;
}

// ============================================================================
// REPORT
// ============================================================================
function report() {
  const ir = existsSync(OUT) ? load() : build();
  const q = queries(ir);
  const v = verbGraph(ir);
  const spend = spendEdges(ir);
  console.log(`=== XRAY — STATIC TRUTH (${ir.built_at}) ===`);
  console.log(`organs parsed ${ir.organs_parsed}/${ir.organs_expected} · state files on disk ${ir.on_disk.length} · unresolved sinks ${ir.unresolved_sinks}`);
  console.log(`file↔organ edges ${ir.files.reduce((n, f) => n + f.readers.length + f.writers.length, 0)} · token-spend edges ${spend.length}\n`);
  const show = (name, rows, fmt) => {
    console.log(`── ${name} (${rows.length})`);
    for (const r of rows.slice(0, 20)) console.log(`   ${fmt(r)}`);
    if (rows.length > 20) console.log(`   … ${rows.length - 20} more`);
    console.log("");
  };
  show("Q1 DEAD READ — read by somebody, written by nobody, absent from disk", q.Q1, (f) => `${f.path}  ← ${f.readers.join(", ")}`);
  show("Q2 LAW BREACH — more than one writer (allowlist honoured)", q.Q2, (f) => `${f.path}  ← ${f.writers.join(", ")}`);
  show("Q3 ORPHAN LANE — written, never read", q.Q3, (f) => `${f.path}  ← ${f.writers.join(", ")}`);
  show("Q4 GHOST STATE — on disk, no live code touches it", q.Q4, (f) => `${f.path}`);
  show("Q5 UNDECLARED WRITER — header says sole writer, IR disagrees", q.Q5, (r) => `${r.path}  declared=${r.declared_by} undeclared=${r.undeclared.join(", ")}`);
  show("BROKEN EDGE — a caller invokes a verb the callee does not have", v.brokenEdges, (r) => `${r.caller} → ${r.callee} ${r.verb}  (${r.why})`);
  show("DANGLING LANE — writers reachable, readers not (the '27 dealt / 0 answerable' shape)", v.dangling, (r) => `${r.path}  W=${r.writers.join(",")}  R=${r.readers.join(",")}`);
  show("ORPHAN VERB — built, and nothing anywhere can call it", v.orphanVerbs, (r) => `${r.organ} ${r.verb}`);
  const sw = Object.entries(ir.organs).flatMap(([o, x]) => x.swallows.map((s) => ({ organ: o, ...s })));
  show("SWALLOWED EXCEPTION — long try, fs inside, empty catch (where features die quietly)", sw, (r) => `${r.organ}:${r.line}  ${r.try_stmts} statements swallowed`);
}

// ============================================================================
// SELFTEST — the analysis is itself measured, on fixtures with KNOWN answers
// ============================================================================
let pass = 0, fail = 0; const fails = [];
const assert = (n, c, d) => { if (c) { pass++; console.log(`  ok   ${n}`); } else { fail++; fails.push({ n, d }); console.log(`  FAIL ${n}${d ? `\n         ${d}` : ""}`); } };

function selftest() {
  console.log("=== xray.mjs selftest ===\n");
  const ir = build();
  assert(`ALL ${ir.organs_expected} organs parsed — no silent skip (grep's failure mode)`, ir.organs_parsed === ir.organs_expected && ir.parse_errors.length === 0);

  // THE NUL-BYTE PROOF. The three deliberate-NUL organs are exactly where grep
  // goes blind and reports false GREEN. An AST must see straight through them.
  for (const f of ["calibration.mjs", "dmn.mjs", "rejirah.mjs"]) {
    const raw = readFileSync(join(ROOT, "scripts", f));
    assert(`${f} really does contain NUL bytes (the trap is still live)`, raw.includes(0));
    assert(`…and xray read it anyway — ${(ir.organs[f].reads.length + ir.organs[f].writes.length)} fs edges recovered where grep sees "Binary file … matches"`,
      ir.organs[f] && (ir.organs[f].reads.length + ir.organs[f].writes.length) > 0);
  }

  // THE writeAtomic RULE — the single modelling decision the whole organ rests
  // on. If this regresses, every state file silently reads as having no writer,
  // which is a false GREEN of the worst kind (this audit reproduced it by hand).
  const withWriters = ir.files.filter((f) => STATE_RE.test(f.path) && f.writers.length > 0);
  assert("writeAtomic is modelled: renameSync(tmp,p) counts as WRITE(p), so state files HAVE writers",
    withWriters.length >= 40, `only ${withWriters.length} state files have a resolved writer — the rename rule has regressed`);
  assert("…and no `.tmp` path survives into the domain", !ir.files.some((f) => /\.tmp$/.test(f.path)));

  // known-answer probes against the live tree
  const cc = ir.files.find((f) => f.path.endsWith("state/captains_call.json"));
  assert("captains_call.json resolves to its declared owner as a writer", cc && cc.writers.includes("captains_call.mjs"), cc ? `writers=${cc.writers}` : "file not in IR");
  const ledger = ir.files.find((f) => f.path.endsWith("state/brain_ledger.jsonl"));
  assert("the DOCUMENTED shared append lane is seen as multi-writer AND allowlisted (never 'harmonised')",
    ledger && ledger.writers.length > 1 && MULTI_WRITER_ALLOWLIST.includes(ledger.path), ledger ? `writers=${ledger.writers}` : "missing");
  assert("…so Q2 does not report it", !queries(ir).Q2.some((f) => f.path.endsWith("brain_ledger.jsonl")));

  // the inter-process layer must actually exist or the graph is 76 islands
  const organSpawns = Object.values(ir.organs).reduce((n, o) => n + o.spawns.filter((s) => s.kind === "organ").length, 0);
  assert("LAYER B is live — inter-process organ→organ edges were recovered", organSpawns >= 20, `only ${organSpawns}`);
  const llm = spendEdges(ir);
  assert("the token-spend edges are ENUMERATED (the only places money can leave)", llm.length >= 3, `found ${llm.length}`);

  // root sets — without them every scheduled-only organ looks dead
  // Floor set against the LIVE count (50 ArsenalFC-* tasks, `Get-ScheduledTask`,
  // 12 Aug 2026). The first version of this regex found 12 and passed a >=20
  // floor only because the floor was a guess; the floor now rides the measurement.
  assert("the schtasks rota was parsed as a root set — BOTH installer idioms", ir.roots.scheduled.length >= 40, `${ir.roots.scheduled.length} — the \`Mk "Name" "organ.mjs"\` helper form is probably being missed again`);
  assert(`ALL ${ir.organs_expected} organs parsed is not a tautology — the floor is real`, ir.organs_parsed >= 76, `${ir.organs_parsed}`);
  assert("the skills were parsed as a root set", ir.roots.skills.length >= 5, `${ir.roots.skills.length}`);

  // UNSOUNDNESS IS A BUDGET. Recorded, and asserted non-increasing against the
  // committed IR — so the blind spot can only ever shrink.
  assert("unresolved_sinks is recorded (never reported ON, always counted)", typeof ir.unresolved_sinks === "number");
  // …AND IT COUNTS PLACES, NOT VISITS (15 Aug 2026). Driven on a fixture built to
  // make the fixpoint re-walk the same line many times: one helper with an Unknown
  // path, called with several distinct constants so its parameter set grows and the
  // re-analysis loop runs it once per value. Under the old `unresolved++` this
  // returned one count per visit — which is how ~600 lines of unrelated code moved
  // dugout.mjs from 964 to 998 without adding a single unanalysable line, and would
  // have failed the ratchet below on pure noise. There is exactly ONE place in this
  // fixture the analyser cannot follow, so the honest answer is 1.
  {
    const fixture = `
import { readFileSync } from "node:fs";
const A = "/a.json", B = "/b.json", C2 = "/c.json", D = "/d.json";
function readIt(p) { return readFileSync(p, "utf8"); }
function opaque(x) { return readFileSync(x.somewhere, "utf8"); }
readIt(A); readIt(B); readIt(C2); readIt(D);
opaque({}); opaque({}); opaque({});
`;
    const a = analyzeFile(join(ROOT, "scripts", "__fixture__.mjs"), fixture);
    assert("unresolved_sinks counts DISTINCT SITES, not walker VISITS — a budget that moves when you add an unrelated function is not a budget",
      a.unresolved === 1, `got ${a.unresolved} for a fixture with exactly one unfollowable line`);
    // and the resolvable helper really was resolved through the fixpoint, so the 1
    // above is "one hard case", not "the analyser gave up on everything"
    assert("…and the four constants really did fold through the helper's parameter (otherwise the 1 above would be meaningless)",
      [...a.reads.keys()].filter((p) => /\/(a|b|c|d)\.json$/.test(p)).length === 4);
  }
  // LAYER B′ — the in-process edge (18 Aug 2026, Block 1). turn_hook.mjs runs the
  // hook callees by import + argv shim, not by spawn; the verb graph must still see
  // `runOrgan("x.mjs", "verb")` as organ→verb, or the eight folded hook verbs read
  // as orphans. Held here on a fixture so the recogniser cannot silently rot.
  {
    const fixture = `
export async function prompt() {
  await runOrgan("forge_session.mjs", "contract");
  await runOrgan("teaching_contract.mjs", "print", { call: "hookMain" });
}
async function runOrgan(file, verb, opts = {}) { return import(file); }
`;
    const a = analyzeFile(join(ROOT, "scripts", "__fixture_inproc__.mjs"), fixture);
    const inproc = a.spawns.filter((s) => s.kind === "organ" && s.inproc);
    assert("LAYER B′ — a literal `runOrgan(\"x.mjs\", \"verb\")` is an organ→verb edge (in-process dispatch is an edge; a process boundary is not what makes one)",
      inproc.length === 2 && inproc.some((s) => s.script === "forge_session.mjs" && s.verb === "contract") && inproc.some((s) => s.script === "teaching_contract.mjs" && s.verb === "print"),
      JSON.stringify(a.spawns));
    const live = ir.organs["turn_hook.mjs"];
    assert("…and the LIVE turn_hook.mjs carries the eight folded hook verbs as edges (contract · print · hook · recall-hint · reset-turns · brief · boot · deal)",
      !!live && ["contract", "print", "hook", "recall-hint", "reset-turns", "brief", "boot", "deal"].every((v) => live.spawns.some((s) => s.kind === "organ" && s.inproc && s.verb === v)),
      live ? JSON.stringify(live.spawns.map((s) => `${s.script}:${s.verb}`)) : "turn_hook.mjs not in IR");
  }
  if (existsSync(OUT)) {
    const prev = load();
    // ⚠ THE RATCHET IS PER-ORGAN, AND THE FIRST VERSION WAS NOT — it compared the
    // repo-wide total against a fixed slack, which is wrong in BOTH directions.
    // It false-fired the moment ~200 honest lines of new organ landed (4773 →
    // 4816, all of it the new code's own idioms), and — far worse — it could be
    // SILENCED FOREVER by deleting an organ, since a smaller repo has fewer
    // sinks. A budget that can be met by removing code is not a budget.
    //
    // So: no EXISTING organ may get blinder. A NEW organ brings its own sinks and
    // is reported, never failed — it has no previous self to regress against.
    const worse = [];
    for (const [organ, o] of Object.entries(ir.organs)) {
      const before = prev.organs[organ];
      if (!before) continue;                       // new organ — nothing to regress from
      if (o.unresolved > before.unresolved) worse.push(`${organ} ${before.unresolved}→${o.unresolved}`);
    }
    const fresh = Object.keys(ir.organs).filter((k) => !prev.organs[k]);
    assert(`unresolved_sinks is NON-INCREASING PER ORGAN (total ${prev.unresolved_sinks} → ${ir.unresolved_sinks}${fresh.length ? `, incl. ${fresh.length} new organ(s)` : ""})`,
      worse.length === 0,
      worse.length ? `these organs got BLINDER — a transfer function regressed, or an unanalysable idiom landed: ${worse.join(" · ")}` : "");
  }

  console.log(`\nxray: ${pass} passed, ${fail} failed`);
  if (fail) for (const f of fails) console.log(`  · ${f.n}${f.d ? `\n      ${f.d}` : ""}`);
  process.exit(fail ? 1 : 0);
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
function main() {
  const mode = (process.argv[2] || "report").toLowerCase();
  if (mode === "selftest") return selftest();
  if (mode === "build") { const ir = build(); save(ir); console.log(`xray: ${ir.organs_parsed} organs · ${ir.files.length} files · ${ir.unresolved_sinks} unresolved → ${relRepo(OUT)}`); return; }
  if (mode === "report") return report();
  // ⚠ QUERIES REBUILD BY DEFAULT. These used to prefer the committed
  // xray_graph.json whenever it existed, which meant every query answered from a
  // SNAPSHOT of the tree rather than the tree. It was caught by the Bug Museum:
  // two exhibits were injected into a sandbox and "not detected", because `q` and
  // `verbs` were reading the graph committed BEFORE the injection. That is the
  // repo's own signature failure — a cached artefact confidently answering
  // questions about code it has never seen — living inside the tool built to find
  // it. audit.mjs shells both of these, so it was affected too. `--cached` is
  // available for a deliberate fast read; it is never the default.
  const cached = process.argv.includes("--cached");
  if (mode === "q") { const ir = cached && existsSync(OUT) ? load() : build(); console.log(JSON.stringify(queries(ir), null, 1)); return; }
  if (mode === "verbs") { const ir = cached && existsSync(OUT) ? load() : build(); console.log(JSON.stringify(verbGraph(ir), null, 1)); return; }
  if (mode === "swallow") {
    const ir = existsSync(OUT) ? load() : build();
    const sw = Object.entries(ir.organs).flatMap(([o, x]) => x.swallows.map((s) => ({ organ: o, ...s })));
    sw.sort((a, b) => b.try_stmts - a.try_stmts);
    for (const s of sw) console.log(`${s.organ}:${s.line}  try=${s.try_stmts} stmts, catch swallows`);
    console.log(`\n${sw.length} long swallowing try-blocks with fs inside`);
    return;
  }
  console.log("xray: build | report | q | verbs | swallow | selftest");
  process.exit(1);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
