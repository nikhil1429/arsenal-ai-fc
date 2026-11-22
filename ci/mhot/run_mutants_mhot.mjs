#!/usr/bin/env node
// ============================================================================
// run_mutants_mhot.mjs — unit MHOT: ONE mutant per clause of ci/mhot/witness_mhot.mjs, each must turn RED the clause that names it.
// CONTRACT:  node ci/mhot/run_mutants_mhot.mjs --org <build tree> --base-org <tree> [--bound-base <the land commit's parent>]
//                                              [--unit-bases <dir holding one BASE tree per re-cut unit: mcov/, mprk/, mdtl2/>]
//   (forks row 1200 (2)-(3): --bound-base is handed through to every witness run, so the bound reads the parent and the
//   clauses read BASE; absent, the witness's own default holds.)
//   Each mutant copies <org> under os.tmpdir() (node_modules rides as a link, never copied), breaks ONE thing in the copy (a
//   tree file, or the copy's own witness source), and runs the copy's witness `--only <its clause>` over the copy: it must exit
//   1 with the last line `RED MHOT · <its clause>` (BOUND and LAST always run, so they must stay green under every other
//   mutant). The CONTROL runs the unmutated witness over <org>, every clause: it must exit 0 with a GREEN MHOT last line.
//   No port is bound, nothing is POSTed, nothing restarted. Every child runs with TMPDIR / TMP / TEMP under this run's temp
//   dir; after each mutant every node process naming that dir is killed (the LAST mutant plants one on purpose). Every spawn
//   is bounded by <org>'s job timeout-minutes, read from .github/workflows/suite.yml at run time, never typed. Every git
//   repo the witness plants is made with core.autocrlf=false; this runner plants none.
// LAST LINE: run_mutants: k of n mutant(s) RED by the clause that names them · control GREEN|RED (exit 0 iff k = n and GREEN)
// ============================================================================
import { mkdtempSync, readFileSync, writeFileSync, cpSync, rmSync, readdirSync, existsSync, mkdirSync, unlinkSync, symlinkSync } from "node:fs";
import { join, resolve, relative, sep } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const ORG = arg("--org") && resolve(arg("--org")), BASE = arg("--base-org") && resolve(arg("--base-org"));
// row 1309 (3): the witness judges BOUND only when --bound-base is named, so the runner always names one (the base it is handed
// when no other is given) — every BOUND-class mutant stays judged.
const BB = ["--bound-base", arg("--bound-base") ? resolve(arg("--bound-base")) : BASE];
if (!ORG || !BASE) { console.log("run_mutants: USAGE (--org <dir> --base-org <dir>)"); process.exit(1); }
const T0 = Date.now();
const jobMin = Number((/timeout-minutes:\s*(\d+)/.exec((() => { try { return readFileSync(join(ORG, ".github", "workflows", "suite.yml"), "utf8"); } catch { return ""; } })()) || [])[1]);
if (!(jobMin > 0)) { console.log("run_mutants: 0 of 0 mutant(s) · control RED (no timeout-minutes in .github/workflows/suite.yml)"); process.exit(1); }
const left = () => Math.max(1, T0 + jobMin * 60000 - Date.now());
const TMP = mkdtempSync(join(tmpdir(), "mhotmut-"));
const CT = join(TMP, "childtmp"); mkdirSync(CT);

