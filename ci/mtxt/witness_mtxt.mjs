#!/usr/bin/env node
// ============================================================================
// ci/mtxt/witness_mtxt.mjs — UNIT mtxt · ONE TEXT UNIT: the stale "OFF until S12" sentence of scripts/services.mjs and the
//   stale switch-off paragraph of CLAUDE.md, each replaced by text that NAMES the verb printing the live truth and CITES
//   his 20 Aug 2026 word (the switch-off) and his 30 Aug 2026 word (the switch back on). Forks rows 1089 (4) / 1108 (1).
// ----------------------------------------------------------------------------
// USAGE: node ci/mtxt/witness_mtxt.mjs --org <dir> --base-org <dir> [--only <clause>[,<clause>…]]
//   --org       the tree to witness (the build reads GREEN; the base, given as --org too, reads RED on every clause)
//   --base-org  the BASE tree (origin/main at the cut, named in ci/mtxt/PROOF.md); absent ⇒ every clause RED
//   --only      run only these clause ids (the mutant runner's door); LAST always runs
// CONTRACT — READ-ONLY on --org and --base-org. The one process it starts (services.mjs selftest) runs on a COPY of each
//   tree's scripts/ + package.json under os.tmpdir(), with an EMPTY dressing-room/state and its own HOME / USERPROFILE under
//   the same temp root: nothing of his is copied, nothing of any state file is read or printed. No git repo is planted
//   (nothing is cloned or init'd here; the runner that clones does so with core.autocrlf=false). Every text read folds
//   \r\n to \n, so a Windows checkout reads the same. No port is bound, no service is named live, nothing is POSTed, nothing
//   restarted, no model is called. No timeout, budget or size is typed: the size gate is the BASE file's own byte count
//   (a gate may only get stricter), and the selftest child is awaited by spawnSync, which returns when it exits.
// CLAUSES (each RED on the base, GREEN on the build — the invariance clauses carry "the unit is present" as a conjunct, so
//   on the base they read RED for THAT reason, and their teeth are the mutants):
//   S1  services.mjs carries no "supposed to be OFF until S12" (the stale sentence, anywhere in the file)
//   S2  services.mjs's "RUNNING as an OS unit" line names 20 Aug 2026 + 30 Aug 2026 + `node scripts/state.mjs`, and the
//       grep it cites hits, in --org's own audit order, a line carrying 30 Aug 2026
//   S3  services.mjs differs from the base ∧ its CODE SKELETON (comments dropped, string/template text blanked, ${…} kept)
//       equals the base's — the diff is comments or strings only
//   S4  services.mjs differs from the base ∧ its own `selftest` headline equals the base's, and reads "0 failed"
//   C1  CLAUDE.md carries no "THE ORGANISM IS SWITCHED OFF" and no "re-enable NOTHING" (folded across the line break)
//   C2  the changed CLAUDE.md block names 20 Aug 2026 + 30 Aug 2026 + `node scripts/services.mjs status` +
//       `node scripts/state.mjs` + that a cloud session cannot run them; its backticked `grep -n "a\|b" <file>` is RUN (in
//       node): every alternative hits in <file>, one on a line carrying 20 Aug 2026, one on a line carrying 30 Aug 2026
//   C3  CLAUDE.md: same line count as the base, the changed lines are ONE contiguous non-empty block, and the base's block
//       there was the switch-off paragraph — no other line moved
//   C4  CLAUDE.md differs ∧ its header size line is byte-identical to the base's ∧ its byte count ≤ the base's
//   N1  the new texts (the C3 block and the S2 line's tail) state no live count or state: no digit once dates and the
//       cited file name are removed, and none of Disabled / killed / Running / Ready / EXPECTED
//   BOUND  only scripts/services.mjs, CLAUDE.md and ci/mtxt/** differ from --base-org (both named files DO differ);
//          .git and node_modules are not walked; text is hashed with CRLF folded to LF
//   LAST   no node process naming this run's temp root survives (ps; PowerShell on Windows)
// LAST LINE: GREEN MTXT <what> · <n> clause(s) (exit 0) or RED MTXT · <clauses> (exit 1)
// ============================================================================
import { readFileSync, existsSync, mkdtempSync, mkdirSync, cpSync, rmSync, readdirSync, statSync } from "node:fs";
import { join, resolve, relative, sep } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync, execFileSync } from "node:child_process";
import { createHash } from "node:crypto";

