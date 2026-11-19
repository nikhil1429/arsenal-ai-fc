#!/usr/bin/env node
// ============================================================================
// ci/mgs/witness_mgs.mjs · unit mgs (forks row 1087 (3)) — THE LAND WAIT, witnessed on real git.
// CONTRACT (this header IS the contract):
//   node ci/mgs/witness_mgs.mjs --org <dir> --base-org <dir>
//   · imports <dir>/scripts/groundsman.mjs (a fresh module instance per clause per tree) and drives its exported
//     pushOnlyPass / nightPass with an injected exec: every `git` call runs for real inside a planted clone; every
//     `node` call the groundsman makes (awayday check, captains_call file, brain tick) is PLANTED (answers "", runs
//     nothing) — no organ, no model, no state file of his is ever reached.
//   · every plant lives under os.tmpdir(): ONE local bare origin per clause (git init --bare), clones made with
//     core.autocrlf=false at clone, land refs pushed to it as refs/heads/land/<name>. GIT_CONFIG_GLOBAL is a planted
//     file and GIT_CONFIG_NOSYSTEM=1, so no hook, credential helper or remote of the host reaches the plant. No URL
//     but a local path is ever used: the witness never reaches a real remote, binds NO port, POSTs nothing, restarts
//     nothing. Waits: only local git calls with stdin closed and GIT_TERMINAL_PROMPT=0; no sleep, no poll.
//   · a state file is written in a plant only by node fs (never by a shell), and only under the temp tree.
//   · CRLF-proof: every read is split on /\r?\n/, every write is "\n", no POSIX-only shell is spawned.
// READS: <org>/scripts/groundsman.mjs · <base-org>/scripts/groundsman.mjs (and what they import) · os.tmpdir()
// CLAUSES (each run on --base-org, then on --org): a "gate" clause must be RED on the base and GREEN on the org; a
//   "keep" clause (what the unit must NOT change) must be GREEN on both.
//   C1 HOLD      gate · two judged land refs (tips not ancestors of origin main) + a dirty state file → the unattended
//                push stages nothing, commits nothing, pushes nothing; ONE line (no newline) names BOTH refs.
//   C2 ANCESTOR  gate · a landed land ref (an ancestor of origin main) beside a judged one → the line names only the
//                judged one; and with the landed ref alone the push goes out.
//   C3 STALE     gate · a judged ref whose tip is older than the declared LAND_HOLD_MAX_H (slack = a node start
//                measured in this run) beside a fresh judged ref → the fresh one holds, the old one is named STALE and
//                does not; with the old ref alone the push goes out and the line still names it STALE.
//   C4 NEXT      gate · pass 1 holds; the land ref lands (origin main fast-forwards to its tip); pass 2, the SAME module
//                instance, pushes the state change on top of the landed sha.
//   C5 LANDED    keep · land.mjs's L4 shape: his main fast-forwarded to a land tip origin lacks → the push lands that
//                exact sha on origin main (the sha judged is the sha landed), as before this unit.
//   C6 NO-READ   gate · origin's land refs cannot be read (ls-remote planted to fail) → named idle, nothing pushed.
//   C7 KENNEL    gate · the Kennel's nightPass carries the same hold after its (planted) tick: nothing pushed.
//   LAST         no process naming the temp root survives (scanned on /proc; on win32 by Win32_Process).
// EXIT: 0 + last line `GREEN MGS land wait · <n> clause(s)` · 1 + last line `RED MGS · <clauses>`.
// ============================================================================
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import os from "node:os";

const arg = (k) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : null; };
const ORG = arg("--org"), BASE = arg("--base-org");
if (!ORG || !BASE) { console.log("RED MGS · usage: --org <dir> --base-org <dir>"); process.exit(1); }

const ROOT = mkdtempSync(join(os.tmpdir(), "mgs-witness-"));
const GCFG = join(ROOT, "gitconfig");
writeFileSync(GCFG, "[user]\n\tname = witness\n\temail = witness@example.invalid\n[core]\n\tautocrlf = false\n[init]\n\tdefaultBranch = main\n[protocol \"file\"]\n\tallow = always\n");
const ENV = { ...process.env, GIT_CONFIG_GLOBAL: GCFG, GIT_CONFIG_NOSYSTEM: "1", GIT_TERMINAL_PROMPT: "0", GIT_ASKPASS: "", SSH_ASKPASS: "" };
for (const k of Object.keys(ENV)) if (/^GIT_(DIR|WORK_TREE|INDEX_FILE|COMMITTER_DATE|AUTHOR_DATE)$/.test(k)) delete ENV[k];
const NL = "\n";
const lines = (s) => String(s || "").split(/\r?\n/).map((x) => x.trim()).filter(Boolean);

