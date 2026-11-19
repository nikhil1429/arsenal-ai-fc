#!/usr/bin/env node
// ============================================================================
// ci/mtxt3/witness_mtxt3.mjs — UNIT mtxt3 · forks row 1124 (3), unit mtxt2's FORKS F2 and F3: the services.mjs SELFTEST's own
//   switch-off comments and assert labels, and the conductor.mjs S12 comment (with its S12 console line), restated as the
//   behaviour they hold and citing his 20 Aug 2026 word (the switch-off) and his 30 Aug 2026 word (back on) by the SAME grep
//   units mtxt / mtxt2 cite, naming the verbs that print what runs. Text only: every assert's CHECK is byte-identical.
// ----------------------------------------------------------------------------
// USAGE: node ci/mtxt3/witness_mtxt3.mjs --org <dir> --base-org <dir> [--only <clause>[,<clause>…]]
//   --org       the tree to witness (the build reads GREEN; the base, given as --org too, reads RED)
//   --base-org  the BASE tree (the sha in ci/mtxt3/BASE, named in ci/mtxt3/PROOF.md); absent ⇒ every clause RED
//   --only      run only these clause ids (the mutant runner's door); LAST always runs
// CONTRACT — READ-ONLY on --org and --base-org. Every process it starts (each file's `selftest`) runs on a COPY of the whole
//   tree but .git / node_modules under os.tmpdir(), made by node, with HOME / USERPROFILE / ARSENAL_ARCHIVE under the same
//   temp root; the copies are removed before LAST. No state file is read or printed by the witness itself. No git repo is
//   planted here (the runner that clones does so with core.autocrlf=false). Every text read folds \r\n to \n, so a Windows
//   checkout reads the same; no POSIX-only shell is used (PowerShell lists processes on Windows). No port is bound, no
//   service is named live, nothing is POSTed, nothing restarted, no model is called. No timeout, budget or size is typed:
//   every child is awaited by spawnSync, which returns when it exits.
// CLAUSES (each RED on the base, GREEN on the build — the invariance clauses carry "the file differs from the base" as a
//   conjunct, so on the base they read RED for THAT reason; their teeth are the mutants):
//   O1  the services.mjs SELFTEST (from `async function selftest()` to the end of the file) states no switch-off: no
//       "switched off"/"switched-off" (any case), no "S12", no assert label naming the switch-off, and every other
//       "switch-off" is the citation "20 Aug 2026 switch-off, lifted by his 30 Aug 2026 word" — each hit named file:line
//   O2  conductor.mjs states no S12 claim and no switched-off claim on any line — each hit named file:line
//   K1  services.mjs differs ∧ its CODE SKELETON (comments dropped, string/template text blanked, ${…} kept) equals the
//       base's — the diff is comments or strings only
//   K2  conductor.mjs, the same
//   A1  every services.mjs selftest assert's CHECK (the source after its label up to the next assert, comment lines
//       dropped) is byte-identical to the base's, the assert COUNT is equal, and only labels moved (≥ 1 label differs)
//   M1  THE MEMBER KEY: the renamed labels never reach a verdict key — (a) the org's scripts/organism_test.mjs judges a
//       member selftest by `SUITE MEMBER · ${m} selftest exits 0` (its exit code, never an inner label) and its
//       scripts/ci_verdict.mjs keys reds by keyOf; (b) no file of --org beyond scripts/services.mjs and ci/ carries any old
//       or new renamed label (none pins one); (c) each new label prints ✓ in the org's services selftest
//   T1  services.mjs differs ∧ its own `selftest` headline equals the base's and reads "0 failed" (exit 0)
//   T2  conductor.mjs differs ∧ its own `selftest` headline equals the base's and reads "0 failed" (exit 0)
//   G1  in the NEW lines of each file a cited `grep -n "a\|b" docs/archive/<file>.md` RESOLVES (every alternative hits a
//       line of the cited file in --org) and its hits include a line with 20 Aug 2026 AND a line with 30 Aug 2026
//   N1  the new lines (in --org, absent from the base) state no live count or state: no digit once dates, file names
//       (<path>.md / .mjs / .ps1), rung ids (S<n>) and law ids (L<n>) are removed, and none of Disabled / killed / Ready / EXPECTED
//   BOUND  only scripts/services.mjs, scripts/conductor.mjs and ci/mtxt3/** differ from --base-org (both named files DO
//          differ); .git and node_modules are not walked; text is hashed with CRLF folded to LF
//   LAST   no node process naming this run's temp root survives (ps; PowerShell on Windows)
// LAST LINE: GREEN MTXT3 <what> · <n> clause(s) (exit 0) or RED MTXT3 · <clauses> (exit 1)
// ============================================================================
import { readFileSync, existsSync, mkdtempSync, mkdirSync, cpSync, rmSync, readdirSync } from "node:fs";
import { join, resolve, relative, sep } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync, execFileSync } from "node:child_process";
import { createHash } from "node:crypto";