const argv = process.argv.slice(2);
const opt = (k) => { const i = argv.indexOf(k); return i >= 0 && argv[i + 1] ? argv[i + 1] : null; };
const ORG = opt("--org") ? resolve(opt("--org")) : null;
const BASE = opt("--base-org") ? resolve(opt("--base-org")) : null;
const ONLY = opt("--only") ? new Set(opt("--only").split(",")) : null;
const ALL = ["S1", "S2", "S3", "S4", "C1", "C2", "C3", "C4", "N1", "BOUND"];
const want = (id) => !ONLY || ONLY.has(id);

const SVC = "scripts/services.mjs", MD = "CLAUDE.md", AUDIT = "docs/archive/ORGANISM_AUDIT__2026-08-19.md";
const fold = (s) => s.replace(/\r\n/g, "\n");
const rd = (root, p) => { try { return fold(readFileSync(join(root, p), "utf8")); } catch { return null; } };

const ROOT = mkdtempSync(join(tmpdir(), "mtxt-witness-"));
const results = [];
const clause = (id, ok, why) => { results.push({ id, ok: !!ok }); console.log(`  ${ok ? "GREEN" : "RED  "} ${id} · ${why}`); };

// ---- a small JS lexer: the code skeleton (comments dropped, string/template TEXT blanked, ${…} code kept) ----
const REGEX_AFTER = new Set(["(", ",", "=", ":", "[", "!", "&", "|", "?", "{", "}", ";", "+", "-", "*", "%", "<", ">", "~", "^", "return", "typeof", "case", "do", "else", "in", "of", "new", "delete", "void", "throw", "=>", "&&", "||", "??", "==", "===", "!=", "!==", "+=", "-="]);
export function skeleton(src) {
  const out = []; let i = 0; const n = src.length; let prev = null; const braces = []; // braces: stack of "t" (template ${) | "b"
  const push = (t) => { out.push(t); prev = t; };
  const tmpl = () => { // at a backtick or a `}` closing ${ — read template text until ` or ${
    while (i < n) {
      const c = src[i];
      if (c === "\\") { i += 2; continue; }
      if (c === "`") { i++; push("`S`"); return; }
      if (c === "$" && src[i + 1] === "{") { i += 2; push("`S${"); braces.push("t"); return; }
      i++;
    }
  };
  while (i < n) {
    const c = src[i];
    if (/\s/.test(c)) { i++; continue; }
    if (c === "/" && src[i + 1] === "/") { while (i < n && src[i] !== "\n") i++; continue; }
    if (c === "/" && src[i + 1] === "*") { const e = src.indexOf("*/", i + 2); i = e < 0 ? n : e + 2; continue; }
    if (c === "'" || c === '"') { i++; while (i < n && src[i] !== c) { if (src[i] === "\\") i++; i++; } i++; push("'S'"); continue; }
    if (c === "`") { i++; tmpl(); continue; }
    if (c === "{") { braces.push("b"); i++; push("{"); continue; }
    if (c === "}") { const b = braces.pop(); i++; if (b === "t") { push("}S"); tmpl(); } else push("}"); continue; }
    if (c === "/" && (prev === null || REGEX_AFTER.has(prev))) { // a regex literal is CODE: kept verbatim
      let j = i + 1, cls = false;
      while (j < n) { const d = src[j]; if (d === "\\") { j += 2; continue; } if (d === "[") cls = true; else if (d === "]") cls = false; else if (d === "/" && !cls) break; else if (d === "\n") break; j++; }
      j++; while (j < n && /[a-z]/i.test(src[j])) j++;
      push(src.slice(i, j)); i = j; continue;
    }
    if (/[A-Za-z0-9_$]/.test(c)) { let j = i; while (j < n && /[A-Za-z0-9_$.]/.test(src[j])) j++; push(src.slice(i, j)); i = j; continue; }
    const three = src.slice(i, i + 3), two = src.slice(i, i + 2);
    if (["===", "!==", "...", "??="].includes(three)) { push(three); i += 3; continue; }
    if (["=>", "&&", "||", "??", "==", "!=", "+=", "-=", "<=", ">=", "?."].includes(two)) { push(two); i += 2; continue; }
    push(c); i++;
  }
  return out.join(" ");
}

