#!/usr/bin/env node
// ci/mdet/witness_mdet.mjs — unit mdet (forks row 1151 (3) F3 B) · THE WITNESS. Its header is its contract.
// ----------------------------------------------------------------------------------------------------------------------
// USAGE: node ci/mdet/witness_mdet.mjs --org <build checkout> --base-org <base checkout> [--bound-org <parent checkout>]
//   --bound-org (forks row 1200 (2), THE BOUND CLASS): after a main-moved merge the CLAUSES are judged against --base-org
//   (the tree of ci/mdet/BASE) and the BOUND against the parent named here; absent, the bound reads --base-org.
//   An org is a git checkout (~~the witness CLONES its HEAD with core.autocrlf=false, so a Windows checkout plants LF bytes
//   exactly as committed~~ — struck by forks row 1226 (2): false under the repo's `* text=auto`, where core.eol defaults to
//   native and a Windows clone wrote CRLF, so C4 read judged 0 / moved 140; the witness CLONES its HEAD with
//   core.autocrlf=false AND core.eol=lf, on the command and in the clone's config, so a Windows checkout plants LF bytes
//   exactly as committed) or a plain tree (the suite's WITNESSES member hands LF work trees with no .git: the witness COPIES
//   it, node_modules and .git left out). It never runs in, writes to or reads the state of either org: BOUND reads
//   `git ls-files -s` of two checkouts, or the bytes of two plain trees. Every plant is written under os.tmpdir().
// THE PLANTS (one planted tree per org; none of them is named by any suite string, so the coverage law must call every plant
// that HAS a selftest an orphan, and must call no plant that has none an orphan):
//   mdet_comment.mjs  · the word only in comments: a backticked `selftest`, a commented-out dispatch and declaration.
//   mdet_string.mjs   · the word only in string literals: a whole "selftest" literal assigned, and a dispatch-looking string.
//   mdet_dispatch.mjs · a real dispatch: `if (mode === "selftest")`.
//   mdet_case.mjs     · a real dispatch: `case "selftest":`.
//   mdet_selfrun.mjs  · a script run bare IS its selftest: its own selftest() called in code (the claudegen class).
//   mdet_decl.mjs     · a selftest() declaration nobody calls, and another object's .selftest() call: no selftest.
// CLAUSES (each must read RED on the base and GREEN on the build). `cov` = the planted tree's
// `ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs coverage`; `census` = its `node scripts/organism_test.mjs census`.
//   C1 COMMENT  · mdet_comment reads NO selftest: cov names no orphan mdet_comment, and its census row reads
//                 `| mdet_comment.mjs | has | <line> | none | — | — | MOVES has → none |`.
//   C2 STRING   · mdet_string reads NO selftest, the same two ways (census row `| mdet_string.mjs | has | … | none | … MOVES has → none |`).
//   C3 DISPATCH · mdet_dispatch and mdet_case read HAS a selftest: each census row is `has … | dispatch | <the planted line> |`,
//                 and cov names each an orphan (the law consumes the detector).
//   C4 CENSUS   · (re-cut by forks row 1224 (2)) the frozen table between `<!-- census:begin -->` and `<!-- census:end -->`
//                 in ci/mdet/PROOF.md carries each organ's blob; a row is JUDGED (the tree's census row must equal it) only
//                 when that organ's bytes in the tree are the bytes the table was written on. A moved organ is NAMED and
//                 COUNTED, never judged; an organ absent from the table is NAMED, never red; at least one row is judged.
//                 PLANT: the same tree with one line added at the head of a judged dispatch organ reads C4 GREEN, that
//                 organ named moved (the line is then taken back out). Before the re-cut C4 compared every row, line numbers
//                 and all, so it red whenever another unit moved a line of a listed organ (land/mdet 72c9add).
//   C5 SELF-RUN · mdet_selfrun reads HAS (`self-run` at its call line, an orphan in cov) and mdet_decl reads NONE (no orphan,
//                 census `none`): a gate as strict as before for a bare-run script, and a declaration is not a run.
// BOUND (not a both-ways clause): every path whose content differs between the two orgs is a named file —
//   package.json, scripts/organism_test.mjs, or a path under ci/mdet/.
// LAST: no process whose command line names the witness's temp root survives (read from /proc on Linux, from
//   Get-CimInstance on Windows, from ps elsewhere — never through a shell); the temp root is then removed.
// PORT CLASS (row 1053): the witness binds no port, names no live service, POSTs nothing and restarts nothing. The modes it
//   runs (coverage, census) read files only and spawn nothing; every child it spawns is bounded by the suite file's own
//   long bound, read from the planted tree (`const HEAVY_BOUND_MS = <n>;`), never typed here.
// EXIT / LAST LINE: `GREEN MDET <what> · <n> clause(s)` (exit 0) or `RED MDET · <clauses>` (exit 1).
// EXPORTS (for ci/mdet/run_mutants_mdet.mjs): plantTree(org, into, modules) · judgeAll(dir) · judgeCensus(dir, rows, table) · CLAUSES · survivors(root).
// ----------------------------------------------------------------------------------------------------------------------
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, realpathSync, writeFileSync, cpSync, statSync } from "node:fs";
import { join, resolve, relative, sep } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";

