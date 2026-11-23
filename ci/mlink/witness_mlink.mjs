#!/usr/bin/env node
// ============================================================================
// ci/mlink/witness_mlink.mjs — UNIT mlink · THE LAPTOP LINK FAULT, THE UNIT WITNESS AGAINST BASE (forks rows 1311 (4) / 1312)
// ----------------------------------------------------------------------------
// USAGE: node ci/mlink/witness_mlink.mjs --org <head tree> --base-org <base tree>
//   The base is ci/mlink/BASE (main at the cut); the trees may be LF trees with no .git (the suite member hands them so).
//   BARE FORM (row 1307 (1)): with NO --base-org the witness judges the HEAD alone — each clause HOLDS iff the head holds — and
//   BOUND is NOT judged (it is named "not judged"); no tree is ever built from a frozen sha. The last line says "bare".
// THE DEFECT (measured by the runner on his Windows laptop, Node 24; ci/mlink/PROOF.md): scripts/organism_test.mjs sandbox()
//   copied node_modules into its temp tree with cpSync(ROOT/node_modules, d/node_modules, { recursive: true }). When ROOT's
//   node_modules is itself a JUNCTION, cpSync meets the link and re-makes it in its onLink step with a plain symlinkSync and
//   no type; on win32 a non-junction symlink needs a privilege his laptop does not hold: EPERM, and the sandbox throws.
// THE PLANT: per tree and per door, a copy under os.tmpdir() (prefix mlink-wit-) of the tree's scripts/ and package.json,
//   whose node_modules is ITSELF A LINK (a junction on win32, a dir symlink elsewhere) to a REAL folder elsewhere under the
//   temp dir (a marker file inside). The plant's OWN scripts/organism_test.mjs runs `path` — the first member that builds a
//   sandbox — with a PROBE preloaded (`node --import <probe>`, a file written under the temp dir, never NODE_OPTIONS, so no
//   child inherits it). The probe wraps the fs and child_process exports the suite imports (module.syncBuiltinESMExports)
//   and reads the helper's BEHAVIOUR: the one call whose destination is <arsenal-test-*>/node_modules (cpSync or
//   symlinkSync, its source and its type), what then lies at that path (a link or a folder, its own target, its realpath),
//   and ends the child right there (exit 0) — the suite's own exit hook removes its run temp dir, the sandbox inside it,
//   with its own rm. If the sandbox spawns anything before such a call, the probe ends the child with step "none".
//   TWO DOORS: NATIVE (the host as it is) and WIN32 (his laptop's rule: process.platform reads win32, a symlinkSync whose
//   type is not "junction" throws EPERM, and a cpSync whose source is a link throws EPERM as node's win32 onLink does). On a
//   Windows host the WIN32 door adds only the privilege rule. Nothing of his state is planted or read.
// THE CLAUSES (each tree × each door; a clause HOLDS iff the head holds at every door AND the base fails at some door)
//   L:no-copy      the helper reaches node_modules WITHOUT a copy: the call that makes <tree>/node_modules is not cpSync,
//                  and what lies there is not a folder. (The base: cpSync through the link — the copy this unit removes.)
//   L:real-target  <tree>/node_modules is a link whose OWN target (one hop, readlink) is the REAL folder's realpath — never a
//                  link to the link — its realpath is that folder, and after the suite's own rm the folder's marker is whole.
//   L:junction     at the WIN32 door the link is made by symlinkSync with type "junction", with no throw.
//   BOUND          the two trees are walked (CRLF folded to LF), every file that differs or exists on one side only is one of
//                  the unit's named files; node_modules and .git are not part of a tree. BOUND is a BOUND-class clause (row
//                  1311 (1)): the suite member drops it; it is judged at adoption against the unit's parent.
//   LAST           no process naming this witness's temp prefix (mlink-wit-) survives.
// CONTRACT — every plant is a copy under os.tmpdir(); no git repo is planted. THE PORT CLASS (row 1053): no port bound, no
//   service named, nothing POSTed, nothing restarted, no network, no model. Every child is spawnSync, so every wait ends with
//   its child; no timeout, budget or size is typed. Every line is split on \r?\n; no POSIX-only shell. Runs on Windows.
// LAST LINE: GREEN MLINK <what> · <n> clause(s) (exit 0) · RED MLINK · <ids> (exit 1)
// ============================================================================
import { readFileSync, readdirSync, existsSync, mkdtempSync, mkdirSync, writeFileSync, rmSync, cpSync, symlinkSync, unlinkSync, realpathSync } from "node:fs";
import { join, relative, sep, resolve, basename } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const CLAUSE_IDS = ["L:no-copy", "L:real-target", "L:junction"];
const TMP_PREFIX = "mlink-wit-";
const MARKER = "mlink-marker.txt";
const lines = (t) => String(t || "").split(/\r?\n/).filter((l) => l.trim());
// the unit's files (row 1311 (4) and the brief); the effort receipt is the brief's one exception
const NAMED = [/^scripts\/organism_test\.mjs$/, /^ci\/mlink\/(witness_mlink\.mjs|run_mutants_mlink\.mjs|BASE|PROOF\.md|LEDGER\.jsonl)$/,
  /^campaign-2026-09\/receipts_effort\/mlink_00\.json$/];
