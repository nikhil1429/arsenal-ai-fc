#!/usr/bin/env node
// ============================================================================================================
// ci/mrj/witness_mrj.mjs — THE WITNESS OF UNIT mrj (the re-judge of unit mjud's M3, M5, M6). Its header is its contract.
//
//   node ci/mrj/witness_mrj.mjs --org <dir> [--base-org <dir>]
//
// --org       a whole repository tree (a git-archive of the side under test: it carries ci/mjud/ and scripts/). It is
//             NEVER run in place: its ci/mjud/ is copied to a fresh dir under os.tmpdir(), and that copy of unit mjud's
//             witness runs against --org (which mjud's witness itself copies again under os.tmpdir(), with its own fake
//             claude first on PATH and its own recorders: no live model call, no port of its own beyond M1's port 0).
// --base-org  BASE's tree (ci/mrj/BASE); when given, BOUND holds --org to differ from it only in the named files.
//
// Every clause reads --org ONLY, so `--org <BASE tree>` reads RED on every clause that the build feeds:
//   R1 M3      the org's own mjud witness, run over the org, prints `GREEN M3 CENSUS` (the re-base on unit mtail,
//              forks rows 1017 (2)-(5) / 1019 (1); ruled by row 1112 (1), F2 A).
//   R2 M5      ... prints `GREEN M5 F3-CLIP` (the re-base on unit mjd3, rows 1025 (4) / 1030; row 1112 (1)).
//   R3 M6      ... prints `GREEN M6 MJD2` (the re-base on unit mjd3; row 1112 (1), F4 A).
//   R4 MEMBER  unit ms1's member judges that run GREEN: its own boundIds + judgeLast, sliced from the org's
//              scripts/organism_test.mjs (never re-typed here), read the run's LAST line with nothing left beyond BOUND.
//              (The mjud run here carries no --base-org, so it prints no BOUND; the member drops BOUND either way.)
//   R5 KNOWN   the org's KNOWN_RED list (scripts/organism_test.mjs) holds no entry for `WITNESS ‹mjud› · GREEN at head
//              against its BASE` owned by `unit mrj` — removed in the same diff that turns the member green (row 1119 (2)).
//   R6 HEADER  the org's mjud witness header names each re-base (unit mrj, row 1112 (1), and mtail / mjd3 with their
//              rows), keeps the old text struck (~~…~~) for M3, M5 and M6, and its ci/mjud/BASE is still the sha the
//              header names as kept (F3 A).
//   BOUND      (only with --base-org) --org differs from --base-org only in ci/mjud/witness_mjud.mjs, ci/mjud/w_drive.mjs
//              and scripts/organism_test.mjs (ci/mrj/ and the seat's .claude/settings.json are outside the comparison).
//   LAST       no node process naming this witness's temp dir survives (POSIX `ps`, Windows PowerShell CIM).
//
// THE PORT CLASS (row 1053): this witness binds no port, names no live service, POSTs nothing and restarts nothing.
// Every wait is bounded by the org's own declared job bound, timeout-minutes in .github/workflows/suite.yml (read,
// never typed here). It writes nothing outside its temp dir and reads dressing-room/state never. CRLF-proof: every
// source read splits on \r?\n. LAST LINE: `GREEN MRJ <what> · <n> clause(s)` (exit 0) or `RED MRJ · <clauses>` (exit 1).
// ============================================================================================================
import { mkdtempSync, cpSync, readFileSync, existsSync, readdirSync, statSync, rmSync, symlinkSync } from "node:fs";
import { join, resolve, relative } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync, execFileSync } from "node:child_process";
import { createHash } from "node:crypto";

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const ORG = arg("--org") ? resolve(arg("--org")) : null;
const BASE_ORG = arg("--base-org") ? resolve(arg("--base-org")) : null;
const IS_WIN = process.platform === "win32";
const fwd = (p) => String(p).replace(/\\/g, "/");
const lines = (s) => String(s).split(/\r?\n/);
if (!ORG || !existsSync(join(ORG, "scripts", "organism_test.mjs"))) { console.log("RED MRJ · USAGE (--org <dir> holding scripts/organism_test.mjs)"); process.exit(1); }
const NAMED = ["ci/mjud/witness_mjud.mjs", "ci/mjud/w_drive.mjs", "scripts/organism_test.mjs"];
const read = (p) => { try { return readFileSync(p, "utf8"); } catch { return null; } };
const wf = read(join(ORG, ".github", "workflows", "suite.yml")) || "";
const jobMin = Number((/timeout-minutes:\s*(\d+)/.exec(wf) || [])[1]);
if (!(jobMin > 0)) { console.log("RED MRJ · USAGE (the org declares no timeout-minutes in .github/workflows/suite.yml: no bound to read)"); process.exit(1); }
const T0 = Date.now();
const left = () => Math.max(1, T0 + jobMin * 60000 - Date.now());

