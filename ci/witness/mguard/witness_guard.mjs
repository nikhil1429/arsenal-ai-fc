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

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const argOf = (n) => { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : undefined; };
const DAY = argOf("--day");
const ORG = resolve(argOf("--org") || join(HERE, "..", "..", ".."));
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
