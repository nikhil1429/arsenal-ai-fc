#!/usr/bin/env node
// ============================================================================
// ci/witness/mrehearse/witness_rehearse.mjs — UNIT mrehearse · B-rehearsal:night-replay (spec ci/mwit/MWIT_SPEC.md @ 88bf69d)
// ----------------------------------------------------------------------------
// TWO FACES, ONE READER.
//  1. THE CLAUSE (the receipt organ's witness):  node ci/witness/mrehearse/witness_rehearse.mjs --night <YYYY-MM-DD> [--org <dir>]
//     Reads <org>/dressing-room/state (default: this repository) — night_log.jsonl (sole writer scripts/night.mjs) and
//     rehearsal_log.jsonl (sole writer scripts/rehearse.mjs), READ ONLY. Exit law (spec §0):
//       0  a rehearsal row exists for night N, its `at` lies inside that night — from the night's own `armed` row to its
//          `closed` row (or now, while the night is open), read from the night factory's rows, never a typed hour — its
//          code_sha equals the `head` the night measured on its `rehearse` mark, and would_be_11 is a computed boolean that
//          agrees with the row's own eleven statuses
//       1  the row is outside the night, its code_sha is not the night's head, or would_be_11 disagrees with its clauses
//       2  UNREAD: no night N, no rehearsal row for N, no rehearse mark / head, or would_be_11 not computed (null)
//     Without --night it reads the latest armed night.
//  2. THE PLANTS (both ways):  node ci/witness/mrehearse/witness_rehearse.mjs plants [--org <dir>] [--base-org <dir>] [--only W1,W3]
//     Every plant is a temp tree under os.tmpdir(): <org>'s scripts/ + package.json in a FRESH git repo (core.autocrlf=false
//     at init) with TWO commits — HEAD~ carries a daily_green.mjs that exits at once, HEAD the real one — and its OWN
//     dressing-room/state planted by writeFileSync (nothing of his is copied, nothing printed). The night is armed and
//     begun through <org>'s own night.mjs CLI; the rehearsal is <org>'s own rehearse.mjs CLI. The build reads GREEN; the
//     base (no rehearse.mjs, no rehearse mark kind) reads RED on every W clause.
//     W1 night-replay  begun night + a recorded meter row → `rehearse.mjs run` exit 0, ONE row, code_sha = HEAD (not HEAD~:
//                      HEAD~'s meter cannot replay), the night's rehearse mark carries that head, the replay of the planted
//                      11/11 day reads would_be_11 true, and the clause reads 0
//     W2 outside       a night whose armed row lies AFTER now: before the run the clause reads 2 (no row); after it, 1
//     W3 code-sha      after W1, a new commit and a later rehearse mark at it → the clause reads 1 (code_sha ≠ the night's head)
//     W4 carry (F4 A)  clauses 9-11 come from the recorded meter row, not the snapshot's machine: a recorded 10 RED → row 10
//                      RED, would_be_11 false, clause 0; no recorded row → 9-11 UNREAD, would_be_11 null, clause 2
//     W5 refusal       an armed night no runner began → `rehearse.mjs run` exit 1, no rehearsal log born, night log unchanged
//     W6 owners        rehearse.mjs's header names it SOLE WRITER of dressing-room/state/rehearsal_log.jsonl; across
//                      scripts/*.mjs no other file names that log on a code line; its code calls no model, fetches nothing, moves no ref;
//                      the row's keys are the named ones and every clause carries {n,status} only (no reason text)
//     BOUND            tracked text outside dressing-room/state differs between --org and --base-org ONLY in the unit's
//                      files (CRLF folded to LF; listed by git ls-files when the dir is a repo, else walked); with no
//                      --base-org (the suite member's bare `plants`) the base is ci/mrehearse/BASE read through git in --org
//     LAST             no node process naming this run's temp root survives; <org>'s own state dir is byte-identical
// PORT CLASS (row 1053): no port is bound, no service named, nothing POSTed, nothing restarted; no model is called. Every
//   child is a finite CLI (git, node) with no service to wait on — no wait on a service exists to bound, no timeout typed.
// Windows: no POSIX-only shell; every line split on \r?\n; processes listed through PowerShell on Windows, `ps` elsewhere.
// OUTPUT: one `CLAUSE <id> GREEN|RED · <why>` line per clause, then `PLANTS mrehearse · k of n plant(s) as expected` (the
//   suite member's line, unit mmeter), then the LAST LINE: GREEN MREHEARSE night-replay · <n> clause(s) (exit 0) · RED MREHEARSE · <clauses> (exit 1)
// ============================================================================
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync, cpSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname, resolve, relative, sep } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, "..", "..", "..");
const SHA = /^[0-9a-f]{40}$/;
const DAYRE = /^\d{4}-\d{2}-\d{2}$/;
export const UNIT_FILES = Object.freeze(["scripts/rehearse.mjs", "scripts/night.mjs", "ci/witness/mrehearse/", "ci/mrehearse/"]);
export const ROW_KEYS = Object.freeze(["at", "night", "day", "code_sha", "greens", "clauses", "would_be_11", "carried", "replay"]);

