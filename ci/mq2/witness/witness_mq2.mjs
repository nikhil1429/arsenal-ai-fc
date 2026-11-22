#!/usr/bin/env node
// ci/mq2/witness/witness_mq2.mjs — unit mq2 BUILD witness (forks row 1175). THE HEADER IS THE CONTRACT.
//
//   node ci/mq2/witness/witness_mq2.mjs --org <build tree> --base-org <base tree>
//
// WHAT IT HOLDS — thalamus.mjs is the SOLE WRITER of thalamus_config.json through three named lane exports
// (applyTiers · refitWakeEconomy · setAdjudicatorRole): one format, a lane fence, a stale-read guard; gate_tune and
// the watchman probe write through them (ci/mq2/MQ2_SPEC.md §5 A, as ruled in row 1175 (1)-(6)).
// THE CLAUSES, each run on BOTH trees — RED on the base, GREEN on the build — except A8, which is a base-vs-build
// comparison by the spec's own table (base "—"):
//   A1 FORMAT-APPLY    indent-1 plant → `gate_tune apply` → the file is indent 1 and the 818 setter then exits 0
//   A2 FORMAT-REVERT   a live mutation past its window, out of band → `gate_tune score` reverts → indent 1, setter exits 0
//   A3 WATCHMAN-REACH  watchman's tmpdir door → probeWakeEconomy over ten planted honest rows → the key + receipt land,
//                      every other key byte-identical, indent 1
//   A4 LANE FENCE      each lane door refuses a key outside its own lane, a foreign file name is refused, no door takes
//                      a lane argument — the file unchanged
//   A5 STALE READ      a lane write that lands between another writer's read and its rename → the first refuses, the
//                      second's key survives
//   A6 GRAPH           xray: no Q2 row for the file, MULTI_WRITER_ALLOWLIST unchanged from the base and without the file
//   A7 DECLARED        xray: thalamus.mjs is the one declared sole writer of the file, the IR's one writer, no Q5/Q6 row
//   A8 SAME BODY       base vs build: every law-pack finding count and xray's unresolved sinks only fall
//   A9 RACE            (row 1175 (6)'s added clause) two of the three exports raced on one planted file lose no key:
//                      a free race behind one start flag for EVERY pair of the three doors, and a forced overlap across
//                      two processes — every write a process reports done is on disk, every planted key survives, a
//                      loser refuses out loud. A free race is not deterministic: one pass can land GREEN by luck, never
//                      RED by luck (a lost key is a lost key)
//   BOUND              only scripts/thalamus.mjs, scripts/gate_tune.mjs, scripts/watchman.mjs and ci/mq2/** differ
//                      between the trees' git indexes (dressing-room/state/ is data, never compared and never read)
//   LAST               no node process this witness started survives (each child's pid is probed, cross-platform)
// THE PLANT LAW: every write lands under os.tmpdir(): each tree's scripts/ is COPIED there per run, the config, the
// ledgers and a synthetic registry (ARSENAL_REGISTRY) are planted there, the doors (ARSENAL_GATETUNE_STATE_DIR,
// ARSENAL_WATCHMAN_STATE_DIR) point there. His files are never read: no tree's dressing-room/state is opened.
// xray (A6/A7/A8) and the law pack (A8) READ the given trees in place; both trees must be git work trees (or plain
// `git init` trees, made with core.autocrlf=false) with acorn reachable from the tree (node_modules).
// THE PORT CLASS (row 1053): no port, no service, no POST, no restart, no daemon. No model call. Every wait is bounded
// by a live process (a spin ends when the flag lands OR the process it waits on is gone) — no number is typed.
// CRLF-proof: every text read normalises \r\n; git blobs are compared through the index. Node only, no shell.
// LAST LINE: `GREEN MQ2 <what> · <n> clause(s)` (exit 0) or `RED MQ2 · <clauses>` (exit 1).
import { mkdtempSync, writeFileSync, readFileSync, mkdirSync, rmSync, cpSync, existsSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync, spawn } from "node:child_process";
import { pathToFileURL, fileURLToPath } from "node:url";

