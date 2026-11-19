#!/usr/bin/env node
// ============================================================================
// ci/mf4/witness_mf4.mjs — THE MF4 WITNESS (unit mf4, the F4 canary · forks rows 960 (3) / 1009 (2))
// ----------------------------------------------------------------------------
// CONTRACT (this header IS the contract):
//   node ci/mf4/witness_mf4.mjs --org <dir> [--base-org <dir>]
//   <dir> is an organism tree (an LF git-archive export is the intended input). Nothing in <dir> is written.
//   Every plant is a COPY under os.tmpdir(): the org's scripts/, package.json, .claude/skills/learn/SKILL.md and
//   its tracked dressing-room/state/registry.json (the registry contract the import graph reads — copied, never
//   printed), with a FRESH state dir holding only the planted files, a FRESH home (HOME and USERPROFILE re-pointed,
//   ARSENAL_ARCHIVE unset, so the archive is read at the production default <home>/CyborgArchive), the archive
//   written by the COPY's OWN archivist (initArchive + runArchive), each transcript at the COPY's own
//   study_scope transcriptPathFor, and a FIXED CLOCK (ci/mf4/clock.mjs preloaded with --import, MF4_CLOCK).
//   A fake `claude` and `claude.cmd` sit FIRST on PATH and log any spawn; no live model is ever called.
//   Windows-safe: a node_modules link is a junction, path keys use forward slashes, no /proc, the process scan is
//   PowerShell's Win32_Process there and `ps -eo args` elsewhere.
// CLAUSES (each GREEN or RED with its reason):
//   W1 CANARY    no sitting registered + a learn session on disk (archive-named, Desktop, learn opener):
//                clauses 1-5 RED "NO SITTING: learn session <id8>", the row not green          [the build feeds it]
//   W2 SITTING   a sitting on the day + the same learn session: the row equals the same day with no archive
//   W3 NEITHER   no sitting + the archive naming only non-learn sessions (CLI opener, Desktop architect):
//                clauses 1-5 N-A "not a study day", study:false, equal to the same day with no archive
//   W4 SELFTEST  the org's daily_green selftest: 0 failed, count >= 75 (68 kept + 7), every MF4 clause named
//                                                                                                  [the build feeds it]
//   W5 STREAK    the org's own streakFrom over [a green study day, the W1 canary row from the copy's ledger] = 0
//                                                                                                  [the build feeds it]
//   W6 BOUND     --org differs from --base-org ONLY in scripts/daily_green.mjs (plus this unit's ci/mf4/ and the
//                branch's seat key .claude/settings.json, BASE's child commit); no --base-org = RED "not run"
//   W7 LAST      no node process naming the witness's temp dir survives, and the fake claude logged no spawn
// LAST LINE: GREEN MF4 <what> · <n> clause(s) (exit 0)  |  RED MF4 · <clauses> (exit 1)
// ============================================================================
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, symlinkSync, writeFileSync, chmodSync } from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { delimiter, dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const CLOCK = pathToFileURL(join(HERE, "clock.mjs")).href;
const NAMED = ["scripts/daily_green.mjs"];
const ALLOWED_PREFIX = ["ci/mf4/"];
const ALLOWED_EXACT = [".claude/settings.json"];
const DAY = "2026-09-24";
const NOW = "2026-09-24T16:00:00.000Z";                                   // 21:30 IST
const at = (hhmm) => new Date(Date.parse(`${DAY}T${hhmm}:00+05:30`)).toISOString();
const LS = "1a4f0e00-0000-4000-8000-00000000f4aa", CS = "2c4f0e00-0000-4000-8000-00000000f4bb", DS = "3d4f0e00-0000-4000-8000-00000000f4cc";

const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const ORG = opt("--org") ? resolve(opt("--org")) : null;
const BASE = opt("--base-org") ? resolve(opt("--base-org")) : null;
if (!ORG || !existsSync(join(ORG, "scripts", "daily_green.mjs"))) { console.log("RED MF4 · usage: --org <organism dir> [--base-org <dir>] (no scripts/daily_green.mjs under --org)"); process.exit(1); }

const T = mkdtempSync(join(tmpdir(), "mf4-witness-"));
const FAKEBIN = join(T, "fakebin"), CLAUDE_LOG = join(T, "claude_spawns.log");
mkdirSync(FAKEBIN, { recursive: true });
writeFileSync(join(FAKEBIN, "claude"), `#!/bin/sh\necho "$@" >> "${CLAUDE_LOG}"\nexit 1\n`);
try { chmodSync(join(FAKEBIN, "claude"), 0o755); } catch { /* windows */ }
writeFileSync(join(FAKEBIN, "claude.cmd"), `@echo off\r\necho %* >> "${CLAUDE_LOG}"\r\nexit /b 1\r\n`);

const results = [];
const clause = (id, ok, why) => { results.push({ id, ok: !!ok, why }); console.log(`  ${ok ? "GREEN" : "RED  "} ${id} · ${why}`); };
const childEnv = (home) => {
  const env = { ...process.env, HOME: home, USERPROFILE: home, MF4_CLOCK: NOW, PATH: `${FAKEBIN}${delimiter}${process.env.PATH || process.env.Path || ""}` };
  delete env.Path; delete env.ARSENAL_ARCHIVE; delete env.ARSENAL_REGISTRY; delete env.ANTHROPIC_API_KEY;
  return env;
};

// ── ONE PLANT: its own copy, its own state dir, its own home ──
let seq = 0;
async function plant({ sitting, archive }) {
  const P = join(T, `plant${++seq}`), root = join(P, "org"), home = join(P, "home"), st = join(root, "dressing-room", "state");
  cpSync(join(ORG, "scripts"), join(root, "scripts"), { recursive: true });
  for (const f of ["package.json", ".claude/skills/learn/SKILL.md", "dressing-room/state/registry.json"]) {
    if (existsSync(join(ORG, f))) { mkdirSync(dirname(join(root, f)), { recursive: true }); cpSync(join(ORG, f), join(root, f)); }
  }
  if (existsSync(join(ORG, "node_modules"))) symlinkSync(join(ORG, "node_modules"), join(root, "node_modules"), "junction");
  mkdirSync(st, { recursive: true }); mkdirSync(home, { recursive: true });
  writeFileSync(join(st, "sitting.json"), JSON.stringify(sitting
    ? { id: "s1", task: "t", route: "FORGE", opened_at: at("09:00"), closed_at: at("11:00") }
    : { id: "s0", opened_at: "2026-09-20T04:30:00.000Z", closed_at: "2026-09-20T05:30:00.000Z" }));
  const env = childEnv(home);
  if (archive) {
    // the COPY's own archivist writes the bag; the COPY's own study_scope says where each transcript lives
    const repo = join(P, "afferent-repo");
    mkdirSync(join(repo, "dressing-room", "state"), { recursive: true });
    const rows = archive.map((id, i) => ({ event_id: `mf4w${i}`, modality: "code", source: "claude-code", surface: "claude-code", session_id: id, text: "haan", tier: "private", moment: {}, v: 3, ts: at(`10:0${i}`) }));
    writeFileSync(join(repo, "dressing-room", "state", "afferent.jsonl"), rows.map((r) => JSON.stringify(r)).join("\n") + "\n");
    const helper = join(P, "plant_helper.mjs");
    writeFileSync(helper, [
      `import { initArchive, runArchive } from ${JSON.stringify(pathToFileURL(join(root, "scripts", "archivist.mjs")).href)};`,
      `import { transcriptPathFor, learnTriggers } from ${JSON.stringify(pathToFileURL(join(root, "scripts", "study_scope.mjs")).href)};`,
      `import { writeFileSync, mkdirSync } from "node:fs"; import { dirname, join } from "node:path"; import { homedir } from "node:os";`,
      `const arc = join(homedir(), "CyborgArchive"), repo = ${JSON.stringify(repo)};`,
      `const i = initArchive({ root: arc, repo, quiet: true, warn: () => {} }); const r = runArchive({ root: arc, repo, quiet: true, warn: () => {} });`,
      `const opener = learnTriggers()[0];`,
      `const tx = (id, entrypoint, first) => { const p = transcriptPathFor(id); mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, [{ type: "system", subtype: "init", entrypoint, session_id: id }, { type: "user", entrypoint, session_id: id, message: { role: "user", content: first } }].map((x) => JSON.stringify(x)).join("\\n") + "\\n"); };`,
      `tx(${JSON.stringify(LS)}, "claude-desktop", opener); tx(${JSON.stringify(CS)}, "cli", opener); tx(${JSON.stringify(DS)}, "claude-desktop", "architect");`,
      `console.log(JSON.stringify({ init: !!(i && i.ok !== false), run: !!(r && r.ok !== false), opener: !!opener }));`,
    ].join("\n"));
    const h = spawnSync(process.execPath, ["--import", CLOCK, helper], { cwd: P, env, encoding: "utf8", windowsHide: true });
    const last = String(h.stdout || "").trim().split(/\r?\n/).pop();
    let j = null; try { j = JSON.parse(last); } catch { /* reported below */ }
    if (h.status !== 0 || !j || !j.init || !j.run || !j.opener) return { ok: false, why: `plant failed (exit ${h.status}: ${String(h.stderr || last || "").slice(0, 160)})` };
  }
  const r = spawnSync(process.execPath, ["--import", CLOCK, join(root, "scripts", "daily_green.mjs"), "--json", "--date", DAY], { cwd: root, env, encoding: "utf8", windowsHide: true });
  let out = null; try { out = JSON.parse(String(r.stdout || "")); } catch { /* reported below */ }
  if (!out || !Array.isArray(out.clauses)) return { ok: false, why: `daily_green --json gave no row (exit ${r.status}: ${String(r.stderr || r.stdout || "").slice(0, 160)})` };
  const ledger = join(st, "daily_green.jsonl");
  const rows = existsSync(ledger) ? readFileSync(ledger, "utf8").split(/\r?\n/).filter(Boolean).map((l) => JSON.parse(l)) : [];
  return { ok: true, root, row: out, rows };
}
const first5 = (row) => row.clauses.slice(0, 5);
const shape = (row) => JSON.stringify({ s: row.study, w: row.study_why, g: row.green, c: row.clauses });
const brief = (row) => first5(row).map((c) => `${c.n}:${c.status}${c.status === "N-A" ? "" : `(${String(c.why).slice(0, 40)})`}`).join(" ");

// ── W1 · W5 — the canary, and the streak it breaks ──
const canary = await plant({ sitting: false, archive: [LS, CS, DS] });
const want = `NO SITTING: learn session ${LS.slice(0, 8)}`;
clause("W1 CANARY", canary.ok && first5(canary.row).every((c) => c.status === "RED" && c.why === want) && canary.row.green === false,
  canary.ok ? `no sitting + learn session → ${brief(canary.row)}` : canary.why);
if (canary.ok) {
  let streak = null;
  try {
    const { streakFrom } = await import(pathToFileURL(join(canary.root, "scripts", "daily_green.mjs")).href);
    const row = canary.rows.filter((r) => r.date === DAY).pop();
    streak = row ? streakFrom([{ date: "2026-09-23", study: true, green: true }, row], DAY) : null;
  } catch (e) { streak = `threw ${String(e && e.message).slice(0, 80)}`; }
  clause("W5 STREAK", streak === 0, `streakFrom([green study 09-23, the canary row as written to the copy's ledger]) = ${streak} (want 0: the canary day breaks it)`);
} else clause("W5 STREAK", false, `no canary row (${canary.why})`);

// ── W2 — a sitting day reads as today ──
const sitWith = await plant({ sitting: true, archive: [LS, CS, DS] });
const sitWithout = await plant({ sitting: true, archive: null });
clause("W2 SITTING", sitWith.ok && sitWithout.ok && shape(sitWith.row) === shape(sitWithout.row) && sitWith.row.study === true && !first5(sitWith.row).some((c) => /NO SITTING/.test(c.why)),
  sitWith.ok && sitWithout.ok ? `sitting + learn session ${brief(sitWith.row)} · equals no-archive: ${shape(sitWith.row) === shape(sitWithout.row)}` : (sitWith.why || sitWithout.why));

// ── W3 — neither reads as today ──
const neitherNamed = await plant({ sitting: false, archive: [CS, DS] });
const neitherBare = await plant({ sitting: false, archive: null });
clause("W3 NEITHER", neitherNamed.ok && neitherBare.ok && shape(neitherNamed.row) === shape(neitherBare.row) && neitherBare.row.study === false && first5(neitherNamed.row).every((c) => c.status === "N-A" && c.why === "not a study day"),
  neitherNamed.ok && neitherBare.ok ? `non-learn sessions only → ${brief(neitherNamed.row)} · study ${neitherNamed.row.study} · equals no-archive: ${shape(neitherNamed.row) === shape(neitherBare.row)}` : (neitherNamed.why || neitherBare.why));

// ── W4 — the org's own selftest, run on a copy ──
{
  const P = join(T, "selftest"), root = join(P, "org"), home = join(P, "home");
  cpSync(join(ORG, "scripts"), join(root, "scripts"), { recursive: true });
  for (const f of ["package.json", ".claude/skills/learn/SKILL.md", "dressing-room/state/registry.json"]) if (existsSync(join(ORG, f))) { mkdirSync(dirname(join(root, f)), { recursive: true }); cpSync(join(ORG, f), join(root, f)); }
  if (existsSync(join(ORG, "node_modules"))) symlinkSync(join(ORG, "node_modules"), join(root, "node_modules"), "junction");
  mkdirSync(home, { recursive: true });
  const r = spawnSync(process.execPath, [join(root, "scripts", "daily_green.mjs"), "selftest"], { cwd: root, env: childEnv(home), encoding: "utf8", windowsHide: true });
  const out = String(r.stdout || "");
  const m = /daily_green selftest: (\d+) passed, (\d+) failed/.exec(out);
  const names = ["MF4 CANARY — a day", "MF4 CANARY — ONLY", "MF4 SITTING DAY", "MF4 NEITHER", "MF4 STREAK", "MF4 FAIL CLOSED", "MF4 PRIVACY"];
  const missing = names.filter((n) => !out.split(/\r?\n/).some((l) => l.startsWith(`  ok   ${n}`)));
  clause("W4 SELFTEST", r.status === 0 && m && +m[2] === 0 && +m[1] >= 75 && !missing.length,
    `${m ? `${m[1]} passed, ${m[2]} failed` : `no count (exit ${r.status})`}${missing.length ? ` · MF4 not ok: ${missing.length} of ${names.length}` : ` · all ${names.length} MF4 clauses ok`}`);
}

// ── W6 BOUND — the org differs from the base only in the named files ──
if (!BASE) clause("W6 BOUND", false, "not run: no --base-org given");
else {
  const walk = (dir) => {
    const out = new Map();
    const rec = (d) => {
      for (const e of readdirSync(d, { withFileTypes: true })) {
        if (e.name === ".git" || e.name === "node_modules") continue;
        const p = join(d, e.name);
        if (e.isDirectory()) rec(p);
        else if (e.isFile()) out.set(relative(dir, p).split(sep).join("/"), createHash("sha256").update(readFileSync(p)).digest("hex"));
      }
    };
    rec(dir); return out;
  };
  const a = walk(ORG), b = walk(BASE);
  const diff = [...new Set([...a.keys(), ...b.keys()])].filter((k) => a.get(k) !== b.get(k)).sort();
  const outside = diff.filter((k) => !NAMED.includes(k) && !ALLOWED_EXACT.includes(k) && !ALLOWED_PREFIX.some((p) => k.startsWith(p)));
  clause("W6 BOUND", outside.length === 0, `${diff.length} path(s) differ · named ${diff.filter((k) => NAMED.includes(k)).join(",") || "none"} · outside the named files: ${outside.length ? outside.slice(0, 6).join(", ") : "none"}`);
}

// ── W7 LAST — nothing survives, nothing called claude ──
{
  const scan = process.platform === "win32"
    ? spawnSync("powershell", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | ForEach-Object { $_.CommandLine }"], { encoding: "utf8", windowsHide: true })
    : spawnSync("ps", ["-eo", "args"], { encoding: "utf8" });
  const fwd = (s) => String(s).split("\\").join("/");
  const survivors = scan.status === 0 ? String(scan.stdout).split(/\r?\n/).filter((l) => /node/i.test(l) && fwd(l).includes(fwd(T))) : null;
  const spawns = existsSync(CLAUDE_LOG) ? readFileSync(CLAUDE_LOG, "utf8").split(/\r?\n/).filter((l) => l.trim()).length : 0;
  clause("W7 LAST", survivors !== null && survivors.length === 0 && spawns === 0,
    `${survivors === null ? `process scan failed (exit ${scan.status})` : `${survivors.length} node process(es) naming the temp dir`} · fake claude logged ${spawns} spawn(s)`);
}

try { rmSync(T, { recursive: true, force: true }); } catch { /* a locked file on windows; the dir is under tmpdir */ }
const red = results.filter((r) => !r.ok);
if (red.length) { console.log(`RED MF4 · ${red.map((r) => r.id).join(" · ")}`); process.exit(1); }
console.log(`GREEN MF4 learn canary: no sitting + learn session RED, sitting and neither as today · ${results.length} clause(s)`);
process.exit(0);
