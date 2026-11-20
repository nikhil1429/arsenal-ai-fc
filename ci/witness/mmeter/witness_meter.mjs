#!/usr/bin/env node
// ============================================================================
// ci/witness/mmeter/witness_meter.mjs — UNIT mmeter · THE METER'S TWO CLAUSES (spec ci/mwit/MWIT_SPEC.md @ 88bf69d,
//   A:day-11 + A:old-day-red; rulings forks rows 1162 (1)(2)(5) / 1163 — where the spec and the ruling differ, the ruling wins)
// ----------------------------------------------------------------------------
// THE EXIT LAW (spec §0): 0 the clause HOLDS · 1 RED, read and it does not hold · 2 UNREAD, a fact it needs is absent.
// USAGE
//   node ci/witness/mmeter/witness_meter.mjs day11  [--meter <file>] [--org <dir>]   the clause witness (the receipt's form)
//   node ci/witness/mmeter/witness_meter.mjs oldday [--meter <file>] [--org <dir>]   the clause witness (the receipt's form)
//   node ci/witness/mmeter/witness_meter.mjs plants [--org <dir>]                    every plant, this tree only (suite member)
//   node ci/witness/mmeter/witness_meter.mjs --org <dir> --base-org <dir>            the UNIT witness: RED on base, GREEN on build
// THE CLAUSES
//   A:day-11   READ-ONLY. The meter ledger (dressing-room/state/daily_green.jsonl, sole writer scripts/daily_green.mjs) read
//              through the owner's exported latestByDate: the LATEST date's LATEST row. 0 iff greens === 11 AND study === true
//              AND 11 clauses every one GREEN (F12 A: N-A is not G); 1 below; 2 when the ledger is absent or unreadable, or
//              the row lacks a field, or the org exports no latestByDate. It never writes, so the receipt's meter-equal check
//              holds across its run. Its plants also hold the OWNER's strict exit (F1 A): the org's real meter CLI on a
//              planted 5/11 study day exits 3, on a planted 11/11 study day 0, the line unchanged (ci/witness/mmeter/plant_day.mjs).
//   A:old-day-red  READ-ONLY. The old recorded day (done.mjs OLD_RECORDED_DAY) read through done.mjs's exported oldDayRed
//              (one read path, never a copy). F5 A now: its LAST row reads green === false. F2 A (the honest red): the meter's
//              LATEST row is of a LATER date and carries `code_sha` (the build stamps it) — the old day still reads red
//              AFTER the stamping code ran; with no stamped later row it is UNREAD (2), which is the cut. F5 B, once rows carry
//              the code sha: an old-day row stamped with the SAME code_sha as the latest row was re-read by today's code,
//              not the old code — UNREAD (2). 1 only when the old day reads green; 2 when the row is absent, its green is not
//              a boolean, the meter is unreadable, or the org exports no oldDayRed.
// CONTRACT
//   · Every plant runs on a COPY under os.tmpdir() (prefix mmeter-wit-): the meter CLI on a copy of <org>/scripts (plant_day),
//     the readers over planted ledgers written by this file. Nothing of his state is read but the TRACKED registry.json (by
//     the planter) and, in day11/oldday without --meter, the tracked meter itself — and of it only a date and a count print.
//   · Git repos are planted only by plant_day.mjs, with core.autocrlf=false at init. Every line is split on \r?\n.
//   · THE PORT CLASS (row 1053): no port is bound, no service named, nothing POSTed, nothing restarted; no network, no model.
//     Every child is spawnSync, so every wait ends with its child; no timeout, budget or size is typed.
//   · BOUND (unit mode): `git diff --name-only <base-org HEAD> <org HEAD>` names only the unit's files; the base-org HEAD is
//     ci/mmeter/BASE. LAST: no process naming the temp prefix survives (/proc on Linux, `ps` elsewhere, PowerShell on Windows).
//   · plants mode prints one `CLAUSE <id> GREEN|RED · k/n plant(s)` line per clause and ends `PLANTS mmeter · k of n
//     plant(s) as expected` (n > 0), exit 0 iff k === n — the contract the suite member of row 1162 (2) reads.
// LAST LINE (unit mode): GREEN MMETER <what> · <n> clause(s) (exit 0) · RED MMETER · <clauses> (exit 1)
// ============================================================================
import { readFileSync, writeFileSync, existsSync, mkdtempSync, rmSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { plantDay, REPO, TMP_PREFIX } from "./plant_day.mjs";

const SHA_RE = /^[0-9a-f]{40}$/;
const lines = (t) => String(t || "").split(/\r?\n/).filter((l) => l.trim());
const CLAUSE_IDS = ["A:day-11", "A:old-day-red"];
// BOUND — the files this unit may differ in (its UNITS row + the brief). The effort receipt is the brief's one exception.
const NAMED = [/^scripts\/daily_green\.mjs$/, /^scripts\/done\.mjs$/, /^scripts\/organism_test\.mjs$/, /^ci\/witness\/mmeter\/(witness_meter|plant_day)\.mjs$/,
  /^ci\/mmeter\/(PROOF\.md|LEDGER\.jsonl|BASE|run_mutants_mmeter\.mjs)$/, /^campaign-2026-09\/receipts_effort\/mmeter_00\.json$/];

async function organOf(org, file) {
  try { return await import(pathToFileURL(join(org, "scripts", file)).href); } catch (e) { return { __err: String(e && e.message || e).split("\n")[0].slice(0, 120) }; }
}
/** The meter ledger: { absent } | { error } | { rows } — an unparseable line makes the whole ledger unreadable. */
function readMeter(p) {
  if (!existsSync(p)) return { absent: true };
  let text; try { text = readFileSync(p, "utf8").replace(/^﻿/, ""); } catch (e) { return { error: e && e.code ? e.code : "read failed" }; }
  const rows = [];
  for (const l of lines(text)) { try { rows.push(JSON.parse(l)); } catch { return { error: "an unparseable line" }; } }
  return { rows };
}
const meterOf = (org, meter) => meter || join(org, "dressing-room", "state", "daily_green.jsonl");

// ── A:day-11 ──────────────────────────────────────────────────────────────────────────────────────────────────────────
export async function day11({ org = REPO, meter = null } = {}) {
  const DG = await organOf(org, "daily_green.mjs");
  if (typeof DG.latestByDate !== "function") return { code: 2, why: `UNREAD · daily_green.mjs exports no latestByDate${DG.__err ? ` (${DG.__err})` : ""}` };
  const m = readMeter(meterOf(org, meter));
  if (m.absent) return { code: 2, why: "UNREAD · the meter ledger is absent" };
  if (m.error) return { code: 2, why: `UNREAD · the meter ledger is unreadable (${m.error})` };
  const by = DG.latestByDate(m.rows);
  const latest = [...by.keys()].sort().pop();
  if (!latest) return { code: 2, why: "UNREAD · the meter holds no dated row" };
  const row = by.get(latest);
  if (typeof row.greens !== "number" || !Array.isArray(row.clauses) || typeof row.study !== "boolean") return { code: 2, why: `UNREAD · the ${latest} row lacks greens/clauses/study` };
  const ok = row.greens === 11 && row.study === true && row.clauses.length === 11 && row.clauses.every((c) => c && c.status === "GREEN");
  return ok ? { code: 0, why: `HOLDS · the latest meter row ${latest} reads 11/11 on a study day` }
    : { code: 1, why: `RED · the latest meter row ${latest} reads ${row.greens}/11${row.study ? "" : " (not a study day)"}` };
}

// ── A:old-day-red ─────────────────────────────────────────────────────────────────────────────────────────────────────
export async function oldday({ org = REPO, meter = null } = {}) {
  const D = await organOf(org, "done.mjs");
  if (typeof D.oldDayRed !== "function" || typeof D.OLD_RECORDED_DAY !== "string") return { code: 2, why: `UNREAD · done.mjs exports no oldDayRed${D.__err ? ` (${D.__err})` : ""}` };
  const DG = await organOf(org, "daily_green.mjs");
  if (typeof DG.latestByDate !== "function") return { code: 2, why: `UNREAD · daily_green.mjs exports no latestByDate${DG.__err ? ` (${DG.__err})` : ""}` };
  const OLD = D.OLD_RECORDED_DAY, p = meterOf(org, meter);
  const m = readMeter(p);
  if (m.absent) return { code: 2, why: "UNREAD · the meter ledger is absent" };
  if (m.error) return { code: 2, why: `UNREAD · the meter ledger is unreadable (${m.error})` };
  const v = D.oldDayRed(p);
  const last = m.rows.filter((r) => r && r.date === OLD).pop();
  if (!last) return { code: 2, why: `UNREAD · the meter holds no ${OLD} row` };
  if (!v.ok) return last.green === true ? { code: 1, why: `RED · ${OLD} reads GREEN now` } : { code: 2, why: `UNREAD · the ${OLD} row's green is not a verdict (${v.why})` };
  const by = DG.latestByDate(m.rows);
  const latest = [...by.keys()].sort().pop();
  const L = by.get(latest);
  if (!(latest > OLD) || !SHA_RE.test(String(L && L.code_sha))) return { code: 2, why: `UNREAD · ${OLD} reads red, but no later meter row carries code_sha (the stamping code has not run — F2 A)` };
  if (last.code_sha && last.code_sha === L.code_sha) return { code: 2, why: `UNREAD · the ${OLD} row carries today's code_sha: it was re-read by the new code, not the old (F5 B)` };
  return { code: 0, why: `HOLDS · ${OLD} still reads RED · the latest row ${latest} was written by code ${L.code_sha.slice(0, 12)}` };
}

// ── THE PLANTS — every one on a copy under os.tmpdir() ──────────────────────────────────────────────────────────────
async function plantsFor(org) {
  const T = mkdtempSync(join(tmpdir(), TMP_PREFIX + "plants-"));
  const out = { "A:day-11": [], "A:old-day-red": [] };
  const put = (id, name, ok, got) => out[id].push({ name, ok: !!ok, got });
  let k = 0;
  const meter = (rows, raw = null) => { const p = join(T, `meter${++k}.jsonl`); writeFileSync(p, raw !== null ? raw : rows.map((r) => JSON.stringify(r)).join("\n") + "\n"); return p; };
  try {
    // A:day-11 — the owner's strict exit (F1 A) on the org's real meter CLI
    const five = await plantDay({ org, want: 5 });
    put("A:day-11", "the meter CLI on a planted 5/11 study day exits 3, its line `DAILY GREEN <D> IST · 5/11 ·`", five.n === 5 && five.exit === 3 && /^DAILY GREEN \d{4}-\d{2}-\d{2} IST · 5\/11 · /.test(five.line), `n ${five.n} exit ${five.exit}`);
    const full = await plantDay({ org, want: 11 });
    const R = full.rows[full.rows.length - 1] || {};
    put("A:day-11", "the meter CLI on a planted 11/11 study day exits 0, its line `DAILY GREEN <D> IST · 11/11 ·`", full.n === 11 && full.exit === 0 && R.greens === 11, `n ${full.n} exit ${full.exit}`);
    // A:day-11 — the read-only witness over planted ledgers
    const six = { ...R, date: "2026-11-01", greens: 6, green: false, clauses: (R.clauses || []).map((c, i) => (i < 5 ? c : { ...c, status: "RED" })) };
    const naRow = { ...R, study: false, greens: 6, clauses: (R.clauses || []).map((c, i) => (i < 5 ? { ...c, status: "N-A" } : c)) };
    const d = async (name, want, p) => { const r = await day11({ org, meter: p }); put("A:day-11", `${name} → ${want}`, r.code === want, `${r.code} ${r.why}`); };
    await d("the 11/11 study row the org's own meter appended is the latest", 0, meter([six, R]));
    await d("a 6/11 latest row", 1, meter([{ ...R, date: "2026-11-01" }, { ...six, date: R.date }]));
    await d("the LAST row of the latest date wins (11/11 then 6/11 on one date)", 1, meter([R, { ...six, date: R.date }]));
    await d("a non-study (N-A) latest row", 1, meter([naRow]));
    await d("a row that disagrees with itself (its count reads 10, its clauses all GREEN)", 1, meter([{ ...R, greens: 10 }]));
    await d("an 11-green row whose day is not a study day", 1, meter([{ ...R, study: false }]));
    await d("no meter ledger", 2, join(T, "absent.jsonl"));
    await d("an unparseable ledger line", 2, meter(null, `${JSON.stringify(R)}\n{not json\n`));
    await d("a row without its clauses", 2, meter([{ date: R.date, greens: 11, study: true }]));
    // A:old-day-red — the old day through done.mjs oldDayRed, against the stamped latest row R
    const D = await organOf(org, "done.mjs");
    const OLD = D.OLD_RECORDED_DAY || "(no OLD_RECORDED_DAY export)";
    const oldRed = { date: OLD, study: true, green: false, greens: 6, reds: 5, clauses: [] };
    const o = async (name, want, p) => { const r = await oldday({ org, meter: p }); put("A:old-day-red", `${name} → ${want}`, r.code === want, `${r.code} ${r.why}`); };
    await o("the old day red, the latest row stamped by the org's own meter", 0, meter([oldRed, R]));
    await o("a later old-day row that reads green", 1, meter([oldRed, { ...oldRed, green: true }, R]));
    await o("no old-day row", 2, meter([R]));
    await o("the old day red but no row carries code_sha (the cut)", 2, meter([oldRed, { ...R, code_sha: undefined }]));
    await o("an old-day row whose green is null", 2, meter([{ ...oldRed, green: null }, R]));
    await o("an old-day row stamped with today's code_sha (F5 B)", 2, meter([{ ...oldRed, code_sha: R.code_sha }, R]));
    await o("no meter ledger", 2, join(T, "absent.jsonl"));
  } catch (e) {
    put("A:day-11", "the plants ran to their end", false, String(e && e.message || e).slice(0, 160));
    put("A:old-day-red", "the plants ran to their end", false, String(e && e.message || e).slice(0, 160));
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
  const want = existsSync(join(org, "ci", "mmeter", "BASE")) ? lines(readFileSync(join(org, "ci", "mmeter", "BASE"), "utf8"))[0] : null;
  if (!SHA_RE.test(bh)) return { ok: false, why: "the base-org HEAD is unreadable" };
  if (want && bh !== want) return { ok: false, why: `the base-org HEAD ${bh.slice(0, 12)} is not ci/mmeter/BASE ${String(want).slice(0, 12)}` };
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
  if (mode === "day11" || mode === "oldday") {
    const r = await (mode === "day11" ? day11 : oldday)({ org, meter: opt("--meter") ? resolve(opt("--meter")) : null });
    console.log(`MMETER ${mode === "day11" ? "A:day-11" : "A:old-day-red"} · ${r.why}`);
    return r.code;
  }
  if (mode === "plants") {
    const P = await plantsFor(org);
    let k = 0, n = 0;
    for (const id of CLAUSE_IDS) {
      for (const p of P[id]) { n++; if (p.ok) k++; console.log(`  ${p.ok ? "ok  " : "FAIL"} ${id} · ${p.name}${p.ok ? "" : `\n         got ${p.got}`}`); }
      console.log(`CLAUSE ${id} ${clauseOk(P[id]) ? "GREEN" : "RED"} · ${P[id].filter((p) => p.ok).length}/${P[id].length} plant(s)`);
    }
    const left = survivors();
    if (left.length) console.log(`LAST RED · ${left.length} process(es) name the temp prefix`);
    console.log(`PLANTS mmeter · ${k} of ${n} plant(s) as expected`);
    return k === n && n > 0 && !left.length ? 0 : 1;
  }
  if (mode !== "unit") { console.log("witness_meter.mjs day11|oldday [--meter <file>] [--org <dir>] · plants [--org <dir>] · --org <dir> --base-org <dir>"); return 2; }
  const baseOrg = opt("--base-org") ? resolve(opt("--base-org")) : null;
  const B = baseOrg ? await plantsFor(baseOrg) : null;
  const O = await plantsFor(org);
  const red = [];
  for (const id of CLAUSE_IDS) {
    const onBase = B ? !clauseOk(B[id]) : false, onBuild = clauseOk(O[id]);
    const fb = B ? B[id].filter((p) => !p.ok).map((p) => p.name) : [];
    console.log(`  ${id} · base ${B ? (onBase ? "RED" : "GREEN") : "UNREAD"}${fb.length ? ` (${fb.length} plant(s) fail: ${fb[0]}…)` : ""} · build ${onBuild ? "GREEN" : "RED"} (${O[id].filter((p) => p.ok).length}/${O[id].length})`);
    for (const p of O[id].filter((x) => !x.ok)) console.log(`      build FAIL ${p.name} — got ${p.got}`);
    if (!(onBase && onBuild)) red.push(id);
  }
  const bd = bound(org, baseOrg);
  console.log(`  BOUND · ${bd.ok ? "GREEN" : "RED"} · ${bd.why}`);
  if (!bd.ok) red.push("BOUND");
  const left = survivors();
  console.log(`  LAST · ${left.length ? `RED · ${left.length} process(es) name ${TMP_PREFIX}` : "GREEN · no process names the temp prefix"}`);
  if (left.length) red.push("LAST");
  if (red.length) { console.log(`RED MMETER · ${red.join(", ")}`); return 1; }
  console.log(`GREEN MMETER strict meter exit + meter witness (day11 · oldday), RED on base and GREEN on build · ${CLAUSE_IDS.length} clause(s)`);
  return 0;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exitCode = await main();