const SKIP = new Set(["node_modules", ".git"]);
const WIN = process.platform === "win32";
const LINK_TYPE = WIN ? "junction" : "dir";

// THE PROBE — written under the temp dir, preloaded by `node --import` into the plant's suite only
const PROBE = `import fs from "node:fs";
import cp from "node:child_process";
import { syncBuiltinESMExports } from "node:module";
import { basename, dirname } from "node:path";
const LOG = process.env.MLINK_PROBE_LOG, EMU = process.env.MLINK_PROBE_WIN32 === "1";
if (EMU && process.platform !== "win32") Object.defineProperty(process, "platform", { value: "win32" });
const o = { cpSync: fs.cpSync, symlinkSync: fs.symlinkSync, mkdtempSync: fs.mkdtempSync, spawnSync: cp.spawnSync };
const lstat = fs.lstatSync, readlink = fs.readlinkSync, realpath = fs.realpathSync, write = fs.writeFileSync;
let sandboxMade = false, inCp = false;   // inCp: node's own cp may call the fs export it re-makes a link with; that call is cp's, not the helper's
const isStep = (p) => basename(String(p)) === "node_modules" && basename(dirname(String(p))).startsWith("arsenal-test-");
const look = (p) => { try { const l = lstat(p); const link = l.isSymbolicLink();
  return { exists: true, link, dir: !link && l.isDirectory(), target: link ? readlink(p) : null, real: realpath(p) }; }
  catch (e) { return { exists: false, code: String(e && e.code || e) }; } };
const eperm = (why) => Object.assign(new Error("EPERM: operation not permitted, symlink (mlink probe, win32 door: " + why + ")"), { code: "EPERM" });
const errOf = (e) => String((e && e.code) || "") + " " + String((e && e.message) || e);
function done(rec) { write(LOG, JSON.stringify(rec)); process.exit(0); }
fs.mkdtempSync = function (prefix, ...a) { const d = o.mkdtempSync.call(this, prefix, ...a); if (basename(String(prefix)).startsWith("arsenal-test-")) sandboxMade = true; return d; };
fs.cpSync = function (src, dest, ...a) {
  if (!isStep(dest)) return o.cpSync.call(this, src, dest, ...a);
  let srcLink = false; try { srcLink = lstat(src).isSymbolicLink(); } catch { /* absent */ }
  const rec = { step: "cpSync", src: String(src), srcLink, type: null, error: null };
  inCp = true;
  try { if (EMU && srcLink) throw eperm("cp meets a link and re-makes it with no type, node:internal/fs/cp onLink"); o.cpSync.call(this, src, dest, ...a); }
  catch (e) { rec.error = errOf(e); } finally { inCp = false; }
  done({ ...rec, dest: look(dest) });
};
fs.symlinkSync = function (target, path, type) {
  if (!isStep(path) || inCp) return o.symlinkSync.apply(this, arguments);
  const rec = { step: "symlinkSync", src: String(target), type: type === undefined ? null : type, error: null };
  try { if (EMU && type !== "junction") throw eperm("a non-junction symlink needs a privilege"); o.symlinkSync.apply(this, arguments); }
  catch (e) { rec.error = errOf(e); }
  done({ ...rec, dest: look(path) });
};
cp.spawnSync = function () { if (sandboxMade) done({ step: "none", src: null, type: null, error: null, dest: null }); return o.spawnSync.apply(this, arguments); };
syncBuiltinESMExports();
`;