// ---- the changed block of CLAUDE.md (by line, same count) ----
function lineDiff(a, b) {
  const A = a.split("\n"), B = b.split("\n");
  if (A.length !== B.length) return { sameCount: false, idx: [] , A, B };
  const idx = []; for (let k = 0; k < A.length; k++) if (A[k] !== B[k]) idx.push(k);
  return { sameCount: true, idx, A, B };
}
const newBlock = (base, org) => { const d = lineDiff(base, org); return d.sameCount && d.idx.length ? d.B.slice(d.idx[0], d.idx[d.idx.length - 1] + 1).join("\n") : ""; };
const runningLine = (src) => (src || "").split("\n").find((l) => l.includes("RUNNING as an OS unit")) || "";
const runningTail = (l) => { const k = l.indexOf("}"); return k >= 0 ? l.slice(k + 1) : l; };

// ---- the selftest headline, on a temp COPY (scripts/ + package.json; an empty state dir; HOME under the temp root) ----
function selftestHeadline(tree, tag) {
  const dst = join(ROOT, `st-${tag}`); mkdirSync(join(dst, "dressing-room", "state"), { recursive: true });
  cpSync(join(tree, "scripts"), join(dst, "scripts"), { recursive: true });
  if (existsSync(join(tree, "package.json"))) cpSync(join(tree, "package.json"), join(dst, "package.json"));
  const home = join(ROOT, `home-${tag}`); mkdirSync(home, { recursive: true });
  const env = { ...process.env, HOME: home, USERPROFILE: home, ARSENAL_ARCHIVE: join(home, "archive") };
  delete env.ANTHROPIC_API_KEY;
  const r = spawnSync(process.execPath, [join(dst, "scripts", "services.mjs"), "selftest"], { cwd: dst, env, encoding: "utf8" });
  const lines = `${r.stdout || ""}\n${r.stderr || ""}`.split(/\r?\n/).filter((l) => /services selftest:/.test(l));
  return { line: lines.length ? lines[lines.length - 1].trim() : "(no headline)", code: r.status };
}

// ---- the tree walk (BOUND) ----
function walk(root) {
  const m = new Map();
  const go = (d) => { for (const e of readdirSync(d, { withFileTypes: true })) {
    if (e.name === ".git" || e.name === "node_modules") continue;
    const p = join(d, e.name);
    if (e.isDirectory()) go(p);
    else if (e.isFile()) { let b = readFileSync(p); const s = b.toString("utf8"); if (!s.includes("�")) b = Buffer.from(fold(s)); m.set(relative(root, p).split(sep).join("/"), createHash("sha256").update(b).digest("hex")); }
  } };
  go(root); return m;
}

// ---- grep -n "a\|b" <file>, emulated (BRE: \| is alternation, the rest literal for these patterns) ----
function runCitedGrep(org, text) {
  const m = text.match(/`grep -n "([^"]+)" ([^`\s]+)`/);
  if (!m) return { ok: false, why: "no backticked `grep -n \"…\" <file>` in the block" };
  const alts = m[1].split("\\|"), file = rd(org, m[2]);
  if (file == null) return { ok: false, why: `the cited file ${m[2]} is not in the tree` };
  const L = file.split("\n"); const hits = alts.map((a) => L.map((l, k) => [k + 1, l]).filter(([, l]) => l.includes(a)));
  const all = hits.every((h) => h.length > 0);
  const has = (d) => hits.flat().some(([, l]) => l.includes(d));
  return { ok: all && has("20 Aug 2026") && has("30 Aug 2026"), why: `${m[2]}: ${alts.map((a, k) => `"${a}"→${hits[k].map(([n]) => n).join(",") || "none"}`).join(" · ")}` };
}