function g(cwd, args, extra = {}) {
  return execFileSync("git", args, { cwd, encoding: "utf8", windowsHide: true, stdio: ["ignore", "pipe", "pipe"], env: { ...ENV, ...extra } }).trim();
}
const tryG = (cwd, args) => { try { return { ok: true, out: g(cwd, args) }; } catch (e) { return { ok: false, out: String(e.message) }; } };

// the slack for the clock-bound plant: a node start measured in THIS run (never a typed ratio)
const t0 = Date.now(); spawnSync(process.execPath, ["-e", ""], { stdio: "ignore", windowsHide: true }); const SLACK_MS = Date.now() - t0;

// ── THE PLANT ────────────────────────────────────────────────────────────────
let seq = 0;
function plant() {
  const dir = join(ROOT, `p${++seq}`); mkdirSync(dir, { recursive: true });
  const origin = join(dir, "origin.git");
  g(dir, ["init", "-q", "--bare", origin]);
  g(origin, ["config", "core.autocrlf", "false"]);
  const seed = join(dir, "seed");
  g(dir, ["-c", "core.autocrlf=false", "clone", "-q", origin, seed]);
  mkdirSync(join(seed, "dressing-room", "state"), { recursive: true }); mkdirSync(join(seed, "scripts"), { recursive: true });
  writeFileSync(join(seed, "dressing-room", "state", "w.json"), '{"n":0}' + NL);
  writeFileSync(join(seed, "scripts", "m.txt"), "machinery 0" + NL);
  g(seed, ["add", "-A"]); g(seed, ["commit", "-q", "-m", "seed"]); g(seed, ["push", "-q", "origin", "HEAD:refs/heads/main"]);
  const lap = join(dir, "laptop");
  g(dir, ["-c", "core.autocrlf=false", "clone", "-q", "-b", "main", origin, lap]);
  let k = 0;
  const P = {
    dir, origin, seed, lap,
    main: () => g(origin, ["rev-parse", "refs/heads/main"]),
    // a land branch CUT on origin main: one machinery commit, pushed to refs/heads/land/<name>; ageMs back-dates the cut
    cut(name, ageMs = 0) {
      g(seed, ["fetch", "-q", "origin", "main"]); g(seed, ["checkout", "-q", "-B", `cut-${name}`, "FETCH_HEAD"]);
      writeFileSync(join(seed, "scripts", "m.txt"), `machinery ${name} ${++k}` + NL);
      g(seed, ["add", "-A"]);
      const extra = ageMs ? { GIT_COMMITTER_DATE: `${Math.floor((Date.now() - ageMs) / 1000)} +0000`, GIT_AUTHOR_DATE: `${Math.floor((Date.now() - ageMs) / 1000)} +0000` } : {};
      g(seed, ["commit", "-q", "-m", `unit ${name}: the build`], extra);
      g(seed, ["push", "-q", "origin", `HEAD:refs/heads/land/${name}`]);
      return g(seed, ["rev-parse", "HEAD"]);
    },
    // the landing: origin main fast-forwards to the land tip (what land.mjs's push does)
    land(name) { g(seed, ["fetch", "-q", "origin", `land/${name}`]); return tryG(seed, ["push", "-q", "origin", "FETCH_HEAD:refs/heads/main"]); },   // refused = not a fast-forward: the 19 Nov shape
    dirty(n) { writeFileSync(join(lap, "dressing-room", "state", "w.json"), `{"n":${n}}` + NL); },
    head: () => g(lap, ["rev-parse", "HEAD"]),
    exec(fault = {}) {
      const calls = [];
      const ex = (c, a, x) => {
        calls.push(c + " " + a.join(" "));
        if (c === "node") return "";                                   // planted: no organ runs, no model is called
        if (c !== "git") throw new Error(`unplanted command ${c}`);
        if (fault[a[0]]) throw new Error(`planted fault: git ${a[0]} could not reach origin`);
        return execFileSync("git", a, { cwd: lap, encoding: "utf8", windowsHide: true, stdio: ["ignore", "pipe", "pipe"], env: { ...ENV, ...(x || {}) } });
      };
      return { calls, deps: { exec: ex, env: ENV, dayInfo: { day: "2026-01-01", source: "witness", why: "planted" } } };
    },
  };
  return P;
}

const mods = new Map();
async function load(tree, tag) {
  const url = pathToFileURL(resolve(tree, "scripts", "groundsman.mjs")).href + `?mgs=${tag}`;
  if (!mods.has(url)) mods.set(url, await import(url));
  return mods.get(url);
}
const AGE_H = await (async () => { try { const m = await import(pathToFileURL(resolve(ORG, "scripts", "groundsman.mjs")).href + "?mgs=age"); return Number(m.LAND_HOLD_MAX_H); } catch { return NaN; } })();