const norm = (p) => { if (!p) return ""; let s = String(p).replace(/^\\\\\?\\/, ""); s = resolve(s); return WIN ? s.toLowerCase() : s; };

/** one plant of <tree> at <door>: what the suite's helper made at the sandbox's node_modules */
function probe(T, tree, door) {
  const P = mkdtempSync(join(T, `plant-${door}-`));
  const plant = join(P, "tree"), real = join(P, "real_nm"), tmp = join(P, "tmp"), log = join(P, "probe.json");
  mkdirSync(join(real, "pkg"), { recursive: true });
  writeFileSync(join(real, MARKER), "the real folder\n");
  writeFileSync(join(real, "pkg", "index.js"), "export default 1;\n");
  mkdirSync(tmp);
  if (!existsSync(join(tree, "scripts", "organism_test.mjs"))) return { tree, door, rec: null, why: "UNREAD · no scripts/organism_test.mjs" };
  cpSync(join(tree, "scripts"), join(plant, "scripts"), { recursive: true });
  if (existsSync(join(tree, "package.json"))) cpSync(join(tree, "package.json"), join(plant, "package.json"));
  symlinkSync(real, join(plant, "node_modules"), LINK_TYPE);
  const probeFile = join(T, "mlink_probe.mjs");
  if (!existsSync(probeFile)) writeFileSync(probeFile, PROBE);
  const env = { ...process.env, TMPDIR: tmp, TEMP: tmp, TMP: tmp, MLINK_PROBE_LOG: log, MLINK_PROBE_WIN32: door === "win32" ? "1" : "0" };
  delete env.ORGANISM_TEST_PROFILE;
  const r = spawnSync(process.execPath, ["--import", pathToFileURL(probeFile).href, join(plant, "scripts", "organism_test.mjs"), "path"],
    { cwd: plant, env, encoding: "utf8", windowsHide: true });
  let rec = null;
  try { rec = JSON.parse(readFileSync(log, "utf8")); } catch { /* no step reached */ }
  const marker = existsSync(join(real, MARKER));
  const left = existsSync(tmp) ? readdirSync(tmp) : [];
  const out = { tree, door, rec, marker, left, realPath: realpathSync(real), exit: r.status,
    why: rec ? "" : `the probe saw no step (exit ${r.status}): ${(lines(r.stderr).pop() || lines(r.stdout).pop() || "").slice(0, 160)}` };
  try { unlinkSync(join(plant, "node_modules")); } catch { /* none */ }
  rmSync(P, { recursive: true, force: true });
  return out;
}

