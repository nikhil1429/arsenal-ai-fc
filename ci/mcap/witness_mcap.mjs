#!/usr/bin/env node
// ============================================================================
// ci/mcap/witness_mcap.mjs — UNIT mcap · THE UNIT WITNESS AGAINST BASE (the landing law; forks row 1184 option A)
// ----------------------------------------------------------------------------
// USAGE: node ci/mcap/witness_mcap.mjs --org <head tree> --base-org <base tree> [--parent-org <parent tree>]
//   --org and --base-org are REQUIRED: without a base there is no RED to read, and the witness is RED, never a pass.
//   --parent-org is optional (forks row 1200 (2): the clauses are judged against BASE, the BOUND against the parent). With it, the
//   BOUND compares head with parent. Without it, the BOUND compares head with base, so at a head past later landings it names
//   their files, and the suite member's bound family rules that line.
// WHAT IT READS — the unit's seven clauses (spec ci/mwit/MWIT_SPEC.md @ 88bf69d; rulings forks rows 1162 / 1163 / 1173 / 1194):
//   C:capability-c07 · c10 · c12 · c13 · c18 · c28 · c32
// HOW — the clause code is the HEAD's own: <org>/ci/witness/mcap/witness_capability.mjs, run in its `plants` mode ONCE PER
//   TREE, `plants --org <tree>`. Every plant runs on a copy of that TREE's scripts/ and capability map under os.tmpdir(), and
//   prints `CLAUSE <id> GREEN|RED · k/n plant(s)`. A clause HOLDS iff it reads RED on the base tree AND GREEN on the head tree.
//   A head tree without ci/witness/mcap/ is UNREAD and RED.
// BOUND — the two trees are walked (no git needed: the member hands LF trees with no .git). Every file whose bytes differ
//   (CRLF folded to LF), or that exists on one side only, must be one of the unit's named files. node_modules and .git are
//   not part of a tree. LAST — no process naming the plants' temp prefix (mcap-wit-) survives.
// CONTRACT — no port bound, no service named, nothing POSTed, nothing restarted, no network, no model. Every child is
//   spawnSync, so every wait ends with its child; no timeout, budget or size is typed. Every line is split on \r?\n.
// LAST LINE: GREEN MCAP <what> · 7 clause(s) (exit 0) · RED MCAP · <ids> (exit 1)
// ============================================================================
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, resolve, relative, sep } from "node:path";
import { spawnSync } from "node:child_process";

const CLAUSE_IDS = ["c07", "c10", "c12", "c13", "c18", "c28", "c32"].map((c) => `C:capability-${c}`);
const TMP_PREFIX = "mcap-wit-";
const lines = (t) => String(t || "").split(/\r?\n/).filter((l) => l.trim());
// the unit's files (its UNITS row + the brief + forks row 1184 A); the effort receipt is the brief's one exception
const NAMED = [/^ci\/witness\/mcap\/(witness_capability\.mjs|capability_map\.json)$/,
  /^ci\/mcap\/(PROOF\.md|LEDGER\.jsonl|BASE|run_mutants_mcap\.mjs|witness_mcap\.mjs)$/, /^campaign-2026-09\/receipts_effort\/mcapw_00\.json$/];
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
function bound(org, against) {
  const a = new Set(filesOf(org)), b = new Set(filesOf(against));
  const diff = [];
  for (const f of new Set([...a, ...b])) if (!a.has(f) || !b.has(f) || lf(join(org, f)) !== lf(join(against, f))) diff.push(f);
  const extra = diff.filter((f) => !NAMED.some((re) => re.test(f))).sort();
  return extra.length ? { ok: false, why: `${extra.length} file(s) beyond the unit's: ${extra.slice(0, 6).join(", ")}${extra.length > 6 ? " …" : ""}` }
    : { ok: true, why: `${diff.length} file(s) differ, every one named` };
}

/** the head's clause code over ONE tree: { by: { id: GREEN|RED }, exit, fails } */
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
  const isDir = (p) => !!p && existsSync(p) && statSync(p).isDirectory();
  const org = opt("--org"), base = opt("--base-org"), parent = opt("--parent-org");
  const red = [];
  if (!isDir(org) || !isDir(base) || (a.includes("--parent-org") && !isDir(parent))) {
    console.log(`  the trees are required: --org ${org || "(none)"} · --base-org ${base || "(none)"}${a.includes("--parent-org") ? ` · --parent-org ${parent || "(none)"}` : ""} — no base, no RED to read`);
    console.log(`RED MCAP · ${CLAUSE_IDS.join(", ")}`);
    return 1;
  }
  const runner = join(org, "ci", "witness", "mcap", "witness_capability.mjs");
  if (!existsSync(runner)) {
    console.log("  UNREAD · the head tree carries no ci/witness/mcap/witness_capability.mjs (the clause code)");
    console.log(`RED MCAP · ${CLAUSE_IDS.join(", ")}`);
    return 1;
  }
  const B = clausesOn(runner, base), H = clausesOn(runner, org);
  for (const id of CLAUSE_IDS) {
    const atBase = B.by[id] || "UNREAD", atHead = H.by[id] || "UNREAD";
    const holds = atBase === "RED" && atHead === "GREEN";
    const bf = B.fails.filter((f) => f.startsWith(id)), hf = H.fails.filter((f) => f.startsWith(id));
    console.log(`  ${id} · base ${atBase}${bf.length ? ` (${bf.length} plant(s) fail, first: ${bf[0].slice(id.length + 3, id.length + 90)})` : ""} · head ${atHead}${hf.length ? ` (${hf.length} plant(s) fail, first: ${hf[0].slice(id.length + 3, id.length + 90)})` : ""}`);
    if (!holds) red.push(id);
  }
  const bd = bound(org, parent || base);
  console.log(`  BOUND (against the ${parent ? "parent" : "base"}) · ${bd.ok ? "GREEN" : "RED"} · ${bd.why}`);
  if (!bd.ok) red.push("BOUND");
  const left = survivors();
  console.log(`  LAST · ${left.length ? `RED · ${left.length} process(es) name ${TMP_PREFIX}` : "GREEN · no process names the temp prefix"}`);
  if (left.length) red.push("LAST");
  if (red.length) { console.log(`RED MCAP · ${red.join(", ")}`); return 1; }
  console.log(`GREEN MCAP capability map + witness (c07 c10 c12 c13 c18 c28 c32), RED at base and GREEN at head · ${CLAUSE_IDS.length} clause(s)`);
  return 0;
}
process.exitCode = main();
