#!/usr/bin/env node
// ============================================================================
// ci/mdone/witness_mdone.mjs — WITNESS of unit mdone (WHAT IS LEFT, scripts/done.mjs)
// ----------------------------------------------------------------------------
// CONTRACT (rulings row 1032 D1 A · D2 A · D3 · D4 A · D5 A · D6 · Q2 · Q3; spec ci/mcr/B3_SPEC.md §7 on branch
// claude/mcr-b3-spec):
//   node ci/mdone/witness_mdone.mjs --org <build tree> --base-org <base tree> [--node-modules <dir>]
// Each plant is a COPY of the tree under os.tmpdir() with its dressing-room/state REPLACED by a synthetic one (a
// registry with planted lanes, a planted consumption row, nothing of his), node_modules linked in (xray needs acorn;
// --node-modules, else <org>/node_modules), and a planted campaign dir + day meter where the clause needs one.
//   D-ORPH   a planted organ writing a state file nobody reads → orphan lanes +1, named · a planted reader → unchanged
//   D-UNREAD ~~no --campaign → `rungs UNREAD`, never 0/0 · a planted campaign with one green rung clause → `rungs 1/1`~~
//   D-METER  ~~the meter's old recorded day (2026-11-13) RED and the meter byte-unchanged → the clause is GREEN · the
//            old day re-recorded GREEN, or the meter moved during the run → the clause is not (Q3, a plant of the shape
//            daily_green.mjs writes, never his file)~~
//   RE-CUT by unit ms1 (forks row 1154 (3), ADDED edits; overtaking unit mrung, row 1136, which moved the rungs read onto
//   rung_receipt.mjs's receipts and its plan v3 list). The same properties, in the words the mode prints today:
//   D-UNREAD no --campaign → `rungs UNREAD`, never a zero count · a planted campaign whose plan v3 list holds zero clauses
//            → `rungs UNREAD`, never `0/0` · the campaign's units still read `units 1 open`
//   D-METER  a planted receipt triple (red, green, meter; rows built by the tree's own rung_receipt.mjs exports) whose
//            meter is byte-unchanged and whose old recorded day (done.mjs OLD_RECORDED_DAY) reads RED → `rungs 1/1 GREEN`
//            · the old day re-recorded GREEN → the clause is RED (`0/1 GREEN … 1 RED`) · the meter moved → RED
//   D-RULE   a planted laws/*.yml id with no plant in lawpack → counted, not covered · its RED and clean plants → covered
//   D-REACH  a lane whose declared consumer never reads its file → static NO · it reads it and consumed it in the
//            window → REACHED
//   D-NOCONS a lane with no declared consumer → NO CONSUMER, never reached
//   D-LINE   `line` is exactly ONE line and carries no state content (a planted marker never appears)
//   D-WRITE  line/report/json write nothing (the plant tree's bytes are unchanged) and the source carries no write call
//   D-MORNING the /matchday anchor prints `node scripts/done.mjs line` right after the state line
//   D-CARD   a census PENDING → report prints exactly ONE card command keyed done:census:<day> · none → no CARD line
// Each clause runs on --base-org (must be RED) and on --org (must be GREEN).
// FACT D3 (not a both-ways clause — xray is on the base too): Q3 + orphan verbs over an EMPTY state dir equal the
//   planted ones on the build tree; required for GREEN.
// BOUND: only scripts/done.mjs, .claude/skills/matchday/SKILL.md and ci/mdone/ differ. LAST: no node process naming
// the temp dir survives.
// LAST LINE: GREEN MDONE what is left · <n> clause(s)  (exit 0)  ·  RED MDONE · <clauses>  (exit 1)
// ============================================================================
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, statSync, rmSync, existsSync, cpSync, symlinkSync, appendFileSync } from "node:fs";
import { join, relative, sep, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import os from "node:os";

const arg = (k) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : null; };
const ORG = arg("--org"), BASE = arg("--base-org");
if (!ORG || !BASE) { console.log("RED MDONE · usage: --org <dir> --base-org <dir> [--node-modules <dir>]"); process.exit(1); }
const NM = resolve(arg("--node-modules") || join(ORG, "node_modules"));
const NAMED = ["scripts/done.mjs", ".claude/skills/matchday/SKILL.md"], NAMED_DIRS = ["ci/mdone/"];
const ROOT = mkdtempSync(join(os.tmpdir(), "witness-mdone-"));
const MARK = "MDONE-PLANTED-MARKER";
let seq = 0;