/** replace the first `from` (at or after `after`) with `to` in <tree>/<rel> @returns {string|null} why it failed */
const edit = (tree, rel, after, from, to) => {
  const p = join(tree, rel); let s; try { s = readFileSync(p, "utf8"); } catch { return `${rel} absent`; }
  const a = after ? s.indexOf(after) : 0; if (a < 0) return `anchor not found in ${rel}`;
  const i = s.indexOf(from, a); if (i < 0) return `site not found in ${rel}: ${from.slice(0, 60)}`;
  writeFileSync(p, s.slice(0, i) + to + s.slice(i + from.length)); return null;
};
const OT = "scripts/organism_test.mjs", W = "ci/mhot/witness_mhot.mjs";
const MUTANTS = [
  { clause: "H1", what: "the member-file door also appends a roster line to one shared spot in organism_test.mjs", m: (t) => edit(t, W, null,
    "const addMember = (d, tree, name) => (isRoll(tree) ? fileAdd(d, name) : stringAdd(d, name));",
    "const addMember = (d, tree, name) => (isRoll(tree) ? (fileAdd(d, name), tableAdd(d, name, \"a roster line\")) : stringAdd(d, name));") },
  { clause: "H2", what: "the LIVE move goes back to a shared table line (the member file's live untouched)", m: (t) => edit(t, W, null,
    "const addLiveMember = (d, tree, name) => (isRoll(tree) ? fileAdd(d, name, \"planted LIVE (H2)\") :",
    "const addLiveMember = (d, tree, name) => (isRoll(tree) ? (fileAdd(d, name, \"planted LIVE (H2)\"), tableAdd(d, name, \"planted LIVE (H2)\")) :")
    || edit(t, W, null, "const unLive = (d, tree, name) => (isRoll(tree) ? fileAdd(d, name, null) :", "const unLive = (d, tree, name) => (isRoll(tree) ? tableDel(d, name) :") },
  { clause: "H3", what: "suiteRoll skips every file of organism:selftest", m: (t) => edit(t, OT, "export function suiteRoll", "    members.push({ organ, suite: j.suite", "    if (j.suite === \"organism:selftest\") continue;\n    members.push({ organ, suite: j.suite") },
  { clause: "H4", what: "suites() stops at the first red member", m: (t) => edit(t, OT, "function suites() {", "    assert(`SUITE MEMBER · ${m} selftest exits 0`, r.code === 0);\n", "    assert(`SUITE MEMBER · ${m} selftest exits 0`, r.code === 0);\n    if (r.code !== 0) break;\n") },
  { clause: "H5", what: "chain runs every member (no stop at a red)", m: (t) => edit(t, OT, "function chain(suite) {", "    if (r.status !== 0) {", "    if (r.status !== 0 && false) {") },
  { clause: "H6", what: "audit.mjs keeps its own copy of the three suite names", m: (t) => edit(t, "scripts/audit.mjs", null, "    \"suite members\": () => {\n", "    \"suite members\": () => {\n      const own = [\"organism:selftest\", \"squad:selftest\", \"audit:selftest\"]; void own;\n") },
  { clause: "H7", what: "the member file of test_coach_v2 is dropped", m: (t) => { const p = join(t, "suite", "members", "test_coach_v2.json"); if (!existsSync(p)) return "test_coach_v2.json absent"; unlinkSync(p); return null; } },
  { clause: "H8", what: "suiteRoll returns an empty roll with NO defect when the directory is absent", m: (t) => edit(t, OT, "export function suiteRoll", "    defects.push({ file: MEMBERS_REL, why: `no member directory", "    if (Date.now() > 0) return { members, defects };\n    defects.push({ file: MEMBERS_REL, why: `no member directory") },
  { clause: "H9", what: "mpool P left un-re-cut (the strings only)", m: (t) => edit(t, "ci/mpool/witness_mpool.mjs", null, "    return n + rolled === 1;", "    return n === 1;") },
  { clause: "HB", what: "BOUND judged against BASE again (the bound base ignored: row 1200 (2)-(3)'s split undone)", m: (t) => edit(t, W, null, "function bound(from = BOUND_BASE, to = ORG) {", "function bound(from = BASE, to = ORG) {"),
    // the ONE fault reads in two clauses when a real parent carrying foreign landed paths is handed in: the plant (HB) and the
    // live bound itself. Accepted only then, and named in ci/mhot/PROOF.md §11.
    also: BB.length ? "HB, BOUND" : null },
  { clause: "BOUND", what: "scripts/sitting.mjs touched (one organ byte beyond the named)", m: (t) => { const p = join(t, "scripts", "sitting.mjs"); if (!existsSync(p)) return "sitting.mjs absent"; writeFileSync(p, readFileSync(p, "utf8") + "\n// planted by run_mutants_mhot (BOUND)\n"); return null; } },
  { clause: "LAST", what: "the witness leaves a node process naming its temp dir", m: (t) => {
    const e = edit(t, W, null, 'import { spawnSync } from "node:child_process";', 'import { spawnSync, spawn as __mut } from "node:child_process";');
    return e || edit(t, W, null, "  // ── LAST ──\n", '  // ── LAST ──\n  __mut(process.execPath, ["-e", "setInterval(() => {}, 1 << 30)", TMP], { detached: true, stdio: "ignore" }).unref();\n  spawnSync(process.execPath, ["-e", "0"]);\n');
  } },
];

