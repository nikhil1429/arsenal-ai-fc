#!/usr/bin/env node
// @ts-check
// ============================================================================
// done.mjs · ARSENAL AI FC — WHAT IS LEFT (unit mdone, ruling row 1032; spec ci/mcr/B3_SPEC.md)
//   SOLE WRITER of: NOTHING. It prints; it never writes a file, never files a card, never touches state (D1 A).
// ----------------------------------------------------------------------------
// The three DONE checks of plan v2 §8 in one command, plus open units, the census and THE REACH READER:
//   orphans   Q3 lanes (written, never read) and orphan verbs, PRINTED SEPARATELY (Q2) — scripts/xray.mjs build/queries/
//             verbGraph reused. D3: the hermetic form computes them because Q3 + orphan verbs over an EMPTY state dir
//             equal the real ones (measured in this unit's build; ci/mdone/PROOF.md).
//   rungs     by clause and by loop, from the campaign (--campaign <dir>, D5 A); without it the word is UNREAD, never 0/0.
//             A clause is GREEN iff its witness read RED before the rung, GREEN on his real day, the METER (the day meter
//             ledger daily_green.mjs writes, Q3) byte-unchanged across that run, AND the old recorded day still RED.
//   rules     every rule set side by side, NEVER summed (D6): laws/*.yml (on the neutral machine too) · the ten laws of
//             CLAUDE.md · laws_register.json · teaching_contract rules (the last three at the laptop only).
//   units     open by clause (campaign) · census PENDING (campaign) — UNREAD without --campaign.
//   reach     THE REACH READER: static reach from the xray graph (the lane's declared consumer READS its file), window
//             reach at the laptop (its consumer consumed it inside the gate's window). A lane's files are its registry
//             row's declared `files` (unit mdn2); a row declaring none falls back to its subject name. The consumer map is the LIVE
//             registry, so reach runs at the laptop only (D2 A). A lane with no declared consumer is NO CONSUMER, never
//             reached.
// THE MORNING LINE (D4 A): `line` is printed by the /matchday anchor right after the state line — read, never answered.
// It is a card only when a check is RED on a thing only his word can fix; this organ never files it — `report` prints
// the ONE card command (key done:<check>:<day>) for the anchor to run through captains_call.mjs, the card's owner.
//   unit mrung (row 1058 (5), rulings forks row 1122 (2)): rungs are read from THE RUNG RECEIPT (rung_receipt.mjs, sole writer
//             of rung_receipts.jsonl) keyed by the campaign's plan v3 list (<campaign>/rungs/plan_v3.json, rung_receipt.mjs
//             PLAN_CONTRACT); a plan clause with no complete receipt is UNREAD, a typed row REFUSED, an empty plan UNREAD —
//             never 0/0. The old hand contract (rungsLegacy, frozen) is REFUSED and counted in nothing (F2 a).
// MODES: line (default) · report · json · selftest (plants registry files under os.tmpdir() only)        FLAGS: --campaign <dir> · --meter <file> · --receipts <file> · --hermetic
// The hermetic form (--hermetic or ORGANISM_TEST_PROFILE=hermetic) reads no state file: reach and the three live rule
// sets print LIVE; its rungs read ONLY --receipts (a planted file) — without it every plan clause is UNREAD and the state
// file is never opened. The witness of this organ is ci/mdone/witness_mdone.mjs (rungs: ci/mrung/witness_mrung.mjs).
// ============================================================================
import { readFileSync, readdirSync, existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { build, queries, verbGraph } from "./xray.mjs";
import { lazySubjects, upsertRow, retireRow } from "./registry.mjs";   // unit mlaw (forks row 1146 (1) FK1 A): his reading surfaces are a ROW, never a literal

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const STATE = join(ROOT, "dressing-room", "state");
const METER = join(STATE, "daily_green.jsonl");            // Q3 — the day meter; daily_green.mjs is its sole writer (header :4, append :422)
const RECEIPTS = join(STATE, "rung_receipts.jsonl");       // unit mrung — rung_receipt.mjs is its sole writer; read here, never written
const CONSUMPTION = join(STATE, "consumption.jsonl");      // brain.mjs:132 is its sole writer; read here, never written
export const OLD_RECORDED_DAY = "2026-11-13";                     // row 1032 Q3 — the old recorded day that must still read RED
// THE SURFACES HE READS (the sheet's and the card's owners) are the registry mechanisms row `his_surfaces`, read at FIRST USE
// (lazySubjects, the shape registry.mjs owns). No fallback literal: an absent row is a NAMED RED on the reach line (unit mlaw,
// forks row 1146 (1) FK1 A; the typed pair this replaced was the law pack's jugad finding 92, ci/mlaw/MLAW_SPEC.md §1.3).
export const SURFACES_ROW = "his_surfaces";
const SURFACES = lazySubjects(SURFACES_ROW);
/** the row's subjects, or the named red when the registry holds no live row @param {readonly string[]} view
 *  @returns {{ list: string[] } | { red: string }} */
export function surfacesOrRed(view) {
  try { return { list: [...view] }; }
  catch { return { red: `no live mechanisms row "${SURFACES_ROW}" in the registry — the surfaces he reads are a ROW (seed it through registry.mjs set --table mechanisms)` }; }
}

const argv = process.argv.slice(2);
const flag = (k) => { const i = argv.indexOf(k); return i > -1 ? argv[i + 1] : null; };
const HERMETIC = argv.includes("--hermetic") || process.env.ORGANISM_TEST_PROFILE === "hermetic";
const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");
const readJ = (p) => { try { return JSON.parse(readFileSync(p, "utf8")); } catch { return undefined; } };
const readL = (p) => { try { return readFileSync(p, "utf8").split(/\r?\n/).filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean); } catch { return null; } };
const today = () => new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10);   // IST, the day his anchors keep