let exit = 0;
try {
  const ok = ORG && BASE && existsSync(ORG) && existsSync(BASE);
  const oS = ok ? rd(ORG, SVC) : null, bS = ok ? rd(BASE, SVC) : null, oM = ok ? rd(ORG, MD) : null, bM = ok ? rd(BASE, MD) : null;
  const have = oS != null && bS != null && oM != null && bM != null;
  const svcMoved = have && oS !== bS, mdMoved = have && oM !== bM;
  if (!have) console.log(`  (cannot read ${SVC} / ${MD} in --org and --base-org: every clause RED)`);

  if (want("S1")) clause("S1", have && !oS.includes("supposed to be OFF until S12"), have ? (oS.includes("supposed to be OFF until S12") ? "the stale sentence is still in services.mjs" : "no \"OFF until S12\" sentence in services.mjs") : "unreadable");
  if (want("S2")) {
    const l = have ? runningLine(oS) : "";
    const g = l.match(/grep -n "([^"]+)" (\S+?)\)/); let hit = false, why = "no cited grep on the RUNNING line";
    if (g) { const f = rd(ORG, g[2]); const ls = f ? f.split("\n").filter((x) => x.includes(g[1])) : []; hit = ls.some((x) => x.includes("30 Aug 2026")); why = `cited grep "${g[1]}" in ${g[2]} → ${ls.length} line(s)${hit ? ", one carrying 30 Aug 2026" : ""}`; }
    const named = l.includes("20 Aug 2026") && l.includes("30 Aug 2026") && l.includes("node scripts/state.mjs");
    clause("S2", have && named && hit, `${named ? "names both words + the verb" : "does NOT name both words + `node scripts/state.mjs`"} · ${why}`);
  }
  if (want("S3")) { const same = have && skeleton(oS) === skeleton(bS); clause("S3", svcMoved && same, !svcMoved ? "services.mjs does not differ from the base (the unit is absent)" : same ? "code skeleton equals the base's: the diff is comments/strings only" : "a CODE token differs from the base"); }
  if (want("S4")) {
    if (!svcMoved) clause("S4", false, "services.mjs does not differ from the base (the unit is absent)");
    else { const a = selftestHeadline(BASE, "base"), b = selftestHeadline(ORG, "org"); clause("S4", a.line === b.line && /, 0 failed/.test(b.line) && b.code === 0, `base "${a.line}" · org "${b.line}" (exit ${b.code})`); }
  }
  if (want("C1")) { const flat = have ? oM.replace(/\s+/g, " ") : ""; const bad = /THE ORGANISM IS SWITCHED OFF/.test(flat) || /re-enable\W*NOTHING/i.test(flat); clause("C1", have && !bad, have ? (bad ? "the stale switch-off text is still in CLAUDE.md" : "no switch-off / re-enable-NOTHING text in CLAUDE.md") : "unreadable"); }
  if (want("C2")) {
    const blk = have ? newBlock(bM, oM) : "";
    const named = ["20 Aug 2026", "30 Aug 2026", "`node scripts/services.mjs status`", "`node scripts/state.mjs`"].every((w) => blk.includes(w)) && /cloud/.test(blk);
    const g = blk ? runCitedGrep(ORG, blk) : { ok: false, why: "no changed block" };
    clause("C2", named && g.ok, `${named ? "names both words, both verbs, the cloud limit" : "does NOT name both words + both verbs + the cloud limit"} · ${g.why}`);
  }
  if (want("C3")) {
    const d = have ? lineDiff(bM, oM) : { sameCount: false, idx: [] };
    const contig = d.idx.length > 0 && d.idx[d.idx.length - 1] - d.idx[0] + 1 === d.idx.length;
    const wasIt = contig && /SWITCHED OFF/.test(d.A.slice(d.idx[0], d.idx[d.idx.length - 1] + 1).join(" "));
    clause("C3", d.sameCount && contig && wasIt, !d.sameCount ? "the line count moved" : !d.idx.length ? "CLAUDE.md does not differ (the unit is absent)" : !contig ? `changed lines are not one block (${d.idx.map((k) => k + 1).join(",")})` : wasIt ? `one block, lines ${d.idx[0] + 1}-${d.idx[d.idx.length - 1] + 1}, was the switch-off paragraph` : "the changed block was not the switch-off paragraph");
  }
  if (want("C4")) {
    const hdr = (s) => (s || "").split("\n").find((l) => /≤\s*\d+\s*KB/.test(l)) || null;
    const oB = have ? Buffer.byteLength(readFileSync(join(ORG, MD), "utf8").replace(/\r\n/g, "\n")) : 0, bB = have ? Buffer.byteLength(bM) : 0;
    const sameHdr = have && hdr(bM) !== null && hdr(bM) === hdr(oM);
    clause("C4", mdMoved && sameHdr && oB <= bB, !mdMoved ? "CLAUDE.md does not differ (the unit is absent)" : `header size line ${sameHdr ? "identical" : "MOVED"} · bytes ${oB} vs base ${bB} (${oB <= bB ? "not grown" : "GREW"})`);
  }
  if (want("N1")) {
    const texts = have ? [newBlock(bM, oM), svcMoved ? runningTail(runningLine(oS)) : runningTail(runningLine(oS))] : [];
    const strip = (t) => t.replace(/ORGANISM_AUDIT__\d{4}-\d{2}-\d{2}/g, "").replace(/\b\d{1,2} [A-Z][a-z]{2} \d{4}\b/g, "");
    const bad = texts.map((t) => { const s = strip(t); return /\d/.test(s) ? "a digit" : /Disabled|killed|Running|Ready|EXPECTED/.test(s) ? "a state word" : null; });
    const anyNew = have && (mdMoved || svcMoved);
    clause("N1", anyNew && texts[0] !== "" && bad.every((x) => !x), !anyNew || texts[0] === "" ? "no new CLAUDE.md block (the unit is absent)" : bad.every((x) => !x) ? "the new texts state no live count or state" : `the new texts carry ${bad.map((x, k) => x ? `${k ? "services" : "CLAUDE.md"}: ${x}` : null).filter(Boolean).join(" · ")}`);
  }
  if (want("BOUND")) {
    if (!ok) clause("BOUND", false, "no --org / --base-org");
    else {
      const a = walk(BASE), b = walk(ORG); const diff = [];
      for (const [p, h] of b) if (a.get(p) !== h) diff.push(p);
      for (const p of a.keys()) if (!b.has(p)) diff.push(p);
      const allowed = (p) => p === SVC || p === MD || p.startsWith("ci/mtxt/");
      const extra = diff.filter((p) => !allowed(p));
      const both = diff.includes(SVC) && diff.includes(MD);
      clause("BOUND", !extra.length && both, extra.length ? `a file beyond the named ones differs: ${extra.slice(0, 5).join(", ")}${extra.length > 5 ? ` (+${extra.length - 5})` : ""}` : both ? `only the named files differ (${diff.length} path(s))` : "the two named files do not both differ (the unit is absent)");
    }
  }
} catch (e) { console.log(`  witness threw: ${e && e.message}`); results.push({ id: "THREW", ok: false }); }

