#!/usr/bin/env node
// ============================================================================
// sandbox.mjs · ARSENAL AI FC — THE AIRTIGHT SANDBOX AND ITS NEGATIVE CONTROLS
//                                                                (12 Aug 2026)
// ----------------------------------------------------------------------------
// WHY THIS EXISTS, IN ONE FACT. This repo has already fired 131 real paid calls
// and burned ~20 lakh tokens from what everyone believed was a test. "The
// sandbox is safe" was a hypothesis, and CLAUDE.md's law is that an unrun system
// IS a hypothesis. So this file does not describe a collar; it BUILDS one and
// then attacks it, and the suite asserts the attacks fail.
//
// FOUR LAYERS, deliberately redundant, because any single one can be wrong:
//   1. THE TREE      built from `git ls-files` into mkdtemp — NEVER cpSync of the
//                    live tree, which would drag scripts/oura_tokens.json in.
//                    Bonus, and it is not a small one: a git-ls-files tree IS the
//                    CI checkout, so the away-day red (E1, bug class 6 — passes at
//                    home, fails on CI, because assertions read gitignored state)
//                    finally has a permanent local lane instead of a guess.
//   2. THE PATH SHIM claude/gemini/ntfy/curl/schtasks at the HEAD of PATH, each
//                    recording an ATTEMPT and exiting 1. This catches a spawn
//                    that somehow bypasses layer 3 (e.g. from a non-Node process).
//   3. THE COLLAR    audit_preload.mjs via NODE_OPTIONS, which propagates to every
//                    grandchild — the layer with actual teeth.
//   4. ENV POISON    HOME/USERPROFILE/APPDATA redirected so ~/.claude credentials
//                    cannot resolve, and ANTHROPIC_API_KEY set to junk so brain's
//                    and claudegen's OWN billing guards refuse as a last resort.
//
// A COLLAR WITH NO CANARY IS A HYPOTHESIS. `canary` deliberately attempts four
// escapes from inside the sandbox — fetch, spawn claude, write live state, append
// the live brain_ledger — and asserts all four DENIED and the tripwire holding
// exactly four rows. That is the negative control this repo has never had.
//
// FAIL-CLOSED. Every consumer calls `assertArmed()`, which runs a probe child and
// refuses if the heartbeat is absent. Running unprotected is strictly worse than
// not running.
//
// LAWS: READ-ONLY on the live tree — this file never writes anything outside its
//   own temp dir. It is not a fixer and owns no state file.
// WHO ELSE COULD ACT ON THIS OUTPUT? mutagen.mjs (needs a disposable organism),
//   blackbox.mjs (needs a safe place to run organs for real), audit.mjs (needs a
//   worktree-equivalent), organism_test `collar` (asserts the canary). All four
//   are wired; none of them is a declared-but-unwired consumer.
// CLI: node scripts/sandbox.mjs [build|canary|ci|selftest]
// ============================================================================
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, cpSync, existsSync, rmSync, readdirSync, appendFileSync, statSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync, spawnSync } from "node:child_process";
import { tmpdir } from "node:os";

const HERE = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(HERE, "..");
const NODE = process.execPath;
const PRELOAD = join(HERE, "audit_preload.mjs");

let pass = 0, fail = 0;
const fails = [];
const assert = (name, cond, detail) => {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; fails.push({ name, detail }); console.log(`  FAIL ${name}${detail ? `\n         ${detail}` : ""}`); }
};

