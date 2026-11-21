#!/usr/bin/env node
// ci/witness/mguard/witness_guard.mjs — THE SPEND GUARD'S JUDGE (unit mguard · c31 · forks rows 1163 (6) / 1176 / 1177 (3)).
// HEADER = CONTRACT. Spec: ci/mguard/MGUARD_SPEC.md §3 P5 / §4 on claude/mguard-spec 4eb934d.
//
//   node ci/witness/mguard/witness_guard.mjs --day <YYYY-MM-DD> [--org <dir>]
//
// WHAT IT JUDGES. One day D of the organism at <dir> (default: the repository this file sits in): did the pool's spend
// inside each of his closed away spans get READ, and did the surface record what it SHOWED him? It READS ONLY:
//   · the campaign root through the tap's own env door (ARSENAL_CAMPAIGN_ROOT) — the reading history by the tap's own
//     exported readers (historyPath, readHistory, readRule, spanSpend); the history's name is never typed here;
//   · presence's ledger for D through presence's own exported reader (presenceDayReport, closedOf); its file is presence's
//     default, or the read door ARSENAL_PRESENCE_LOG when set (the same door the tap honours);
//   · <dir>/scripts/*.mjs as TEXT (G3, comments stripped).
// It writes nothing, binds no port, names no live service, POSTs nothing, restarts nothing, calls no model and never
// calls ActivityWatch (the spans come from the recorded rows). Every read is a file read; no child is spawned.
//
// THE CLAUSES (verdict = the worst: 1 RED over 2 UNREAD over 0 HOLDS; an unread is never a green — mwit §0):
//   READER  the tree carries the span reader (the tap's spanSpend + historyPath); none ⇒ 2 (c31 UNREAD at that tree)
//   ROOT    the campaign root is set; unset ⇒ 2, by the door's name
//   U1177   row 1177 (3): D has at least one presence row recording an away span; none ⇒ 2 by name — a day with no
//           away-span rows is UNREAD, never a day with no spend
//   G1      D's rows carry ≥ 1 CLOSED away span (back_at set, not before its end); none ⇒ 2
//   G2      every closed span of D is bracketed by history rows inside the age bound with no reset inside
//           (spanSpend reads both windows); an unbracketed / rolled / unknown-reset span ⇒ 2
//   G3      in <dir>/scripts/*.mjs exactly ONE file writes the reading history — a file that names the history (its
//           name, or the tap's historyPath door) AND carries a write call — and it is scripts/usage_tap.mjs;
//           none ⇒ 2, a second or another writer ⇒ 1. (Scope: the organs, the owners-only law's domain — named in
//           ci/mguard/PROOF.md as a narrowing of the spec's "tracked tree".)
//   G4      for every READ span, the first statusline history row at or after the presence row that first CLOSED it
//           carries a `shown` entry for that span equal to spanSpend's figures (read, spent and left, both windows);
//           missing or different ⇒ 1
//
// LAST LINE   MGUARD-JUDGE <D> · exit <n> · <clause>=<HOLDS|UNREAD|RED> …     exit 0 / 1 / 2 (3 = usage)
//
// PLANTS (the suite's CLAUSE WITNESSES member, unit mmeter, landed after this unit's cut — met at the merge of main 7bf008b):
//   node ci/witness/mguard/witness_guard.mjs plants [--org <dir>]
// It plants every clause both ways under ONE os.tmpdir() dir and runs THIS judge on each plant as a child, with the root and
// presence doors pointed at the plant (the doors in its own env are dropped first). The day D comes from ONE read of the
// clock (unit mclk): D is that instant's IST day, and every planted stamp is an offset from D's IST noon, so each stays inside D
// on either side of midnight. Each plant expects an exit and a clause word. The HOLD plant (a span read and shown as read)
// expects exit 0 with every clause HOLDS. Each other plant breaks exactly one clause and expects that clause's word.
// The READER and G3 plants judge a copy of <dir>/scripts/*.mjs. The planted age bound is the ruled one (row 1062 F4), as in
// ci/mguard/witness_mguard.mjs. Each child is capped at the job's own timeout-minutes, read from <dir>'s suite.yml.
// It writes only under its temp dir and removes it; no node process naming it survives.
// OUTPUT: one `CLAUSE <ID> GREEN|RED · k/n plant(s)` line per clause, then `PLANTS mguard · k of n plant(s) as expected`.
// The exit is 0 iff k = n.

