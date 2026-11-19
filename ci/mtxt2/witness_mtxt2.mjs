#!/usr/bin/env node
// ============================================================================
// ci/mtxt2/witness_mtxt2.mjs — UNIT mtxt2 · THE OTHER SWITCH-OFF PROSE: every comment and string of scripts/services.mjs
//   and scripts/rails.mjs that said the organism IS switched off, is OFF until S12, or that S12 turns things on, replaced
//   by text that CITES his 20 Aug 2026 word (the switch-off) and his 30 Aug 2026 word (back on) by a grep and NAMES the verb
//   that prints the live truth — the same citation form as unit mtxt. Forks rows 1114 (4) / 1118 (1). Text only.
// ----------------------------------------------------------------------------
// USAGE: node ci/mtxt2/witness_mtxt2.mjs --org <dir> --base-org <dir> [--only <clause>[,<clause>…]]
//   --org       the tree to witness (the build reads GREEN; the base, given as --org too, reads RED)
//   --base-org  the BASE tree (origin/main at the cut, named in ci/mtxt2/PROOF.md); absent ⇒ every clause RED
//   --only      run only these clause ids (the mutant runner's door); LAST always runs
// CONTRACT — READ-ONLY on --org and --base-org. Every process it starts (each file's `selftest`, the rails `decide` probe
//   and the rails `pretooluse` hook) runs on a COPY of the whole tree but .git / node_modules under os.tmpdir(), made by
//   node (the tracked tree rides the copy; no state file is read or printed by the witness), with HOME / USERPROFILE /
//   ARSENAL_ARCHIVE / ARSENAL_RAILS_BLIND_FILE under the same temp root; the copies are removed before LAST. No git repo is
//   planted here (the runner that clones does so with core.autocrlf=false). Every text read folds \r\n to \n, so a
//   Windows checkout reads the same; no POSIX-only shell is used (PowerShell lists processes on Windows). No port is bound,
//   no service is named live, nothing is POSTed, nothing restarted, no model is called (the probed `claude -p` is a STRING
//   handed to the rail, never executed). No timeout, budget or size is typed: every child is awaited by spawnSync, which
//   returns when it exits.
// CLAUSES (each RED on the base, GREEN on the build — the invariance clauses carry "the file differs from the base" as a
//   conjunct, so on the base they read RED for THAT reason; their teeth are the mutants):
//   O1  services.mjs states no switch-off: no "switched off"/"switched-off" (any case) and no "S12" on any line — each
//       hit is named file:line
//   O2  rails.mjs states no switch-off: no "switched off" (any case); every "S12" is the override TOKEN (S12:<rail>) or
//       the §10-C quote ("S12's canary") — each other hit is named file:line
//   K1  services.mjs differs ∧ its CODE SKELETON (comments dropped, string/template text blanked, ${…} kept) equals the
//       base's — the diff is comments or strings only
//   K2  rails.mjs, the same
//   T1  services.mjs differs ∧ its own `selftest` headline equals the base's and reads "0 failed" (exit 0)
//   T2  rails.mjs, the same
//   D1  rails.mjs differs ∧ the claude-p rail is unchanged: decide() on a `claude -p` Bash call (no study context) reads
//       deny · rail claude-p on both trees with the SAME fix; the org reason keeps (L6), (L5) and "ledger" and carries no
//       S12 / switched-off clause; and the `pretooluse` hook, fed the same call on stdin, prints the same
//       permissionDecision (deny) with the same exit code on both trees
//   G1  in each file every cited `grep -n "a\|b" docs/archive/<file>.md` RESOLVES (every alternative hits a line of the
//       cited file in --org), and each file carries one whose hits include a line with 20 Aug 2026 AND a line with
//       30 Aug 2026 — both of his words, cited
//   N1  the new lines (in --org, absent from the base) state no live count or state: no digit once dates, the cited file
//       name, rung ids (S<n>) and law ids (L<n>) are removed, and none of Disabled / killed / Running / Ready / EXPECTED
//   BOUND  only scripts/services.mjs, scripts/rails.mjs and ci/mtxt2/** differ from --base-org (both named files DO
//          differ); .git and node_modules are not walked; text is hashed with CRLF folded to LF
//   LAST   no node process naming this run's temp root survives (ps; PowerShell on Windows)
// LAST LINE: GREEN MTXT2 <what> · <n> clause(s) (exit 0) or RED MTXT2 · <clauses> (exit 1)
// ============================================================================
import { readFileSync, existsSync, mkdtempSync, mkdirSync, cpSync, rmSync, readdirSync } from "node:fs";
import { join, resolve, relative, sep } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import { spawnSync, execFileSync } from "node:child_process";
import { createHash } from "node:crypto";

