#!/usr/bin/env node
// @ts-check
// ============================================================================
// own_source.mjs · ARSENAL AI FC — THE OWN-SOURCE DOORS (unit mpin-read · forks row 1160 (1) · spec ci/mpin/MPIN_SPEC.md)
//   SOLE WRITER of nothing. It reads source files and writes only under os.tmpdir() (its copies, its plants, its guard).
// ----------------------------------------------------------------------------
// THE CLASS IT SERVES (spec §Q0, measured 19 Nov 2026): an assert that reads its OWN file whole and pins a literal
//   that its own selftest also carries can never fail, because the pin is satisfied by its own string. Two repairs,
//   one module, so every selftest that repairs a pin rides ONE code path:
//   · NARROW — ownCode(url, sel) returns ONE declaration's text, never the file, and REFUSES (throws) a range that
//     touches a column-0 `function selftest…(` block of the same file. A dead pin is a RED, never a silent false.
//   · READ   — tempCopy() + childRun() run the organ for real on a copy under os.tmpdir(), and doorGuard() records and
//     refuses every child_process door inside that child (mcon's pattern, scripts/conductor.mjs S9 (6)).
// ROW 1160 (1), verbatim: "F1 A: one shared module scripts/own_source.mjs; its selftest joins one suite, so package.json
//   takes that one line. It also holds the ONE named bound every new selftest child run uses (F5: no organ-own constant
//   exists); a child killed at it reads red, named killed."
// THE ONE NAMED BOUND is CHILD_RUN_BOUND below. Its value is never typed here: childBoundMs() READS it from its owner's
//   declaration (scripts/conductor.mjs `const STEP_TIMEOUT_MS = …;`, the bound mcon's selftest child already runs under)
//   through ownCode itself. It is NOT imported: postmatch's CHILD_TIMEOUT_MS imports capture, examiner, intent,
//   forge_session and gaffer_brain (measured, ci/mpinr/PROOF.md), and those are the organs that will import THIS file,
//   so an import would close a cycle. This module imports node builtins only, so it can never close one.
// ownCode's selectors (spec §Q1, THE NARROW PRIMITIVE):
//   {fn: name}     a column-0 `function name(` (optionally `export` / `async`, `function*`) up to its first column-0 `}`
//   {decl: NAME}   the column-0 `const NAME =` statement line (optionally `export`)
//   {imports: true} the import block, from the first column-0 `import` to the end of the last import statement
//   {header: true}  the leading comment block (after a shebang). A header IS a comment, so it is the one selector whose
//                   comments are NOT blanked (the spec's blanking rule read literally would blank it whole: named in PROOF).
//   Every other selector blanks every whole-line comment (`//…` and whole-line `/* … */`) inside its text, so a pin whose
//   text lives only in a comment reads false. CRLF is folded first, so a Windows checkout reads the same text.
//   The needles are built from the argument at run time; no needle is a literal of any selftest (scripts/dugout.mjs:4249).
// WHO ELSE COULD ACT ON THIS OUTPUT? every organ selftest that repairs an own-literal pin (units mpin-read, mpin-narrow) ·
//   the law pack's own-literal-pin judge (unit mpin-law, W5) models ownCode as a narrowed subject.
// CLI: node scripts/own_source.mjs [selftest|help]
// ============================================================================
import { readFileSync, existsSync, mkdtempSync, mkdirSync, cpSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join, dirname, relative, isAbsolute } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

const HERE = dirname(fileURLToPath(import.meta.url));

/** THE ONE NAMED BOUND every new selftest child run uses (row 1160 (1)): WHERE its value lives, never the value. */
export const CHILD_RUN_BOUND = Object.freeze({ owner: "conductor.mjs", decl: "STEP_TIMEOUT_MS" });
/** The env door the preloaded guard appends its record to (honoured by the guard file only). */
export const DOOR_LOG_ENV = "ARSENAL_OWN_SOURCE_DOOR_LOG";