const said = (p) => p.rec ? `${p.rec.step}${p.rec.type ? `(${p.rec.type})` : ""}${p.rec.error ? ` threw ${p.rec.error.split(" ")[0] || "an error"}` : ""}` + (p.rec.dest ? ` → ${!p.rec.dest.exists ? "absent" : p.rec.dest.link ? "link" : p.rec.dest.dir ? "FOLDER" : "file"}` : "") : p.why;
const C = {
  "L:no-copy": (p) => !!p.rec && p.rec.step !== "none" && p.rec.step !== "cpSync" && !!p.rec.dest && p.rec.dest.exists && !p.rec.dest.dir,
  "L:real-target": (p) => !!p.rec && !!p.rec.dest && p.rec.dest.exists && p.rec.dest.link
    && norm(p.rec.dest.target) === norm(p.realPath) && norm(p.rec.dest.real) === norm(p.realPath) && p.marker,
  "L:junction": (p) => p.door !== "win32" || (!!p.rec && p.rec.step === "symlinkSync" && p.rec.type === "junction" && !p.rec.error && !!p.rec.dest && p.rec.dest.exists && p.rec.dest.link),
};

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
  } else if (WIN) {
    cmds = lines(spawnSync("powershell", ["-NoProfile", "-Command", `Get-CimInstance Win32_Process | Where-Object { $_.ProcessId -ne ${process.pid} } | ForEach-Object { $_.CommandLine }`], { encoding: "utf8", windowsHide: true }).stdout);
  } else {
    cmds = lines(spawnSync("ps", ["-axww", "-o", "pid=,command="], { encoding: "utf8" }).stdout).filter((l) => Number(l.trim().split(/\s+/)[0]) !== process.pid);
  }
  return cmds.filter((c) => c.includes(TMP_PREFIX));
}

function main(argv) {
  const at = (f) => { const i = argv.indexOf(f); return i >= 0 && argv[i + 1] ? resolve(argv[i + 1]) : null; };
  const org = at("--org"), base = at("--base-org");
  if (!org) { console.log("USAGE: node ci/mlink/witness_mlink.mjs --org <head tree> [--base-org <base tree>]"); console.log("RED MLINK · L:no-copy, L:real-target, L:junction"); return 1; }
  const bare = !base;
  const T = mkdtempSync(join(tmpdir(), TMP_PREFIX));
  const red = [];
  try {
    const doors = ["native", "win32"];
    const H = doors.map((d) => probe(T, org, d));
    const B = bare ? [] : doors.map((d) => probe(T, base, d));
    console.log(`MLINK · head ${basename(org)}${bare ? " · bare (no --base-org): the head alone, BOUND not judged (row 1307 (1))" : ` · base ${basename(base)}`} · ${process.platform} · node ${process.version}`);
    for (const id of CLAUSE_IDS) {
      const h = H.every(C[id]);
      const b = bare ? null : B.some((p) => !C[id](p));
      const ok = h && (bare || b);
      if (!ok) red.push(id);
      const side = (ps) => ps.map((p) => `${p.door} ${C[id](p) ? "holds" : "fails"} [${said(p)}]`).join(" · ");
      console.log(`  ${id} · head: ${side(H)}${bare ? "" : ` · base: ${side(B)}`} → ${ok ? "HOLDS" : "RED"}`);
    }
    if (bare) console.log("  BOUND · not judged: no --base-org (row 1307 (1)); never against a frozen sha");
    else {
      const bd = bound(org, base);
      if (!bd.ok) red.push("BOUND");
      console.log(`  BOUND · ${bd.why} → ${bd.ok ? "HOLDS" : "RED"}`);
    }
    const leftovers = [...H, ...B].filter((p) => p.left && p.left.length);
    if (leftovers.length) console.log(`  measured · the suite's run temp dir kept ${leftovers.map((p) => p.left.join(",")).join(" · ")}`);
  } finally { rmSync(T, { recursive: true, force: true }); }
  const sv = survivors();
  if (sv.length) red.push("LAST");
  console.log(`  LAST · ${sv.length} process(es) naming ${TMP_PREFIX} → ${sv.length ? "RED" : "HOLDS"}`);
  if (red.length) { console.log(`RED MLINK · ${red.join(", ")}`); return 1; }
  const n = CLAUSE_IDS.length + (bare ? 0 : 1) + 1;
  console.log(bare ? `GREEN MLINK bare: the head's sandbox links node_modules to the REAL folder (a junction at the win32 door), no copy through a link · ${n} clause(s)`
    : `GREEN MLINK the sandbox links node_modules to the REAL folder (a junction at the win32 door), no copy through a link; the base copies through it (EPERM at the win32 door) · ${n} clause(s)`);
  return 0;
}
process.exitCode = main(process.argv.slice(2));
