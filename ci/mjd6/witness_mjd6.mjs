#!/usr/bin/env node
// ============================================================================
// witness_mjd6.mjs — unit mjd6 (forks row 1037 (2) F1): A FAILED RETIRE NEVER LEAVES A SETTLED CARD LIVE.
// CONTRACT:  node ci/mjd6/witness_mjd6.mjs --org <tree> --base-org <tree>
//   Each tree is COPIED under os.tmpdir() per scenario. The REAL judge round (gaffer_brain.mjs gradeJudge) runs in a child
//   process of the copy with the REAL card owner (the copy's captains_call.mjs `file`, its own default spawn) writing a planted
//   deck under os.tmpdir() (ARSENAL_CALL_STATE_DIR, that organ's declared seam), and the REAL capture.mjs rep as the owner
//   whenever a round lets the owner through. The judge's grade queue is planted IN that deck dir (the card owner reads it
//   there, read-only). No model is called: the judge call is a plant answering at once. ONE seam is planted: the round's
//   retire door (deps.retireCard) answers a failed spawn — the exact failure mjd5 FORK 1 names. Then the REAL card owner's
//   `sync` and `deal` run on the deck, as his anchor would.
//   Three captures are planted; rounds 1 and 2 refuse every owner (each capture is ONE card under judge:in-doubt:<id>).
//   S1 SWEPT          · round 3 lets every owner through but every retire fails: after the owner's sync NO live card stands
//                       under any of the three keys, and the anchor's deal deals none of them.
//   S2 STILL IN DOUBT · round 3 refuses ONE capture and lets two through (their retires fail): after sync EXACTLY ONE live
//                       in-doubt card stands, the refused one's, the same card (one key, one id), never a second.
//   S3 ONCE           · after S1's sweep: a second sync and a deal move no in-doubt card — each is retired exactly once, with
//                       the sweep's epitaph, at the first sweep's instant.
//   BOUND outside ci/, only scripts/{captains_call,gaffer_brain}.mjs differ between the trees.
//   LAST  no node process naming this run's temp dir survives.
// THE PORT CLASS (row 1053): no port is bound, no live service is named or posted at; every child is spawnSync with a bound
// derived from a node start measured in this run (never a typed number of ms).
// LAST LINE: GREEN MJD6 <what> · <n> clause(s) (exit 0) | RED MJD6 · <clauses> (exit 1)
// Portable: no POSIX-only shell; every file read is split on /\r?\n/.
// ============================================================================
import { mkdtempSync, writeFileSync, readFileSync, existsSync, readdirSync, statSync, rmSync, cpSync, mkdirSync, lstatSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const ORG = arg("--org") && resolve(arg("--org")), BASE = arg("--base-org") && resolve(arg("--base-org"));
if (!ORG || !BASE) { console.log("RED MJD6 · USAGE (--org <dir> --base-org <dir>)"); process.exit(1); }
const TMP = mkdtempSync(join(tmpdir(), "mjd6-"));
const reds = [], greens = [];
const clause = (id, ok, line) => { (ok ? greens : reds).push(id); console.log(`${ok ? "GREEN" : "RED  "} ${id} · ${line}`); };

// THE BOUND, MEASURED: one bare node start in this run, scaled by the heaviest child's work (a judge round spawns the card
// owner and capture.mjs once per capture). Never a typed number of ms.
const t0 = process.hrtime.bigint();
spawnSync(process.execPath, ["-e", ""], { encoding: "utf8" });
const nodeStartMs = Math.max(1, Number(process.hrtime.bigint() - t0) / 1e6);
const BOUND_MS = Math.ceil(nodeStartMs * 1000);

const CHILD = join(TMP, "child.mjs");
writeFileSync(CHILD, String.raw`
import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
const [tree, scenario, qf, out, refuseId] = process.argv.slice(2);
const gb = await import(pathToFileURL(join(tree, "scripts", "gaffer_brain.mjs")).href);
const rows = readFileSync(qf, "utf8").split(/\r?\n/).filter(Boolean).map((l) => JSON.parse(l));
const ids = rows.filter((r) => r.kind === "capture").map((r) => ({ id: r.id, v: "avoided" }));
const owner = (cmd) => {
  if (!cmd || !cmd.organ) return { ok: true, noop: true };
  const o = execFileSync(process.execPath, [join(tree, "scripts", cmd.organ), ...cmd.argv], { encoding: "utf8" });
  return cmd.organ === "capture.mjs" ? gb.captureVerdict(o) : { ok: true };
};
const keyOf = (cmd) => { const a = (cmd && cmd.argv) || []; const i = a.indexOf("--idem"); return i >= 0 ? a[i + 1] : null; };
const retires = [];
const deps = {
  rows, judgeHistory: [], now: new Date(), cartridge: "HEAD", headRides: false,
  verify: async () => ({ ran: false, checks: {}, calls: 0, duration_ms: 0 }),
  generate: async () => ({ ok: true, duration_ms: 1, text: JSON.stringify({ grades: ids.map((x) => ({ id: x.id, verdict: x.v, why: "w" })) }) }),
  appendRow: (p, row) => { appendFileSync(qf, JSON.stringify(row) + "\n"); return { ok: true }; },
  secondOpinion: async () => ({ ok: false, reason: "lane-down" }),
  // fileCard is NOT planted: the round's own default spawns the copy's captains_call.mjs.
  // retireCard IS planted, and it FAILS: the card owner's spawn did not reach the deck (mjd5 FORK 1).
  retireCard: (key) => { retires.push(key); return { ok: false, error: "planted: the card owner's spawn failed" }; },
  dispatch: (cmd) => {
    if (scenario === "refuse") return { ok: false, error: "planted refusal" };
    if (scenario === "refuse-one" && keyOf(cmd) === refuseId) return { ok: false, error: "planted refusal" };
    return owner(cmd);
  },
};
const res = await gb.gradeJudge(deps);
writeFileSync(out, JSON.stringify({ ok: res.ok, in_doubt: res.in_doubt || null, resolved: res.resolved_in_doubt || null, retires }));
process.exit(0);
`);

const copyTree = (src) => { const d = mkdtempSync(join(TMP, "tree-")); cpSync(src, d, { recursive: true, verbatimSymlinks: true }); return d; };
const tag = Math.random().toString(36).slice(2, 8);
const caps = () => [0, 1, 2].map((i) => ({ v: 2, kind: "capture", id: `w6${tag}${i}`, type: "trap", ref: `tokenization:${i}`, concept: "tokenization", axis: "a",
  label: `w6 ${tag} q${i}`, asked: `w6 ${tag} q${i}`, gut: "knew", spoken: "x", ts: new Date().toISOString() }));

function world(src) {
  const tree = copyTree(src), deckDir = join(TMP, `deck-${Math.random().toString(36).slice(2, 8)}`);
  mkdirSync(deckDir, { recursive: true });
  const qf = join(deckDir, "gaffer_grade_queue.jsonl");   // the judge's queue, where the card owner reads it (its STATE_DIR seam)
  const items = caps();
  writeFileSync(qf, items.map((x) => JSON.stringify(x)).join("\n") + "\n");
  const env = { ...process.env, ARSENAL_CALL_STATE_DIR: deckDir };
  delete env.ARSENAL_ORGAN;   // the anchor's deal is silent for an organ child; this deal stands where he does
  const opt = { encoding: "utf8", env, timeout: BOUND_MS, windowsHide: true };
  const run = (scenario, refuseId = "") => {
    const out = join(TMP, `out-${Math.random().toString(36).slice(2, 8)}.json`);
    const r = spawnSync(process.execPath, [CHILD, tree, scenario, qf, out, refuseId], opt);
    return { code: r.status, err: String(r.stderr || "").split(/\r?\n/).filter(Boolean).slice(-1)[0] || "", o: existsSync(out) ? JSON.parse(readFileSync(out, "utf8")) : null };
  };
  const deckPath = join(deckDir, "captains_call.json");
  const deck = () => (existsSync(deckPath) ? JSON.parse(readFileSync(deckPath, "utf8")) : { cards: [] });
  const keyed = (id) => deck().cards.filter((c) => c.key === `judge:in-doubt:${id}`);
  const liveKeys = () => deck().cards.filter((c) => /^judge:in-doubt:/.test(c.key) && !c.answer && !c.retired_at).map((c) => c.key).sort();
  const inDoubtCards = () => JSON.stringify(deck().cards.filter((c) => /^judge:in-doubt:/.test(c.key)).map((c) => ({ id: c.id, key: c.key, retired_at: c.retired_at, resolution: c.resolution, answer: c.answer })));
  const cli = (argv) => { const r = spawnSync(process.execPath, [join(tree, "scripts", "captains_call.mjs"), ...argv], opt); return { status: r.status, out: String(r.stdout || "") }; };
  return { tree, items, run, deck, keyed, liveKeys, inDoubtCards, cli };
}

// ── S1 + S3 — one world: refused twice (three cards), then resolved with every retire failing, then the owner's passes ──
const w = world(ORG);
const r1 = w.run("refuse"), r2 = w.run("refuse");
const carded = w.liveKeys();
const r3 = w.run("all");
const gap = w.liveKeys();   // the gap mjd5 FORK 1 names: settled, but its card still live
const sync1 = w.cli(["sync"]);
const left = w.liveKeys();
const deal1 = w.cli(["deal"]);
const dealtInDoubt = w.items.some((x) => deal1.out.includes(`trap:tokenization:${x.ref.split(":")[1]}`)) || /judged answer/.test(deal1.out);
clause("S1", r1.code === 0 && r2.code === 0 && r3.code === 0 && sync1.status === 0 && deal1.status === 0 && carded.length === 3
  && r3.o && Array.isArray(r3.o.resolved) && r3.o.resolved.length === 3 && r3.o.resolved.every((x) => x.card_retired && x.card_retired.ok === false)
  && gap.length === 3 && left.length === 0 && !dealtInDoubt,
  `round 2 carded ${carded.length} (must be 3) · round 3 resolved ${r3.o && r3.o.resolved ? r3.o.resolved.length : `none (${r3.err})`} with every retire failed (must be 3) · live after the round ${gap.length} (the gap, 3) · live after the owner's sync ${left.length} (must be 0) · the anchor dealt an in-doubt card ${dealtInDoubt} (must be false)`);
{
  const before = w.inDoubtCards(), stamps = w.items.map((x) => w.keyed(x.id).map((c) => c.retired_at || null)[0]);
  const s2 = w.cli(["sync"]), d2 = w.cli(["deal"]);
  const after = w.inDoubtCards();
  const once = w.items.every((x, i) => { const k = w.keyed(x.id); return k.length === 1 && !!k[0].retired_at && k[0].retired_at === stamps[i]
    && (String(k[0].resolution || "").match(/resolved-at-source/g) || []).length === 1 && /the sweep/.test(String(k[0].resolution || "")); });
  clause("S3", s2.status === 0 && d2.status === 0 && before === after && once,
    `a second sync exit ${s2.status} and deal exit ${d2.status} · in-doubt cards unmoved ${before === after} · each card retired exactly once with the sweep's epitaph ${once}`);
}

// ── S2 — a mixed round: one capture still refused, two resolved with their retires failed ──
{
  const v = world(ORG);
  v.run("refuse"); v.run("refuse");
  const stuck = v.items[1].id, cardBefore = v.keyed(stuck).map((c) => c.id);
  const r = v.run("refuse-one", stuck);
  const sy = v.cli(["sync"]);
  const live = v.liveKeys(), cardAfter = v.keyed(stuck);
  clause("S2", r.code === 0 && sy.status === 0 && live.length === 1 && live[0] === `judge:in-doubt:${stuck}` && cardAfter.length === 1 && cardBefore.length === 1 && cardAfter[0].id === cardBefore[0]
    && r.o && Array.isArray(r.o.in_doubt) && r.o.in_doubt.length === 1 && r.o.in_doubt[0].of === stuck && Array.isArray(r.o.resolved) && r.o.resolved.length === 2,
    `live in-doubt cards after the mixed round and sync ${JSON.stringify(live.map((k) => k.slice(-4)))} (must be exactly the refused one, …${stuck.slice(-4)}) · its cards ${cardAfter.length} (must be 1, the same id) · receipt in_doubt ${r.o && r.o.in_doubt ? r.o.in_doubt.length : `none (${r.err})`} resolved ${r.o && r.o.resolved ? r.o.resolved.length : "none"}`);
}

const walk = (root, d = root, acc = new Map()) => {
  for (const e of readdirSync(d)) {
    if (e === ".git" || e === "node_modules") continue;
    const p = join(d, e);
    if (lstatSync(p).isSymbolicLink()) continue;
    const st = statSync(p);
    if (st.isDirectory()) walk(root, p, acc); else acc.set(relative(root, p).replace(/\\/g, "/"), createHash("sha256").update(readFileSync(p)).digest("hex"));
  }
  return acc;
};
const A = walk(BASE), B = walk(ORG);
const differ = [...new Set([...A.keys(), ...B.keys()])].filter((k) => !k.startsWith("ci/") && A.get(k) !== B.get(k)).sort();   // ci/ is the witness itself
const allowed = ["scripts/captains_call.mjs", "scripts/gaffer_brain.mjs"];
clause("BOUND", differ.every((f) => allowed.includes(f)), `differs: ${differ.join(", ") || "nothing"}`);

const listing = process.platform === "win32"
  ? spawnSync("powershell", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process | ForEach-Object { $_.CommandLine }"], { encoding: "utf8", timeout: BOUND_MS }).stdout || ""
  : spawnSync("ps", ["-eo", "args"], { encoding: "utf8", timeout: BOUND_MS }).stdout || "";
const alive = listing.split(/\r?\n/).filter((l) => l.includes(TMP) && !l.includes("Get-CimInstance") && !/^ps /.test(l));
clause("LAST", alive.length === 0, `${alive.length} node process(es) naming ${TMP}`);
try { rmSync(TMP, { recursive: true, force: true }); } catch { }
if (reds.length) { console.log(`RED MJD6 · ${reds.join(" ")}`); process.exit(1); }
console.log(`GREEN MJD6 a failed retire never leaves a settled card live — the owner's sync sweeps it, once · ${greens.length} clause(s)`);
process.exit(0);