import { readFileSync, readdirSync, existsSync, mkdtempSync, mkdirSync, writeFileSync, copyFileSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const argOf = (n) => { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : undefined; };
const DAY = argOf("--day");
const ORG = resolve(argOf("--org") || join(HERE, "..", "..", ".."));
if (process.argv[2] === "plants") plants();   // the suite's CLAUSE WITNESSES member (unit mmeter) runs this mode; see PLANTS above
if (!DAY || !/^\d{4}-\d{2}-\d{2}$/.test(DAY)) { console.error("usage: node ci/witness/mguard/witness_guard.mjs --day <YYYY-MM-DD> [--org <dir>]"); console.log("MGUARD-JUDGE ? · exit 3 · usage"); process.exit(3); }

const HOLDS = 0, RED = 1, UNREAD = 2;
const WORD = { [HOLDS]: "HOLDS", [RED]: "RED", [UNREAD]: "UNREAD" };
const out = [];
const say = (id, code, detail) => { out.push([id, code]); console.log(`  ${id} · ${WORD[code]} · ${detail}`); };
const worst = () => out.some(([, c]) => c === RED) ? RED : out.some(([, c]) => c === UNREAD) ? UNREAD : HOLDS;
function end() {
  const v = worst();
  console.log(`MGUARD-JUDGE ${DAY} · exit ${v} · ${out.map(([id, c]) => `${id}=${WORD[c]}`).join(" ")}`);
  process.exit(v);
}
const load = async (rel) => { try { return await import(pathToFileURL(join(ORG, ...rel.split("/"))).href); } catch { return null; } };

const tap = await load("scripts/usage_tap.mjs");
const presence = await load("scripts/presence.mjs");

// G3 first: it is static and needs neither the root nor a day
const strip = (src) => { const i = src.indexOf("// ═══ SELFTEST"); return (i >= 0 ? src.slice(0, i) : src).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "").replace(/\s\/\/ .*$/gm, ""); };
const WRITE = /\b(appendFileSync|writeFileSync|renameSync|createWriteStream|appendFile|writeFile|copyFileSync|cpSync)\s*\(/;
const NAMES_HISTORY = /usage_readings|\bhistoryPath\s*\(/;
{
  const dir = join(ORG, "scripts");
  const writers = (existsSync(dir) ? readdirSync(dir) : []).filter((f) => f.endsWith(".mjs")).sort().filter((f) => {
    let c; try { c = strip(readFileSync(join(dir, f), "utf8")); } catch { return false; }
    return NAMES_HISTORY.test(c) && WRITE.test(c);
  });
  if (!writers.length) say("G3", UNREAD, "no organ writes the reading history at this tree");
  else if (writers.length === 1 && writers[0] === "usage_tap.mjs") say("G3", HOLDS, "exactly one writer of the reading history: scripts/usage_tap.mjs");
  else say("G3", RED, `the reading history has ${writers.length} writer(s): ${writers.map((f) => `scripts/${f}`).join(", ")} — the owners-only law allows one, the tap`);
}

const hasReader = !!tap && typeof tap.spanSpend === "function" && typeof tap.historyPath === "function" && typeof tap.readHistory === "function";
if (!hasReader) { say("READER", UNREAD, "this tree carries no span reader (the tap exports no spanSpend / historyPath): c31 is UNREAD here"); end(); }
say("READER", HOLDS, "the tap exports spanSpend, historyPath and readHistory");

const root = tap.campaignRoot(process.env);
if (!root) { say("ROOT", UNREAD, "no campaign root (ARSENAL_CAMPAIGN_ROOT unset): the history cannot be read"); end(); }
say("ROOT", HOLDS, "the campaign root is set");

if (!presence || typeof presence.presenceDayReport !== "function" || typeof presence.closedOf !== "function") { say("U1177", UNREAD, "presence exports no day reader / closedOf at this tree: no away-span row can be read"); end(); }
const file = process.env.ARSENAL_PRESENCE_LOG;
const rows = presence.presenceDayReport(DAY, file ? { file } : {}).rows
  .filter((r) => r && r.kind === "focus").sort((a, b) => Date.parse(a.ts) - Date.parse(b.ts));
const spanRows = rows.filter((r) => Array.isArray(r.away) && r.away.length > 0);
if (!spanRows.length) { say("U1177", UNREAD, `no away-span rows for ${DAY} (${rows.length} focus row(s) read): the day is UNREAD, never a day with no spend (row 1177 (3))`); end(); }
say("U1177", HOLDS, `${spanRows.length} focus row(s) of ${DAY} record away spans`);

// each closed span, keyed by its start, with the FIRST row that closed it
const spans = new Map();
for (const r of rows) {
  const c = presence.closedOf(r);
  if (!c) continue;
  for (const sp of c.spans) if (!spans.has(sp.start)) spans.set(sp.start, { start: sp.start, end: sp.end, closed_at: r.ts });
}
if (!spans.size) { say("G1", UNREAD, `${spanRows.length} row(s) record away spans and none is CLOSED (he has not come back): nothing to read yet`); end(); }
say("G1", HOLDS, `${spans.size} closed away span(s) on ${DAY}`);

const history = tap.readHistory(tap.historyPath(root));
const rule = tap.readRule(root);
const read = [];
const unread = [];
for (const sp of spans.values()) {
  const r = tap.spanSpend(history, sp, rule);
  (r.read ? read : unread).push({ sp, r });
}
if (unread.length) say("G2", UNREAD, `${unread.length} of ${spans.size} span(s) unread: ${unread.map(({ sp, r }) => `${sp.start}→${sp.end} (${r.why})`).join("; ")}`);
else say("G2", HOLDS, `every closed span read: ${read.map(({ sp, r }) => `${sp.start}→${sp.end} five +${r.five.spent} week +${r.week.spent}`).join("; ")}`);

const t = (x) => Date.parse(x);
const same = (a, b) => !!a && !!b && a.spent === b.spent && a.left === b.left;
const bad = [];
for (const { sp, r } of read) {
  const after = history.filter((h) => h && h.source === "statusline" && t(h.read_at) >= t(sp.closed_at)).sort((a, b) => t(a.read_at) - t(b.read_at))[0];
  const entry = after && Array.isArray(after.shown) ? after.shown.find((x) => x && Array.isArray(x.span) && x.span[0] === sp.start && x.span[1] === sp.end) : null;
  if (!entry) { bad.push(`${sp.start}→${sp.end}: the first render after it closed recorded no shown entry`); continue; }
  if (!(entry.read === true && same(entry.five, r.five) && same(entry.week, r.week))) bad.push(`${sp.start}→${sp.end}: shown ${JSON.stringify({ five: entry.five, week: entry.week })} ≠ read ${JSON.stringify({ five: r.five, week: r.week })}`);
}
if (bad.length) say("G4", RED, bad.join("; "));
else say("G4", HOLDS, `${read.length} read span(s), each shown as read`);
end();

// ═══ PLANTS — every clause both ways (see PLANTS in the header) ═══
function plants() {
  const MIN = 60 * 1000;
  const RULED_F4_BOUND_MIN = 5 * 60;   // row 1062 F4: "bound five hours until a row moves it" — planted in the law home
  const NOW = Date.now();                                                            // the ONE clock read (unit mclk)
  const D = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(NOW));
  const A = Date.parse(`${D}T12:00:00+05:30`);                                       // D's IST noon: every stamp is an offset from it
  const at = (m) => new Date(A + m * MIN).toISOString();
  const CAP_MS = (() => { try { const m = /timeout-minutes:\s*(\d+)/.exec(readFileSync(join(ORG, ".github", "workflows", "suite.yml"), "utf8")); return m ? Number(m[1]) * MIN : undefined; } catch { return undefined; } })();
  const TMP = mkdtempSync(join(tmpdir(), "mguard-plants-"));
  const SELF = fileURLToPath(import.meta.url);
  const env0 = { ...process.env }; delete env0.ARSENAL_CAMPAIGN_ROOT; delete env0.ARSENAL_PRESENCE_LOG;
  const span = [at(-60), at(-30)];
  const reading = (m, five, week) => ({ read_at: at(m), source: "statusline", five: { pct: five, resets_at: at(200) }, week: { pct: week, resets_at: at(3000) } });
  const focus = (m, away, back_at) => ({ ts: at(m), day: D, kind: "focus", away, back_at });
  const closedRow = focus(-29, [span], at(-30));
  const tapChild = (rows, root) => {
    const code = `const t = await import(${JSON.stringify(pathToFileURL(join(ORG, "scripts", "usage_tap.mjs")).href)});` +
      `process.stdout.write(JSON.stringify({ s: t.spanSpend(${JSON.stringify(rows)}, ${JSON.stringify({ start: span[0], end: span[1] })}, { maxAgeMin: ${RULED_F4_BOUND_MIN} }), path: t.historyPath(${JSON.stringify(root)}) }))`;
    const r = spawnSync(process.execPath, ["--input-type=module", "-e", code], { encoding: "utf8", env: env0, timeout: CAP_MS, windowsHide: true });
    try { return JSON.parse(r.stdout); } catch { return null; }
  };
  let n = 0;
  const plant = ({ root = true, presence = [closedRow], history = null, shownDelta = 0, org = ORG }) => {
    const dir = join(TMP, `p${n++}`); mkdirSync(dir, { recursive: true });
    const env = { ...env0 };
    if (root) {
      const r = join(dir, "root"); mkdirSync(join(r, "tools"), { recursive: true });
      writeFileSync(join(r, "tools", "model_law.mjs"), `// the campaign's law home (planted)\nexport const POOL_READING_MAX_AGE_MIN = ${RULED_F4_BOUND_MIN};\n`);
      env.ARSENAL_CAMPAIGN_ROOT = r;
      if (history) {
        const rows = history.rows.map((x) => ({ ...x }));
        const t = tapChild(rows, r);                       // the org's own tap: its spanSpend figures and its historyPath
        if (!t) throw new Error("the org's tap could not be read for the HOLD history");
        const s = t.s, last = rows[rows.length - 1];
        const five = s.five && s.five.read ? { ...s.five, spent: s.five.spent + shownDelta } : s.five;
        last.shown = [{ span, read: s.read, why: s.why, bracket: s.bracket, five, week: s.week }];
        writeFileSync(t.path, rows.map((x) => JSON.stringify(x)).join("\n") + "\n");
      }
    }
    const log = join(dir, "presence_log.jsonl");
    writeFileSync(log, presence.map((x) => JSON.stringify(x)).join("\n") + (presence.length ? "\n" : ""));
    env.ARSENAL_PRESENCE_LOG = log;
    const r = spawnSync(process.execPath, [SELF, "--day", D, "--org", org], { encoding: "utf8", env, timeout: CAP_MS, windowsHide: true });
    return { code: r.status, out: String(r.stdout || "") };
  };
  const copyScripts = (name, edit) => {
    const o = join(TMP, name); mkdirSync(join(o, "scripts"), { recursive: true });
    for (const f of readdirSync(join(ORG, "scripts"))) if (f.endsWith(".mjs")) copyFileSync(join(ORG, "scripts", f), join(o, "scripts", f));
    edit(join(o, "scripts")); return o;
  };
  const word = (out, id) => { const m = new RegExp(`^\\s*${id} · (HOLDS|UNREAD|RED) · `, "m").exec(out); return m ? m[1] : null; };
  const results = [];
  try {
    const withHist = (shownDelta) => ({ history: { rows: [reading(-70, 40, 60), reading(-20, 45, 61)] }, shownDelta });
    const hold = plant(withHist(0));
    const holdOk = (id) => hold.code === 0 && word(hold.out, id) === "HOLDS";
    const one = (id, p, code, w, why) => results.push({ id, ok: p.code === code && word(p.out, id) === w, why });
    for (const id of ["READER", "ROOT", "U1177", "G1", "G2", "G3", "G4"]) results.push({ id, ok: holdOk(id), why: "the HOLD plant: a span read and shown as read" });
    one("READER", plant({ ...withHist(0), org: copyScripts("noreader", (d) => writeFileSync(join(d, "usage_tap.mjs"), "export const campaignRoot = () => null;\n")) }), 2, "UNREAD", "a tree with no span reader");
    one("ROOT", plant({ root: false }), 2, "UNREAD", "no campaign root");
    one("U1177", plant({ ...withHist(0), presence: [focus(-29, [], null)] }), 2, "UNREAD", "a day with focus rows and no away-span row");
    one("U1177", plant({ ...withHist(0), presence: [] }), 2, "UNREAD", "a day with no presence row at all");
    one("G1", plant({ ...withHist(0), presence: [focus(-29, [span], null)] }), 2, "UNREAD", "an away span he has not come back from");
    one("G2", plant({ presence: [closedRow] }), 2, "UNREAD", "a closed span with no history bracketing it");
    one("G3", plant({ ...withHist(0), org: copyScripts("rogue", (d) => writeFileSync(join(d, "rogue_writer.mjs"), 'import { appendFileSync } from "node:fs";\nexport const w = (p) => appendFileSync(p + "/usage_readings.jsonl", "{}\\n");\n')) }), 1, "RED", "a second writer of the reading history");
    one("G4", plant(withHist(1)), 1, "RED", "a shown entry that differs from the read");
  } finally {
    rmSync(TMP, { recursive: true, force: true });
  }
  const ids = [...new Set(results.map((r) => r.id))];
  for (const id of ids) {
    const mine = results.filter((r) => r.id === id), k = mine.filter((r) => r.ok).length;
    console.log(`CLAUSE ${id} ${k === mine.length ? "GREEN" : "RED"} · ${k}/${mine.length} plant(s)`);
    for (const r of mine) if (!r.ok) console.log(`  FAIL ${id} · ${r.why}`);
  }
  const k = results.filter((r) => r.ok).length;
  console.log(`PLANTS mguard · ${k} of ${results.length} plant(s) as expected`);
  process.exit(k === results.length ? 0 : 1);
}
