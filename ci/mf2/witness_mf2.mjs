#!/usr/bin/env node
// ============================================================================
// witness_mf2.mjs — unit MF2 (B1 FORK 2 · rows 1022 (3)(4) / 1024 (2)): A LIVE ASSERT IS NOT EXECUTED IN THE HERMETIC PROFILE.
// CONTRACT:  node ci/mf2/witness_mf2.mjs --org <tree> --base-org <tree>
//   Each tree is COPIED under os.tmpdir(); the suite (scripts/organism_test.mjs all) runs in the copy, once per profile.
//   No model is called: a planted `claude` / `gemini` that refuses (exit 1) sits first on PATH for every run.
//   THE PLANT (F1): in each copy, EVERY assert call whose name is a member of that copy's LIVE_ASSERTS table is given a side
//   effect evaluated with the call itself — it writes one marker file per call site into a temp dir — so a LIVE assert whose
//   block is entered leaves a trace, and one never executed leaves none.
//   F1 · hermetic: the build leaves NO marker; full: the build leaves a marker at every site the base full run marks (and some).
//   F2 · RE-CUT by unit mrf (forks row 1120 (2) F-1 C · row 1120 (4)) — MONOTONE over the hermetic members (ok / FAIL, LIVE
//        excluded, digit runs folded): no base member vanishes or goes ok → FAIL; members ADDED by a later unit and FAIL → ok
//        are NAMED in the clause line, never red (ci/mf2/monotone.mjs). STRUCK, the text it replaces:
//        ~~every member the BASE hermetic run judged (ok / FAIL, LIVE excluded) is judged by the build with the same verdict,
//        and the build judges nothing the base did not (digit runs folded, as LIVE_ASSERTS keys are).~~
//   F3 · the LIVE count on the build's hermetic headline is equal to or lower than the base's, and the build names LIVE no
//        member the base did not (digit runs folded).
//   F4 · RE-CUT by unit mrf (forks row 1120 (2) F-1 C · row 1120 (4)) — MONOTONE over the FULL profile's members, the same
//        rule as F2 (ci/mf2/monotone.mjs); both headlines and exits are named in the line, not compared. STRUCK, the text
//        it replaces:
//        ~~the build's FULL profile output equals the base's member for member: the same (verdict, name) sequence (digit runs
//        folded), the same pass/fail headline.~~
//   BOUND outside ci/, only scripts/organism_test.mjs differs between the trees.
//   LAST  no node process naming this run's temp dir survives.
// LAST LINE: GREEN MF2 <what> · <n> clause(s) (exit 0) | RED MF2 · <clauses> (exit 1)
// Portable: no POSIX-only shell (the planted model stubs are written per platform); every read is split on /\r?\n/.
// ============================================================================
import { mkdtempSync, writeFileSync, readFileSync, readdirSync, statSync, lstatSync, rmSync, cpSync, mkdirSync, chmodSync } from "node:fs";
import { join, relative, resolve, delimiter } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { monotone, monoLine } from "./monotone.mjs";   // unit mrf (row 1120 (2) F-1 C): the rule F2 and F4 read

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const ORG = arg("--org") && resolve(arg("--org")), BASE = arg("--base-org") && resolve(arg("--base-org"));
if (!ORG || !BASE) { console.log("RED MF2 · USAGE (--org <dir> --base-org <dir>)"); process.exit(1); }
const TMP = mkdtempSync(join(tmpdir(), "mf2-"));
const reds = [], greens = [];
const clause = (id, ok, line) => { (ok ? greens : reds).push(id); console.log(`${ok ? "GREEN" : "RED  "} ${id} · ${line}`); };

// ── the planted model stubs: any model CLI reached from a run refuses ──
const SHIM = join(TMP, "shim");
mkdirSync(SHIM, { recursive: true });
for (const n of ["claude", "gemini"]) {
  if (process.platform === "win32") writeFileSync(join(SHIM, `${n}.cmd`), "@echo planted: no model call 1>&2\r\n@exit /b 1\r\n");
  else { writeFileSync(join(SHIM, n), "#!/bin/sh\necho 'planted: no model call' >&2\nexit 1\n"); chmodSync(join(SHIM, n), 0o755); }
}