// ── THE CLAUSES — each returns [ok, detail] for ONE tree ──────────────────────
const say = (r) => String((r && (r.why || "")) + (r && r.land_line ? " · " + r.land_line : ""));
const noPush = (r, P, m0, h0) => r.pushed === false && P.main() === m0 && P.head() === h0 && tryG(P.lap, ["diff", "--cached", "--quiet"]).ok;
const CLAUSES = [
  ["C1 HOLD", "gate", async (G, tag) => {
    const P = plant(); P.cut("u1"); P.cut("u2"); P.dirty(1);
    const m0 = P.main(), h0 = P.head(), { deps } = P.exec();
    const r = await G.pushOnlyPass("laptop", deps);
    const w = say(r);
    return [noPush(r, P, m0, h0) && r.idle === "LAND-WAIT" && /land\/u1/.test(w) && /land\/u2/.test(w) && !/[\r\n]/.test(w), `pushed=${r.pushed} idle=${r.idle} line="${w.slice(0, 160)}"`];
  }],
  ["C2 ANCESTOR", "gate", async (G) => {
    const P = plant(); P.cut("old"); if (!P.land("old").ok) throw new Error("plant: land/old did not land"); g(P.lap, ["pull", "-q", "--ff-only"]); P.cut("new"); P.dirty(2);
    const m0 = P.main(), h0 = P.head();
    const r = await G.pushOnlyPass("laptop", P.exec().deps), w = say(r);
    const a = noPush(r, P, m0, h0) && /land\/new/.test(w) && !/land\/old/.test(w);
    const Q = plant(); Q.cut("old"); if (!Q.land("old").ok) throw new Error("plant: land/old did not land"); Q.dirty(3);
    const q0 = Q.main(), r2 = await G.pushOnlyPass("laptop", Q.exec().deps);
    const b = r2.pushed === true && Q.main() !== q0 && !/land\/old/.test(say(r2));
    return [a && b, `with-judged: pushed=${r.pushed} line="${w.slice(0, 120)}" · landed-alone: pushed=${r2.pushed} why="${say(r2).slice(0, 80)}"`];
  }],
  ["C3 STALE", "gate", async (G) => {
    if (!Number.isFinite(AGE_H) || AGE_H <= 0) return [false, `no declared age: LAND_HOLD_MAX_H=${AGE_H}`];
    const old = AGE_H * 3600e3 + SLACK_MS + 1000;                      // past the age by a measured node start + the 1 s floor of a commit date
    const P = plant(); P.cut("aged", old); P.cut("fresh"); P.dirty(4);
    const m0 = P.main(), h0 = P.head();
    const r = await G.pushOnlyPass("laptop", P.exec().deps), w = say(r);
    const held = (w.split("STALE")[0] || "");
    const a = noPush(r, P, m0, h0) && /land\/fresh/.test(held) && !/land\/aged/.test(held) && /STALE[^·]*land\/aged/.test(w) && (r.land || []).join() === "land/fresh";
    const Q = plant(); Q.cut("aged", old); Q.dirty(5);
    const q0 = Q.main(), r2 = await G.pushOnlyPass("laptop", Q.exec().deps), w2 = say(r2);
    const b = r2.pushed === true && Q.main() !== q0 && /STALE[^·]*land\/aged/.test(w2);
    return [a && b, `age=${AGE_H}h slack=${SLACK_MS}ms · with-fresh: pushed=${r.pushed} line="${w.slice(0, 140)}" · aged-alone: pushed=${r2.pushed} line="${w2.slice(0, 100)}"`];
  }],
  ["C4 NEXT", "gate", async (G) => {
    const P = plant(); const tip = P.cut("u"); P.dirty(6);
    const m0 = P.main(), h0 = P.head(), { deps } = P.exec();
    const r1 = await G.pushOnlyPass("laptop", deps);
    const a = noPush(r1, P, m0, h0) && r1.idle === "LAND-WAIT";
    const landed = P.land("u").ok;
    if (!landed) return [false, `pass1: pushed=${r1.pushed} idle=${r1.idle} · the judged land tip can no longer land: origin refused the fast-forward (main moved under the cut)`];
    const r2 = await G.pushOnlyPass("laptop", deps);
    const after = P.main(), parent = tryG(P.origin, ["rev-parse", `${after}^`]).out;
    const shown = tryG(P.origin, ["show", `${after}:dressing-room/state/w.json`]).out;
    const b = r2.pushed === true && parent === tip && /"n":6/.test(shown);
    return [a && b, `pass1: pushed=${r1.pushed} idle=${r1.idle} · pass2: pushed=${r2.pushed} parent-is-land-tip=${parent === tip} state-on-origin=${/"n":6/.test(shown)}`];
  }],
  ["C5 LANDED", "keep", async (G) => {
    const P = plant(); const tip = P.cut("u");
    g(P.lap, ["fetch", "-q", "origin", "main", "land/u"]); g(P.lap, ["merge", "-q", "--ff-only", "refs/remotes/origin/land/u"]);   // land.mjs L4: main holds the landing, origin does not
    const r = await G.pushOnlyPass("laptop", P.exec().deps);
    return [r.pushed === true && P.main() === tip && !r.refused, `pushed=${r.pushed} origin-main-is-land-tip=${P.main() === tip} why="${say(r).slice(0, 100)}"`];
  }],
  ["C6 NO-READ", "gate", async (G) => {
    const P = plant(); P.cut("u"); P.dirty(7);
    const m0 = P.main(), h0 = P.head();
    const r = await G.pushOnlyPass("laptop", P.exec({ "ls-remote": true }).deps), w = say(r);
    return [noPush(r, P, m0, h0) && /^NO-/.test(String(r.idle || "")) && /idle NO-/.test(w), `pushed=${r.pushed} idle=${r.idle} line="${w.slice(0, 120)}"`];
  }],
  ["C7 KENNEL", "gate", async (G) => {
    const P = plant(); P.cut("u"); P.dirty(8);
    const m0 = P.main(), h0 = P.head(), { deps, calls } = P.exec();
    const lease = { holder: "laptop", host_id: "lap1", ts: new Date(Date.now() - 365 * 864e5).toISOString(), ttl_min: 1 };
    const r = await G.nightPass("pi1", { ...deps, read: () => lease, write: () => {} });
    return [r.ticked === true && noPush(r, P, m0, h0) && r.idle === "LAND-WAIT" && calls.some((c) => c.includes("brain.mjs")), `ticked=${r.ticked} pushed=${r.pushed} idle=${r.idle} line="${say(r).slice(0, 100)}"`];
  }],
];

