#!/usr/bin/env node
// @ts-check
// ============================================================================
// land.mjs · ARSENAL AI FC — THE LANDING VERB (unit mland, ruling row 1029; spec ci/mcr/B2_SPEC.md §2)
//   SOLE WRITER of: NOTHING in dressing-room/state/. It moves refs/heads/main IN HIS TREE by a fast-forward-only merge,
//   pushes it (never --force), prints ONE line, and appends one row per landing attempt to the clone's own
//   `.git/land_ledger.jsonl` (inside .git: never tracked, never pushed) — the count row 1029 L2 asks the verb to keep.
// ----------------------------------------------------------------------------
// THE RULINGS IT CARRIES (row 1029): L1 a NEW organ (rails.mjs owns no git-ref write) · L2 run by the runner at his
//   console; unattended only after TEN landings with no stop a human had to resolve — this verb counts that number and
//   prints it · L3 exactly ONE commit per landing · L4 a rejected push leaves main at the landed sha, the verb retries
//   (once, when origin still sits at the parent) and `push <unit>` retries later; groundsman knows the commit as lawful ·
//   C1 (row 1023) THE SHA JUDGED IS THE SHA LANDED: the CI verdict is read at T and T itself is what main becomes; no
//   verdict ever carries · C1-TRAIN (row 1313 (1), unit mtrain) beside C1, never instead of it: with --train-top TOP the
//   sha JUDGED may be a train top ABOVE the landed commit — the verdict of step 6 is read at TOP, and only when T is TOP or
//   on TOP's first-parent chain with every commit in T..TOP single-parent (TOP's tree holds every car); anything else is
//   REFUSED by name (TRAIN-TOP-FLAG · TRAIN-TOP-UNRESOLVED · TRAIN-TOP-NOT-DESCENDANT · TRAIN-TOP-MERGE). The landed commit is
//   still exactly ONE commit (L3) and T is still what main becomes; the ledger row carries train_top · C2 a witness declares what it reads in `// READS:` header lines · C3 the suite is not a
//   carrying witness (it declares no list) · S1 hermetic witnesses live at ci/<unit>/ (F10 A, row 1066) · step 8 never uses
//   `git worktree add` (a shared clone) · step 11 PRINTS the stale units and restarts nothing · Q4 a NEW file under
//   ci/ lands only with the campaign names-gate result as an input (--names-gate); absent = REFUSED.
//   NO-CI-DIR (unit ms1 · row 1066 F7 A): once main carries a ci/<unit>/BASE (ms1's landing on), a landing whose tree lacks
//   ci/<unit>/witness_<unit>.mjs with a 40-hex ci/<unit>/BASE, or that touches nothing under ci/<unit>/, is REFUSED.
//   THE JUDGE-HELD REFUSAL (unit mlj, rows 1040 (2) F1 / 1043 (2) F1; spec ci/mlv0/PROOF.md FORK 1): while a judge round
//   holds keeper's JUDGE_PORT the verb (and its --dry) REFUSES JUDGE-HELD — read through keeper.mjs judgeHeld, the one
//   predicate every retire reads, as the LAST gate before the move. A wait, not a stop of his: the count is not reset.
// MODES:
//   node scripts/land.mjs <unit> [--dry] [--live <witness>]… [--names-gate <file>]   the verb (twelve steps)
//   node scripts/land.mjs <unit> --train-top <sha> [the verb's other flags]   C1-TRAIN: step 6 reads the verdict at <sha>
//   node scripts/land.mjs push <unit>                    L4: retry the push of a landing main already holds
//   node scripts/land.mjs count                          L2: landings since the last stop a human resolved
//   node scripts/land.mjs carry <witness> <H0> <H1> --green-at <sha>   the carry predicate (§3.1), a reader
//   node scripts/land.mjs reads-probe <witness> [-- <args>]            CR4: is the READS list true (opened ⊆ declared)?
// EXIT: 0 LANDED / DRY / CARRIES / VALID · 1 REFUSED · 3 STOP (his hand) · 4 PUSHED NO (main holds the landing)
// The witness of this organ is ci/mland/witness_mland.mjs (real git, a bare origin, every clause planted both ways).
// ============================================================================
import { spawnSync } from "node:child_process";
import { readFileSync, appendFileSync, existsSync, mkdtempSync, rmSync } from "node:fs";
import { join, dirname, relative, resolve, isAbsolute, posix } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import os from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const UNATTENDED_AFTER = 10;                     // row 1029 L2 — the architect's N, ruled, not chosen here
const STATE_PREFIX = "dressing-room/state/";
const SETTINGS_PATH = ".claude/settings.json";
const WITNESS_DIR = "ci/";   // F10 A (unit ms1, forks row 1066): every hermetic witness lives at ci/<unit>/
// the stops a HUMAN has to resolve (L2 counts landings since the last one); a wait (pending verdict, open sitting,
// main moved by a state push) is not a stop of his — it clears by itself or by the runner's next act
const HUMAN_STOPS = new Set(["DIRTY-PATH", "PUSH-REJECTED", "NOT-FF", "LOCAL-DIVERGED", "LIVE-RED", "TRIPWIRE"]);

