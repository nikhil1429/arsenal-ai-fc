#!/usr/bin/env node
// ============================================================================
// ci/mday2/witness_mday2.mjs — UNIT mday2 · THE DIGEST SAYS WHAT MAIN NOW DOES (forks rows 1089 / 1067 (6))
// ----------------------------------------------------------------------------
// USAGE: node ci/mday2/witness_mday2.mjs --org <dir> --base-org <dir> [--only <clause>[,<clause>…]]
//   --org       the tree to witness (the build reads GREEN; the base reads RED on every D clause)
//   --base-org  the BASE tree (main at the cut) — BOUND needs it; absent, BOUND is RED
//   --only      run only these clause ids (the mutant runner's door); BOUND and LAST always run
// CONTRACT — every plant runs on a COPY of --org under os.tmpdir() (never .git, never node_modules, never the org's own
//   dressing-room/state: the copy gets its OWN state dir, EMPTY but for the plant, so nothing of his is read or printed).
//   The plant is written by THIS node script under os.tmpdir() (the repo rail refuses a shell write under a state path).
//   No git repo is planted (core.autocrlf: nothing to clone or init). Every process output is split on \r?\n; BOUND hashes
//   text with CRLF folded to LF; a mutant's edit is matched in the file's own line ending. THE PORT CLASS (row 1053): binds
//   NO port, names no live service, POSTs nothing, restarts nothing; every child is spawnSync (bounded by its own exit) and
//   LAST lists processes through PowerShell on Windows, `ps` elsewhere. No timeout, budget, size or model id is typed here.
//   No model is called: the digest is TIER 0 and the witness spawns only node.
// CLAUSES:
//   D1  the render (no session open, AND a planted open forge session) prints no hand-typed sitting open (`sitting.mjs open`)
//   D2  the render prints no judge-round, no hand `sitting.mjs close` and no `/full-time` before the close
//   D3  the render carries the day end as day.mjs's OWN END_LINE (read from the copy's scripts/day.mjs) and names
//       `day.mjs status` as where the open day shows
//   D4  learn_digest's selftest holds the D1-D3 law, planted both ways: on the clean copy its headline is all-hold (exit 0);
//       on a copy whose render is planted with the old hand-typed open + judge-round line it reads RED (exit 1)
//   BOUND  only scripts/learn_digest.mjs and ci/mday2/ differ between --org and --base-org (his state dir excluded, unread)
//   LAST   no node process naming this run's temp dir survives
// LAST LINE: GREEN MDAY2 <what> · <n> clause(s) (exit 0) | RED MDAY2 · <clauses> (exit 1)
// ============================================================================
import { mkdtempSync, cpSync, mkdirSync, writeFileSync, readFileSync, readdirSync, statSync, rmSync, existsSync } from "node:fs";
import { join, resolve, relative, sep } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const ORG = arg("--org") ? resolve(arg("--org")) : null;
const BASE = arg("--base-org") ? resolve(arg("--base-org")) : null;
const ONLY = arg("--only") ? arg("--only").split(",") : null;
const want = (id) => !ONLY || ONLY.includes(id);
const TMP = mkdtempSync(join(tmpdir(), "mday2-witness-"));
const results = [];
const clause = (id, ok, why) => { results.push({ id, ok: !!ok }); console.log(`${ok ? "  GREEN" : "  RED  "} ${id} · ${why}`); };

const SKIP = new Set([".git", "node_modules"]);
const skipRel = (rel) => rel.split(sep).some((p) => SKIP.has(p)) || rel === join("dressing-room", "state") || rel.startsWith(join("dressing-room", "state") + sep);
function copyOrg(name) {
  const dst = join(TMP, name);
  cpSync(ORG, dst, { recursive: true, filter: (src) => !skipRel(relative(ORG, src)) });
  mkdirSync(join(dst, "dressing-room", "state", "capsules"), { recursive: true });
  return dst;
}
const lines = (s) => String(s || "").split(/\r?\n/).filter((l) => l.trim());
const node = (cwd, args) => { const r = spawnSync(process.execPath, args, { cwd, encoding: "utf8", windowsHide: true, env: { ...process.env, ARSENAL_ORGAN: "", ANTHROPIC_API_KEY: "" } }); return { status: r.status, out: String(r.stdout || ""), err: String(r.stderr || "") }; };
const render = (dir) => node(dir, [join(dir, "scripts", "learn_digest.mjs")]);
const plantOpen = (dir) => writeFileSync(join(dir, "dressing-room", "state", "forge_session.json"), JSON.stringify({ concept: "wplant", current_axis: "c", step: 3, axes_done: ["a", "b"], axes_deferred: [] }) + "\n");

// the old lines of the base, as the class the ruling names (open by hand / three-step close)
const HAND_OPEN = /sitting\.mjs open/;
const HAND_CLOSE = [/judge-round/, /sitting\.mjs close/, /\/full-time/];

if (!ORG || !existsSync(join(ORG, "scripts", "learn_digest.mjs"))) { console.log("RED MDAY2 · --org missing or carries no scripts/learn_digest.mjs"); process.exit(1); }

