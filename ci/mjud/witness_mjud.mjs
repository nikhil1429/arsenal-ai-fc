#!/usr/bin/env node
// ============================================================================================================
// ci/mjud/witness_mjud.mjs — THE WITNESS OF UNIT mjud (msit · F3 · mjd2 · mauth). Its header is its contract.
//
//   node ci/mjud/witness_mjud.mjs --org <dir> [--base-org <dir>]
//
// --org       an organism tree (a git-archive of the side under test). It is NEVER run in place: it is copied to
//             a fresh directory under os.tmpdir() (node_modules linked in: a junction on Windows), and every plant
//             runs on that copy with ITS OWN state dir (a second fresh temp dir) and a FIXED clock.
// --base-org  BASE's tree; when given, the BOUND clause holds --org to differ from it only in the named files.
//
// NO LIVE MODEL CALL, BY CONSTRUCTION: a fake `claude` (sh + claude.cmd) is put FIRST on PATH for the witness and
// every child; every driver child runs under ci/mjud/w_preload.mjs, which replaces node:child_process's spawners with
// recorders (nothing is spawned); every model call inside gradeJudge is a planted function. The LAST clause proves
// the fake claude logged no spawn and that no node process naming the temp dir survives.
//
// THE CLAUSES (each RED at BASE where the build feeds it; a guard clause is GREEN on both sides by design):
//   M1 SITTING   the sitting close (createSitting → POST /close, the real ownerCli) spawns gaffer_brain judge-due with a
//                timeout ≥ JUDGE_BUDGET_MS + JUDGE_DISPATCH_MS (both read from the copy's gaffer_brain), and > the
//                budget; its non-judge owner spawns (queue, intent close) keep 20 s.                        [feeds: msit]
//   M2 DUGOUT    the judge_round tool (execTool, the real sh) spawns gaffer_brain judge-round with a timeout ≥ budget +
//                dispatch; a non-judge tool spawn keeps 60 s.                                               [feeds: msit]
//   M3 CENSUS    every judge-verb spawn site in scripts/ + hooks/ (the call shapes `"gaffer_brain.mjs", ["judge-…"` and
//                `join(…, "gaffer_brain.mjs"), "judge-…"`) is one of: sitting.mjs through ownerTimeoutMs, dugout.mjs
//                through shTimeoutMs, postmatch.mjs through its JUDGE_BUDGET_MS reserve — and nothing else.  [feeds: msit]
//   M4 F3-EAT    a planted external check that takes the whole budget: NO judge call is made, no batch starts, and
//                the reason names the check (judge-budget-spent-by-external-check); the check was handed ≤ budget. [F3]
//   M5 F3-CLIP   a check that takes a third: the check is handed the budget, the first batch is killed at what the
//                check left (budget − a third), never at a fresh budget.                                       [F3]
//   M6 MJD2      a batch of 10 KILLED at the budget beside a fast ok row: the next first batch is < 10; and planted
//                again with that size killed too, the size shrinks again (s2 < s1).                          [mjd2]
//   M7 NOFLOOR   the other way (guard): an auth refusal and an un-killed failure teach the size nothing — the size
//                equals the ok-only size.                                                                     [guard]
//   M8 MAUTH     brain.mjs exports AUTH_FAIL_RE, it matches the three observed refusals (OAuth included), it IS the
//                judge's pattern (one RegExp object), and the scripts hold ONE auth-pattern literal.           [mauth]
//   M9 KEPT      (guard) the OAuth refusal still stops the round RED with ONE card, and an ok round's output keeps
//                every field a caller reads today.                                                            [guard]
//   BOUND        (only with --base-org) --org differs from --base-org only in the four named files (ci/ and the seat's
//                .claude/settings.json are outside the comparison).
//   LAST         the fake claude first on PATH logged no spawn, and no node process naming the temp dir survives.
//
// LAST LINE: `GREEN MJUD <what> · <n> clause(s)` (exit 0) or `RED MJUD · <clauses>` (exit 1). Path keys are forward
// slashes; no /proc; process listing is `ps` on POSIX and PowerShell CIM on Windows.
// ============================================================================================================
import { mkdtempSync, cpSync, writeFileSync, readFileSync, existsSync, mkdirSync, symlinkSync, readdirSync, statSync, rmSync } from "node:fs";
import { join, dirname, resolve, relative } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync, execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createHash } from "node:crypto";

