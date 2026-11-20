#!/usr/bin/env node
// ============================================================================
// witness_mjd4.mjs — unit mjd4 (forks row 1030 (2)): A CAPTURE IN DOUBT IS RE-DISPATCHED EXACTLY ONCE.
// CONTRACT:  node ci/mcr/witness_mjd4.mjs --org <tree> --base-org <tree>
//   Each tree is COPIED under os.tmpdir() per scenario; the REAL owners (capture.mjs rep, rejirah.mjs grade) run in the copy
//   and write only the copy. No model is called: the judge call is a plant answering at once.
//   I1 KILL BEFORE THE OWNER'S WRITE · round 1 dies before its 2nd owner call; round 2 (a fresh process, the real owner
//      doors) lands that rep exactly ONCE.
//   I2 KILL AFTER THE OWNER'S WRITE · round 1 dies after its 2nd owner wrote; round 2 lands it once, never twice.
//   I3 capture.mjs rep · the same verdict handed twice under one --idem (its clock differs) appends ONE rep.
//   I4 rejirah.mjs grade · the same verdict handed twice under one --idem appends ONE row.
//   I5 NEVER SILENT · while its owner refuses, every capture in doubt is ONE card per round under one stable key, never two.
//   BOUND outside ci/, only scripts/{gaffer_brain,capture,rejirah,doubtminer}.mjs differ between the trees.
//   LAST no node process naming this run's temp dir survives.
// LAST LINE: GREEN MJD4 <what> · <n> clause(s) (exit 0) | RED MJD4 · <clauses> (exit 1)
// ============================================================================
import { mkdtempSync, writeFileSync, readFileSync, existsSync, readdirSync, statSync, rmSync, cpSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const ORG = arg("--org") && resolve(arg("--org")), BASE = arg("--base-org") && resolve(arg("--base-org"));
if (!ORG || !BASE) { console.log("RED MJD4 · USAGE (--org <dir> --base-org <dir>)"); process.exit(1); }
const TMP = mkdtempSync(join(tmpdir(), "mjd4-"));
const reds = [], greens = [];
const clause = (id, ok, line) => { (ok ? greens : reds).push(id); console.log(`${ok ? "GREEN" : "RED  "} ${id} · ${line}`); };

const CHILD = join(TMP, "child.mjs");
writeFileSync(CHILD, String.raw`
import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
const [tree, scenario, qf, out] = process.argv.slice(2);
const gb = await import(pathToFileURL(join(tree, "scripts", "gaffer_brain.mjs")).href);
const rows = readFileSync(qf, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
const ids = rows.filter((r) => r.kind === "capture").map((r) => ({ id: r.id, v: r.type === "axis_weld" ? "held" : "avoided" }));
const cards = [];
let n = 0;
const owner = (cmd) => {
  if (!cmd || !cmd.organ) return { ok: true, noop: true };
  const o = execFileSync(process.execPath, [join(tree, "scripts", cmd.organ), ...cmd.argv], { encoding: "utf8" });
  return cmd.organ === "capture.mjs" ? gb.captureVerdict(o) : { ok: true };
};
const deps = {
  rows, judgeHistory: [], now: new Date(), cartridge: "HEAD", headRides: false,
  verify: async () => ({ ran: false, checks: {}, calls: 0, duration_ms: 0 }),
  generate: async () => ({ ok: true, duration_ms: 1, text: JSON.stringify({ grades: ids.map((x) => ({ id: x.id, verdict: x.v, why: "w" })) }) }),
  fileCard: (line, key) => { cards.push(key); return { ok: true, out: "" }; },
  appendRow: (p, row) => { appendFileSync(qf, JSON.stringify(row) + "\n"); return { ok: true }; },
  secondOpinion: async () => ({ ok: false, reason: "lane-down" }),
};
if (scenario === "before" || scenario === "after") deps.dispatch = (cmd) => {
  n++;
  if (n === 2 && scenario === "before") process.exit(9);
  const r = owner(cmd);
  if (n === 2 && scenario === "after") process.exit(9);
  return r;
};
if (scenario === "refuse") deps.dispatch = () => ({ ok: false, error: "planted refusal" });
const res = await gb.gradeJudge(deps);
writeFileSync(out, JSON.stringify({ cards, in_doubt: res.in_doubt || null, resolved: res.resolved_in_doubt || null, ok: res.ok }));
process.exit(0);
`);

const copyTree = (src) => { const d = mkdtempSync(join(TMP, "tree-")); cpSync(src, d, { recursive: true }); return d; };
const lines = (p) => (existsSync(p) ? readFileSync(p, "utf8").split("\n").filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean) : []);
const REPS = (t) => join(t, "dressing-room", "state", "reps_log.jsonl");
const REJ = (t) => join(t, "dressing-room", "state", "rejirah_log.jsonl");
const tag = Math.random().toString(36).slice(2, 8);
const caps = () => [0, 1, 2].map((i) => ({ v: 2, kind: "capture", id: `w4${tag}${i}`, type: "trap", ref: `tokenization:${i}`, concept: "tokenization", axis: "a",
  label: `w4 ${tag} q${i}`, asked: `w4 ${tag} q${i}`, gut: "knew", spoken: "x", ts: new Date().toISOString() }));
