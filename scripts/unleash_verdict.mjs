#!/usr/bin/env node
// ============================================================================
// unleash_verdict.mjs · ARSENAL AI FC — PHASE 10 OF THE UNLEASH PLAN
//   The 48-hour verdict, as a COMMAND rather than as a recipe in a document.
// ----------------------------------------------------------------------------
// WHY THIS FILE EXISTS. UNLEASH_PLAN__2026-08-14.md's Phase 10 is six checks a
// future session is asked to re-derive by hand from a baseline one-liner pasted
// in prose. This repo has proved, over and over, what happens to a number kept
// in prose: it rots, and the session that re-derives it gets a different answer
// and cannot tell whether the organism changed or the recipe did. So the checks
// are code, they read the same ledger the governor reads, and each one PRINTS
// ITS OWN EVIDENCE beside its verdict.
//
// IT JUDGES, IT NEVER REPAIRS. Nothing here writes to any state file except its
// own snapshot (unleash_after.json), and nothing here flips a config field. The
// Phase-4 `"caching": false` decision it recommends is left for a human to make
// with the reuse column in front of him — the 13 Aug plan's whole error was a
// list of 34 lanes chosen without that column.
//
// WHAT IT COMPARES. dressing-room/state/unleash_baseline.json — written at
// pre-flight on 14 Aug 2026, 7 days of ledger, 38 lanes, BEFORE any phase
// landed. Same window, same arithmetic, same weights on both sides.
//
// MODES: node scripts/unleash_verdict.mjs [report] · json · selftest
// READS: brain_ledger.jsonl · unleash_baseline.json · brain_config.json
// WRITES: unleash_after.json (its own snapshot, sole writer)
// ============================================================================
import { readFileSync, existsSync, writeFileSync, renameSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const LEDGER    = join(STATE_DIR, "brain_ledger.jsonl");
const BASELINE  = join(STATE_DIR, "unleash_baseline.json");
const AFTER     = join(STATE_DIR, "unleash_after.json");
const AFTER_TMP = AFTER + ".tmp";
const CONFIG    = join(STATE_DIR, "brain_config.json");

// The weights are brain.mjs's, restated, and NOT this file's to change.
const W = { input: 1, cache_creation: 1.25, cache_read: 0.1, output: 5 };
const M = { haiku: 1, sonnet: 3, opus: 5 };
const N = (v) => (typeof v === "number" && isFinite(v) ? v : 0);
const readJson = (p) => { try { return JSON.parse(readFileSync(p, "utf8")); } catch { return null; } };

export const modelKey = (m) => { const s = String(m || "").toLowerCase(); return s.includes("haiku") ? "haiku" : s.includes("opus") ? "opus" : s.includes("sonnet") ? "sonnet" : null; };
export const weighted = (b) => N(b.inp) * W.input + N(b.cw) * W.cache_creation + N(b.cr) * W.cache_read + N(b.out) * W.output;
export const aware = (b) => weighted(b) * (M[modelKey(b.model)] || 3);

// ROLL UP a ledger slice exactly the way the pre-flight baseline did — same
// fields, same grouping — so the two sides are comparable by construction.
export function rollup(rows, days) {
  const by = {};
  for (const r of rows || []) {
    const j = r.job; if (!j) continue;
    if (!by[j]) by[j] = { n: 0, cw: 0, cr: 0, inp: 0, out: 0, model: r.model, resume_n: 0, split_n: 0 };
    const b = by[j];
    b.n++; b.cw += N(r.cache_creation_tokens); b.cr += N(r.cache_read_tokens);
    b.inp += N(r.input_tokens); b.out += N(r.output_tokens);
    if (r.model) b.model = r.model;
    if (r.resume === true) b.resume_n++;
    if (r.split === "system") b.split_n++;
  }
  return { days, lanes: by };
}

export function compare(base, after) {
  const lanes = [];
  const ids = [...new Set([...Object.keys(base.lanes || {}), ...Object.keys(after.lanes || {})])];
  for (const id of ids) {
    const b = (base.lanes || {})[id], a = (after.lanes || {})[id];
    // PER-RUN, not per-window: the two windows can hold different run counts
    // (he was awake more, a lane was closed), and comparing totals across
    // different denominators is how a cheaper organism reads as a dearer one.
    const perRun = (x) => (x && x.n ? weighted(x) / x.n : null);
    const perRunAware = (x) => (x && x.n ? aware(x) / x.n : null);
    lanes.push({
      job: id, model: (a && a.model) || (b && b.model) || null,
      n_before: b ? b.n : 0, n_after: a ? a.n : 0,
      per_run_before: perRun(b), per_run_after: perRun(a),
      per_run_aware_before: perRunAware(b), per_run_aware_after: perRunAware(a),
      pct: perRun(b) && perRun(a) ? Math.round((1 - perRun(a) / perRun(b)) * 100) : null,
      reuse_after: a && a.cw ? +(a.cr / a.cw).toFixed(3) : null,
      resume_n: a ? a.resume_n : 0, split_n: a ? a.split_n : 0,
      cache_read_share: a && a.n ? +((a.cr > 0 ? 1 : 0)).toFixed(0) : null,
    });
  }
  lanes.sort((x, y) => (y.per_run_aware_after || 0) * (y.n_after || 0) - (x.per_run_aware_after || 0) * (x.n_after || 0));
  const tot = (o) => Object.values(o.lanes || {}).reduce((s, b) => s + aware(b), 0);
  const runs = (o) => Object.values(o.lanes || {}).reduce((s, b) => s + b.n, 0);
  return {
    lanes,
    total_aware_before: Math.round(tot(base)), total_aware_after: Math.round(tot(after)),
    runs_before: runs(base), runs_after: runs(after),
  };
}

// THE SUCCESS CRITERIA, verbatim from the plan's Phase 10 — each one measured,
// each one printing what it measured. `pending` is a first-class answer: a
// criterion whose evidence does not exist yet has NOT passed and has NOT failed,
// and calling it either would be the lie this whole plan kept catching.
// A MUTATION JUDGED ON FIVE EVENTS IS A COIN FLIP — bootroom.mjs:140's law,
// which gate_tune.mjs already enforces as `metric.min_events`, applied here for
// the same reason. The first live run of this file scored the organism-wide
// criterion FAILED off TWO runs (one of them a hand-fired lane), which is not a
// result, it is noise wearing a verdict's clothes. Under the floor the answer is
// PENDING and says how far it has to go.
const MIN_RUNS_TO_JUDGE = 40;
const MIN_LANE_RUNS_TO_JUDGE = 5;

export function verdict(cmp, cfg) {
  const out = [];
  const lane = (id) => cmp.lanes.find((l) => l.job === id);
  const perRunBefore = cmp.runs_before ? cmp.total_aware_before / cmp.runs_before : null;
  const perRunAfter = cmp.runs_after ? cmp.total_aware_after / cmp.runs_after : null;
  const drop = perRunBefore && perRunAfter ? Math.round((1 - perRunAfter / perRunBefore) * 100) : null;
  const thin = cmp.runs_after < MIN_RUNS_TO_JUDGE;
  out.push({ name: "organism weighted PER RUN down ≥ 20%",
    state: drop === null || thin ? "pending" : drop >= 20 ? "pass" : "fail",
    evidence: drop === null ? "no runs on one side of the window yet"
      : thin ? `${cmp.runs_after}/${MIN_RUNS_TO_JUDGE} runs since the baseline — too few to judge (a verdict off ${cmp.runs_after} runs is a coin flip, bootroom's law). Reading so far: ${Math.round(perRunBefore).toLocaleString("en-IN")} → ${Math.round(perRunAfter).toLocaleString("en-IN")} per run.`
      : `${Math.round(perRunBefore).toLocaleString("en-IN")} → ${Math.round(perRunAfter).toLocaleString("en-IN")} model-aware per run (${drop}%), over ${cmp.runs_before} → ${cmp.runs_after} runs` });
  const p = lane("haiku_pulse");
  const pThin = !p || p.n_after < MIN_LANE_RUNS_TO_JUDGE;
  out.push({ name: "haiku_pulse: resumed sessions live, weighted/run down ≥ 40%",
    state: pThin ? "pending" : (p.resume_n > 0 && (p.pct || 0) >= 40) ? "pass" : "fail",
    evidence: !p || !p.n_after ? "no pulse has run since the branch went live"
      : pThin ? `${p.n_after}/${MIN_LANE_RUNS_TO_JUDGE} pulses so far (${p.resume_n} resumed) — not enough to judge the lane yet`
      : `${p.n_after} run(s), ${p.resume_n} resumed · ${Math.round(p.per_run_before || 0).toLocaleString("en-IN")} → ${Math.round(p.per_run_after || 0).toLocaleString("en-IN")} weighted/run (${p.pct}%)` });
  const split = cmp.lanes.filter((l) => l.split_n > 0);
  out.push({ name: "the split is live on the analysis lanes", state: split.length ? "pass" : "pending",
    evidence: split.length ? `${split.length} lane(s) sent head-in-system: ${split.slice(0, 6).map((l) => l.job).join(", ")}` : "no lane has run through the split yet" });
  const cw = lane("cortex_wake");
  out.push({ name: "cortex_wake fired on a real Gaffer conversation", state: !cw || !cw.n_after ? "pending" : "pass",
    evidence: !cw || !cw.n_after ? "no wake since the branch went live" : `${cw.n_after} wake(s), ${cw.resume_n} of them attached to a sitting` });
  const enabled = ((cfg && cfg.jobs) || []).filter((j) => j.enabled !== false);
  const effort = enabled.filter((j) => (j.extra_args || []).includes("--effort"));
  const haiku = enabled.filter((j) => modelKey(j.model) === "haiku");
  out.push({ name: "effort is set on every enabled non-haiku lane, and on no haiku lane", state: (effort.length === enabled.length - haiku.length && !haiku.some((j) => (j.extra_args || []).includes("--effort"))) ? "pass" : "fail",
    evidence: `${effort.length} of ${enabled.length - haiku.length} eligible lanes carry --effort; ${haiku.length} haiku lane(s) correctly carry none` });
  // Phase 4's decision, computed and RECOMMENDED — never applied here.
  const offer = cmp.lanes.filter((l) => l.n_after >= 3 && l.reuse_after !== null && l.reuse_after < 0.278);
  out.push({ name: "Phase 4 — lanes whose caching still never pays (reuse < 0.278)", state: "info",
    evidence: offer.length ? offer.map((l) => `${l.job} reuse ${l.reuse_after} (${l.n_after} runs)`).join(" · ") : "none — every lane with 3+ runs reads back more than break-even" });
  return out;
}

function main() {
  const mode = (process.argv[2] || "report").toLowerCase();
  if (mode === "selftest") process.exit(selftest() ? 0 : 1);
  const base = readJson(BASELINE);
  if (!base) { console.error(`unleash_verdict: no baseline at ${BASELINE} — it is written at pre-flight and nothing here can invent it`); process.exit(1); }
  // AFTER = every row since the baseline was taken. Not "the last 7 days": the
  // baseline's window ENDS where this one begins, so a 7-day read here would
  // count the pre-change days on both sides and dilute the very difference it
  // exists to measure.
  const since = Date.parse(base.at || 0);
  const rows = [];
  try {
    for (const l of readFileSync(LEDGER, "utf8").split("\n")) {
      if (!l.trim()) continue;
      try { const r = JSON.parse(l); if (r && Date.parse(r.ts || 0) >= since) rows.push(r); } catch { }
    }
  } catch { }
  const hours = (Date.now() - since) / 3600000;
  const after = { at: new Date(Date.now()).toISOString(), since: base.at, hours: Math.round(hours * 10) / 10, ...rollup(rows, Math.round(hours / 24 * 10) / 10) };
  writeFileSync(AFTER_TMP, JSON.stringify(after, null, 1)); renameSync(AFTER_TMP, AFTER);
  const cmp = compare(base, after);
  const v = verdict(cmp, readJson(CONFIG));
  if (mode === "json") { console.log(JSON.stringify({ hours: after.hours, cmp, verdict: v }, null, 1)); return; }

  console.log(`\n=== THE UNLEASH VERDICT — ${after.hours}h since the baseline (${String(base.at).slice(0, 16)}) ===`);
  if (hours < 48) console.log(`⚠ THE WINDOW IS NOT DONE: the plan asks for 48h and this is ${after.hours}h. Everything below is a PROGRESS read, not the verdict.\n`);
  console.log(`${"lane".padEnd(20)}${"model".padEnd(8)}${"runs".padStart(6)}${"w/run before".padStart(14)}${"w/run after".padStart(13)}${"Δ".padStart(7)}${"reuse".padStart(8)}${"resume".padStart(8)}${"split".padStart(7)}`);
  for (const l of cmp.lanes.slice(0, 16)) {
    if (!l.n_after && !l.n_before) continue;
    console.log(l.job.slice(0, 19).padEnd(20) + String(l.model || "?").slice(0, 7).padEnd(8)
      + `${l.n_before}→${l.n_after}`.padStart(6)
      + (l.per_run_before === null ? "—" : Math.round(l.per_run_before).toLocaleString("en-IN")).padStart(14)
      + (l.per_run_after === null ? "—" : Math.round(l.per_run_after).toLocaleString("en-IN")).padStart(13)
      + (l.pct === null ? "—" : `${l.pct}%`).padStart(7)
      + (l.reuse_after === null ? "—" : String(l.reuse_after)).padStart(8)
      + String(l.resume_n || "").padStart(8) + String(l.split_n || "").padStart(7));
  }
  console.log(`\n── THE SIX CHECKS ──`);
  for (const c of v) console.log(`  ${c.state === "pass" ? "✓" : c.state === "fail" ? "✗" : c.state === "info" ? "·" : "…"} ${c.name}\n      ${c.evidence}`);
  const failed = v.filter((c) => c.state === "fail"), pending = v.filter((c) => c.state === "pending");
  console.log(`\nVERDICT: ${failed.length ? `${failed.length} FAILED` : pending.length ? `${pending.length} still PENDING (evidence not on disk yet)` : "every criterion met"}\n`);
}

function selftest() {
  let pass = 0, fail = 0;
  const ok = (n, c, d) => { if (c) { pass++; console.log(`  ✓ ${n}`); } else { fail++; console.log(`  ✗ ${n}${d ? `\n      ${d}` : ""}`); } };
  console.log("== unleash_verdict selftest — fixtures only, never the live bus ==\n");
  ok("weights are brain.mjs's, restated: input 1 · cache_write 1.25 · cache_read 0.1 · output 5",
    weighted({ inp: 100, cw: 200, cr: 1000, out: 10 }) === 100 + 250 + 100 + 50);
  ok("the model factor is applied on top, and an unstated model is charged as sonnet",
    aware({ inp: 0, cw: 0, cr: 0, out: 100, model: "opus" }) === 500 * 5
    && aware({ inp: 0, cw: 0, cr: 0, out: 100 }) === 500 * 3);
  const base = { at: "2026-08-14T00:00:00Z", lanes: { haiku_pulse: { n: 100, cw: 1000000, cr: 0, inp: 1000, out: 100000, model: "haiku" } } };
  const after = { lanes: { haiku_pulse: { n: 50, cw: 25000, cr: 600000, inp: 500, out: 50000, model: "haiku", resume_n: 48, split_n: 0 } } };
  const cmp = compare(base, after);
  const p = cmp.lanes.find((l) => l.job === "haiku_pulse");
  ok("the comparison is PER RUN — half as many runs must not read as a 50% saving",
    p.n_before === 100 && p.n_after === 50 && p.pct >= 40, JSON.stringify(p));
  ok("reuse is measured on the AFTER window only (cr/cw), which is what the Phase-4 decision needs",
    p.reuse_after === 24);
  const v = verdict(cmp, { jobs: [{ id: "a", model: "sonnet", extra_args: ["--effort", "low"] }, { id: "h", model: "haiku" }] });
  ok("a criterion with no evidence yet is PENDING — never a silent pass and never a fail",
    verdict(compare({ lanes: {} }, { lanes: {} }), { jobs: [] }).some((c) => c.state === "pending"));
  ok("A THIN WINDOW IS PENDING, NOT FAILED — the first live run scored the organism FAILED off two runs",
    (() => { const c = compare({ lanes: { x: { n: 500, cw: 1000, cr: 0, inp: 0, out: 0, model: "sonnet" } } },
                                { lanes: { x: { n: 2, cw: 9000, cr: 0, inp: 0, out: 0, model: "sonnet", resume_n: 0, split_n: 0 } } });
      const r = verdict(c, { jobs: [] }).find((k) => /PER RUN/.test(k.name));
      return r.state === "pending" && /coin flip/.test(r.evidence); })());
  ok("the pulse criterion reads BOTH halves: resumed runs present AND ≥40% off",
    v.find((c) => /haiku_pulse/.test(c.name)).state === "pass");
  ok("effort is checked as a have/need over ELIGIBLE lanes, and a haiku lane carrying it would FAIL",
    v.find((c) => /effort/.test(c.name)).state === "pass"
    && verdict(cmp, { jobs: [{ id: "h", model: "haiku", extra_args: ["--effort", "low"] }] }).find((c) => /effort/.test(c.name)).state === "fail");
  ok("Phase 4's list is INFO — it recommends, it never applies",
    v.find((c) => /Phase 4/.test(c.name)).state === "info");
  console.log(`\nunleash_verdict: ${pass} passed, ${fail} failed`);
  return fail === 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
export { rollup as _rollup };
