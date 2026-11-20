#!/usr/bin/env node
// ============================================================================
// witness_mrf.mjs — unit MRF (forks rows 1107 (2) / 1119 / 1120): mf2 re-judged (F-1 C monotone, F-3 (b), F-5 (a)) and the
// suite's A2 matcher following mday's line (F-2 (a)).
// CONTRACT:  node ci/mrf/witness_mrf.mjs --org <tree> --base-org <tree> [--only "<id>,<id>"]
//   Each tree is COPIED under os.tmpdir() (one temp dir per run, TMP below); every child runs with TMPDIR / TMP / TEMP
//   pointed under TMP, a refusing `claude` / `gemini` first on PATH, ANTHROPIC_API_KEY deleted, and every organ port that
//   has an env door (`export const *PORT = … process.env.X …`) handed an OS-picked free port (listen 0, read, released).
//   No fixed port is bound, no live service is named or posted to, nothing is restarted. Every spawn is bounded by the
//   job's own timeout-minutes, read at run time from <org>/.github/workflows/suite.yml, never typed.
//   A2.1 LINE    · `node scripts/organism_test.mjs path` (full profile) on a copy of <org>: A2's verdict line reads ok.
//   A2.2 BITES   · A2.1, and in a second copy the --no-spawn branch of sitting.mjs is planted to print `could not start
//                  the daemon` beside its open line: A2 reads FAIL (the never-a-daemon guard still bites).
//   A2.3 SHAPE   · A2.1, and in a third copy openLine's ` · door <door>` suffix is planted away: A2 reads FAIL (the
//                  matcher reads mday's local-door line, not any line).
//   A2.4 PORT    · A2.1, and <org>'s organism_test.mjs types no ARSENAL_SITTING_PORT digit literal (F-3 (b)).
//   MONO         · <org>'s ci/mf2/monotone.mjs, planted six ways: a vanished base member and an ok → FAIL are red; an
//                  addition (ok or FAIL) and a FAIL → ok are named, never red; a twice-judged name judged once is vanished;
//                  and <org>'s witness_mf2.mjs F2 and F4 both judge by it (F-1 C).
//   RECUT        · <org>'s witness_mf2.mjs header names unit mrf and row 1120 on F2 and on F4, and keeps each old text struck.
//   KR           · <org>'s KNOWN_RED holds no entry for ‹mf2› or owner unit mrf, and names the retirement (row 1120 (4));
//                  any other <base-org> entry not in <org> is named in the line, never red (its owner retires it).
//   BOUND        · between <base-org> and <org>: scripts/organism_test.mjs differs, and nothing else outside ci/mf2/ and
//                  ci/mrf/ does.
//   LAST         · no node process naming TMP survives.
// LAST LINE: GREEN MRF <what> · <n> clause(s) (exit 0) | RED MRF · <clauses> (exit 1)
// Portable: no POSIX-only shell (the model stubs are written per platform); every read is split on /\r?\n/.
// ============================================================================
import { mkdtempSync, writeFileSync, readFileSync, readdirSync, statSync, lstatSync, rmSync, cpSync, mkdirSync, existsSync } from "node:fs";
import { join, relative, resolve, delimiter } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { createServer } from "node:net";
import { pathToFileURL } from "node:url";

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const ORG = arg("--org") && resolve(arg("--org")), BASE = arg("--base-org") && resolve(arg("--base-org"));
const ONLY = arg("--only") ? arg("--only").split(",").map((s) => s.trim()).filter(Boolean) : null;
if (!ORG || !BASE) { console.log("RED MRF · USAGE (--org <dir> --base-org <dir>)"); process.exit(1); }
const want = (id) => !ONLY || ONLY.includes(id);
const TMP = mkdtempSync(join(tmpdir(), "mrf-"));
const reds = [], greens = [];
const clause = (id, ok, line) => { if (!want(id)) return; (ok ? greens : reds).push(id); console.log(`${ok ? "GREEN" : "RED  "} ${id} · ${line}`); };
const RD = (p) => { try { return readFileSync(p, "utf8"); } catch { return null; } };

