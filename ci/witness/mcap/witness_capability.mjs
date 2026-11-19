#!/usr/bin/env node
// ============================================================================
// ci/witness/mcap/witness_capability.mjs — UNIT mcap · THE SEVEN CAPABILITY CLAUSES (spec ci/mwit/MWIT_SPEC.md @ 88bf69d,
//   C:capability-c07 · c10 · c12 · c13 · c18 · c28 · c32; rulings forks rows 1162 / 1163 — where the spec and the ruling
//   differ, the ruling wins, and ci/mcap/PROOF.md names each difference)
// ----------------------------------------------------------------------------
// THE EXIT LAW (spec §0): 0 the clause HOLDS · 1 RED, read and it does not hold · 2 UNREAD, a fact it needs is absent.
// USAGE
//   node ci/witness/mcap/witness_capability.mjs <c07|c10|c12|c13|c18|c28|c32> --day <YYYY-MM-DD> [--org <dir>]   the clause
//   node ci/witness/mcap/witness_capability.mjs plants [--org <dir>]               every plant, this tree only (suite member)
//   node ci/witness/mcap/witness_capability.mjs --org <dir> --base-org <dir>       the UNIT witness: RED on base, GREEN on build
// THE MAP. <org>/ci/witness/mcap/capability_map.json names, per clause, its READER and its ids. Every id is validated against
//   its OWNER at run time, never against a copy: a gate check id must be a key of teaching_gate.mjs CHECKS and be named in that
//   organ's selftest; an audit id must be in teaching_audit.mjs CHECKED_RULES and be named in its selftest; a broken verdict
//   must be one of its type's verdicts in gaffer_brain.mjs VERDICT_TYPES, and the map must place EVERY type (broken or
//   not_an_answer); a classifier kind must be a flag classifyPrompt (study_scope.mjs) returns. A failed id → 2, never green.
// THE DAY. Every clause first requires day.mjs dayProof(D).real (a sitting closed by `end` with reason fulltime and a bound
//   host — sitting_reviews.jsonl, sole writer scripts/sitting.mjs) and reads THAT sitting only. Not real → 2.
// THE READERS (each reads the owners' files READ-ONLY, at the paths the owners export or declare):
//   turns   (c07 c10 c12) teaching_gate.jsonl (sole writer teaching_gate.mjs) rows of the sitting, scope study, and
//           teaching_audit.jsonl (sole writer teaching_audit.mjs) rows of the sitting, scope study, when the clause maps
//           audit ids. A red counts when it SURVIVES: a first-pass block row followed by its second-pass row of the same
//           session counts only through that second row (the patch it asked for was added); every other row's reds count.
//           0 iff ≥ 1 gate row judged the sitting and no surviving red / audit drift names a mapped id; 1 if one does;
//           2 if no turn was judged or a needed log is absent.
//   nonanswer (c13, row 1163 (2)) the bank's capture rows (gaffer_grade_queue.jsonl, sole writer gaffer_brain.mjs) inside
//           the sitting's window, each reply (`spoken`) read by the study classifier classifyPrompt: 1 if one reads as a
//           mapped non-answer kind (question · confusion · system — the classifier's question and complaint readings);
//           2 if the day held no such reply at all (no gate row of the sitting classified one, no capture holds one);
//           0 when such replies came and none was banked as an answer.
//   crack   (c18, row 1163 (3)) every settled verdict of day D whose verdict the map calls broken must have a crack row:
//           a live compiled note of D (compiled_notes.jsonl, sole writer notes_compiler.mjs) for the same concept and axis
//           holding an item kind "crack" stamped with a legal `moment` (teaching_gate MOMENT_KINDS), his words (`words`,
//           equal to the capture's `spoken` after whitespace folding) and one diff (galat and sahi both non-empty).
//           1 on a broken answer without one; 2 if the day had no broken answer, or a broken answer's capture is absent.
//   park    (c28, row 1163 (4)) the turns reader over the map, plus every PARK turn of the sitting (a gate row whose `cls`
//           is a mapped park kind — his system talk) must end on the micro-question handed back in the same turn: the
//           audit row of the same Stop (same session, between the neighbouring gate rows) measures questions ≥ 1. 1 on a
//           park turn with none, or a mapped red; 2 if the sitting held no park turn or its audit row is absent.
//   close   (c32) the turns reader over the map, plus the close half: the LAST gate row of the sitting declaring a banked
//           moment (study_scope BANKED_MOMENTS) must be followed, before the sitting closed, by a capture row (his answer
//           banked). 1 if it is not (he left with that question open).
// CONTRACT
//   · Every plant runs on a COPY under os.tmpdir() (prefix mcap-wit-): <org>/scripts copied once, the map copied (or a
//     planted variant), the owners' state files planted by writeFileSync, and each case run as a CHILD of this file in its
//     clause mode — the real path the receipt runs. Nothing of his state is read by the plants.
//   · F14 A (row 1162 (1)): no organ seam is used; ARSENAL_GATE_STATE_DIR, ARSENAL_AUDIT_STATE_DIR and
//     ARSENAL_SITTING_STATE_DIR are DELETED from this process's env before any organ is imported, and from every child's.
//   · No git repo is planted by this file. Every line is split on \r?\n and a BOM is stripped.
//   · THE PORT CLASS (row 1053): no port is bound, no service named, nothing POSTed, nothing restarted; no network, no model.
//     Every child is spawnSync, so every wait ends with its child; no timeout, budget or size is typed.
//   · BOUND (unit mode): `git diff --name-only <base-org HEAD> <org HEAD>` names only the unit's files; the base-org HEAD must
//     equal ci/mcap/BASE. LAST: no process naming the temp prefix survives (/proc on Linux, `ps` elsewhere, PowerShell on
//     Windows).
//   · plants mode prints one `CLAUSE <id> GREEN|RED · k/n plant(s)` line per clause and ends `PLANTS mcap · k of n plant(s)
//     as expected` (n > 0), exit 0 iff k === n — the contract the suite member of row 1162 (2) reads.
// LAST LINE (unit mode): GREEN MCAP <what> · <n> clause(s) (exit 0) · RED MCAP · <clauses> (exit 1)
// ============================================================================
import { readFileSync, writeFileSync, existsSync, mkdtempSync, mkdirSync, rmSync, readdirSync, cpSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, "..", "..", "..");
const SELF = fileURLToPath(import.meta.url);
export const TMP_PREFIX = "mcap-wit-";
const SEAMS = ["ARSENAL_GATE_STATE_DIR", "ARSENAL_AUDIT_STATE_DIR", "ARSENAL_SITTING_STATE_DIR"];
for (const k of SEAMS) delete process.env[k];
const SHA_RE = /^[0-9a-f]{40}$/;
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
export const CLAUSES = ["c07", "c10", "c12", "c13", "c18", "c28", "c32"];
const CLAUSE_ID = (c) => `C:capability-${c}`;
const READERS = ["turns", "nonanswer", "crack", "park", "close"];
const lines = (t) => String(t || "").replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim());
const fold = (s) => String(s || "").replace(/\s+/g, " ").trim();
// BOUND — the files this unit may differ in (its UNITS row + the brief). The effort receipt is the brief's one exception.
const NAMED = [/^ci\/witness\/mcap\/(witness_capability\.mjs|capability_map\.json)$/, /^ci\/mcap\/(PROOF\.md|LEDGER\.jsonl|BASE|run_mutants_mcap\.mjs)$/,
  /^campaign-2026-09\/receipts_effort\/mcapw_00\.json$/];