const SELF = fileURLToPath(import.meta.url);
const argOf = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const CFG = "thalamus_config.json";
const PATH_IN_IR = "dressing-room/state/thalamus_config.json";
const EXPORTS = ["applyTiers", "refitWakeEconomy", "setAdjudicatorRole"];
const text = (p) => readFileSync(p, "utf8").replace(/\r\n/g, "\n");
const fmt = (t) => { try { const o = JSON.parse(t); return JSON.stringify(o, null, 1) === t ? "indent1" : JSON.stringify(o, null, 2) === t || JSON.stringify(o, null, 2) + "\n" === t ? "indent2" : "other"; } catch { return "unparsable"; } };
const PLANT = () => ({ _doc: "mq2 witness plant", tiers: { tau0: 0.25, tau1_base: 0.4, epsilon: 0.1, budget_k: 0.35 }, weights: { pe: 0.35 },
  adjudicator: { role: "thalamus_adjudicator", enabled: false }, deep: { est_tokens_per_wake: 1, deadline_ms: 45000 }, wake_cap_per_day: 15 });
const REGISTRY = { version: 1, tables: {
  mechanisms: [{ subject: "mutation:thalamus_config.tiers", schema_owner: "gate_tune.mjs", target: "thalamus_config.json → tiers", witness: "mq2 witness plant" }],
  lanes: [{ subject: "mq2_plant_lane", schema_owner: "plant.mjs", witness: "mq2 witness plant", consumers: [{ kind: "organ", name: "plant.mjs" }] }] } };
// A9's three lanes: the door, one edit, and the proof that the edit is on disk
const RACE = {
  tiers: { door: "applyTiers", edit: (o) => { o.tiers.tau0 = 0.3; o._gate_tune_receipt = { id: "race" }; return o; }, on: (o) => o.tiers.tau0 === 0.3 && !!o._gate_tune_receipt },
  wake: { door: "refitWakeEconomy", edit: (o) => { o.deep.est_tokens_per_wake = 5; o._wake_economy_refit = { fit: 5 }; return o; }, on: (o) => o.deep.est_tokens_per_wake === 5 && !!o._wake_economy_refit },
  adjudicator: { door: "setAdjudicatorRole", edit: (o) => { o._adjudicator_model_retired_race = "race — mq2 plant"; return o; }, on: (o) => typeof o._adjudicator_model_retired_race === "string" },
};
const RACE_TOP = ["tiers", "_gate_tune_receipt", "_wake_economy_refit", "_adjudicator_model_retired_race"], RACE_NESTED = { deep: ["est_tokens_per_wake"] };
// everything a lane may not touch, as one string (the same projection the build's fence uses, re-stated here)
const outside = (o, top, nested = {}) => JSON.stringify(Object.entries(o).filter(([k]) => !top.includes(k))
  .map(([k, v]) => (nested[k] && v && typeof v === "object") ? [k, Object.entries(v).filter(([kk]) => !nested[k].includes(kk))] : [k, v]));
const pids = [];
const alive = (pid) => { try { process.kill(pid, 0); return true; } catch (e) { return e.code === "EPERM"; } };

