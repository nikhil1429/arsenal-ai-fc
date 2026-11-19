#!/usr/bin/env node
// ============================================================================
// ci/mxw/witness_mxw.mjs — UNIT mxw · xray reads an OPTIONS-BAG DEFAULT path (forks rows 1108 / 1109 / 1122)
// ----------------------------------------------------------------------------
// USAGE: node ci/mxw/witness_mxw.mjs --org <dir> --base-org <dir> [--only <clause>[,<clause>…]]
//   --org       the tree to witness (the build reads GREEN; the base 224f9b9 reads RED on W1 W2 W5)
//   --base-org  the BASE tree (main 224f9b9) — W6 and BOUND need it; absent, both are RED
//   --only      run only the groups holding these clause ids (the mutant runner's door); BOUND and LAST always run
// CONTRACT — every plant runs on a COPY under os.tmpdir(), never on --org or --base-org themselves:
//   PLANT  a tree holding ONLY the --org copy of scripts/xray.mjs, a stub package.json and ONE fixture organ (the four
//          shapes below); xray's build() runs in a CHILD node and prints writer facts (paths + organ names only).
//   LIVE   a copy of each of --org and --base-org WITHOUT .git, node_modules (a link) and dressing-room/state (an EMPTY dir:
//          nothing of his is copied, nothing printed); build() + queries() run in a child node per tree and print only
//          paths, organ names and the Q2 / Q5 keys.
//   No port is bound, no service named, no daemon touched, no model called (no claude, no key); no git repo is planted
//   (so core.autocrlf has nothing to clone or init — row 1036); every line read from a child is split on \r?\n, BOUND
//   hashes text with CRLF folded to LF, and processes are listed through PowerShell on Windows, `ps` elsewhere. Every
//   child is synchronous (spawnSync), so every wait is bounded by the child's own exit; no timeout is typed.
// CLAUSES (spec ci/mxw/MXW_SPEC.md @ e4013cb §5; ruling row 1122 (1): F1 A — where they differ, the ruling wins):
//   W1    options bag with `= {}` default through a helper (the notes_corrections.mjs:106 / :86 / :91 shape)
//         `add(p = {}, { path = LEDGER } = {}) → appendChecked(path)` → the fixture IS the writer of w1_bag.jsonl
//   W2    options bag + join(dir, NAME) (the learnstate.mjs:794 / :806 shape) → the fixture writes w2_dir.jsonl
//   W3    nothing invented: a destructured slot with NO default, a module const of the SAME name in scope
//         `noDefault(t, { path } = {})` → w3_shadow.jsonl is NOT a writer fact (the shorthand is not its own default)
//   W4    the old shape is still read: `plain(t, path = join(STATE, "w4_plain.jsonl"))` → the fixture writes it
//   W5    live, on the --org tree: dressing-room/state/notes_corrections.jsonl has writers exactly [notes_corrections.mjs]
//         and dressing-room/state/brief_log.jsonl exactly [learnstate.mjs] (each its own header's SOLE WRITER)
//   W6    live: the build makes NO second writer — no Q2 entry and no Q5 entry on --org that is not on --base-org
//   BOUND only the named files differ from --base-org: scripts/xray.mjs and ci/mxw/** (this unit's own output)
//   LAST  no node process naming the temp root survives
// LAST LINE: GREEN MXW <what> · <n> clause(s) (exit 0) or RED MXW · <clauses> (exit 1)
// ============================================================================
import { mkdtempSync, mkdirSync, copyFileSync, cpSync, writeFileSync, readFileSync, readdirSync, statSync, existsSync, symlinkSync, rmSync } from "node:fs";
import { join, resolve, relative, sep, dirname } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const ORG = arg("--org") ? resolve(arg("--org")) : null, BASE = arg("--base-org") ? resolve(arg("--base-org")) : null;
const ONLY = arg("--only") ? arg("--only").split(",").map((s) => s.trim()).filter(Boolean) : null;
const NODE = process.execPath;
const SD = ["dressing-room", "state"].join("/");
const HERE = dirname(fileURLToPath(import.meta.url));
const T = mkdtempSync(join(tmpdir(), "mxw-witness-"));
const results = [];   // { id, ok, why }
const clause = (id, ok, why = "") => { results.push({ id, ok: !!ok, why }); console.log(`  ${ok ? "GREEN" : "RED  "} ${id}${why ? ` — ${why}` : ""}`); };
const want = (...ids) => !ONLY || ids.some((id) => ONLY.includes(id));

/** node_modules for a planted tree: the tree's own, else the one beside this witness's repo, else the cwd's */
function nodeModulesFor(tree) {
  for (const c of [tree && join(tree, "node_modules"), join(HERE, "..", "..", "node_modules"), join(process.cwd(), "node_modules")])
    if (c && existsSync(join(c, "acorn"))) return c;
  return null;
}
const link = (target, at) => symlinkSync(target, at, process.platform === "win32" ? "junction" : "dir");