// ---- LAST ----
// THE MUTANT DOOR (run_mutants' LAST mutant only): MTXT_PLANT_ORPHAN=1 leaves one detached node process whose command line
//   names ROOT, and prints its pid so the runner kills it. Never set outside the runner.
if (process.env.MTXT_PLANT_ORPHAN === "1") {
  const { spawn } = await import("node:child_process");
  const c = spawn(process.execPath, ["-e", "setInterval(()=>{}, 2 ** 31 - 1)", ROOT], { detached: true, stdio: "ignore" });
  c.unref(); console.log(`  planted orphan pid ${c.pid}`);
}
try { rmSync(ROOT, { recursive: true, force: true }); } catch {}
let survivors = [];
try {
  const list = process.platform === "win32"
    ? execFileSync("powershell", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | ForEach-Object { \"$($_.ProcessId) $($_.CommandLine)\" }"], { encoding: "utf8" })
    : execFileSync("ps", ["-eo", "pid,args"], { encoding: "utf8" });
  survivors = list.split(/\r?\n/).filter((l) => l.includes(ROOT) && /node/.test(l) && !l.includes(String(process.pid)));
} catch (e) { survivors = [`(process list unreadable: ${e && e.message})`]; }
clause("LAST", survivors.length === 0, survivors.length ? `${survivors.length} process(es) name the temp root` : "no node process names the temp root");

const reds = results.filter((r) => !r.ok).map((r) => r.id);
const n = results.length;
if (reds.length) { console.log(`RED MTXT · ${reds.join(", ")}`); exit = 1; }
else console.log(`GREEN MTXT the OFF-until-S12 sentence and the switch-off paragraph replaced by cited verbs, text only · ${n} clause(s)`);
process.exit(exit);
