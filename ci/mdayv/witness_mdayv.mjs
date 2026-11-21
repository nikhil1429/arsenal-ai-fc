#!/usr/bin/env node
// ============================================================================
// ci/mdayv/witness_mdayv.mjs — UNIT mdayv · THE UNIT WITNESS (the day meter takes ONE final read of a day after it is over;
//   forks rows 1195 / 1196 (2) / 1229 — the ruling wins over the spec ci/mdayv/MDAYV_SPEC.md @ 2640694)
// ----------------------------------------------------------------------------
// USAGE: node ci/mdayv/witness_mdayv.mjs --org <dir> --base-org <dir> [--only V1,V9,…] [--at <ISO instant>]
//   --org       the tree to witness (the build reads GREEN)
//   --base-org  the BASE tree (main 7bf008b, ci/mdayv/BASE) — every clause must read RED there; absent, every clause is RED
//               (a witness that ignores its base is a pass-through, never a witness)
//   --only      only these clauses' plants (the mutant runner's door); BOUND, GIT STATUS and LAST always run
//   --at        the planter's ONE read of the clock (default: now) — C2 runs it before and after 00:00 IST
// CONTRACT
//   · The clauses V1-V10 are ci/witness/mdayv/witness_dayv.mjs's (its header names each, planted both ways), loaded from
//     --org (the neutral member runs this file from a temp dir holding only ci/mdayv); this file runs its plantsFor() on the
//     base and on the build with the SAME planted instant T, derived ONCE from the one read and the
//     build's floor (C1: never a fresh new Date() per plant; T is handed to every child through the mclk door).
//   · A clause is GREEN iff it reads RED on the base AND GREEN on the build.
//   · BOUND: the files that differ between --org and --base-org (a content walk, CRLF folded to LF; .git, node_modules,
//     dressing-room/state and *.log skipped) are only the unit's named files; ci/mdayv/BASE is 40 hex; when --base-org is a
//     git work tree its HEAD is ci/mdayv/BASE. No typed table of other units' lines or counts (row 1224 (5)).
//   · GIT STATUS: when --org is a git work tree, `git status --porcelain` is the same before and after the run (no tracked
//     file moves; a final read writes only the meter ledger, and only under a planted state dir).
//   · THE PORT CLASS (row 1053), CRLF, Windows: as witness_dayv.mjs. LAST: no process naming the temp prefix survives.
// LAST LINE: GREEN MDAYV <what> · <n> clause(s) (exit 0) · RED MDAYV · <clauses> (exit 1)
// ============================================================================
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, resolve, relative, sep } from "node:path";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const lines = (t) => String(t || "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
const slash = (p) => p.split(sep).join("/");
// BOUND — exactly the brief's named files (spec §7) and the effort receipt (the brief's one exception)
const NAMED = [/^scripts\/(daily_green|day|conductor)\.mjs$/, /^ci\/mdayv\/(BASE|witness_mdayv\.mjs|run_mutants_mdayv\.mjs|PROOF\.md|LEDGER\.jsonl)$/,
  /^ci\/witness\/mdayv\/witness_dayv\.mjs$/, /^campaign-2026-09\/receipts_effort\/mdayvb_00\.json$/];
const SKIP = (rel) => { const top = rel.split("/")[0]; return top === ".git" || top === "node_modules" || rel === "dressing-room/state" || rel.startsWith("dressing-room/state/") || /\.log$/.test(rel); };

function tree(dir) {
  const m = new Map();
  const w = (p) => {
    for (const e of readdirSync(p, { withFileTypes: true })) {
      const q = join(p, e.name), rel = slash(relative(dir, q));
      if (SKIP(rel)) continue;
      if (e.isDirectory()) w(q);
      else if (e.isFile()) m.set(rel, createHash("sha256").update(readFileSync(q).toString("utf8").replace(/\r\n/g, "\n")).digest("hex"));
    }
  };
  w(dir); return m;
}
const isRepo = (d) => spawnSync("git", ["rev-parse", "--is-inside-work-tree"], { cwd: d, encoding: "utf8", windowsHide: true }).stdout.trim() === "true" && existsSync(join(d, ".git"));
const porcelain = (d) => String(spawnSync("git", ["-c", "core.autocrlf=false", "status", "--porcelain"], { cwd: d, encoding: "utf8", windowsHide: true }).stdout || "");

function bound(org, baseOrg) {
  if (!baseOrg) return { ok: false, why: "no --base-org: BOUND cannot be read" };
  const want = existsSync(join(org, "ci", "mdayv", "BASE")) ? lines(readFileSync(join(org, "ci", "mdayv", "BASE"), "utf8"))[0] : "";
  if (!/^[0-9a-f]{40}$/.test(want || "")) return { ok: false, why: "ci/mdayv/BASE is not 40 hex" };
  if (isRepo(baseOrg)) {
    const bh = String(spawnSync("git", ["rev-parse", "HEAD"], { cwd: baseOrg, encoding: "utf8", windowsHide: true }).stdout || "").trim();
    if (bh !== want) return { ok: false, why: `the base-org HEAD ${bh.slice(0, 12)} is not ci/mdayv/BASE ${want.slice(0, 12)}` };
  }
  const a = tree(org), b = tree(baseOrg);
  const differ = [...new Set([...a.keys(), ...b.keys()])].filter((k) => a.get(k) !== b.get(k)).sort();
  const extra = differ.filter((n) => !NAMED.some((re) => re.test(n)));
  return extra.length ? { ok: false, why: `files beyond the unit's: ${extra.slice(0, 6).join(", ")}${extra.length > 6 ? ` (+${extra.length - 6})` : ""}` } : { ok: true, why: `${differ.length} file(s) differ, every one named` };
}

async function main() {
  const a = process.argv.slice(2);
  const opt = (k) => { const i = a.indexOf(k); return i >= 0 && a[i + 1] && !a[i + 1].startsWith("--") ? a[i + 1] : null; };
  if (!opt("--org")) { console.log("RED MDAYV · USAGE (--org <dir> --base-org <dir> [--only …] [--at ISO])"); return 1; }
  const org = resolve(opt("--org")), baseOrg = opt("--base-org") ? resolve(opt("--base-org")) : null;
  const only = opt("--only") ? opt("--only").split(",") : null;
  const read = opt("--at") ? Date.parse(opt("--at")) : Date.now();   // THE ONE READ of the clock (C1)
  if (!Number.isFinite(read)) { console.log("RED MDAYV · USAGE (--at needs an ISO instant)"); return 1; }
  // the plants are the ORG's clause witness (one instrument for both trees): the neutral member runs this file from a temp dir
  // that holds only ci/mdayv, so it is loaded from --org, never by a path relative to this file
  const W = join(org, "ci", "witness", "mdayv", "witness_dayv.mjs");
  if (!existsSync(W)) { console.log("RED MDAYV · USAGE (--org carries no ci/witness/mdayv/witness_dayv.mjs)"); return 1; }
  const { plantsFor, floorOf, plantedInstant, clauseOk, survivors, CLAUSE_IDS, TMP_PREFIX } = await import(pathToFileURL(W).href);
  const floor = floorOf(org), T = plantedInstant(read, floor);
  const repo = isRepo(org), st0 = repo ? porcelain(org) : null;
  const ids = CLAUSE_IDS.filter((id) => !only || only.includes(id));
  console.log(`witness mdayv · org ${org} · base ${baseOrg || "NONE"} · the one instant ${new Date(read).toISOString()} → planted T ${new Date(T).toISOString()} (IST day ${new Date(T + 330 * 60000).toISOString().slice(0, 10)}) · floor ${floor || "none"}`);
  const B = baseOrg ? await plantsFor(baseOrg, { T, floor, only: ids }) : null;
  const O = await plantsFor(org, { T, floor, only: ids });
  const red = [];
  for (const id of ids) {
    const onBase = B ? !clauseOk(B[id]) : false, onBuild = clauseOk(O[id]);
    const fb = B ? B[id].filter((p) => !p.ok).length : 0;
    console.log(`  ${onBase && onBuild ? "GREEN" : "RED  "} ${id} · base ${B ? (onBase ? `RED (${fb}/${B[id].length} plant(s) fail)` : "GREEN — the base does not show the defect") : "UNREAD (no --base-org)"} · build ${onBuild ? "GREEN" : "RED"} (${O[id].filter((p) => p.ok).length}/${O[id].length})`);
    for (const p of O[id].filter((x) => !x.ok)) console.log(`      build FAIL ${p.name} — got ${p.got}`);
    if (!(onBase && onBuild)) red.push(id);
  }
  const bd = bound(org, baseOrg);
  console.log(`  ${bd.ok ? "GREEN" : "RED  "} BOUND · ${bd.why}`);
  if (!bd.ok) red.push("BOUND");
  if (repo) {
    const st1 = porcelain(org), same = st1 === st0;
    console.log(`  ${same ? "GREEN" : "RED  "} GIT STATUS · ${same ? `unchanged across the run (${lines(st1).length} line(s), none of this run's)` : "a tracked file moved during the run"}`);
    if (!same) red.push("GIT STATUS");
  } else console.log("  ----- GIT STATUS · the org is not a git work tree (a copy): not read");
  const left = survivors();
  console.log(`  ${left.length ? "RED  " : "GREEN"} LAST · ${left.length ? `${left.length} process(es) name ${TMP_PREFIX}` : "no process names the temp prefix"}`);
  if (left.length) red.push("LAST");
  if (red.length) { console.log(`RED MDAYV · ${red.join(", ")}`); return 1; }
  console.log(`GREEN MDAYV the final read (one per day, written once, after its close settles, from the floor; both carriers), RED on base and GREEN on build · ${ids.length} clause(s)`);
  return 0;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exitCode = await main();
