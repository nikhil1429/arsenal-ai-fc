#!/usr/bin/env node
// ============================================================================
// ci/mmeter/witness_mmeter.mjs — UNIT mmeter · THE UNIT WITNESS AGAINST BASE (the landing law; forks row 1184 option A)
// ----------------------------------------------------------------------------
// USAGE: node ci/mmeter/witness_mmeter.mjs --org <head tree> --base-org <base tree>
//   Both arguments are REQUIRED: without --base-org there is no base to read RED, and the witness is RED, never a pass.
// WHAT IT READS — both clauses of the unit (spec ci/mwit/MWIT_SPEC.md @ 88bf69d; rulings forks rows 1162 / 1163):
//   A:day-11       the meter's strict exit (F1 A / F12 A: exit 0 only at 11/11 on a study day, 3 below, its line unchanged)
//                  and the read-only meter witness over planted ledgers (latestByDate, exported by the owner)
//   A:old-day-red  the old recorded day still RED through done.mjs's exported oldDayRed, after a row stamped with code_sha
// HOW — the clause code is the HEAD's own: <org>/ci/witness/mmeter/witness_meter.mjs, run in its `plants` mode ONCE PER
//   TREE, `plants --org <tree>`: every plant runs the TREE's own scripts (its daily_green.mjs CLI on a copy under os.tmpdir(),
//   its exported readers) and prints `CLAUSE <id> GREEN|RED · k/n plant(s)`. A clause HOLDS iff it reads RED on the base tree
//   AND GREEN on the head tree. The head tree without ci/witness/mmeter/ is UNREAD and RED.
// BOUND — the two trees are walked (no git needed: the member hands LF trees with no .git) and every file whose bytes differ
//   (CRLF folded to LF), or that exists on one side only, must be one of the unit's named files. node_modules and .git are
//   not part of a tree. LAST — no process naming the temp prefix the plants use (mmeter-wit-) survives.
// CONTRACT — no port bound, no service named, nothing POSTed, nothing restarted, no network, no model. Every child is
//   spawnSync, so every wait ends with its child; no timeout, budget or size is typed. Every line is split on \r?\n.
// LAST LINE: GREEN MMETER <what> · 2 clause(s) (exit 0) · RED MMETER · <ids> (exit 1)
// ============================================================================
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, resolve, relative, sep } from "node:path";
import { spawnSync } from "node:child_process";

const CLAUSE_IDS = ["A:day-11", "A:old-day-red"];
const TMP_PREFIX = "mmeter-wit-";
const lines = (t) => String(t || "").split(/\r?\n/).filter((l) => l.trim());
// the unit's files (its UNITS row + the brief); the effort receipt is the brief's one exception
const NAMED = [/^scripts\/daily_green\.mjs$/, /^scripts\/done\.mjs$/, /^scripts\/organism_test\.mjs$/, /^ci\/witness\/mmeter\/(witness_meter|plant_day)\.mjs$/,
  /^ci\/mmeter\/(PROOF\.md|LEDGER\.jsonl|BASE|run_mutants_mmeter\.mjs|witness_mmeter\.mjs)$/, /^campaign-2026-09\/receipts_effort\/mmeter_00\.json$/];
const SKIP = new Set(["node_modules", ".git"]);

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

/** the head's clause code over ONE tree: { by: { id: GREEN|RED }, exit } */
function clausesOn(runner, tree) {
  const r = spawnSync(process.execPath, [runner, "plants", "--org", tree], { encoding: "utf8", windowsHide: true });
  const by = {};
  for (const l of lines(r.stdout)) { const m = /^CLAUSE (\S+) (GREEN|RED) · /.exec(l); if (m) by[m[1]] = m[2]; }
  return { by, exit: r.status, fails: lines(r.stdout).filter((l) => /^\s+FAIL /.test(l)).map((l) => l.trim().replace(/^FAIL\s+/, "")) };
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

function main() {
  const a = process.argv.slice(2);
  const opt = (k) => { const i = a.indexOf(k); return i >= 0 && a[i + 1] ? resolve(a[i + 1]) : null; };
  const org = opt("--org"), base = opt("--base-org");
  const red = [];
  if (!org || !base || !existsSync(org) || !existsSync(base) || !statSync(org).isDirectory() || !statSync(base).isDirectory()) {
    console.log(`  both trees are required: --org ${org || "(none)"} · --base-org ${base || "(none)"} — no base, no RED to read`);
    console.log(`RED MMETER · ${CLAUSE_IDS.join(", ")}`);
    return 1;
  }
  const runner = join(org, "ci", "witness", "mmeter", "witness_meter.mjs");
  if (!existsSync(runner)) {
    console.log(`  UNREAD · the head tree carries no ci/witness/mmeter/witness_meter.mjs (the clause code)`);
    console.log(`RED MMETER · ${CLAUSE_IDS.join(", ")}`);
    return 1;
  }
  const B = clausesOn(runner, base), H = clausesOn(runner, org);
  for (const id of CLAUSE_IDS) {
    const atBase = B.by[id] || "UNREAD", atHead = H.by[id] || "UNREAD";
    const holds = atBase === "RED" && atHead === "GREEN";
    const bf = B.fails.filter((f) => f.startsWith(id)), hf = H.fails.filter((f) => f.startsWith(id));
    console.log(`  ${id} · base ${atBase}${bf.length ? ` (${bf.length} plant(s) fail, first: ${bf[0].slice(id.length + 3, id.length + 90)})` : ""} · head ${atHead}${hf.length ? ` (${hf.length} plant(s) fail, first: ${hf[0].slice(id.length + 3, id.length + 90)})` : ""} → ${holds ? "HOLDS" : "RED"}`);
    if (!holds) red.push(id);
  }
  const bd = bound(org, base);
  console.log(`  BOUND · ${bd.ok ? "GREEN" : "RED"} · ${bd.why}`);
  if (!bd.ok) red.push("BOUND");
  const left = survivors();
  console.log(`  LAST · ${left.length ? `RED · ${left.length} process(es) name ${TMP_PREFIX}` : "GREEN · no process names the temp prefix"}`);
  if (left.length) red.push("LAST");
  if (red.length) { console.log(`RED MMETER · ${red.join(", ")}`); return 1; }
  console.log(`GREEN MMETER strict meter exit + old-day red, RED at base and GREEN at head · ${CLAUSE_IDS.length} clause(s)`);
  return 0;
}
process.exitCode = main();
