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
import { readFileSync, readdirSync, existsSync, statSync, mkdtempSync, mkdirSync, writeFileSync, rmSync, cpSync, symlinkSync, unlinkSync } from "node:fs";
import { join, resolve, relative, sep, dirname, delimiter } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { createServer } from "node:net";
import { pathToFileURL, fileURLToPath } from "node:url";

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
function door(dir, name, T, planterOnly, moving = false) {
  const f = join(dir, `${name}.mjs`);
  const url = pathToFileURL(f).href;
  writeFileSync(f, `const R = globalThis.Date, T = ${T}, S = R.now();\nconst now = () => ${moving ? "T + (R.now() - S)" : "T"};\n` +
    `function D(...a) { if (!new.target) return new R(now()).toString(); return a.length ? new R(...a) : new R(now()); }\n` +
    `D.prototype = R.prototype; D.now = now; D.parse = R.parse; D.UTC = R.UTC;\nglobalThis.Date = D;\n` +
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

// ── THE CENSUS (row 1214 (4)) — counts and names only, nothing edited ────────────────────────────────────────────────
// node ci/mclk/witness_mclk.mjs census [--sha <commit>]   (default: ci/mclk/BASE, main at the cut; needs this clone's git)
//   SCANNED: every ci/witness/<u>/witness_*.mjs (its plants mode) and every unit witness ci/<u>/witness_<u>.mjs of the tree.
//   DERIVES (a static read of the witness file's code lines, comment lines dropped): a Date built from now (`new Date()`,
//   `new Date(Date.now…)`, `new Date(now…)`, `new Date(boot…)`), a git date from now (GIT_COMMITTER_DATE / GIT_AUTHOR_DATE),
//   or an epoch from now (`epoch(now…` / `epoch(Date.now…`); pure elapsed-time bounds (`Date.now() - t0`) are not a day.
//   RUN: every plants mode, and every unit witness that derives, under three clocks — AFTER and BEFORE through the
//   ALL-CHILDREN door in its MOVING form (the clock starts at the instant and runs on, so a witness's own Date.now() waits
//   still end), and REAL (no door) as the control that tells a clock red from a red at any hour. A unit witness runs as the
//   suite member runs it (scripts/organism_test.mjs witnesses()): fresh LF trees of the commit (--org) and of its
//   ci/<u>/BASE (--base-org) under the temp dir, node_modules linked, a claude and a gemini that refuse first on PATH, every
//   exported organ port door set to an OS-picked free port, the witness run from a copy of its dir, every BOUND id dropped
//   from its RED last line, each wait bounded by .github/workflows/suite.yml timeout-minutes (read, never typed).
//   A SITE is a run RED at AFTER or BEFORE; it is a CLOCK SITE iff the REAL control reads GREEN.
const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const DERIVE = /new Date\(\s*\)|new Date\(\s*(Date\.now|now\b|boot\b)|GIT_(COMMITTER|AUTHOR)_DATE|epoch\(\s*(now\b|Date\.now)/;
const unitFile = (dir, u) => [`witness_${u}.mjs`, `witness_${u.replace(/-/g, "_")}.mjs`].find((f) => existsSync(join(dir, f))) || null;
function treeOf(sha, into) {
  mkdirSync(into, { recursive: true });
  const r = spawnSync("git", ["-c", "core.autocrlf=false", "-c", "core.eol=lf", "-C", REPO, `--work-tree=${into}`, "checkout", "-q", sha, "--", "."],
    { encoding: "utf8", windowsHide: true, env: { ...process.env, GIT_INDEX_FILE: `${into}.index` } });
  rmSync(`${into}.index`, { force: true });
  if (r.status !== 0) return lines(r.stderr)[0] || `checkout ${sha.slice(0, 12)} failed`;
  if (existsSync(join(REPO, "node_modules"))) symlinkSync(join(REPO, "node_modules"), join(into, "node_modules"), process.platform === "win32" ? "junction" : "dir");
  return null;
}
const unlinkNm = (t) => { try { unlinkSync(join(t, "node_modules")); } catch { /* no link */ } };
const freePort = () => new Promise((res, rej) => { const v = createServer(); v.once("error", rej); v.listen(0, "127.0.0.1", () => { const ad = v.address(); v.close(() => res(typeof ad === "object" && ad ? ad.port : 0)); }); });
function portDoors(tree) {
  const doors = [];
  const dir = join(tree, "scripts");
  for (const f of existsSync(dir) ? readdirSync(dir).filter((x) => x.endsWith(".mjs")) : []) for (const l of readFileSync(join(dir, f), "utf8").split(/\r?\n/)) {
    const m = /^export const ([A-Z_]*PORT) = (.*)$/.exec(l);
    const dm = m && /process\.env\.([A-Z0-9_]+)|["'](ARSENAL_[A-Z0-9_]*PORT)["']/.exec(m[2]);
    if (dm) doors.push(dm[1] || dm[2]);
  }
  return [...new Set(doors)];
}
const bidsOf = (src) => [...new Set(["BOUND", ...[...src.matchAll(/["'`]((?:[A-Z][A-Z0-9-]*\s+)?BOUND)["'`]/g)].map((m) => m[1])])].sort((x, y) => y.length - x.length);
function judge(out, code, unit, bids) {
  const last = lines(out).map((l) => l.trim()).pop() || "";
  const U = unit.toUpperCase();
  if (code === 0 && last.startsWith(`GREEN ${U} `)) return { ok: true, last };
  const m = new RegExp(`^RED ${U} · (.*)$`).exec(last);
  if (code !== 1 || !m) return { ok: false, last: last || `(no line, exit ${code})` };
  let rest = ` ${m[1]} `;
  for (const id of bids) rest = rest.split(new RegExp(`(?<=^|[\\s,·])${id.replace(/\s+/g, "\\s+")}(?=$|[\\s,·])`)).join(" ");
  return { ok: rest.replace(/[\s,·]+/g, " ").trim() === "", last };
}
function killNaming(dir) {
  if (process.platform !== "linux") return;
  for (const pid of readdirSync("/proc").filter((x) => /^\d+$/.test(x) && Number(x) !== process.pid)) {
    try { if (readFileSync(`/proc/${pid}/cmdline`, "utf8").replace(/\0/g, " ").includes(dir)) process.kill(Number(pid)); } catch { /* ended */ }
  }
}

async function census(a) {
  const si = a.indexOf("--sha");
  const sha = si >= 0 ? a[si + 1] : lines(readFileSync(join(REPO, "ci", "mclk", "BASE"), "utf8"))[0];
  const wf = (() => { try { return readFileSync(join(REPO, ".github", "workflows", "suite.yml"), "utf8"); } catch { return ""; } })();
  const jobMin = Number((/timeout-minutes:\s*(\d+)/.exec(wf) || [])[1]);
  if (!(jobMin > 0)) { console.log("CENSUS mclk · UNREAD · no timeout-minutes in .github/workflows/suite.yml"); return 2; }
  const W = mkdtempSync(join(tmpdir(), TMP_PREFIX + "census-"));
  try {
    const scan = join(W, "scan");
    const e = treeOf(sha, scan);
    if (e) { console.log(`CENSUS mclk · UNREAD · ${e}`); return 2; }
    unlinkNm(scan);
    const wdir = join(scan, "ci", "witness");
    const plants = existsSync(wdir) ? readdirSync(wdir).filter((u) => statSync(join(wdir, u)).isDirectory()).sort()
      .flatMap((u) => readdirSync(join(wdir, u)).filter((f) => /^witness_.*\.mjs$/.test(f)).sort().map((f) => `ci/witness/${u}/${f}`)) : [];
    const units = readdirSync(join(scan, "ci")).filter((d) => /^[a-z0-9-]+$/.test(d) && d !== "witness" && !!unitFile(join(scan, "ci", d), d)).sort();
    const derive = {};
    for (const f of [...plants, ...units.map((u) => `ci/${u}/${unitFile(join(scan, "ci", u), u)}`)]) {
      const hits = readFileSync(join(scan, f), "utf8").split(/\r?\n/).map((l, i) => ({ l, i: i + 1 })).filter(({ l }) => !/^\s*\/\//.test(l) && DERIVE.test(l)).map(({ i }) => i);
      if (hits.length) derive[f] = hits;
    }
    console.log(`  commit ${sha} · scanned ${plants.length} plants mode(s) + ${units.length} unit witness(es)`);
    for (const [f, h] of Object.entries(derive)) console.log(`  DERIVES ${f}:${h.join(",")}`);
    const { AFTER, BEFORE } = instants(new Date());
    console.log(`  instants · AFTER ${ist(AFTER)} · BEFORE ${ist(BEFORE)} · door: the Date preload, MOVING form, every node child`);
    const clocks = [["AFTER", door(W, "census_after", AFTER, false, true)], ["BEFORE", door(W, "census_before", BEFORE, false, true)], ["REAL", { ...process.env }]];
    const shim = join(W, "shim");
    mkdirSync(shim);
    for (const tool of ["claude", "gemini"]) {
      writeFileSync(join(shim, tool), `#!/bin/sh\necho "REFUSED — no live model call in a witness (unit mclk census)" >&2\nexit 1\n`, { mode: 0o755 });
      writeFileSync(join(shim, `${tool}.cmd`), `@echo REFUSED — no live model call in a witness (unit mclk census) 1>&2\r\n@exit /b 1\r\n`);
    }
    const runs = [];
    let k = 0;
    const T0 = Date.now();
    const left = () => Math.max(1, T0 + jobMin * 60000 - Date.now());
    for (const f of plants) for (const [ck, env0] of clocks) {
      const t = join(W, `p${++k}`);
      const e2 = treeOf(sha, t);
      let res;
      if (e2) res = { ok: false, last: `UNREAD · ${e2}` };
      else {
        const r = spawnSync(process.execPath, [join(t, f), "plants"], { cwd: t, env: env0, encoding: "utf8", windowsHide: true, timeout: left() });
        killNaming(t);
        const L = lines(r.stdout);
        const last = L.filter((l) => /^PLANTS \S+ · \d+ of \d+ plant\(s\) as expected$/.test(l)).pop() || L.pop() || "";
        const m = /· (\d+) of (\d+) plant/.exec(last);
        res = { ok: r.status === 0 && !!m && Number(m[2]) > 0 && m[1] === m[2], last: last || `(no line, exit ${r.status}${r.signal ? ` ${r.signal}` : ""})`, red: L.filter((l) => /^\s+FAIL /.test(l)).slice(0, 2).map((l) => l.trim()) };
      }
      unlinkNm(t); rmSync(t, { recursive: true, force: true });
      runs.push({ f, ck, ...res });
      console.log(`  RUN ${f} plants · ${ck} · ${res.ok ? "GREEN" : "RED"} · ${res.last.slice(0, 200)}`);
    }
    for (const u of units) {
      const f = `ci/${u}/${unitFile(join(scan, "ci", u), u)}`;
      if (!derive[f]) continue;
      const baseText = existsSync(join(scan, "ci", u, "BASE")) ? readFileSync(join(scan, "ci", u, "BASE"), "utf8").trim() : "";
      const bids = bidsOf(readFileSync(join(scan, f), "utf8"));
      for (const [ck, env0] of clocks) {
        const t = join(W, `u${++k}`), orgT = join(t, "org"), baseT = join(t, "base"), wd = join(t, "w");
        let res;
        const e2 = /^[0-9a-f]{40}$/.test(baseText) ? (treeOf(sha, orgT) || treeOf(baseText, baseT)) : "ci/<u>/BASE is not one 40-hex line";
        if (e2) res = { ok: false, last: `UNREAD · ${e2}` };
        else {
          const env = { ...env0 };
          const pk = Object.keys(env).find((x) => x.toUpperCase() === "PATH") || "PATH";
          env[pk] = `${shim}${delimiter}${env[pk] || ""}`;
          for (const d of portDoors(orgT)) env[d] = String(await freePort());
          cpSync(join(scan, "ci", u), join(wd, "ci", u), { recursive: true });
          const r = spawnSync(process.execPath, [join(wd, f), "--org", orgT, "--base-org", baseT], { cwd: wd, env, encoding: "utf8", windowsHide: true, timeout: left() });
          killNaming(t);
          res = r.error && /ETIMEDOUT/.test(String(r.error.code || r.error.message)) ? { ok: false, last: "(killed at the bound)" } : judge(r.stdout, r.status, u, bids);
        }
        unlinkNm(orgT); unlinkNm(baseT); rmSync(t, { recursive: true, force: true });
        runs.push({ f, ck, ...res });
        console.log(`  RUN ${f} · ${ck} · ${res.ok ? "GREEN" : "RED"} · ${res.last.slice(0, 200)}`);
      }
    }
    const files = [...new Set(runs.map((r) => r.f))];
    const sites = files.filter((f) => runs.some((r) => r.f === f && r.ck !== "REAL" && !r.ok));
    for (const f of sites) {
      const real = runs.find((r) => r.f === f && r.ck === "REAL");
      console.log(`  SITE ${f} · ${real && real.ok ? "CLOCK SITE (REAL GREEN)" : "RED AT ANY HOUR (REAL RED too)"} · ${runs.filter((r) => r.f === f && r.ck !== "REAL" && !r.ok).map((r) => `${r.ck}: ${r.last.slice(0, 160)}`).join(" | ")}`);
    }
    console.log(`CENSUS mclk · scanned ${plants.length + units.length} · derive ${Object.keys(derive).length} · run ${files.length} · red at an instant ${sites.length} site(s)`);
    return 0;
  } finally { rmSync(W, { recursive: true, force: true }); }
}

async function main() {
  const a = process.argv.slice(2);
  if (a[0] === "census") return census(a);
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
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exitCode = await main();