const TMP = mkdtempSync(join(tmpdir(), "mrj-w-"));
const clauses = [];
const clause = (name, ok, detail) => { clauses.push({ name, ok: !!ok }); console.log(`  ${ok ? "GREEN" : "RED  "} ${name} — ${detail}`); };

// ── the org's own mjud witness, from a copy under the temp dir, over the org ──
let run = { out: "", code: null, why: "" };
const MJUD = join(ORG, "ci", "mjud");
if (existsSync(join(MJUD, "witness_mjud.mjs"))) {
  const side = join(TMP, "side");
  cpSync(MJUD, join(side, "ci", "mjud"), { recursive: true });
  const nm = join(ORG, "node_modules");
  if (existsSync(nm)) symlinkSync(nm, join(side, "node_modules"), IS_WIN ? "junction" : "dir");
  const env = { ...process.env }; delete env.ANTHROPIC_API_KEY;
  const r = spawnSync(process.execPath, [join(side, "ci", "mjud", "witness_mjud.mjs"), "--org", ORG], { cwd: side, env, encoding: "utf8", timeout: left(), windowsHide: true, maxBuffer: 1 << 26 });
  run = { out: String(r.stdout || ""), code: r.status, why: r.error ? String(r.error.message || r.error) : "" };
  try { if (existsSync(join(side, "node_modules"))) rmSync(join(side, "node_modules"), { force: true, recursive: false }); } catch { }
} else run.why = "the org carries no ci/mjud/witness_mjud.mjs";
const runLines = lines(run.out).map((l) => l.trim()).filter(Boolean);
const lineOf = (id) => runLines.find((l) => new RegExp(`^(GREEN|RED)\\s+${id.replace(/\s+/g, "\\s+")}\\s+—`).test(l)) || null;
const mjudLast = runLines.at(-1) || `(no line · exit ${run.code}${run.why ? ` · ${run.why}` : ""})`;
for (const [name, id] of [["R1 M3", "M3 CENSUS"], ["R2 M5", "M5 F3-CLIP"], ["R3 M6", "M6 MJD2"]]) {
  const l = lineOf(id);
  clause(name, !!l && l.startsWith("GREEN"), l ? l.slice(0, 260) : `the org's mjud run printed no ${id} line · its last: ${mjudLast.slice(0, 200)}`);
}