// ── CHILD MODES (the witness re-invoked as a child; argv: --child <mode> <json>) ────────────────────────────────
if (process.argv[2] === "--child") {
  const mode = process.argv[3], a = JSON.parse(process.argv[4]);
  const m = await import(pathToFileURL(join(a.tree, "scripts", a.organ || "thalamus.mjs")).href);
  const say = (o) => process.stdout.write(JSON.stringify(o) + "\n");
  const missing = (a.organ ? [] : EXPORTS).filter((k) => typeof m[k] !== "function");
  if (missing.length) { say({ missing }); process.exit(0); }
  // a spin that ends when `flag` lands, or when a process it depends on is gone — never on a typed number
  const spin = (flag, pidFile) => { for (;;) { if (existsSync(flag)) return true; if (!alive(process.ppid)) return false;
    if (pidFile && existsSync(pidFile)) { const p = Number(readFileSync(pidFile, "utf8")); if (p && !alive(p)) return existsSync(flag); } } };
  if (mode === "watchman") { say({ findings: m.probeWakeEconomy() }); process.exit(0); }
  if (mode === "fence") {
    const r = [
      m.refitWakeEconomy((o) => { o.tiers.tau0 = 9; return o; }, { path: a.path }),
      m.applyTiers((o) => { o.deep.est_tokens_per_wake = 9; return o; }, { path: a.path }),
      m.setAdjudicatorRole((o) => { o.weights.pe = 0.9; return o; }, { path: a.path }),
      m.refitWakeEconomy((o) => { o.deep.deadline_ms = 1; return o; }, { path: a.path }),
      m.applyTiers((o) => o, { path: join(a.dir, "brain_config.json") }),
    ];
    const generic = Object.keys(m).filter((k) => /^(patchThalamusConfig|writeConfigLane|writeConfig|patchConfig)$/.test(k));
    say({ r, generic, arity: EXPORTS.map((k) => m[k].length) }); process.exit(0);
  }
  if (mode === "stale") {
    let inner = null;
    const outer = m.applyTiers((o) => { inner = m.refitWakeEconomy((d) => { d.deep.est_tokens_per_wake = 11; d._wake_economy_refit = { fit: 11 }; return d; }, { path: a.path }); o.tiers.tau0 = 0.5; return o; }, { path: a.path });
    say({ outer, inner }); process.exit(0);
  }
  if (mode === "race") {
    writeFileSync(a.ready, String(process.pid));
    if (!spin(a.go)) { say({ lost: "parent gone" }); process.exit(1); }
    say({ r: m[RACE[a.lane].door]((o) => RACE[a.lane].edit(o), { path: a.path }) }); process.exit(0);
  }
  if (mode === "hold-tiers") {   // reads, then holds its rename until the partner has written (or is gone)
    const r = m.applyTiers((o) => { writeFileSync(a.read, "1"); spin(a.done, a.partnerPid); o.tiers.tau0 = 0.3; o._gate_tune_receipt = { id: "held" }; return o; }, { path: a.path });
    say({ r }); process.exit(0);
  }
  if (mode === "after-wake") {   // writes once the holder has read (or is gone)
    spin(a.read, a.holderPid);
    const r = m.refitWakeEconomy((o) => { o.deep.est_tokens_per_wake = 5; o._wake_economy_refit = { fit: 5 }; return o; }, { path: a.path });
    writeFileSync(a.done, "1");
    say({ r }); process.exit(0);
  }
  say({ unknown: mode }); process.exit(1);
}

// ── PARENT ──────────────────────────────────────────────────────────────────────────────────────────────────────
const ORG = argOf("--org"), BASE = argOf("--base-org");
if (!ORG || !BASE) { console.log("RED MQ2 · usage: --org <build tree> --base-org <base tree>"); process.exit(1); }
const ROOT = mkdtempSync(join(tmpdir(), "mq2-witness-"));
const child = (tree, mode, a, env = {}) => {
  const r = spawnSync(process.execPath, [SELF, "--child", mode, JSON.stringify({ tree, ...a })], { encoding: "utf8", env: { ...process.env, ...env }, windowsHide: true });
  const lines = String(r.stdout || "").split(/\r?\n/).filter(Boolean);
  try { return { code: r.status, ...JSON.parse(lines[lines.length - 1] || "{}") }; } catch { return { code: r.status, err: String(r.stderr || "").slice(0, 300) }; }
};
const node = (args, env = {}, cwd = undefined) => { const r = spawnSync(process.execPath, args, { encoding: "utf8", env: { ...process.env, ...env }, windowsHide: true, cwd }); return { code: r.status, out: String(r.stdout || "") + String(r.stderr || "") }; };

function makeRun(tree, tag) {
  const run = join(ROOT, tag);
  mkdirSync(run, { recursive: true });
  cpSync(join(tree, "scripts"), join(run, "scripts"), { recursive: true });
  const reg = join(run, "registry_plant.json");
  writeFileSync(reg, JSON.stringify(REGISTRY));
  let n = 0;
  const dir = () => { const d = join(run, `p${++n}`); mkdirSync(d, { recursive: true }); return d; };
  return { tree: run, reg, dir, env: { ARSENAL_REGISTRY: reg } };
}
const plantCfg = (d, o = PLANT()) => { const p = join(d, CFG); writeFileSync(p, JSON.stringify(o, null, 1)); return p; };
const setter = (R, p) => node([join(R.tree, "scripts", "thalamus.mjs"), "config", "adjudicator-role", "thalamus_adjudicator", "--why", "mq2 plant", "--config", p], R.env);

