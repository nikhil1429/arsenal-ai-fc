#!/usr/bin/env node
// ============================================================================
// ci/witness/mleft/witness_left.mjs — UNIT mleft · WHAT IS LEFT, READ BY ONE COMMAND (spec ci/mwit/MWIT_SPEC.md @ 88bf69d,
//   UNITS row 3; rulings forks rows 1162 / 1163 — where the spec and a ruling differ, the RULING wins)
// ----------------------------------------------------------------------------
// ONE READER: every clause below spawns `node scripts/done.mjs json` (unit mdone's organ, SOLE WRITER of nothing) at THIS
//   tree's root and judges its JSON. done.mjs is never edited (UNITS row 3) and stays exit 0 for the /matchday anchor (F9 b):
//   the law lives HERE. This file writes nothing outside os.tmpdir() and never opens a state file for writing.
// THE EXIT LAW (spec §0): 0 the clause HOLDS · 1 RED (read, and it does not hold) · 2 UNREAD (a fact it needs is absent or
//   unreadable — never a green). Where one clause reads both, UNREAD wins (spec C:finish-zero: "the witness reports the worse,
//   2"). A fact only his laptop or the campaign tree holds reads UNREAD on the cloud, never green (row 1162 (5)).
// CLAUSE MODES (the form the receipt organ accepts: `node <tracked path> [plain args]`, rung_receipt.mjs parseWitness):
//   node ci/witness/mleft/witness_left.mjs answers --campaign <dir>   B-left:one-command — every check of done.mjs json is
//        COMPUTED: orphans numeric, rungs.read, units.read, census.read, laws counted, ten/register/teaching neither LIVE
//        (null) nor unread, reach an array, the form not hermetic. It does not judge zero (that is finish).
//   node ci/witness/mleft/witness_left.mjs census  --campaign <dir>   C:census-510 — done.mjs census read, PENDING 0, unfated 0,
//        the row count EQUALS the size the plan v3 list states (`census_size`, read from <campaign>/rungs/plan_v3.json, never
//        typed: F6 a), and every row carries decided_by "code", or "judgement" with a non-empty `code_cannot` (the check that
//        could not decide).
//   node ci/witness/mleft/witness_left.mjs reach   --campaign <dir>   C:capability-c29 — row 1163 (5): REACHED MEANS THE WINDOW
//        REACH, NEVER THE STATIC REACH ALONE. Every lane with a consumer (not NO CONSUMER, not RETIRED — retirement read from
//        gate.mjs LANE_CONSUMERS, the registry's own derived view) reads window true AND reached true; the consumption ledger
//        (dressing-room/state/consumption.jsonl, sole writer brain.mjs) must exist, else the window is unknowable here → 2.
//   node ci/witness/mleft/witness_left.mjs finish  --campaign <dir>   C:finish-zero — orphans lanes 0 and verbs 0; rungs g = n
//        with u = r = x = 0, no hand row, the receipt chain holding, loops lg = ln; laws both = n; ten laws verify = n; the
//        register site = n; the teaching rules read (a count, at the laptop).
// PLANTS MODE (the suite's door, row 1162 (2); unit mmeter's member runs it):
//   node ci/witness/mleft/witness_left.mjs [plants] [--org <dir>] [--base-org <dir>] [--only <clause>[,<clause>…]]
//   --org       the tree to witness (default: this file's own tree). If it carries no ci/witness/mleft/witness_left.mjs, every
//               clause is RED — the clause has no command there (that is the base, main fb42118).
//   --base-org  the BASE tree; BOUND runs only with it (BOUND: only ci/witness/mleft/**, ci/mleft/** and the brief's one
//               effort receipt differ from it; text hashed with CRLF folded to LF; tracked + untracked-unignored files when the
//               tree is a git work tree, else a walk without .git / node_modules).
//   --only      run only the plants of these clause ids (the mutant runner's door); LAST always runs.
// CONTRACT · every plant runs on its OWN copy of --org under os.tmpdir() (never .git, never node_modules — that rides as a
//   link/junction —, never dressing-room/state: each plant's state dir is EMPTY but for what it plants; nothing of his is
//   copied or printed). The env of a plant child drops ORGANISM_TEST_PROFILE unless the plant is the hermetic one, and its
//   HOME / USERPROFILE point under the temp root. No git repo is planted (core.autocrlf: nothing to init). The finish-zero
//   GREEN, one-lane RED and UNREAD plants run over a STUB done.mjs printing a planted JSON (the real tree has orphans, so a zero
//   state cannot be reached by real code — named, not hidden); one finish plant runs the REAL done.mjs. No port is bound, no
//   service named, no daemon posted, nothing restarted, no model spawned (row 1053). Every child is bounded by
//   rung_receipt.mjs WITNESS_TIMEOUT_MS (read from its owner, never typed); plants run concurrently up to
//   os.availableParallelism() (measured, not typed). LAST: no node process whose command line names the temp root survives
//   (PowerShell on Windows, ps elsewhere). Every line read from a process is split on \r?\n.
// LAST LINE: GREEN MLEFT <what> · <n> clause(s) (exit 0) or RED MLEFT · <clauses> (exit 1).
// ============================================================================
import { cpSync, mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync, readdirSync, statSync, symlinkSync } from "node:fs";
import { join, resolve, relative, sep, dirname } from "node:path";
import { tmpdir, availableParallelism } from "node:os";
import { spawnSync, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..", "..", "..");
const SELF = "ci/witness/mleft/witness_left.mjs";
const CLAUSE = Object.freeze({ answers: "B-left:one-command", census: "C:census-510", reach: "C:capability-c29", finish: "C:finish-zero" });
const argv = process.argv.slice(2);
const flag = (k) => { const i = argv.indexOf(k); return i > -1 && argv[i + 1] !== undefined ? argv[i + 1] : null; };
const lines = (s) => String(s || "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
const readJ = (p) => { try { return JSON.parse(readFileSync(p, "utf8")); } catch { return undefined; } };
const num = (x) => typeof x === "number" && Number.isFinite(x);

// ── the bound: the organism's own witness-child bound, read from its owner ─────────────────────────────────────────
async function boundOf(root) {
  try { const m = await import(pathToFileURL(join(root, "scripts", "rung_receipt.mjs")).href); return num(m.WITNESS_TIMEOUT_MS) ? m.WITNESS_TIMEOUT_MS : null; } catch { return null; }
}

// ── THE ONE READER: done.mjs json at this tree's root ──────────────────────────────────────────────────────────────
async function readDone(campaign) {
  const bound = await boundOf(ROOT);
  if (!bound) return { ok: false, why: "the witness-child bound (rung_receipt.mjs WITNESS_TIMEOUT_MS) is unreadable" };
  const args = [join(ROOT, "scripts", "done.mjs"), "json", ...(campaign ? ["--campaign", campaign] : [])];
  const r = spawnSync(process.execPath, args, { cwd: ROOT, env: process.env, encoding: "utf8", windowsHide: true, timeout: bound });
  if (r.status !== 0) return { ok: false, why: `done.mjs json exited ${r.status === null ? "without finishing inside its bound" : r.status}` };
  const last = lines(r.stdout).at(-1);
  let j; try { j = JSON.parse(last || ""); } catch { return { ok: false, why: "done.mjs json printed no JSON line" }; }
  return { ok: true, j };
}

// ── the four judgements (pure: done.mjs json + the files the clause names) → { un: [...], red: [...], ok: [...] } ──
const unread = (j) => j.rules && (j.rules.ten === null || j.rules.register === null || j.rules.teaching === null);
function judgeAnswers(j) {
  const un = [], ok = [];
  if (j.hermetic !== false) un.push("the hermetic form (reach and the laptop rule sets print LIVE)");
  if (!(j.orphans && num(j.orphans.lanes) && num(j.orphans.verbs))) un.push("orphans"); else ok.push(`orphans ${j.orphans.lanes}/${j.orphans.verbs}`);
  if (!(j.rungs && j.rungs.read === true)) un.push(`rungs (${(j.rungs && j.rungs.why) || "unread"})`); else ok.push("rungs");
  if (!(j.units && j.units.read === true)) un.push(`units (${(j.units && j.units.why) || "unread"})`); else ok.push("units");
  if (!(j.census && j.census.read === true)) un.push(`census (${(j.census && j.census.why) || "unread"})`); else ok.push("census");
  const ru = j.rules || {};
  if (!(ru.laws && num(ru.laws.n) && num(ru.laws.both))) un.push("laws/*.yml"); else ok.push("laws");
  for (const k of ["ten", "register", "teaching"]) { if (!ru[k] || ru[k].unread) un.push(`${k} ${ru[k] ? "UNREAD" : "LIVE"}`); else ok.push(k); }
  if (!Array.isArray(j.reach)) un.push(`reach ${j.reach && j.reach.live ? "LIVE" : "UNREAD"}`); else ok.push("reach");
  return { un, red: [], ok };
}
function judgeCensus(j, plan, planRaw, rows) {
  const un = [], red = [];
  if (!(j.census && j.census.read === true)) un.push(`census (${(j.census && j.census.why) || "unread"})`);
  if (!plan || !plan.ok) un.push(`the plan v3 list (${(plan && plan.why) || "unread"})`);
  const size = planRaw && planRaw.census_size;
  if (!(Number.isInteger(size) && size > 0)) un.push("the census size (the plan v3 list states no census_size)");
  if (!Array.isArray(rows)) un.push("census.json rows");
  if (un.length) return { un, red, ok: [] };
  if (rows.length !== size) red.push(`rows ${rows.length} ≠ the plan's census size ${size}`);
  if (j.census.pending !== 0) red.push(`PENDING ${j.census.pending}`);
  if (j.census.unfated !== 0) red.push(`unfated ${j.census.unfated}`);
  const how = rows.filter((x) => !(x && (x.decided_by === "code" || (x.decided_by === "judgement" && typeof x.code_cannot === "string" && x.code_cannot.trim()))));
  if (how.length) red.push(`${how.length} row(s) not decided by code nor by judgement naming the check code could not run (code_cannot)`);
  return { un, red, ok: red.length ? [] : [`${rows.length}/${size} rows fated, PENDING 0, every one decided by code or a named judgement`] };
}
function judgeReach(j, retired, consumptionPresent) {
  const un = [], red = [];
  if (!Array.isArray(j.reach)) un.push(`reach ${j.reach && j.reach.live ? "LIVE" : "UNREAD"}`);
  if (!consumptionPresent) un.push("the consumption ledger (dressing-room/state/consumption.jsonl, brain.mjs) is absent — the window reach is unknowable here");
  if (!retired) un.push("the retirement map (gate.mjs LANE_CONSUMERS) is unreadable");
  if (un.length) return { un, red, ok: [] };
  const lanes = j.reach.filter((x) => x && !x.no_consumer && !retired.has(x.subject));
  if (!lanes.length) return { un: ["no lane with a consumer — nothing to reach"], red, ok: [] };
  const not = lanes.filter((x) => !(x.reached === true && x.window === true));
  for (const x of not) red.push(`${x.subject}: window ${x.window ? "yes" : "NO"} · static ${x.static ? "yes" : "NO"}`);
  return { un, red, ok: not.length ? [] : [`${lanes.length}/${lanes.length} lanes reached inside the window`] };
}
function judgeFinish(j) {
  const un = [], red = [];
  const o = j.orphans || {}, r = j.rungs || {}, ru = j.rules || {};
  if (!(num(o.lanes) && num(o.verbs))) un.push("orphans");
  if (r.read !== true) un.push(`rungs (${r.why || "unread"})`);
  if (!(ru.laws && num(ru.laws.n) && ru.laws.n > 0)) un.push("laws/*.yml");
  if (unread(j) || !ru.ten || ru.ten.unread || !ru.register || ru.register.unread || !ru.teaching || ru.teaching.unread) un.push("a laptop rule set is LIVE or UNREAD");
  if (un.length) return { un, red, ok: [] };
  if (!(o.lanes === 0)) red.push(`orphan lanes ${o.lanes}`);
  if (!(o.verbs === 0)) red.push(`orphan verbs ${o.verbs}`);
  if (!(r.g === r.n && r.u === 0 && r.r === 0 && r.x === 0)) red.push(`rungs ${r.g}/${r.n} GREEN · ${r.u} UNREAD · ${r.r} RED · ${r.x} REFUSED`);
  if (r.hand) red.push(`hand ${r.hand} REFUSED`);
  if (r.chain !== "holds") red.push(`receipt chain ${r.chain}`);
  if (!(r.lg === r.ln)) red.push(`loops ${r.lg}/${r.ln}`);
  if (!(ru.laws.both === ru.laws.n)) red.push(`laws ${ru.laws.both}/${ru.laws.n} both ways`);
  if (!(ru.ten.verify === ru.ten.n)) red.push(`ten laws ${ru.ten.verify}/${ru.ten.n} with a verify command`);
  if (!(ru.register.site === ru.register.n)) red.push(`laws_register ${ru.register.site}/${ru.register.n} with a check site`);
  if (!num(ru.teaching.n)) red.push("teaching rules not counted");
  return { un, red, ok: red.length ? [] : ["orphans 0 · rungs all GREEN · loops all GREEN · every rule set whole"] };
}

async function clauseMode(mode) {
  const id = CLAUSE[mode];
  const out = (code, word, why) => { console.log(`LEFT ${id} ${word} · ${why}`); return code; };
  const c = flag("--campaign");
  if (!c) return out(2, "UNREAD", "no --campaign (the campaign tree is his laptop's, never this repo's)");
  const campaign = resolve(ROOT, c);
  const d = await readDone(campaign);
  if (!d.ok) return out(2, "UNREAD", d.why);
  let v;
  if (mode === "answers") v = judgeAnswers(d.j);
  else if (mode === "finish") v = judgeFinish(d.j);
  else if (mode === "census") {
    let plan = null; try { plan = (await import(pathToFileURL(join(ROOT, "scripts", "rung_receipt.mjs")).href)).readPlan(campaign); } catch { plan = null; }
    v = judgeCensus(d.j, plan, readJ(join(campaign, "rungs", "plan_v3.json")), readJ(join(campaign, "census.json")));
  } else {
    let retired = null;
    try { const g = await import(pathToFileURL(join(ROOT, "scripts", "gate.mjs")).href); retired = new Set(Object.entries(g.LANE_CONSUMERS).filter(([, l]) => l && l.right_consumer && l.right_consumer.retired).map(([s]) => s)); } catch { retired = null; }
    v = judgeReach(d.j, retired, existsSync(join(ROOT, "dressing-room", "state", "consumption.jsonl")));
  }
  if (v.un.length) return out(2, "UNREAD", v.un.join(" · "));
  if (v.red.length) return out(1, "RED", v.red.join(" · "));
  return out(0, "GREEN", v.ok.join(" · "));
}

// ══ PLANTS ═════════════════════════════════════════════════════════════════════════════════════════════════════════
const sha = (b) => createHash("sha256").update(b).digest("hex");
const foldSha = (p) => { const b = readFileSync(p); return b.includes(0) ? sha(b) : sha(b.toString("utf8").replace(/\r\n/g, "\n")); };
const rel = (from, p) => relative(from, p).split(sep).join("/");
const SKIP = (r) => /^(\.git|node_modules)(\/|$)/.test(r) || /^dressing-room\/state\//.test(r);
function copyTree(src, dst, nm) {
  cpSync(src, dst, { recursive: true, filter: (s) => { const r = rel(src, s); return r === "" || !SKIP(r); } });
  mkdirSync(join(dst, "dressing-room", "state"), { recursive: true });
  if (nm) symlinkSync(nm, join(dst, "node_modules"), "junction");
}
const STATE = (t) => join(t, "dressing-room", "state");
const put = (p, v) => { mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, typeof v === "string" ? v : JSON.stringify(v)); };
const jsonl = (rows) => rows.map((r) => JSON.stringify(r)).join("\n") + "\n";

// the planted world. Lanes: zz_reach (organ consumer done.mjs, its declared file the consumption ledger done.mjs reads —
// static yes), zz_retired (RETIRED), zz_static (him; static yes through the same file, never consumed — window NO).
const LANE_REACH = { subject: "zz_reach", schema_owner: "done.mjs", consumers: [{ name: "done.mjs" }], consumer_kind: "organ", files: ["dressing-room/state/consumption.jsonl"] };
const LANE_RETIRED = { subject: "zz_retired", schema_owner: "done.mjs", consumers: [], consumer_retired: true };
const LANE_STATIC = { subject: "zz_static", schema_owner: "done.mjs", consumers: [{ kind: "him" }], consumer_kind: "him", files: ["dressing-room/state/consumption.jsonl"] };
function plantState(t, { lanes = [LANE_REACH, LANE_RETIRED], consumption = true } = {}) {
  const s = STATE(t);
  put(join(s, "registry.json"), { version: 1, tables: { lanes } });
  if (consumption) put(join(s, "consumption.jsonl"), jsonl([{ ts: new Date().toISOString(), lane: "zz_reach", kind: "opened", by: "done.mjs" }]));
  put(join(s, "laws_register.json"), { standing_laws: [{ id: "planted-law", check_site: "planted" }] });
  put(join(s, "teaching_contract.json"), { rules: [{ id: "planted-rule" }] });
}
function plantCampaign(c, { plan = true, size = 2, census = null } = {}) {
  const src = "planted plan v3 text\n";
  put(join(c, "plan_v3.txt"), src);
  if (plan) put(join(c, "rungs", "plan_v3.json"), { plan: "v3", source: "plan_v3.txt", source_sha256: sha(Buffer.from(src)), ...(size === null ? {} : { census_size: size }),
    rungs: [{ rung: "mleft", clauses: [{ id: "one-command", witness: `node ${SELF} answers` }] }], loops: [] });
  put(join(c, "units.json"), [{ unit: "mleft", fate: "BUILD", landed: false, clause: "B-left:one-command" }]);
  put(join(c, "census.json"), census || [
    { piece: "p1", fate: "KEEP", rung: "mleft", decided_by: "code" },
    { piece: "p2", fate: "FOLD", rung: "mleft", decided_by: "judgement", code_cannot: "planted: the check that could not decide" }]);
}
const ZERO = { hermetic: false, orphans: { lanes: 0, verbs: 0 }, rungs: { read: true, n: 1, g: 1, u: 0, r: 0, x: 0, hand: 0, lg: 0, ln: 0, not: [], lnot: [], chain: "holds" },
  units: { read: true, open: 0, by: {} }, census: { read: true, pending: 0, unfated: 0 }, rules: { laws: { n: 1, red: 1, both: 1, missing: [] }, ten: { n: 1, verify: 1 }, register: { n: 1, site: 1 }, teaching: { n: 1 } }, reach: [] };
const stubDone = (json) => `#!/usr/bin/env node\n// PLANTED STUB of done.mjs (witness_left.mjs plants): prints one planted JSON line and exits 0\nconsole.log(${JSON.stringify(JSON.stringify(json))});\n`;

// each plant: { id, clause, mode, want, campaign?, state?, hermetic?, stub? }
const PLANTS = [
  { id: "one-command.green", clause: CLAUSE.answers, mode: "answers", want: 0, why: "every check computed" },
  { id: "one-command.rungs-unread", clause: CLAUSE.answers, mode: "answers", want: 2, camp: { plan: false }, why: "no plan v3 list → rungs UNREAD alone" },
  { id: "one-command.no-campaign", clause: CLAUSE.answers, mode: "answers", want: 2, noCampaign: true, why: "no --campaign" },
  { id: "one-command.hermetic", clause: CLAUSE.answers, mode: "answers", want: 2, hermetic: true, why: "the hermetic profile prints LIVE" },
  { id: "census.green", clause: CLAUSE.census, mode: "census", want: 0, why: "2 rows of size 2, one by code, one by a named judgement" },
  { id: "census.short", clause: CLAUSE.census, mode: "census", want: 1, camp: { size: 3 }, why: "2 rows of a stated 3" },
  { id: "census.judgement-unnamed", clause: CLAUSE.census, mode: "census", want: 1, camp: { census: [{ piece: "p1", fate: "KEEP", rung: "mleft", decided_by: "code" }, { piece: "p2", fate: "KEEP", rung: "mleft", decided_by: "judgement" }] }, why: "a judgement row with no code_cannot" },
  { id: "census.pending", clause: CLAUSE.census, mode: "census", want: 1, camp: { census: [{ piece: "p1", fate: "KEEP", rung: "mleft", decided_by: "code" }, { piece: "p2", fate: "PENDING", decided_by: "code" }] }, why: "one row PENDING" },
  { id: "census.no-size", clause: CLAUSE.census, mode: "census", want: 2, camp: { size: null }, why: "the plan v3 list states no size" },
  { id: "c29.green", clause: CLAUSE.reach, mode: "reach", want: 0, why: "the one consumed lane reached in the window; the retired lane not counted" },
  { id: "c29.static-only", clause: CLAUSE.reach, mode: "reach", want: 1, state: { lanes: [LANE_REACH, LANE_RETIRED, LANE_STATIC] }, why: "a lane static yes, window NO" },
  { id: "c29.no-consumption", clause: CLAUSE.reach, mode: "reach", want: 2, state: { consumption: false }, why: "the consumption ledger absent (the cloud)" },
  { id: "c29.hermetic", clause: CLAUSE.reach, mode: "reach", want: 2, hermetic: true, why: "the hermetic profile prints reach LIVE" },
  { id: "finish.real-tree", clause: CLAUSE.finish, mode: "finish", want: 1, why: "the REAL done.mjs over this tree: orphans are not zero" },
  { id: "finish.zero", clause: CLAUSE.finish, mode: "finish", want: 0, stub: ZERO, why: "stub: zero everywhere" },
  { id: "finish.one-lane", clause: CLAUSE.finish, mode: "finish", want: 1, stub: { ...ZERO, orphans: { lanes: 1, verbs: 0 } }, why: "stub: one orphan lane" },
  { id: "finish.rungs-unread", clause: CLAUSE.finish, mode: "finish", want: 2, stub: { ...ZERO, rungs: { read: false, why: "UNREAD (no plan v3 list)" } }, why: "stub: rungs UNREAD" },
  { id: "finish.teaching-live", clause: CLAUSE.finish, mode: "finish", want: 2, stub: { ...ZERO, rules: { ...ZERO.rules, teaching: null } }, why: "stub: the teaching rules LIVE" },
];

function runChild(args, { cwd, env, bound }) {
  return new Promise((done) => {
    const ch = spawn(process.execPath, args, { cwd, env, windowsHide: true });
    let out = ""; ch.stdout.on("data", (b) => { out += b; }); ch.stderr.on("data", (b) => { out += b; });
    const t = setTimeout(() => { ch.kill(); }, bound);
    ch.on("close", (code) => { clearTimeout(t); done({ code, last: lines(out).at(-1) || "" }); });
    ch.on("error", () => { clearTimeout(t); done({ code: null, last: "spawn failed" }); });
  });
}
async function pool(items, n, fn) {
  const res = new Array(items.length); let k = 0;
  await Promise.all(Array.from({ length: Math.max(1, Math.min(n, items.length)) }, async () => { while (k < items.length) { const i = k++; res[i] = await fn(items[i], i); } }));
  return res;
}

function fileSet(dir) {
  const g = spawnSync("git", ["-C", dir, "rev-parse", "--is-inside-work-tree"], { encoding: "utf8", windowsHide: true });
  if (g.status === 0 && lines(g.stdout)[0] === "true") {
    const top = lines(spawnSync("git", ["-C", dir, "rev-parse", "--show-toplevel"], { encoding: "utf8", windowsHide: true }).stdout)[0];
    if (top && resolve(top) === resolve(dir)) {
      const ls = spawnSync("git", ["-C", dir, "ls-files", "-z", "--cached", "--others", "--exclude-standard"], { encoding: "utf8", windowsHide: true, maxBuffer: 1 << 28 });
      if (ls.status === 0) return [...new Set(ls.stdout.split("\0").filter(Boolean))].filter((p) => existsSync(join(dir, p)) && statSync(join(dir, p)).isFile());
    }
  }
  const out = [];
  const walk = (d) => { for (const e of readdirSync(d, { withFileTypes: true })) { const p = join(d, e.name), r = rel(dir, p); if (/^(\.git|node_modules)(\/|$)/.test(r)) continue; if (e.isDirectory()) walk(p); else if (e.isFile()) out.push(r); } };
  walk(dir); return out;
}
const NAMED = (p) => /^ci\/witness\/mleft\//.test(p) || /^ci\/mleft\//.test(p) || p === "campaign-2026-09/receipts_effort/mleft_00.json";
function bound(org, base) {
  const a = new Map(fileSet(org).map((p) => [p, join(org, p)])), b = new Map(fileSet(base).map((p) => [p, join(base, p)]));
  const diff = [];
  for (const p of new Set([...a.keys(), ...b.keys()])) {
    if (!a.has(p) || !b.has(p)) { diff.push(p); continue; }
    if (foldSha(a.get(p)) !== foldSha(b.get(p))) diff.push(p);
  }
  return diff.sort().filter((p) => !NAMED(p));
}
function survivors(root) {
  const l = process.platform === "win32"
    ? spawnSync("powershell.exe", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | ForEach-Object { $_.CommandLine }"], { encoding: "utf8", windowsHide: true })
    : spawnSync("ps", ["-eo", "args"], { encoding: "utf8" });
  return lines(l.stdout).filter((x) => x.includes(root) && !/\bps -eo\b/.test(x));
}

async function plantsMode() {
  const org = resolve(flag("--org") || ROOT), baseOrg = flag("--base-org") ? resolve(flag("--base-org")) : null;
  const only = flag("--only") ? new Set(flag("--only").split(",")) : null;
  const ids = Object.values(CLAUSE).filter((c) => !only || only.has(c));
  const plants = PLANTS.filter((p) => ids.includes(p.clause));
  const failed = new Set(), out = [];
  const T = mkdtempSync(join(tmpdir(), "mleft-witness-"));
  try {
    if (!existsSync(join(org, SELF))) {
      for (const c of ids) { failed.add(c); out.push(`PLANT ${c} RED · --org carries no ${SELF}: the clause has no command there`); }
    } else {
      const nm = [join(org, "node_modules"), join(ROOT, "node_modules")].find((p) => existsSync(p)) || null;
      const b = (await boundOf(org)) || (await boundOf(ROOT));
      if (!nm || !b) { for (const c of ids) failed.add(c); out.push(`PLANT setup RED · ${!nm ? "no node_modules beside --org or this witness" : "no witness-child bound readable"}`); }
      else {
        const seed = join(T, "seed"); copyTree(org, seed, null);
        const res = await pool(plants, availableParallelism(), async (p, i) => {
          const t = join(T, `p${i}`), home = join(T, `h${i}`), camp = join(T, `c${i}`);
          copyTree(seed, t, nm); mkdirSync(home, { recursive: true });
          plantState(t, p.state || {}); plantCampaign(camp, p.camp || {});
          if (p.stub) put(join(t, "scripts", "done.mjs"), stubDone(p.stub));
          const env = { ...process.env, HOME: home, USERPROFILE: home };
          delete env.ORGANISM_TEST_PROFILE; if (p.hermetic) env.ORGANISM_TEST_PROFILE = "hermetic";
          const r = await runChild([join(t, SELF), p.mode, ...(p.noCampaign ? [] : ["--campaign", camp])], { cwd: t, env, bound: b });
          return { p, r };
        });
        for (const { p, r } of res) {
          const ok = r.code === p.want;
          if (!ok) failed.add(p.clause);
          out.push(`PLANT ${p.id} ${p.clause} want ${p.want} got ${r.code} ${ok ? "ok" : "FAIL"} · ${p.why} · ${r.last.slice(0, 200)}`);
        }
      }
    }
    if (baseOrg) {
      const d = bound(org, baseOrg);
      out.push(d.length ? `BOUND RED · ${d.length} file(s) beyond the named ones differ: ${d.slice(0, 12).join(", ")}` : "BOUND GREEN · only the named files differ from --base-org");
      if (d.length) failed.add("BOUND");
    } else out.push("BOUND not run · no --base-org (the suite's form)");
  } finally {
    const s = survivors(T);
    out.push(s.length ? `LAST RED · ${s.length} node process(es) name the temp root` : "LAST GREEN · no node process names the temp root");
    if (s.length) failed.add("LAST");
    rmSync(T, { recursive: true, force: true });
  }
  for (const l of out) console.log(l);
  if (failed.size) { console.log(`RED MLEFT · ${[...failed].join(", ")}`); return 1; }
  console.log(`GREEN MLEFT what is left, read by one command — ${plants.length} plant(s) both ways · ${ids.length} clause(s)${baseOrg ? " + BOUND" : ""} + LAST`);
  return 0;
}

const mode = argv[0] && !argv[0].startsWith("--") ? argv[0] : "plants";
if (CLAUSE[mode]) process.exitCode = await clauseMode(mode);
else if (mode === "plants") process.exitCode = await plantsMode();
else { console.log(`usage: node ${SELF} <answers|census|reach|finish> --campaign <dir> · node ${SELF} [plants] [--org <dir>] [--base-org <dir>] [--only <ids>]`); process.exitCode = 2; }
