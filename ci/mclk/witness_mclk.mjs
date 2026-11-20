#!/usr/bin/env node
// ============================================================================
// ci/mclk/witness_mclk.mjs — UNIT mclk · THE MIDNIGHT CLOCK, THE UNIT WITNESS AGAINST BASE (forks row 1214 (3))
// ----------------------------------------------------------------------------
// USAGE: node ci/mclk/witness_mclk.mjs --org <head tree> --base-org <base tree>
//   Both arguments are REQUIRED: without --base-org there is no base to read RED, and the witness is RED, never a pass.
//   The base is ci/mclk/BASE (main 56ed4ff, the landed mmeter planter); the trees may be LF trees with no .git.
// THE DEFECT (row 1214, measured at the cut, ci/mclk/PROOF.md): ci/witness/mmeter/plant_day.mjs took the day as the IST
//   date of now and stamped every row now minus one to five minutes, so a run in the first minutes after IST midnight put
//   its rows on the PREVIOUS IST day and the mmeter plants read 15 of 18 (the 11 of 11 day 9 of 11).
// THE CLOCK DOOR (named here, as row 1214 (3) asks). The meter (scripts/daily_green.mjs witness(), and the state.mjs facts
//   it calls) and the planter read the clock ONLY through `new Date()` / `Date.now()`; neither has a clock flag or env var.
//   So the narrowest door is a Date preload: a file under this witness's temp dir, the planted instant a literal in it,
//   handed to a node child as `NODE_OPTIONS=<inherited> --import=<its file URL>`. Two forms:
//     · ALL-CHILDREN: the preload stays in NODE_OPTIONS, so every node child the planted child spawns (the planter's meter
//       CLI) reads the same planted clock — the architect's measurement of row 1214.
//     · PLANTER-ONLY: the preload removes its own --import from process.env.NODE_OPTIONS after it loads, so only the
//       planter process reads the planted clock; its meter child reads the planted instant iff the planter HANDS it on.
//   No organ is edited and no organ reads an env var for the clock; git children ignore NODE_OPTIONS.
// THE TWO INSTANTS: AFTER = two minutes past the IST midnight that opens the current IST day; BEFORE = two minutes before
//   that same midnight. Derived once from the clock this witness reads at start.
// THE CLAUSES
//   M:midnight     each tree's OWN ci/witness/mmeter/witness_meter.mjs `plants --org <tree>`, under the ALL-CHILDREN door,
//                  read by its `PLANTS mmeter · k of n plant(s) as expected` line. HOLDS iff the head reads k === n (n > 0)
//                  at BOTH instants AND the base reads k < n at AFTER (row 1214 (3): 18 of 18 at both, red on main).
//   M:one-instant  each tree's OWN ci/witness/mmeter/plant_day.mjs CLI (`11` and `5`, --org <tree>), under the PLANTER-ONLY
//                  door at BEFORE (a day the real clock never reads, so a meter that re-reads now lands on another day).
//                  HOLDS iff the head plants `got 11/11 · meter exit 0` and `got 5/11 · meter exit 3` AND the base does not
//                  (the meter is read at the planter's same instant, handed to it — never two reads of now).
//   BOUND          the two trees are walked (no git: the suite member hands LF trees), every file whose bytes differ (CRLF
//                  folded to LF), or that exists on one side only, is one of the unit's named files. node_modules and .git
//                  are not part of a tree. (BOUND is a seat-time clause: the suite member drops it.)
//   LAST           no process naming a temp prefix this witness or the plants use (mclk-wit-, mmeter-wit-) survives.
// CONTRACT — every plant runs on copies under os.tmpdir(); nothing of his state is read but the TRACKED registry.json (by the
//   planter, never printed). THE PORT CLASS (row 1053): no port bound, no service named, nothing POSTed, nothing restarted,
//   no network, no model. Every child is spawnSync, so every wait ends with its child; no timeout, budget or size is typed.
//   Every line is split on \r?\n; git repos are planted only by plant_day.mjs (core.autocrlf=false at init). Runs on Windows.
// LAST LINE: GREEN MCLK <what> · <n> clause(s) (exit 0) · RED MCLK · <ids> (exit 1)
// ============================================================================
import { readFileSync, readdirSync, existsSync, statSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join, resolve, relative, sep } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const CLAUSE_IDS = ["M:midnight", "M:one-instant"];
const TMP_PREFIX = "mclk-wit-";
const PREFIXES = [TMP_PREFIX, "mmeter-wit-"];
const lines = (t) => String(t || "").split(/\r?\n/).filter((l) => l.trim());
// the unit's files (row 1214 (3) and the brief); the effort receipt is the brief's one exception
const NAMED = [/^ci\/witness\/mmeter\/(witness_meter|plant_day)\.mjs$/,
  /^ci\/mclk\/(witness_mclk\.mjs|run_mutants_mclk\.mjs|BASE|PROOF\.md|LEDGER\.jsonl|CENSUS\.md)$/, /^campaign-2026-09\/receipts_effort\/mclk_00\.json$/];