const HERE = dirname(fileURLToPath(import.meta.url));
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const ORG = arg("--org") ? resolve(arg("--org")) : null;
const BASE_ORG = arg("--base-org") ? resolve(arg("--base-org")) : null;
if (!ORG || !existsSync(join(ORG, "scripts", "gaffer_brain.mjs"))) { console.log("RED MJUD · USAGE (--org <dir> holding scripts/gaffer_brain.mjs)"); process.exit(1); }
const NAMED = ["scripts/sitting.mjs", "scripts/dugout.mjs", "scripts/gaffer_brain.mjs", "scripts/brain.mjs"];
const IS_WIN = process.platform === "win32";
const fwd = (p) => String(p).replace(/\\/g, "/");

// ── the temp world: the copy, its own state dir, the fake claude first on PATH ──
const TMP = mkdtempSync(join(tmpdir(), "mjud-w-"));
const COPY = join(TMP, "org");
cpSync(ORG, COPY, { recursive: true, filter: (src) => { const r = fwd(relative(ORG, src)); return !/^(node_modules|\.git)(\/|$)/.test(r); } });
const NM = [join(ORG, "node_modules"), join(HERE, "..", "..", "node_modules")].find((p) => existsSync(p));
if (NM && !existsSync(join(COPY, "node_modules"))) symlinkSync(NM, join(COPY, "node_modules"), IS_WIN ? "junction" : "dir");
const BIN = join(TMP, "fakebin"); mkdirSync(BIN);
const FAKE_LOG = join(TMP, "fake_claude.log");
writeFileSync(join(BIN, "fake_claude.mjs"), `import { appendFileSync } from "node:fs";\nappendFileSync(${JSON.stringify(FAKE_LOG)}, JSON.stringify(process.argv.slice(2, 6)) + "\\n");\nprocess.stdout.write(JSON.stringify({ is_error: true, result: "fake claude (witness_mjud): no live model call" }));\nprocess.exit(1);\n`);
writeFileSync(join(BIN, "claude"), `#!/bin/sh\nexec "${fwd(process.execPath)}" "${fwd(join(BIN, "fake_claude.mjs"))}" "$@"\n`, { mode: 0o755 });
writeFileSync(join(BIN, "claude.cmd"), `@"${process.execPath}" "${join(BIN, "fake_claude.mjs")}" %*\r\n`);
const PATH_KEY = Object.keys(process.env).find((k) => k.toUpperCase() === "PATH") || "PATH";
process.env[PATH_KEY] = `${BIN}${IS_WIN ? ";" : ":"}${process.env[PATH_KEY] || ""}`;
delete process.env.ANTHROPIC_API_KEY;

let stateN = 0;
function drive(part, prep) {
  const state = join(TMP, `state-${part}-${++stateN}`); mkdirSync(state, { recursive: true });
  if (prep) prep(state);
  const log = join(TMP, `spawns-${part}.jsonl`);
  const env = { ...process.env, MJUD_SPAWN_LOG: log, ARSENAL_SITTING_STATE_DIR: state, ARSENAL_SITTING_DRY_OWNERS: "", TZ: "UTC" };
  const r = spawnSync(process.execPath, ["--import", pathToFileURL(join(HERE, "w_preload.mjs")).href, join(HERE, "w_drive.mjs"), COPY, part],
    { cwd: COPY, env, encoding: "utf8", timeout: 120000, windowsHide: true, maxBuffer: 1 << 26 });
  const line = String(r.stdout || "").split(/\r?\n/).filter((l) => l.startsWith("{")).at(-1);
  try { return JSON.parse(line); } catch { return { part, threw: `driver gave no facts (exit ${r.status}): ${String(r.stderr || r.stdout || "").slice(-300)}` }; }
}

