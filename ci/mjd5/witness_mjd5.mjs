#!/usr/bin/env node
// ============================================================================
// witness_mjd5.mjs — unit mjd5 (forks row 1033 (2)): THE IN-DOUBT CARD RETIRES AT SOURCE.
// CONTRACT:  node ci/mjd5/witness_mjd5.mjs --org <tree> --base-org <tree>
//   Each tree is COPIED under os.tmpdir() per scenario. The REAL judge round (gaffer_brain.mjs gradeJudge) runs in a child
//   process of the copy, with the REAL card owner (the copy's captains_call.mjs, `file` and `retire`, its own default spawn)
//   writing a planted deck under os.tmpdir() (ARSENAL_CALL_STATE_DIR, that organ's declared seam), and the REAL capture.mjs rep
//   as the owner whenever a round lets the owner through. No model is called: the judge call is a plant answering at once.
//   Three captures are planted; round 1's owner refuses all three (each is left in doubt), round 2's refuses all three again
//   (each becomes ONE card under judge:in-doubt:<id>).
//   R1 RESOLVED       · round 3 lets every owner through: each capture resolves, and NO live card stands under any of the three keys.
//   R2 STILL IN DOUBT · round 3 refuses ONE capture and lets two through: EXACTLY ONE live in-doubt card stands, the refused one's,
//                       and its card is the same card (one key, one id), never a second.
//   R3 SECOND RESOLVE · after R1's resolve: a round 4 and a second `retire` of the same key through the owner's CLI retire nothing
//                       twice — the deck's bytes do not move, and each card carries the round-3 epitaph exactly once.
//   BOUND outside ci/, only scripts/{captains_call,gaffer_brain}.mjs differ between the trees.
//   LAST  no node process naming this run's temp dir survives.
// LAST LINE: GREEN MJD5 <what> · <n> clause(s) (exit 0) | RED MJD5 · <clauses> (exit 1)
// Portable: no POSIX-only shell; every file read is split on /\r?\n/.
// ============================================================================
import { mkdtempSync, writeFileSync, readFileSync, existsSync, readdirSync, statSync, rmSync, cpSync, mkdirSync, lstatSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const ORG = arg("--org") && resolve(arg("--org")), BASE = arg("--base-org") && resolve(arg("--base-org"));
if (!ORG || !BASE) { console.log("RED MJD5 · USAGE (--org <dir> --base-org <dir>)"); process.exit(1); }
const TMP = mkdtempSync(join(tmpdir(), "mjd5-"));
const reds = [], greens = [];
const clause = (id, ok, line) => { (ok ? greens : reds).push(id); console.log(`${ok ? "GREEN" : "RED  "} ${id} · ${line}`); };

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
const deps = {
  rows, judgeHistory: [], now: new Date(), cartridge: "HEAD", headRides: false,
  verify: async () => ({ ran: false, checks: {}, calls: 0, duration_ms: 0 }),
  generate: async () => ({ ok: true, duration_ms: 1, text: JSON.stringify({ grades: ids.map((x) => ({ id: x.id, verdict: x.v, why: "w" })) }) }),
  appendRow: (p, row) => { appendFileSync(qf, JSON.stringify(row) + "\n"); return { ok: true }; },
  secondOpinion: async () => ({ ok: false, reason: "lane-down" }),
  // fileCard / retireCard are NOT planted: the round's own default spawns the copy's captains_call.mjs.
  dispatch: (cmd) => {
    if (scenario === "refuse") return { ok: false, error: "planted refusal" };
    if (scenario === "refuse-one" && keyOf(cmd) === refuseId) return { ok: false, error: "planted refusal" };
    return owner(cmd);
  },
};
const res = await gb.gradeJudge(deps);
writeFileSync(out, JSON.stringify({ ok: res.ok, in_doubt: res.in_doubt || null, resolved: res.resolved_in_doubt || null }));
process.exit(0);
`);

const copyTree = (src) => { const d = mkdtempSync(join(TMP, "tree-")); cpSync(src, d, { recursive: true, verbatimSymlinks: true }); return d; };
const tag = Math.random().toString(36).slice(2, 8);
const caps = () => [0, 1, 2].map((i) => ({ v: 2, kind: "capture", id: `w5${tag}${i}`, type: "trap", ref: `tokenization:${i}`, concept: "tokenization", axis: "a",
  label: `w5 ${tag} q${i}`, asked: `w5 ${tag} q${i}`, gut: "knew", spoken: "x", ts: new Date().toISOString() }));

function world(src) {
  const tree = copyTree(src), deckDir = join(TMP, `deck-${Math.random().toString(36).slice(2, 8)}`), qf = join(TMP, `q-${Math.random().toString(36).slice(2, 8)}.jsonl`);
  mkdirSync(deckDir, { recursive: true });
  const items = caps();
  writeFileSync(qf, items.map((x) => JSON.stringify(x)).join("\n") + "\n");
  const env = { ...process.env, ARSENAL_CALL_STATE_DIR: deckDir };
  const run = (scenario, refuseId = "") => {
    const out = join(TMP, `out-${Math.random().toString(36).slice(2, 8)}.json`);
    const r = spawnSync(process.execPath, [CHILD, tree, scenario, qf, out, refuseId], { encoding: "utf8", env });
    return { code: r.status, err: String(r.stderr || "").split(/\r?\n/).filter(Boolean).slice(-1)[0] || "", o: existsSync(out) ? JSON.parse(readFileSync(out, "utf8")) : null };
  };
  const deckPath = join(deckDir, "captains_call.json");
  const deck = () => (existsSync(deckPath) ? JSON.parse(readFileSync(deckPath, "utf8")) : { cards: [] });
  const raw = () => (existsSync(deckPath) ? readFileSync(deckPath) : Buffer.alloc(0));
  const keyed = (id) => deck().cards.filter((c) => c.key === `judge:in-doubt:${id}`);
  const liveKeys = () => deck().cards.filter((c) => /^judge:in-doubt:/.test(c.key) && !c.answer && !c.retired_at).map((c) => c.key).sort();
  const cli = (argv) => spawnSync(process.execPath, [join(tree, "scripts", "captains_call.mjs"), ...argv], { encoding: "utf8", env });
  return { tree, items, run, deck, raw, keyed, liveKeys, cli };
}

// ── R1 + R3 — one world: refused twice (three cards), then resolved, then resolved again ──
const w = world(ORG);
const r1 = w.run("refuse"), r2 = w.run("refuse");
const carded = w.liveKeys();
const r3 = w.run("all");
const left = w.liveKeys();
clause("R1", r1.code === 0 && r2.code === 0 && r3.code === 0 && carded.length === 3 && left.length === 0
  && r3.o && Array.isArray(r3.o.resolved) && r3.o.resolved.length === 3,
  `round 2 carded ${carded.length} capture(s) in doubt (must be 3) · round 3 resolved ${r3.o && r3.o.resolved ? r3.o.resolved.length : `none (${r3.err})`} (must be 3) · live in-doubt cards after ${JSON.stringify(left.length)} (must be 0)`);
{
  const before = w.raw(), stamps = w.items.map((x) => w.keyed(x.id).map((c) => c.retired_at || null));
  const r4 = w.run("all");
  const afterRound = w.raw();
  const again = w.cli(["retire", "--key", `judge:in-doubt:${w.items[0].id}`, "--why", "a second resolve"]);
  const afterCli = w.raw();
  const once = w.items.every((x, i) => { const k = w.keyed(x.id); return k.length === 1 && !!k[0].retired_at && k[0].retired_at === stamps[i][0]
    && (String(k[0].resolution || "").match(/resolved-at-source/g) || []).length === 1 && !/a second resolve/.test(k[0].resolution); });
  clause("R3", r4.code === 0 && again.status === 0 && before.equals(afterRound) && before.equals(afterCli) && once,
    `round 4 exit ${r4.code} · a second retire of one key exit ${again.status} · deck bytes unmoved by round 4 ${before.equals(afterRound)} and by the second retire ${before.equals(afterCli)} · each card retired exactly once with the round-3 epitaph ${once}`);
}

// ── R2 — a mixed round: one capture still refused, two resolved ──
{
  const v = world(ORG);
  v.run("refuse"); v.run("refuse");
  const stuck = v.items[1].id, cardBefore = v.keyed(stuck).map((c) => c.id);
  const r = v.run("refuse-one", stuck);
  const live = v.liveKeys(), cardAfter = v.keyed(stuck);
  clause("R2", r.code === 0 && live.length === 1 && live[0] === `judge:in-doubt:${stuck}` && cardAfter.length === 1 && cardBefore.length === 1 && cardAfter[0].id === cardBefore[0]
    && r.o && Array.isArray(r.o.in_doubt) && r.o.in_doubt.length === 1 && r.o.in_doubt[0].of === stuck,
    `live in-doubt cards after the mixed round ${JSON.stringify(live.map((k) => k.slice(-4)))} (must be exactly the refused one, …${stuck.slice(-4)}) · its cards ${cardAfter.length} (must be 1, the same id) · receipt in_doubt ${r.o && r.o.in_doubt ? r.o.in_doubt.length : `none (${r.err})`}`);
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
  ? spawnSync("powershell", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process | ForEach-Object { $_.CommandLine }"], { encoding: "utf8" }).stdout || ""
  : spawnSync("ps", ["-eo", "args"], { encoding: "utf8" }).stdout || "";
const alive = listing.split(/\r?\n/).filter((l) => l.includes(TMP) && !l.includes("Get-CimInstance") && !/^ps /.test(l));
clause("LAST", alive.length === 0, `${alive.length} node process(es) naming ${TMP}`);
try { rmSync(TMP, { recursive: true, force: true }); } catch { }
if (reds.length) { console.log(`RED MJD5 · ${reds.join(" ")}`); process.exit(1); }
console.log(`GREEN MJD5 the in-doubt card retires at source when its capture resolves, once · ${greens.length} clause(s)`);
process.exit(0);