const SKIP = new Set(["node_modules", ".git"]);

/** THE TWO INSTANTS, from ONE read of the clock @param {Date} now */
export function instants(now = new Date()) {
  const day = new Date(now.getTime() + 330 * 60000).toISOString().slice(0, 10);
  const midnight = Date.parse(`${day}T00:00:00+05:30`);
  return { AFTER: midnight + 2 * 60000, BEFORE: midnight - 2 * 60000 };
}
const ist = (t) => new Date(t + 330 * 60000).toISOString().slice(0, 16).replace("T", " ") + " IST";

/** THE DOOR: a Date preload pinned at T; planterOnly removes itself from the env its children inherit */
function door(dir, name, T, planterOnly) {
  const f = join(dir, `${name}.mjs`);
  const url = pathToFileURL(f).href;
  writeFileSync(f, `const R = globalThis.Date, T = ${T};\n` +
    `function D(...a) { if (!new.target) return new R(T).toString(); return a.length ? new R(...a) : new R(T); }\n` +
    `D.prototype = R.prototype; D.now = () => T; D.parse = R.parse; D.UTC = R.UTC;\nglobalThis.Date = D;\n` +
    (planterOnly ? `process.env.NODE_OPTIONS = String(process.env.NODE_OPTIONS || "").split(${JSON.stringify(`--import=${url}`)}).join("").trim();\n` : ""));
  return { ...process.env, NODE_OPTIONS: `${process.env.NODE_OPTIONS ? `${process.env.NODE_OPTIONS} ` : ""}--import=${url}` };
}

/** a tree's own plants under a door: { k, n, last, exit } */
function plantsOn(tree, env) {
  const f = join(tree, "ci", "witness", "mmeter", "witness_meter.mjs");
  if (!existsSync(f)) return { k: null, n: null, last: "UNREAD · no ci/witness/mmeter/witness_meter.mjs", exit: null };
  const r = spawnSync(process.execPath, [f, "plants", "--org", tree], { cwd: tree, env, encoding: "utf8", windowsHide: true });
  const L = lines(r.stdout);
  const last = L.filter((l) => /^PLANTS mmeter · \d+ of \d+ plant\(s\) as expected$/.test(l)).pop() || L.pop() || lines(r.stderr).pop() || "";
  const m = /· (\d+) of (\d+) plant/.exec(last);
  return { k: m ? Number(m[1]) : null, n: m ? Number(m[2]) : null, last, exit: r.status, fails: L.filter((l) => /^\s+FAIL /.test(l)).map((l) => l.trim()) };
}
const allOk = (p) => p.k !== null && p.n > 0 && p.k === p.n && p.exit === 0;
const someRed = (p) => p.k !== null && p.n > 0 && p.k < p.n;

