#!/usr/bin/env node
// ============================================================================
// ci/mact/witness_mact.mjs — UNIT mact · AN ACT ID IS HELD BY ONE ROW, OR NO VERB ACTS ON IT (forks rows 1138 / 1138 (2))
// ----------------------------------------------------------------------------
// USAGE: node ci/mact/witness_mact.mjs --org <dir> --base-org <dir> [--only <clause>[,<clause>…]]
//   --org       the tree to witness (the build reads GREEN; the base a583afb reads RED on every clause)
//   --base-org  the BASE tree (main a583afb, ci/mact/BASE): BOUND diffs against it and W4 takes the base's mint line from it;
//               absent, BOUND and W4 are RED
//   --only      run only these clauses (the mutant runner's door); BOUND and LAST always run
//   Trees: `node ci/mact/lftree.mjs <sha> <dir>` (LF, the commit's tracked files only).
// CONTRACT — every plant runs on a COPY of --org under os.tmpdir() (never .git, never node_modules), whose dressing-room/state
//   holds ONLY the two TRACKED files the acts selftest reads (registry.json, captain.json — copied by this node script, never
//   printed); every ledger an organ could write is pointed by its own env door (ARSENAL_ACTS_LEDGER, ARSENAL_CLAIMS_LEDGER) at a
//   file under the same temp root, HOME / USERPROFILE too. A REFUSING `claude` / `gemini` (+ .cmd) sits FIRST on PATH and logs
//   any spawn (a planted model, never a live call); ANTHROPIC_API_KEY and GITHUB_ACTIONS are deleted from every child's env.
//   Every owner an act would spawn is an INJECTED exec (nothing real is spawned by a probe). No port is bound, no service named,
//   nothing POSTed, nothing restarted. No git repo is planted (the acts selftest's own pin fixture makes its own, under its own
//   mkdtemp). Every line read from a process is split on \r?\n; BOUND hashes text with CRLF folded to LF; processes are listed
//   through PowerShell on Windows, `ps` elsewhere. No timeout, budget or ratio is typed: the only wait (LAST) polls in SLACK
//   steps (one node start measured in this run), bounded by the longest single run this witness measured plus SLACK.
// CLAUSES (spec ci/mact/MACT_SPEC.md @ 393f561 §5 W1-W4; ruling row 1138 (2) adds W5 (F-2 (c)) and W6 (F-3 (b)) — the ruling wins):
//   W1  unique under a PLANTED clock: Math.random pinned (pin_random.mjs), one fixed deps.now, 32 `dispatch` calls with an
//       injected exec / append → 32 distinct ids
//   W2  unique under the LIVE clock: no deps.now, `dispatchAll` of 6 validation-refused acts (no owner, so no ms passes),
//       20000 turns, append injected → 0 turns holding two equal ids (the probe also prints how many turns minted in one ms)
//   W3  the acts selftest under EVERY forced pair (pair_random.mjs over all j<k of the Math.random calls a control run counts)
//       → the control GREEN and 0 red pairs
//   W4  a red is NAMED, never a throw: the org's acts.mjs with its mint line replaced by the BASE's (the collision put back)
//       + pair 0-2 → the last line `acts selftest: N passed, M failed` with M ≥ 1, and no stack (`Node.js v`, `TypeError`)
//   W5  F-2 (c): undo, resolve and reroute REFUSE an id held by two rows — the id itself and the `--by` id — and on a refusal
//       no owner is called and no row is appended
//   W6  F-3 (b): the claims mint, the same plant as W1 (pinned random, one fixed now, 32 fileClaim with an injected runner and
//       a temp ledger) → 32 distinct ids
//   BOUND only the named files differ from --base-org (scripts/acts.mjs, scripts/claims.mjs; ci/mact/** is this unit's output)
//   LAST  no node process naming the temp root survives (the refusing shim's spawns are counted and printed, planted)
// LAST LINE: GREEN MACT <what> · <n> clause(s) (exit 0) or RED MACT · <clauses> (exit 1)
// ============================================================================
import { cpSync, mkdirSync, mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync, readdirSync, statSync, chmodSync } from "node:fs";
import { join, resolve, relative, sep, delimiter, dirname } from "node:path";
import { tmpdir, availableParallelism } from "node:os";
import { spawnSync, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { pathToFileURL, fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : null; };
const ORG = arg("--org") ? resolve(arg("--org")) : null, BASE_ORG = arg("--base-org") ? resolve(arg("--base-org")) : null;
const ONLY = arg("--only") ? arg("--only").split(",") : null;
if (!ORG || !existsSync(join(ORG, "scripts", "acts.mjs"))) { console.log("RED MACT · USAGE (--org <dir> with scripts/acts.mjs)"); process.exit(1); }
const UNIT = "MACT";
const NAMED = ["scripts/acts.mjs", "scripts/claims.mjs"];
const OWN = (rel) => rel.startsWith("ci/mact/");
const SKIP_TOP = new Set([".git", "node_modules"]);
const STATE_KEEP = ["registry.json", "captain.json"];   // the acts selftest's two LIVE reads (organism_test.mjs:85), tracked files
const ROOT = mkdtempSync(join(tmpdir(), "mact-wit-"));
const slash = (p) => p.split(sep).join("/");
const results = [];
const clause = (id, ok, why) => { results.push({ id, ok: !!ok }); console.log(`  ${ok ? "GREEN" : "RED  "} ${id} · ${why}`); };
const want = (id) => !ONLY || ONLY.includes(id);
const t0 = Date.now(); spawnSync(process.execPath, ["-e", "0"]); const SLACK = Math.max(1, Date.now() - t0);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const lines = (s) => String(s || "").split(/\r?\n/).filter((l) => l.trim());
let MAXMS = 0;

// ── THE COPY ──────────────────────────────────────────────────────────────────────────────────────────────────────────
function copyOrg(src, dst) {
  cpSync(src, dst, { recursive: true, filter: (p) => {
    const rel = slash(relative(src, p));
    if (!rel) return true;
    if (SKIP_TOP.has(rel.split("/")[0])) return false;
    if (rel === "dressing-room/state") return true;
    if (rel.startsWith("dressing-room/state/")) return STATE_KEEP.includes(rel.slice("dressing-room/state/".length));
    return !/\.log$/.test(rel);
  } });
}
const FAKE = join(ROOT, "fakebin"), SHIM_LOG = join(ROOT, "shim_spawns.log"), HOME = join(ROOT, "home");
mkdirSync(FAKE, { recursive: true }); mkdirSync(HOME, { recursive: true });
for (const b of ["claude", "gemini"]) {
  writeFileSync(join(FAKE, b), `#!/bin/sh\necho "spawn ${b} $*" >> "$MACT_SHIM_LOG"\nexit 97\n`); chmodSync(join(FAKE, b), 0o755);
  writeFileSync(join(FAKE, `${b}.cmd`), `@echo spawn ${b} %* >> "%MACT_SHIM_LOG%"\r\n@exit /b 97\r\n`);
}
const COPY = join(ROOT, "org");
copyOrg(ORG, COPY);
function env(extra = {}) {
  const e = { ...process.env };
  for (const k of ["ANTHROPIC_API_KEY", "GITHUB_ACTIONS", "ARSENAL_ORGAN", "NODE_OPTIONS", "MACT_PAIR", "MACT_COUNT_FILE", "ARSENAL_REGISTRY", "CLAUDE_CODE_SESSION_ID"]) delete e[k];
  const pathKey = Object.keys(e).find((k) => k.toUpperCase() === "PATH") || "PATH";
  return { ...e, [pathKey]: `${FAKE}${delimiter}${e[pathKey] || ""}`, HOME, USERPROFILE: HOME, MACT_SHIM_LOG: SHIM_LOG,
    ARSENAL_ACTS_LEDGER: join(ROOT, "acts.jsonl"), ARSENAL_CLAIMS_LEDGER: join(ROOT, "claims.jsonl"), ...extra };
}
const preload = (f) => ["--import", pathToFileURL(join(HERE, f)).href];
function node(cwd, args, extra = {}) {
  const t = Date.now();
  const r = spawnSync(process.execPath, args, { cwd, encoding: "utf8", windowsHide: true, env: env(extra), maxBuffer: 1 << 28 });
  const ms = Date.now() - t; if (ms > MAXMS) MAXMS = ms;
  return { status: r.status, stdout: String(r.stdout || ""), stderr: String(r.stderr || ""), ms };
}
function nodeAsync(cwd, args, extra = {}) {
  return new Promise((res) => {
    const t = Date.now(); let out = "", err = "";
    const k = spawn(process.execPath, args, { cwd, windowsHide: true, env: env(extra) });
    k.stdout.on("data", (d) => { out += d; }); k.stderr.on("data", (d) => { err += d; });
    k.on("close", (status) => { const ms = Date.now() - t; if (ms > MAXMS) MAXMS = ms; res({ status, stdout: out, stderr: err, ms }); });
  });
}

// ── THE PROBE (one file, every mode; each imports the copy's organ and injects every owner) ─────────────────────────────
const PROBE = join(ROOT, "probe.mjs");
writeFileSync(PROBE, `import { pathToFileURL } from "node:url";
import { join } from "node:path";
const [mode, org, tmp] = process.argv.slice(2);
const out = (o) => console.log("PROBE " + JSON.stringify(o));
const A = () => import(pathToFileURL(join(org, "scripts", "acts.mjs")).href);
if (mode === "w1") {
  const { dispatch } = await A();
  const now = new Date("2026-08-18T20:30:00Z"), ids = [];
  const deps = { now, exec: () => ({ ok: true, out: '{"ok":true,"id":"m1"}' }), append: () => true };
  for (let i = 0; i < 32; i++) ids.push(dispatch({ door: "cli", verb: "note", args: { text: "planted " + i, kind: "thread" } }, deps).id);
  out({ n: ids.length, distinct: new Set(ids).size });
} else if (mode === "w2") {
  const { dispatchAll } = await A();
  const turns = 20000; let sameMs = 0, equal = 0;
  const acts = Array.from({ length: 6 }, (_, i) => ({ verb: "planted_refused_" + i, args: { text: "x" } }));
  for (let t = 0; t < turns; t++) {
    const rows = dispatchAll(acts, "code", { append: () => true });
    const ts = new Set(rows.map((r) => r.ts)), ids = new Set(rows.map((r) => r.id));
    if (ts.size < rows.length) sameMs++;
    if (ids.size < rows.length) equal++;
  }
  out({ turns, sameMs, equal });
} else if (mode === "w5") {
  const { undo, resolveFailed, rerouteFailed } = await A();
  const REFUSE = "teaching_contract: REFUSED — reads BUILD-SHAPED. Route it through acts verb \`design\` → the registry rulings lane.";
  const T = (s) => new Date(Date.parse("2026-10-19T12:00:00Z") + s * 1000).toISOString();
  const run = (fn) => { const calls = [], app = []; const deps = { now: new Date("2026-10-21T12:00:00Z"), exec: (o, a) => { calls.push(o); return { ok: true, out: '{"ok":true,"id":"m1"}' }; }, append: (r) => { app.push(r); return true; } }; const r = fn(deps); return { ok: !!r.ok, why: r.why || null, calls: calls.length, appended: app.length }; };
  const note = { id: "aDUP", ts: T(0), door: "cli", verb: "note", args: { text: "x", kind: "thread" }, owner: "hippocampus.mjs", ok: true, receipt: '{"ok":true,"id":"m1"}' };
  const pref = { id: "aDUP", ts: T(1), door: "cli", verb: "pref", args: { text: "y", axis: "how_to_speak" }, owner: "gaffer_state.mjs", ok: true, receipt: "ok" };
  const fl = (id, s) => ({ id, ts: T(s), door: "cli", verb: "rule", args: { text: "r" }, owner: "teaching_contract.mjs", ok: false, error: "REFUSED" });
  const fx = (id, s) => ({ id, ts: T(s), door: "cli", verb: "rule", args: { text: "r" }, owner: "teaching_contract.mjs", ok: true, receipt: "added" });
  const rf = (id, s) => ({ id, ts: T(s), door: "cli", verb: "rule", args: { text: "build it" }, owner: "teaching_contract.mjs", ok: false, error: REFUSE });
  const dz = (id, s) => ({ id, ts: T(s), door: "cli", verb: "design", args: { text: "build it" }, owner: "registry.mjs", ok: true, receipt: "{}" });
  const cases = {
    undo_id: run((d) => undo("aDUP", { ...d, rows: [note, pref] })),
    resolve_id: run((d) => resolveFailed("aF", "aK", { ...d, rows: [fl("aF", 0), fl("aF", 2), fx("aK", 7)] })),
    resolve_by: run((d) => resolveFailed("aF", "aK", { ...d, rows: [fl("aF", 0), fx("aK", 7), fx("aK", 9)] })),
    reroute_id: run((d) => rerouteFailed("aR", null, { ...d, rows: [rf("aR", 0), rf("aR", 3)] })),
    reroute_by: run((d) => rerouteFailed("aR", "aD", { ...d, rows: [rf("aR", 0), dz("aD", 8), dz("aD", 9)] })),
    // the control: the SAME plants with one row per id still act (the refusal is the duplicate, never the verb)
    control_undo: run((d) => undo("aDUP", { ...d, rows: [note] })),
    control_resolve: run((d) => resolveFailed("aF", "aK", { ...d, rows: [fl("aF", 0), fx("aK", 7)] })),
    control_reroute: run((d) => rerouteFailed("aR", "aD", { ...d, rows: [rf("aR", 0), dz("aD", 8)] })),
  };
  out(cases);
} else if (mode === "w6") {
  const { fileClaim } = await import(pathToFileURL(join(org, "scripts", "claims.mjs")).href);
  const now = new Date("2026-08-18T20:30:00Z"), ids = [];
  for (let i = 0; i < 32; i++) ids.push(fileClaim({ claim: "planted " + i, cmd: "planted", now, ledger: join(tmp, "claims_w6.jsonl"), runner: () => ({ status: 0, stdout: "ok", stderr: "" }) }).row.id);
  out({ n: ids.length, distinct: new Set(ids).size });
}
`);
const probe = (mode, pre = []) => {
  const r = node(COPY, [...pre, PROBE, mode, COPY, ROOT]);
  const l = lines(r.stdout).reverse().find((x) => x.startsWith("PROBE "));
  return l ? JSON.parse(l.slice(6)) : { error: lines(r.stdout + r.stderr).slice(-2).join(" | ").slice(0, 240) };
};
const SELF = ["scripts/acts.mjs", "selftest"];
const headline = (s) => lines(s).reverse().find((l) => /^acts selftest: \d+ passed, \d+ failed/.test(l)) || null;
const stacked = (s) => /Node\.js v\d|TypeError|ReferenceError|\n\s+at .+:\d+:\d+/.test(s);

let exitCode = 1;
try {
  if (want("W1")) {
    const p = probe("w1", preload("pin_random.mjs"));
    clause("W1", p.n === 32 && p.distinct === 32, p.error ? `probe: ${p.error}` : `planted clock + pinned random · ${p.n} dispatch · ${p.distinct} distinct id(s)`);
  }
  if (want("W2")) {
    const p = probe("w2");
    clause("W2", p.turns > 0 && p.equal === 0, p.error ? `probe: ${p.error}` : `live clock · turns ${p.turns} · a turn with two mints in one ms ${p.sameMs} · a turn with two EQUAL ids ${p.equal}`);
  }
  if (want("W3")) {
    const cf = join(ROOT, "count_w3");
    const c = node(COPY, [...preload("pair_random.mjs"), ...SELF], { MACT_COUNT_FILE: cf });
    const calls = existsSync(cf) ? Number(readFileSync(cf, "utf8")) : 0;
    const ctl = c.status === 0 && /, 0 failed/.test(headline(c.stdout) || "");
    const pairs = [];
    for (let j = 0; j < calls; j++) for (let k = j + 1; k < calls; k++) pairs.push(`${j},${k}`);
    const red = [], crash = [];
    let next = 0;
    const lane = async () => { while (next < pairs.length) { const p = pairs[next++]; const r = await nodeAsync(COPY, [...preload("pair_random.mjs"), ...SELF], { MACT_PAIR: p }); if (r.status !== 0) { red.push(p); if (!headline(r.stdout)) crash.push(p); } } };
    await Promise.all(Array.from({ length: availableParallelism() }, lane));
    clause("W3", ctl && calls > 1 && red.length === 0, `control ${headline(c.stdout) || "NO HEADLINE"} · calls ${calls} · pairs ${pairs.length} · red ${red.length} · crash ${crash.length}${red.length ? ` (${red.slice(0, 8).join(" ")}${red.length > 8 ? " …" : ""})` : ""}`);
  }
  if (want("W4")) {
    if (!BASE_ORG || !existsSync(join(BASE_ORG, "scripts", "acts.mjs"))) clause("W4", false, "no --base-org: the base's mint line cannot be read");
    else {
      const MINT = /^const newId = .*$/m;
      const baseLine = (MINT.exec(readFileSync(join(BASE_ORG, "scripts", "acts.mjs"), "utf8").replace(/\r\n/g, "\n")) || [])[0];
      const W4 = join(ROOT, "org-w4"); copyOrg(ORG, W4);
      const f = join(W4, "scripts", "acts.mjs"), src = readFileSync(f, "utf8").replace(/\r\n/g, "\n");
      const hit = baseLine && MINT.test(src);
      if (hit) writeFileSync(f, src.replace(MINT, () => baseLine));
      const r = node(W4, [...preload("pair_random.mjs"), ...SELF], { MACT_PAIR: "0,2" });
      const h = headline(r.stdout), m = h ? Number(/, (\d+) failed/.exec(h)[1]) : 0, st = stacked(r.stdout + r.stderr);
      clause("W4", hit && h && m >= 1 && !st, hit ? `the base mint put back + pair 0-2 · exit ${r.status} · ${h || "NO HEADLINE"} · stack ${st ? "YES" : "none"}` : "the mint line is not found in one of the trees");
    }
  }
  if (want("W5")) {
    const p = probe("w5");
    if (p.error) clause("W5", false, `probe: ${p.error}`);
    else {
      const amb = ["undo_id", "resolve_id", "resolve_by", "reroute_id", "reroute_by"];
      const refused = amb.filter((k) => !p[k].ok && p[k].calls === 0 && p[k].appended === 0 && /two rows|ambiguous/i.test(p[k].why || ""));
      const ctl = p.control_undo.ok && p.control_resolve.ok && p.control_reroute.ok;
      clause("W5", refused.length === amb.length && ctl, `an id held by two rows · refused ${refused.length} of ${amb.length} (${amb.map((k) => `${k} ${p[k].ok ? "ACTED" : "refused"}·calls ${p[k].calls}·rows ${p[k].appended}`).join(" · ")}) · control (one row per id) ${ctl ? "acts" : "BROKEN"}`);
    }
  }
  if (want("W6")) {
    const p = probe("w6", preload("pin_random.mjs"));
    clause("W6", p.n === 32 && p.distinct === 32, p.error ? `probe: ${p.error}` : `claims mint · planted clock + pinned random · ${p.n} fileClaim · ${p.distinct} distinct id(s)`);
  }
  // ── BOUND ──
  if (!BASE_ORG) clause("BOUND", false, "no --base-org");
  else {
    const walk = (top, d = top, acc = new Map()) => {
      for (const n of readdirSync(d)) {
        const p = join(d, n), rel = slash(relative(top, p));
        if (SKIP_TOP.has(rel.split("/")[0]) || rel === "dressing-room/state" || OWN(rel)) continue;
        const st = statSync(p);
        if (st.isDirectory()) walk(top, p, acc); else acc.set(rel, createHash("sha256").update(readFileSync(p, "utf8").replace(/\r\n/g, "\n")).digest("hex"));
      }
      return acc;
    };
    const a = walk(ORG), b = walk(BASE_ORG);
    const diff = [...new Set([...a.keys(), ...b.keys()])].filter((k) => a.get(k) !== b.get(k)).sort(), extra = diff.filter((f) => !NAMED.includes(f));
    clause("BOUND", extra.length === 0, `${diff.length} file(s) differ from --base-org${diff.length ? ` (${diff.join(", ")})` : ""}${extra.length ? ` · BEYOND THE NAMED: ${extra.slice(0, 6).join(", ")}` : ""}`);
  }
  exitCode = 0;
} catch (e) {
  clause("WITNESS", false, `threw: ${String((e && e.stack) || e).split(/\r?\n/).slice(0, 3).join(" | ").slice(0, 300)}`);
}

// ── LAST ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
{
  const listing = () => (process.platform === "win32"
    ? spawnSync("powershell.exe", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | ForEach-Object { $_.CommandLine }"], { encoding: "utf8", windowsHide: true })
    : spawnSync("ps", ["-eo", "args"], { encoding: "utf8" }));
  const survivors = () => lines(listing().stdout).filter((l) => l.includes(ROOT) && !/\bps -eo\b/.test(l));
  let left = survivors(); const end = Date.now() + MAXMS + SLACK;
  while (left.length && Date.now() < end) { await sleep(SLACK); left = survivors(); }
  const spawns = existsSync(SHIM_LOG) ? lines(readFileSync(SHIM_LOG, "utf8")).length : 0;
  try { rmSync(ROOT, { recursive: true, force: true }); } catch { /* a file Windows still holds stays for the OS to reap */ }
  clause("LAST", left.length === 0, `${left.length} node process(es) naming the temp root survive · the refusing shim logged ${spawns} spawn(s) (planted; no live model)`);
}
const red = results.filter((r) => !r.ok).map((r) => r.id);
if (red.length || exitCode) { console.log(`RED ${UNIT} · ${red.join(", ") || "WITNESS"}`); process.exit(1); }
console.log(`GREEN ${UNIT} an act or claim id is minted once per process and no verb acts on an id two rows hold · ${results.length} clause(s)`);
process.exit(0);
