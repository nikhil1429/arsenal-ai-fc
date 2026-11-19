#!/usr/bin/env node
// ============================================================================
// witness_mr3.mjs — unit mr3 (forks rows 1107 (2), 1112, 1119): mjd3's J4 RE-BASED on unit mjd4 (fate (a), row 1112 (1)).
// CONTRACT (this header is the contract; every clause prints one line, the LAST line is the verdict):
//   node ci/mr3/witness_mr3.mjs --org <dir> --base-org <dir>
//   <dir> = a tree of the repository (a git-archive export is enough). --base-org is ci/mr3/BASE's tree (52b51c1).
//   Nothing under either tree is written: every run lives under os.tmpdir(). No model is called, no port is bound, no
//   service is named, nothing is POSTed, nothing restarted (row 1053). Every wait is bounded by the child cap below.
//   The trees' own ci/mjd3/witness_mjd3.mjs runs as a child, --org <tree> --base-org <tree>: its BOUND line is the only
//   clause that reads its --base-org, and the member drops every BOUND id (ci/ms1/PROOF.md §5.1, F1 A), so the judged
//   clauses are those of the member's own recipe. CAP = the child's real bound, never typed: mjd3's own cap formula
//   (2·(JUDGE_BUDGET_MS + JUDGE_DISPATCH_MS)/R + 20·S, R = JUDGE_DISPATCH_MS/(20·S), the constants read from the tree) times
//   the five children it runs, plus twenty node starts; re-armed from its own printed `child cap` line when that arrives.
//   J4    RE-BASED  the tree's mjd3 witness prints `GREEN J4` (the re-based clause: a capture in doubt re-dispatched once
//                   under its --idem key, every capture on its owner's log once, resolved_in_doubt names it, in_doubt empty).
//   K1    STALE-GONE the tree's scripts/organism_test.mjs KNOWN_RED holds NO entry naming ‹mjd3›, AND the member's own
//                   judge (judgeLast + boundIds, read out of that same file, never copied) passes the mjd3 witness's LAST line.
//   K2    STRUCK    the tree's mjd3 header keeps the OLD J4 text struck (~~…~~, the words "hands no rep to its owner a
//                   second time" and "names the capture in doubt" inside the strike) and names unit mjd4, 15edfec,
//                   row 1030 (2) and row 1112 (1); ci/mjd3/BASE is one 40-hex line equal between the two trees (F1 A).
//   K3    OTHERS    every other KNOWN_RED entry of --base-org is in the tree, byte-equal as an object, and nothing joined:
//                   the tree's list = the base's list minus exactly the ‹mjd3› entry.
//   BOUND (guard)   only ci/mjd3/witness_mjd3.mjs, scripts/organism_test.mjs and files under ci/mr3/ differ between the
//                   two trees (text, CRLF folded to LF); ci/mjd3/BASE is not among them.
//   LAST  (guard)   no process naming this run's temp dir (the mjd3 witness runs with it as its cwd) survives.
//   On --org = --base-org = the BASE tree, J4 K1 K2 K3 are RED and the guards GREEN; on the build, all GREEN.
// LAST LINE: GREEN MR3 <what> · <n> clause(s)  (exit 0)  |  RED MR3 · <clauses>  (exit 1)
// ============================================================================
import { mkdtempSync, readFileSync, existsSync, readdirSync, statSync, rmSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const ORG = arg("--org") && resolve(arg("--org")), BASE = arg("--base-org") && resolve(arg("--base-org"));
if (!ORG || !BASE) { console.log("RED MR3 · USAGE (--org <dir> --base-org <dir>)"); process.exit(1); }
const TMP = mkdtempSync(join(tmpdir(), "mr3-"));
const reds = [], greens = [];
const clause = (id, ok, line) => { (ok ? greens : reds).push(id); console.log(`${ok ? "GREEN" : "RED  "} ${id} · ${line}`); };
const text = (p) => (existsSync(p) ? readFileSync(p, "utf8").replace(/\r\n/g, "\n") : null);

// measured: one node start (the slowest of three)
const S = Math.max(...[0, 1, 2].map(() => { const a = performance.now(); spawnSync(process.execPath, ["-e", "0"], { windowsHide: true }); return performance.now() - a; }));

/** the mjd3 witness of <tree>, run over <tree>; its cap is its OWN printed child cap × its four children + 20·S */
async function runMjd3(tree) {
  const w = join(tree, "ci", "mjd3", "witness_mjd3.mjs");
  if (!existsSync(w)) return { code: null, out: "", lines: [], last: "(no ci/mjd3/witness_mjd3.mjs in the tree)" };
  const gb = await import(pathToFileURL(join(tree, "scripts", "gaffer_brain.mjs")).href);
  const B = gb.JUDGE_BUDGET_MS, JD = gb.JUDGE_DISPATCH_MS;
  if (!(B > 0 && JD > 0)) return { code: null, out: "", lines: [], last: "(the tree's gaffer_brain.mjs exports no JUDGE_BUDGET_MS / JUDGE_DISPATCH_MS)" };
  const R = JD / (20 * S), cap0 = 2 * (B + JD) / R + 20 * S;
  return new Promise((res) => {
    const c = spawn(process.execPath, [w, "--org", tree, "--base-org", tree], { cwd: TMP, stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
    let out = "", t = null, capped = false;
    let rearmed = false;
    const arm = (ms) => { if (t) clearTimeout(t); t = setTimeout(() => { capped = true; c.kill("SIGKILL"); }, ms); };
    c.stdout.on("data", (d) => { out += d; const m = !rearmed && /child cap (\d+) real ms/.exec(out); if (m) { rearmed = true; arm(5 * Math.max(Number(m[1]), cap0) + 20 * S); } });
    c.stderr.on("data", (d) => { out += d; });
    arm(5 * cap0 + 20 * S);
    c.on("exit", (code) => {
      clearTimeout(t);
      const lines = out.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
      res({ code, out, capped, lines, last: lines[lines.length - 1] || "" });
    });
  });
}

/** a top-level `const NAME = …;` or `function NAME(…) {…}` block, read out of the member's source (never copied here) */
function sliceOut(src, head) {
  const i = src.indexOf(head);
  if (i < 0) return null;
  if (head.startsWith("const ")) { const j = src.indexOf(";\n", i); return j < 0 ? null : src.slice(i, j + 1); }
  const j = src.indexOf("\n}\n", i);
  return j < 0 ? null : src.slice(i, j + 2);
}
function knownRedOf(src) {
  const i = src ? src.indexOf("const KNOWN_RED = [") : -1;
  if (i < 0) return { list: null, why: "no `const KNOWN_RED = [` line" };
  const j = src.indexOf("\n];\n", i);
  if (j < 0) return { list: null, why: "the KNOWN_RED list has no `];` close" };
  try { return { list: new Function(`return ${src.slice(i + "const KNOWN_RED = ".length, j + 2)};`)() }; } catch (e) { return { list: null, why: `KNOWN_RED does not evaluate: ${String(e.message).slice(0, 80)}` }; }
}
const MJD3 = "WITNESS ‹mjd3› · GREEN at head against its BASE";

async function main() {
  console.log(`mr3 witness · node start S ${S.toFixed(1)} ms (slowest of 3) · org ${ORG} · base-org ${BASE}`);
  const run = await runMjd3(ORG);
  const j4 = run.lines.find((l) => /^(GREEN|RED)\s+J4\b/.test(l)) || null;
  console.log(`  mjd3 witness of --org · exit ${run.code}${run.capped ? " (killed at its cap)" : ""} · ${run.last}`);
  clause("J4", !!j4 && j4.startsWith("GREEN"), j4 || `no J4 line (exit ${run.code}: ${run.last})`);

  // K1 — the member's own judge, out of the tree's organism_test.mjs
  const ot = text(join(ORG, "scripts", "organism_test.mjs"));
  const kr = knownRedOf(ot);
  const bSrc = ot && sliceOut(ot, "const boundIds = "), jSrc = ot && sliceOut(ot, "function judgeLast(");
  let judged = null, why1 = "";
  if (!bSrc || !jSrc) why1 = "the member's boundIds / judgeLast are not in the tree's organism_test.mjs";
  else {
    try {
      const { boundIds, judgeLast } = new Function(`${bSrc}\n${jSrc}\nreturn { boundIds, judgeLast };`)();
      const wsrc = text(join(ORG, "ci", "mjd3", "witness_mjd3.mjs")) || "";
      judged = judgeLast(run.out, run.code, "mjd3", boundIds(wsrc));
    } catch (e) { why1 = `the member's judge threw: ${String(e.message).slice(0, 80)}`; }
  }
  const entries = kr.list ? kr.list.filter((e) => e && (e.assert === MJD3 || String(e.assert || "").includes("‹mjd3›"))) : null;
  clause("K1", !!judged && judged.ok && Array.isArray(entries) && entries.length === 0,
    `${kr.list ? `KNOWN_RED entries naming ‹mjd3›: ${entries.length}` : kr.why} · member judge ${judged ? (judged.ok ? "GREEN" : `RED (${judged.left})`) : why1}`);

  // K2 — the header keeps the old J4 text struck, and names what overtook it
  const hdr = (text(join(ORG, "ci", "mjd3", "witness_mjd3.mjs")) || "").split("\n").filter((l) => l.startsWith("//")).join("\n");
  const struck = [...hdr.matchAll(/~~([^~]+)~~/g)].map((m) => m[1]).join(" ").replace(/\s*\/\/\s*/g, " ").replace(/\s+/g, " ");
  const oldIn = ["hands no rep to its owner a second time", "names the capture in doubt"].every((s) => struck.includes(s));
  const names = ["mjd4", "15edfec", "1030 (2)", "1112 (1)"].filter((s) => !hdr.includes(s));
  const bo = text(join(ORG, "ci", "mjd3", "BASE")), bb = text(join(BASE, "ci", "mjd3", "BASE"));
  const baseKept = !!bo && /^[0-9a-f]{40}\n?$/.test(bo) && bo === bb;
  clause("K2", oldIn && names.length === 0 && baseKept,
    `old J4 text struck ${oldIn} · names missing ${names.length ? names.join(", ") : "none"} · ci/mjd3/BASE kept ${baseKept}${bo ? ` (${bo.trim().slice(0, 7)})` : ""}`);

  // K3 — every other entry stays, byte-equal as an object; nothing joins
  const kb = knownRedOf(text(join(BASE, "scripts", "organism_test.mjs")));
  let ok3 = false, why3 = kb.list ? (kr.list ? "" : `--org: ${kr.why}`) : `--base-org: ${kb.why}`;
  if (kb.list && kr.list) {
    const want = kb.list.filter((e) => e.assert !== MJD3).map((e) => JSON.stringify(e));
    const have = kr.list.map((e) => JSON.stringify(e));
    const gone = want.filter((x) => !have.includes(x)), joined = have.filter((x) => !want.includes(x));
    ok3 = gone.length === 0 && joined.length === 0 && have.length === want.length;
    why3 = `base ${kb.list.length} entr(ies) · tree ${kr.list.length} · expected ${want.length} (the base minus ‹mjd3›) · missing ${gone.length} · joined ${joined.length}`;
  }
  clause("K3", ok3, why3);

  // BOUND (guard) — only the named files differ (text, CRLF folded to LF)
  const walk = (root, d = root, acc = new Map()) => {
    for (const e of readdirSync(d)) {
      if (e === ".git" || e === "node_modules") continue;
      const p = join(d, e), st = statSync(p);
      if (st.isDirectory()) walk(root, p, acc);
      else acc.set(relative(root, p).replace(/\\/g, "/"), createHash("sha256").update(readFileSync(p).toString("latin1").replace(/\r\n/g, "\n")).digest("hex"));
    }
    return acc;
  };
  const a = walk(BASE), b = walk(ORG);
  const differ = [...new Set([...a.keys(), ...b.keys()])].filter((k) => a.get(k) !== b.get(k)).sort();
  const named = (k) => k === "ci/mjd3/witness_mjd3.mjs" || k === "scripts/organism_test.mjs" || k.startsWith("ci/mr3/");
  const beyond = differ.filter((k) => !named(k));
  clause("BOUND", beyond.length === 0, `differs: ${differ.join(", ") || "nothing"}${beyond.length ? ` · BEYOND the named files: ${beyond.join(", ")}` : ""}`);

  // LAST (guard) — no node process naming the temp dir or either tree survives
  const listing = process.platform === "win32"
    ? spawnSync("powershell", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | ForEach-Object { $_.CommandLine }"], { encoding: "utf8", windowsHide: true }).stdout || ""
    : spawnSync("ps", ["-eo", "args"], { encoding: "utf8" }).stdout || "";
  const alive = listing.split(/\r?\n/).filter((l) => l.toLowerCase().includes(TMP.toLowerCase()) && !l.includes("Get-CimInstance") && !/^ps /.test(l.trim()));
  clause("LAST", alive.length === 0, `${alive.length} process(es) naming ${TMP}`);
  try { rmSync(TMP, { recursive: true, force: true }); } catch { }

  const n = greens.length + reds.length;
  if (reds.length) { console.log(`RED MR3 · ${reds.join(" ")}`); process.exit(1); }
  console.log(`GREEN MR3 mjd3 J4 re-based on mjd4 (row 1112 (1)) and its ruled-red entry gone · ${n} clause(s)`);
  process.exit(0);
}
main().catch((e) => { console.log(`RED MR3 · WITNESS-THREW ${String(e && e.message || e).slice(0, 160)}`); process.exit(1); });