/** a tree's own planter CLI under a door: { n, exit, line } */
function plantOn(tree, want, env) {
  const f = join(tree, "ci", "witness", "mmeter", "plant_day.mjs");
  if (!existsSync(f)) return { line: "UNREAD · no ci/witness/mmeter/plant_day.mjs", ok: false };
  const r = spawnSync(process.execPath, [f, String(want), "--org", tree], { cwd: tree, env, encoding: "utf8", windowsHide: true });
  const line = lines(r.stdout).filter((l) => /^PLANT /.test(l)).pop() || lines(r.stderr).pop() || "";
  const m = /got (\S+)\/11 · meter exit (\S+)/.exec(line);
  const ok = !!m && m[1] === String(want) && m[2] === (Number(want) === 11 ? "0" : "3");
  return { line, ok };
}

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
  return cmds.filter((c) => PREFIXES.some((p) => c.includes(p)));
}

function main() {
  const a = process.argv.slice(2);
  const opt = (k) => { const i = a.indexOf(k); return i >= 0 && a[i + 1] ? resolve(a[i + 1]) : null; };
  const org = opt("--org"), base = opt("--base-org");
  if (!org || !base || !existsSync(org) || !existsSync(base) || !statSync(org).isDirectory() || !statSync(base).isDirectory()) {
    console.log(`  both trees are required: --org ${org || "(none)"} · --base-org ${base || "(none)"} — no base, no RED to read`);
    console.log(`RED MCLK · ${CLAUSE_IDS.join(", ")}`);
    return 1;
  }
  const { AFTER, BEFORE } = instants(new Date());
  console.log(`  instants · AFTER ${ist(AFTER)} · BEFORE ${ist(BEFORE)} (door: a Date preload via NODE_OPTIONS --import)`);
  const T = mkdtempSync(join(tmpdir(), TMP_PREFIX));
  const red = [];
  let counts = "?";
  try {
    const envA = door(T, "clock_after", AFTER, false), envB = door(T, "clock_before", BEFORE, false), envP = door(T, "clock_before_planter", BEFORE, true);
    // M:midnight
    const hA = plantsOn(org, envA), hB = plantsOn(org, envB), bA = plantsOn(base, envA);
    const mid = allOk(hA) && allOk(hB) && someRed(bA);
    console.log(`  M:midnight · head AFTER ${hA.last} · head BEFORE ${hB.last} · base AFTER ${bA.last} → ${mid ? "HOLDS" : "RED"}`);
    for (const [w, p] of [["head AFTER", hA], ["head BEFORE", hB]]) for (const f of (p.fails || []).slice(0, 3)) console.log(`      ${w} ${f.slice(0, 200)}`);
    counts = `${hA.k} of ${hA.n} at AFTER · ${hB.k} of ${hB.n} at BEFORE (base ${bA.k} of ${bA.n} at AFTER)`;
    if (!mid) red.push("M:midnight");
    // M:one-instant
    const h11 = plantOn(org, 11, envP), h5 = plantOn(org, 5, envP), b11 = plantOn(base, 11, envP), b5 = plantOn(base, 5, envP);
    const one = h11.ok && h5.ok && !(b11.ok && b5.ok);
    console.log(`  M:one-instant · head ${h11.line.slice(0, 64)} | ${h5.line.slice(0, 64)} · base ${b11.line.slice(0, 64)} | ${b5.line.slice(0, 64)} → ${one ? "HOLDS" : "RED"}`);
    if (!one) red.push("M:one-instant");
  } finally { rmSync(T, { recursive: true, force: true }); }
  const bd = bound(org, base);
  console.log(`  BOUND · ${bd.ok ? "GREEN" : "RED"} · ${bd.why}`);
  if (!bd.ok) red.push("BOUND");
  const left = survivors();
  console.log(`  LAST · ${left.length ? `RED · ${left.length} process(es) name ${PREFIXES.join(" / ")}` : "GREEN · no process names the temp prefixes"}`);
  if (left.length) red.push("LAST");
  if (red.length) { console.log(`RED MCLK · ${red.join(", ")}`); return 1; }
  console.log(`GREEN MCLK the mmeter plants ${counts} on both sides of IST midnight, the meter read at the planter's one instant, RED at base and GREEN at head · ${CLAUSE_IDS.length} clause(s)`);
  return 0;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exitCode = main();