// ── BUILD ────────────────────────────────────────────────────────────────────
// From `git ls-files` ONLY. The one deliberate addition is node_modules, which is
// gitignored but is exactly what `npm ci` produces on the runner — leaving it out
// would model a world CI never sees.
export function buildSandbox(opts = {}) {
  const root = mkdtempSync(join(tmpdir(), "arsenal-audit-"));
  const tracked = execFileSync("git", ["ls-files", "-z"], { cwd: ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 })
    .split("\0").filter(Boolean);
  if (!tracked.length) throw new Error("sandbox: `git ls-files` returned nothing — refusing to build an empty sandbox");
  for (const rel of tracked) {
    const src = join(ROOT, rel);
    if (!existsSync(src)) continue;            // deleted-but-tracked
    const dst = join(root, rel);
    mkdirSync(dirname(dst), { recursive: true });
    cpSync(src, dst);
  }
  if (existsSync(join(ROOT, "node_modules"))) cpSync(join(ROOT, "node_modules"), join(root, "node_modules"), { recursive: true });

  // A real git repo, because organs and the suite legitimately shell `git
  // check-ignore`. Init-and-add, no commit: enough for ignore rules to resolve.
  try {
    execFileSync("git", ["init", "-q"], { cwd: root, stdio: "ignore" });
    execFileSync("git", ["add", "-A"], { cwd: root, stdio: "ignore" });
  } catch { /* a sandbox without git still works for everything except check-ignore */ }

  const audit = join(root, ".audit");
  mkdirSync(join(audit, "shim"), { recursive: true });
  mkdirSync(join(root, ".home"), { recursive: true });
  mkdirSync(join(root, ".appdata", "npm"), { recursive: true });
  mkdirSync(join(root, ".npm-cache"), { recursive: true });
  mkdirSync(join(root, ".localappdata"), { recursive: true });
  writeFileSync(join(root, ".npmrc"), "audit=false\nfund=false\nupdate-notifier=false\n");

  const tripwire = join(audit, "tripwire.jsonl");
  const heartbeat = join(audit, "heartbeat.jsonl");
  const trace = opts.trace === false ? "" : join(audit, "trace.jsonl");
  writeFileSync(tripwire, "");
  writeFileSync(heartbeat, "");
  if (trace) writeFileSync(trace, "");

  // LAYER 2 — the PATH shims. Belt and braces behind the collar: if anything ever
  // reaches an actual spawn, it hits a stub that records and fails, not the real
  // billing binary. Note claudegen resolves %APPDATA%\npm\claude.cmd FIRST, so a
  // shim goes there too — poisoning APPDATA without shimming it would only move
  // the hole, not close it.
  const shimBody = (name) => `@echo off\r\n>>"%ARSENAL_AUDIT_TRIPWIRE%" echo {"kind":"path-shim","bin":"${name}","layer":2}\r\nexit /b 1\r\n`;
  for (const b of ["claude", "gemini", "ntfy", "curl", "wget", "schtasks"]) {
    for (const ext of [".cmd", ".bat"]) writeFileSync(join(audit, "shim", b + ext), shimBody(b));
    writeFileSync(join(root, ".appdata", "npm", b + ".cmd"), shimBody(b));
  }

  const env = {
    ...process.env,
    PATH: `${join(audit, "shim")};${process.env.PATH || ""}`,
    Path: undefined,                               // Windows env is case-insensitive; drop the dup so PATH wins
    HOME: join(root, ".home"),
    USERPROFILE: join(root, ".home"),
    APPDATA: join(root, ".appdata"),
    // npm keeps its cache in %LOCALAPPDATA%\npm-cache, which is OUTSIDE the
    // sandbox, so `npm run …` inside the collar died on EACCES before running a
    // single test. Measured on the first CI-lane run, 12 Aug 2026. The fix is to
    // move npm's own dirs INTO the sandbox rather than to widen the collar —
    // widening it to make a red go away is how a collar quietly stops being one.
    npm_config_cache: join(root, ".npm-cache"),
    npm_config_userconfig: join(root, ".npmrc"),
    npm_config_update_notifier: "false",
    npm_config_fund: "false",
    npm_config_audit: "false",
    LOCALAPPDATA: join(root, ".localappdata"),
    ANTHROPIC_API_KEY: "sk-ant-SANDBOX-JUNK-refuse-me",
    ARSENAL_AUDIT_COLLAR: root,
    ARSENAL_AUDIT_TRIPWIRE: tripwire,
    ARSENAL_AUDIT_HEARTBEAT: heartbeat,
    ...(trace ? { ARSENAL_AUDIT_TRACE: trace } : {}),
    NODE_OPTIONS: `${process.env.NODE_OPTIONS ? process.env.NODE_OPTIONS + " " : ""}--import ${JSON.stringify(pathToFileURL(PRELOAD).href)}`,
  };
  delete env.Path;

  return { root, audit, tripwire, heartbeat, trace, env, tracked: tracked.length };
}

export const readJsonl = (p) => (existsSync(p) ? readFileSync(p, "utf8").split("\n").filter((l) => l.trim()).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean) : []);

// Run a command INSIDE a built sandbox.
export function runIn(sb, args, opts = {}) {
  const r = spawnSync(NODE, args, {
    cwd: opts.cwd || sb.root,
    encoding: "utf8",
    timeout: opts.timeout || 120000,
    env: { ...sb.env, ARSENAL_AUDIT_LABEL: opts.label || basename(args[0] || "node"), ...(opts.env || {}) },
    windowsHide: true,
  });
  return { code: r.status, out: (r.stdout || "") + (r.stderr || ""), signal: r.signal, timedOut: r.error && r.error.code === "ETIMEDOUT" };
}