const rowsOf = (p) => { try { return readFileSync(p, "utf8").split(/\r?\n/).filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean); } catch { return null; } };

/** THE READER. PURE over the two logs' rows. → { code, why } */
export function judge({ nightRows, rehearsalRows, night = null, now = new Date() }) {
  if (!Array.isArray(nightRows)) return { code: 2, why: "night log unreadable or absent" };
  const N = night || (nightRows.filter((r) => r.kind === "armed").at(-1) || {}).day;
  if (!DAYRE.test(String(N || ""))) return { code: 2, why: "no armed night" };
  const mine = nightRows.filter((r) => r.day === N);
  const armed = mine.find((r) => r.kind === "armed");
  if (!armed || !Number.isFinite(Date.parse(armed.ts))) return { code: 2, why: `no armed row for night ${N}` };
  const closed = mine.find((r) => r.kind === "closed");
  const lo = Date.parse(armed.ts), hi = closed && Number.isFinite(Date.parse(closed.ts)) ? Date.parse(closed.ts) : now.getTime();
  const rr = (Array.isArray(rehearsalRows) ? rehearsalRows : []).filter((r) => r && r.night === N).at(-1);
  if (!rr) return { code: 2, why: `no rehearsal row for night ${N}` };
  const at = Date.parse(rr.at);
  if (!Number.isFinite(at)) return { code: 2, why: "the row carries no readable `at`" };
  if (!(at >= lo && at <= hi)) return { code: 1, why: `row at ${rr.at} lies outside night ${N} (${armed.ts} → ${closed ? closed.ts : "open"})` };
  const mark = mine.filter((r) => r.kind === "mark" && r.mark === "rehearse").at(-1);
  if (!mark || !SHA.test(String(mark.head || ""))) return { code: 2, why: `night ${N} carries no rehearse mark with a head` };
  if (rr.code_sha !== mark.head) return { code: 1, why: `code_sha ${String(rr.code_sha).slice(0, 7)} ≠ the night's head ${mark.head.slice(0, 7)}` };
  if (typeof rr.would_be_11 !== "boolean") return { code: 2, why: "would_be_11 not computed (unread)" };
  const all = Array.isArray(rr.clauses) && rr.clauses.length === 11 && rr.clauses.every((c) => c && c.status === "GREEN");
  if (rr.would_be_11 !== all) return { code: 1, why: `would_be_11 ${rr.would_be_11} disagrees with its clauses` };
  return { code: 0, why: `night ${N} rehearsed at ${String(rr.code_sha).slice(0, 7)} · would be 11/11: ${rr.would_be_11 ? "yes" : "no"}` };
}
const clauseOn = (org, night, now) => {
  const st = join(org, "dressing-room", "state");
  return judge({ nightRows: rowsOf(join(st, "night_log.jsonl")), rehearsalRows: rowsOf(join(st, "rehearsal_log.jsonl")) || [], night, now });
};

// ── PLANTS ───────────────────────────────────────────────────────────────────
const IST = 5.5 * 3600000;
const istDay = (t = Date.now()) => new Date(t + IST).toISOString().slice(0, 10);
const jl = (rows) => rows.map((r) => JSON.stringify(r)).join("\n") + "\n";
const cleanEnv = () => { const e = { ...process.env, ARSENAL_ORGAN: "1" }; for (const k of Object.keys(e)) if (/^ARSENAL_.*STATE_DIR$|^ARSENAL_NIGHT_FREEMEM_MB$|^GIT_/.test(k)) delete e[k]; return e; };
const sh = (cwd, cmd, args, input) => spawnSync(cmd, args, { cwd, encoding: "utf8", windowsHide: true, env: cleanEnv(), input, maxBuffer: 1 << 26 });
const node = (cwd, script, args) => sh(cwd, process.execPath, [join(cwd, "scripts", script), ...args]);
const gitIn = (cwd, args) => sh(cwd, "git", ["-c", "core.autocrlf=false", "-c", "user.name=plant", "-c", "user.email=plant@invalid", "-c", "commit.gpgsign=false", ...args]);

