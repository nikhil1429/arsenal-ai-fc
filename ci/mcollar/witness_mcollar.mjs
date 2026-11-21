#!/usr/bin/env node
// ============================================================================
// ci/mcollar/witness_mcollar.mjs — UNIT mcollar · THE COLLAR HOLE, THE UNIT WITNESS AGAINST BASE (forks row 1244, mplant F9 A)
// ----------------------------------------------------------------------------
// USAGE: node ci/mcollar/witness_mcollar.mjs --org <head tree> --base-org <base tree>
//   Both arguments are REQUIRED: without --base-org there is no base to read RED, and the witness is RED, never a pass.
//   The base is ci/mcollar/BASE (main at the cut); the trees may be LF trees with no .git.
// THE DEFECT (mplant spec §3.1 F-A, 8f96bd7): scripts/audit_preload.mjs patches the CJS object of node:fs (createRequire)
//   and relied on that reaching destructured ESM named imports. That holds only while nothing has instantiated the ESM
//   facade of node:fs before the collar loads. scripts/sandbox.mjs builds a collared child's NODE_OPTIONS as the CALLER's
//   NODE_OPTIONS followed by the collar, so a caller preload that imports node:fs as ESM freezes the facade first, and an
//   `import { writeFileSync } from "node:fs"` in the collared child holds the unpatched function: the write guard is skipped.
// THE COLLAR DOOR (the one the code already has): each tree's OWN scripts/sandbox.mjs exports buildSandbox / runIn /
//   assertArmed / destroy. The witness copies that tree's scripts/sandbox.mjs and scripts/audit_preload.mjs (the two files
//   the door reads) into a plant under its temp dir — a git repo made with core.autocrlf=false, files added, no commit, so
//   the door's `git ls-files` builds the sandbox from the PLANT, never from the tree — imports the PLANT's sandbox.mjs, and
//   builds the sandbox with os.tmpdir() pointed at its own temp dir (TMPDIR/TEMP/TMP, restored after), so every sandbox it
//   builds lies under it. The caller preload rides the door the way a caller's does: process.env.NODE_OPTIONS at build.
// THE ESCAPE: a child run through runIn whose whole body is an ESM named import of writeFileSync from node:fs and ONE write
//   at a path under this witness's temp dir but OUTSIDE the sandbox root — a path the guard must refuse. It prints
//   ESCAPE:WROTE or ESCAPE:DENIED:<code>; the file's absence afterwards is read too.
// THE CLAUSES
//   M:preload  each tree, two ways: BARE (no caller preload) and PRELOAD (NODE_OPTIONS = a planted file whose whole body is
//              `import "node:fs";`). HOLDS iff the head is armed (assertArmed) and DENIED with no file both ways AND the
//              base is DENIED bare (the control) and WROTE under the preload (the hole open at base).
//   BOUND      the two trees are walked (no git: the suite member hands LF trees); every file whose bytes differ (CRLF folded
//              to LF), or that exists on one side only, is one of the unit's named files. node_modules and .git are not part
//              of a tree. (BOUND is a seat-time clause: the suite member drops it.)
//   LAST       no process naming this witness's temp prefix (mcollar-wit-) survives.
// CONTRACT — every plant and every sandbox lives under os.tmpdir(); nothing of his state is read or written; the trees are
//   only read. THE PORT CLASS (row 1053): no port bound, no service named, nothing POSTed, nothing restarted, no network,
//   no model. Every child is spawnSync (through the door's runIn), so every wait ends with its child; no timeout, budget or
//   size is typed here. Every line is split on \r?\n; the plant repo is made with core.autocrlf=false. Runs on Windows.
// LAST LINE: GREEN MCOLLAR <what> · <n> clause(s) (exit 0) · RED MCOLLAR · <ids> (exit 1)
// ============================================================================
import { readFileSync, readdirSync, existsSync, mkdtempSync, mkdirSync, writeFileSync, rmSync, cpSync } from "node:fs";
import { join, resolve, relative, sep } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const CLAUSE_IDS = ["M:preload"];
const TMP_PREFIX = "mcollar-wit-";
const lines = (t) => String(t || "").split(/\r?\n/).filter((l) => l.trim());
// the unit's files (row 1244 and the brief); the effort receipt is the brief's one exception
const NAMED = [/^scripts\/audit_preload\.mjs$/, /^ci\/mcollar\/[^/]+$/, /^campaign-2026-09\/receipts_effort\/mcollar_00\.json$/];
const SKIP = new Set(["node_modules", ".git"]);
const DOOR_FILES = ["scripts/sandbox.mjs", "scripts/audit_preload.mjs"];
const ESCAPE_SRC = `import { writeFileSync } from "node:fs";
try { writeFileSync(process.env.MCOLLAR_TARGET, "mcollar escape"); console.log("ESCAPE:WROTE"); }
catch (e) { console.log("ESCAPE:DENIED:" + ((e && e.code) || "throw")); }
`;