const fold = (/** @type {string} */ s) => String(s).replace(/\r\n/g, "\n");
const esc = (/** @type {string} */ s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** @param {string | URL} u @returns {string} a filesystem path */
function toPath(u) {
  if (u instanceof URL) return fileURLToPath(u);
  return /^file:/i.test(String(u)) ? fileURLToPath(String(u)) : String(u);
}

/** Blank every whole-line comment, keeping the line count. @param {string[]} lines @returns {string[]} */
function blankComments(lines) {
  let inBlock = false;
  return lines.map((l) => {
    const t = l.trim();
    if (inBlock) { if (t.includes("*/")) inBlock = false; return ""; }
    if (t.startsWith("//")) return "";
    if (t.startsWith("/*")) {
      const close = t.indexOf("*/", 2);
      if (close === -1) { inBlock = true; return ""; }
      return t.slice(close + 2).trim() === "" ? "" : l;
    }
    return l;
  });
}

/** From line i (a column-0 opener), the index of the first column-0 `}` after it, or -1. @param {string[]} lines @param {number} i */
function closeAt(lines, i) {
  for (let j = i + 1; j < lines.length; j++) if (lines[j].startsWith("}")) return j;
  return -1;
}

/** Every column-0 `function selftest…(` block as [start, end] line indexes. @param {string[]} lines @returns {[number, number][]} */
function selftestBlocks(lines) {
  const open = new RegExp("^(export\\s+)?(async\\s+)?function\\*?\\s+" + "selftest" + "\\w*\\s*\\(");
  return lines.flatMap((l, i) => {
    if (!open.test(l)) return [];
    const e = closeAt(lines, i);
    return [/** @type {[number, number]} */ ([i, e === -1 ? lines.length - 1 : e])];
  });
}

/** The single line index matching re, or a throw naming why. @param {string[]} lines @param {RegExp} re @param {string} what @param {string} file */
function onlyLine(lines, re, what, file) {
  const hits = lines.flatMap((l, i) => (re.test(l) ? [i] : []));
  if (hits.length === 0) throw new Error(`own_source: anchor not found — ${what} in ${file}`);
  if (hits.length > 1) throw new Error(`own_source: anchor is ambiguous — ${what} at ${hits.length} lines of ${file} (${hits.map((h) => h + 1).join(", ")})`);
  return hits[0];
}

/** The [start, end] line range of the import block, or a throw. @param {string[]} lines @param {string} file @returns {[number, number]} */
function importRange(lines, file) {
  const first = lines.findIndex((l) => /^import\b/.test(l));
  if (first === -1) throw new Error(`own_source: anchor not found — the import block in ${file}`);
  let last = first, open = false;
  for (let i = first; i < lines.length; i++) {
    const l = lines[i], t = l.trim();
    if (open) { last = i; if (/\bfrom\s*["'][^"']+["']/.test(l) || /;\s*(\/\/.*)?$/.test(t)) open = false; continue; }
    if (/^import\b/.test(l)) {
      last = i;
      open = !(/\bfrom\s*["'][^"']+["']/.test(l) || /^import\s*["']/.test(l));
      continue;
    }
    if (t === "" || t.startsWith("//") || t.startsWith("/*") || t.startsWith("*")) continue;
    break;
  }
  return [first, last];
}

/** The leading comment block's [start, end], or a throw. @param {string[]} lines @param {string} file @returns {[number, number]} */
function headerRange(lines, file) {
  let i = lines[0] && lines[0].startsWith("#!") ? 1 : 0;
  const start = i;
  let inBlock = false;
  for (; i < lines.length; i++) {
    const t = lines[i].trim();
    if (inBlock) { if (t.includes("*/")) inBlock = false; continue; }
    if (t.startsWith("//")) continue;
    if (t.startsWith("/*")) { if (!t.includes("*/", 2)) inBlock = true; continue; }
    break;
  }
  if (i === start) throw new Error(`own_source: anchor not found — the leading comment block in ${file}`);
  return [start, i - 1];
}

/**
 * THE NARROW PRIMITIVE. One declaration's text of the file at `url`, never the file whole.
 * Throws when the anchor is missing or ambiguous, and when the range would touch a column-0 selftest block.
 * @param {string | URL} url a file URL (import.meta.url) or a path
 * @param {{ fn?: string, decl?: string, imports?: boolean, header?: boolean }} sel exactly one selector
 * @returns {string}
 */
export function ownCode(url, sel) {
  const file = toPath(url);
  const keys = Object.keys(sel || {}).filter((k) => sel[k] !== undefined && sel[k] !== false);
  if (keys.length !== 1 || !["fn", "decl", "imports", "header"].includes(keys[0])) throw new Error(`own_source: one selector of fn | decl | imports | header, got ${JSON.stringify(sel)}`);
  const lines = fold(readFileSync(file, "utf8")).split("\n");
  /** @type {[number, number]} */
  let range;
  if (sel.fn !== undefined) {
    const name = String(sel.fn);
    if (!/^[A-Za-z_$][\w$]*$/.test(name)) throw new Error(`own_source: not a function name — ${JSON.stringify(name)}`);
    const at = onlyLine(lines, new RegExp("^(export\\s+)?(async\\s+)?function\\*?\\s+" + esc(name) + "\\s*\\("), "function " + name, file);
    const end = closeAt(lines, at);
    if (end === -1) throw new Error(`own_source: anchor not closed — function ${name} has no column-0 } in ${file}`);
    range = [at, end];
  } else if (sel.decl !== undefined) {
    const name = String(sel.decl);
    if (!/^[A-Za-z_$][\w$]*$/.test(name)) throw new Error(`own_source: not a const name — ${JSON.stringify(name)}`);
    const at = onlyLine(lines, new RegExp("^(export\\s+)?const\\s+" + esc(name) + "\\s*="), "const " + name, file);
    range = [at, at];
  } else if (sel.imports) range = importRange(lines, file);
  else range = headerRange(lines, file);
  for (const [s, e] of selftestBlocks(lines)) {
    if (range[0] <= e && s <= range[1]) throw new Error(`own_source: REFUSED — the range ${range[0] + 1}-${range[1] + 1} of ${file} touches its selftest block ${s + 1}-${e + 1}`);
  }
  const text = lines.slice(range[0], range[1] + 1);
  return (sel.header ? text : blankComments(text)).join("\n");
}

/**
 * THE ONE NAMED BOUND's value in ms, read from its owner's declaration (CHILD_RUN_BOUND), never typed.
 * Throws when the owner or its declaration is missing, or the declaration is not a plain integer product.
 * @param {string} [dir] the scripts/ dir holding the owner (default: beside this file)
 * @returns {number}
 */
export function childBoundMs(dir = HERE) {
  const line = ownCode(join(dir, CHILD_RUN_BOUND.owner), { decl: CHILD_RUN_BOUND.decl });
  const m = line.match(/=\s*([\d_]+(?:\s*\*\s*[\d_]+)*)\s*;/);
  if (!m) throw new Error(`own_source: the bound ${CHILD_RUN_BOUND.decl} in ${CHILD_RUN_BOUND.owner} is not a plain integer — ${line.trim()}`);
  const ms = m[1].split("*").map((p) => Number(p.trim().replace(/_/g, ""))).reduce((a, b) => a * b, 1);
  if (!Number.isSafeInteger(ms) || ms <= 0) throw new Error(`own_source: the bound ${CHILD_RUN_BOUND.decl} read ${ms}, not a positive integer`);
  return ms;
}

/**
 * A copy of `root`/scripts under os.tmpdir(), with an EMPTY dressing-room/state holding only the named state files
 * (default registry.json, the one file the import graph needs: mcon F6). Node writes it; nothing of the repo moves.
 * @param {{ root: string, prefix?: string, state?: string[] }} o
 * @returns {{ box: string, scripts: string, state: string, seeded: string, listing: () => string, cleanup: () => void }}
 */
export function tempCopy({ root, prefix = "own-source-", state = ["registry.json"] }) {
  const box = mkdtempSync(join(tmpdir(), prefix));
  const scripts = join(box, "scripts"), stateDir = join(box, "dressing-room", "state");
  mkdirSync(stateDir, { recursive: true });
  cpSync(join(root, "scripts"), scripts, { recursive: true });
  for (const f of state) {
    if (!/^[\w.-]+$/.test(f)) throw new Error(`own_source: a state file is a bare name, got ${JSON.stringify(f)}`);
    const src = join(root, "dressing-room", "state", f);
    if (existsSync(src)) cpSync(src, join(stateDir, f));
  }
  const listing = () => readdirSync(stateDir).sort().join(",");
  return { box, scripts, state: stateDir, seeded: listing(), listing, cleanup: () => rmSync(box, { recursive: true, force: true }) };
}

/**
 * A preloaded guard under `box` that RECORDS and REFUSES every child_process door inside the child it is loaded into.
 * @param {string} box a directory under os.tmpdir()
 * @returns {{ preload: string, log: string, env: Record<string, string>, spawned: () => string[] }}
 */
export function doorGuard(box) {
  const rel = relative(tmpdir(), box);
  if (!rel || rel.startsWith("..") || isAbsolute(rel)) throw new Error(`own_source: REFUSED — the guard is planted under os.tmpdir() only, got ${box}`);
  const log = join(box, "doors.log"), guard = join(box, "door_guard.mjs");
  writeFileSync(log, "");
  writeFileSync(guard, [
    'import { createRequire, syncBuiltinESMExports } from "node:module";',
    'import { appendFileSync } from "node:fs";',
    'const cp = createRequire(import.meta.url)("node:child_process");',
    'for (const k of ["spawn", "spawnSync", "exec", "execSync", "execFile", "execFileSync", "fork"]) {',
    `  cp[k] = (...a) => { appendFileSync(process.env.${DOOR_LOG_ENV}, k + " " + String(a[0]) + "\\n"); throw new Error("own_source guard refused " + k); };`,
    "}",
    "syncBuiltinESMExports();",
  ].join("\n"));
  return { preload: pathToFileURL(guard).href, log, env: { [DOOR_LOG_ENV]: log }, spawned: () => fold(readFileSync(log, "utf8")).split("\n").filter(Boolean) };
}

/**
 * @typedef {{ status: number | null, signal: string | null, stdout: string, stderr: string, killed: boolean, bound: number,
 *   why: string | null, pass: (pred: (r: ChildResult) => unknown) => boolean }} ChildResult
 */

/**
 * Run `node <script> ...args` as a child, bounded by THE ONE NAMED BOUND. A child killed at it reads red, named KILLED;
 * a child that never started reads red, named NOT RUN. `pass(pred)` is false on either, whatever pred says.
 * @param {string} script
 * @param {string[]} [args]
 * @param {{ cwd?: string, env?: NodeJS.ProcessEnv, preload?: string, input?: string, boundDir?: string, spawn?: typeof spawnSync }} [o]
 * @returns {ChildResult}
 */
export function childRun(script, args = [], { cwd, env = process.env, preload, input, boundDir, spawn = spawnSync } = {}) {
  const bound = childBoundMs(boundDir);
  const argv = preload ? ["--import", preload, script, ...args] : [script, ...args];
  const r = spawn(process.execPath, argv, { cwd, env, input, encoding: "utf8", timeout: bound, windowsHide: true });
  const err = /** @type {NodeJS.ErrnoException | undefined} */ (r.error);
  const killed = (err && err.code === "ETIMEDOUT") || (r.status === null && r.signal != null);
  const what = [script, ...args].join(" ");
  const why = killed ? `KILLED at the bound — ${what} ran past ${bound} ms (${CHILD_RUN_BOUND.owner} ${CHILD_RUN_BOUND.decl}), signal ${r.signal || "none"}`
    : err ? `NOT RUN — ${what}: ${err.message}` : null;
  /** @type {ChildResult} */
  const res = { status: r.status, signal: r.signal, stdout: fold(String(r.stdout || "")), stderr: fold(String(r.stderr || "")), killed: !!killed, bound, why,
    pass: (pred) => why === null && !!pred(res) };
  return res;
}

// ---- selftest: every refusal planted both ways, on files node writes under os.tmpdir() ----
function selftest() {
  let pass = 0, fail = 0;
  const ok = (/** @type {string} */ what, /** @type {unknown} */ cond, got = "") => { if (cond) pass++; else { fail++; console.log(`  FAIL ${what}${got ? ` · ${got}` : ""}`); } };
  const throwsWith = (/** @type {() => unknown} */ f, /** @type {RegExp} */ re) => { try { f(); return false; } catch (e) { return re.test(String(e && /** @type {Error} */ (e).message)); } };
  const box = mkdtempSync(join(tmpdir(), "own-source-selftest-"));
  try {
    // THE PLANTED ORGAN. Its tokens are built here at run time, so no needle below is a literal of this selftest.
    const T = (/** @type {string} */ k) => ["TOK", k, "Z"].join("_");
    const st = ["function ", "self", "test", "() {"].join("");
    const organ = [
      "#!/usr/bin/env node",
      "// " + T("HEAD") + " the header line",
      "// a second header line",
      'import { a } from "./a.mjs";',
      "// a comment between imports",
      "import {",
      "  b,",
      '} from "./b.mjs";',
      "const " + T("LIMIT") + " = 7;",
      "export const " + T("OTHER") + " = 8;",
      "export async function work(x) {",
      "  // " + T("COMMENT"),
      "  /* " + T("BLOCK") + " */",
      "  return x + " + JSON.stringify(T("CODE")) + ";",
      "}",
      st,
      "  const needle = " + JSON.stringify(T("SELF")) + ";",
      "const " + T("INSIDE") + " = 1;",
      "  return needle;",
      "}",
      "function twin() { return 1; }",
      "function twin() { return 2; }",
      "function open() {",
      "  return 3;",
    ].join("\n") + "\n";
    const lf = join(box, "organ_lf.mjs"), crlf = join(box, "organ_crlf.mjs");
    writeFileSync(lf, organ);
    writeFileSync(crlf, organ.replace(/\n/g, "\r\n"));
    const work = ownCode(pathToFileURL(lf).href, { fn: "work" });
    ok("NARROW · {fn} returns the function's code and nothing of the selftest", work.includes(T("CODE")) && !work.includes(T("SELF")) && work.startsWith("export async function work(") && work.endsWith("}"), work.slice(0, 80));
    ok("NARROW · a pin whose text lives only in a comment reads false (whole-line // and /* */ blanked)", !work.includes(T("COMMENT")) && !work.includes(T("BLOCK")));
    ok("NARROW · a CRLF checkout reads the same text as an LF one", ownCode(crlf, { fn: "work" }) === work);
    ok("NARROW · a URL object, a file: string and a path read the same", ownCode(new URL(pathToFileURL(lf).href), { fn: "work" }) === work && ownCode(lf, { fn: "work" }) === work);
    ok("REFUSE · a missing anchor throws, named", throwsWith(() => ownCode(lf, { fn: "nowhere" }), /anchor not found — function nowhere/));
    ok("REFUSE · an ambiguous anchor throws, named", throwsWith(() => ownCode(lf, { fn: "twin" }), /anchor is ambiguous/));
    ok("REFUSE · a function with no column-0 } throws", throwsWith(() => ownCode(lf, { fn: "open" }), /anchor not closed/));
    ok("REFUSE · the selftest block itself is refused", throwsWith(() => ownCode(lf, { fn: "self" + "test" }), /REFUSED — the range .* touches its selftest block/));
    ok("REFUSE · a column-0 declaration INSIDE the selftest block is refused", throwsWith(() => ownCode(lf, { decl: T("INSIDE") }), /REFUSED/));
    ok("REFUSE · zero or two selectors throw", throwsWith(() => ownCode(lf, {}), /one selector/) && throwsWith(() => ownCode(lf, { fn: "work", decl: T("LIMIT") }), /one selector/));
    const lim = ownCode(lf, { decl: T("LIMIT") }), oth = ownCode(lf, { decl: T("OTHER") });
    ok("NARROW · {decl} returns the one statement line (export or not)", lim === "const " + T("LIMIT") + " = 7;" && oth === "export const " + T("OTHER") + " = 8;", `${lim} | ${oth}`);
    const imp = ownCode(crlf, { imports: true });
    ok("NARROW · {imports} returns the import block (a multi-line import included, its comments blanked, no code after it)",
      imp.includes('from "./a.mjs"') && imp.includes('} from "./b.mjs";') && !imp.includes("comment between") && !imp.includes(T("LIMIT")), imp);
    const head = ownCode(lf, { header: true });
    ok("NARROW · {header} returns the leading comment block, comments KEPT, no shebang and no import", head.includes(T("HEAD")) && head.split("\n").length === 2 && !head.includes("#!") && !head.includes("import"), head);
    const nohead = join(box, "nohead.mjs");
    writeFileSync(nohead, "const x = 1;\n");
    ok("REFUSE · a file with no header and no import throws for both", throwsWith(() => ownCode(nohead, { header: true }), /anchor not found/) && throwsWith(() => ownCode(nohead, { imports: true }), /anchor not found/));

    // THE ONE NAMED BOUND, read from a PLANTED owner (a value made at run time), then from the real one.
    const owned = join(box, "owner");
    mkdirSync(owned);
    const n = 1 + Math.floor(Math.random() * 1e6);
    writeFileSync(join(owned, CHILD_RUN_BOUND.owner), `const ${CHILD_RUN_BOUND.decl} = ${n};   // planted\r\n`);
    ok("BOUND · read from its owner's declaration, never typed (a planted owner's value comes back)", childBoundMs(owned) === n, String(childBoundMs(owned)));
    writeFileSync(join(owned, CHILD_RUN_BOUND.owner), `const ${CHILD_RUN_BOUND.decl} = Number(process.env.X);\n`);
    ok("BOUND · an owner that is not a plain integer throws, named", throwsWith(() => childBoundMs(owned), /not a plain integer/));
    rmSync(join(owned, CHILD_RUN_BOUND.owner));
    ok("BOUND · a missing owner throws", throwsWith(() => childBoundMs(owned), /ENOENT|no such file/));
    const real = childBoundMs();
    ok("BOUND · the real owner reads a positive integer", Number.isSafeInteger(real) && real > 0, String(real));

    // childRun through a RECORDED door: the bound is what the child gets.
    /** @type {any[][]} */
    const rec = Array.of();
    /** @type {any} */
    const door = (/** @type {any[]} */ ...a) => { rec.push(a); return { status: 0, signal: null, stdout: "x\r\ny", stderr: "" }; };
    const r0 = childRun("organ.mjs", ["mode"], { preload: "file:///guard.mjs", spawn: door });
    ok("CHILD · the door gets THE ONE NAMED BOUND as its timeout, the preload first, and CRLF folds",
      rec.length === 1 && rec[0][0] === process.execPath && rec[0][2].timeout === real && rec[0][1].join(" ") === "--import file:///guard.mjs organ.mjs mode" && r0.stdout === "x\ny" && r0.pass(() => true), JSON.stringify(rec[0] && rec[0][2]));
    /** @type {any} */
    const timedOut = () => ({ status: null, signal: "SIGTERM", stdout: "", stderr: "", error: Object.assign(new Error("spawnSync node ETIMEDOUT"), { code: "ETIMEDOUT" }) });
    const rk = childRun("organ.mjs", [], { spawn: timedOut });
    ok("CHILD · a child killed at the bound reads RED, named KILLED, whatever the predicate says", rk.killed && /^KILLED at the bound/.test(String(rk.why)) && rk.pass(() => true) === false, String(rk.why));
    /** @type {any} */
    const never = () => ({ status: null, signal: null, stdout: "", stderr: "", error: Object.assign(new Error("spawnSync node ENOENT"), { code: "ENOENT" }) });
    const rn = childRun("organ.mjs", [], { spawn: never });
    ok("CHILD · a child that never started reads RED, named NOT RUN", !rn.killed && /^NOT RUN/.test(String(rn.why)) && rn.pass(() => true) === false, String(rn.why));

    // A REAL child: exit, stdout, and a REAL kill at a planted owner's bound (a fraction of the real one, not a number).
    const kid = join(box, "kid.mjs");
    writeFileSync(kid, 'const m = process.argv[2]; if (m === "hang") setInterval(() => {}, 1 << 30); else { process.stdout.write("said " + m + "\\r\\n"); process.exit(m === "red" ? 3 : 0); }\n');
    const said = childRun(kid, ["hello"]), red = childRun(kid, ["red"]);
    ok("CHILD · a real child's exit and stdout come back (CRLF folded)", said.pass((c) => c.status === 0 && c.stdout === "said hello\n") && red.status === 3 && !red.killed, `${said.status} ${JSON.stringify(said.stdout)} · ${red.status}`);
    const fast = join(box, "fast");
    mkdirSync(fast);
    writeFileSync(join(fast, CHILD_RUN_BOUND.owner), `const ${CHILD_RUN_BOUND.decl} = ${Math.max(1, Math.ceil(real / 120))};\n`);
    const hung = childRun(kid, ["hang"], { boundDir: fast });
    ok("CHILD · a REAL child that hangs is killed at the bound and reads RED, named KILLED", hung.killed && /KILLED/.test(String(hung.why)) && !hung.pass(() => true), `${hung.status} ${hung.signal} ${hung.why}`);

    // THE GUARD records and refuses every child_process door inside the child.
    const gbox = mkdtempSync(join(box, "guard-"));
    const g = doorGuard(gbox);
    const spawner = join(box, "spawner.mjs");
    writeFileSync(spawner, 'import { execFileSync, spawnSync } from "node:child_process";\nlet refused = 0;\nfor (const f of [() => execFileSync("git", ["status"]), () => spawnSync("node", ["-v"])]) { try { f(); } catch { refused++; } }\nconsole.log("refused " + refused);\n');
    const gr = childRun(spawner, [], { preload: g.preload, env: { ...process.env, ...g.env } });
    ok("GUARD · every child_process door inside the child is RECORDED and REFUSED", gr.pass((c) => c.stdout.trim() === "refused 2") && g.spawned().join("|") === "execFileSync git|spawnSync node", `${gr.why || gr.stdout.trim()} · [${g.spawned().join("|")}]`);
    const quiet = childRun(kid, ["calm"], { preload: g.preload, env: { ...process.env, ...g.env } });
    ok("GUARD · a child that opens no door leaves the record as it was", quiet.pass((c) => c.status === 0) && g.spawned().length === 2);
    ok("GUARD · REFUSED outside os.tmpdir()", throwsWith(() => doorGuard(dirname(tmpdir())), /REFUSED — the guard is planted under os.tmpdir\(\) only/));

    // THE COPY: scripts/ whole, the state dir EMPTY but for the named files.
    const root = join(box, "root");
    mkdirSync(join(root, "scripts"), { recursive: true });
    mkdirSync(join(root, "dressing-room", "state"), { recursive: true });
    writeFileSync(join(root, "scripts", "organ.mjs"), "export const x = 1;\n");
    writeFileSync(join(root, "dressing-room", "state", "registry.json"), "{}\n");
    writeFileSync(join(root, "dressing-room", "state", "other.json"), "{}\n");
    const c = tempCopy({ root, prefix: "own-source-copy-" });
    const under = relative(tmpdir(), c.box);
    ok("COPY · scripts/ is copied, the state dir holds registry.json ONLY, and it lives under os.tmpdir()",
      existsSync(join(c.scripts, "organ.mjs")) && c.seeded === "registry.json" && !!under && !under.startsWith("..") && !isAbsolute(under), `${c.seeded} · ${c.box}`);
    writeFileSync(join(c.state, "written.json"), "{}\n");
    ok("COPY · listing() sees a write the seeded listing did not have", c.listing() === "registry.json,written.json" && c.seeded === "registry.json");
    c.cleanup();
    ok("COPY · cleanup() removes the copy", !existsSync(c.box));
    ok("COPY · a state name with a path in it is refused", throwsWith(() => tempCopy({ root, state: ["../x.json"] }), /bare name/));
  } finally { rmSync(box, { recursive: true, force: true }); }
  console.log(`own_source selftest: ${pass} passed, ${fail} failed`);
  return fail === 0;
}

function main() {
  const mode = (process.argv[2] || "help").toLowerCase();
  if (mode === "selftest") process.exit(selftest() ? 0 : 1);
  if (mode === "help") { console.log("own_source: a module (ownCode · childBoundMs · childRun · tempCopy · doorGuard); modes: selftest | help"); return; }
  console.error(`own_source: unknown mode "${mode}", REFUSING; modes: selftest | help`);
  process.exit(2);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