// ── RUN: every clause on the base, then on the org ─────────────────────────────
const red = [];
let n = 0;
for (const [name, kind, fn] of CLAUSES) {
  const out = {};
  for (const [which, tree] of [["base", BASE], ["org", ORG]]) {
    try { const G = await load(tree, `${name.split(" ")[0]}-${which}`); out[which] = await fn(G, which); }
    catch (e) { out[which] = [false, `threw: ${String(e.message).split(/\r?\n/)[0].slice(0, 160)}`]; }
  }
  const pass = kind === "gate" ? (!out.base[0] && out.org[0]) : (out.base[0] && out.org[0]);
  n++;
  console.log(`${pass ? "GREEN" : "RED  "} ${name} [${kind}] · base ${out.base[0] ? "GREEN" : "RED"} — ${out.base[1]}`);
  console.log(`      ${" ".repeat(name.length)}         · org  ${out.org[0] ? "GREEN" : "RED"} — ${out.org[1]}`);
  if (!pass) red.push(name.split(" ")[0]);
}

// ── LAST: no process naming the temp root survives ────────────────────────────
function survivors() {
  if (existsSync("/proc")) {
    const hits = [];
    for (const pid of readdirSync("/proc").filter((p) => /^\d+$/.test(p))) {
      if (Number(pid) === process.pid) continue;
      try { const cl = readFileSync(`/proc/${pid}/cmdline`, "utf8").split("\0").join(" "); if (cl.includes(ROOT)) hits.push(`${pid} ${cl.slice(0, 80)}`); } catch {}
    }
    return { ok: hits.length === 0, how: "/proc", hits };
  }
  if (process.platform === "win32") {
    const r = spawnSync("powershell", ["-NoProfile", "-NonInteractive", "-Command", "Get-CimInstance Win32_Process | ForEach-Object { $_.ProcessId.ToString() + ' ' + $_.CommandLine }"], { encoding: "utf8", windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
    if (r.status !== 0) return { ok: false, how: "Win32_Process (unreadable)", hits: [] };
    const hits = lines(r.stdout).filter((l) => l.includes(ROOT) && !l.startsWith(String(process.pid) + " "));
    return { ok: hits.length === 0, how: "Win32_Process", hits };
  }
  return { ok: false, how: "no process table this platform exposes", hits: [] };
}
const sv = survivors();
console.log(`${sv.ok ? "GREEN" : "RED  "} LAST no process naming the temp root survives (${sv.how}${sv.hits.length ? ": " + sv.hits.join(" | ") : ""})`);
if (!sv.ok) red.push("LAST");
try { rmSync(ROOT, { recursive: true, force: true }); } catch {}

if (red.length) { console.log(`RED MGS · ${red.join(", ")}`); process.exit(1); }
console.log(`GREEN MGS land wait · ${n} clause(s)`);
process.exit(0);