/** the recorded meter row for day D (the shape daily_green.mjs appends), clauses 9-11 as given */
const meterRow = (D, s9, s10, s11) => ({ at: new Date(Date.now() - 120000).toISOString(), date: D, study: true, study_why: "planted", green: false, greens: 0, reds: 0,
  clauses: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((n) => ({ n, key: `c${n}`, status: n === 9 ? s9 : n === 10 ? s10 : n === 11 ? s11 : "RED", why: "planted" })) });

function plantTree(TMP, org, name, { meter = "green", night = "begun" } = {}) {
  const root = join(TMP, name);
  mkdirSync(root, { recursive: true });
  cpSync(join(org, "scripts"), join(root, "scripts"), { recursive: true });
  cpSync(join(org, "package.json"), join(root, "package.json"));
  const real = readFileSync(join(root, "scripts", "daily_green.mjs"));
  let g = gitIn(root, ["init", "-q"]);
  if (g.status !== 0) throw new Error(`git init: ${g.stderr}`);
  gitIn(root, ["config", "core.autocrlf", "false"]);
  writeFileSync(join(root, "scripts", "daily_green.mjs"), "process.exit(7);\n");          // HEAD~: a meter that cannot replay
  gitIn(root, ["add", "scripts", "package.json"]); g = gitIn(root, ["commit", "-q", "-m", "old"]);
  if (g.status !== 0) throw new Error(`git commit: ${g.stderr}`);
  writeFileSync(join(root, "scripts", "daily_green.mjs"), real);                           // HEAD: the real meter
  gitIn(root, ["add", "scripts"]); gitIn(root, ["commit", "-q", "-m", "new"]);
  // the recorded day: a planted study day whose clauses 1-8 read GREEN on the real meter (the planter's method, extended)
  const st = join(root, "dressing-room", "state");
  const now = Date.now(), D = istDay(now), at = (m) => new Date(now - m * 60000).toISOString();
  const reg = JSON.parse(readFileSync(join(org, "dressing-room", "state", "registry.json"), "utf8"));   // tracked; read, never printed
  (reg.tables.emit_contract = reg.tables.emit_contract || []).push({ subject: "note_blocks", writes_to: "note_blocks.jsonl" });
  const files = {
    "sitting.json": JSON.stringify({ id: "s1", task: "t", route: "FORGE", opened_at: at(30), closed_at: at(20) }),
    "sitting_reviews.jsonl": "",
    "reps_log.jsonl": jl([{ ts: at(25), concept: "planted", correct: true }]),
    "forge_session.json": JSON.stringify({ concept: "planted", resume_pointer: { text: "q", step: 3, at: at(25) } }),
    "registry.json": JSON.stringify(reg),
    "note_blocks.jsonl": jl([{ ts: at(25), axis: "a" }]),
    "compiled_notes.jsonl": jl([{ ts: at(25), day: D, axis: "a" }]),
    "gaffer_grade_queue.jsonl": jl([{ v: 2, kind: "settled", of: "x", ts: at(25), day: D }]),
    "captains_call.json": JSON.stringify({ cards: [{ id: "c1", dealt: [at(24)] }] }),
    "rejirah_log.jsonl": "",
    "readiness.json": JSON.stringify({ ok: true, day: D }),
    [`post_match/${D}.md`]: "RESULT: HIT\nKAL-LINE → planted\n",
  };
  if (meter === "green") files["daily_green.jsonl"] = jl([meterRow(D, "GREEN", "GREEN", "GREEN")]);
  if (meter === "red10") files["daily_green.jsonl"] = jl([meterRow(D, "GREEN", "RED", "GREEN")]);
  for (const [k, v] of Object.entries(files)) { mkdirSync(dirname(join(st, k)), { recursive: true }); writeFileSync(join(st, k), v); }
  mkdirSync(join(st, "capsules"), { recursive: true });
  if (night === "future") {
    writeFileSync(join(st, "night_log.jsonl"), jl([{ ts: new Date(now + 3 * 3600000).toISOString(), day: D, kind: "armed", by: "day.end" },
      { ts: new Date(now + 3 * 3600000 + 1000).toISOString(), day: D, kind: "begun", runner: "runner" }]));
  } else {
    node(root, "night.mjs", ["arm", "--day", D, "--by", "day.end"]);
    if (night === "begun") node(root, "night.mjs", ["begin", "--runner", "runner"]);
  }
  return { root, st, D };
}
const head = (root) => String(gitIn(root, ["rev-parse", "HEAD"]).stdout || "").trim();
const lastRow = (st) => (rowsOf(join(st, "rehearsal_log.jsonl")) || []).at(-1) || null;