// FAIL-CLOSED ARMING CHECK. If the preload did not load, there is no collar, and
// every downstream organ must refuse rather than run naked.
export function assertArmed(sb) {
  const probe = join(sb.root, ".audit", "probe.mjs");
  writeFileSync(probe, "console.log('probe-ok');\n");
  const r = runIn(sb, [probe], { label: "probe" });
  const beats = readJsonl(sb.heartbeat);
  if (!beats.length || !beats.some((b) => b.collar)) {
    throw new Error(`sandbox: REFUSING — the collar did not load (no heartbeat). Probe exit ${r.code}. Running unprotected is worse than not running.`);
  }
  return true;
}

export function destroy(sb) { try { rmSync(sb.root, { recursive: true, force: true }); } catch { /* temp dirs are the OS's problem after this */ } }

// ── THE NEGATIVE CONTROL ─────────────────────────────────────────────────────
// Four deliberate escape attempts, run INSIDE the sandbox. This is the assertion
// that turns "airtight" from an adjective into a measurement.
const CANARY_SRC = `
// canary.mjs — deliberately attempts four escapes. ALL FOUR MUST BE DENIED.
import { writeFileSync, appendFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
const LIVE_STATE = process.env.CANARY_LIVE_STATE;
const LIVE_LEDGER = process.env.CANARY_LIVE_LEDGER;
const results = {};
try { await fetch("http://example.com/"); results.fetch = "ESCAPED"; } catch (e) { results.fetch = "denied:" + (e.code || "throw"); }
try { execFileSync("claude", ["-p", "hello"]); results.claude = "ESCAPED"; } catch (e) { results.claude = "denied:" + (e.code || "throw"); }
try { writeFileSync(LIVE_STATE, "canary was here"); results.liveWrite = "ESCAPED"; } catch (e) { results.liveWrite = "denied:" + (e.code || "throw"); }
try { appendFileSync(LIVE_LEDGER, "{}\\n"); results.ledger = "ESCAPED"; } catch (e) { results.ledger = "denied:" + (e.code || "throw"); }
console.log("CANARY:" + JSON.stringify(results));
`;

export function canary(sb) {
  const p = join(sb.root, ".audit", "canary.mjs");
  writeFileSync(p, CANARY_SRC);
  const before = readJsonl(sb.tripwire).length;
  const r = runIn(sb, [p], {
    label: "canary",
    env: {
      CANARY_LIVE_STATE: join(ROOT, "dressing-room", "state", "CANARY_MUST_NEVER_EXIST.json"),
      CANARY_LIVE_LEDGER: join(ROOT, "dressing-room", "state", "brain_ledger.jsonl"),
    },
  });
  const m = /CANARY:(\{.*\})/.exec(r.out);
  const results = m ? JSON.parse(m[1]) : null;
  const rows = readJsonl(sb.tripwire).slice(before);
  return { results, rows, out: r.out, code: r.code };
}

// ── THE MONEY ORACLE ─────────────────────────────────────────────────────────
// Nothing the audit does may move the live billing ledger by one row. Measured,
// not asserted in prose.
export function ledgerFingerprint() {
  const f = join(ROOT, "dressing-room", "state", "brain_ledger.jsonl");
  const outDir = join(ROOT, "brain_out");
  const lines = existsSync(f) ? readFileSync(f, "utf8").split("\n").filter((l) => l.trim()) : [];
  let newest = 0, files = 0;
  const walk = (d) => { if (!existsSync(d)) return; for (const e of readdirSync(d, { withFileTypes: true })) { const p = join(d, e.name); if (e.isDirectory()) walk(p); else { files++; const s = statSync(p); if (s.mtimeMs > newest) newest = s.mtimeMs; } } };
  walk(outDir);
  return { rows: lines.length, lines, brainOutFiles: files, brainOutNewest: newest };
}