const mapPath = (org) => join(org, "ci", "witness", "mcap", "capability_map.json");
const stateOf = (org) => join(org, "dressing-room", "state");
/** A JSONL file: { absent } | { error } | { rows } — an unparseable line makes the whole file unreadable. */
function readJsonl(p) {
  if (!existsSync(p)) return { absent: true };
  let text; try { text = readFileSync(p, "utf8"); } catch (e) { return { error: (e && e.code) || "read failed" }; }
  const rows = [];
  for (const l of lines(text)) { try { rows.push(JSON.parse(l)); } catch { return { error: "an unparseable line" }; } }
  return { rows };
}
async function organ(org, file) {
  try { return await import(pathToFileURL(join(org, "scripts", file)).href); } catch (e) { return { __err: String((e && e.message) || e).split("\n")[0].slice(0, 120) }; }
}
/** The selftest body of an organ's source: every id the map names must be planted there (named by its id). */
function selftestBody(org, file) {
  let t; try { t = readFileSync(join(org, "scripts", file), "utf8"); } catch { return null; }
  const i = t.search(/\n(?:export )?(?:async )?function selftest\s*\(/);
  return i < 0 ? null : t.slice(i);
}
const tsOf = (r) => { const t = Date.parse(String((r && r.ts) || "")); return Number.isFinite(t) ? t : NaN; };
const byTs = (a, b) => tsOf(a) - tsOf(b);

// ── THE MAP, VALIDATED AGAINST ITS OWNERS ─────────────────────────────────────────────────────────────────────────────
async function loadMap(org, c, O) {
  if (!existsSync(mapPath(org))) return { code: 2, why: `UNREAD · no capability map (${"ci/witness/mcap/capability_map.json"})` };
  let m; try { m = JSON.parse(readFileSync(mapPath(org), "utf8").replace(/^﻿/, "")); } catch { return { code: 2, why: "UNREAD · the capability map is unparseable" }; }
  const e = m && m[c];
  if (!e || typeof e !== "object") return { code: 2, why: `UNREAD · the map has no row for ${c}` };
  if (!READERS.includes(e.reader)) return { code: 2, why: `UNREAD · ${c}'s reader "${e.reader}" is not one of ${READERS.join("/")}` };
  const checks = Array.isArray(e.checks) ? e.checks : [], audit = Array.isArray(e.audit) ? e.audit : [];
  if (!O.G.CHECKS || typeof O.G.CHECKS !== "object") return { code: 2, why: `UNREAD · teaching_gate.mjs exports no CHECKS${O.G.__err ? ` (${O.G.__err})` : ""}` };
  const gBody = selftestBody(org, "teaching_gate.mjs"), aBody = selftestBody(org, "teaching_audit.mjs");
  for (const id of checks) {
    if (!Object.prototype.hasOwnProperty.call(O.G.CHECKS, id)) return { code: 2, why: `UNREAD · map id ${id} is not a teaching_gate CHECKS id` };
    if (!gBody || !gBody.includes(`"${id}"`)) return { code: 2, why: `UNREAD · map id ${id} has no planted case in teaching_gate's selftest` };
  }
  if (audit.length && !Array.isArray(O.A.CHECKED_RULES)) return { code: 2, why: `UNREAD · teaching_audit.mjs exports no CHECKED_RULES${O.A.__err ? ` (${O.A.__err})` : ""}` };
  for (const id of audit) {
    if (!O.A.CHECKED_RULES.includes(id)) return { code: 2, why: `UNREAD · map id ${id} is not a teaching_audit CHECKED_RULES id` };
    if (!aBody || !aBody.includes(id)) return { code: 2, why: `UNREAD · map id ${id} has no planted case in teaching_audit's selftest` };
  }
  const flags = typeof O.S.classifyPrompt === "function" ? Object.keys(O.S.classifyPrompt("")).filter((k) => typeof O.S.classifyPrompt("")[k] === "boolean") : [];
  for (const [field, need] of [["nonanswer_kinds", e.reader === "nonanswer"], ["park_cls", e.reader === "park"]]) {
    if (!need) continue;
    const ks = e[field];
    if (!Array.isArray(ks) || !ks.length) return { code: 2, why: `UNREAD · ${c}'s ${field} is empty` };
    for (const k of ks) if (!flags.includes(k)) return { code: 2, why: `UNREAD · ${c}'s ${field} names "${k}", not a classifyPrompt flag (${flags.join("/")})` };
  }
  if (e.reader === "crack") {
    const VT = O.B.VERDICT_TYPES;
    if (!VT || typeof VT !== "object") return { code: 2, why: `UNREAD · gaffer_brain.mjs exports no VERDICT_TYPES${O.B.__err ? ` (${O.B.__err})` : ""}` };
    const broken = e.broken && typeof e.broken === "object" ? e.broken : {}, not = Array.isArray(e.not_an_answer) ? e.not_an_answer : [];
    for (const [t, vs] of Object.entries(broken)) {
      if (!VT[t]) return { code: 2, why: `UNREAD · broken type ${t} is not a VERDICT_TYPES type` };
      if (!Array.isArray(vs) || !vs.length || vs.some((v) => !VT[t].verdicts.includes(v))) return { code: 2, why: `UNREAD · broken verdicts of ${t} are not among its verdicts (${VT[t].verdicts.join("/")})` };
    }
    const unplaced = Object.keys(VT).filter((t) => !(t in broken) && !not.includes(t));
    if (unplaced.length) return { code: 2, why: `UNREAD · the map places no broken verdict for type(s) ${unplaced.join(", ")}` };
    if (typeof O.N.noteState !== "function" || typeof O.N.readRows !== "function") return { code: 2, why: "UNREAD · notes_compiler.mjs exports no noteState/readRows" };
    if (!Array.isArray(O.G.MOMENT_KINDS)) return { code: 2, why: "UNREAD · teaching_gate.mjs exports no MOMENT_KINDS" };
  }
  return { ok: true, e: { ...e, checks, audit } };
}

// ── THE DAY AND ITS SITTING ──────────────────────────────────────────────────────────────────────────────────────────
function sittingOf(org, D, O) {
  if (typeof O.D.dayProof !== "function") return { code: 2, why: `UNREAD · day.mjs exports no dayProof${O.D.__err ? ` (${O.D.__err})` : ""}` };
  let p; try { p = O.D.dayProof(D); } catch (e) { return { code: 2, why: `UNREAD · dayProof threw (${String((e && e.message) || e).slice(0, 80)})` }; }
  if (!p || p.real !== true) return { code: 2, why: `UNREAD · ${D} is not a real day (${(p && p.why) || "no proof"})` };
  const rv = readJsonl(join(stateOf(org), "sitting_reviews.jsonl"));
  const row = (rv.rows || []).filter((r) => r && r.kind === "sitting_review" && r.sitting_id === p.sitting_id).pop() || {};
  const from = Date.parse(String(row.opened_at || "")), to = Date.parse(String(p.closed_at || ""));
  return { ok: true, id: p.sitting_id, from: Number.isFinite(from) ? from : null, to: Number.isFinite(to) ? to : null, D };
}
function gateRowsOf(org, O, sit) {
  const f = readJsonl(typeof O.G.GATE_LOG === "function" ? O.G.GATE_LOG() : join(stateOf(org), "teaching_gate.jsonl"));
  if (!f.rows) return { code: 2, why: `UNREAD · teaching_gate.jsonl ${f.absent ? "absent" : `unreadable (${f.error})`}` };
  return { ok: true, rows: f.rows.filter((r) => r && r.sitting === sit.id && r.scope === "study").sort(byTs) };
}
function auditRowsOf(org, sit) {
  const f = readJsonl(join(stateOf(org), "teaching_audit.jsonl"));
  if (!f.rows) return { code: 2, why: `UNREAD · teaching_audit.jsonl ${f.absent ? "absent" : `unreadable (${f.error})`}` };
  return { ok: true, rows: f.rows.filter((r) => r && r.sitting_id === sit.id && r.scope === "study").sort(byTs) };
}
function queueOf(org) {
  const f = readJsonl(join(stateOf(org), "gaffer_grade_queue.jsonl"));
  if (!f.rows) return { code: 2, why: `UNREAD · gaffer_grade_queue.jsonl ${f.absent ? "absent" : `unreadable (${f.error})`}` };
  return { ok: true, rows: f.rows };
}
const inWindow = (sit) => (r) => { const t = tsOf(r); return sit.from !== null && sit.to !== null ? t >= sit.from && t <= sit.to : String(r.day || "") === sit.D; };
/** The reds that SURVIVED: a first-pass block followed by its second pass counts only through the second pass. */
export function survivingReds(rows) {
  const out = [];
  rows.forEach((r, i) => {
    if (r.decision === "block" && !r.second_pass && rows.slice(i + 1).some((x) => x.session === r.session && x.second_pass)) return;
    for (const id of Array.isArray(r.reds) ? r.reds : []) out.push(id);
  });
  return out;
}

// ── THE READERS ──────────────────────────────────────────────────────────────────────────────────────────────────────
function turnsVerdict(org, sit, e, O) {
  const g = gateRowsOf(org, O, sit); if (!g.ok) return g;
  if (!g.rows.length) return { code: 2, why: `UNREAD · no teacher turn of sitting ${sit.id} was judged by the gate` };
  const reds = survivingReds(g.rows).filter((id) => e.checks.includes(id));
  let drifts = [];
  if (e.audit.length) {
    const a = auditRowsOf(org, sit); if (!a.ok) return a;
    drifts = a.rows.flatMap((r) => (Array.isArray(r.drifts) ? r.drifts : [])).filter((id) => e.audit.includes(id));
  }
  if (reds.length || drifts.length) return { code: 1, why: `RED · ${reds.length + drifts.length} surviving red(s) of mapped ids: ${[...new Set([...reds, ...drifts])].join(", ")}`, g };
  return { code: 0, why: `${g.rows.length} judged turn(s), no surviving red of ${[...e.checks, ...e.audit].join(", ") || "(no id)"}`, g };
}
function nonanswerVerdict(org, sit, e, O) {
  const g = gateRowsOf(org, O, sit); if (!g.ok) return g;
  const q = queueOf(org); if (!q.ok) return q;
  const caps = q.rows.filter((r) => r && r.kind === "capture").filter(inWindow(sit));
  const banked = caps.filter((r) => e.nonanswer_kinds.includes(O.S.classifyPrompt(String(r.spoken || "")).kind));
  if (banked.length) return { code: 1, why: `RED · ${banked.length} rep row(s) of sitting ${sit.id} hold a reply the classifier reads as ${[...new Set(banked.map((r) => O.S.classifyPrompt(String(r.spoken || "")).kind))].join("/")}` };
  const seen = g.rows.filter((r) => e.nonanswer_kinds.includes(r.cls)).length;
  if (!seen) return { code: 2, why: `UNREAD · sitting ${sit.id} held no reply the classifier reads as ${e.nonanswer_kinds.join("/")}` };
  return { code: 0, why: `${seen} non-answer repl(ies) in sitting ${sit.id}, none banked as an answer (${caps.length} rep row(s) read)` };
}
function crackVerdict(org, sit, e, O) {
  const q = queueOf(org); if (!q.ok) return q;
  const nl = readJsonl(O.N.LEDGER || join(stateOf(org), "compiled_notes.jsonl"));
  if (!nl.rows) return { code: 2, why: `UNREAD · compiled_notes.jsonl ${nl.absent ? "absent" : `unreadable (${nl.error})`}` };
  const broken = q.rows.filter((r) => r && r.kind === "settled" && r.day === sit.D && Array.isArray(e.broken[r.type]) && e.broken[r.type].includes(r.verdict));
  if (!broken.length) return { code: 2, why: `UNREAD · no answer of ${sit.D} was judged broken` };
  const caps = new Map(q.rows.filter((r) => r && r.kind === "capture").map((r) => [r.id, r]));
  const live = O.N.noteState(nl.rows).live.filter((r) => O.N.noteDay(r) === sit.D);
  const axisOf = (r) => r.axis || (String(r.ref || "").includes(":") ? String(r.ref).split(":").pop() : null);
  const missing = [];
  for (const b of broken) {
    const cap = caps.get(b.of);
    if (!cap || typeof cap.spoken !== "string") return { code: 2, why: `UNREAD · the capture of broken answer ${b.type}:${b.ref} is absent (his words cannot be read)` };
    const ok = live.some((n) => n.concept === b.concept && n.axis === axisOf(b) && Array.isArray(n.note && n.note.items) && n.note.items.some((it) => it && it.kind === "crack"
      && O.G.MOMENT_KINDS.includes(it.moment) && typeof it.words === "string" && fold(it.words) === fold(cap.spoken)
      && Array.isArray(it.galat) && it.galat.length > 0 && Array.isArray(it.sahi) && it.sahi.length > 0));
    if (!ok) missing.push(`${b.type}:${b.ref}`);
  }
  if (missing.length) return { code: 1, why: `RED · ${missing.length} of ${broken.length} broken answer(s) without a crack row (concept · axis · moment · his words · one diff): ${missing.join(", ")}` };
  return { code: 0, why: `${broken.length} broken answer(s) of ${sit.D}, each with its crack row` };
}
function parkVerdict(org, sit, e, O) {
  const t = turnsVerdict(org, sit, e, O); if (t.code === 2) return t;
  const a = auditRowsOf(org, sit); if (!a.ok) return a;
  const g = t.g.rows, parks = g.filter((r) => e.park_cls.includes(r.cls));
  if (t.code === 1) return t;
  if (!parks.length) return { code: 2, why: `UNREAD · sitting ${sit.id} held no park turn (no gate row classified ${e.park_cls.join("/")})` };
  for (const p of parks) {
    const same = g.filter((r) => r.session === p.session), i = same.indexOf(p);
    const lo = i > 0 ? tsOf(same[i - 1]) : -Infinity, hi = i < same.length - 1 ? tsOf(same[i + 1]) : Infinity;
    const cand = a.rows.filter((r) => r.session_id === p.session && tsOf(r) > lo && tsOf(r) < hi).sort((x, y) => Math.abs(tsOf(x) - tsOf(p)) - Math.abs(tsOf(y) - tsOf(p)));
    if (!cand.length) return { code: 2, why: `UNREAD · the park turn at ${p.ts} has no audit row of its Stop` };
    const qn = cand[0].measured && cand[0].measured.questions;
    if (!Number.isInteger(qn)) return { code: 2, why: `UNREAD · the park turn at ${p.ts}: its audit row measures no questions count` };
    if (qn < 1) return { code: 1, why: `RED · the park turn at ${p.ts} ends on no micro-question (questions ${qn})` };
  }
  return { code: 0, why: `${parks.length} park turn(s), each handing the micro-question back; ${t.why}` };
}
function closeVerdict(org, sit, e, O) {
  const t = turnsVerdict(org, sit, e, O); if (t.code !== 0) return t;
  const q = queueOf(org); if (!q.ok) return q;
  if (!Array.isArray(O.S.BANKED_MOMENTS)) return { code: 2, why: "UNREAD · study_scope.mjs exports no BANKED_MOMENTS" };
  const momentsOf = (r) => (Array.isArray(r.moment) ? r.moment : r.moment ? [r.moment] : []);
  const last = t.g.rows.filter((r) => momentsOf(r).some((m) => O.S.BANKED_MOMENTS.includes(m))).pop();
  if (!last) return { code: 0, why: `${t.why}; no banked moment was opened, so none was left open at close` };
  const answered = q.rows.some((r) => r && r.kind === "capture" && tsOf(r) > tsOf(last) && (sit.to === null || tsOf(r) <= sit.to));
  if (!answered) return { code: 1, why: `RED · the ${momentsOf(last).join("/")} opened at ${last.ts} was never banked before the sitting closed` };
  return { code: 0, why: `${t.why}; the last banked moment (${last.ts}) was answered and banked before the close` };
}
const READ = { turns: turnsVerdict, nonanswer: nonanswerVerdict, crack: crackVerdict, park: parkVerdict, close: closeVerdict };

export async function clause(c, { org = REPO, day = null } = {}) {
  if (!CLAUSES.includes(c)) return { code: 2, why: `UNREAD · ${c} is not one of ${CLAUSES.join(" ")}` };
  if (!DAY_RE.test(String(day || ""))) return { code: 2, why: "UNREAD · --day <YYYY-MM-DD> is required" };
  const O = { G: await organ(org, "teaching_gate.mjs"), A: await organ(org, "teaching_audit.mjs"), S: await organ(org, "study_scope.mjs"),
    D: await organ(org, "day.mjs"), B: await organ(org, "gaffer_brain.mjs"), N: await organ(org, "notes_compiler.mjs") };
  if (typeof O.S.classifyPrompt !== "function") return { code: 2, why: `UNREAD · study_scope.mjs exports no classifyPrompt${O.S.__err ? ` (${O.S.__err})` : ""}` };
  const m = await loadMap(org, c, O); if (!m.ok) return m;
  const sit = sittingOf(org, day, O); if (!sit.ok) return sit;
  const r = READ[m.e.reader](org, sit, m.e, O);
  return { code: r.code, why: r.why };
}

// ── THE PLANTS — every one on a copy under os.tmpdir() ──────────────────────────────────────────────────────────────
const PD = "2026-11-10", OPEN = "2026-11-10T08:00:00.000Z", CLOSE = "2026-11-10T12:00:00.000Z", SIT = "sit-plant", HOST = "host-plant";
const at = (m) => new Date(Date.parse(OPEN) + m * 60000).toISOString();
const review = (o = {}) => ({ kind: "sitting_review", sitting_id: SIT, opened_at: OPEN, closed_at: CLOSE, reason: "fulltime", host_session_id: HOST, ...o });
const gate = (m, o = {}) => ({ ts: at(m), session: HOST, sitting: SIT, decision: "allow", scope: "study", reds: [], cls: "answer", moment: null, second_pass: false, surviving: false, ...o });
const audit = (m, o = {}) => ({ ts: at(m), session_id: HOST, scope: "study", sitting_id: SIT, drifts: [], measured: { questions: 1 }, ...o });
const capture = (m, spoken, o = {}) => ({ v: 2, kind: "capture", id: `voice_rep:tokenization:a:${at(m)}`, ts: at(m), day: PD, type: "voice_rep", ref: "tokenization:a", concept: "tokenization", axis: "a", gut: "knew", spoken, ...o });
const settled = (cap, verdict, o = {}) => ({ v: 2, kind: "settled", of: cap.id, ts: CLOSE, day: PD, type: cap.type, ref: cap.ref, concept: cap.concept, gut: cap.gut, verdict, axis: cap.axis, ...o });
const note = (items, o = {}) => ({ v: 1, kind: "compiled", id: `n-${Math.random().toString(36).slice(2, 10)}`, ts: CLOSE, day: PD, concept: "tokenization", axis: "a", compiler: "plant", sources: ["rid-1"], note: { items }, content_sha: "x", ...o });
const crackItem = (words, o = {}) => ({ mark: "T", kind: "crack", at: at(30), rid: "rid-1", moment: "jirah", words, galat: ["ek word = ek token"], sahi: ["token + ization"], ...o });
const WORDS = "pakka - har word ek token hota hai";
// THE RULED IDS — the per-id plants are pinned to the RULING, never to the map they judge (a plant derived from the map
// could not catch a map that narrowed): the spec's proposed maps (ci/mwit/MWIT_SPEC.md @ 88bf69d, sections c07 c10 c12 c32)
// as built by row 1163 (7), and c28's "the proposed map" of row 1163 (4). The map may name MORE ids (a gate only gets
// stricter); a map that drops a ruled id turns its plant RED until the ruling moves too.
const RULED = Object.freeze({
  c07: { checks: ["A.one-question", "A.new-terms", "A.position"], audit: ["one-idea", "act-mt2kgn09"] },
  c10: { checks: ["A.count-form", "A.position"], audit: ["terminology"] },
  c12: { checks: ["A.gut-trio", "A.gut-by-moment", "B.bank"], audit: [] },
  c28: { checks: ["A.buying"], audit: ["no-system-mid-concept"] },
  c32: { checks: ["B.bank", "B.judge-once"], audit: [] },
});

function plantCase(R, mapObj, st) {
  const S = join(R, "dressing-room", "state");
  rmSync(S, { recursive: true, force: true }); mkdirSync(S, { recursive: true });
  const put = (name, rows) => { if (rows) writeFileSync(join(S, name), rows.map((r) => JSON.stringify(r)).join("\n") + (rows.length ? "\n" : "")); };
  put("sitting_reviews.jsonl", st.reviews === undefined ? [review()] : st.reviews);
  put("teaching_gate.jsonl", st.gate);
  put("teaching_audit.jsonl", st.audit);
  put("gaffer_grade_queue.jsonl", st.queue);
  put("compiled_notes.jsonl", st.notes);
  const mp = mapPath(R);
  rmSync(mp, { force: true });
  if (mapObj) { mkdirSync(dirname(mp), { recursive: true }); writeFileSync(mp, JSON.stringify(mapObj, null, 2) + "\n"); }
}
function runChild(R, c, day = PD) {
  const env = { ...process.env }; for (const k of SEAMS) delete env[k];
  const r = spawnSync(process.execPath, [SELF, c, "--day", day, "--org", R], { encoding: "utf8", env, windowsHide: true });
  return { code: r.status, last: lines(r.stdout).pop() || lines(r.stderr).pop() || "" };
}
/** Every plant of every clause, on a copy of <org>. Returns { <cNN>: [{ name, want, got, ok }] }. */
export function plantsFor(org) {
  const out = Object.fromEntries(CLAUSES.map((c) => [c, []]));
  const T = mkdtempSync(join(tmpdir(), TMP_PREFIX));
  try {
    const R = join(T, "org");
    mkdirSync(R, { recursive: true });
    if (!existsSync(join(org, "scripts"))) { for (const c of CLAUSES) out[c].push({ name: "the org has a scripts/ tree", want: 0, got: "absent", ok: false }); return out; }
    cpSync(join(org, "scripts"), join(R, "scripts"), { recursive: true });
    let base = null; try { base = JSON.parse(readFileSync(mapPath(org), "utf8").replace(/^﻿/, "")); } catch { base = null; }
    const clone = () => (base ? JSON.parse(JSON.stringify(base)) : null);
    const o = (c, name, want, st, mapObj = clone()) => { plantCase(R, mapObj, st); const r = runChild(R, c, st.day); out[c].push({ name, want, got: `exit ${r.code} · ${r.last}`, ok: r.code === want }); };
    const idsOf = (c) => RULED[c];

    // the TURNS clauses (c07 c10 c12) and the turns half of c28 / c32
    for (const c of ["c07", "c10", "c12", "c28", "c32"]) {
      const { checks = [], audit: aud = [] } = idsOf(c);
      const parkOk = c === "c28" ? [gate(40, { cls: "system" })] : [];
      const parkAud = c === "c28" ? [audit(40, { measured: { questions: 1 } })] : [];
      const clean = { gate: [gate(10), gate(20), gate(30), ...parkOk], audit: [audit(10), audit(20), audit(30), ...parkAud], queue: [] };
      o(c, "a real day, three judged turns, no red → 0", 0, clean);
      for (const id of checks) o(c, `one surviving red of mapped check ${id} → 1`, 1, { ...clean, gate: [gate(10), gate(20, { reds: [id] }), gate(30), ...parkOk] });
      for (const id of aud) o(c, `one audit drift of mapped rule ${id} → 1`, 1, { ...clean, audit: [audit(10), audit(20, { drifts: [id] }), audit(30), ...parkAud] });
      if (checks.length) o(c, `a blocked red of ${checks[0]} cured by its second pass → 0`, 0, { ...clean, gate: [gate(10), gate(20, { decision: "block", reds: [checks[0]] }), gate(21, { second_pass: true, surviving: true, reds: [] }), gate(30), ...parkOk] });
      o(c, "a red of an UNmapped check only → 0", 0, { ...clean, gate: [gate(10), gate(20, { reds: ["A.emoji"] }), gate(30), ...parkOk] });
      o(c, "zero judged turns in the sitting → 2", 2, { ...clean, gate: [gate(10, { sitting: "another" })] });
      o(c, "the day closed by a rollover, not by end → 2", 2, { ...clean, reviews: [review({ reason: "rollover" })] });
      o(c, "no gate log → 2", 2, { ...clean, gate: undefined });
      const bad = clone(); if (bad && bad[c]) bad[c].checks = [...(bad[c].checks || []), "A.not-a-check"];
      o(c, "a map id absent from CHECKS → 2", 2, clean, bad);
      o(c, "no capability map → 2", 2, clean, null);
      if (c === "c28") {
        o(c, "the park turn hands back no micro-question → 1", 1, { ...clean, audit: [audit(10), audit(20), audit(30), audit(40, { measured: { questions: 0 } })] });
        o(c, "no park turn in the sitting → 2", 2, { ...clean, gate: [gate(10), gate(20), gate(30)] });
        o(c, "the park turn has no audit row of its Stop → 2", 2, { ...clean, audit: [audit(10), audit(20), audit(30)] });
      }
      if (c === "c32") {
        const asked = gate(30, { moment: "jirah" });
        o(c, "the last jirah answered and banked before the close → 0", 0, { ...clean, gate: [gate(10), gate(20), asked], queue: [capture(35, WORDS)] });
        o(c, "the last jirah never banked: he left with it open → 1", 1, { ...clean, gate: [gate(10), gate(20), asked], queue: [capture(5, WORDS)] });
        o(c, "the jirah banked only after the sitting closed → 1", 1, { ...clean, gate: [gate(10), gate(20), asked], queue: [capture(60 * 5, WORDS)] });
      }
    }
    // c13 — row 1163 (2)
    {
      const c = "c13", g = [gate(10, { cls: "question" }), gate(20), gate(30)];
      o(c, "a non-answer reply came, every rep row is an answer → 0", 0, { gate: g, queue: [capture(25, WORDS)] });
      o(c, "a rep row holds a reply the classifier reads as a question → 1", 1, { gate: g, queue: [capture(25, "yeh merge kyun hota hai?")] });
      o(c, "a rep row holds his complaint (samajh nahi aaya) → 1", 1, { gate: g, queue: [capture(25, "samajh nahi aaya")] });
      o(c, "a question banked OUTSIDE the sitting's window does not count → 0", 0, { gate: g, queue: [capture(-60, "yeh merge kyun hota hai?"), capture(25, WORDS)] });
      o(c, "a day with no such reply at all → 2", 2, { gate: [gate(10), gate(20)], queue: [capture(25, WORDS)] });
      o(c, "not a real day → 2", 2, { reviews: [review({ host_session_id: null })], gate: g, queue: [] });
      o(c, "no rep ledger → 2", 2, { gate: g, queue: undefined });
      const bad = clone(); if (bad && bad[c]) bad[c].nonanswer_kinds = ["complaint"];
      o(c, "a kind the classifier does not return → 2", 2, { gate: g, queue: [] }, bad);
      o(c, "no capability map → 2", 2, { gate: g, queue: [] }, null);
    }
    // c18 — row 1163 (3)
    {
      const c = "c18", cap = capture(25, WORDS), broke = settled(cap, "missed");
      o(c, "a broken answer with its crack row → 0", 0, { queue: [cap, broke], notes: [note([crackItem(WORDS)])] });
      o(c, "a broken answer without a crack row → 1", 1, { queue: [cap, broke], notes: [note([])] });
      o(c, "the crack row carries no moment → 1", 1, { queue: [cap, broke], notes: [note([crackItem(WORDS, { moment: undefined })])] });
      o(c, "the crack row holds words that are not his → 1", 1, { queue: [cap, broke], notes: [note([crackItem("teacher ne kaha ek word ek token")])] });
      o(c, "the crack row carries no diff (sahi empty) → 1", 1, { queue: [cap, broke], notes: [note([crackItem(WORDS, { sahi: [] })])] });
      o(c, "the crack row is of another axis → 1", 1, { queue: [cap, broke], notes: [note([crackItem(WORDS)], { axis: "b" })] });
      o(c, "no answer of the day judged broken → 2", 2, { queue: [cap, settled(cap, "landed")], notes: [note([])] });
      o(c, "the broken answer's capture is absent → 2", 2, { queue: [broke], notes: [note([crackItem(WORDS)])] });
      const bad = clone(); if (bad && bad[c] && bad[c].broken) delete bad[c].broken.voice_rep;
      o(c, "the map places no broken verdict for a type → 2", 2, { queue: [cap, broke], notes: [note([crackItem(WORDS)])] }, bad);
      o(c, "no capability map → 2", 2, { queue: [cap, broke], notes: [note([crackItem(WORDS)])] }, null);
    }
  } catch (e) {
    for (const c of CLAUSES) out[c].push({ name: "the plants ran to their end", want: 0, got: String((e && e.message) || e).slice(0, 160), ok: false });
  } finally { rmSync(T, { recursive: true, force: true }); }
  return out;
}
const clauseOk = (ps) => ps.length > 0 && ps.every((p) => p.ok);

// ── LAST — no process naming the temp prefix survives ───────────────────────────────────────────────────────────────
function survivors() {
  let cmds = [];
  if (process.platform === "linux") {
    for (const pid of readdirSync("/proc").filter((x) => /^\d+$/.test(x) && Number(x) !== process.pid)) {
      try { cmds.push(readFileSync(`/proc/${pid}/cmdline`, "utf8").replace(/\0/g, " ")); } catch { /* the process ended while read */ }
    }
  } else if (process.platform === "win32") {
    const r = spawnSync("powershell", ["-NoProfile", "-Command", `Get-CimInstance Win32_Process | Where-Object { $_.ProcessId -ne ${process.pid} } | ForEach-Object { $_.CommandLine }`], { encoding: "utf8", windowsHide: true });
    cmds = lines(r.stdout);
  } else {
    cmds = lines(spawnSync("ps", ["-axww", "-o", "pid=,command="], { encoding: "utf8" }).stdout).filter((l) => Number(l.trim().split(/\s+/)[0]) !== process.pid);
  }
  return cmds.filter((c) => c.includes(TMP_PREFIX));
}
function bound(org, baseOrg) {
  if (!baseOrg) return { ok: false, why: "no --base-org: BOUND cannot be read" };
  const g = (cwd, args) => spawnSync("git", args, { cwd, encoding: "utf8", windowsHide: true });
  const bh = String(g(baseOrg, ["rev-parse", "HEAD"]).stdout || "").trim();
  const want = existsSync(join(org, "ci", "mcap", "BASE")) ? lines(readFileSync(join(org, "ci", "mcap", "BASE"), "utf8"))[0] : null;
  if (!SHA_RE.test(bh)) return { ok: false, why: "the base-org HEAD is unreadable" };
  if (!want) return { ok: false, why: "ci/mcap/BASE is absent in the org" };
  if (bh !== want) return { ok: false, why: `the base-org HEAD ${bh.slice(0, 12)} is not ci/mcap/BASE ${String(want).slice(0, 12)}` };
  const d = g(org, ["diff", "--name-only", bh, "HEAD"]);
  if (d.status !== 0) return { ok: false, why: `git diff against ${bh.slice(0, 12)} failed in the org` };
  const names = lines(d.stdout);
  const extra = names.filter((n) => !NAMED.some((re) => re.test(n)));
  return extra.length ? { ok: false, why: `files beyond the unit's: ${extra.join(", ")}` } : { ok: true, why: `${names.length} file(s), every one named` };
}

async function main() {
  const a = process.argv.slice(2);
  const opt = (k) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : null; };
  const org = opt("--org") ? resolve(opt("--org")) : REPO;
  const mode = a[0] && !a[0].startsWith("--") ? a[0] : "unit";
  if (CLAUSES.includes(mode)) {
    const r = await clause(mode, { org, day: opt("--day") });
    console.log(`MCAP ${CLAUSE_ID(mode)} · ${r.why}`);
    return r.code;
  }
  if (mode === "plants") {
    const P = plantsFor(org);
    let k = 0, n = 0;
    for (const c of CLAUSES) {
      for (const p of P[c]) { n++; if (p.ok) k++; console.log(`  ${p.ok ? "ok  " : "FAIL"} ${CLAUSE_ID(c)} · ${p.name}${p.ok ? "" : `\n         got ${p.got}`}`); }
      console.log(`CLAUSE ${CLAUSE_ID(c)} ${clauseOk(P[c]) ? "GREEN" : "RED"} · ${P[c].filter((p) => p.ok).length}/${P[c].length} plant(s)`);
    }
    const left = survivors();
    if (left.length) console.log(`LAST RED · ${left.length} process(es) name the temp prefix`);
    console.log(`PLANTS mcap · ${k} of ${n} plant(s) as expected`);
    return k === n && n > 0 && !left.length ? 0 : 1;
  }
  if (mode !== "unit") { console.log("witness_capability.mjs <c07|c10|c12|c13|c18|c28|c32> --day D [--org <dir>] · plants [--org <dir>] · --org <dir> --base-org <dir>"); return 2; }
  const baseOrg = opt("--base-org") ? resolve(opt("--base-org")) : null;
  const B = baseOrg ? plantsFor(baseOrg) : null;
  const O = plantsFor(org);
  const red = [];
  for (const c of CLAUSES) {
    const onBase = B ? !clauseOk(B[c]) : false, onBuild = clauseOk(O[c]);
    const fb = B ? B[c].filter((p) => !p.ok).map((p) => p.name) : [];
    console.log(`  ${CLAUSE_ID(c)} · base ${B ? (onBase ? "RED" : "GREEN") : "UNREAD"}${fb.length ? ` (${fb.length} plant(s) fail: ${fb[0]}…)` : ""} · build ${onBuild ? "GREEN" : "RED"} (${O[c].filter((p) => p.ok).length}/${O[c].length})`);
    for (const p of O[c].filter((x) => !x.ok)) console.log(`      build FAIL ${p.name} — got ${p.got}`);
    if (!(onBase && onBuild)) red.push(CLAUSE_ID(c));
  }
  const bd = bound(org, baseOrg);
  console.log(`  BOUND · ${bd.ok ? "GREEN" : "RED"} · ${bd.why}`);
  if (!bd.ok) red.push("BOUND");
  const left = survivors();
  console.log(`  LAST · ${left.length ? `RED · ${left.length} process(es) name ${TMP_PREFIX}` : "GREEN · no process names the temp prefix"}`);
  if (left.length) red.push("LAST");
  if (red.length) { console.log(`RED MCAP · ${red.join(", ")}`); return 1; }
  console.log(`GREEN MCAP capability map + witness (c07 c10 c12 c13 c18 c28 c32), RED on base and GREEN on build · ${CLAUSES.length} clause(s)`);
  return 0;
}
if (process.argv[1] && resolve(process.argv[1]) === SELF) process.exitCode = await main();