const C = {};
C.A1 = (R) => {
  const d = R.dir(), p = plantCfg(d);
  mkdirSync(join(d, "brain_out", "nightshift"), { recursive: true });
  const pf = join(d, "brain_out", "nightshift", "wind_tunnel_plant.json");
  writeFileSync(pf, JSON.stringify({ id: "wt-mq2-plant", target: "thalamus_config.json → tiers", diff: { old: { tau1_base: 0.4 }, new: { tau1_base: 0.36 } }, evidence: ["plant"], predicted_effect: "plant", metric: { name: "wakes_per_day_band", min_events: 200, window_days: 14, band: [1, 8] }, review_after_days: 14, revert_diff: { new: { tau1_base: 0.4 } } }));
  const g = node([join(R.tree, "scripts", "gate_tune.mjs"), "apply", pf], { ...R.env, ARSENAL_GATETUNE_STATE_DIR: d });
  const f1 = fmt(text(p)), moved = JSON.parse(text(p)).tiers.tau1_base === 0.36;
  const s = setter(R, p);
  return { green: g.code === 0 && moved && f1 === "indent1" && s.code === 0 && fmt(text(p)) === "indent1", line: `apply exit ${g.code} · tiers moved ${moved} · file ${f1} · 818 setter exit ${s.code}` };
};
C.A2 = (R) => {
  const d = R.dir(), o = PLANT(); o.tiers.tau1_base = 0.36; const p = plantCfg(d, o);
  const today = new Date(); const day = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  writeFileSync(join(d, "gate_tune_ledger.jsonl"), JSON.stringify({ ts: "1970-01-01T00:00:00Z", kind: "apply", id: "wt-mq2-live", applied_on: "1970-01-01", diff: { old: { tau1_base: 0.4 }, new: { tau1_base: 0.36 } }, revert_diff: { new: { tau1_base: 0.4 } }, metric: { name: "wakes_per_day_band", min_events: 1, window_days: 7, band: [1, 2] }, review_after_days: 7 }) + "\n");
  writeFileSync(join(d, "salience_ledger.jsonl"), [0, 1, 2].map((i) => JSON.stringify({ ts: `${day}T0${i}:00:00`, tier: 2, key: `k${i}` })).join("\n") + "\n");
  const g = node([join(R.tree, "scripts", "gate_tune.mjs"), "score"], { ...R.env, ARSENAL_GATETUNE_STATE_DIR: d });
  const f1 = fmt(text(p)), back = JSON.parse(text(p)).tiers.tau1_base === 0.4;
  const s = setter(R, p);
  return { green: g.code === 0 && /REVERTED/.test(g.out) && back && f1 === "indent1" && s.code === 0, line: `score exit ${g.code} · reverted ${back} · file ${f1} · 818 setter exit ${s.code}` };
};
C.A3 = (R) => {
  const d = R.dir(), before = PLANT(), p = plantCfg(d, before);
  writeFileSync(join(d, "brain_ledger.jsonl"), Array.from({ length: 10 }, (_, i) => JSON.stringify({ job: "cortex_wake", ok: true, cache_read_tokens: 0, total_tokens: (i + 1) * 100 })).join("\n") + "\n");
  const r = child(R.tree, "watchman", { organ: "watchman.mjs" }, { ...R.env, ARSENAL_WATCHMAN_STATE_DIR: d });
  const after = JSON.parse(text(p)), f = (r.findings || []).find((x) => x.id === "wake-economy-refit") || {};
  const landed = after.deep.est_tokens_per_wake === 2000 && after._wake_economy_refit && after._wake_economy_refit.fit === 2000;
  const kept = outside(after, ["_wake_economy_refit"], { deep: ["est_tokens_per_wake"] }) === outside(before, ["_wake_economy_refit"], { deep: ["est_tokens_per_wake"] });
  return { green: r.code === 0 && /RE-FIT/.test(f.finding || "") && landed && kept && fmt(text(p)) === "indent1", line: `child exit ${r.code} · finding ${(f.finding || r.err || "none").slice(0, 60)} · landed ${!!landed} · others byte-identical ${kept} · file ${fmt(text(p))}` };
};
C.A4 = (R) => {
  const d = R.dir(), p = plantCfg(d), held = text(p);
  const r = child(R.tree, "fence", { path: p, dir: d }, R.env);
  if (r.missing) return { green: false, line: `no such export(s): ${r.missing.join(", ")}` };
  const refused = (r.r || []).length === 5 && r.r.slice(0, 4).every((x) => x.ok === false && /LANE FENCE/.test(x.why)) && r.r[4].ok === false;
  return { green: refused && r.generic.length === 0 && r.arity.every((n) => n === 2) && text(p) === held && !existsSync(join(d, "brain_config.json")),
    line: `cross-lane edits refused ${refused} · generic door ${r.generic.join(",") || "none"} · arity ${r.arity} · file unchanged ${text(p) === held}` };
};
C.A5 = (R) => {
  const d = R.dir(), p = plantCfg(d);
  const r = child(R.tree, "stale", { path: p }, R.env);
  if (r.missing) return { green: false, line: `no such export(s): ${r.missing.join(", ")} — no guard to hold a stale read` };
  const o = JSON.parse(text(p)), tmpLeft = readdirSync(d).filter((f) => f.endsWith(".tmp")).length;
  const ok = r.outer && r.outer.ok === false && /STALE GUARD/.test(r.outer.why) && r.inner && r.inner.wrote && o.deep.est_tokens_per_wake === 11 && o.tiers.tau0 === 0.25 && tmpLeft === 0;
  return { green: ok, line: `first writer ${r.outer && r.outer.ok === false ? "refused" : "WROTE"} · second's key survives ${o.deep.est_tokens_per_wake === 11} · tmp left ${tmpLeft}` };
};
// the graph reads the tree IN PLACE, read-only; one build per tree
const graphs = new Map();
async function graph(tree) {
  if (graphs.has(tree)) return graphs.get(tree);
  let g;
  try {
    const x = await import(pathToFileURL(join(tree, "scripts", "xray.mjs")).href + `?t=${encodeURIComponent(tree)}`);
    const ir = x.build(), q = x.queries(ir);
    g = { ir, q, allow: [...x.MULTI_WRITER_ALLOWLIST] };
  } catch (e) { g = { err: String((e && e.message) || e).slice(0, 200) }; }
  graphs.set(tree, g); return g;
}
C.A6 = async (R, T, baseG) => {
  const g = await graph(T); if (g.err) return { green: false, line: `NOT MEASURABLE — ${g.err}` };
  const q2 = g.q.Q2.filter((r) => r.path === PATH_IN_IR).length, q5 = g.q.Q5.filter((r) => r.path === PATH_IN_IR).length;
  const same = !baseG.err && JSON.stringify(g.allow) === JSON.stringify(baseG.allow);
  return { green: q2 === 0 && q5 === 0 && !g.allow.includes(PATH_IN_IR) && same, line: `Q2 rows for it ${q2} · Q5 ${q5} · allowlisted ${g.allow.includes(PATH_IN_IR)} · allowlist as the base ${same}` };
};
C.A7 = async (R, T) => {
  const g = await graph(T); if (g.err) return { green: false, line: `NOT MEASURABLE — ${g.err}` };
  const decl = g.ir.declared_sole_writers.filter((d) => d.file === CFG).map((d) => d.organ);
  const f = g.ir.files.find((r) => r.path === PATH_IN_IR) || { writers: [] };
  const q6 = (g.q.Q6 || []).filter((r) => r.file === CFG).length, q5 = g.q.Q5.filter((r) => r.path === PATH_IN_IR).length;
  return { green: decl.length === 1 && decl[0] === "thalamus.mjs" && f.writers.join() === "thalamus.mjs" && q5 === 0 && q6 === 0, line: `declared sole ${decl.join(",") || "none"} · IR writers ${f.writers.join(",") || "none"} · Q5 ${q5} · Q6 ${q6}` };
};
const lawCounts = (tree) => {
  const r = node([join(tree, "scripts", "lawpack.mjs"), "gate"], {}, tree);
  const m = /findings: ([^\n]*)/.exec(r.out);
  if (!m) return { err: r.out.split(/\r?\n/).filter(Boolean).slice(-2).join(" | ").slice(0, 200) };
  return { counts: Object.fromEntries(m[1].split(" · ").map((s) => { const k = s.trim().split(/\s+/); return [k.slice(0, -1).join(" "), Number(k[k.length - 1])]; })), line: m[1] };
};
C.A8 = async (R, T, baseG, B) => {
  const g = await graph(T), lc = lawCounts(T), lb = lawCounts(B);
  if (g.err || baseG.err || lc.err || lb.err) return { green: false, line: `NOT MEASURABLE — ${g.err || baseG.err || lc.err || lb.err}` };
  const rose = Object.keys({ ...lb.counts, ...lc.counts }).filter((k) => !((lc.counts[k] ?? Infinity) <= (lb.counts[k] ?? -Infinity)));
  const un = g.ir.unresolved_sinks <= baseG.ir.unresolved_sinks;
  return { green: rose.length === 0 && un, line: `law pack rose: ${rose.join(", ") || "none"} · unresolved sinks ${baseG.ir.unresolved_sinks} → ${g.ir.unresolved_sinks}`, counts: lc.line };
};
const spinParent = (cond, kids) => new Promise((res) => { const t = () => (cond() ? res(true) : kids.some((k) => k.exitCode !== null) ? res(cond()) : setImmediate(t)); t(); });
const spawnKid = (tree, mode, a, env) => {
  const k = spawn(process.execPath, [SELF, "--child", mode, JSON.stringify({ tree, ...a })], { env: { ...process.env, ...env }, windowsHide: true });
  pids.push(k.pid); let out = ""; k.stdout.on("data", (b) => { out += b; });
  k.done = new Promise((res) => k.on("exit", (code) => { const l = out.split(/\r?\n/).filter(Boolean); let j = {}; try { j = JSON.parse(l[l.length - 1] || "{}"); } catch { j = {}; } res({ code, ...j }); }));
  return k;
};
C.A9 = async (R) => {
  // (i) THE FREE RACE, every pair of the three doors: both children ready, ONE start flag, one write each.
  //     Held iff every write a child reports done is on disk, every planted key survives, a loser refuses out loud.
  const names = Object.keys(RACE), pairs = names.flatMap((x, i) => names.slice(i + 1).map((y) => [x, y]));
  const plantOut = outside(PLANT(), RACE_TOP, RACE_NESTED), free = [];
  for (const pair of pairs) {
    const d = R.dir(), p = plantCfg(d);
    const kids = pair.map((lane) => spawnKid(R.tree, "race", { lane, path: p, ready: join(d, `ready-${lane}`), go: join(d, "go") }, R.env));
    await spinParent(() => pair.every((lane) => existsSync(join(d, `ready-${lane}`))), kids);
    writeFileSync(join(d, "go"), "1");
    const res = await Promise.all(kids.map((k) => k.done));
    if (res.some((r) => r.missing)) return { green: false, line: `no such export(s): ${res.find((r) => r.missing).missing.join(", ")} — nothing to race but whole-file writers` };
    const o = JSON.parse(text(p));
    const lost = pair.filter((lane, i) => res[i].r && res[i].r.wrote && !RACE[lane].on(o));
    const loud = res.every((r) => r.code === 0 && r.r && (r.r.wrote || (r.r.ok === false && /STALE GUARD/.test(r.r.why))));
    free.push({ pair: pair.join("+"), ok: lost.length === 0 && loud && outside(o, RACE_TOP, RACE_NESTED) === plantOut, wrote: pair.filter((_, i) => res[i].r && res[i].r.wrote), lost });
  }
  // (ii) THE FORCED OVERLAP across two processes: the holder reads, the partner writes, the holder renames last
  const d2 = R.dir(), p2 = plantCfg(d2), f = (n) => join(d2, n);
  const h = spawnKid(R.tree, "hold-tiers", { path: p2, read: f("read"), done: f("done"), partnerPid: f("partner.pid") }, R.env);
  const w = spawnKid(R.tree, "after-wake", { path: p2, read: f("read"), done: f("done"), holderPid: f("holder.pid") }, R.env);
  writeFileSync(f("holder.pid"), String(h.pid)); writeFileSync(f("partner.pid"), String(w.pid));
  const [rh, rp] = await Promise.all([h.done, w.done]);
  const o2 = JSON.parse(text(p2));
  const forced = !!(rh.r && rh.r.ok === false && /STALE GUARD/.test(rh.r.why) && rp.r && rp.r.wrote && RACE.wake.on(o2) && !RACE.tiers.on(o2)
    && outside(o2, RACE_TOP, RACE_NESTED) === plantOut && readdirSync(d2).filter((x) => x.endsWith(".tmp")).length === 0);
  return { green: free.every((x) => x.ok) && forced,
    line: `free race ${free.map((x) => `${x.pair}: wrote ${x.wrote.join("+") || "none"}${x.lost.length ? `, LOST ${x.lost.join("+")}` : ", no key lost"}`).join(" · ")} · forced overlap: holder ${rh.r && rh.r.ok === false ? "refused out loud" : "WROTE"}, partner's key kept ${RACE.wake.on(o2)}` };
};