const put = (dir, rel, text) => { const p = join(dir, ...rel.split("/")); mkdirSync(join(p, ".."), { recursive: true }); writeFileSync(p, text); };
const WRITER = (file) => `import { writeFileSync } from "node:fs";\nimport { join, dirname } from "node:path";\nimport { fileURLToPath } from "node:url";\nconst STATE_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "dressing-room", "state");\nexport const w = () => writeFileSync(join(STATE_DIR, "${file}"), "{}");\n`;
const READER = (file) => `import { readFileSync } from "node:fs";\nimport { join, dirname } from "node:path";\nimport { fileURLToPath } from "node:url";\nconst STATE_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "dressing-room", "state");\nexport const r = () => readFileSync(join(STATE_DIR, "${file}"), "utf8");\n`;

function tree(src) {
  const dir = join(ROOT, `t${++seq}`);
  cpSync(src, dir, { recursive: true, filter: (s) => { const r = relative(src, s).split(sep).join("/"); return !(r === "node_modules" || r.startsWith("node_modules/") || r === ".git" || r === "dressing-room/state" || r.startsWith("dressing-room/state/")); } });
  if (existsSync(NM)) symlinkSync(NM, join(dir, "node_modules"), "junction");
  const reg = { version: 1, updated_at: null, tables: { lanes: [
    { subject: "plantlane", schema_owner: "plant_writer.mjs", consumers: [{ kind: "organ", name: "plant_reader.mjs" }], consumer_kind: "organ", witness: "ci/mdone planted lane", why: `planted by the witness ${MARK}` },
    { subject: "nocons", schema_owner: "plant_writer.mjs", consumers: [], consumer_kind: "organ", witness: "ci/mdone planted lane", why: "a lane that names nobody" },
  ], mechanisms: [{ subject: "his_surfaces", schema_owner: "done.mjs", witness: "ci/mlaw/witness_mlaw.mjs SURFACES", subjects: ["manager.mjs", "captains_call.mjs"], why: "unit mlaw row 1152 (1): done.mjs reads his surfaces from this row" }] } };   // unit mlaw (row 1152 (1)): the his_surfaces row beside the lanes
  put(dir, "dressing-room/state/registry.json", JSON.stringify(reg));
  put(dir, "dressing-room/state/consumption.jsonl", JSON.stringify({ ts: new Date().toISOString(), lane: "plantlane", kind: "opened", by: `plant_reader.mjs` , note: MARK }) + "\n");
  put(dir, "scripts/plant_writer.mjs", WRITER("plantlane.json"));
  return dir;
}
const done = (dir, args, env = {}) => {
  const r = spawnSync(process.execPath, [join(dir, "scripts", "done.mjs"), ...args], { cwd: dir, encoding: "utf8", windowsHide: true, env: { ...process.env, ORGANISM_TEST_PROFILE: "", ...env } });
  const out = (r.stdout || "").trim();
  return { code: r.status, out, lines: out ? out.split(/\r?\n/) : [], err: (r.stderr || "").slice(0, 200) };
};
const num = (s, re) => { const m = re.exec(s); return m ? Number(m[1]) : NaN; };
const meterRow = (date, green) => JSON.stringify({ at: "2026-11-13T23:00:00.000Z", date, study: true, study_why: "planted", green, greens: green ? 11 : 10, reds: green ? 0 : 1, clauses: [] });
function campaign(dir, { pending = 0, before = "a", after = "a" } = {}) {
  const c = join(dir, "campaign-plant");
  put(c, "rungs/r1.json", JSON.stringify({ rung: "r1", clauses: [{ id: "c1", red_before: "RED R1 · c1", green_real_day: "GREEN R1 · c1", meter_before: before, meter_after: after }] }));
  put(c, "ladder.txt", "ladder\n");
  put(c, "loops/l1.json", JSON.stringify({ loop: "l1", sheet: "ladder.txt", page: "ladder.txt", acts_receipt: "ladder.txt", ladder: "ladder.txt", ladder_sha256: createHash("sha256").update("ladder\n").digest("hex") }));
  put(c, "units.json", JSON.stringify([{ unit: "u1", fate: "BUILD", landed: false, clause: "c1" }, { unit: "u2", fate: "BUILD", landed: true, clause: "c1" }]));
  put(c, "census.json", JSON.stringify([{ piece: "p1", fate: "BUILD", rung: "r1" }, ...Array.from({ length: pending }, (_, i) => ({ piece: `q${i}`, fate: "PENDING" }))]));
  const meter = join(c, "meter.jsonl"); writeFileSync(meter, meterRow("2026-11-12", true) + "\n" + meterRow("2026-11-13", false) + "\n");
  return { c, meter };
}