const withTmp = (dir, fn) => {
  const keep = { TMPDIR: process.env.TMPDIR, TEMP: process.env.TEMP, TMP: process.env.TMP, NODE_OPTIONS: process.env.NODE_OPTIONS };
  process.env.TMPDIR = dir; process.env.TEMP = dir; process.env.TMP = dir;
  try { return fn(keep); } finally {
    for (const [k, v] of Object.entries(keep)) { if (v === undefined) delete process.env[k]; else process.env[k] = v; }
  }
};

/** plant a tree's collar door under T/<side>; returns its sandbox module, or a reason */
async function plantDoor(tree, T, side) {
  const p = join(T, side);
  for (const f of DOOR_FILES) {
    const src = join(tree, f);
    if (!existsSync(src)) return { why: `UNREAD · no ${f} in the ${side} tree` };
    mkdirSync(join(p, "scripts"), { recursive: true });
    cpSync(src, join(p, f));
  }
  const g = (args) => spawnSync("git", ["-c", "core.autocrlf=false", ...args], { cwd: p, encoding: "utf8", windowsHide: true });
  const i = g(["init", "-q"]);
  if (i.status !== 0) return { why: `UNREAD · git init in the ${side} plant: ${lines(i.stderr)[0] || i.status}` };
  g(["config", "core.autocrlf", "false"]);
  const a = g(["add", "-A"]);
  if (a.status !== 0) return { why: `UNREAD · git add in the ${side} plant: ${lines(a.stderr)[0] || a.status}` };
  return { mod: await import(pathToFileURL(join(p, "scripts", "sandbox.mjs")).href) };
}

/** one escape through the door: { armed, said, wrote } */
function escapeOnce(mod, T, side, mode, preloadUrl) {
  const target = join(T, "outside", `${side}_${mode}.txt`);
  const sb = withTmp(T, (keep) => {
    const base = keep.NODE_OPTIONS ? String(keep.NODE_OPTIONS) : "";
    if (preloadUrl) process.env.NODE_OPTIONS = `${base ? `${base} ` : ""}--import ${JSON.stringify(preloadUrl)}`;
    else if (base) process.env.NODE_OPTIONS = base; else delete process.env.NODE_OPTIONS;
    return mod.buildSandbox({ trace: false });
  });
  try {
    let armed = false;
    try { armed = mod.assertArmed(sb) === true; } catch { armed = false; }
    const f = join(sb.root, ".audit", "escape.mjs");
    writeFileSync(f, ESCAPE_SRC);
    const r = mod.runIn(sb, [f], { label: "mcollar-escape", env: { MCOLLAR_TARGET: target } });
    const said = lines(r.out).filter((l) => /^ESCAPE:/.test(l)).pop() || `NO-LINE (exit ${r.code})`;
    return { armed, said, wrote: existsSync(target) };
  } finally { mod.destroy(sb); }
}
const denied = (e) => e.armed && /^ESCAPE:DENIED:/.test(e.said) && !e.wrote;
const show = (e) => `${e.said}${e.wrote ? " +file" : ""}${e.armed ? "" : " UNARMED"}`;