// ── the bound: the job's own timeout-minutes, read at run time ──
const T0 = Date.now();
const jobMin = Number((/timeout-minutes:\s*(\d+)/.exec(RD(join(ORG, ".github", "workflows", "suite.yml")) || "") || [])[1]);
const left = () => Math.max(1, T0 + jobMin * 60000 - Date.now());

// ── the planted model stubs and the child env ──
const SHIM = join(TMP, "shim"), CT = join(TMP, "ctmp");
mkdirSync(SHIM, { recursive: true }); mkdirSync(CT, { recursive: true });
for (const n of ["claude", "gemini"]) {
  writeFileSync(join(SHIM, n), "#!/bin/sh\necho 'planted: no model call (unit mrf)' >&2\nexit 1\n", { mode: 0o755 });
  writeFileSync(join(SHIM, `${n}.cmd`), "@echo planted: no model call (unit mrf) 1>&2\r\n@exit /b 1\r\n");
}
const env = { ...process.env };
const pk = Object.keys(env).find((k) => k.toUpperCase() === "PATH") || "PATH";
env[pk] = `${SHIM}${delimiter}${env[pk] || ""}`;
for (const k of ["TMPDIR", "TMP", "TEMP"]) env[k] = CT;
delete env.ANTHROPIC_API_KEY; delete env.ORGANISM_TEST_PROFILE;
const freePort = () => new Promise((res, rej) => { const s = createServer(); s.once("error", rej); s.listen(0, "127.0.0.1", () => { const a = s.address(); s.close(() => res(typeof a === "object" && a ? a.port : 0)); }); });
for (const f of existsSync(join(ORG, "scripts")) ? readdirSync(join(ORG, "scripts")).filter((x) => x.endsWith(".mjs")) : [])
  for (const l of (RD(join(ORG, "scripts", f)) || "").split(/\r?\n/)) { const m = /^export const [A-Z_]*PORT = .*process\.env\.([A-Z0-9_]+)/.exec(l); if (m) env[m[1]] = String(await freePort()); }

const copyTree = (src) => { const d = mkdtempSync(join(TMP, "tree-")); cpSync(src, d, { recursive: true, verbatimSymlinks: true }); return d; };
const A2RE = /^ {2}(ok|FAIL) +A2 · `sitting\.mjs open --no-spawn`/m;
/** the suite's path mode (full profile) on a tree; A2's verdict ("ok" | "FAIL" | null) */
function a2Of(tree) {
  if (!(jobMin > 0)) return { v: null, why: "no timeout-minutes in .github/workflows/suite.yml (the bound is unreadable)" };
  const r = spawnSync(process.execPath, [join(tree, "scripts", "organism_test.mjs"), "path"], { cwd: tree, env, encoding: "utf8", timeout: left(), maxBuffer: 1 << 28, windowsHide: true });
  const out = String(r.stdout || "");
  const m = A2RE.exec(out);
  const head = out.split(/\r?\n/).filter((l) => /^organism_test: /.test(l)).pop() || "";
  return { v: m ? m[1] : null, why: m ? head : `no A2 line (exit ${r.status}${r.error ? `, ${r.error.message}` : ""})`, head };
}
/** plant: replace `from` (the first one at or after `after`) with `to` in <tree>/scripts/<f> @returns {string|null} why it failed */
function plant(tree, f, after, from, to) {
  const p = join(tree, "scripts", f), s = RD(p);
  if (s === null) return `${f} is absent`;
  const a = after ? s.indexOf(after) : 0;
  if (a < 0) return `anchor not found in ${f}: ${after.slice(0, 60)}`;
  const i = s.indexOf(from, a);
  if (i < 0) return `plant site not found in ${f}: ${from.slice(0, 60)}`;
  writeFileSync(p, s.slice(0, i) + to + s.slice(i + from.length));
  return null;
}