// ms1 (row 1154 (3)): a plan v3 list + a receipt triple, written by a child that imports the TREE's own rung_receipt.mjs
const RECEIPTS = (t, c, { oldGreen = false, moved = false, zero = false } = {}) => {
  const code = `import { pathToFileURL } from "node:url"; import { writeFileSync, mkdirSync } from "node:fs"; import { join } from "node:path";
const [t, c, oldGreen, moved, zero] = process.argv.slice(1);
const R = await import(pathToFileURL(join(t, "scripts", "rung_receipt.mjs")).href);
const { OLD_RECORDED_DAY } = await import(pathToFileURL(join(t, "scripts", "done.mjs")).href);
const cmd = "node ci/x.mjs";
mkdirSync(join(c, "rungs"), { recursive: true });
writeFileSync(join(c, "rungs", R.PLAN_FILE), JSON.stringify({ plan: "v3", source: "planted", source_sha256: R.sha256("planted"), rungs: zero === "1" ? [] : [{ rung: "S1", clauses: [{ id: "c1", witness: cmd }] }], loops: [] }));
let prev = R.ZERO; const rows = [];
const add = (body) => { const r = { v: 1, ...body, at: "2026-11-20T15:00:00.000Z", by: R.BY, prev_sha256: prev }; r.row_sha256 = R.rowSha(r); prev = r.row_sha256; rows.push(r); return r; };
const red = add({ kind: "red", key: "S1:c1", rung: "S1", clause: "c1", cmd, cmd_sha256: R.sha256(cmd), head_sha: "a".repeat(40), exit: 1, out_sha256: R.sha256("o") });
const g = add({ kind: "green", key: "S1:c1", rung: "S1", clause: "c1", cmd, cmd_sha256: R.sha256(cmd), head_sha: "b".repeat(40), red_head_sha: "a".repeat(40), red_sha: red.row_sha256, ancestor: 0, exit: 0, out_sha256: R.sha256("p"), day: "2026-11-20", day_proof: { source: "sitting_reviews.jsonl", sitting_id: "s1", closed_at: "2026-11-20T15:00:00.000Z", reason: "fulltime" } });
add({ kind: "meter", key: "S1:c1", rung: "S1", clause: "c1", meter: R.METER_FILE, before_sha256: R.sha256("m"), after_sha256: R.sha256(moved === "1" ? "m2" : "m"), equal: moved !== "1", old_day: OLD_RECORDED_DAY, old_day_green: oldGreen === "1", green_sha: g.row_sha256 });
writeFileSync(join(c, "receipts.jsonl"), rows.map((r) => JSON.stringify(r)).join("\\n") + "\\n");
console.log("PLANTED");`;
  const r = spawnSync(process.execPath, ["--input-type=module", "-e", code, t, c, oldGreen ? "1" : "0", moved ? "1" : "0", zero ? "1" : "0"], { encoding: "utf8", windowsHide: true });
  if (!/PLANTED/.test(r.stdout || "")) throw new Error(`the receipt plant failed: ${String(r.stderr || "").split("\n").find(Boolean) || "no output"}`);
  return join(c, "receipts.jsonl");
};
const CLAUSES = {
  "D-ORPH"(src) {
    const t = tree(src); const a = done(t, ["report", "--hermetic"]);
    const n0 = num(a.out, /orphans lanes (\d+)/);
    const red = /plantlane\.json/.test(a.out);
    put(t, "scripts/plant_reader.mjs", READER("plantlane.json"));
    const b = done(t, ["report", "--hermetic"]); const n1 = num(b.out, /orphans lanes (\d+)/);
    return { ok: a.code === 0 && red && Number.isFinite(n0) && n1 === n0 - 1 && !/plantlane\.json/.test(b.out), why: `writer alone ${n0} (named ${red}) · with a reader ${n1}` };
  },
  "D-UNREAD"(src) {
    // ms1 (row 1154 (3)): no campaign reads UNREAD and never a zero count — in the words the mode prints today
    const t = tree(src); const a = done(t, ["line", "--hermetic"]);
    const { c, meter } = campaign(t); const f = RECEIPTS(t, c, { zero: true });
    const b = done(t, ["line", "--hermetic", "--campaign", c, "--meter", meter, "--receipts", f]);
    const never0 = (o) => !/rungs 0\/0/.test(o);
    return { ok: /rungs UNREAD/.test(a.out) && never0(a.out) && /rungs UNREAD/.test(b.out) && never0(b.out) && /units 1 open/.test(b.out), why: `${(/rungs [^·]+/.exec(a.out) || ["?"])[0]}→ zero-clause plan: ${(/rungs [^·]+/.exec(b.out) || ["?"])[0]}· ${(/units [^·]+/.exec(b.out) || ["?"])[0]}` };
  },
  "D-METER"(src) {
    // ms1 (row 1154 (3)): the old recorded day reads red with the meter byte-unchanged — through today's receipt read
    const run = (o) => { const t = tree(src); const { c, meter } = campaign(t); const f = RECEIPTS(t, c, o); return done(t, ["line", "--hermetic", "--campaign", c, "--meter", meter, "--receipts", f]).out; };
    const a = run({}), b = run({ oldGreen: true }), m = run({ moved: true });
    const ok1 = /rungs 1\/1 GREEN/.test(a), red2 = /rungs 0\/1 GREEN · 0 UNREAD · 1 RED/.test(b), red3 = /rungs 0\/1 GREEN · 0 UNREAD · 1 RED/.test(m);
    return { ok: ok1 && red2 && red3, why: `old day RED + meter still → ${(/rungs [^·]+/.exec(a) || ["?"])[0]}(${ok1}) · old day rewritten GREEN refused ${red2} · meter moved refused ${red3}` };
  },
  "D-RULE"(src) {
    const t = tree(src); const n0 = done(t, ["line", "--hermetic"]).out;
    const L0 = num(n0, /laws \d+\/(\d+) both/), B0 = num(n0, /laws (\d+)\/\d+ both/), R0 = num(n0, /\((\d+)\/\d+ RED-planted\)/);
    put(t, "laws/plant-x.yml", "id: plant-x\nlanguage: JavaScript\nseverity: warning\nmessage: planted\nrule:\n  pattern: plantx()\n");
    const n1 = done(t, ["line", "--hermetic"]).out;
    const lp = join(t, "scripts", "lawpack.mjs"), lpSrc = readFileSync(lp, "utf8");
    writeFileSync(lp, lpSrc + `\nPLANTS["plant-x"] = "plantx();\\n";\n`);                       // RED-planted only: NOT both ways
    const nR = done(t, ["line", "--hermetic"]).out;
    // ms1 (row 1065 (4), the one ADDED edit): a lawpack that already exports CLEAN_PLANTS (unit mdn2) gains the entry; one that does not, the export
    writeFileSync(lp, lpSrc + `\nPLANTS["plant-x"] = "plantx();\\n";\n` + (/^export const CLEAN_PLANTS\b/m.test(lpSrc) ? `CLEAN_PLANTS["plant-x"] = "export const ok = 1;\\n";\n` : `export const CLEAN_PLANTS = { "plant-x": "export const ok = 1;\\n" };\n`));
    const n2 = done(t, ["line", "--hermetic"]).out;
    const a = num(n1, /laws \d+\/(\d+) both/) === L0 + 1 && num(n1, /laws (\d+)\/\d+ both/) === B0 && num(n1, /\((\d+)\/\d+ RED-planted\)/) === R0;
    const r = num(nR, /laws (\d+)\/\d+ both/) === B0 && num(nR, /\((\d+)\/\d+ RED-planted\)/) === R0 + 1;
    const b = num(n2, /laws (\d+)\/\d+ both/) === B0 + 1 && num(n2, /\((\d+)\/\d+ RED-planted\)/) === R0 + 1;
    return { ok: Number.isFinite(L0) && a && r && b, why: `${(/laws [^|]+/.exec(n0) || ["?"])[0]}→ ${(/laws [^|]+/.exec(n1) || ["?"])[0]}→ RED only ${(/laws [^|]+/.exec(nR) || ["?"])[0]}→ ${(/laws [^|]+/.exec(n2) || ["?"])[0]}` };
  },
  "D-REACH"(src) {
    const t = tree(src); const a = done(t, ["report"]);
    const red = /plantlane: static NO \(its declared consumer reads none of its files\)/.test(a.out);
    put(t, "scripts/plant_reader.mjs", READER("plantlane.json"));
    const b = done(t, ["report"]);
    return { ok: red && /plantlane: REACHED/.test(b.out), why: `unread lane ${red} · read + consumed REACHED ${/plantlane: REACHED/.test(b.out)} ${a.err}` };
  },
  "D-NOCONS"(src) {
    const t = tree(src); put(t, "scripts/plant_reader.mjs", READER("plantlane.json"));
    const a = done(t, ["report"]);
    return { ok: /nocons: NO CONSUMER/.test(a.out) && /NO CONSUMER 1\b/.test(a.lines[0] || "") && /reach 1\/1 /.test(a.lines[0] || ""), why: (/reach [^\n]+/.exec(a.lines[0] || "") || ["?"])[0] };
  },
  "D-LINE"(src) {
    const t = tree(src); put(t, "scripts/plant_reader.mjs", READER("plantlane.json"));
    const a = done(t, ["line"]);
    return { ok: a.code === 0 && a.lines.length === 1 && /^DONE · /.test(a.lines[0]) && !a.out.includes(MARK) && !/plantlane|nocons/.test(a.out), why: `${a.lines.length} line(s) · marker absent ${!a.out.includes(MARK)}` };
  },
  "D-WRITE"(src) {
    const t = tree(src); const { c, meter } = campaign(t, { pending: 1 });
    const h = () => { const out = []; const walk = (d) => { for (const n of readdirSync(d)) { if (n === "node_modules") continue; const p = join(d, n); if (statSync(p).isDirectory()) walk(p); else out.push(relative(t, p) + ":" + createHash("sha256").update(readFileSync(p)).digest("hex")); } }; walk(t); return out.sort().join("\n"); };
    const before = h();
    for (const m of ["line", "report", "json"]) done(t, [m, "--campaign", c, "--meter", meter]);
    const body = (() => { try { return readFileSync(join(src, "scripts", "done.mjs"), "utf8"); } catch { return ""; } })();
    const noWrite = body.length > 0 && !/\b(writeFileSync|appendFileSync|renameSync|rmSync|unlinkSync|mkdirSync|createWriteStream)\b/.test(body);
    return { ok: before === h() && noWrite, why: `bytes unchanged ${before === h()} · no write call in source ${noWrite}` };
  },
  "D-MORNING"(src) {
    const s = (() => { try { return readFileSync(join(src, ".claude", "skills", "matchday", "SKILL.md"), "utf8"); } catch { return ""; } })();
    const st = s.indexOf("node scripts/state.mjs"), dn = s.indexOf("node scripts/done.mjs line"), step1 = s.indexOf("\n1. ");
    return { ok: st > -1 && dn > st && dn < step1, why: `state line at ${st} · done line at ${dn} · inside step 0 ${dn > st && dn < step1}` };
  },
  "D-CARD"(src) {
    const t = tree(src); const k1 = campaign(t, { pending: 1 }); const a = done(t, ["report", "--hermetic", "--campaign", k1.c, "--meter", k1.meter]);
    const cards = a.lines.filter((l) => /^CARD done:census:\d{4}-\d\d-\d\d → node scripts\/captains_call\.mjs file --line ".+" --key done:census:\d{4}-\d\d-\d\d$/.test(l));
    const t2 = tree(src); const k0 = campaign(t2, { pending: 0 }); const b = done(t2, ["report", "--hermetic", "--campaign", k0.c, "--meter", k0.meter]);
    return { ok: cards.length === 1 && !b.lines.some((l) => /^CARD /.test(l)), why: `pending 1 → ${cards.length} card line(s) · pending 0 → ${b.lines.filter((l) => /^CARD /.test(l)).length}` };
  },
};