/** every file of a tree, relative, "/"-separated */
function filesOf(root) {
  const out = [];
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (d === root && SKIP.has(e.name)) continue;
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.isFile()) out.push(relative(root, p).split(sep).join("/"));
    }
  };
  walk(root);
  return out;
}
const lf = (p) => readFileSync(p).toString("latin1").replace(/\r\n/g, "\n");
function bound(org, base) {
  const a = new Set(filesOf(org)), b = new Set(filesOf(base));
  const diff = [];
  for (const f of new Set([...a, ...b])) if (!a.has(f) || !b.has(f) || lf(join(org, f)) !== lf(join(base, f))) diff.push(f);
  const extra = diff.filter((f) => !NAMED.some((re) => re.test(f))).sort();
  return extra.length ? { ok: false, why: `${extra.length} file(s) beyond the unit's: ${extra.slice(0, 6).join(", ")}${extra.length > 6 ? " …" : ""}` }
    : { ok: true, why: `${diff.length} file(s) differ, every one named` };
}

function survivors() {
  let cmds = [];
  if (process.platform === "linux") {
    for (const pid of readdirSync("/proc").filter((x) => /^\d+$/.test(x) && Number(x) !== process.pid)) {
      try { cmds.push(readFileSync(`/proc/${pid}/cmdline`, "utf8").replace(/\0/g, " ")); } catch { /* ended while read */ }
    }
  } else if (process.platform === "win32") {
    cmds = lines(spawnSync("powershell", ["-NoProfile", "-Command", `Get-CimInstance Win32_Process | Where-Object { $_.ProcessId -ne ${process.pid} } | ForEach-Object { $_.CommandLine }`], { encoding: "utf8", windowsHide: true }).stdout);
  } else {
    cmds = lines(spawnSync("ps", ["-axww", "-o", "pid=,command="], { encoding: "utf8" }).stdout).filter((l) => Number(l.trim().split(/\s+/)[0]) !== process.pid);
  }
  return cmds.filter((c) => c.includes(TMP_PREFIX));
}

async function main() {
  const argv = process.argv.slice(2);
  const arg = (k) => { const i = argv.indexOf(k); return i >= 0 && argv[i + 1] ? resolve(argv[i + 1]) : ""; };
  const org = arg("--org"), base = arg("--base-org");
  if (!org || !base) { console.log("RED MCOLLAR · ARGS (--org and --base-org are both required)"); return 1; }
  const T = mkdtempSync(join(tmpdir(), TMP_PREFIX));
  const red = [];
  try {
    mkdirSync(join(T, "outside"), { recursive: true });
    const pre = join(T, "caller_preload.mjs");
    writeFileSync(pre, 'import "node:fs";\n');
    const preUrl = pathToFileURL(pre).href;
    const h = await plantDoor(org, T, "head"), b = await plantDoor(base, T, "base");
    if (!h.mod || !b.mod) {
      console.log(`  M:preload · ${h.why || "head planted"} · ${b.why || "base planted"} → RED`);
      red.push("M:preload");
    } else {
      const hB = escapeOnce(h.mod, T, "head", "bare", ""), hP = escapeOnce(h.mod, T, "head", "preload", preUrl);
      const bB = escapeOnce(b.mod, T, "base", "bare", ""), bP = escapeOnce(b.mod, T, "base", "preload", preUrl);
      const holeAtBase = bP.armed && bP.said === "ESCAPE:WROTE" && bP.wrote;
      const ok = denied(hB) && denied(hP) && denied(bB) && holeAtBase;
      console.log(`  M:preload · head bare ${show(hB)} · head preload ${show(hP)} · base bare ${show(bB)} · base preload ${show(bP)} → ${ok ? "HOLDS" : "RED"}`);
      if (!ok) red.push("M:preload");
    }
  } finally { rmSync(T, { recursive: true, force: true }); }
  const bd = bound(org, base);
  console.log(`  BOUND · ${bd.ok ? "GREEN" : "RED"} · ${bd.why}`);
  if (!bd.ok) red.push("BOUND");
  const left = survivors();
  console.log(`  LAST · ${left.length ? `RED · ${left.length} process(es) name ${TMP_PREFIX}` : "GREEN · no process names the temp prefix"}`);
  if (left.length) red.push("LAST");
  if (red.length) { console.log(`RED MCOLLAR · ${red.join(", ")}`); return 1; }
  console.log(`GREEN MCOLLAR an ESM named-import writeFileSync is refused through the collar door bare and under a caller preload of node:fs, the write going through at base · ${CLAUSE_IDS.length} clause(s)`);
  return 0;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exitCode = await main();