let closedR = null, openR = null, plainDir = null;
if (["D1", "D2", "D3"].some(want)) {
  plainDir = copyOrg("plain");
  closedR = render(plainDir);
  const openDir = copyOrg("open"); plantOpen(openDir);
  openR = render(openDir);
}
if (want("D1")) {
  const bad = [closedR, openR].filter((r) => HAND_OPEN.test(r.out));
  clause("D1", closedR.status === 0 && openR.status === 0 && openR.out.includes("wplant") && !bad.length,
    `render exit ${closedR.status}/${openR.status} (no session / planted open session) · hand-typed sitting open printed in ${bad.length} of 2`);
}
if (want("D2")) {
  const hits = HAND_CLOSE.filter((re) => re.test(closedR.out) || re.test(openR.out)).map((re) => re.source);
  clause("D2", closedR.status === 0 && !hits.length, hits.length ? `the render still types: ${hits.join(" · ")}` : "no judge-round, no hand sitting close, no /full-time in either render");
}
if (want("D3")) {
  let END_LINE = null;
  try { END_LINE = (await import(pathToFileURL(join(plainDir, "scripts", "day.mjs")).href)).END_LINE; } catch { /* named below */ }
  const ok = typeof END_LINE === "string" && END_LINE.length > 0 && [closedR, openR].every((r) => r.out.includes(END_LINE) && /day\.mjs status/.test(r.out));
  clause("D3", ok, END_LINE ? `day.mjs END_LINE ${[closedR, openR].filter((r) => r.out.includes(END_LINE)).length} of 2 renders · day.mjs status ${[closedR, openR].filter((r) => /day\.mjs status/.test(r.out)).length} of 2` : "day.mjs exports no END_LINE in the copy");
}
if (want("D4")) {
  const clean = copyOrg("st-clean");
  const c = node(clean, [join(clean, "scripts", "learn_digest.mjs"), "selftest"]);
  const ch = lines(c.out).filter((l) => /^learn_digest selftest /.test(l)).pop() || "(no headline)";
  const planted = copyOrg("st-planted");
  const f = join(planted, "scripts", "learn_digest.mjs");
  const src = readFileSync(f, "utf8"), eol = src.includes("\r\n") ? "\r\n" : "\n";
  const anchor = '  return L.join("\\n") + "\\n";';
  const plantedSrc = src.includes(anchor) ? src.replace(anchor, '  push("  boot: open the sitting FIRST → node scripts/sitting.mjs open --surface code --no-spawn --task \\"<task>\\"");' + eol + '  push("  day end node scripts/gaffer_brain.mjs judge-round → node scripts/sitting.mjs close --reason fulltime → /full-time");' + eol + anchor) : null;
  let ph = "(plant site not found)", ps = null;
  if (plantedSrc) { writeFileSync(f, plantedSrc); const p = node(planted, [f, "selftest"]); ps = p.status; ph = lines(p.out).filter((l) => /^learn_digest selftest /.test(l)).pop() || "(no headline)"; }
  clause("D4", c.status === 0 && /all clauses hold/.test(ch) && ps === 1 && /RED/.test(ph), `clean: «${ch}» exit ${c.status} · planted old lines: «${ph}» exit ${ps}`);
}

// BOUND — only the named files differ (text hashed with CRLF folded to LF; his state dir is excluded, never read)
{
  const walk = (root) => { const m = new Map(); const go = (d) => { for (const e of readdirSync(d, { withFileTypes: true })) { const p = join(d, e.name), rel = relative(root, p); if (skipRel(rel)) continue; if (e.isDirectory()) go(p); else if (e.isFile()) m.set(rel.split(sep).join("/"), createHash("sha256").update(readFileSync(p).toString("latin1").replace(/\r\n/g, "\n")).digest("hex")); } }; go(root); return m; };
  if (!BASE || !existsSync(BASE)) clause("BOUND", false, "--base-org absent");
  else {
    const a = walk(ORG), b = walk(BASE), diff = [];
    for (const k of new Set([...a.keys(), ...b.keys()])) if (a.get(k) !== b.get(k)) diff.push(k);
    const named = (k) => k === "scripts/learn_digest.mjs" || k.startsWith("ci/mday2/");
    const stray = diff.filter((k) => !named(k));
    clause("BOUND", !stray.length && diff.includes("scripts/learn_digest.mjs"), `${diff.length} path(s) differ · outside the named files: ${stray.length ? stray.slice(0, 8).join(", ") : "none"}`);
  }
}

// an OWN mutant (LAST) plants a survivor here; production leaves this a no-op
const PLANT_SURVIVOR = false;
const survivor = PLANT_SURVIVOR ? spawn(process.execPath, ["-e", "process.stdin.resume()", TMP], { stdio: ["pipe", "ignore", "ignore"], windowsHide: true }) : null;

// LAST — no node process naming the temp dir survives (then the run's survivors, if any, are stopped and the dir removed)
{
  const list = () => process.platform === "win32"
    ? lines(spawnSync("powershell", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | ForEach-Object { \"$($_.ProcessId) $($_.CommandLine)\" }"], { encoding: "utf8", windowsHide: true }).stdout)
    : lines(spawnSync("ps", ["-eo", "pid=,args="], { encoding: "utf8" }).stdout);
  const self = String(process.pid);
  const alive = list().map((l) => l.trim()).filter((l) => l.includes(TMP) && /node/i.test(l) && l.split(/\s+/)[0] !== self);
  clause("LAST", !alive.length, `${alive.length} node process(es) naming the temp dir`);
  for (const l of alive) { try { process.kill(Number(l.split(/\s+/)[0])); } catch { /* gone */ } }
  if (survivor) { try { survivor.kill(); } catch { /* gone */ } }
  try { rmSync(TMP, { recursive: true, force: true }); } catch { /* best effort */ }
}

const red = results.filter((r) => !r.ok).map((r) => r.id);
console.log(red.length ? `RED MDAY2 · ${red.join(", ")}` : `GREEN MDAY2 the digest says the day is opened by code and ended by day.mjs end · ${results.length} clause(s)`);
process.exit(red.length ? 1 : 0);