/** @param {string[]} args @param {{ env?: Record<string,string>, cwd?: string }} [o] */
function git(args, o = {}) {
  const r = spawnSync("git", args, { cwd: o.cwd || ROOT, encoding: "utf8", windowsHide: true, env: o.env ? { ...process.env, ...o.env } : process.env, maxBuffer: 1 << 26 });
  return { ok: r.status === 0, out: String(r.stdout || "").trim(), err: String(r.stderr || "").trim() };
}
/** @param {string} script @param {string[]} args @param {Record<string,string>} [env] */
function node(script, args, env) {
  const r = spawnSync(process.execPath, [script, ...args], { cwd: ROOT, encoding: "utf8", windowsHide: true, env: env ? { ...process.env, ...env } : process.env, maxBuffer: 1 << 26 });
  const out = String(r.stdout || "") + String(r.stderr || "");
  const lines = out.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  return { code: r.status, out, last: lines[lines.length - 1] || "" };
}
const lines = (s) => String(s || "").split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
const sha = (ref) => { const r = git(["rev-parse", "--verify", "-q", `${ref}^{commit}`]); return r.ok ? r.out : null; };
const isAnc = (a, b) => git(["merge-base", "--is-ancestor", a, b]).ok;

// ── THE LEDGER (L2) — .git/land_ledger.jsonl, one row per attempt that is not --dry ───────────────────────────────
function ledgerPath() { const r = git(["rev-parse", "--git-path", "land_ledger.jsonl"]); return r.ok ? resolve(ROOT, r.out) : null; }
function record(row) { const p = ledgerPath(); if (p) { try { appendFileSync(p, JSON.stringify({ ts: new Date().toISOString(), ...row }) + "\n"); } catch { /* a ledger that cannot be written is named by count */ } } }
function countSince(rows) {
  let n = 0;
  for (const r of rows) { if (r.outcome === "LANDED") n++; else if (r.human) n = 0; }
  return n;
}
function readLedger() { const p = ledgerPath(); if (!p || !existsSync(p)) return []; return lines(readFileSync(p, "utf8")).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean); }
function countLine() {
  const n = countSince(readLedger());
  return `unattended ${n} of ${UNATTENDED_AFTER} landing(s) since the last stop a human resolved (row 1029 L2: unattended only at ${UNATTENDED_AFTER}) — ${n >= UNATTENDED_AFTER ? "READY for the architect's word" : "runner at his console"}`;
}