async function factD3() {
  const t = tree(ORG); put(t, "dressing-room/state/plantlane.json", "{}");
  const x = await import(pathToFileURL(join(t, "scripts", "xray.mjs")).href);
  const sig = () => { const ir = x.build(); return JSON.stringify([x.queries(ir).Q3.map((f) => f.path).sort(), x.verbGraph(ir).orphanVerbs.map((o) => o.organ + " " + o.verb).sort()]); };
  const a = sig();
  rmSync(join(t, "dressing-room", "state"), { recursive: true, force: true }); mkdirSync(join(t, "dressing-room", "state"), { recursive: true });
  return a === sig();
}
function files(dir) {
  const out = new Map();
  const walk = (d) => { for (const n of readdirSync(d)) { if (n === ".git" || n === "node_modules") continue; const p = join(d, n); if (statSync(p).isDirectory()) walk(p); else out.set(relative(dir, p).split(sep).join("/"), createHash("sha256").update(readFileSync(p)).digest("hex")); } };
  walk(dir); return out;
}
function bound() {
  const a = files(BASE), b = files(ORG), diff = [];
  for (const k of new Set([...a.keys(), ...b.keys()])) if (a.get(k) !== b.get(k)) diff.push(k);
  const off = diff.filter((p) => !NAMED.includes(p) && !NAMED_DIRS.some((d) => p.startsWith(d)));
  return { ok: off.length === 0 && diff.includes("scripts/done.mjs"), why: off.length ? `off-bound: ${off.slice(0, 5).join(", ")}` : `${diff.length} differing path(s), all named` };
}
function survivors() {
  if (process.platform === "win32") {
    const r = spawnSync("powershell", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | ForEach-Object { $_.CommandLine }"], { encoding: "utf8", windowsHide: true });
    return String(r.stdout || "").split(/\r?\n/).filter((l) => l.includes(ROOT) && !l.includes("witness_mdone")).length;
  }
  let n = 0;
  for (const p of existsSync("/proc") ? readdirSync("/proc") : []) {
    if (!/^\d+$/.test(p) || Number(p) === process.pid) continue;
    try { if (readFileSync(`/proc/${p}/cmdline`, "utf8").replace(/\0/g, " ").includes(ROOT)) n++; } catch {}
  }
  return n;
}

const only = arg("--only");
const red = [];
try {
  if (!existsSync(NM)) { console.log(`  ✗ SETUP · no node_modules at ${NM} (xray needs acorn) — pass --node-modules`); red.push("SETUP"); }
  for (const [name, fn] of Object.entries(CLAUSES)) {
    if (red.includes("SETUP")) break;
    if (only && !only.split(",").includes(name)) continue;
    let onBase, onBuild;
    try { onBase = fn(BASE); } catch (e) { onBase = { ok: false, why: "threw: " + String(e.message).split("\n")[0] }; }
    try { onBuild = fn(ORG); } catch (e) { onBuild = { ok: false, why: "threw: " + String(e.message).split("\n")[0] }; }
    const pass = !onBase.ok && onBuild.ok;
    console.log(`  ${pass ? "✓" : "✗"} ${name} · base ${onBase.ok ? "GREEN (does not discriminate)" : "RED"} · build ${onBuild.ok ? "GREEN" : "RED"} — ${onBuild.why}`);
    if (!pass) red.push(name);
  }
  if (!only && !red.includes("SETUP")) {
    let d3 = false; try { d3 = await factD3(); } catch (e) { d3 = false; }
    console.log(`  ${d3 ? "✓" : "✗"} FACT D3 · Q3 + orphan verbs over an empty state dir ${d3 ? "EQUAL" : "DIFFER from"} the planted one (the hermetic form may compute orphans)`);
    if (!d3) red.push("D3");
  }
  const b = bound();
  console.log(`  ${b.ok ? "✓" : "✗"} BOUND · ${b.why}`);
  if (!b.ok) red.push("BOUND");
} finally {
  const n = survivors();
  console.log(`  ${n === 0 ? "✓" : "✗"} LAST · ${n} node process(es) naming the temp dir survive`);
  if (n) red.push("LAST");
  try { rmSync(ROOT, { recursive: true, force: true }); } catch {}
}
const total = (only ? only.split(",").length : Object.keys(CLAUSES).length + 1) + 2;
console.log(red.length ? `RED MDONE · ${red.join(", ")}` : `GREEN MDONE what is left · ${total} clause(s)`);
process.exit(red.length ? 1 : 0);