/** run a child node script (written under T), return its LAST stdout line parsed as JSON, or { error } */
function child(script, cwd) {
  const f = join(T, `child_${results.length}_${Math.random().toString(36).slice(2)}.mjs`);
  writeFileSync(f, script);
  const r = spawnSync(NODE, [f], { cwd, encoding: "utf8", windowsHide: true, env: { ...process.env, ANTHROPIC_API_KEY: "" } });
  const last = String(r.stdout || "").split(/\r?\n/).map((s) => s.trim()).filter(Boolean).pop() || "";
  try { return JSON.parse(last); } catch { return { error: `exit ${r.status}: ${String(r.stderr || "").split(/\r?\n/).filter(Boolean).slice(-1)[0] || "no JSON line"}` }; }
}

// ── PLANT: W1 W2 W3 W4 ──────────────────────────────────────────────────────
function plant() {
  const P = join(T, "plant");
  mkdirSync(join(P, "scripts"), { recursive: true }); mkdirSync(join(P, ...SD.split("/")), { recursive: true });
  const src = ORG && join(ORG, "scripts", "xray.mjs");
  if (!src || !existsSync(src)) { for (const id of ["W1", "W2", "W3", "W4"]) clause(id, false, "--org carries no scripts/xray.mjs"); return; }
  copyFileSync(src, join(P, "scripts", "xray.mjs"));
  const nm = nodeModulesFor(ORG);
  if (!nm) { for (const id of ["W1", "W2", "W3", "W4"]) clause(id, false, "no node_modules with acorn to link"); return; }
  link(nm, join(P, "node_modules"));
  writeFileSync(join(P, "package.json"), JSON.stringify({ name: "mxw-plant", type: "module", scripts: {} }));
  writeFileSync(join(P, "scripts", "fixture_bag.mjs"), [
    'import { appendFileSync } from "node:fs"; import { join, dirname } from "node:path"; import { fileURLToPath } from "node:url";',
    "const __dirname = dirname(fileURLToPath(import.meta.url));",
    'const STATE = join(__dirname, "..", "dressing-room", "state");',
    'export const LEDGER = join(STATE, "w1_bag.jsonl");',
    'const path = join(STATE, "w3_shadow.jsonl");   // W3: a module const of the SAME name as the no-default slot',
    "export const SHADOW = path;",
    'function appendChecked(p, row) { appendFileSync(p, JSON.stringify(row) + "\\n"); }',
    "export function add(p = {}, { path = LEDGER, now = 0 } = {}) { return appendChecked(path, p); }",
    'export function record(t, { dir = STATE } = {}) { appendFileSync(join(dir, "w2_dir.jsonl"), t); }',
    "export function noDefault(t, { path } = {}) { appendFileSync(path, t); }",
    'export function plain(t, path = join(STATE, "w4_plain.jsonl")) { appendFileSync(path, t); }',
    "",
  ].join("\n"));
  const out = child([
    `const x = await import(${JSON.stringify(pathToFileURL(join(P, "scripts", "xray.mjs")).href)});`,
    "const ir = x.build();",
    'const mine = ir.files.filter((f) => f.writers.includes("fixture_bag.mjs")).map((f) => f.path);',
    "console.log(JSON.stringify({ mine }));",
  ].join("\n"), P);
  if (out.error) { for (const id of ["W1", "W2", "W3", "W4"]) clause(id, false, `xray build() failed in the plant: ${out.error}`); return; }
  const has = (n) => out.mine.includes(`${SD}/${n}`);
  clause("W1", has("w1_bag.jsonl"), has("w1_bag.jsonl") ? "" : "the options-bag default through a helper is not a writer fact");
  clause("W2", has("w2_dir.jsonl"), has("w2_dir.jsonl") ? "" : "the options-bag join(dir, NAME) default is not a writer fact");
  const invented = out.mine.filter((p) => !/\/w[124]_[a-z]+\.jsonl$/.test(p));
  clause("W3", invented.length === 0, invented.length ? `invented writer fact(s): ${invented.join(", ")}` : "");
  clause("W4", has("w4_plain.jsonl"), has("w4_plain.jsonl") ? "" : "the bare `p = X` default is no longer read");
}