const run = (tree, scenario, qf) => {
  const out = join(TMP, `out-${scenario}-${Math.random().toString(36).slice(2, 6)}.json`);
  const r = spawnSync(process.execPath, [CHILD, tree, scenario, qf, out], { encoding: "utf8" });
  return { code: r.status, err: String(r.stderr || "").split("\n").filter(Boolean).slice(-1)[0] || "", o: existsSync(out) ? JSON.parse(readFileSync(out, "utf8")) : null };
};
function killCase(kind) {
  const tree = copyTree(ORG), qf = join(TMP, `q-${kind}.jsonl`);
  const items = caps();
  writeFileSync(qf, items.map((x) => JSON.stringify(x)).join("\n") + "\n");
  const r1 = run(tree, kind, qf);
  const r2 = run(tree, "round2", qf);
  const q = items[1].asked;
  const count = lines(REPS(tree)).filter((r) => r.question === q).length;
  return { r1, r2, count, all: items.map((x) => lines(REPS(tree)).filter((r) => r.question === x.asked).length) };
}

const k1 = killCase("before");
clause("I1", k1.r1.code === 9 && k1.count === 1 && k1.all.every((c) => c === 1),
  `round 1 exit ${k1.r1.code} · round 2 ${k1.r2.o ? `resolved ${JSON.stringify((k1.r2.o.resolved || []).length)}` : `no receipt (${k1.r2.err})`} · reps per capture ${JSON.stringify(k1.all)} (each must be 1)`);
const k2 = killCase("after");
clause("I2", k2.r1.code === 9 && k2.count === 1 && k2.all.every((c) => c === 1),
  `round 1 exit ${k2.r1.code} · reps per capture ${JSON.stringify(k2.all)} (each must be 1)`);