const namingProcs = (dir) => {
  if (process.platform === "win32") {
    const r = spawnSync("powershell", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | ForEach-Object { \"$($_.ProcessId) $($_.CommandLine)\" }"], { encoding: "utf8", windowsHide: true, timeout: left() });
    return String(r.stdout || "").split(/\r?\n/).filter((l) => l.toLowerCase().includes(dir.toLowerCase())).map((l) => Number(l.trim().split(" ")[0])).filter((p) => p && p !== process.pid);
  }
  const out = [];
  for (const p of existsSync("/proc") ? readdirSync("/proc") : []) {
    if (!/^\d+$/.test(p) || Number(p) === process.pid) continue;
    try { if (readFileSync(`/proc/${p}/cmdline`, "utf8").replace(/\0/g, " ").includes(dir)) out.push(Number(p)); } catch { /* raced */ }
  }
  return out;
};
const slash = (p) => p.split(sep).join("/");
/** a copy of <org> under <into>: node_modules rides as a link */
function copy(into) {
  cpSync(ORG, into, { recursive: true, filter: (p) => { const rel = slash(relative(ORG, p)); return rel !== "node_modules" && rel !== ".git"; } });
  if (existsSync(join(ORG, "node_modules"))) symlinkSync(join(ORG, "node_modules"), join(into, "node_modules"), process.platform === "win32" ? "junction" : "dir");
}
const childEnv = () => { const e = { ...process.env, TMPDIR: CT, TMP: CT, TEMP: CT }; for (const k of Object.keys(e)) if (/^ARSENAL_|^CLAUDE_CODE_/.test(k) || k === "ANTHROPIC_API_KEY") delete e[k]; return e; };
const runWitness = (tree, only) => {
  const r = spawnSync(process.execPath, [join(tree, W), "--org", tree, "--base-org", BASE, ...BB, ...(only ? ["--only", only] : [])], { encoding: "utf8", windowsHide: true, timeout: left(), env: childEnv(), cwd: TMP, maxBuffer: 1 << 26 });
  const out = String(r.stdout || "") + String(r.stderr || "");
  return { code: r.status, last: out.split(/\r?\n/).map((s) => s.trim()).filter(Boolean).pop() || "" };
};

// ── THE MLAW RE-CUT'S MUTANTS (forks row 1204) ─────────────────────────────────────────────────────────────────────
// ci/mlaw/witness_mlaw.mjs COVERAGE and HERMETIC were re-cut by this unit to read the member roll. Each mutant breaks ONE
// member file in a copy of <org>; the copy is made a git repo (core.autocrlf=false) because the law pack lists files with
// git. mlaw's witness has no --only and no bound-base door, so it is judged by its RED SET: the mutant's set must be the
// control's set plus exactly its own clause, and the control (the unmutated copy) must hold neither clause.
const MLAW_MUTANTS = [
  { clause: "COVERAGE", what: "the done member file removed", m: (t) => { const p = join(t, "suite", "members", "done.json"); if (!existsSync(p)) return "done.json absent"; unlinkSync(p); return null; } },
  { clause: "HERMETIC", what: "lawpack's member file given a LIVE reason again", m: (t) => edit(t, "suite/members/lawpack.json", null, '"live":null', '"live":"planted LIVE (run_mutants_mhot)"') },
];
const gitify = (t) => { const g = (...a) => spawnSync("git", ["-c", "core.autocrlf=false", "-c", "user.name=mhot-mutants", "-c", "user.email=mutants@invalid", "-c", "commit.gpgsign=false", ...a], { cwd: t, encoding: "utf8", windowsHide: true, timeout: left() });
  g("init", "-q"); g("config", "core.autocrlf", "false"); writeFileSync(join(t, ".git", "info", "exclude"), "node_modules\n"); g("add", "-A"); return g("commit", "-q", "--no-verify", "-m", "mutant copy").status === 0 ? null : "git commit failed"; };