const argv = process.argv.slice(2);
const opt = (k) => { const i = argv.indexOf(k); return i >= 0 && argv[i + 1] ? argv[i + 1] : null; };
const ORG = opt("--org") ? resolve(opt("--org")) : null;
const BASE = opt("--base-org") ? resolve(opt("--base-org")) : null;
const ONLY = opt("--only") ? new Set(opt("--only").split(",")) : null;
const want = (id) => !ONLY || ONLY.has(id);

const SVC = "scripts/services.mjs", COND = "scripts/conductor.mjs";
const fold = (s) => s.replace(/\r\n/g, "\n");
const rd = (root, p) => { try { return fold(readFileSync(join(root, p), "utf8")); } catch { return null; } };

const ROOT = mkdtempSync(join(tmpdir(), "mtxt3-witness-"));
const results = [];
const clause = (id, ok, why) => { results.push({ id, ok: !!ok }); console.log(`  ${ok ? "GREEN" : "RED  "} ${id} · ${why}`); };

// ---- a small JS lexer: the code skeleton (comments dropped, string/template TEXT blanked, ${…} code kept) — unit mtxt's ----
const REGEX_AFTER = new Set(["(", ",", "=", ":", "[", "!", "&", "|", "?", "{", "}", ";", "+", "-", "*", "%", "<", ">", "~", "^", "return", "typeof", "case", "do", "else", "in", "of", "new", "delete", "void", "throw", "=>", "&&", "||", "??", "==", "===", "!=", "!==", "+=", "-="]);
export function skeleton(src) {
  const out = []; let i = 0; const n = src.length; let prev = null; const braces = [];
  const push = (t) => { out.push(t); prev = t; };
  const tmpl = () => {
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
    if (c === "/" && (prev === null || REGEX_AFTER.has(prev))) {
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

const numbered = (src) => src.split("\n").map((l, k) => [k + 1, l]);
const SWITCHED = /switched[\s-]+off/i;
const CITE = "20 Aug 2026 switch-off, lifted by his 30 Aug 2026 word";

// ---- the services selftest region and its asserts ----
const regionStart = (src) => { const i = src.indexOf("async function selftest()"); return i < 0 ? null : i; };
function region(src) { const i = regionStart(src); return i == null ? null : { text: src.slice(i), line0: src.slice(0, i).split("\n").length - 1 }; }
/** label + check of every assert( in the region; check = the source after the label up to the next assert, comment lines dropped */
function asserts(text) {
  const starts = [...text.matchAll(/(?<![\w.$])assert\(/g)].map((m) => m.index);
  return starts.map((s, k) => {
    const end = k + 1 < starts.length ? starts[k + 1] : text.length;
    let i = s + "assert(".length; while (/\s/.test(text[i])) i++;
    const q = text[i]; let label = null, j = i;
    if (q === '"' || q === "'" || q === "`") {
      j = i + 1; let depth = 0;
      while (j < end) { const c = text[j]; if (c === "\\") { j += 2; continue; } if (q === "`" && c === "$" && text[j + 1] === "{") { depth++; j += 2; continue; } if (depth && c === "}") { depth--; j++; continue; } if (!depth && c === q) break; j++; }
      label = text.slice(i + 1, j); j++;
    }
    const check = text.slice(j, end).split("\n").filter((l) => !l.trim().startsWith("//")).join("\n");
    return { label, check };
  });
}
function selftestClaims(src) {
  const r = region(src); if (!r) return ["no selftest region"];
  const hits = [];
  for (const [n, l] of numbered(r.text)) {
    const at = `${SVC}:${r.line0 + n}`;
    if (SWITCHED.test(l)) hits.push(`${at} switched-off`);
    if (/\bS12\b/.test(l)) hits.push(`${at} S12`);
    if (/switch-off/i.test(l.split(CITE).join(""))) hits.push(`${at} switch-off`);
  }
  for (const a of asserts(r.text)) if (a.label && /switch[\s-]*off/i.test(a.label)) hits.push(`label "${a.label.slice(0, 40)}…" names the switch-off`);
  return hits;
}
function fileClaims(file, src) {
  const hits = [];
  for (const [n, l] of numbered(src)) { if (SWITCHED.test(l)) hits.push(`${file}:${n} switched-off`); if (/\bS12\b/.test(l)) hits.push(`${file}:${n} S12`); }
  return hits;
}

// ---- the temp copy of a tree (but .git / node_modules), made by node, once per tree ----
const copies = new Map();
function copyOf(tree, tag) {
  if (copies.has(tag)) return copies.get(tag);
  const dst = join(ROOT, `tree-${tag}`);
  cpSync(tree, dst, { recursive: true, filter: (p) => { const r = relative(tree, p).split(sep); return r[0] !== ".git" && !r.includes("node_modules"); } });
  copies.set(tag, dst); return dst;
}
function envFor(tag) {
  const home = join(ROOT, `home-${tag}`); mkdirSync(home, { recursive: true });
  const env = { ...process.env, HOME: home, USERPROFILE: home, ARSENAL_ARCHIVE: join(home, "archive") };
  delete env.ANTHROPIC_API_KEY;
  return env;
}
const runs = new Map();
function selftestRun(tree, tag, script) {
  const key = `${tag}:${script}`; if (runs.has(key)) return runs.get(key);
  const dst = copyOf(tree, tag);
  const r = spawnSync(process.execPath, [join(dst, script), "selftest"], { cwd: dst, env: envFor(tag), encoding: "utf8" });
  const out = fold(`${r.stdout || ""}\n${r.stderr || ""}`);
  const lines = out.split("\n").filter((l) => /selftest: \d+ passed, \d+ failed|ALL CHECKS PASSED \(|\d+ FAILED \(/.test(l));
  const v = { line: lines.length ? lines[lines.length - 1].trim() : "(no headline)", code: r.status, out };
  runs.set(key, v); return v;
}

// ---- grep -n "a\|b" <file>, emulated (BRE: \| is alternation, the rest literal for these patterns) ----
const GREP_RE = /grep -n \\?"([^"\n]+?)\\?"[\s/#]*(docs\/archive\/[\w.-]+\.md)/g;
function citedGreps(org, text) {
  const out = [];
  for (const m of text.matchAll(GREP_RE)) {
    const alts = m[1].split(/\\{1,2}\|/), file = rd(org, m[2]);
    if (file == null) { out.push({ ok: false, both: false }); continue; }
    const L = file.split("\n"); const hits = alts.map((a) => L.filter((l) => l.includes(a)));
    out.push({ ok: hits.every((h) => h.length > 0), both: hits.flat().some((l) => l.includes("20 Aug 2026")) && hits.flat().some((l) => l.includes("30 Aug 2026")) });
  }
  return out;
}

// ---- the tree walk (BOUND, M1) ----
function walk(root, keepText = false) {
  const m = new Map(), text = new Map();
  const go = (d) => { for (const e of readdirSync(d, { withFileTypes: true })) {
    if (e.name === ".git" || e.name === "node_modules") continue;
    const p = join(d, e.name);
    if (e.isDirectory()) go(p);
    else if (e.isFile()) {
      let b = readFileSync(p); const s = b.toString("utf8"); const rel = relative(root, p).split(sep).join("/");
      if (!s.includes("\uFFFD")) { b = Buffer.from(fold(s)); if (keepText) text.set(rel, fold(s)); }
      m.set(rel, createHash("sha256").update(b).digest("hex"));
    }
  } };
  go(root); return { m, text };
}
// new lines: the org's lines absent from the base, joined with their continuation so a grep split over two comment lines reads whole
const newLines = (base, org) => { const B = new Set(base.split("\n")); return numbered(org).filter(([, l]) => !B.has(l)); };

let exit = 0;
try {
  const ok = ORG && BASE && existsSync(ORG) && existsSync(BASE);
  const oS = ok ? rd(ORG, SVC) : null, bS = ok ? rd(BASE, SVC) : null, oC = ok ? rd(ORG, COND) : null, bC = ok ? rd(BASE, COND) : null;
  const have = oS != null && bS != null && oC != null && bC != null;
  const sMoved = have && oS !== bS, cMoved = have && oC !== bC;
  if (!have) console.log(`  (cannot read ${SVC} / ${COND} in --org and --base-org: every clause RED)`);
  const absent = (f) => `${f} does not differ from the base (the unit is absent)`;
  const oA = have && region(oS) ? asserts(region(oS).text) : [], bA = have && region(bS) ? asserts(region(bS).text) : [];
  const bLabels = new Set(bA.map((a) => a.label)), oLabels = new Set(oA.map((a) => a.label));
  const fresh = oA.map((a) => a.label).filter((l) => l != null && !bLabels.has(l)), gone = bA.map((a) => a.label).filter((l) => l != null && !oLabels.has(l));

  if (want("O1")) { const h = have ? selftestClaims(oS) : ["unreadable"]; clause("O1", have && !h.length, h.length ? `${h.length} claim(s): ${h.slice(0, 8).join(", ")}` : `the ${SVC} selftest names no switch-off but the cited words`); }
  if (want("O2")) { const h = have ? fileClaims(COND, oC) : ["unreadable"]; clause("O2", have && !h.length, h.length ? `${h.length} claim(s): ${h.join(", ")}` : `no S12 / switched-off claim in ${COND}`); }
  if (want("K1")) { const same = have && skeleton(oS) === skeleton(bS); clause("K1", sMoved && same, !sMoved ? absent(SVC) : same ? `${SVC}: code skeleton equals the base's — comments/strings only` : `${SVC}: a CODE token differs from the base`); }
  if (want("K2")) { const same = have && skeleton(oC) === skeleton(bC); clause("K2", cMoved && same, !cMoved ? absent(COND) : same ? `${COND}: code skeleton equals the base's — comments/strings only` : `${COND}: a CODE token differs from the base`); }
  if (want("A1")) {
    const n = oA.length === bA.length && oA.length > 0;
    const moved = n ? oA.map((a, k) => (a.check === bA[k].check ? null : k)).filter((x) => x != null) : [];
    const lab = n ? oA.filter((a, k) => a.label !== bA[k].label).length : 0;
    clause("A1", n && !moved.length && lab > 0, !n ? `assert count moved (base ${bA.length} · org ${oA.length})` : moved.length ? `${moved.length} assert CHECK(s) differ from the base (index ${moved.slice(0, 5).join(", ")})` : lab ? `${oA.length} assert checks byte-identical to the base's; ${lab} label(s) restated` : "no label differs (the unit is absent)");
  }
  if (want("M1")) {
    const ot = have ? rd(ORG, "scripts/organism_test.mjs") || "" : "", cv = have ? rd(ORG, "scripts/ci_verdict.mjs") || "" : "";
    const keyed = ot.includes("assert(`SUITE MEMBER · ${m} selftest exits 0`, r.code === 0)") && /export const keyOf = /.test(cv) && /baseKeys\.has\(keyOf\(n\)\)/.test(cv);
    const renamed = [...fresh, ...gone];
    let pins = [];
    if (have && renamed.length) { const { text } = walk(ORG, true); for (const [p, t] of text) { if (p === SVC || p.startsWith("ci/")) continue; for (const l of renamed) if (t.includes(l)) pins.push(`${p} pins "${l.slice(0, 32)}…"`); } }
    const st = sMoved ? selftestRun(ORG, "org", SVC) : { out: "" };
    const ticked = fresh.filter((l) => st.out.includes(`✓ ${l}`));
    const good = have && renamed.length > 0 && keyed && !pins.length && fresh.length > 0 && ticked.length === fresh.length;
    clause("M1", good, !renamed.length ? "no label renamed (the unit is absent)" : `${keyed ? "members keyed by exit code + keyOf" : "the member key is NOT the selftest exit code / keyOf"} · ${pins.length ? pins.slice(0, 3).join(", ") : "no file beyond the named ones pins a renamed label"} · ${ticked.length} of ${fresh.length} new label(s) print ✓`);
  }
  if (want("T1")) {
    if (!sMoved) clause("T1", false, absent(SVC));
    else { const a = selftestRun(BASE, "base", SVC), b = selftestRun(ORG, "org", SVC); clause("T1", a.line === b.line && /, 0 failed/.test(b.line) && b.code === 0, `base "${a.line}" · org "${b.line}" (exit ${b.code})`); }
  }
  if (want("T2")) {
    if (!cMoved) clause("T2", false, absent(COND));
    else { const a = selftestRun(BASE, "base", COND), b = selftestRun(ORG, "org", COND); clause("T2", a.line === b.line && /, 0 failed/.test(b.line) && b.code === 0, `base "${a.line}" · org "${b.line}" (exit ${b.code})`); }
  }
  if (want("G1")) {
    const per = have ? [[SVC, newLines(bS, oS)], [COND, newLines(bC, oC)]].map(([f, nl]) => {
      // a cited grep may wrap onto the next comment line: the new lines are read joined, comment markers dropped
      const joined = nl.map(([, l]) => l.replace(/^\s*(\/\/|#)\s?/, "")).join(" ");
      const g = citedGreps(ORG, joined);
      return { f, ok: g.length > 0 && g.every((x) => x.ok) && g.some((x) => x.both), why: g.length ? `${g.length} grep(s), ${g.filter((x) => x.ok).length} resolve, ${g.filter((x) => x.both).length} cite both words` : "no cited grep in its new lines" };
    }) : [];
    clause("G1", have && per.every((v) => v.ok), have ? per.map((v) => `${v.f}: ${v.why}`).join(" · ") : "unreadable");
  }
  if (want("N1")) {
    const nl = have ? [...newLines(bS, oS).map(([n, l]) => [`${SVC}:${n}`, l]), ...newLines(bC, oC).map(([n, l]) => [`${COND}:${n}`, l])] : [];
    const strip = (t) => t.replace(/[\w./-]+\.(?:md|mjs|ps1)\b/g, "").replace(/\b\d{1,2} [A-Z][a-z]{2} \d{4}\b/g, "").replace(/\b[SL]\d+\b/g, "");
    const bad = nl.map(([w, l]) => { const s = strip(l); return /\d/.test(s) ? `${w} a digit` : /Disabled|killed|Ready|EXPECTED/.test(s) ? `${w} a state word` : null; }).filter(Boolean);
    clause("N1", nl.length > 0 && !bad.length, !nl.length ? "no new lines (the unit is absent)" : bad.length ? bad.join(", ") : `${nl.length} new line(s) state no live count or state`);
  }
  if (want("BOUND")) {
    if (!ok) clause("BOUND", false, "no --org / --base-org");
    else {
      const a = walk(BASE).m, b = walk(ORG).m; const diff = [];
      for (const [p, h] of b) if (a.get(p) !== h) diff.push(p);
      for (const p of a.keys()) if (!b.has(p)) diff.push(p);
      const extra = diff.filter((p) => !(p === SVC || p === COND || p.startsWith("ci/mtxt3/")));
      const both = diff.includes(SVC) && diff.includes(COND);
      clause("BOUND", !extra.length && both, extra.length ? `a file beyond the named ones differs: ${extra.slice(0, 5).join(", ")}${extra.length > 5 ? ` (+${extra.length - 5})` : ""}` : both ? `only the named files differ (${diff.length} path(s))` : "the two named files do not both differ (the unit is absent)");
    }
  }
} catch (e) { console.log(`  witness threw: ${e && e.message}`); results.push({ id: "THREW", ok: false }); }

// ---- LAST ----
// THE MUTANT DOOR (run_mutants' LAST mutant only): MTXT3_PLANT_ORPHAN=1 leaves one detached node process whose command line
//   names ROOT, and prints its pid so the runner kills it. Never set outside the runner.
if (process.env.MTXT3_PLANT_ORPHAN === "1") {
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
if (reds.length) { console.log(`RED MTXT3 · ${reds.join(", ")}`); exit = 1; }
else console.log(`GREEN MTXT3 the services.mjs selftest's switch-off labels and the conductor.mjs S12 lines restated, his two words cited by the grep, every assert check byte-identical · ${n} clause(s)`);
process.exit(exit);