// ── orphans ───────────────────────────────────────────────────────────────────────────────────────────────────────
function orphans(ir) {
  const q = queries(ir), v = verbGraph(ir);
  return { lanes: q.Q3.map((f) => f.path).sort(), verbs: v.orphanVerbs.map((o) => `${o.organ} ${o.verb}`).sort() };
}

// ── rungs · units · census — the campaign's own files (D5 A: nothing campaign-side enters main) ──────────────────
// THE INPUT CONTRACT (this seat's; the campaign emits it): <campaign>/rungs/*.json { rung, clauses: [{ id, red_before,
// green_real_day, meter_before, meter_after }] } · <campaign>/loops/*.json { loop, sheet, page, acts_receipt, ladder,
// ladder_sha256 } · <campaign>/units.json [{ unit, fate, landed, clause }] · <campaign>/census.json [{ piece, fate, rung,
// serves_no_step }]. A path in a loop file resolves against the campaign dir, or against the repo when it starts
// dressing-room/.
function oldDayRed(meterPath) {
  const rows = readL(meterPath);
  if (!rows) return { ok: false, why: "the meter is unreadable" };
  const last = rows.filter((r) => r && r.date === OLD_RECORDED_DAY).pop();
  if (!last) return { ok: false, why: `the meter holds no ${OLD_RECORDED_DAY} row` };
  return last.green === false ? { ok: true, why: `${OLD_RECORDED_DAY} still RED` } : { ok: false, why: `${OLD_RECORDED_DAY} reads GREEN now (the old day was rewritten)` };
}
// FROZEN (L9) — the hand contract above, kept as written; rungs() below no longer calls it (F2 a: a typed row counts in nothing).
function rungsLegacy(campaign, meterPath) {
  if (!campaign) return { read: false, why: "UNREAD (no --campaign)" };
  const rd = join(campaign, "rungs"), ld = join(campaign, "loops");
  if (!existsSync(rd)) return { read: false, why: `UNREAD (${rd} absent)` };
  const old = oldDayRed(meterPath);
  let g = 0, n = 0; const red = [];
  for (const f of readdirSync(rd).filter((x) => x.endsWith(".json")).sort()) {
    const r = readJ(join(rd, f));
    for (const c of (r && Array.isArray(r.clauses) ? r.clauses : [{ id: "(unreadable)" }])) {
      n++;
      const ok = /^RED\b/.test(String(c.red_before || "")) && /^GREEN\b/.test(String(c.green_real_day || ""))
        && typeof c.meter_before === "string" && c.meter_before === c.meter_after && old.ok;
      if (ok) g++; else red.push(`${(r && r.rung) || f}:${c.id}`);
    }
  }
  let lg = 0, ln = 0; const lred = [];
  const at = (p) => (String(p || "").startsWith("dressing-room/") ? join(ROOT, p) : join(campaign, String(p || "")));
  for (const f of existsSync(ld) ? readdirSync(ld).filter((x) => x.endsWith(".json")).sort() : []) {
    const l = readJ(join(ld, f)) || {}; ln++;
    let ok = ["sheet", "page", "acts_receipt", "ladder"].every((k) => l[k] && existsSync(at(l[k])));
    if (ok) { try { ok = sha256(readFileSync(at(l.ladder))) === l.ladder_sha256; } catch { ok = false; } }
    if (ok) lg++; else lred.push(l.loop || f);
  }
  return { read: true, g, n, lg, ln, red, lred, old: old.why };
}
void rungsLegacy;
// unit mrung — THE RECEIPT READER. The plan v3 list (campaign-side, F3 a) says WHICH clauses exist; the receipts (one organ's
// measurements, hash-chained) say what was measured. n is the plan's clause count; a plan of zero clauses is UNREAD, never 0/0.
// The reader's doors are rung_receipt.mjs's own exports, loaded by dynamic import in measure() — never a static import:
// rung_receipt.mjs green imports OLD_RECORDED_DAY from here, and a static cycle under top-level await never settles.
function rungs(campaign, receiptsText, { readPlan, parseReceipts, clauseVerdict, loopVerdict, PLAN_FILE }) {
  if (!campaign) return { read: false, why: "UNREAD (no --campaign)" };
  const rd = join(campaign, "rungs");
  // F2 (a): every hand rung file (anything in rungs/ but the plan) is REFUSED, clause by clause, and counted in nothing
  let hand = 0;
  for (const f of existsSync(rd) ? readdirSync(rd).filter((x) => x.endsWith(".json") && x !== PLAN_FILE).sort() : []) {
    const r = readJ(join(rd, f)); hand += r && Array.isArray(r.clauses) && r.clauses.length ? r.clauses.length : 1;
  }
  const plan = readPlan(campaign);
  if (!plan.ok) return { read: false, hand, why: `UNREAD (${plan.why})` };
  if (!plan.clauses.length) return { read: false, hand, why: "UNREAD (the plan v3 list holds no clause)" };
  const read = receiptsText !== undefined;   // undefined = not read at all (hermetic without --receipts); null = read, absent
  const rr = parseReceipts(read ? receiptsText : null);
  const by = { GREEN: 0, UNREAD: 0, RED: 0, REFUSED: 0 }; const not = [];
  for (const c of plan.clauses) {
    const v = read ? clauseVerdict(c.key, c.witness, rr) : { word: "UNREAD", why: "no receipts read (hermetic without --receipts)" };
    by[v.word]++; if (v.word !== "GREEN") not.push(`${c.key} ${v.word} (${v.why})`);
  }
  let lg = 0; const lnot = [];
  for (const id of plan.loops) {
    const v = read ? loopVerdict(id, rr) : { word: "UNREAD", why: "no receipts read" };
    if (v.word === "GREEN") lg++; else lnot.push(`loop:${id} ${v.word} (${v.why})`);
  }
  return { read: true, n: plan.clauses.length, g: by.GREEN, u: by.UNREAD, r: by.RED, x: by.REFUSED, hand, lg, ln: plan.loops.length, not, lnot,
    chain: rr.brokenAt < 0 ? "holds" : `BROKEN at row ${rr.brokenAt + 1}` };
}
function units(campaign) {
  if (!campaign) return { read: false, why: "UNREAD (no --campaign)" };
  const u = readJ(join(campaign, "units.json"));
  if (!Array.isArray(u)) return { read: false, why: "UNREAD (units.json absent or unreadable)" };
  const open = u.filter((x) => x && x.fate === "BUILD" && !x.landed);
  const by = {}; for (const x of open) by[x.clause || "?"] = (by[x.clause || "?"] || 0) + 1;
  return { read: true, open: open.length, by };
}
function census(campaign) {
  if (!campaign) return { read: false, why: "UNREAD (no --campaign)" };
  const c = readJ(join(campaign, "census.json"));
  if (!Array.isArray(c)) return { read: false, why: "UNREAD (census.json absent or unreadable)" };
  const pending = c.filter((x) => x && x.fate === "PENDING").length;
  const unfated = c.filter((x) => x && x.fate !== "PENDING" && !((x.fate && x.rung) || x.serves_no_step)).length;
  return { read: true, pending, unfated };
}