// ── STEP 11 — the stale units: an OS unit (setup/services, .mcp.json) whose static import closure holds a moved path ──
const IMPORT_RES = [/(?:^|[\s;])(?:import|export)\s[^;]*?\bfrom\s*["'](\.{1,2}\/[^"']+)["']/g, /\bimport\s*\(\s*["'](\.{1,2}\/[^"']+)["']\s*\)/g, /(?:^|[\s;])import\s*["'](\.{1,2}\/[^"']+)["']/g];
/** the OS units at a commit, read from the tree itself (never a typed list) @param {string} at */
function osUnits(at) {
  const units = [];
  for (const f of lines(git(["ls-tree", "--name-only", at, "setup/services/"]).out)) {
    const m = /ArsenalFC-([A-Za-z]+)\.(xml|logon\.ps1)$/.exec(f);
    if (!m) continue;
    const src = git(["show", `${at}:${f}`]).out;
    const e = m[2] === "xml" ? /<arguments>\s*scripts\/([\w.-]+\.mjs)/.exec(src) : /node scripts\\([\w.-]+\.mjs)/.exec(src);
    if (e) units.push({ unit: m[1], entry: `scripts/${e[1]}` });
  }
  const mcp = git(["show", `${at}:.mcp.json`]);
  if (mcp.ok) { try { for (const [name, s] of Object.entries(JSON.parse(mcp.out).mcpServers || {})) { const a = (/** @type {any} */ (s).args || []).map(String).find((x) => /scripts[\\/][\w.-]+\.mjs$/.test(x)); if (a) units.push({ unit: `mcp:${name}`, entry: `scripts/${/scripts[\\/]([\w.-]+\.mjs)$/.exec(a)[1]}` }); } } catch { /* an unparsable .mcp.json names no unit */ } }
  return units;
}
/** @param {string} at @param {string} entry */
function closure(at, entry) {
  const seen = new Set(), todo = [entry];
  while (todo.length) {
    const f = /** @type {string} */ (todo.pop());
    if (seen.has(f)) continue;
    const r = git(["show", `${at}:${f}`]);
    if (!r.ok) continue;
    seen.add(f);
    for (const re of IMPORT_RES) for (const m of r.out.matchAll(re)) todo.push(posix.normalize(posix.join(posix.dirname(f), m[1])));
  }
  return seen;
}
/** @param {string} at @param {string[]} touched */
function staleUnits(at, touched) {
  const t = new Set(touched), stale = [], keepers = [];
  for (const u of osUnits(at)) {
    const c = closure(at, u.entry);
    if (![...c].some((p) => t.has(p))) continue;
    const src = git(["show", `${at}:${u.entry}`]).out;
    (/from\s*["']\.\/keeper\.mjs["']/.test(src) ? keepers : stale).push(u.unit);
  }
  return { stale, keepers };
}

// ── STEP 7 — the sitting reader ────────────────────────────────────────────────────────────────────────────────
function sittingState() {
  const r = node(join(ROOT, "scripts", "sitting.mjs"), ["status"]);
  if (r.code !== 0) return "UNREADABLE";
  if (/\bOPEN\b/.test(r.out)) return "OPEN";
  if (/no open sitting|none open/.test(r.out)) return "CLOSED";
  return "UNREADABLE";
}
// ── STEP 6 — the neutral verdict AT T (C1: the sha judged is the sha landed) ─────────────────────────────────────────
function verdictAt(t) {
  const r = node(join(ROOT, "scripts", "ci_verdict.mjs"), [t]);
  const line = lines(r.out).find((l) => l.startsWith("ci_verdict ")) || r.last;
  const m = /^ci_verdict \S+ (GREEN|RED|PENDING|NONE|UNREADABLE)\b/.exec(line);
  const v = m ? m[1] : "UNREADABLE";
  const runs = [...line.matchAll(/\[run (\d+)\]/g)].map((x) => x[1]);
  if (v === "GREEN" && r.code === 0) return { ok: true, runs, line };
  return { ok: false, name: v === "RED" ? "VERDICT-RED" : v === "PENDING" || v === "NONE" ? "VERDICT-PENDING" : "VERDICT-UNREADABLE", line };
}
// ── Q4 — the campaign names gate, taken as an INPUT; fail closed ────────────────────────────────────────────────────
/** @param {string|null} file @param {string} t @param {string[]} added @param {string[]} touched */
function namesGate(file, t, added, touched) {
  const fresh = added.filter((p) => p.startsWith(WITNESS_DIR));
  if (!fresh.length) return { ok: true, why: "no new ci/ file" };
  if (!file) return { ok: false, why: `${fresh.length} new ci/ file(s) and no --names-gate result (fail closed)` };
  let g = null;
  try { g = JSON.parse(readFileSync(file, "utf8")); } catch { return { ok: false, why: "the names-gate result is unreadable" }; }
  if (!g || g.sha !== t) return { ok: false, why: "the names-gate result names another sha" };
  if (g.result !== "PASS") return { ok: false, why: `the names-gate result is ${g.result}` };
  const passed = new Set(Array.isArray(g.paths) ? g.paths : []);
  const miss = fresh.find((p) => !passed.has(p));
  if (miss) return { ok: false, why: `the names gate never ran over ${miss}` };
  if (typeof g.list_sha256 !== "string" || !/^[0-9a-f]{64}$/.test(g.list_sha256)) return { ok: false, why: "the names-gate result carries no list_sha256 (the names list can not be proved absent)" };
  for (const p of touched) {   // THE NAMES LIST NEVER ENTERS MAIN: no landed blob may BE the list
    const b = spawnSync("git", ["cat-file", "blob", `${t}:${p}`], { cwd: ROOT, windowsHide: true, maxBuffer: 1 << 26 });
    if (b.status === 0 && createHash("sha256").update(b.stdout).digest("hex") === g.list_sha256) return { ok: false, list: true, why: `${p} IS the names list` };
  }
  return { ok: true, why: `${fresh.length} new ci/ file(s) passed the names gate` };
}
// ── C1-TRAIN (row 1313 (1), unit mtrain) — the sha the verdict is read at, when a train top is named ────────────────────
/** the flag's own grammar: given at most once, as `--train-top <sha>` with a value @param {string[]} argv */
function trainTopArg(argv) {
  const at = argv.map((a, i) => (/^--train-top(=|$)/.test(a) ? i : -1)).filter((i) => i > -1);
  if (!at.length) return null;
  const v = argv[at[0] + 1];
  if (at.length > 1) return { bad: `--train-top given ${at.length} times — a train has one top` };
  if (argv[at[0]] !== "--train-top" || !v || v.startsWith("-") || !v.trim()) return { bad: "--train-top needs one sha after it (`--train-top <sha>`)" };
  return { raw: v };
}
/** TOP judges T iff T is TOP or on TOP's first-parent chain and every commit in T..TOP has one parent @param {string} T @param {string} raw */
function trainTop(T, raw) {
  const top = sha(raw);
  if (!top) return { ok: false, name: "TRAIN-TOP-UNRESOLVED", why: `--train-top ${raw} does not resolve to a commit here (fetch it first)` };
  if (top === T) return { ok: true, top };
  const chain = lines(git(["rev-list", "--first-parent", "--parents", top, `^${T}`]).out).map((l) => l.split(/\s+/));
  const oldest = chain[chain.length - 1];
  if (!oldest || oldest[1] !== T) return { ok: false, top, name: "TRAIN-TOP-NOT-DESCENDANT", why: `${top.slice(0, 7)} is not T or a descendant of T along first parents — the top's tree does not hold this car` };
  const merge = chain.find((c) => c.length !== 2);
  if (merge) return { ok: false, top, name: "TRAIN-TOP-MERGE", why: `${merge[0].slice(0, 7)} between T and the top has ${merge.length - 1} parents — a train is single-parent` };
  return { ok: true, top };
}

// ── THE VERB ─────────────────────────────────────────────────────────────────────────────────────────────────────
/** @param {string} unit @param {{ dry: boolean, live: string[], namesGate: string|null, trainTop?: { raw?: string, bad?: string } | null }} opt */
async function land(unit, opt) {
  // C1-TRAIN: the ledger row carries the top when the flag is given (resolved sha once known), and is today's row when not
  let topOf = opt.trainTop ? { train_top: opt.trainTop.raw ?? null } : {};
  /** @param {number} code @param {string} outcome @param {string} name @param {string} why @param {string|null} t */
  const stop = (code, outcome, name, why, t = null) => {
    if (!opt.dry) record({ unit, sha: t, outcome, name, human: HUMAN_STOPS.has(name), ...topOf });
    console.log(`${outcome} ${name} · ${unit}${t ? ` ${t.slice(0, 7)}` : ""} — ${why}`);
    return code;
  };
  if (!/^[a-z0-9-]+$/.test(unit)) return stop(1, "REFUSED", "BAD-UNIT", "a unit is [a-z0-9-]+");
  if (opt.trainTop && opt.trainTop.bad) return stop(1, "REFUSED", "TRAIN-TOP-FLAG", opt.trainTop.bad);
  const br = `land/${unit}`;
  // 1 · fetch
  if (!git(["fetch", "-q", "origin", "main", br]).ok) return stop(1, "REFUSED", "NO-FETCH", `origin main + ${br} could not be read`);
  // 2 · T, P, M, O
  const T = sha(`refs/remotes/origin/${br}`);
  if (!T) return stop(1, "REFUSED", "NO-BRANCH", `origin/${br} does not exist`);
  const parents = git(["rev-list", "--parents", "-n", "1", T]).out.split(/\s+/).slice(1);
  if (parents.length !== 1) return stop(1, "REFUSED", "MERGE-COMMIT", `T has ${parents.length} parents`, T);
  const P = parents[0], M = sha("refs/heads/main"), O = sha("refs/remotes/origin/main");
  if (!M || !O) return stop(1, "REFUSED", "NO-MAIN", "refs/heads/main or origin/main is missing", T);
  if (git(["symbolic-ref", "-q", "HEAD"]).out !== "refs/heads/main") return stop(1, "REFUSED", "NOT-ON-MAIN", "his tree must have main checked out (the ff happens there)", T);
  // 4 · exactly one commit (L3) — read before the heads, so a two-commit branch is named as itself
  const n = Number(git(["rev-list", "--count", `${O}..${T}`]).out || "0");
  if (n !== 1) return stop(1, "REFUSED", "MULTI-COMMIT", `${n} commits in origin/main..T — a landing is exactly one`, T);
  // 3 · M == O == P (row 1023)
  if (M !== O) {
    if (isAnc(O, M)) return stop(1, "REFUSED", "LOCAL-AHEAD", "his main holds commits origin lacks (a refused state push? the groundsman meets origin first)", T);
    if (isAnc(M, O)) return stop(1, "REFUSED", "LOCAL-BEHIND", "his main is behind origin — pull first", T);
    return stop(1, "REFUSED", "LOCAL-DIVERGED", "his main and origin have diverged — his word", T);
  }
  if (O !== P) return stop(1, "REFUSED", "MAIN-MOVED", `origin/main ${O.slice(0, 7)} is not T's parent ${P.slice(0, 7)} — rebuild the branch on origin and judge it again (row 1023)`, T);
  // 5 · the paths
  const touched = lines(git(["diff-tree", "--no-commit-id", "-r", "--name-only", "--no-renames", P, T]).out);
  const added = lines(git(["diff-tree", "--no-commit-id", "-r", "--name-only", "--no-renames", "--diff-filter=A", P, T]).out);
  const st = touched.find((p) => p.startsWith(STATE_PREFIX));
  if (st) return stop(1, "REFUSED", "STATE-PATH", `${st} — state reaches origin by the groundsman only`, T);
  if (touched.includes(SETTINGS_PATH)) return stop(1, "REFUSED", "SETTINGS-PATH", `${SETTINGS_PATH} never lands`, T);
  // 5 · NO-CI-DIR (unit ms1 · row 1066 F7 A): the law binds from the landing that put the first ci/<unit>/BASE on main —
  //   from then every landing carries its unit's witness and BASE, so its proof rides the suite as a standing gate
  if (lines(git(["ls-tree", "-r", "--name-only", P, "--", "ci"]).out).some((p) => /^ci\/[a-z0-9-]+\/BASE$/.test(p))) {
    const b = `ci/${unit}/BASE`;
    const has = (p) => git(["cat-file", "-e", `${T}:${p}`]).ok;
    const w = [`ci/${unit}/witness_${unit}.mjs`, `ci/${unit}/witness_${unit.replace(/-/g, "_")}.mjs`].find(has) || `ci/${unit}/witness_${unit}.mjs`;
    const baseOk = has(b) && /^[0-9a-f]{40}$/.test(git(["cat-file", "blob", `${T}:${b}`]).out);
    if (!has(w) || !baseOk || !touched.some((p) => p.startsWith(`ci/${unit}/`)))
      return stop(1, "REFUSED", "NO-CI-DIR", `a landing carries ${w} and a 40-hex ${b}, and touches ci/${unit}/`, T);
  }
  const idx = join(mkdtempSync(join(os.tmpdir(), "land-index-")), "index");
  try {
    const rt = git(["read-tree", T], { env: { GIT_INDEX_FILE: idx } });
    const tw = rt.ok ? node(join(ROOT, "scripts", "archivist.mjs"), ["tripwire"], { GIT_INDEX_FILE: idx }) : { code: 1, last: "the range could not be read into a private index" };
    if (tw.code !== 0) return stop(1, "REFUSED", "TRIPWIRE", tw.last, T);
  } finally { rmSync(dirname(idx), { recursive: true, force: true }); }
  const ng = namesGate(opt.namesGate, T, added, touched);
  if (!ng.ok) return stop(1, "REFUSED", ng.list ? "NAMES-LIST-PATH" : "NAMES-GATE-ABSENT", ng.why, T);
  // 6 · the verdict at T — or, under C1-TRAIN, at the train top above it (row 1313 (1))
  const tt = opt.trainTop ? trainTop(T, /** @type {string} */ (opt.trainTop.raw)) : null;
  if (tt && tt.top) topOf = { train_top: tt.top };
  if (tt && !tt.ok) return stop(1, "REFUSED", /** @type {string} */ (tt.name), /** @type {string} */ (tt.why), T);
  const v = verdictAt(tt ? /** @type {string} */ (tt.top) : T);
  if (!v.ok) return stop(1, "REFUSED", /** @type {string} */ (v.name), v.line, T);
  // 7 · no sitting open
  const s = sittingState();
  if (s === "OPEN") return stop(1, "REFUSED", "SITTING-OPEN", "a sitting is open — land between sittings", T);
  if (s !== "CLOSED") return stop(1, "REFUSED", "SITTING-UNREADABLE", "sitting.mjs status could not be read", T);
  // 8 · the LIVE witnesses, one process each, at T's bytes in a SHARED CLONE (never git worktree add)
  if (opt.live.length) {
    const tmp = mkdtempSync(join(os.tmpdir(), `land-${unit}-`));
    try {
      const at = (rev, d) => git(["clone", "-q", "--shared", "--no-checkout", ROOT, d], { cwd: tmp }).ok && git(["checkout", "-q", "--detach", rev], { cwd: d }).ok;
      const dT = join(tmp, "T"), dP = join(tmp, "P");
      if (!at(T, dT) || !at(P, dP)) return stop(1, "REFUSED", "LIVE-RED", "the shared clones at T and its parent could not be made", T);
      for (const w of opt.live) {
        const r = node(resolve(w), ["--org", dT, "--base-org", dP]);
        if (r.code !== 0 || !/^GREEN\b/.test(r.last)) return stop(3, "STOP", "LIVE-RED", `${w}: ${r.last}`, T);
      }
    } finally { rmSync(tmp, { recursive: true, force: true }); }
  }
  // 8½ · NO JUDGE ROUND RUNNING (unit mlj · rows 1040 (2) F1 / 1043 (2) F1): the move rewrites bytes a running round reads,
  //   so it waits. Read LAST, after every other gate and right before the move (a round that opened while the checks above
  //   ran is still caught), and for --dry too. Not in HUMAN_STOPS (row 1043 (2) F4): the round's close clears it.
  //   keeper is imported HERE, not at load, so count / carry / push never depend on it; a keeper that cannot answer is
  //   a refusal (fail closed), never a landing.
  let jh;
  try { const k = await import("./keeper.mjs"); jh = { held: await k.judgeHeld(), port: k.JUDGE_PORT }; }
  catch (e) { return stop(1, "REFUSED", "JUDGE-UNREADABLE", `keeper.mjs judgeHeld could not be read (${String((e && e.message) || e).split(/\r?\n/)[0]}) — fail closed`, T); }
  if (jh.held) return stop(1, "REFUSED", "JUDGE-HELD", `a judge round holds :${jh.port} — land when it closes`, T);
  // 11 (read before the move, printed after) — acts + stale units; nothing is restarted, nothing is installed
  const acts = touched.includes("package-lock.json") ? ["npm ci"] : [];
  const su = staleUnits(T, touched);
  if (opt.dry) { console.log(`DRY ${unit} ${T.slice(0, 7)} · every check passed · would ff main ${P.slice(0, 7)}→${T.slice(0, 7)} · acts ${acts.join(", ") || "none"} · stale units ${su.stale.join(", ") || "none"}`); return 0; }
  // 9 · the fast-forward IN HIS TREE — his dirty files are other paths and stay; a dirty named path is HIS stop
  const ff = git(["merge", "--ff-only", "-q", T]);
  if (!ff.ok) {
    const dirty = new Set([...lines(git(["diff", "--name-only", "HEAD"]).out), ...lines(git(["ls-files", "--others", "--exclude-standard"]).out)]);
    const p = touched.find((x) => dirty.has(x));
    if (p) return stop(3, "STOP", "DIRTY-PATH", `${p} is dirty here and T changes it — no stash, no force; his word`, T);
    return stop(3, "STOP", "NOT-FF", ff.err.split(/\r?\n/)[0] || "git refused the fast-forward", T);
  }
  // 10 · push, never --force; L4: on a rejection main STAYS at T and the push is retried
  let pushed = git(["push", "-q", "origin", "refs/heads/main:refs/heads/main"]).ok;
  if (!pushed && git(["fetch", "-q", "origin", "main"]).ok && sha("refs/remotes/origin/main") === P) pushed = git(["push", "-q", "origin", "refs/heads/main:refs/heads/main"]).ok;
  if (!pushed) {
    node(join(ROOT, "scripts", "captains_call.mjs"), ["file", "--line", `Landing ${unit} (${T.slice(0, 7)}) local main par hai, origin ne push nahi liya. Runner: node scripts/land.mjs push ${unit}`, "--key", `land:${unit}:push`]);
    return stop(4, "PUSHED NO", "PUSH-REJECTED", `main stays at ${T.slice(0, 7)} (L4); retry: node scripts/land.mjs push ${unit}`, T);
  }
  record({ unit, sha: T, outcome: "LANDED", name: "LANDED", human: false, ...topOf });
  // 12 · ONE line
  console.log(`LANDED ${unit} ${T.slice(0, 7)} · verdict ${v.runs.join(" ") || "GREEN"} · acts ${acts.length ? acts.join(", ") + " (printed, not run)" : "none"} · stale units ${su.stale.join(", ") || "none"}${su.keepers.length ? ` · keepers retire themselves: ${su.keepers.join(", ")}` : ""} · ${countLine()}`);
  return 0;
}

/** L4 — the push retry for a landing main already holds @param {string} unit */
function pushRetry(unit) {
  if (!/^[a-z0-9-]+$/.test(unit)) { console.log("REFUSED BAD-UNIT"); return 1; }
  if (!git(["fetch", "-q", "origin", "main", `land/${unit}`]).ok) { console.log(`REFUSED NO-FETCH · ${unit}`); return 1; }
  const T = sha(`refs/remotes/origin/land/${unit}`), M = sha("refs/heads/main"), O = sha("refs/remotes/origin/main");
  if (!T || M !== T) { console.log(`REFUSED NOT-LANDED · ${unit} — his main is not the landing's tip`); return 1; }
  if (O === T) { console.log(`PUSHED ${unit} ${T.slice(0, 7)} · origin already holds it`); return 0; }
  if (O !== git(["rev-parse", `${T}^1`]).out) { console.log(`STOP ORIGIN-MOVED · ${unit} ${T.slice(0, 7)} — origin moved past the parent; the landing can not reach it as judged (row 1023): his word`); return 3; }
  if (!git(["push", "-q", "origin", "refs/heads/main:refs/heads/main"]).ok) { console.log(`PUSHED NO PUSH-REJECTED · ${unit} ${T.slice(0, 7)} — main stays; retry later`); return 4; }
  record({ unit, sha: T, outcome: "LANDED", name: "PUSH-RETRIED", human: false });
  console.log(`PUSHED ${unit} ${T.slice(0, 7)} · the L4 retry reached origin · ${countLine()}`);
  return 0;
}

// ── THE CARRY RULE (§3.1, C2) — a reader; the verb never uses it to skip the verdict (C1) ───────────────────────────
/** the READS list of a witness, from its header comment block @param {string} src @param {string|null} self */
function readsOf(src, self) {
  const out = [];
  for (const l of String(src).split(/\r?\n/)) {
    if (/^\s*$/.test(l) || /^#!/.test(l)) continue;
    if (!/^\s*\/\//.test(l)) break;                          // the header ends at the first line of code
    const m = /^\s*\/\/\s*READS:\s*(.*?)\s*$/.exec(l);
    if (!m) continue;
    const p = m[1];
    if (!p || /[*?[\]\\]/.test(p) || p.split("/").includes("..") || p.startsWith("/") || /^[A-Za-z]:/.test(p) || /\s/.test(p)) return { valid: false, reads: [], why: `INVALID LIST line '${p}'` };
    out.push(p);
  }
  if (!out.length) return { valid: false, reads: [], why: "no READS line — a witness with no declared list never carries" };
  if (self) out.push(self);
  return { valid: true, reads: out, why: `${out.length} declared` };
}
const hits = (p, r) => (r.endsWith("/") ? p.startsWith(r) : p === r);
/** @param {string} w @param {string} h0 @param {string} h1 @param {string|null} greenAt */
function carry(w, h0, h1, greenAt) {
  const abs = resolve(w), rel = relative(ROOT, abs).split("\\").join("/");
  const self = !rel.startsWith("..") && !isAbsolute(rel) ? rel : null;
  let src = ""; try { src = readFileSync(abs, "utf8"); } catch { console.log(`NO-CARRY · ${w} unreadable`); return 1; }
  const r = readsOf(src, self);
  if (!r.valid) { console.log(`NO-CARRY · ${r.why}`); return 1; }
  const H0 = sha(h0), H1 = sha(h1), G = greenAt ? sha(greenAt) : null;
  if (!H0 || !H1) { console.log("NO-CARRY · H0 or H1 does not resolve"); return 1; }
  if (!G || G !== H0) { console.log(`NO-CARRY · the witness is not GREEN at H0 (--green-at ${greenAt || "absent"})`); return 1; }
  if (!isAnc(H0, H1)) { console.log("NO-CARRY · H0 is not an ancestor of H1"); return 1; }
  const touched = new Set(lines(git(["log", "--no-renames", "--format=", "--name-only", `${H0}..${H1}`]).out));   // PER COMMIT: a revert never hides a touch
  const hit = [...touched].find((p) => r.reads.some((x) => hits(p, x)));
  if (hit) { console.log(`NO-CARRY · ${hit} is touched in H0..H1 and read by the witness`); return 1; }
  console.log(`CARRIES · ${touched.size} touched path(s) in ${H0.slice(0, 7)}..${H1.slice(0, 7)}, none read (${r.why})`);
  return 0;
}
// ── CR4 — the READS list is TRUE: every repo path the witness opens is declared (an fs probe preloaded) ────────────
const PROBE = `import fs from "node:fs"; import { syncBuiltinESMExports } from "node:module"; import { fileURLToPath } from "node:url";
const seen = new Set(); const wr = fs.appendFileSync; const out = process.env.LAND_PROBE_OUT;
const keep = (p) => { try { if (typeof p === "string") seen.add(p); else if (p instanceof URL) seen.add(fileURLToPath(p)); else if (Buffer.isBuffer(p)) seen.add(p.toString()); } catch {} };
for (const k of ["readFileSync", "openSync", "readdirSync", "statSync", "lstatSync", "existsSync", "createReadStream", "readFile", "open", "readdir", "stat", "access", "accessSync"]) { const o = fs[k]; if (typeof o !== "function") continue; fs[k] = function (p, ...r) { keep(p); return o.call(this, p, ...r); }; }
for (const k of ["readFile", "open", "readdir", "stat", "access"]) { const o = fs.promises[k]; fs.promises[k] = function (p, ...r) { keep(p); return o.call(this, p, ...r); }; }
syncBuiltinESMExports();
process.on("exit", () => { try { wr(out, [...seen].join("\\n") + "\\n"); } catch {} });`;
/** @param {string} w @param {string[]} args */
function readsProbe(w, args) {
  const abs = resolve(w), rel = relative(ROOT, abs).split("\\").join("/");
  const self = !rel.startsWith("..") && !isAbsolute(rel) ? rel : null;
  const r = readsOf(readFileSync(abs, "utf8"), self);
  if (!r.valid) { console.log(`INVALID LIST · ${r.why}`); return 1; }
  const dir = mkdtempSync(join(os.tmpdir(), "land-probe-")), outFile = join(dir, "opened.txt");
  try {
    spawnSync(process.execPath, ["--import", "data:text/javascript," + encodeURIComponent(PROBE), abs, ...args], { cwd: ROOT, encoding: "utf8", windowsHide: true, env: { ...process.env, LAND_PROBE_OUT: outFile } });
    const opened = existsSync(outFile) ? lines(readFileSync(outFile, "utf8")) : [];
    const inRepo = [...new Set(opened.map((p) => relative(ROOT, resolve(ROOT, p)).split("\\").join("/")))]
      .filter((p) => p && !p.startsWith("..") && !isAbsolute(p) && !p.startsWith(".git/") && p !== ".git" && !p.startsWith("node_modules/"));
    const undeclared = inRepo.filter((p) => !r.reads.some((x) => hits(p, x) || (x.endsWith("/") && p === x.slice(0, -1))));
    if (undeclared.length) { console.log(`INVALID LIST · opened ${undeclared[0]} which no READS line declares (${undeclared.length} undeclared)`); return 1; }
    console.log(`VALID LIST · ${inRepo.length} repo path(s) opened, all declared`);
    return 0;
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

function main() {
  const argv = process.argv.slice(2), mode = argv[0] || "";
  const flag = (k) => { const i = argv.indexOf(k); return i > -1 ? argv[i + 1] : null; };
  if (mode === "count") { console.log(countLine()); return 0; }
  if (mode === "push") return pushRetry(argv[1] || "");
  if (mode === "carry") return carry(argv[1], argv[2], argv[3], flag("--green-at"));
  if (mode === "reads-probe") { const i = argv.indexOf("--"); return readsProbe(argv[1], i > -1 ? argv.slice(i + 1) : []); }
  if (!mode || mode.startsWith("-") || mode === "help") { console.log("land.mjs <unit> [--dry] [--live <witness>]… [--names-gate <file>] | push <unit> | count | carry <witness> <H0> <H1> --green-at <sha> | reads-probe <witness> [-- args]"); return mode ? 0 : 2; }
  const live = []; argv.forEach((a, i) => { if (a === "--live" && argv[i + 1]) live.push(argv[i + 1]); });
  return land(mode, { dry: argv.includes("--dry"), live, namesGate: flag("--names-gate"), trainTop: trainTopArg(argv) });
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) Promise.resolve(main()).then((c) => { process.exitCode = c; });