const mlawReds = (t) => {
  const r = spawnSync(process.execPath, [join(t, "ci", "mlaw", "witness_mlaw.mjs"), "--org", t, "--base-org", BASE], { encoding: "utf8", windowsHide: true, timeout: left(), env: childEnv(), cwd: TMP, maxBuffer: 1 << 28 });
  const last = (String(r.stdout || "") + String(r.stderr || "")).split(/\r?\n/).map((x) => x.trim()).filter(Boolean).pop() || "";
  const m = /^RED MLAW · (.*)$/.exec(last);
  return { last, set: m ? m[1].split(" · ").map((x) => x.trim()).sort() : /^GREEN MLAW /.test(last) ? [] : null };
};
// ── THE ROW 1309 (1) RE-CUTS' MUTANTS (mcov, mprk, mdtl2: MHOT-M2 = A) ───────────────────────────────────────────────
// Each breaks ONE thing in a copy of <org> (a member file, or the copy's own witness source) and runs the copy's witness of
// that unit against THAT UNIT'S own BASE tree, handed in as <dir>/<unit> by --unit-bases <dir> (absent: the block is NOT RUN
// and named). Judged by the named clause: RED on the mutant's last line, not red on the unmutated control's (the control runs
// once per unit). A witness's other reds (its BOUND, this container's) ride both lines unchanged.
const UB = arg("--unit-bases") ? resolve(arg("--unit-bases")) : null;
const WIT_MUTANTS = [
  { unit: "mprk", clause: "COVER", re: /\bCOVER\b/, what: "the parked member file removed", m: (t) => { const p = join(t, "suite", "members", "parked.json"); if (!existsSync(p)) return "parked.json absent"; unlinkSync(p); return null; } },
  { unit: "mcov", clause: "C1 COVERAGE", re: /C1 COVERAGE/, what: "the planted mcov_slow member file never written (the plant's member file removed)", m: (t) => edit(t, "ci/mcov/witness_mcov.mjs", null, 'for (const o of ["mcov_slow", "mcov_hang"])', 'for (const o of ["mcov_hang"])') },
  { unit: "mcov", clause: "C5 ONE RECORD", re: /C5 ONE RECORD/, what: "a second member file for one organ (PROBE.json beside probe.json)", m: (t) => { const p = join(t, "suite", "members", "probe.json"); if (!existsSync(p)) return "probe.json absent"; writeFileSync(join(t, "suite", "members", "PROBE.json"), readFileSync(p, "utf8")); return null; } },
  { unit: "mdtl2", clause: "E1", re: /\bE1\b/, what: "the planted toy_member's member file never written", m: (t) => edit(t, "ci/mdtl2/witness_mdtl2.mjs", null, "for (const m of members) writeFileSync(join(into, \"suite\", \"members\"", "for (const m of members.filter((x) => x !== \"toy_member\")) writeFileSync(join(into, \"suite\", \"members\"") },
];
const witLast = (t, unit) => {
  const r = spawnSync(process.execPath, [join(t, "ci", unit, `witness_${unit}.mjs`), "--org", t, "--base-org", join(/** @type {string} */ (UB), unit)], { encoding: "utf8", windowsHide: true, timeout: left(), env: childEnv(), cwd: TMP, maxBuffer: 1 << 28 });
  return (String(r.stdout || "") + String(r.stderr || "")).split(/\r?\n/).map((x) => x.trim()).filter(Boolean).pop() || "";
};
let kw = 0;
let km = 0, mlawControl = false;
const hasMlaw = existsSync(join(ORG, "ci", "mlaw", "witness_mlaw.mjs"));