const argv = process.argv.slice(2);
const opt = (k) => { const i = argv.indexOf(k); return i >= 0 && argv[i + 1] ? argv[i + 1] : null; };
const ORG = opt("--org") ? resolve(opt("--org")) : null;
const BASE = opt("--base-org") ? resolve(opt("--base-org")) : null;
const ONLY = opt("--only") ? new Set(opt("--only").split(",")) : null;
const want = (id) => !ONLY || ONLY.has(id);

const SVC = "scripts/services.mjs", RAILS = "scripts/rails.mjs";
const fold = (s) => s.replace(/\r\n/g, "\n");
const rd = (root, p) => { try { return fold(readFileSync(join(root, p), "utf8")); } catch { return null; } };

const ROOT = mkdtempSync(join(tmpdir(), "mtxt2-witness-"));
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

// ---- the claim scan: file:line of every switch-off / S12 claim ----
const numbered = (src) => src.split("\n").map((l, k) => [k + 1, l]);
const SWITCHED = /switched[\s-]+off/i;
const RAILS_S12_OK = (l) => l.replace(/S12:(?:claude-p|worktree|fleet|state|study)\b/g, "").replace(/S12's canary/g, "");
function claims(file, src, s12ok) {
  const hits = [];
  for (const [n, l] of numbered(src)) {
    if (SWITCHED.test(l)) hits.push(`${file}:${n} switched-off`);
    if (/\bS12\b/.test(s12ok ? s12ok(l) : l)) hits.push(`${file}:${n} S12`);
  }
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
  const env = { ...process.env, HOME: home, USERPROFILE: home, ARSENAL_ARCHIVE: join(home, "archive"), ARSENAL_RAILS_BLIND_FILE: join(home, "rails_blind.jsonl") };
  delete env.ANTHROPIC_API_KEY; delete env.ARSENAL_RAILS_OVERRIDE;
  return env;
}
function selftestHeadline(tree, tag, script, word) {
  const dst = copyOf(tree, tag);
  const r = spawnSync(process.execPath, [join(dst, script), "selftest"], { cwd: dst, env: envFor(tag), encoding: "utf8" });
  const lines = `${r.stdout || ""}\n${r.stderr || ""}`.split(/\r?\n/).filter((l) => new RegExp(`${word} selftest:`).test(l));
  return { line: lines.length ? lines[lines.length - 1].trim() : "(no headline)", code: r.status };
}
const CP_CALL = { tool_name: "Bash", tool_input: { command: "claude -p 'mtxt2 probe — a string, never run'" } };
function railProbe(tree, tag) {
  const dst = copyOf(tree, tag), url = pathToFileURL(join(dst, RAILS)).href, env = envFor(tag);
  const code = `import(process.env.__R).then((m) => { const d = m.decide(JSON.parse(process.env.__P), null); process.stdout.write(JSON.stringify({ decision: d.decision, rail: d.rail, fix: d.fix, reason: d.reason }) + "\\n"); })`;
  const a = spawnSync(process.execPath, ["--input-type=module", "-e", code], { cwd: dst, env: { ...env, __R: url, __P: JSON.stringify(CP_CALL) }, encoding: "utf8" });
  let dec = null; try { dec = JSON.parse((a.stdout || "").trim().split(/\r?\n/).pop()); } catch { dec = null; }
  const h = spawnSync(process.execPath, [join(dst, RAILS), "pretooluse"], { cwd: dst, env, input: JSON.stringify(CP_CALL), encoding: "utf8" });
  let hook = null; try { hook = JSON.parse((h.stdout || "").trim().split(/\r?\n/).pop()).hookSpecificOutput.permissionDecision; } catch { hook = null; }
  return { dec, hook, hookCode: h.status };
}

// ---- grep -n "a\|b" <file>, emulated (BRE: \| is alternation, the rest literal for these patterns) ----
const GREP_RE = /grep -n \\?"([^"\n]+?)\\?"[\s/#]*(docs\/archive\/[\w.-]+\.md)/g;
function citedGreps(org, src) {
  const out = [];
  for (const m of src.matchAll(GREP_RE)) {
    const alts = m[1].split(/\\{1,2}\|/), file = rd(org, m[2]);
    if (file == null) { out.push({ ok: false, both: false, why: `${m[2]} is not in the tree` }); continue; }
    const L = file.split("\n"); const hits = alts.map((a) => L.map((l, k) => [k + 1, l]).filter(([, l]) => l.includes(a)));
    const has = (d) => hits.flat().some(([, l]) => l.includes(d));
    out.push({ ok: hits.every((h) => h.length > 0), both: has("20 Aug 2026") && has("30 Aug 2026"), why: alts.map((a, k) => `"${a}"→${hits[k].map(([n]) => n).join(",") || "none"}`).join(" · ") });
  }
  return out;
}