export const CLAUSES = ["C1 COMMENT", "C2 STRING", "C3 DISPATCH", "C4 CENSUS", "C5 SELF-RUN"];
const NAMED = [/^package\.json$/, /^scripts\/organism_test\.mjs$/, /^ci\/mdet\//];
const NL = /\r?\n/;
const git = (cwd, args) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
const childEnv = () => { const e = { ...process.env, ORGANISM_TEST_PROFILE: "hermetic" }; delete e.NODE_OPTIONS; return e; };

// the plants: name → [source lines]; MARK names the line the detector must report (its dispatch or self-run call)
const PLANTS = {
  mdet_comment: [
    "// planted by ci/mdet/witness_mdet.mjs: the word lives only in comments",
    "// usage: node scripts/mdet_comment.mjs `selftest` runs nothing; if (mode === \"selftest\") { run() } is prose here",
    "/* function selftest() { return true; }",
    "   switch (mode) { case \"selftest\": selftest(); } */",
    "console.log(\"mdet_comment: no modes\");",
  ],
  mdet_string: [
    "// planted by ci/mdet/witness_mdet.mjs: the word lives only in string literals",
    "const HELP = \"selftest\";",
    "const SAY = \"if (mode === 'selftest') selftest()\";",
    "const TPL = `case 'selftest': run()`;",
    "console.log(\"mdet_string modes:\", HELP, SAY, TPL);",
  ],
  mdet_dispatch: [
    "// planted by ci/mdet/witness_mdet.mjs: a real dispatch on the word",
    "const mode = process.argv[2];",
    "if (mode === \"selftest\") { console.log(\"mdet_dispatch selftest: 1 passed, 0 failed\"); process.exit(0); } // MARK",
  ],
  mdet_case: [
    "// planted by ci/mdet/witness_mdet.mjs: a real dispatch by a case label",
    "switch (process.argv[2]) {",
    "  case \"selftest\": console.log(\"mdet_case selftest: 1 passed, 0 failed\"); break; // MARK",
    "  default: console.log(\"mdet_case: usage\");",
    "}",
  ],
  mdet_selfrun: [
    "// planted by ci/mdet/witness_mdet.mjs: run bare, it IS its selftest",
    "function selftest() { console.log(\"mdet_selfrun selftest: 1 passed, 0 failed\"); return true; }",
    "process.exit(selftest() ? 0 : 1); // MARK",
  ],
  mdet_decl: [
    "// planted by ci/mdet/witness_mdet.mjs: a declaration nobody calls, and another object's selftest",
    "export function selftest() { return true; }",
    "const other = { selftest() { return 1; } };",
    "console.log(\"mdet_decl:\", other.selftest());",
  ],
};
const markLine = (name) => PLANTS[name].findIndex((l) => l.includes("// MARK")) + 1;

/** true when <d> is the top of a git work tree (a seat checkout), false for a plain tree (the member's) @param {string} d */
function isRepo(d) {
  const r = spawnSync("git", ["-C", d, "rev-parse", "--show-toplevel"], { encoding: "utf8", windowsHide: true });
  if (r.status !== 0) return false;
  try { return realpathSync(String(r.stdout).trim()).toLowerCase() === realpathSync(d).toLowerCase(); } catch { return false; }
}
/** plant <org> under <into>: a clone of a checkout's HEAD (core.autocrlf=false), or a copy of a plain tree; then link a
 *  node_modules (the org's, else <modules>) @returns {string} the planted dir */
export function plantTree(org, into, modules = null) {
  const dir = join(into, "tree"), src = resolve(org);
  // forks row 1226 (2): core.eol=lf beside core.autocrlf=false, on the command and in the clone's own config — under the repo's
  // `* text=auto` a Windows clone with no eol setting writes CRLF (core.eol defaults to native), and every organ blob read moved
  if (isRepo(src)) execFileSync("git", ["-c", "core.autocrlf=false", "-c", "core.eol=lf", "clone", "-q", "-c", "core.autocrlf=false", "-c", "core.eol=lf", src, dir], { stdio: ["ignore", "pipe", "pipe"] });
  else cpSync(src, dir, { recursive: true, filter: (s) => { const r = relative(src, s).split(sep)[0]; return r !== "node_modules" && r !== ".git"; } });
  const mods = [join(src, "node_modules"), modules].find((p) => p && existsSync(p));
  if (mods) symlinkSync(realpathSync(mods), join(dir, "node_modules"), process.platform === "win32" ? "junction" : "dir");
  return dir;
}

/** the long bound the planted suite file gives its heavy modes and members (`const HEAVY_BOUND_MS = <n>;`), read, never
 *  typed; NaN when unreadable (then the child runs unbounded by the witness and the run helper's own bounds hold) */
function memberBound(dir) {
  let src = ""; try { src = readFileSync(join(dir, "scripts", "organism_test.mjs"), "utf8"); } catch { /* absent: NaN */ }
  const m = /const HEAVY_BOUND_MS = (\d+);/.exec(src);
  return m ? Number(m[1]) : NaN;
}
const node = (dir, args, timeout) => { const r = spawnSync(process.execPath, args, { cwd: dir, env: childEnv(), encoding: "utf8", windowsHide: true, maxBuffer: 1 << 28, ...(timeout > 0 ? { timeout } : {}) }); return { code: r.status, out: (r.stdout || "") + (r.stderr || "") + (r.error ? `\n${r.error.code || r.error.message}` : "") }; };

/** the table rows of a census text (markdown rows naming a .mjs), CRLF-proof @param {string} t @returns {string[]} */
const rowsOf = (t) => t.split(NL).map((l) => l.trimEnd()).filter((l) => /^\| [A-Za-z0-9_\-]+\.mjs \|/.test(l));

/** the git blob id of a file's bytes — sha1 of "blob <len>\0" + bytes, what `git hash-object` prints; null when absent */
const blobOf = (p) => { try { const b = readFileSync(p); return createHash("sha1").update(`blob ${b.length}\0`).update(b).digest("hex"); } catch { return null; } };
/** C4, re-cut by forks row 1224 (2): a row of the frozen table (`| <script> | … | <blob> |`) is JUDGED — the tree's census row
 *  must equal it, blob cell aside — only when the organ's bytes in <dir> are the bytes the table was written on (its blob);
 *  an organ whose blob moved (or that is gone) is NAMED and COUNTED, never judged; a census row absent from the table is
 *  NAMED, never red. Green iff at least one row is judged and every judged row equals its census row.
 *  @param {string} dir @param {string[]} census the tree's census rows @param {string} table the PROOF block */
export function judgeCensus(dir, census, table) {
  const got = new Map(census.filter((r) => !/^\| mdet_/.test(r)).map((r) => [r.split(" | ")[0].slice(2), r]));
  const entries = rowsOf(table).map((r) => { const m = /^(.*\|) ([0-9a-f]{40}) \|$/.exec(r); return { file: r.split(" | ")[0].slice(2), stem: m ? m[1] : null, blob: m ? m[2] : null }; });
  const unkeyed = entries.filter((t) => !t.blob).map((t) => t.file);
  const judgedRows = [], moved = [], wrong = [];
  for (const t of entries.filter((x) => x.blob)) {
    const cur = blobOf(join(dir, "scripts", t.file));
    if (cur === t.blob) { judgedRows.push(t); if (got.get(t.file) !== t.stem) wrong.push(`${t.file}: table ${t.stem} · census ${got.get(t.file) || "(no row)"}`); }
    else moved.push(t.file);
  }
  const listed = new Set(entries.map((t) => t.file)), absent = [...got.keys()].filter((f) => !listed.has(f));
  const green = judgedRows.length > 0 && wrong.length === 0 && unkeyed.length === 0;
  const why = `judged ${judgedRows.length}${wrong.length ? ` · WRONG ${wrong.slice(0, 2).join(" ; ")}` : ""}${unkeyed.length ? ` · UNKEYED rows ${unkeyed.slice(0, 3).join(", ")}` : ""} · moved ${moved.length}${moved.length ? ` (${moved.join(", ")})` : ""} · absent ${absent.length}${absent.length ? ` (${absent.join(", ")})` : ""}`;
  return { green, why, judgedRows, moved, absent };
}

/** judge EVERY clause on one planted tree (it is changed: the plants are written into it first)
 *  @param {string} dir @returns {Record<string, {green: boolean, why: string}>} */
export function judgeAll(dir) {
  for (const [n, lines] of Object.entries(PLANTS)) writeFileSync(join(dir, "scripts", `${n}.mjs`), lines.join("\n") + "\n");
  const bound = memberBound(dir);
  const cov = node(dir, [join("scripts", "organism_test.mjs"), "coverage"], bound);
  const orphanLine = cov.out.split(NL).find((l) => /orphaned:/.test(l)) || "";
  const orphans = new Set((/orphaned:\s*(.*)$/.exec(orphanLine)?.[1] || "").split(",").map((s) => s.trim()).filter(Boolean));
  const covRan = /COVERAGE LAW/.test(cov.out);
  const cen = node(dir, [join("scripts", "organism_test.mjs"), "census"], bound);
  const rows = cen.code === 0 ? rowsOf(cen.out) : [];
  const row = (n) => rows.find((r) => r.startsWith(`| ${n}.mjs |`)) || null;
  const cenWhy = cen.code === 0 ? "" : `census exit ${cen.code}: ${cen.out.split(NL).filter(Boolean).pop()?.slice(0, 100) || ""}`;
  const v = {};
  const none = (n) => {
    const r = row(n), okRow = !!r && new RegExp(`^\\| ${n}\\.mjs \\| has \\| \\d+ \\| none \\| — \\| — \\| MOVES has → none \\|$`).test(r);
    const orph = orphans.has(n);
    return { green: covRan && !orph && okRow, why: `${!covRan ? "coverage never ran" : orph ? `coverage calls ${n} an orphan (it reads a selftest)` : "not an orphan"} · census ${r || cenWhy || "has no row"}` };
  };
  const has = (n, form) => {
    const r = row(n), want = `| ${n}.mjs | has | `, tail = `| has | ${form} | ${markLine(n)} | — |`;
    const okRow = !!r && r.startsWith(want) && r.endsWith(tail), orph = orphans.has(n);
    return { green: covRan && orph && okRow, why: `${orph ? "an orphan (the law reads it)" : "NOT an orphan"} · census ${r || cenWhy || "has no row"}` };
  };
  v["C1 COMMENT"] = none("mdet_comment");
  v["C2 STRING"] = none("mdet_string");
  const d1 = has("mdet_dispatch", "dispatch"), d2 = has("mdet_case", "dispatch");
  v["C3 DISPATCH"] = { green: d1.green && d2.green, why: `mdet_dispatch ${d1.why} ; mdet_case ${d2.why}` };
  const proofP = join(dir, "ci", "mdet", "PROOF.md");
  const proof = existsSync(proofP) ? readFileSync(proofP, "utf8") : null;
  const blk = proof && /<!-- census:begin -->([\s\S]*?)<!-- census:end -->/.exec(proof);
  if (!blk) v["C4 CENSUS"] = { green: false, why: proof === null ? "ci/mdet/PROOF.md is absent" : "no census block in ci/mdet/PROOF.md" };
  else if (cen.code !== 0) v["C4 CENSUS"] = { green: false, why: cenWhy };
  else {
    // row 1224 (2): the frozen table judged by blob, and the head-line plant on the same tree
    const j = judgeCensus(dir, rows, blk[1]);
    const pick = j.green ? j.judgedRows.find((r) => /\| dispatch \| \d+ \| — \|$/.test(r.stem)) : null;
    let p = { green: false, why: "no judged dispatch row to plant on" };
    if (pick) {
      const f = join(dir, "scripts", pick.file), bytes = readFileSync(f);
      try {
        writeFileSync(f, Buffer.concat([Buffer.from("// planted by ci/mdet/witness_mdet.mjs: one line at the head (forks row 1224 (2))\n"), bytes]));
        const c2 = node(dir, [join("scripts", "organism_test.mjs"), "census"], bound);
        const j2 = c2.code === 0 ? judgeCensus(dir, rowsOf(c2.out), blk[1]) : { green: false, why: `census exit ${c2.code}`, moved: [] };
        const named = j2.moved.includes(pick.file);
        p = { green: j2.green && named, why: `head-line plant on ${pick.file}: ${j2.green ? "GREEN" : "RED"}, ${named ? "named moved" : "NOT named moved"} (${j2.why})` };
      } finally { writeFileSync(f, bytes); }
    }
    v["C4 CENSUS"] = { green: j.green && p.green, why: `${j.why} · ${p.why}`.slice(0, 600) };
  }
  const s1 = has("mdet_selfrun", "self-run");
  const dr = row("mdet_decl"), declNone = !!dr && /\| none \| — \| — \| MOVES has → none \|$/.test(dr) && !orphans.has("mdet_decl");
  v["C5 SELF-RUN"] = { green: s1.green && declNone && covRan, why: `mdet_selfrun ${s1.why} ; mdet_decl ${declNone ? "reads none, not an orphan" : `census ${dr || cenWhy || "has no row"}${orphans.has("mdet_decl") ? " · an orphan" : ""}`}` };
  return v;
}

/** every live process whose command line names `root` (never through a shell) @returns {string[]} */
export function survivors(root) {
  const needle = realpathSync(root);
  const out = [];
  try {
    if (process.platform === "linux") {
      for (const p of readdirSync("/proc")) {
        if (!/^\d+$/.test(p) || Number(p) === process.pid) continue;
        let cmd = ""; try { cmd = readFileSync(`/proc/${p}/cmdline`, "utf8").replace(/\0/g, " "); } catch { continue; }
        if (cmd.includes(needle) || cmd.includes(root)) out.push(`${p} ${cmd.slice(0, 160)}`);
      }
    } else if (process.platform === "win32") {
      const t = execFileSync("powershell", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process | ForEach-Object { \"$($_.ProcessId) $($_.CommandLine)\" }"], { encoding: "utf8" });
      for (const l of t.split(NL)) if (l.includes(needle) || l.includes(root)) { const pid = Number(l.split(" ")[0]); if (pid !== process.pid) out.push(l.slice(0, 160)); }
    } else {
      const t = execFileSync("ps", ["-axo", "pid=,command="], { encoding: "utf8" });
      for (const l of t.split(NL)) if (l.includes(needle) || l.includes(root)) { const pid = Number(l.trim().split(" ")[0]); if (pid !== process.pid) out.push(l.trim().slice(0, 160)); }
    }
  } catch (e) { out.push(`process table unreadable: ${String(e && e.message || e).slice(0, 120)}`); }
  return out;
}

/** paths whose content differs between two orgs: index blobs of two checkouts, else the bytes of two plain trees
 *  (node_modules and .git left out) @returns {string[]} */
function differing(a, b) {
  if (!(isRepo(a) && isRepo(b))) {
    const files = (root) => { const m = new Map(); const walk = (d) => { for (const f of readdirSync(d)) { const p = join(d, f), r = relative(root, p).split(sep).join("/"); if (r === "node_modules" || r === ".git") continue; let s; try { s = statSync(p); } catch { continue; } if (s.isDirectory()) walk(p); else if (s.isFile()) m.set(r, createHash("sha256").update(readFileSync(p)).digest("hex")); } }; walk(root); return m; };
    const A = files(resolve(a)), B = files(resolve(b));
    return [...new Set([...A.keys(), ...B.keys()])].filter((p) => A.get(p) !== B.get(p)).sort();
  }
  const blobs = (d) => new Map(git(d, ["-c", "core.quotepath=false", "ls-files", "-s"]).split(NL).filter(Boolean).map((l) => { const [meta, p] = l.split("\t"); return [p, meta.split(" ")[1]]; }));
  const A = blobs(a), B = blobs(b);
  return [...new Set([...A.keys(), ...B.keys()])].filter((p) => A.get(p) !== B.get(p)).sort();
}

function main() {
  const argv = process.argv.slice(2);
  const opt = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : undefined; };
  const org = opt("--org"), base = opt("--base-org"), boundOrg = opt("--bound-org") || base;
  if (!org || !base) { console.log("usage: node ci/mdet/witness_mdet.mjs --org <build checkout> --base-org <base checkout>"); process.exit(2); }
  const root = mkdtempSync(join(tmpdir(), "mdet-witness-"));
  const reds = [];
  try {
    const diff = differing(org, boundOrg);
    const outside = diff.filter((p) => !NAMED.some((r) => r.test(p)));
    console.log(`BOUND · against ${boundOrg === base ? "the base org" : "the bound org"} · ${diff.length} path(s) differ: ${diff.join(", ") || "(none)"}`);
    if (outside.length) { console.log(`BOUND · RED — outside the named files: ${outside.join(", ")}`); reds.push("BOUND"); }
    const mods = [org, base].map((d) => join(resolve(d), "node_modules")).find((p) => existsSync(p)) || null;
    const vb = judgeAll(plantTree(base, mkdtempSync(join(root, "base-")), mods));
    const vh = judgeAll(plantTree(org, mkdtempSync(join(root, "build-")), mods));
    for (const c of CLAUSES) {
      const ok = !vb[c].green && vh[c].green;
      console.log(`${ok ? "HOLDS" : "BROKEN"} ${c} · base ${vb[c].green ? "GREEN" : "RED"} (${vb[c].why}) · build ${vh[c].green ? "GREEN" : "RED"} (${vh[c].why})`);
      if (!ok) reds.push(c);
    }
  } finally {
    const live = survivors(root);
    if (live.length) { console.log(`LAST · RED — ${live.length} process(es) name the temp dir: ${live.join(" | ")}`); reds.push("LAST"); }
    else console.log("LAST · no process names the temp dir");
    try { rmSync(root, { recursive: true, force: true }); } catch { /* a locked temp file on Windows is litter, not a verdict */ }
  }
  if (reds.length) { console.log(`RED MDET · ${reds.join(", ")}`); process.exit(1); }
  console.log(`GREEN MDET the coverage detector reads a dispatch or a self-run, never a comment or a string · ${CLAUSES.length} clause(s)`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main();