const fold = (n) => String(n).replace(/\d+/g, "#");
// ── THE PLANT: a side effect on every LIVE assert call site of a copy ──
function plant(tree) {
  const p = join(tree, "scripts", "organism_test.mjs");
  let src = readFileSync(p, "utf8");
  const tbl = src.slice(src.indexOf("const LIVE_ASSERTS = Object.freeze({"), src.indexOf("const LIVE_MODES"));
  const keys = [...tbl.matchAll(/^\s*"((?:[^"\\]|\\.)*)":\s*"/gm)].map((m) => m[1]);
  let n = 0;
  src = src.replace(/\bassert\((\s*)("((?:[^"\\]|\\.)*)"|`((?:[^`\\]|\\.)*)`)/g, (all, ws, lit, dq, bt) => {
    const name = dq != null ? dq : String(bt).replace(/\$\{[^}]*\}/g, "#");
    const f = fold(name);
    if (!keys.some((k) => f.startsWith(k) || f.slice(0, 90) === k)) return all;
    n++;
    return `(__mf2mark(${n}), assert)(${ws}${lit}`;
  });
  const lines = src.split("\n");
  lines.splice(1, 0, 'import { writeFileSync as __mf2w } from "node:fs"; import { join as __mf2j } from "node:path"; const __mf2mark = (k) => { if (process.env.MF2_MARK_DIR) __mf2w(__mf2j(process.env.MF2_MARK_DIR, `m${k}`), ""); };');
  writeFileSync(p, lines.join("\n"));
  return { sites: n, keys: keys.length };
}
const copyTree = (src) => { const d = mkdtempSync(join(TMP, "tree-")); cpSync(src, d, { recursive: true, verbatimSymlinks: true }); return d; };
function suite(tree, profile) {
  const marks = mkdtempSync(join(TMP, "marks-"));
  const env = { ...process.env, PATH: `${SHIM}${delimiter}${process.env.PATH || ""}`, MF2_MARK_DIR: marks };
  delete env.ORGANISM_TEST_PROFILE;
  if (profile === "hermetic") env.ORGANISM_TEST_PROFILE = "hermetic";
  delete env.ANTHROPIC_API_KEY;
  const r = spawnSync(process.execPath, [join(tree, "scripts", "organism_test.mjs"), "all"], { cwd: tree, encoding: "utf8", env, maxBuffer: 1 << 28 });
  const out = String(r.stdout || "").split(/\r?\n/);
  const members = out.map((l) => /^ {2}(ok|FAIL) +(\S.*)$/.exec(l)).filter(Boolean).map((m) => [m[1], fold(m[2])]);
  const live = [...new Set(out.map((l) => /^ {2}LIVE (.*) — not run in the hermetic profile: /.exec(l)).filter(Boolean).map((m) => fold(m[1])))];
  const head = out.filter((l) => /^organism_test: /.test(l)).pop() || "";
  return { code: r.status, members, live, head, marks: readdirSync(marks).sort() };
}

const b = copyTree(BASE), o = copyTree(ORG);
const pb = plant(b), po = plant(o);
const bh = suite(b, "hermetic"), oh = suite(o, "hermetic");
const bf = suite(b, "full"), of = suite(o, "full");

clause("F1", po.sites > 0 && oh.marks.length === 0 && of.marks.length > 0 && bf.marks.every((m) => of.marks.includes(m)),
  `planted ${po.sites} LIVE call site(s) (base ${pb.sites}) · hermetic markers: build ${oh.marks.length} (must be 0), base ${bh.marks.length} · full markers: build ${of.marks.length}, base ${bf.marks.length} (every base one must be in the build's)`);
{
  // unit mrf (row 1120 (2) F-1 C): MONOTONE. Struck form, kept for the record: base and build judged the same multiset of
  // (verdict, name), nothing judged only by the build — which turned red on EVERY later unit that added a member (mdn2 first).
  const r = monotone(bh.members, oh.members);
  clause("F2", r.ok, `base hermetic judged ${bh.members.length}, build ${oh.members.length} · ${monoLine(r)}`);
}
const liveOf = (h) => { const m = /LIVE (\d+)/.exec(h); return m ? Number(m[1]) : null; };
{
  const extra = oh.live.filter((n) => !bh.live.includes(n));
  clause("F3", liveOf(oh.head) !== null && liveOf(bh.head) !== null && liveOf(oh.head) <= liveOf(bh.head) && extra.length === 0,
    `hermetic headline LIVE: build ${liveOf(oh.head)} · base ${liveOf(bh.head)} (build ≤ base) · LIVE names printed: build ${oh.live.length}, base ${bh.live.length} · named LIVE only by the build: ${extra.length ? extra.map((n) => n.slice(0, 60)).join(" · ") : "none"}`);
}
{
  // unit mrf (row 1120 (2) F-1 C): MONOTONE, the F2 rule over the full profile. Struck form, kept for the record: the same
  // (verdict, name) SEQUENCE and the same headline and exit — red on any added member and on any headline count it moved.
  const r = monotone(bf.members, of.members);
  clause("F4", r.ok, `full profile: base ${bf.members.length} member(s), build ${of.members.length} · ${monoLine(r)} · headline base "${bf.head}" · build "${of.head}" · exit ${bf.code}/${of.code}`);
}

const walk = (root, d = root, acc = new Map()) => {
  for (const e of readdirSync(d)) {
    if (e === ".git" || e === "node_modules") continue;
    const p = join(d, e);
    if (lstatSync(p).isSymbolicLink()) continue;
    if (statSync(p).isDirectory()) walk(root, p, acc); else acc.set(relative(root, p).replace(/\\/g, "/"), createHash("sha256").update(readFileSync(p)).digest("hex"));
  }
  return acc;
};
const WA = walk(BASE), WB = walk(ORG);
const differ = [...new Set([...WA.keys(), ...WB.keys()])].filter((k) => !k.startsWith("ci/") && WA.get(k) !== WB.get(k)).sort();   // ci/ is the witness itself
clause("BOUND", differ.every((f) => f === "scripts/organism_test.mjs"), `differs: ${differ.join(", ") || "nothing"}`);

const listing = process.platform === "win32"
  ? spawnSync("powershell", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process | ForEach-Object { $_.CommandLine }"], { encoding: "utf8" }).stdout || ""
  : spawnSync("ps", ["-eo", "args"], { encoding: "utf8" }).stdout || "";
const alive = listing.split(/\r?\n/).filter((l) => l.includes(TMP) && !l.includes("Get-CimInstance") && !/^ps /.test(l));
clause("LAST", alive.length === 0, `${alive.length} node process(es) naming ${TMP}${alive.length ? `: ${alive.slice(0, 3).join(" | ").slice(0, 300)}` : ""}`);
try { rmSync(TMP, { recursive: true, force: true }); } catch { }
if (reds.length) { console.log(`RED MF2 · ${reds.join(" ")}`); process.exit(1); }
console.log(`GREEN MF2 a LIVE assert is never executed in the hermetic profile, and the full profile runs every one as before · ${greens.length} clause(s)`);
process.exit(0);