// ── THE MONEY ORACLE, DONE PROPERLY ──────────────────────────────────────────
// A RAW ROW-COUNT DELTA IS NOT A VALID ORACLE ON THIS MACHINE, and finding that
// out was worth more than the assertion it replaced. blackbox's selftest went RED
// on "zero live ledger rows added" — correctly, in the sense that rows really had
// been added, and completely wrongly in the sense that implied: the collar had
// denied every spawn, and the new rows were the LIVE ORGANISM breathing through
// the test window (a haiku job at 11:45 and another at 11:48, from the daemon on
// his laptop). organism_test's own hermeticity check has the same scar and calls
// it "flapping".
//
// The honest question is not "did the file grow" but "did anything I RAN spend
// money". That is answered two ways, both stable:
//   1. every new row is checked against the audit's window AND its `job` —
//      the audit never enqueues a brain job, so a row whose job belongs to the
//      live schedule is not ours.
//   2. the collar's own count of ALLOWED billing spawns, which must be ZERO.
//      Denials are fine — a denial is the proof the collar worked.
// Weakening the assertion to make a red go away is how a guard stops guarding;
// making it PRECISE is the repair.
const AUDIT_JOBS = /^(audit|xray|mutagen|blackbox|treasury|herd|sandbox)/i;
export function moneyOracle(before, after, sb) {
  const added = after.lines.slice(before.rows);
  const parsed = added.map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  const ours = parsed.filter((r) => AUDIT_JOBS.test(String(r.job || r.kind || "")));
  const trips = sb ? readJsonl(sb.tripwire) : [];
  const allowedBilling = trips.filter((t) => t.kind === "spawn-billing" && t.allowed);
  return {
    ok: ours.length === 0 && allowedBilling.length === 0,
    added: parsed.length,
    ours: ours.length,
    denied_billing_attempts: trips.filter((t) => t.kind === "spawn-billing").length,
    live_jobs: [...new Set(parsed.map((r) => String(r.job || "?")))],
    detail: `${parsed.length} row(s) appended during the window, ${ours.length} attributable to the audit; live jobs seen: ${[...new Set(parsed.map((r) => String(r.job || "?")))].join(", ") || "none"}`,
  };
}

// ── CI LANE (E1) ─────────────────────────────────────────────────────────────
// E1 has been open since 7 Aug behind ONE unfalsifiable variable: four localhost
// daemons (4111 turnstile · 4112 cortex · 4113 thalamus · 5600 ActivityWatch)
// that answer on his laptop and NEVER on a CI runner, so no local reproduction
// could ever hold them constant "short of stopping his live organism". The collar
// denies net.connect outright, which holds them constant WITHOUT touching the
// live organism. That is a measurement, not a fifth guess.
function ci() {
  const sb = buildSandbox();
  try {
    assertArmed(sb);
    console.log(`\n=== CI LANE — a git-ls-files checkout with ALL FOUR DAEMONS UNREACHABLE ===`);
    console.log(`sandbox: ${sb.root}  (${sb.tracked} tracked files)\n`);
    const r = runIn(sb, [join(sb.root, "scripts", "awayday.mjs"), "run"], { label: "awayday", timeout: 600000 });
    console.log(r.out.split("\n").slice(-60).join("\n"));
    console.log(`\naway-day exit code: ${r.code}`);
    const trips = readJsonl(sb.tripwire);
    if (trips.length) {
      console.log(`\ncollar denials during the run (${trips.length}) — each one is a thing CI cannot do either:`);
      const by = new Map();
      for (const t of trips) { const k = `${t.kind} ${t.organ} ${t.target || t.file || t.path || ""}`; by.set(k, (by.get(k) || 0) + 1); }
      for (const [k, n] of [...by].sort((a, b) => b[1] - a[1]).slice(0, 25)) console.log(`  ${String(n).padStart(4)}×  ${k}`);
    }
    return r.code;
  } finally { destroy(sb); }
}