{ // I3 — capture.mjs rep twice under one key, its own clock stamping each arrival
  const tree = copyTree(ORG), q = `w4 ${tag} idem-capture`;
  const a = ["rep", "--concept", "tokenization", "--axis", "a", "--q", q, "--gut", "knew", "--correct", "true", "--idem", `w4${tag}k3`];
  spawnSync(process.execPath, [join(tree, "scripts", "capture.mjs"), ...a], { encoding: "utf8" });
  spawnSync(process.execPath, ["-e", "setTimeout(()=>{}, 5)"]);   // a later arrival: a different clock
  spawnSync(process.execPath, [join(tree, "scripts", "capture.mjs"), ...a], { encoding: "utf8" });
  const c = lines(REPS(tree)).filter((r) => r.question === q).length;
  clause("I3", c === 1, `the same verdict twice under one --idem → ${c} rep(s) on reps_log (must be 1)`);
}
{ // I4 — rejirah.mjs grade twice under one key
  const tree = copyTree(ORG), before = lines(REJ(tree)).length;
  const a = ["grade", "tokenization", "a", "held", "--gut", "knew", "--idem", `w4${tag}k4`];
  spawnSync(process.execPath, [join(tree, "scripts", "rejirah.mjs"), ...a], { encoding: "utf8" });
  spawnSync(process.execPath, [join(tree, "scripts", "rejirah.mjs"), ...a], { encoding: "utf8" });
  const c = lines(REJ(tree)).length - before;
  clause("I4", c === 1, `the same verdict twice under one --idem → ${c} row(s) appended to rejirah_log (must be 1)`);
}
{ // I5 — a capture in doubt whose owner refuses: one card per capture per round, one stable key
  const tree = copyTree(ORG), qf = join(TMP, "q-refuse.jsonl");
  const items = caps();
  writeFileSync(qf, items.map((x) => JSON.stringify(x)).join("\n") + "\n");
  run(tree, "before", qf);
  const a = run(tree, "refuse", qf), b = run(tree, "refuse", qf);
  const ka = a.o ? a.o.cards.filter((k) => /in-doubt/.test(k)) : [], kb = b.o ? b.o.cards.filter((k) => /in-doubt/.test(k)) : [];
  const want = `judge:in-doubt:${items[1].id}`;
  const onePer = (ks, o) => new Set(ks).size === ks.length && o && o.in_doubt && ks.length === o.in_doubt.length
    && o.in_doubt.every((x) => ks.includes(`judge:in-doubt:${x.of}`));
  clause("I5", ka.includes(want) && kb.includes(want) && onePer(ka, a.o) && onePer(kb, b.o),
    `in-doubt card keys, round 2 ${JSON.stringify(ka)} · round 3 ${JSON.stringify(kb)} (one per capture in doubt, ${want} in both, never twice)`);
}

const walk = (root, d = root, acc = new Map()) => {
  for (const e of readdirSync(d)) {
    if (e === ".git" || e === "node_modules") continue;
    const p = join(d, e), st = statSync(p);
    if (st.isDirectory()) walk(root, p, acc); else acc.set(relative(root, p).replace(/\\/g, "/"), createHash("sha256").update(readFileSync(p)).digest("hex"));
  }
  return acc;
};
const A = walk(BASE), B = walk(ORG);
const differ = [...new Set([...A.keys(), ...B.keys()])].filter((k) => !k.startsWith("ci/") && A.get(k) !== B.get(k)).sort();   // ci/ is the witness itself
const allowed = ["scripts/capture.mjs", "scripts/doubtminer.mjs", "scripts/gaffer_brain.mjs", "scripts/rejirah.mjs"];
clause("BOUND", differ.every((f) => allowed.includes(f)), `differs: ${differ.join(", ") || "nothing"}`);

const listing = process.platform === "win32"
  ? spawnSync("powershell", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process | ForEach-Object { $_.CommandLine }"], { encoding: "utf8" }).stdout || ""
  : spawnSync("ps", ["-eo", "args"], { encoding: "utf8" }).stdout || "";
const alive = listing.split(/\r?\n/).filter((l) => l.includes(TMP) && !l.includes("Get-CimInstance") && !/^ps /.test(l));
clause("LAST", alive.length === 0, `${alive.length} node process(es) naming ${TMP}`);
try { rmSync(TMP, { recursive: true, force: true }); } catch { }
if (reds.length) { console.log(`RED MJD4 · ${reds.join(" ")}`); process.exit(1); }
console.log(`GREEN MJD4 a capture in doubt lands exactly once, and until it does it is one card · ${greens.length} clause(s)`);
process.exit(0);