function bound() {
  const idx = (t) => { const r = spawnSync("git", ["-C", t, "ls-files", "-s"], { encoding: "utf8", windowsHide: true, maxBuffer: 1 << 28 });
    if (r.status !== 0) return null;
    return new Map(String(r.stdout).split("\n").filter(Boolean).map((l) => { const [meta, p] = l.split("\t"); return [p, meta.split(" ")[1]]; }).filter(([p]) => !p.startsWith("dressing-room/state/"))); };
  const a = idx(ORG), b = idx(BASE);
  if (!a || !b) return { green: false, line: "NOT MEASURABLE — a tree is not a git tree" };
  const diff = [...new Set([...a.keys(), ...b.keys()])].filter((p) => a.get(p) !== b.get(p)).sort();
  const NAMED = new Set(["scripts/thalamus.mjs", "scripts/gate_tune.mjs", "scripts/watchman.mjs"]);
  const beyond = diff.filter((p) => !NAMED.has(p) && !p.startsWith("ci/mq2/"));
  return { green: beyond.length === 0, line: `${diff.length} path(s) differ · beyond the named files: ${beyond.join(", ") || "none"}` };
}

const out = [], reds = [];
let judged = 0;   // every clause judged: A1-A9, BOUND, LAST
try {
  const RB = makeRun(BASE, "base"), RO = makeRun(ORG, "build");
  const baseG = await graph(BASE);
  for (const id of ["A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8", "A9"]) {
    judged++;
    if (id === "A8") {
      const v = await C.A8(RO, ORG, baseG, BASE);
      out.push(`A8 base vs build ${v.green ? "GREEN" : "RED"} — ${v.line}`);
      if (v.counts) out.push(`A8 law pack counts (build): ${v.counts}`);
      if (!v.green) reds.push(id);
      continue;
    }
    const vb = await C[id](RB, BASE, baseG), vo = await C[id](RO, ORG, baseG);
    const ok = !vb.green && vo.green;
    out.push(`${id} base ${vb.green ? "GREEN" : "RED"} (${vb.line}) · build ${vo.green ? "GREEN" : "RED"} (${vo.line}) → ${ok ? "held" : "NOT HELD"}`);
    if (!ok) reds.push(id);
  }
  const b = bound(); judged++; out.push(`BOUND ${b.green ? "GREEN" : "RED"} — ${b.line}`); if (!b.green) reds.push("BOUND");
} catch (e) { out.push(`witness error: ${String((e && e.stack) || e).slice(0, 400)}`); reds.push("ERROR"); }
const survivors = pids.filter(alive); judged++;
out.push(`LAST ${survivors.length ? "RED" : "GREEN"} — ${pids.length} child process(es) started, ${survivors.length} alive`);
if (survivors.length) reds.push("LAST");
try { rmSync(ROOT, { recursive: true, force: true }); } catch { /* the temp dir goes with the OS */ }
for (const l of out) console.log(l);
if (reds.length) { console.log(`RED MQ2 · ${reds.join(", ")}`); process.exit(1); }
console.log(`GREEN MQ2 thalamus is the sole writer of ${CFG} through three lane doors · ${judged} clause(s)`);
process.exit(0);
