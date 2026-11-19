#!/usr/bin/env node
// ============================================================================
// witness_mjd3.mjs — unit mjd3 (forks row 1025 (4)): THE SETTLE TAIL OF A JUDGE ROUND IS BOUNDED INSIDE ITS BUDGET.
// CONTRACT (this header is the contract; every clause prints one line, the LAST line is the verdict):
//   node ci/mcr/witness_mjd3.mjs --org <dir> --base-org <dir>
//   <dir> = a tree of the repository (a git-archive export is enough: gradeJudge imports no package).
//   Every plant lives under os.tmpdir(); nothing under either tree is written. No model is called: every judge call,
//   card spawn, owner dispatch and second-opinion fetch is a PLANT that runs to its full timeout on a SCALED clock.
//   THE SCALE IS MEASURED, NEVER TYPED: R = JUDGE_DISPATCH_MS / (20 · S), S = the slowest of three `node -e 0` starts
//   measured in this run, so the bound's real slack (JUDGE_DISPATCH_MS / R) is TWENTY node starts — at least ten.
//   J1  FULL TIMEOUT · every judge call, key_doubt card, owner dispatch and second-opinion fetch runs to its full timeout:
//       gradeJudge returns within JUDGE_BUDGET_MS + JUDGE_DISPATCH_MS on its own clock, every item without a settled row
//       is counted outstanding (never coerced: a settled row exists only beside its owner's rep), and the round settles
//       at least one item (a reserve that settles nothing is a round that only dies whole).
//   J2  OVERSHOT CALL · the judge call returns 2·JUDGE_DISPATCH_MS past its kill: every settle step re-reads what
//       remains, so the round still returns within the bound and every unsettled item is outstanding.
//   J3  SECOND DEADLINE · (the judge call answers at once) a second opinion that never answers is handed a deadline ≤ WATCHER_DEADLINE_MS and ≤ what
//       the round has left, and the round goes on at that deadline (the first judgement stands as one judge).
//   J4  KILL MID-SETTLE — RE-BASED (fate (a), forks row 1112 (1); unit mr3): unit mjd4 (15edfec, ruling row 1030 (2), landed
//       under rows 1030 (3) / 1033) changed this ON PURPOSE — a capture a kill left in doubt is re-dispatched EXACTLY ONCE under
//       its idempotency key, and each owner writes nothing for a key already on its own log. The old text, STRUCK (L9):
//       ~~a process killed after an owner wrote a rep and before its settled row: the next round, in a fresh process over the~~
//       ~~same queue, hands no rep to its owner a second time, and names the capture in doubt.~~
//       NOW: a process killed after an owner wrote a rep and before its settled row: the next round, in a fresh process over
//       the same queue, re-dispatches the capture in doubt exactly once, under the same --idem key as its first hand-off; an
//       owner that honours the key (writes nothing for a key already on its own log — the plant mirrors that owners' law)
//       ends with every capture on its log exactly once; every hand-off carries --idem = its capture id; no capture other
//       than the doubted one is handed twice; the receipt names the doubted capture in resolved_in_doubt (exactly one, of =
//       it) and in_doubt is empty; the queue carries its settled row with resolved_from "in-doubt".
//   BOUND only scripts/gaffer_brain.mjs differs between --base-org and --org (callers and the close budget do not move).
//   LAST  no node process naming this run's temp dir survives.
// LAST LINE: GREEN MJD3 <what> · <n> clause(s)  (exit 0)  |  RED MJD3 · <clauses>  (exit 1)
// ============================================================================
import { mkdtempSync, writeFileSync, readFileSync, existsSync, readdirSync, statSync, rmSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const ORG = arg("--org") && resolve(arg("--org")), BASE = arg("--base-org") && resolve(arg("--base-org"));
if (!ORG || !BASE) { console.log("RED MJD3 · USAGE (--org <dir> --base-org <dir>)"); process.exit(1); }
const TMP = mkdtempSync(join(tmpdir(), "mjd3-"));
const reds = [], greens = [];
const clause = (id, ok, line) => { (ok ? greens : reds).push(id); console.log(`${ok ? "GREEN" : "RED  "} ${id} · ${line}`); };

// ── the child: one scenario, one process (a kill is a real process exit) ──
const CHILD = join(TMP, "child.mjs");
writeFileSync(CHILD, String.raw`
import { appendFileSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
const [org, scenario, Rs, out, qf, rf] = process.argv.slice(2);
const R = Number(Rs);
const gb = await import(pathToFileURL(join(org, "scripts", "gaffer_brain.mjs")).href);
const B = gb.JUDGE_BUDGET_MS, JD = gb.JUDGE_DISPATCH_MS;
const t0 = performance.now();
const clock = () => (performance.now() - t0) * R;
const wait = (ms) => new Promise((r) => setTimeout(r, Math.max(0, ms) / R));
const busy = (ms) => { const end = performance.now() + Math.max(0, ms) / R; while (performance.now() < end) { } };
const timer = { set: (fn, ms) => setTimeout(fn, Math.max(0, ms) / R), clear: (h) => clearTimeout(h) };
const rows = () => readFileSync(qf, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
const ids = rows().filter((r) => r.kind === "capture").map((r) => r.id);
const fast = scenario === "kill" || scenario === "round2";
let dispatches = 0;
const seen = [];
const verdictOf = (id) => (rows().find((r) => r.id === id) || {}).type === "hidden_test" ? "passed" : "avoided";
const deps = {
  rows: rows(), judgeHistory: [{ job: gb.JUDGE_JOB, ok: true, duration_ms: JD, items: 1 }],
  now: new Date("2026-11-18T12:00:00.000Z"), clock, timer, cartridge: "HEAD", headRides: false,
  verify: async () => ({ ran: false, checks: {}, calls: 0, duration_ms: 0 }),
  generate: async (p, call) => {
    const over = scenario === "overshoot" ? 2 * JD : 0;
    const ms = fast || scenario === "second" ? 0 : (call.budget_ms || B) + over;   // J3 judges the second opinion, so its call answers at once
    await wait(ms);
    return { ok: true, duration_ms: ms, text: JSON.stringify({ grades: ids.map((id) => ({ id, verdict: verdictOf(id), why: "w", key_doubt: "k" })) }) };
  },
  fileCard: () => { if (!fast) busy(JD); return { ok: true, out: "" }; },
  dispatch: (cmd) => {
    if (!fast) busy(JD);
    const q = cmd && cmd.argv ? cmd.argv[cmd.argv.indexOf("--q") + 1] : null;
    // the owners' idem law (mjd4, row 1030 (2)): every hand-off is logged; the OWNER log takes a key only once
    const ix = cmd && cmd.argv ? cmd.argv.indexOf("--idem") : -1, idem = ix >= 0 ? cmd.argv[ix + 1] : null;
    const ol = rf + ".owner";
    const have = existsSync(ol) ? readFileSync(ol, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)) : [];
    const dup = !!idem && have.some((x) => x.idem === idem);
    appendFileSync(rf, JSON.stringify({ q, idem }) + "\n");
    if (!dup) appendFileSync(ol, JSON.stringify({ q, idem }) + "\n");
    dispatches++;
    if (scenario === "kill" && dispatches === 2) process.exit(9);   // the kill: the owner wrote, the settled row did not
    return dup ? { ok: true, noop: true, note: "already on its log under " + idem } : { ok: true };
  },
  appendRow: (p, row) => { appendFileSync(qf, JSON.stringify(row) + "\n"); return { ok: true }; },
  keys: ["k0", "k1"],
  // a second-opinion fetch that runs to its full timeout: it answers only by being aborted
  fetchFn: (url, init = {}) => new Promise((res, rej) => { const s = init.signal; if (s) s.addEventListener("abort", () => rej(new Error("aborted")), { once: true }); }),
};
if (scenario === "second") deps.secondOpinion = (item, bound) => { seen.push({ at: clock(), deadline: bound ? bound.deadlineMs : null }); return new Promise(() => { setTimeout(() => {}, 2 ** 31 - 1); }); };
if (fast) { deps.fileCard = () => ({ ok: true, out: "" }); deps.secondOpinion = async () => ({ ok: false, reason: "lane-down" }); }
const res = await gb.gradeJudge(deps);
const elapsed = clock();
writeFileSync(out, JSON.stringify({ elapsed, B, JD, W: Number(process.env.GAFFER_WATCHER_MS) || null, seen,
  res: { ok: res.ok, reason: res.reason || null, graded: res.graded, outstanding: res.outstanding, deferred: res.deferred || null, in_doubt: res.in_doubt || null, resolved_in_doubt: res.resolved_in_doubt || null,
    batches: (res.batches || []).map((b) => ({ size: b.size, budget_ms: b.budget_ms, tail_ms: b.tail_ms })) } }));
process.exit(0);
`);

// ── measured: one node start (the slowest of three) ──
const starts = [0, 1, 2].map(() => { const a = performance.now(); spawnSync(process.execPath, ["-e", "0"]); return performance.now() - a; });
const S = Math.max(...starts);

const kids = new Set();
function runChild(org, scenario, R, capMs, items) {
  const dir = mkdtempSync(join(TMP, `${scenario}-`));
  const qf = join(dir, "queue.jsonl"), rf = join(dir, "reps.jsonl"), out = join(dir, "out.json");
  writeFileSync(qf, items.map((it) => JSON.stringify(it)).join("\n") + "\n");
  writeFileSync(rf, "");
  return runIn(org, scenario, R, capMs, { dir, qf, rf, out });
}
function runIn(org, scenario, R, capMs, f) {
  return new Promise((res) => {
    const c = spawn(process.execPath, [CHILD, org, scenario, String(R), f.out, f.qf, f.rf], { stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
    kids.add(c);
    let err = "", capped = false;
    c.stdout.on("data", () => {}); c.stderr.on("data", (d) => { err += d; });
    const t = setTimeout(() => { capped = true; c.kill("SIGKILL"); }, capMs);
    c.on("exit", (code) => {
      clearTimeout(t); kids.delete(c);
      const o = existsSync(f.out) ? JSON.parse(readFileSync(f.out, "utf8")) : null;
      const q = readFileSync(f.qf, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
      const reps = readFileSync(f.rf, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
      const owner = existsSync(f.rf + ".owner") ? readFileSync(f.rf + ".owner", "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)) : [];
      res({ ...f, owner, code, capped, err: err.split("\n").filter(Boolean).slice(-2).join(" | "), o, q, reps });
    });
  });
}

const items = (n) => Array.from({ length: n }, (_, i) => ({ v: 2, kind: "capture", id: `m${i}`, type: i % 2 ? "hidden_test" : "trap", ref: `c:${i}`, concept: "c",
  label: `c:${i}`, asked: `c:${i}`, gut: "knew", spoken: "x", ts: `2026-11-18T0${i % 10}:00:00.000Z` }));

// what a run proves about its queue: never coerced, every unsettled item outstanding
function ledgerOf(r, n) {
  const settled = new Set(r.q.filter((x) => x.kind === "settled").map((x) => x.of));
  const repQ = r.reps.map((x) => x.q);
  const coerced = [...settled].filter((of) => !repQ.includes(`c:${of.slice(1)}`));
  return { settled: settled.size, coerced, outstandingOk: !!(r.o && r.o.res.outstanding === n - settled.size) };
}

async function main() {
  // the constants, read from the tree under judgement (never typed here)
  const probe = await import(pathToFileURL(join(ORG, "scripts", "gaffer_brain.mjs")).href);
  const B = probe.JUDGE_BUDGET_MS, JD = probe.JUDGE_DISPATCH_MS;
  const R = JD / (20 * S);
  const boundReal = (B + JD) / R;
  const cap = 2 * boundReal + 20 * S;
  console.log(`mjd3 witness · node start S ${S.toFixed(1)} ms (slowest of 3) · scale R ${R.toFixed(2)} · bound ${B + JD} clock ms = ${boundReal.toFixed(0)} real ms · real slack ${(JD / R).toFixed(0)} ms = ${(JD / R / S).toFixed(1)} node starts · child cap ${cap.toFixed(0)} real ms`);
  const N = 6;

  const j1 = await runChild(ORG, "full", R, cap, items(N));
  const l1 = ledgerOf(j1, N);
  clause("J1", !j1.capped && j1.o && j1.o.elapsed <= B + JD && l1.coerced.length === 0 && l1.outstandingOk && l1.settled >= 1,
    j1.capped || !j1.o ? `no return within the child cap (${j1.capped ? "killed at the cap" : `exit ${j1.code} ${j1.err}`})`
      : `returned at ${Math.round(j1.o.elapsed)} of ${B + JD} clock ms · settled ${l1.settled} of ${N} · outstanding ${j1.o.res.outstanding} · coerced ${l1.coerced.length} · batches ${JSON.stringify(j1.o.res.batches)}`);

  const j2 = await runChild(ORG, "overshoot", R, cap, items(N));
  const l2 = ledgerOf(j2, N);
  clause("J2", !j2.capped && j2.o && j2.o.elapsed <= B + JD && l2.coerced.length === 0 && l2.outstandingOk,
    j2.capped || !j2.o ? `no return within the child cap (${j2.capped ? "killed at the cap" : `exit ${j2.code} ${j2.err}`})`
      : `overshot call · returned at ${Math.round(j2.o.elapsed)} of ${B + JD} clock ms · settled ${l2.settled} · outstanding ${j2.o.res.outstanding} · deferred ${(j2.o.res.deferred || []).length}`);

  const j3 = await runChild(ORG, "second", R, cap, items(2));
  const W = probe.WATCHER_DEADLINE_MS;   // undefined on a tree that does not export it: the predicate then fails, never guesses
  const s3 = j3.o ? j3.o.seen : [];
  const ok3 = !j3.capped && j3.o && s3.length >= 1 && s3.every((x) => Number.isFinite(x.deadline) && x.deadline > 0 && x.deadline <= W && x.deadline <= B - x.at - JD) && j3.o.elapsed <= B + JD;
  clause("J3", !!ok3, j3.capped || !j3.o ? `a second opinion that never answers held the round past the child cap (${j3.capped ? "killed at the cap" : `exit ${j3.code} ${j3.err}`})`
    : `second opinion(s) handed deadline(s) ${JSON.stringify(s3.map((x) => x.deadline && Math.round(x.deadline)))} at clock ${JSON.stringify(s3.map((x) => Math.round(x.at)))} · returned at ${Math.round(j3.o.elapsed)} of ${B + JD}`);

  const k1 = await runChild(ORG, "kill", 1, cap, items(4));
  const k2 = await runIn(ORG, "round2", 1, cap, k1);
  // J4 re-based (row 1112 (1)): round 2 re-uses round 1's files, so k2.reps (every hand-off) and k2.owner (the owner's log) hold BOTH rounds
  const doubted = (k1.q.find((x) => x.kind === "dispatching" && !k1.q.some((y) => y.kind === "settled" && y.of === x.of)) || {}).of || null;
  const keyOf = (q) => "m" + String(q).split(":")[1];
  const handed = {}; for (const x of k2.reps) handed[x.q] = (handed[x.q] || 0) + 1;
  const ownerN = {}; for (const x of k2.owner) ownerN[x.q] = (ownerN[x.q] || 0) + 1;
  const keyed = k2.reps.length > 0 && k2.reps.every((x) => x.idem && x.idem === keyOf(x.q));
  const onceEach = Array.from({ length: 4 }, (_, i) => ownerN["c:" + i] === 1).every(Boolean);
  const reOnce = !!doubted && Object.entries(handed).every(([q, n]) => n === (keyOf(q) === doubted ? 2 : 1)) && Object.keys(handed).some((q) => keyOf(q) === doubted);
  const rid = k2.o ? k2.o.res.resolved_in_doubt : null, idl = k2.o ? k2.o.res.in_doubt : null;
  const named = Array.isArray(rid) && rid.length === 1 && rid[0].of === doubted && Array.isArray(idl) && idl.length === 0;
  const settledRow = k2.q.some((x) => x.kind === "settled" && x.of === doubted && x.resolved_from === "in-doubt");
  clause("J4", k1.code === 9 && !!k2.o && keyed && onceEach && reOnce && named && settledRow,
    `round 1 exit ${k1.code} after ${k1.reps.length} hand-off(s) · doubted ${doubted} · handed ${JSON.stringify(handed)} · on the owner's log ${JSON.stringify(ownerN)} · every hand-off keyed ${keyed} · resolved ${JSON.stringify(rid && rid.map((x) => x.of))} · in doubt ${JSON.stringify(idl && idl.map((x) => x.of || x))} · settled from in-doubt ${settledRow}`);

  // BOUND — every file of the two trees (no .git, no node_modules), by content
  const walk = (root, d = root, acc = new Map()) => {
    for (const e of readdirSync(d)) {
      if (e === ".git" || e === "node_modules") continue;
      const p = join(d, e), st = statSync(p);
      if (st.isDirectory()) walk(root, p, acc); else acc.set(relative(root, p).replace(/\\/g, "/"), createHash("sha256").update(readFileSync(p)).digest("hex"));
    }
    return acc;
  };
  const a = walk(BASE), b = walk(ORG);
  const differ = [...new Set([...a.keys(), ...b.keys()])].filter((k) => a.get(k) !== b.get(k)).sort();
  clause("BOUND", differ.length === 0 || (differ.length === 1 && differ[0] === "scripts/gaffer_brain.mjs"), `differs: ${differ.join(", ") || "nothing"}`);

  // LAST — no node process naming the temp dir survives
  for (const c of kids) c.kill("SIGKILL");
  const listing = process.platform === "win32"
    ? spawnSync("powershell", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process | ForEach-Object { $_.CommandLine }"], { encoding: "utf8" }).stdout || ""
    : spawnSync("ps", ["-eo", "args"], { encoding: "utf8" }).stdout || "";
  const alive = listing.split(/\r?\n/).filter((l) => l.includes(TMP) && !l.includes("Get-CimInstance") && !/^ps /.test(l));
  clause("LAST", alive.length === 0, `${alive.length} node process(es) naming ${TMP}`);
  try { rmSync(TMP, { recursive: true, force: true }); } catch { }

  const n = greens.length + reds.length;
  if (reds.length) { console.log(`RED MJD3 · ${reds.join(" ")}`); process.exit(1); }
  console.log(`GREEN MJD3 the settle tail is bounded inside the round's budget and a kill mid-settle lands each rep on its owner's log exactly once (J4 re-based on mjd4, row 1112 (1)) · ${n} clause(s)`);
  process.exit(0);
}
main().catch((e) => { console.log(`RED MJD3 · WITNESS-THREW ${String(e && e.message || e).slice(0, 160)}`); process.exit(1); });