// ── rules, side by side (D6) ────────────────────────────────────────────────────────────────────────────────────
async function rules() {
  const out = {};
  const ids = existsSync(join(ROOT, "laws")) ? readdirSync(join(ROOT, "laws")).filter((f) => f.endsWith(".yml")).sort()
    .map((f) => (/^id:\s*(\S+)/m.exec(readFileSync(join(ROOT, "laws", f), "utf8")) || [])[1]).filter(Boolean) : [];
  let lp = null; try { lp = await import(pathToFileURL(join(ROOT, "scripts", "lawpack.mjs")).href); } catch { lp = null; }
  const red = lp && lp.PLANTS ? ids.filter((id) => typeof lp.PLANTS[id] === "string") : [];
  const both = lp && lp.CLEAN_PLANTS ? red.filter((id) => typeof lp.CLEAN_PLANTS[id] === "string") : [];
  out.laws = { n: ids.length, red: red.length, both: both.length, missing: ids.filter((id) => !both.includes(id)) };
  if (HERMETIC) { out.ten = out.register = out.teaching = null; return out; }
  const md = (() => { try { return readFileSync(join(ROOT, "CLAUDE.md"), "utf8"); } catch { return ""; } })();
  const ten = md.split(/\r?\n/).filter((l) => /^\|\s*L\d+\s*\|/.test(l));
  out.ten = { n: ten.length, verify: ten.filter((l) => /`node [^`]+`/.test(l)).length };
  const reg = readJ(join(STATE, "laws_register.json"));
  const sl = reg && Array.isArray(reg.standing_laws) ? reg.standing_laws : null;
  out.register = sl ? { n: sl.length, site: sl.filter((x) => x && x.check_site).length } : { unread: true };
  const tc = readJ(join(STATE, "teaching_contract.json"));
  out.teaching = tc && Array.isArray(tc.rules) ? { n: tc.rules.length } : { unread: true };
  return out;
}

// ── THE REACH READER ────────────────────────────────────────────────────────────────────────────────────────────
async function reach(ir) {
  if (HERMETIC) return { live: true };
  const sv = surfacesOrRed(SURFACES);   // FK1 A: an absent row is a named red, before any other read
  if ("red" in sv) return { red: sv.red };
  const surfaces = sv.list;
  let gate;
  try { gate = await import(pathToFileURL(join(ROOT, "scripts", "gate.mjs")).href); } catch (e) { return { unread: `the consumer map could not be read (${String(e && e.message).slice(0, 80)})` }; }
  // unit mdn2 (forks row 1051 (4)): a lane's files are what its registry row DECLARES (`files`, registry.mjs laneFiles);
  // only a row that declares none falls back to the subject-name reading below. The declaration wins, never a union.
  let declared = {};
  try { declared = (await import(pathToFileURL(join(ROOT, "scripts", "registry.mjs")).href)).laneFiles() || {}; } catch { declared = {}; }
  const cons = readL(CONSUMPTION) || [];
  const skills = new Set((ir.roots.skills || []).map((r) => r.script));
  const now = Date.now();
  const rows = [];
  for (const [subject, l] of Object.entries(gate.LANE_CONSUMERS)) {
    const rc = /** @type {any} */ (l).right_consumer || {};
    const decl = Array.isArray(declared[subject]) ? declared[subject] : null;
    const files = ir.files.filter((f) => { const p = f.path; if (decl) return decl.includes(p); const b = `dressing-room/state/brain_out/${subject}`; return p === b || p.startsWith(b + "/") || p === `dressing-room/state/${subject}.json` || p === `dressing-room/state/${subject}.jsonl`; });
    const readers = new Set(files.flatMap((f) => f.readers));
    const noCons = !rc.retired && rc.kind !== "him" && !(rc.names || []).length;
    const stat = noCons || rc.retired ? false : rc.kind === "him" ? [...readers].some((r) => skills.has(r) || surfaces.includes(r)) : (rc.names || []).some((n) => readers.has(n));
    const c = gate.consumptionOf(cons, [subject]);
    const age = c.last_at ? (now - Date.parse(c.last_at)) / 864e5 : null;
    const win = noCons ? false : gate.consumerSatisfied(rc, c, { ageDays: age }).ok;
    rows.push({ subject, noCons, retired: !!rc.retired, stat, win, reached: stat && win, files: files.length, decl: !!decl });
  }
  return { rows };
}

async function measure() {
  const campaign = flag("--campaign") ? resolve(flag("--campaign")) : null;
  void METER;   // the meter is read by the receipt's writer around the green run (rung_receipt.mjs green), never here now
  const text = (p) => { try { return readFileSync(p, "utf8"); } catch { return null; } };
  // the receipts: --receipts (a planted file) wins; the hermetic form without it reads NOTHING (undefined); else the tracked file
  const receiptsText = flag("--receipts") ? text(resolve(flag("--receipts"))) : HERMETIC ? undefined : (() => { try { return readFileSync(RECEIPTS, "utf8"); } catch { return null; } })();
  const ir = build();
  const RR = await import(pathToFileURL(join(ROOT, "scripts", "rung_receipt.mjs")).href);
  return { o: orphans(ir), r: rungs(campaign, receiptsText, RR), u: units(campaign), c: census(campaign), ru: await rules(), re: await reach(ir) };
}
function lineOf(m) {
  const hd = m.r.hand ? ` · hand ${m.r.hand} REFUSED` : "";
  const rg = m.r.read ? `rungs ${m.r.g}/${m.r.n} GREEN · ${m.r.u} UNREAD · ${m.r.r} RED · ${m.r.x} REFUSED${hd} · ${m.r.lg}/${m.r.ln} loops` : `rungs UNREAD${hd}`;
  const L = m.ru.laws;
  const ru = [`laws ${L.both}/${L.n} both ways (${L.red}/${L.n} RED-planted)`,
    m.ru.ten ? `ten laws ${m.ru.ten.verify}/${m.ru.ten.n} with a verify command` : "ten laws LIVE",
    m.ru.register ? (m.ru.register.unread ? "laws_register UNREAD" : `laws_register ${m.ru.register.site}/${m.ru.register.n} with a check site`) : "laws_register LIVE",
    m.ru.teaching ? (m.ru.teaching.unread ? "teaching rules UNREAD" : `teaching rules ${m.ru.teaching.n}`) : "teaching rules LIVE"].join(" | ");
  const un = m.u.read ? `units ${m.u.open} open` : "units UNREAD";
  const ce = m.c.read ? `census PENDING ${m.c.pending}` : "census UNREAD";
  let re;
  if (m.re.live) re = "reach LIVE (the consumer map is the live registry)";
  else if (m.re.unread) re = "reach UNREAD";
  else if (m.re.red) re = `reach RED — ${m.re.red}`;
  else { const R = m.re.rows, ok = R.filter((x) => !x.noCons && !x.retired); re = `reach ${R.filter((x) => x.reached).length}/${ok.length} (static ${R.filter((x) => x.stat).length}/${ok.length} · window ${R.filter((x) => x.win).length}/${ok.length} · files declared ${ok.filter((x) => x.decl).length}/${ok.length}) · NO CONSUMER ${R.filter((x) => x.noCons).length}`; }
  return `DONE · orphans lanes ${m.o.lanes.length} · orphan verbs ${m.o.verbs.length} · ${rg} · rules ${ru} · ${un} · ${ce} · ${re}`;
}
function reportOf(m) {
  const out = [lineOf(m)];
  out.push(`DONE orphans  lanes ${m.o.lanes.length} (Q3)${m.o.lanes.length ? ": " + m.o.lanes.join(", ") : ""}`);
  out.push(`DONE orphans  verbs ${m.o.verbs.length} (orphan verbs)`);
  out.push(m.r.read ? `DONE rungs    ${m.r.g}/${m.r.n} GREEN · ${m.r.u} UNREAD · ${m.r.r} RED · ${m.r.x} REFUSED · ${m.r.lg}/${m.r.ln} loops · receipt chain ${m.r.chain}${m.r.hand ? ` · hand ${m.r.hand} REFUSED (typed: hand contract)` : ""}${m.r.not.length ? " · not green: " + m.r.not.join(", ") : ""}${m.r.lnot.length ? " · loops not green: " + m.r.lnot.join(", ") : ""}` : `DONE rungs    ${m.r.why}${m.r.hand ? ` · hand ${m.r.hand} REFUSED (typed: hand contract)` : ""}`);
  out.push(`DONE rules    laws/*.yml ${m.ru.laws.both}/${m.ru.laws.n} planted both ways · ${m.ru.laws.red}/${m.ru.laws.n} RED-planted${m.ru.laws.missing.length ? " · no clean plant: " + m.ru.laws.missing.join(", ") : ""} (the sets are never summed)`);
  out.push(m.u.read ? `DONE units    ${m.u.open} open by clause ${JSON.stringify(m.u.by)}` : `DONE units    ${m.u.why}`);
  out.push(m.c.read ? `DONE census   PENDING ${m.c.pending} · neither a fate+rung nor serves-no-step ${m.c.unfated}` : `DONE census   ${m.c.why}`);
  if (m.re.rows) {
    for (const x of m.re.rows) out.push(`DONE reach    ${x.subject}: ${x.noCons ? "NO CONSUMER" : x.retired ? "RETIRED" : x.reached ? "REACHED" : `static ${x.stat ? "yes" : x.files ? "NO (its declared consumer reads none of its files)" : x.decl ? "NO (none of its declared files is in the xray graph)" : "NO (no file of it in the xray graph)"} · window ${x.win ? "yes" : "NO"}`}`);
  } else out.push(`DONE reach    ${m.re.live ? "LIVE (hermetic form: the consumer map is the live registry, D2 A)" : m.re.red ? `RED — ${m.re.red}` : m.re.unread}`);
  // the ONE card a day per check, and only for what only his word can fix: a census PENDING is a fate nobody ruled
  if (m.c.read && m.c.pending > 0) out.push(`CARD done:census:${today()} → node scripts/captains_call.mjs file --line "Census: ${m.c.pending} piece PENDING — fate aapka faisla." --key done:census:${today()}`);
  return out;
}

/** the selftest (unit mlaw, forks row 1146 (1) FK1 A): the his_surfaces row PLANTED both ways, in registry files under
 *  os.tmpdir() written by registry.mjs's OWN exported writers (upsertRow / retireRow) — this organ still writes nothing, never
 *  the live registry, never a state file. The temp dir is left to the OS (removing it would be a write of this organ's own). */
function selftest() {
  let pass = 0, fail = 0;
  const ok = (name, cond) => { if (cond) pass++; else fail++; console.log(`  ${cond ? "✓" : "✗"} ${name}`); };
  const dir = mkdtempSync(join(tmpdir(), "done-selftest-"));
  const row = (subject, subjects) => ({ subject, schema_owner: "done.mjs", witness: "node scripts/done.mjs selftest", subjects, why: "done.mjs selftest plant" });
  const planted = row(SURFACES_ROW, ["sheet_owner.mjs", "card_owner.mjs"]);
  const withP = join(dir, "with.json"), withoutP = join(dir, "without.json"), retiredP = join(dir, "retired.json");
  const seeded = [upsertRow("mechanisms", planted, { path: withP }), upsertRow("mechanisms", row("some_other_row", ["x.mjs"]), { path: withoutP }),
    upsertRow("mechanisms", planted, { path: retiredP })];
  const retired = retireRow("mechanisms", SURFACES_ROW, "done.mjs selftest: a retired row is no row", { path: retiredP });
  ok("the plants are written by registry.mjs's own writers, under os.tmpdir()", seeded.every((r) => r && r.ok) && !!retired && !!retired.ok);
  const a = surfacesOrRed(lazySubjects(SURFACES_ROW, withP));
  ok("PLANTED · the his_surfaces row is read through lazySubjects: its subjects ARE the surfaces (a row edit, never a code edit)",
    "list" in a && JSON.stringify(a.list) === JSON.stringify(planted.subjects));
  const b = surfacesOrRed(lazySubjects(SURFACES_ROW, withoutP));
  ok("PLANTED · a registry with NO his_surfaces row is a NAMED RED (no fallback literal, never an empty list)", "red" in b && b.red.includes(`"${SURFACES_ROW}"`));
  const c = surfacesOrRed(lazySubjects(SURFACES_ROW, retiredP));
  ok("PLANTED · a RETIRED his_surfaces row is the same named red", "red" in c && c.red.includes(`"${SURFACES_ROW}"`));
  const d = surfacesOrRed(lazySubjects(SURFACES_ROW, join(dir, "absent.json")));
  ok("PLANTED · an absent registry file is the same named red", "red" in d);
  console.log(`\ndone selftest: ${pass} passed, ${fail} failed`);
  console.log(fail ? "SELFTEST FAILED" : "ALL CHECKS PASSED");
  return fail ? 1 : 0;
}

async function main() {
  const mode = argv[0] && !argv[0].startsWith("--") ? argv[0] : "line";
  if (mode === "selftest") return selftest();
  if (!["line", "report", "json"].includes(mode)) { console.log("done.mjs [line|report|json] [--campaign <dir>] [--meter <file>] [--receipts <file>] [--hermetic]"); return 2; }
  const m = await measure();
  if (mode === "json") console.log(JSON.stringify({ hermetic: HERMETIC, orphans: { lanes: m.o.lanes.length, verbs: m.o.verbs.length }, rungs: m.r, units: m.u, census: m.c, rules: m.ru, reach: m.re.rows ? m.re.rows.map((x) => ({ subject: x.subject, reached: x.reached, static: x.stat, window: x.win, no_consumer: x.noCons })) : m.re }));
  else if (mode === "report") for (const l of reportOf(m)) console.log(l);
  else console.log(lineOf(m));
  return 0;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exitCode = await main();