const GROUPS = {
  W1(TMP, org) {
    const t = plantTree(TMP, org, "w1");
    const r = node(t.root, "rehearse.mjs", ["run"]);
    const rows = rowsOf(join(t.st, "rehearsal_log.jsonl")) || [];
    const H = head(t.root);
    const mark = (rowsOf(join(t.st, "night_log.jsonl")) || []).filter((x) => x.mark === "rehearse");
    const v = clauseOn(t.root, t.D);
    const ok = r.status === 0 && rows.length === 1 && SHA.test(H) && rows[0].code_sha === H && mark.length === 1 && mark[0].head === H
      && rows[0].replay === "ok" && rows[0].would_be_11 === true && v.code === 0;
    return { ok, detail: `exit ${r.status} · rows ${rows.length} · sha ${rows[0] && String(rows[0].code_sha).slice(0, 7)} vs HEAD ${H.slice(0, 7)} · marks ${mark.length} · replay ${rows[0] && rows[0].replay} · would_be_11 ${rows[0] && rows[0].would_be_11} · clause ${v.code} (${v.why}) · ${String(r.stdout || r.stderr).trim().split(/\r?\n/).pop()}` };
  },
  W2(TMP, org) {
    const t = plantTree(TMP, org, "w2", { night: "future" });
    const before = clauseOn(t.root, t.D);
    const r = node(t.root, "rehearse.mjs", ["run"]);
    const after = clauseOn(t.root, t.D);
    return { ok: before.code === 2 && r.status === 0 && after.code === 1, detail: `before ${before.code} (${before.why}) · run exit ${r.status} · after ${after.code} (${after.why})` };
  },
  W3(TMP, org) {
    const t = plantTree(TMP, org, "w3");
    const r = node(t.root, "rehearse.mjs", ["run"]);
    const first = clauseOn(t.root, t.D);
    writeFileSync(join(t.root, "scripts", "zz_later.mjs"), "export {};\n");
    gitIn(t.root, ["add", "scripts"]); gitIn(t.root, ["commit", "-q", "-m", "later"]);
    const m = node(t.root, "night.mjs", ["mark", "--kind", "rehearse", "--unit", "rehearse"]);
    const after = clauseOn(t.root, t.D);
    return { ok: r.status === 0 && first.code === 0 && m.status === 0 && after.code === 1, detail: `run ${r.status} · first ${first.code} · mark ${m.status} · after ${after.code} (${after.why})` };
  },
  W4(TMP, org) {
    const a = plantTree(TMP, org, "w4a", { meter: "red10" });
    const ra = node(a.root, "rehearse.mjs", ["run"]);
    const rowA = lastRow(a.st), va = clauseOn(a.root, a.D);
    const st = (row, n) => row && Array.isArray(row.clauses) ? (row.clauses.find((c) => c.n === n) || {}).status : null;
    const okA = ra.status === 0 && st(rowA, 9) === "GREEN" && st(rowA, 10) === "RED" && st(rowA, 11) === "GREEN" && rowA.would_be_11 === false && va.code === 0;
    const b = plantTree(TMP, org, "w4b", { meter: "none" });
    const rb = node(b.root, "rehearse.mjs", ["run"]);
    const rowB = lastRow(b.st), vb = clauseOn(b.root, b.D);
    const okB = rb.status === 0 && [9, 10, 11].every((n) => st(rowB, n) === "UNREAD") && rowB.would_be_11 === null && vb.code === 2;
    return { ok: okA && okB, detail: `recorded 10 RED: run ${ra.status} · 9/10/11 ${st(rowA, 9)}/${st(rowA, 10)}/${st(rowA, 11)} · would ${rowA && rowA.would_be_11} · clause ${va.code} | no recorded row: run ${rb.status} · 9/10/11 ${st(rowB, 9)}/${st(rowB, 10)}/${st(rowB, 11)} · would ${rowB && rowB.would_be_11} · clause ${vb.code}` };
  },
  W5(TMP, org) {
    const t = plantTree(TMP, org, "w5", { night: "armed" });
    const nl = readFileSync(join(t.st, "night_log.jsonl"), "utf8");
    const r = node(t.root, "rehearse.mjs", ["run"]);
    const born = existsSync(join(t.st, "rehearsal_log.jsonl"));
    const same = readFileSync(join(t.st, "night_log.jsonl"), "utf8") === nl;
    return { ok: r.status === 1 && !born && same && existsSync(join(t.root, "scripts", "rehearse.mjs")), detail: `exit ${r.status} · log born ${born} · night log unchanged ${same}` };
  },
  W6(TMP, org) {
    const p = join(org, "scripts", "rehearse.mjs");
    if (!existsSync(p)) return { ok: false, detail: "scripts/rehearse.mjs absent" };
    const src = readFileSync(p, "utf8").replace(/\r\n/g, "\n");
    const header = src.split("\n").filter((l) => l.startsWith("//")).slice(0, 8);
    const sole = header.some((l) => /^\/\/\s+SOLE WRITER of dressing-room\/state\/rehearsal_log\.jsonl\b/.test(l));
    const others = readdirSync(join(org, "scripts")).filter((f) => f.endsWith(".mjs") && f !== "rehearse.mjs")
      .filter((f) => readFileSync(join(org, "scripts", f), "utf8").split(/\r?\n/).some((l) => !/^\s*\/\//.test(l) && l.includes("rehearsal_log")));   // code lines, not comments
    const code = src.split("\n").filter((l) => !/^\s*\/\//.test(l)).join("\n");
    const clean = !/claude|models\.mjs|fetch\(|["'](push|merge|reset|checkout|update-ref|branch)["']|ANTHROPIC|GEMINI/i.test(code);
    const t = plantTree(TMP, org, "w6");
    node(t.root, "rehearse.mjs", ["run"]);
    const row = lastRow(t.st);
    const keys = !!row && JSON.stringify(Object.keys(row)) === JSON.stringify([...ROW_KEYS]) && Array.isArray(row.clauses) && row.clauses.length === 11
      && row.clauses.every((c) => JSON.stringify(Object.keys(c)) === '["n","status"]');
    return { ok: sole && !others.length && clean && keys, detail: `sole ${sole} · others ${others.join(",") || "none"} · clean ${clean} · row keys ${row ? Object.keys(row).join(",") : "no row"}` };
  },
};

// ── BOUND · LAST ─────────────────────────────────────────────────────────────
function tracked(dir) {
  const g = spawnSync("git", ["-C", dir, "ls-files", "-z"], { encoding: "utf8", windowsHide: true, maxBuffer: 1 << 26 });
  if (g.status === 0 && g.stdout) return g.stdout.split("\0").filter(Boolean);
  const out = [];
  const walk = (d) => { for (const e of readdirSync(d)) { if (e === ".git" || e === "node_modules") continue; const p = join(d, e); const s = statSync(p); if (s.isDirectory()) walk(p); else out.push(relative(dir, p).split(sep).join("/")); } };
  walk(dir); return out;
}
const hashText = (p) => { try { return createHash("sha256").update(readFileSync(p, "utf8").replace(/\r\n/g, "\n")).digest("hex"); } catch { return null; } };
/** BOUND with no --base-org (the suite member's call, `plants` alone): the base is ci/mrehearse/BASE, read through git in
 *  <org> — tracked changes since it plus untracked files. Unresolvable (no repo, no such commit) → RED, never green. */
function boundByGit(org) {
  let sha = ""; try { sha = readFileSync(join(org, "ci", "mrehearse", "BASE"), "utf8").trim(); } catch { /* absent: named below */ }
  if (!SHA.test(sha)) return { ok: false, detail: "--base-org absent and ci/mrehearse/BASE carries no sha" };
  const g = (args) => spawnSync("git", ["-C", org, ...args], { encoding: "utf8", windowsHide: true, maxBuffer: 1 << 26 });
  const d = g(["diff", "--name-only", "-z", sha, "--", "."]), u = g(["ls-files", "--others", "--exclude-standard", "-z"]);
  if (d.status !== 0 || u.status !== 0) return { ok: false, detail: `--base-org absent and BASE ${sha.slice(0, 7)} is not readable here` };
  const differ = [...new Set([...d.stdout.split("\0"), ...u.stdout.split("\0")])].filter(Boolean).filter((f) => !f.startsWith("dressing-room/state/"));
  const outside = differ.filter((f) => !UNIT_FILES.some((x) => (x.endsWith("/") ? f.startsWith(x) : f === x)));
  return { ok: outside.length === 0, detail: `base ${sha.slice(0, 7)} (git) · ${differ.length} file(s) differ · outside the unit: ${outside.slice(0, 8).join(", ") || "none"}` };
}
function bound(org, base) {
  if (!base) return boundByGit(org);
  if (!existsSync(base)) return { ok: false, detail: "--base-org absent" };
  const keep = (f) => !f.startsWith("dressing-room/state/");
  const a = new Set(tracked(org).filter(keep)), b = new Set(tracked(base).filter(keep));
  const differ = [...new Set([...a, ...b])].filter((f) => !a.has(f) || !b.has(f) || hashText(join(org, f)) !== hashText(join(base, f)));
  const outside = differ.filter((f) => !UNIT_FILES.some((u) => (u.endsWith("/") ? f.startsWith(u) : f === u)));
  return { ok: outside.length === 0, detail: `${differ.length} file(s) differ · outside the unit: ${outside.slice(0, 8).join(", ") || "none"}` };
}
function procsNaming(root) {
  const r = process.platform === "win32"
    ? spawnSync("powershell", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process | ForEach-Object { $_.CommandLine }"], { encoding: "utf8", windowsHide: true, maxBuffer: 1 << 26 })
    : spawnSync("ps", ["-eo", "args"], { encoding: "utf8", maxBuffer: 1 << 26 });
  return String(r.stdout || "").split(/\r?\n/).filter((l) => l.includes(root) && /node/i.test(l));
}
const stateHash = (org) => {
  const st = join(org, "dressing-room", "state");
  if (!existsSync(st)) return "absent";
  const h = createHash("sha256");
  const walk = (d) => { for (const e of readdirSync(d).sort()) { const p = join(d, e); const s = statSync(p); if (s.isDirectory()) walk(p); else h.update(relative(st, p)).update(readFileSync(p)); } };
  walk(st); return h.digest("hex");
};

function plants({ org, base, only }) {
  const TMP = mkdtempSync(join(tmpdir(), "mrehearse-w-"));
  const before = stateHash(org);
  const res = [];
  try {
    for (const [id, fn] of Object.entries(GROUPS)) {
      if (only && !only.includes(id)) continue;
      let r; try { r = fn(TMP, org); } catch (e) { r = { ok: false, detail: `threw: ${String(e && e.message).slice(0, 160)}` }; }
      res.push({ id, ...r });
    }
    res.push({ id: "BOUND", ...bound(org, base) });
  } finally { rmSync(TMP, { recursive: true, force: true }); }
  const left = procsNaming(TMP);
  const after = stateHash(org);
  res.push({ id: "LAST", ok: left.length === 0 && before === after, detail: `${left.length} process(es) name the temp root · org state ${before === after ? "byte-identical" : "CHANGED"}` });
  for (const r of res) console.log(`CLAUSE ${r.id} ${r.ok ? "GREEN" : "RED"} · ${r.detail}`);
  const red = res.filter((r) => !r.ok).map((r) => r.id);
  console.log(`PLANTS mrehearse · ${res.length - red.length} of ${res.length} plant(s) as expected`);   // the suite member's line (unit mmeter)
  console.log(red.length ? `RED MREHEARSE · ${red.join(",")}` : `GREEN MREHEARSE night-replay · ${res.length} clause(s)`);
  return red.length ? 1 : 0;
}

function main() {
  const argv = process.argv.slice(2);
  const opt = (k) => { const i = argv.indexOf(k); return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : null; };
  if (argv[0] === "plants" || argv.includes("--plants")) {
    const org = resolve(opt("--org") || REPO), base = opt("--base-org") ? resolve(opt("--base-org")) : null;
    const only = opt("--only") ? opt("--only").split(",") : null;
    process.exitCode = plants({ org, base, only });
    return;
  }
  const v = clauseOn(resolve(opt("--org") || REPO), opt("--night"), new Date());
  console.log(`${v.code === 0 ? "GREEN" : v.code === 1 ? "RED" : "UNREAD"} B-rehearsal:night-replay · ${v.why}`);
  process.exitCode = v.code;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