let k = 0;
try {
  for (const mu of MUTANTS) {
    const t = join(TMP, `m-${mu.clause.toLowerCase()}`);
    copy(t);
    const why = await mu.m(t);
    if (why) { console.log(`  FAIL M-${mu.clause} · the mutant did not apply: ${why}`); rmSync(t, { recursive: true, force: true }); continue; }
    const r = runWitness(t, mu.clause);
    for (const p of namingProcs(TMP)) { try { process.kill(p); } catch { /* gone */ } }
    const ok = r.code === 1 && (r.last === `RED MHOT · ${mu.clause}` || (!!mu.also && r.last === `RED MHOT · ${mu.also}`));
    if (ok) k++;
    console.log(`  ${ok ? "ok  " : "FAIL"} M-${mu.clause} · ${mu.what} → exit ${r.code} · ${r.last}`);
    try { unlinkSync(join(t, "node_modules")); } catch { /* not linked */ }
    rmSync(t, { recursive: true, force: true });
  }
  if (hasMlaw) {
    const ct = join(TMP, "mlaw-control"); copy(ct);
    const ce = gitify(ct), ctl = ce ? { last: ce, set: null } : mlawReds(ct);
    mlawControl = !!ctl.set && MLAW_MUTANTS.every((mu) => !ctl.set.includes(mu.clause));
    console.log(`  ${mlawControl ? "ok  " : "FAIL"} MLAW CONTROL · the unmutated copy → ${ctl.last}`);
    try { unlinkSync(join(ct, "node_modules")); } catch { /* not linked */ }
    rmSync(ct, { recursive: true, force: true });
    for (const mu of MLAW_MUTANTS) {
      const t = join(TMP, `mlaw-${mu.clause.toLowerCase()}`); copy(t);
      const why = mu.m(t) || gitify(t);
      const r = why ? { last: why, set: null } : mlawReds(t);
      for (const p of namingProcs(TMP)) { try { process.kill(p); } catch { /* gone */ } }
      const want = ctl.set ? [...ctl.set, mu.clause].sort() : null;
      const ok = mlawControl && !!r.set && JSON.stringify(r.set) === JSON.stringify(want);
      if (ok) km++;
      console.log(`  ${ok ? "ok  " : "FAIL"} M-MLAW-${mu.clause} · ${mu.what} → ${r.last}`);
      try { unlinkSync(join(t, "node_modules")); } catch { /* not linked */ }
      rmSync(t, { recursive: true, force: true });
    }
  }
  if (UB) {
    const ctl = {};
    for (const mu of WIT_MUTANTS) {
      if (!(mu.unit in ctl)) { const ct = join(TMP, `wctl-${mu.unit}`); copy(ct); ctl[mu.unit] = witLast(ct, mu.unit); for (const p of namingProcs(TMP)) { try { process.kill(p); } catch { /* gone */ } }
        console.log(`  ${ctl[mu.unit] ? "ok  " : "FAIL"} ${mu.unit.toUpperCase()} CONTROL · the unmutated copy → ${ctl[mu.unit]}`); try { unlinkSync(join(ct, "node_modules")); } catch { /* not linked */ } rmSync(ct, { recursive: true, force: true }); }
      const t = join(TMP, `w-${mu.unit}-${mu.clause.split(" ")[0].toLowerCase()}`); copy(t);
      const why = mu.m(t);
      const last = why || witLast(t, mu.unit);
      for (const p of namingProcs(TMP)) { try { process.kill(p); } catch { /* gone */ } }
      const ok = !why && /^RED /.test(last) && mu.re.test(last.replace(/^RED [A-Z0-9]+ · /, "")) && !mu.re.test(String(ctl[mu.unit]).replace(/^(RED|GREEN) [A-Z0-9]+ · ?/, ""));
      if (ok) kw++;
      console.log(`  ${ok ? "ok  " : "FAIL"} M-${mu.unit.toUpperCase()}-${mu.clause.split(" ")[0]} · ${mu.what} → ${last}`);
      try { unlinkSync(join(t, "node_modules")); } catch { /* not linked */ }
      rmSync(t, { recursive: true, force: true });
    }
  } else console.log(`  NOT RUN · the ${WIT_MUTANTS.length} re-cut-witness mutants (mcov, mprk, mdtl2) need --unit-bases <dir>`);
  const c = runWitness(ORG, null);
  var control = c.code === 0 && /^GREEN MHOT /.test(c.last);
  console.log(`  ${control ? "ok  " : "FAIL"} CONTROL · the unmutated witness over --org → exit ${c.code} · ${c.last}`);
} finally {
  for (const p of namingProcs(TMP)) { try { process.kill(p); } catch { /* gone */ } }
  rmSync(TMP, { recursive: true, force: true });
}
const n = MUTANTS.length + (hasMlaw ? MLAW_MUTANTS.length : 0) + (UB ? WIT_MUTANTS.length : 0), kk = k + km + kw, ctlOk = control && (!hasMlaw || mlawControl);
console.log(`run_mutants: ${kk} of ${n} mutant(s) RED by the clause that names them · control ${ctlOk ? "GREEN" : "RED"}`);
process.exit(kk === n && ctlOk ? 0 : 1);