const OT = RD(join(ORG, "scripts", "organism_test.mjs")) || "", BT = RD(join(BASE, "scripts", "organism_test.mjs")) || "";
// ── A2.1 · A2.4 ──
const needA2 = ["A2.1 LINE", "A2.2 BITES", "A2.3 SHAPE", "A2.4 PORT"].some(want);
const a2 = needA2 ? a2Of(copyTree(ORG)) : { v: null, why: "not run" };
clause("A2.1 LINE", a2.v === "ok", `A2 on <org>, full profile path: ${a2.v || "absent"} · ${a2.why}`);
if (want("A2.2 BITES")) {
  const t = copyTree(ORG);
  const e = plant(t, "sitting.mjs", 'by: "sitting open --no-spawn" });', "console.log(openLine(r));", 'console.log(openLine(r)); console.log("sitting: could not start the daemon (planted, unit mrf)");');
  const p = e ? { v: null, why: e } : a2Of(t);
  clause("A2.2 BITES", a2.v === "ok" && p.v === "FAIL", `A2 unplanted ${a2.v || "absent"} (must be ok) · planted 'could not start the daemon' beside the open line: ${p.v || "absent"} (must be FAIL) · ${p.why}`);
}
if (want("A2.3 SHAPE")) {
  const t = copyTree(ORG);
  const e = plant(t, "sitting.mjs", "const openLine = (r) =>", "${r.door ? ` · door ${r.door}` : \"\"}", "");
  const p = e ? { v: null, why: e } : a2Of(t);
  clause("A2.3 SHAPE", a2.v === "ok" && p.v === "FAIL", `A2 unplanted ${a2.v || "absent"} (must be ok) · openLine's door suffix planted away: ${p.v || "absent"} (must be FAIL) · ${p.why}`);
}
{
  const typed = [...OT.matchAll(/ARSENAL_SITTING_PORT:\s*["'`]\d+["'`]/g)].length;
  clause("A2.4 PORT", a2.v === "ok" && typed === 0, `ARSENAL_SITTING_PORT digit literals in <org>'s organism_test.mjs: ${typed} (must be 0; <base-org>: ${[...BT.matchAll(/ARSENAL_SITTING_PORT:\s*["'`]\d+["'`]/g)].length}) · A2 ${a2.v || "absent"}`);
}

// ── MONO ──
if (want("MONO")) {
  const mp = join(ORG, "ci", "mf2", "monotone.mjs");
  let mono = null, err = "";
  try { mono = existsSync(mp) ? (await import(pathToFileURL(mp).href)).monotone : null; } catch (e) { err = String(e && e.message); }
  const checks = [];
  if (typeof mono === "function") {
    const A = [["ok", "a"], ["FAIL", "b"], ["ok", "c"], ["ok", "c"]];
    const t = (n, r, ok, f) => checks.push([n, r.ok === ok && f(r)]);
    t("same", mono(A, A), true, (r) => !r.vanished.length && !r.moved.length && !r.added.length && !r.gained.length);
    t("vanished", mono(A, A.filter(([, n]) => n !== "a")), false, (r) => r.vanished.length === 1);
    t("ok→FAIL", mono(A, [["FAIL", "a"], ...A.slice(1)]), false, (r) => r.moved.length === 1);
    t("added", mono(A, [...A, ["ok", "d"], ["FAIL", "e"]]), true, (r) => r.added.length === 2);
    t("FAIL→ok", mono(A, [A[0], ["ok", "b"], A[2], A[3]]), true, (r) => r.gained.length === 1 && !r.moved.length);
    t("twice→once", mono(A, A.slice(0, 3)), false, (r) => r.vanished.length === 1);
  }
  const W = RD(join(ORG, "ci", "mf2", "witness_mf2.mjs")) || "";
  const wired = /const r = monotone\(bh\.members, oh\.members\);\s*\n\s*clause\("F2", r\.ok,/.test(W) && /const r = monotone\(bf\.members, of\.members\);\s*\n\s*clause\("F4", r\.ok,/.test(W) && /from "\.\/monotone\.mjs"/.test(W);
  const bad = checks.filter(([, ok]) => !ok).map(([n]) => n);
  clause("MONO", typeof mono === "function" && checks.length === 6 && !bad.length && wired,
    `ci/mf2/monotone.mjs ${typeof mono === "function" ? "loaded" : `absent or broken${err ? ` (${err.slice(0, 80)})` : ""}`} · plants ${checks.length - bad.length}/6 held${bad.length ? ` (broken: ${bad.join(", ")})` : ""} · F2 and F4 judge by it: ${wired}`);
}

// ── RECUT ──
{
  const W = RD(join(ORG, "ci", "mf2", "witness_mf2.mjs")) || "";
  const hdr = W.split(/\r?\n/).filter((l) => l.startsWith("//")).join("\n");
  const has = {
    "F2 re-cut named": /F2 · RE-CUT by unit mrf \(forks row 1120/.test(hdr),
    "F4 re-cut named": /F4 · RE-CUT by unit mrf \(forks row 1120/.test(hdr),
    "F2 old text struck": /~~every member the BASE hermetic run judged[\s\S]*?as LIVE_ASSERTS keys are\)\.~~/.test(hdr),
    "F4 old text struck": /~~the build's FULL profile output equals the base's member for member[\s\S]*?pass\/fail headline\.~~/.test(hdr),
  };
  const miss = Object.entries(has).filter(([, v]) => !v).map(([k]) => k);
  clause("RECUT", !miss.length, `witness_mf2.mjs header: ${miss.length ? `missing ${miss.join(", ")}` : "F2 and F4 re-cut by unit mrf, row 1120, each old text struck"}`);
}

// ── KR ──
{
  const list = (s) => { const a = s.indexOf("const KNOWN_RED = ["), b = a < 0 ? -1 : s.indexOf("\n];", a); return a < 0 || b < 0 ? null : s.slice(a, b).split(/\r?\n/).filter((l) => /^\s*\{ assert: /.test(l)); };
  const o = list(OT), b = list(BT);
  const mine = (l) => /WITNESS ‹mf2›/.test(l) || /owner: "unit mrf"/.test(l);
  const kept = b ? b.filter((l) => !mine(l)) : [];
  const lost = o ? kept.filter((l) => !o.includes(l)) : kept;
  const retired = /WITNESS ‹mf2› · GREEN at head against its BASE, detail "red beyond BOUND: F2 F4" \(row 1107, owner unit mrf\)\. Retired\s*\n\/\/\s+by unit mrf \(forks row 1120/.test(OT);
  // another unit's entry gone from <org> is NAMED, never red: its owner retires it in its own landing (the list only shrinks)
  clause("KR", !!o && !!b && !o.some(mine) && retired,
    `KNOWN_RED entries: <org> ${o ? o.length : "unreadable"} · <base-org> ${b ? b.length : "unreadable"} · ‹mf2› / unit mrf entries left in <org>: ${o ? o.filter(mine).length : "?"} (must be 0) · retirement recorded: ${retired} · other base entries not in <org> (named, never red): ${lost.length ? lost.map((l) => (/assert: "([^"]*)"/.exec(l) || [])[1]).join(" · ") : "none"}`);
}

// ── BOUND ──
{
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
  const differ = [...new Set([...WA.keys(), ...WB.keys()])].filter((k) => WA.get(k) !== WB.get(k)).sort();
  const beyond = differ.filter((f) => f !== "scripts/organism_test.mjs" && !f.startsWith("ci/mf2/") && !f.startsWith("ci/mrf/"));
  clause("BOUND", differ.includes("scripts/organism_test.mjs") && !beyond.length, `differs: ${differ.join(", ") || "nothing"}${beyond.length ? ` · beyond the named files: ${beyond.join(", ")}` : ""}`);
}

// ── LAST ──
{
  const listing = process.platform === "win32"
    ? spawnSync("powershell", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process | ForEach-Object { $_.CommandLine }"], { encoding: "utf8", timeout: left(), windowsHide: true }).stdout || ""
    : spawnSync("ps", ["-eo", "args"], { encoding: "utf8", timeout: left() }).stdout || "";
  const alive = String(listing).split(/\r?\n/).filter((l) => l.includes(TMP) && !l.includes("Get-CimInstance") && !/^ps /.test(l));
  clause("LAST", alive.length === 0, `${alive.length} node process(es) naming ${TMP}${alive.length ? `: ${alive.slice(0, 3).join(" | ").slice(0, 300)}` : ""}`);
}
try { rmSync(TMP, { recursive: true, force: true }); } catch { }
if (reds.length) { console.log(`RED MRF · ${reds.join(", ")}`); process.exit(1); }
console.log(`GREEN MRF mf2 re-judged monotone and A2 following mday's line · ${greens.length} clause(s)`);
process.exit(0);