// ── SELFTEST ─────────────────────────────────────────────────────────────────
function selftest() {
  console.log("=== sandbox.mjs selftest — the collar, measured ===\n");
  const before = ledgerFingerprint();
  const sb = buildSandbox();
  try {
    assert("sandbox builds from `git ls-files`, not a tree copy", sb.tracked > 100, `tracked=${sb.tracked}`);
    assert("LIVE CREDENTIALS ARE ABSENT — scripts/oura_tokens.json never entered the sandbox",
      !existsSync(join(sb.root, "scripts", "oura_tokens.json")) && !existsSync(join(sb.root, "scripts", "oura_secrets.json")),
      "a gitignored secret reached the sandbox — the build used a tree copy somewhere");
    assert("the CI world is reproduced: gitignored state/capsules/ is absent, exactly as on a runner",
      !existsSync(join(sb.root, "dressing-room", "state", "capsules")));

    assertArmed(sb);
    assert("FAIL-CLOSED — the collar heartbeat is present, so the audit is armed", readJsonl(sb.heartbeat).length > 0);

    const c = canary(sb);
    assert("NEGATIVE CONTROL · fetch to the internet is DENIED", c.results && /^denied/.test(c.results.fetch), JSON.stringify(c.results));
    assert("NEGATIVE CONTROL · spawning `claude` (the only token-spend edge) is DENIED", c.results && /^denied/.test(c.results.claude), JSON.stringify(c.results));
    assert("NEGATIVE CONTROL · writing LIVE dressing-room/state is DENIED", c.results && /^denied/.test(c.results.liveWrite), JSON.stringify(c.results));
    assert("NEGATIVE CONTROL · appending the LIVE brain_ledger is DENIED", c.results && /^denied/.test(c.results.ledger), JSON.stringify(c.results));
    assert("the tripwire recorded EXACTLY four attempts — a collar with no canary is a hypothesis",
      c.rows.length === 4, `recorded ${c.rows.length}: ${c.rows.map((r) => r.kind).join(", ")}`);
    assert("…and the live state file the canary aimed at was never created",
      !existsSync(join(ROOT, "dressing-room", "state", "CANARY_MUST_NEVER_EXIST.json")));

    // The collar must not merely deny — it must let honest work through, or every
    // downstream measurement is a false red.
    const ok = runIn(sb, [join(sb.root, "scripts", "validators.mjs"), "selftest"], { label: "validators" });
    assert("a real organ still runs GREEN inside the collar (the collar is not just a wall)", ok.code === 0, ok.out.slice(-300));

    // Grandchild propagation: the organism shells itself ~25 times, so a collar
    // that stopped at depth 1 would have a hole the size of the organism.
    const gp = join(sb.root, ".audit", "gp.mjs");
    writeFileSync(gp, `import {execFileSync} from "node:child_process";\nconst r=execFileSync(process.execPath,[process.env.GC],{encoding:"utf8"});\nconsole.log(r);\n`);
    const gc = join(sb.root, ".audit", "gc.mjs");
    writeFileSync(gc, `try{ await fetch("http://example.com/"); console.log("GC:ESCAPED"); }catch(e){ console.log("GC:denied"); }\n`);
    const gr = runIn(sb, [gp], { label: "grandchild", env: { GC: gc } });
    assert("the collar reaches GRANDCHILDREN (NODE_OPTIONS propagation)", /GC:denied/.test(gr.out), gr.out.slice(-300));
  } finally { destroy(sb); }

  const after = ledgerFingerprint();
  // ⚠ THE ORACLE IS ATTRIBUTION, NOT A ROW COUNT — and this assertion is the one
  // that taught us so. It read `after.rows === before.rows` and went RED on a
  // full `npm test` (66 → 69) while the collar had denied every spawn: the three
  // new rows were the LIVE DMN breathing through a multi-minute suite window.
  // organism_test's own hermeticity check carries the identical scar and calls it
  // "flapping". The same fix landed in blackbox and mutagen earlier today and was
  // simply not carried back here — which is its own small lesson about repairing
  // a class rather than an instance.
  const money = moneyOracle(before, after);
  assert("THE MONEY ORACLE — no ledger row is attributable to the audit, and zero billing spawns were allowed",
    money.ok, money.detail);
  assert("…and brain_out/ gained no FILES (a live daemon may restamp mtimes; it must not create outputs)",
    after.brainOutFiles === before.brainOutFiles,
    `files ${before.brainOutFiles}→${after.brainOutFiles}`);

  console.log(`\nsandbox: ${pass} passed, ${fail} failed`);
  if (fail) for (const f of fails) console.log(`  · ${f.name}${f.detail ? `\n      ${f.detail}` : ""}`);
  process.exit(fail ? 1 : 0);
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
function main() {
  const mode = (process.argv[2] || "selftest").toLowerCase();
  if (mode === "selftest") return selftest();
  if (mode === "ci") process.exit(ci() === 0 ? 0 : 1);
  if (mode === "canary") {
    const sb = buildSandbox();
    try { assertArmed(sb); const c = canary(sb); console.log(JSON.stringify({ results: c.results, tripwire: c.rows }, null, 2)); }
    finally { destroy(sb); }
    return;
  }
  if (mode === "build") {
    const sb = buildSandbox();
    assertArmed(sb);
    console.log(sb.root);
    console.log("(not destroyed — remove it yourself when done)");
    return;
  }
  console.log("sandbox: build | canary | ci | selftest");
  process.exit(1);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