// R4 — the member's own judge, sliced from the org's scripts/organism_test.mjs
const OT = read(join(ORG, "scripts", "organism_test.mjs")) || "";
{
  const bSrc = (/^const boundIds = .*;$/m.exec(OT) || [])[0];
  const jStart = OT.search(/^function judgeLast\(/m);
  const jEnd = jStart < 0 ? -1 : OT.indexOf("\n}", jStart);
  let detail = "", ok = false;
  if (!bSrc || jStart < 0 || jEnd < 0) detail = `the org's organism_test.mjs has no ${bSrc ? "" : "boundIds "}${jStart < 0 ? "judgeLast " : ""}to slice`;
  else {
    try {
      const { boundIds, judgeLast } = new Function(`${bSrc}\n${OT.slice(jStart, jEnd + 2).replace(/\r\n/g, "\n")}\nreturn { boundIds, judgeLast };`)();
      const j = judgeLast(run.out, run.code, "mjud", boundIds(read(join(MJUD, "witness_mjud.mjs")) || ""));
      ok = j.ok; detail = `the member reads ${j.ok ? "GREEN" : `red beyond BOUND: ${j.left}`} · last line ${j.last.slice(0, 160)}`;
    } catch (e) { detail = `the sliced judge threw: ${String(e && e.message || e).slice(0, 160)}`; }
  }
  clause("R4 MEMBER", ok, detail);
}
// R5 — no ruled-red entry of the mjud member owned by unit mrj in the org's KNOWN_RED
{
  const from = OT.search(/^const KNOWN_RED = \[/m), to = from < 0 ? -1 : OT.indexOf("\n];", from);
  const body = from < 0 || to < 0 ? null : OT.slice(from, to);
  const hits = body === null ? [] : lines(body).filter((l) => l.includes('assert: "WITNESS ‹mjud› · GREEN at head against its BASE"') && l.includes('owner: "unit mrj"'));
  clause("R5 KNOWN", body !== null && hits.length === 0, body === null ? "the org's organism_test.mjs holds no KNOWN_RED list" : `${hits.length} mjud entry(ies) owned by unit mrj in KNOWN_RED${hits.length ? ` (${hits[0].trim().slice(0, 120)}…)` : ""}`);
}
// R6 — the re-cut header: each re-base named, old text struck, BASE kept
{
  const src = read(join(MJUD, "witness_mjud.mjs")) || "";
  const head = src.slice(0, Math.max(0, src.search(/^import /m)));
  const blocks = { M3: /^\/\/\s+M3 CENSUS[\s\S]*?(?=^\/\/\s+M4 )/m, M5: /^\/\/\s+M5 F3-CLIP[\s\S]*?(?=^\/\/\s+M6 )/m, M6: /^\/\/\s+M6 MJD2[\s\S]*?(?=^\/\/\s+M7 )/m };
  const unitOf = { M3: /unit mtail, rows 1017 \(2\)-\(5\)\s*(\/\/\s*)?\/ 1019 \(1\)/, M5: /unit mjd3, rows 1025 \(4\) \/ 1030/, M6: /unit mjd3, rows 1025 \(4\) \/ 1030/ };
  const miss = [];
  for (const [k, re] of Object.entries(blocks)) {
    const b = (re.exec(head.replace(/\r\n/g, "\n")) || [])[0] || "";
    if (!/RE-BASED by unit mrj \(forks row 1112 \(1\), fate \(a\)/.test(b)) miss.push(`${k} names no re-base by unit mrj row 1112 (1)`);
    if (!unitOf[k].test(b.replace(/\n\/\/\s+/g, " "))) miss.push(`${k} names not the unit and rows that changed it`);
    if (!/~~[^~]+~~/.test(b)) miss.push(`${k} keeps no struck old text`);
  }
  const kept = (/BASE is kept at ([0-9a-f]{7,40}) by row 1112 F3 A/.exec(head) || [])[1];
  const baseSha = (read(join(MJUD, "BASE")) || "").trim();
  if (!kept) miss.push("the header names no BASE kept by row 1112 F3 A");
  else if (!baseSha.startsWith(kept)) miss.push(`ci/mjud/BASE ${baseSha.slice(0, 7) || "absent"} is not the kept ${kept}`);
  clause("R6 HEADER", miss.length === 0, miss.length ? miss.join(" · ") : `M3, M5, M6 each re-based by unit mrj (row 1112 (1)), old text struck · ci/mjud/BASE ${baseSha.slice(0, 7)} kept (F3 A)`);
}
// BOUND — only the named files differ from BASE
if (BASE_ORG) {
  const walk = (root) => { const m = new Map(); const go = (d) => { for (const n of readdirSync(d)) { const p = join(d, n); const r = fwd(relative(root, p));
    if (/^(node_modules|\.git|ci\/mrj)(\/|$)/.test(r) || r === ".claude/settings.json") continue;
    if (statSync(p).isDirectory()) go(p); else m.set(r, createHash("sha256").update(readFileSync(p)).digest("hex")); } }; go(root); return m; };
  const a = walk(BASE_ORG), b = walk(ORG);
  const diff = [...new Set([...a.keys(), ...b.keys()])].filter((k) => a.get(k) !== b.get(k)).sort();
  const outside = diff.filter((k) => !NAMED.includes(k));
  clause("BOUND", !outside.length, `differs from --base-org in ${diff.length} file(s)${outside.length ? ` · OUTSIDE the named files: ${outside.slice(0, 12).join(", ")}${outside.length > 12 ? ` … (+${outside.length - 12})` : ""}` : `: ${diff.join(", ") || "none"}`}`);
}
// LAST — no node process naming the temp dir survives
{
  let procs = [];
  try {
    const list = IS_WIN
      ? execFileSync("powershell", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process | ForEach-Object { \"$($_.ProcessId) $($_.CommandLine)\" }"], { encoding: "utf8", windowsHide: true, timeout: left() })
      : execFileSync("ps", ["-eo", "pid=,args="], { encoding: "utf8", timeout: left() });
    const key = fwd(TMP).toLowerCase();
    procs = lines(list).filter((l) => fwd(l).toLowerCase().includes(key) && /node/i.test(l) && Number(l.trim().split(/\s+/)[0]) !== process.pid);
  } catch (e) { procs = [`process list unreadable: ${String(e && e.message || e).slice(0, 80)}`]; }
  clause("LAST", procs.length === 0, `node processes naming the temp dir: ${procs.length}`);
  for (const l of procs) { const pid = Number(l.trim().split(/\s+/)[0]); if (pid) { try { process.kill(pid); } catch { } } }
}
try { rmSync(TMP, { recursive: true, force: true }); } catch { }
const red = clauses.filter((c) => !c.ok).map((c) => c.name);
if (red.length) { console.log(`RED MRJ · ${red.join(" · ")}`); process.exit(1); }
console.log(`GREEN MRJ mjud M3, M5, M6 re-based on mtail and mjd3, the member green and its ruled entry gone · ${clauses.length} clause(s)`);
process.exit(0);