// ── LIVE: W5 W6 ─────────────────────────────────────────────────────────────
/** copy a tree under T without .git, node_modules (a link) and the state dir's content (an EMPTY dir) */
function liveCopy(from, name) {
  const to = join(T, name);
  const skip = new Set([".git", "node_modules"]);
  cpSync(from, to, { recursive: true, filter: (s) => { const r = relative(from, s).split(sep).join("/"); return !(skip.has(r.split("/")[0]) || r === SD || r.startsWith(SD + "/")); } });
  mkdirSync(join(to, ...SD.split("/")), { recursive: true });
  const nm = nodeModulesFor(from);
  if (nm) link(nm, join(to, "node_modules"));
  return to;
}
function liveFacts(tree) {
  return child([
    `const x = await import(${JSON.stringify(pathToFileURL(join(tree, "scripts", "xray.mjs")).href)});`,
    "const ir = x.build(); const q = x.queries(ir);",
    "const w = (p) => { const f = ir.files.find((g) => g.path === p); return f ? [...f.writers].sort() : null; };",
    `const nc = w(${JSON.stringify(SD + "/notes_corrections.jsonl")}), bl = w(${JSON.stringify(SD + "/brief_log.jsonl")});`,
    'const q2 = q.Q2.map((f) => `${f.path} <- ${[...f.writers].sort().join("+")}`);',
    'const q5 = q.Q5.map((f) => `${f.path} declared ${f.declared_by} undeclared ${[...f.undeclared].sort().join("+")}`);',
    "console.log(JSON.stringify({ nc, bl, q2, q5 }));",
  ].join("\n"), tree);
}
function live() {
  if (!ORG || !existsSync(join(ORG, "scripts", "xray.mjs"))) { clause("W5", false, "--org carries no scripts/xray.mjs"); clause("W6", false, "--org absent"); return; }
  const o = liveFacts(liveCopy(ORG, "org"));
  if (o.error) { clause("W5", false, `build() on the --org copy failed: ${o.error}`); clause("W6", false, "no --org facts"); return; }
  const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const okNc = eq(o.nc, ["notes_corrections.mjs"]), okBl = eq(o.bl, ["learnstate.mjs"]);
  clause("W5", okNc && okBl, [okNc ? "" : `notes_corrections.jsonl writers ${JSON.stringify(o.nc)}`, okBl ? "" : `brief_log.jsonl writers ${JSON.stringify(o.bl)}`].filter(Boolean).join(" · "));
  if (!BASE || !existsSync(join(BASE, "scripts", "xray.mjs"))) { clause("W6", false, "--base-org absent"); return; }
  const b = liveFacts(liveCopy(BASE, "base"));
  if (b.error) { clause("W6", false, `build() on the --base-org copy failed: ${b.error}`); return; }
  const new2 = o.q2.filter((k) => !b.q2.includes(k)), new5 = o.q5.filter((k) => !b.q5.includes(k));
  clause("W6", new2.length === 0 && new5.length === 0, [...new2.map((k) => `new Q2 ${k}`), ...new5.map((k) => `new Q5 ${k}`)].join(" · "));
  console.log(`  (measured: Q2 ${b.q2.length} → ${o.q2.length} · Q5 ${b.q5.length} → ${o.q5.length})`);
}

// ── BOUND ───────────────────────────────────────────────────────────────────
const NAMED = (p) => p === "scripts/xray.mjs" || p.startsWith("ci/mxw/");
function listTree(root) {
  const out = new Map();
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const abs = join(d, e.name), rel = relative(root, abs).split(sep).join("/");
      if (rel === ".git" || rel === "node_modules" || rel.startsWith(".git/")) continue;
      if (e.isDirectory()) walk(abs);
      else if (e.isFile()) out.set(rel, createHash("sha256").update(readFileSync(abs, "utf8").replace(/\r\n/g, "\n")).digest("hex"));
    }
  };
  walk(root);
  return out;
}
function bound() {
  if (!ORG || !BASE) { clause("BOUND", false, "--org and --base-org are both needed"); return; }
  const a = listTree(ORG), b = listTree(BASE);
  const diff = [...new Set([...a.keys(), ...b.keys()])].filter((p) => a.get(p) !== b.get(p)).sort();
  const beyond = diff.filter((p) => !NAMED(p));
  clause("BOUND", beyond.length === 0, beyond.length ? `beyond the named files: ${beyond.slice(0, 8).join(", ")}${beyond.length > 8 ? ` (+${beyond.length - 8})` : ""}` : `differs only in ${diff.length} named file(s)`);
}

// ── LAST ────────────────────────────────────────────────────────────────────
function survivors() {
  const r = process.platform === "win32"
    ? spawnSync("powershell", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | ForEach-Object { \"$($_.ProcessId) $($_.CommandLine)\" }"], { encoding: "utf8", windowsHide: true })
    : spawnSync("ps", ["-eo", "pid=,args="], { encoding: "utf8" });
  return String(r.stdout || "").split(/\r?\n/).map((s) => s.trim()).filter((l) => l && l.includes(T) && !l.startsWith(`${process.pid} `));
}

// ── run ─────────────────────────────────────────────────────────────────────
try {
  if (want("W1", "W2", "W3", "W4")) plant();
  if (want("W5", "W6")) live();
  bound();
} finally {
  const left = survivors();
  clause("LAST", left.length === 0, left.length ? `${left.length} node process(es) name the temp root` : "");
  rmSync(T, { recursive: true, force: true });
}
const red = results.filter((r) => !r.ok).map((r) => r.id);
if (red.length) { console.log(`RED MXW · ${red.join(" ")}`); process.exit(1); }
console.log(`GREEN MXW xray reads an options-bag default path · ${results.length} clause(s)`);
process.exit(0);