const clauses = [];
const clause = (name, ok, detail) => { clauses.push({ name, ok: !!ok }); console.log(`  ${ok ? "GREEN" : "RED  "} ${name} — ${detail}`); };
const need = (f) => f.budget + (Number.isFinite(f.dispatch) ? f.dispatch : 0);

// M1 — the sitting close, through the real owner funnel
{
  const f = drive("sitting", (state) => writeFileSync(join(state, "sitting.json"), JSON.stringify({
    id: "sit_witness", route: "CODE", task: "witness", concept: null, cursor: 0, plan: [], transport: "none", surfaces: ["code"], opened_at: "2026-09-10T05:00:00.000Z",
    stats: { banked: 1, owner_calls: 0, turns: 0, units_composed: 0, units_delivered: 0, by_class: { deliver: 0, respond: 0, compose: 0, judge: 0 }, latency_ms: { judge: [], respond: [], compose: [] }, tokens: null, head_tokens: null } })));
  const t = f.judge ? f.judge.timeout : null;
  const others = (f.others || []).filter((o) => o.fn === "spawnSync");   // the owner funnel's own calls; the detached reviewer (spawn) has no timeout on either side
  const ok = !f.threw && f.closed && Number.isFinite(t) && Number.isFinite(f.dispatch) && t >= need(f) && t > f.budget && others.length > 0 && others.every((o) => o.timeout === 20000);
  clause("M1 SITTING", ok, f.threw ? `driver threw: ${f.threw}` : `close ${f.closed ? "ran" : "did not run"} · judge-due spawned with timeout ${t} ms against budget ${f.budget} + dispatch ${f.dispatch} · non-judge owners ${others.map((o) => `${o.organ} ${o.verb} ${o.timeout}`).join(", ") || "none"}`);
}
// M2 — the dugout judge_round tool, through the real sh
{
  const f = drive("dugout");
  const t = f.judge ? f.judge.timeout : null;
  const others = f.others || [];
  const ok = !f.threw && Number.isFinite(t) && Number.isFinite(f.dispatch) && t >= need(f) && t > f.budget && others.length > 0 && others.every((o) => o.timeout === 60000);
  clause("M2 DUGOUT", ok, f.threw ? `driver threw: ${f.threw}` : `judge_round spawned judge-round with timeout ${t} ms against budget ${f.budget} + dispatch ${f.dispatch} · non-judge tool spawns ${others.map((o) => `${o.organ} ${o.verb} ${o.timeout}`).join(", ") || "none"}`);
}
// M3 — the census of judge-verb spawn sites
{
  const files = [];
  for (const d of ["scripts", "hooks"]) { const dir = join(COPY, d); if (!existsSync(dir)) continue;
    for (const n of readdirSync(dir)) if (/\.(mjs|js|cjs)$/.test(n) && statSync(join(dir, n)).isFile()) files.push(`${d}/${n}`); }
  const SITE = /"gaffer_brain\.mjs"\)?,\s*\[?\s*"(judge-round|judge-due)"/;
  const sites = [];
  for (const f of files) {
    const src = readFileSync(join(COPY, f), "utf8").replace(/\r\n/g, "\n");
    // a call of the RESOLVER itself (ownerTimeoutMs("gaffer_brain.mjs", ["judge-due"])) names a judge verb and spawns nothing
    const spawnShape = (l) => [...l.matchAll(new RegExp(SITE.source, "g"))].some((m) => !/TimeoutMs\($/.test(l.slice(0, m.index)));
    src.split("\n").forEach((l, i) => { const s = l.trim(); if (spawnShape(l) && !s.startsWith("//") && !/^\s*(assert|calls\.|&&|\|\|)/.test(s) && !/x\.(file|args)|c\.(script|argv)/.test(l)) sites.push({ f, line: i + 1, src: s }); });
  }
  const srcOf = (f) => readFileSync(join(COPY, f), "utf8").replace(/\r\n/g, "\n");
  const covered = (s) => {
    if (s.f === "scripts/sitting.mjs") return /owner\("gaffer_brain\.mjs"/.test(s.src) && /export function ownerCli[\s\S]{0,700}timeout: ownerTimeoutMs\(file, args\)/.test(srcOf(s.f)) && /function ownerTimeoutMs[\s\S]{0,300}JUDGE_BUDGET_MS \+ JUDGE_DISPATCH_MS/.test(srcOf(s.f));
    if (s.f === "scripts/dugout.mjs") return /sh\("gaffer_brain\.mjs"/.test(s.src) && /function execTool\(name, args, deps = \{\}\) \{\n\s*const sh = deps\.sh \|\| [^\n]*timeout: shTimeoutMs\(script, argv\)/.test(srcOf(s.f)) && /function shTimeoutMs[\s\S]{0,300}JUDGE_BUDGET_MS \+ JUDGE_DISPATCH_MS/.test(srcOf(s.f));
    if (s.f === "scripts/postmatch.mjs") return /const f = fits\(JUDGE_BUDGET_MS \+ CHILD_TIMEOUT_MS\);[\s\S]{0,300}const s = spawnMs\(f, CHILD_TIMEOUT_MS\);[\s\S]{0,300}"judge-due", "--trigger", "day\.close"\][^\n]*timeout: s\.ms/.test(srcOf(s.f));
    return false;
  };
  const bad = sites.filter((s) => !covered(s));
  const ok = sites.length > 0 && !bad.length && ["scripts/sitting.mjs", "scripts/dugout.mjs", "scripts/postmatch.mjs"].every((f) => sites.some((s) => s.f === f));
  clause("M3 CENSUS", ok, `${sites.length} judge-verb spawn site(s): ${sites.map((s) => `${s.f}:${s.line}`).join(", ")}${bad.length ? ` · NOT covered: ${bad.map((s) => `${s.f}:${s.line}`).join(", ")}` : " · each covered"}`);
}
// M4..M7, M9 — the round itself
const g = drive("gaffer");
{
  const e = g.eat || {};
  const ok = !g.threw && e.judge_calls === 0 && e.batches === 0 && e.reason === "judge-budget-spent-by-external-check" && /external check/i.test(e.say) && e.handed && e.handed.length === 1 && Number.isFinite(e.handed[0]) && e.handed[0] <= g.budget;
  clause("M4 F3-EAT", ok, g.threw ? `driver threw: ${g.threw}` : `a check taking ${g.budget} ms: ${e.judge_calls} judge call(s), ${e.batches} batch(es), reason ${e.reason} · the check was handed ${JSON.stringify(e.handed)}`);
}
{
  const t = g.third || {};
  const ok = !g.threw && t.ok && t.handed && t.handed[0] === g.budget && t.first_budget === g.budget - g.budget / 3;
  clause("M5 F3-CLIP", ok, `a check taking ${g.budget / 3} ms: handed ${JSON.stringify(t.handed)} · the first batch killed at ${t.first_budget} ms (owed ${g.budget - g.budget / 3})`);
}
{
  const k = g.kill1 || {}, k2 = g.kill2 || {};
  const ok = !g.threw && Number.isInteger(k.first_size) && k.first_size < k.killed_size && Number.isInteger(k2.s2) && k2.s2 < k2.s1;
  clause("M6 MJD2", ok, `10 captures killed at the budget beside a fast ok row ⇒ next size ${k.first_size}; that size killed too ⇒ ${k2.s2} (was ${k2.s1})`);
}
{
  const n = g.nofloor || {};
  clause("M7 NOFLOOR", !g.threw && Number.isInteger(n.a) && n.a === n.b, `ok-only size ${n.a} · with an auth refusal and an un-killed failure on the ledger ${n.b}`);
}
// M8 — the auth pattern's one home
{
  const b = drive("brain");
  const lits = [];
  for (const n of readdirSync(join(COPY, "scripts"))) if (/\.mjs$/.test(n)) {
    const src = readFileSync(join(COPY, "scripts", n), "utf8");
    const m = src.match(/=\s*\/not logged in\|please run \\\/login[^\n]*\/i;/g); if (m) lits.push(...m.map(() => n));
  }
  const ok = !b.threw && b.exported && b.same && b.matches.length === 3 && b.matches.every(Boolean) && lits.length === 1;
  clause("M8 MAUTH", ok, b.threw ? `driver threw: ${b.threw}` : `brain AUTH_FAIL_RE exported ${b.exported} · the judge's own object ${b.same} · matches [login, authenticate, OAuth] ${JSON.stringify(b.matches)} · auth-pattern literals in scripts/: ${lits.length} (${lits.join(", ")})`);
}
{
  const FIELDS = ["ok", "graded", "types", "settled", "dispatched", "refused", "missed", "judged_by", "judged_by_code_at", "fired_by", "diamonds", "key_doubts", "external", "register_line", "outstanding", "calls", "batches", "sizing", "stopped", "stopped_why", "red"];
  const missing = FIELDS.filter((k) => !(g.fields || []).includes(k));
  const ok = !g.threw && g.auth && g.auth.reason === "judge-auth-refused" && g.auth.cards === 1 && g.fields_ok && !missing.length;
  clause("M9 KEPT", ok, `OAuth refusal ⇒ ${g.auth && g.auth.reason}, ${g.auth && g.auth.cards} card · ok round fields: ${missing.length ? `MISSING ${missing.join(",")}` : `all ${FIELDS.length} kept`}`);
}
// BOUND — only the named files differ
if (BASE_ORG) {
  const walk = (root, rel = "", acc = new Map()) => {
    for (const n of readdirSync(join(root, rel))) {
      const r = rel ? `${rel}/${n}` : n;
      if (/^(node_modules|\.git|ci)$/.test(r) || r === ".claude/settings.json") continue;
      const st = statSync(join(root, r));
      if (st.isDirectory()) walk(root, r, acc);
      else acc.set(r, createHash("sha256").update(readFileSync(join(root, r))).digest("hex"));
    }
    return acc;
  };
  const a = walk(BASE_ORG), b = walk(ORG);
  const diff = [...new Set([...a.keys(), ...b.keys()])].filter((k) => a.get(k) !== b.get(k)).sort();
  const outside = diff.filter((k) => !NAMED.includes(k));
  clause("BOUND", !outside.length, `differs from --base-org in ${diff.length} file(s): ${diff.join(", ") || "none"}${outside.length ? ` · OUTSIDE the named files: ${outside.join(", ")}` : ""}`);
}
// LAST — no fake-claude spawn, no surviving node process naming the temp dir
{
  const spawned = existsSync(FAKE_LOG) ? readFileSync(FAKE_LOG, "utf8").split("\n").filter(Boolean).length : 0;
  let procs = [];
  try {
    const list = IS_WIN
      ? execFileSync("powershell", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process | ForEach-Object { \"$($_.ProcessId) $($_.CommandLine)\" }"], { encoding: "utf8", windowsHide: true })
      : execFileSync("ps", ["-eo", "pid=,args="], { encoding: "utf8" });
    const key = fwd(TMP).toLowerCase();
    procs = list.split(/\r?\n/).filter((l) => fwd(l).toLowerCase().includes(key) && /node/i.test(l) && !l.includes(String(process.pid) + " "));
  } catch (e) { procs = [`process list unreadable: ${String(e && e.message || e).slice(0, 80)}`]; }
  clause("LAST", spawned === 0 && procs.length === 0, `fake claude spawns logged: ${spawned} · node processes naming the temp dir: ${procs.length}`);
}
try { rmSync(TMP, { recursive: true, force: true }); } catch { }
const red = clauses.filter((c) => !c.ok).map((c) => c.name);
if (red.length) { console.log(`RED MJUD · ${red.join(" · ")}`); process.exit(1); }
console.log(`GREEN MJUD judge budget reaches every caller, the external check, the kill and the auth pattern · ${clauses.length} clause(s)`);
process.exit(0);