// ---- the tree walk (BOUND) ----
function walk(root) {
  const m = new Map();
  const go = (d) => { for (const e of readdirSync(d, { withFileTypes: true })) {
    if (e.name === ".git" || e.name === "node_modules") continue;
    const p = join(d, e.name);
    if (e.isDirectory()) go(p);
    else if (e.isFile()) { let b = readFileSync(p); const s = b.toString("utf8"); if (!s.includes("\uFFFD")) b = Buffer.from(fold(s)); m.set(relative(root, p).split(sep).join("/"), createHash("sha256").update(b).digest("hex")); }
  } };
  go(root); return m;
}
const newLines = (base, org) => { const B = new Set(base.split("\n")); return numbered(org).filter(([, l]) => !B.has(l)); };

let exit = 0;
try {
  const ok = ORG && BASE && existsSync(ORG) && existsSync(BASE);
  const oS = ok ? rd(ORG, SVC) : null, bS = ok ? rd(BASE, SVC) : null, oR = ok ? rd(ORG, RAILS) : null, bR = ok ? rd(BASE, RAILS) : null;
  const have = oS != null && bS != null && oR != null && bR != null;
  const sMoved = have && oS !== bS, rMoved = have && oR !== bR;
  if (!have) console.log(`  (cannot read ${SVC} / ${RAILS} in --org and --base-org: every clause RED)`);
  const absent = (f) => `${f} does not differ from the base (the unit is absent)`;

  if (want("O1")) { const h = have ? claims(SVC, oS) : ["unreadable"]; clause("O1", have && !h.length, h.length ? `${h.length} claim(s): ${h.slice(0, 8).join(", ")}${h.length > 8 ? " …" : ""}` : `no switched-off / S12 claim in ${SVC}`); }
  if (want("O2")) { const h = have ? claims(RAILS, oR, RAILS_S12_OK) : ["unreadable"]; clause("O2", have && !h.length, h.length ? `${h.length} claim(s): ${h.join(", ")}` : `no switched-off claim in ${RAILS}; every S12 is the override token or the §10-C quote`); }
  if (want("K1")) { const same = have && skeleton(oS) === skeleton(bS); clause("K1", sMoved && same, !sMoved ? absent(SVC) : same ? `${SVC}: code skeleton equals the base's — comments/strings only` : `${SVC}: a CODE token differs from the base`); }
  if (want("K2")) { const same = have && skeleton(oR) === skeleton(bR); clause("K2", rMoved && same, !rMoved ? absent(RAILS) : same ? `${RAILS}: code skeleton equals the base's — comments/strings only` : `${RAILS}: a CODE token differs from the base`); }
  if (want("T1")) {
    if (!sMoved) clause("T1", false, absent(SVC));
    else { const a = selftestHeadline(BASE, "base", SVC, "services"), b = selftestHeadline(ORG, "org", SVC, "services"); clause("T1", a.line === b.line && /, 0 failed/.test(b.line) && b.code === 0, `base "${a.line}" · org "${b.line}" (exit ${b.code})`); }
  }
  if (want("T2")) {
    if (!rMoved) clause("T2", false, absent(RAILS));
    else { const a = selftestHeadline(BASE, "base", RAILS, "rails"), b = selftestHeadline(ORG, "org", RAILS, "rails"); clause("T2", a.line === b.line && /, 0 failed/.test(b.line) && b.code === 0, `base "${a.line}" · org "${b.line}" (exit ${b.code})`); }
  }
  if (want("D1")) {
    if (!rMoved) clause("D1", false, absent(RAILS));
    else {
      const a = railProbe(BASE, "base"), b = railProbe(ORG, "org");
      const same = !!(a.dec && b.dec) && a.dec.decision === "deny" && b.dec.decision === "deny" && a.dec.rail === "claude-p" && b.dec.rail === "claude-p" && a.dec.fix === b.dec.fix;
      const r = (b.dec && b.dec.reason) || "";
      const keeps = r.includes("(L6)") && r.includes("(L5)") && /ledger/.test(r) && !/\bS12\b/.test(r) && !SWITCHED.test(r);
      const hook = a.hook === "deny" && b.hook === "deny" && a.hookCode === b.hookCode;
      clause("D1", same && keeps && hook, `decide: ${same ? "deny · claude-p · same fix on both" : `MOVED (base ${a.dec && a.dec.decision}/${a.dec && a.dec.rail} · org ${b.dec && b.dec.decision}/${b.dec && b.dec.rail})`} · reason ${keeps ? "keeps L6, L5, the ledger; no switch-off clause" : "LOST a true reason or KEPT the switch-off clause"} · hook ${hook ? `deny on both, exit ${b.hookCode}` : `base ${a.hook}/${a.hookCode} · org ${b.hook}/${b.hookCode}`}`);
    }
  }
  if (want("G1")) {
    const per = have ? [[SVC, citedGreps(ORG, oS)], [RAILS, citedGreps(ORG, oR)]] : [];
    const verdict = per.map(([f, g]) => ({ f, ok: g.length > 0 && g.every((x) => x.ok) && g.some((x) => x.both), why: g.length ? `${g.length} grep(s), ${g.filter((x) => x.ok).length} resolve, ${g.filter((x) => x.both).length} cite both words` : "no cited grep" }));
    clause("G1", have && verdict.every((v) => v.ok), have ? verdict.map((v) => `${v.f}: ${v.why}`).join(" · ") : "unreadable");
  }
  if (want("N1")) {
    const fresh = have ? [...newLines(bS, oS).map(([n, l]) => [`${SVC}:${n}`, l]), ...newLines(bR, oR).map(([n, l]) => [`${RAILS}:${n}`, l])] : [];
    const strip = (t) => t.replace(/ORGANISM_AUDIT__\d{4}-\d{2}-\d{2}/g, "").replace(/\b\d{1,2} [A-Z][a-z]{2} \d{4}\b/g, "").replace(/\b[SL]\d+\b/g, "");
    const bad = fresh.map(([w, l]) => { const s = strip(l); return /\d/.test(s) ? `${w} a digit` : /Disabled|killed|Running|Ready|EXPECTED/.test(s) ? `${w} a state word` : null; }).filter(Boolean);
    clause("N1", fresh.length > 0 && !bad.length, !fresh.length ? "no new lines (the unit is absent)" : bad.length ? bad.join(", ") : `${fresh.length} new line(s) state no live count or state`);
  }
  if (want("BOUND")) {
    if (!ok) clause("BOUND", false, "no --org / --base-org");
    else {
      const a = walk(BASE), b = walk(ORG); const diff = [];
      for (const [p, h] of b) if (a.get(p) !== h) diff.push(p);
      for (const p of a.keys()) if (!b.has(p)) diff.push(p);
      const extra = diff.filter((p) => !(p === SVC || p === RAILS || p.startsWith("ci/mtxt2/")));
      const both = diff.includes(SVC) && diff.includes(RAILS);
      clause("BOUND", !extra.length && both, extra.length ? `a file beyond the named ones differs: ${extra.slice(0, 5).join(", ")}${extra.length > 5 ? ` (+${extra.length - 5})` : ""}` : both ? `only the named files differ (${diff.length} path(s))` : "the two named files do not both differ (the unit is absent)");
    }
  }
} catch (e) { console.log(`  witness threw: ${e && e.message}`); results.push({ id: "THREW", ok: false }); }

// ---- LAST ----
// THE MUTANT DOOR (run_mutants' LAST mutant only): MTXT2_PLANT_ORPHAN=1 leaves one detached node process whose command line
//   names ROOT, and prints its pid so the runner kills it. Never set outside the runner.
if (process.env.MTXT2_PLANT_ORPHAN === "1") {
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
if (reds.length) { console.log(`RED MTXT2 · ${reds.join(", ")}`); exit = 1; }
else console.log(`GREEN MTXT2 the switch-off / S12 prose of services.mjs and rails.mjs replaced by his two words cited and the verbs named, text only · ${n} clause(s)`);
process.exit(exit);
