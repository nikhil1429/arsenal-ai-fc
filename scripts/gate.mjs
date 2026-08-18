#!/usr/bin/env node
// ============================================================================
// gate.mjs · ARSENAL AI FC — THE GATE (consumption-gated spend, two-way, automatic)
//   ORGANISM_OVERHAUL__2026-08-18.md §5 · LAW L5. Built 18 Aug 2026 on his word
//   ("should we not kill anything … everything works correctly from now onwards
//   universally"). This file REPLACES every "sleep list" and "kill list", forever.
// ----------------------------------------------------------------------------
// THE RULE, ONE SENTENCE (§5.1):
//   An LLM lane runs iff (E) its required evidence exists, (C) its output has been
//   CONSUMED-BY-HIM within `window_days` or it is event-driven, and (F) it has not
//   failed `fail_streak` consecutive times; otherwise it is ASLEEP; an asleep lane
//   re-checks every scheduled slot and WAKES ITSELF the moment E∧C∧¬F holds again.
//
// WHY A HELPER AND NOT A LIST. On 18 Aug 2026 `brain status` showed 11 jobs billed
// on absent evidence (teamtalk_am 15/15 runs without season.json, dreams 19/20) and
// 10 on half-eaten inputs, ~90% of 6.12 crore tokens/week in the dark lane, ~0%
// reaching his ear. The natural repair is a list of organs to switch off — and a
// list is wrong IN KIND: those organs were starved of real data during the testing
// phase, not broken. The moment he does one /full-time or one real sitting, they
// have their evidence again and must come back on their own, with nobody editing a
// list. So the decision is a FUNCTION of the live evidence, never a table.
//
// PURE BY DESIGN. `decide()` takes every fact as an argument and returns a verdict;
// it opens no file, spawns nothing, and knows no clock but the `now` it is handed —
// which is what lets brain.mjs, nightshift.mjs and dmn.mjs share ONE definition of
// "asleep" and lets this selftest run without a live ledger. The two read helpers
// at the bottom (`consumptionOf`, `failStreakOf`) are pure folds over rows the
// caller has already read; the only I/O in this file is `readJsonl`, a convenience
// for callers, and it READS. THIS ORGAN WRITES NOTHING. The journal
// (brain_out/gate.jsonl), the consumption lane (consumption.jsonl) and the card
// belong to brain.mjs and captains_call.mjs — owners-only, unchanged.
//
// THRESHOLD CLASSES (§5.4, his 1 Aug + 13 Aug rulings): `window_days` and
// `fail_streak` are GUARDS and WINDOWS, never budgets and never calendar gates —
// a window says "consumed within N days counts", a guard stops one identical
// failure repeating. Neither waits for calendar time before letting a lane run:
// a lane with evidence and a first run has NEVER been asleep. Both defaults are
// provisional per the DAY-0 LAW; Block 9 sets them from seven real days of data.
//
// WHO ELSE COULD ACT ON THIS OUTPUT? brain.mjs (tick filters eligible jobs through
//   it; journals transitions; files the one card; `gate` CLI) · nightshift.mjs (per
//   lane, before spending) · dmn.mjs (evidence = real reps/rounds) · reconcile.mjs
//   (an asleep lane is resting by rule, not lying dead) · watchman.mjs
//   (gate-asleep INFO · gate-stuck RED).
// CLI: node scripts/gate.mjs [selftest]
// ============================================================================
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

// ── DEFAULTS — three optional fields per job; absent = these (§5.3: no config
// edit is required to start) ─────────────────────────────────────────────────
export const GATE_DEFAULTS = Object.freeze({
  window_days: 14,          // WINDOW: consumed-by-him inside this ⇒ C holds (Block 9 re-fits from data)
  fail_streak: 5,           // GUARD: this many consecutive failures ⇒ F blocks until a wake or a success
  event: null,              // EVENT-DRIVEN: "lock" | "fulltime" | "sitting_close" | "missions_ingest" | "gem_sync" | … ⇒ C holds by construction
  consumers: [],            // explicit downstream jobs whose consumption counts as this job's (transitive C)
});
export const CONSUMPTION_KINDS = Object.freeze(["spoken", "sat", "briefed", "carded", "opened", "pushed"]);

export function gateConfig(job) {
  const g = (job && job.gate && typeof job.gate === "object") ? job.gate : {};
  const n = (v, d) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : d);
  return {
    window_days: n(g.window_days, GATE_DEFAULTS.window_days),
    fail_streak: n(g.fail_streak, GATE_DEFAULTS.fail_streak),
    event: typeof g.event === "string" && g.event ? g.event : GATE_DEFAULTS.event,
    consumers: Array.isArray(g.consumers) ? g.consumers.filter((x) => typeof x === "string") : [],
  };
}

const ms = (iso) => { const t = Date.parse(iso || ""); return Number.isFinite(t) ? t : NaN; };
const DAY = 86400000;

// ── THE FOLD (overhaul §10 · Block 5.2, 18 Aug 2026) — the fourth letter, D ─────
// A job may declare `folded_into: "<job id>"` in brain_config.json: its work is now
// done by that TARGET lane (night_coach · day_cartridge · agenda · teamtalk_am ·
// midday_cartridge · capsule_premap fold into prepare_tomorrow — ONE plan a night is
// what he meets). His law is THE GATE, never a switch (`enabled:false` would be the
// kill list in a new coat), so a folded lane stays enabled and SLEEPS BY VERDICT:
//   D holds (the lane may run) iff it is NOT displaced — no fold declared, or the
//   fold target has NOT covered the day this lane serves. The RUNNER computes the
//   fact (brain.mjs foldStatus: the target's artifact for the serve day exists, or the
//   target is awake and still due for it) and hands it here as `fold`; this file only
//   turns it into the verdict, like E·C·F. A covered lane sleeps "on D — folded →
//   prepare_tomorrow"; the night the target fails or misses, D holds again and the
//   folded lane runs AS THE FALLBACK — nothing deleted, nobody edits a list. His
//   `na` / `gate wake` (forced.until) opens D too: reversibility beats every letter.
export function foldOf(job) {
  const f = job && job.folded_into;
  return typeof f === "string" && f.trim() ? f.trim() : null;
}

// ── THE VERDICT ──────────────────────────────────────────────────────────────
// decide({ job, evidence, consumption, failures, now, forced, fold }) →
//   { run, state: "awake"|"asleep", why: {E,C,F,D}, wakes_when, cfg }
//
//   fold        { target: string, covered: boolean, detail?: string } | null — the
//               runner's read of the fold (null / absent ⇒ D holds: not folded, or the
//               fold is open). `covered:true` ⇒ D fails ⇒ ASLEEP unless forced.until.
//
//   evidence    { ok?: boolean, required_absent?: string[], absent?: string[], detail?: string }
//               E holds iff ok !== false AND required_absent is empty. `undefined` ⇒ E
//               holds (a job that declares no evidence has nothing that can be absent —
//               the manager_m3 class). Only a REQUIRED absence sleeps a lane; optional
//               absences are reported, never a verdict (finding #64's trap: no ratio).
//   consumption { last_at?: ISO|null, kind?: string, by?: string, never_ran?: boolean,
//                 event_armed?: boolean }
//               C holds iff event-driven (cfg.event set) · OR never_ran (a lane must
//               run ONCE to be consumable — the first-run grace) · OR last_at inside
//               window_days · OR forced.until > now (his `na` on the card, or
//               `brain gate wake`).
//   failures    { streak?: number } — F blocks iff streak >= fail_streak. `forced.once`
//               (a wake) overrides F for exactly one run; a success then clears the
//               streak on the ledger by itself, which is the only clear there is.
//   forced      { until?: ISO|null, once?: boolean } — the two wake mechanisms.
export function decide({ job, evidence, consumption, failures, now = new Date(), forced = null, fold = null } = {}) {
  const cfg = gateConfig(job);
  const nowMs = now instanceof Date ? now.getTime() : ms(now);
  const ev = evidence || {};
  const cons = consumption || {};
  const fl = failures || {};
  const fz = forced || {};
  const forcedUntilMs = ms(fz.until);
  const forcedLive = Number.isFinite(forcedUntilMs) && forcedUntilMs > nowMs;
  const foldTarget = (fold && typeof fold === "object" && fold.target) ? String(fold.target) : foldOf(job);

  // E — evidence
  const reqAbsent = Array.isArray(ev.required_absent) ? ev.required_absent : [];
  const E = ev.ok !== false && reqAbsent.length === 0;
  const Edetail = E
    ? (ev.detail || (reqAbsent.length === 0 && Array.isArray(ev.absent) && ev.absent.length ? `evidence present (optional absent: ${ev.absent.join(", ")})` : "evidence present"))
    : (ev.detail || (reqAbsent.length ? `REQUIRED evidence absent: ${reqAbsent.join(", ")}` : "evidence declared absent by the organ"));

  // C — consumed by him (or event-driven / first run / forced)
  const lastMs = ms(cons.last_at);
  const ageDays = Number.isFinite(lastMs) ? (nowMs - lastMs) / DAY : null;
  let C, Cdetail;
  // EVENT lanes: the event opens the lane. `event_armed` undefined ⇒ the runner's own
  // trigger arms it (brain's trigger gate) and C holds by construction; `false` ⇒ the
  // runner measured that the event has NOT fired since the last run — then only a
  // consumption inside the window or a force opens it (a lock-driven probe bank that
  // a scrimmage keeps drawing from is still useful between locks).
  if (cfg.event && cons.event_armed !== false) { C = true; Cdetail = `event-driven (${cfg.event}) — the event opens it, consumption is not the gate`; }
  else if (forcedLive) { C = true; Cdetail = `forced awake until ${new Date(forcedUntilMs).toISOString().slice(0, 16)}Z (his na / gate wake)`; }
  else if (cfg.event && ageDays !== null && ageDays <= cfg.window_days) { C = true; Cdetail = `event ${cfg.event} has not fired since the last run, but the output was consumed ${ageDays.toFixed(1)}d ago (${cons.kind || "?"}) — inside the ${cfg.window_days}d window`; }
  else if (cfg.event) { C = false; Cdetail = `event ${cfg.event} has not fired since the last run${ageDays !== null ? `, and the last consumption was ${ageDays.toFixed(1)}d ago (outside ${cfg.window_days}d)` : ", and nothing of it was ever consumed"}`; }
  else if (cons.never_ran === true) { C = true; Cdetail = "first run — a lane must run once before anything of it can reach him"; }
  else if (ageDays !== null && ageDays <= cfg.window_days) { C = true; Cdetail = `consumed by him ${ageDays.toFixed(1)}d ago (${cons.kind || "?"}${cons.by ? " via " + cons.by : ""}) — inside the ${cfg.window_days}d window`; }
  else if (ageDays !== null) { C = false; Cdetail = `last consumed by him ${ageDays.toFixed(1)}d ago (${cons.kind || "?"}) — outside the ${cfg.window_days}d window`; }
  else { C = false; Cdetail = `never consumed by him since the lane began (it has run, and nothing of it reached his ear, brief, card or eye)`; }

  // F — failure streak
  const streak = typeof fl.streak === "number" && fl.streak > 0 ? fl.streak : 0;
  let F = streak < cfg.fail_streak, Fdetail;
  if (F) Fdetail = streak ? `${streak} consecutive failure(s) — under the ${cfg.fail_streak} guard` : "no failure streak";
  else if (fz.once) { F = true; Fdetail = `${streak} consecutive failure(s) ≥ ${cfg.fail_streak}, but a wake was asked for — this ONE run is allowed; a success clears the streak`; }
  else Fdetail = `${streak} consecutive failure(s) ≥ ${cfg.fail_streak} guard — the same failure must not repeat unattended`;

  // D — not displaced by a fold (Block 5.2). The runner's fact decides; a live C-force
  // (his `na` / `gate wake`) opens the fold too — reversibility outranks the design.
  let D = true, Ddetail;
  if (!foldTarget) Ddetail = "not folded into another lane";
  else if (fold && fold.covered === true && forcedLive) { D = true; Ddetail = `folded → ${foldTarget} and covered, but forced awake until ${new Date(forcedUntilMs).toISOString().slice(0, 16)}Z (his na / gate wake) — this lane runs beside the fold`; }
  else if (fold && fold.covered === true) { D = false; Ddetail = fold.detail || `folded → ${foldTarget}: the fold target covers this lane's day`; }
  else Ddetail = (fold && fold.detail) ? `folded → ${foldTarget}, fold OPEN — ${fold.detail}` : `folded → ${foldTarget}, but the runner reported no cover — the fold is OPEN and this lane decides on E·C·F`;

  const run = E && C && F && D;
  const state = run ? "awake" : "asleep";
  return {
    run, state, cfg,
    why: { E: { ok: E, detail: Edetail }, C: { ok: C, detail: Cdetail }, F: { ok: F, detail: Fdetail }, D: { ok: D, detail: Ddetail } },
    fold: foldTarget ? { target: foldTarget, covered: !D } : null,
    wakes_when: run ? null : wakesWhen({ job, E, C, F, D, reqAbsent, cfg, foldTarget }),
  };
}

// The sentence on the card and in `brain status`: what has to happen for this lane
// to wake ITSELF. Derived from the job's own declarations, never a hand-written per-
// job string (a per-job table is the list this file exists to abolish).
export function wakesWhen({ job, E, C, F, D = true, reqAbsent = [], cfg = gateConfig(job), foldTarget = foldOf(job) } = {}) {
  const parts = [];
  if (!E) parts.push(reqAbsent.length ? `${reqAbsent.join(", ")} exists again` : "its evidence exists again");
  if (!C) parts.push(`its output reaches him (${consumptionHint(job)}) — or his 'na' on the card / \`brain gate wake ${job && job.id ? job.id : "<job>"}\` opens it for ${cfg.window_days}d`);
  if (!F) parts.push(`\`brain gate wake ${job && job.id ? job.id : "<job>"}\` runs it once (a success clears the ${cfg.fail_streak}-fail streak)`);
  if (!D) parts.push(`the fold opens by itself the night ${foldTarget || "its fold target"} fails or misses (this lane is the fallback) — or \`brain gate wake ${job && job.id ? job.id : "<job>"}\` runs it beside the fold for ${cfg.window_days}d`);
  return parts.join(" · ") || "n/a";
}

// Where THIS job's output would have to be seen — read off the job's own `surface`
// declaration (brain_config.json), the same field `brain status` prints.
export function consumptionHint(job) {
  const s = job && job.surface;
  if (!s || typeof s !== "object") return "no surface declared";
  const where = String(s.where || "");
  const organ = (where.match(/scripts\/([a-z_]+)\.mjs/i) || [])[1];
  switch (s.kind) {
    case "sheet": return "the sheet is pushed to his phone / opened at /matchday";
    case "media": return "the mp3 is announced inside a push that was sent";
    case "human_file": return "he opens the file (a card he answers, or the wall/`deep` prints it)";
    case "job_input": return "the job that eats it (downstream) reaches him";
    case "code": return organ ? `${organ}.mjs serves it into a brief, a sitting or his ear` : "the reader organ serves it to him";
    default: return where.slice(0, 60) || s.kind || "unknown surface";
  }
}

// ── PURE FOLDS OVER ROWS THE CALLER READ ─────────────────────────────────────
// consumptionOf(rows, keys, {before}) → { last_at, kind, by } for the newest row whose
// `job` or `lane` is in keys. Rows are the consumption lane's shape:
//   { ts, job?, lane?, kind, by, file? }
export function consumptionOf(rows, keys, { before = null } = {}) {
  const K = new Set((Array.isArray(keys) ? keys : [keys]).filter(Boolean));
  const cut = before ? ms(before) : Infinity;
  let best = null;
  for (const r of rows || []) {
    if (!r || typeof r !== "object") continue;
    if (!(K.has(r.job) || K.has(r.lane))) continue;
    if (!CONSUMPTION_KINDS.includes(r.kind)) continue;
    const t = ms(r.ts);
    if (!Number.isFinite(t) || t > cut) continue;
    if (!best || t > best.t) best = { t, last_at: r.ts, kind: r.kind, by: r.by || null };
  }
  return best ? { last_at: best.last_at, kind: best.kind, by: best.by } : { last_at: null, kind: null, by: null };
}

// failStreakOf(ledgerRows, jobId) → consecutive ok:false rows at the TAIL of this
// job's history. Rows without a boolean `ok` (budget:skip, agenda:skip, gate rows)
// are neither a failure nor a success and are skipped; a plan-limit row is not the
// job's fault and is skipped too (brain.mjs's own attempt rule).
// `jobId` may be ONE id or a list of ids (a lane whose ledger rows carry several job
// names — the DMN writes dmn_rollout + dmn_counter, the shift writes ns_*).
export function failStreakOf(rows, jobId) {
  const ids = new Set(Array.isArray(jobId) ? jobId : [jobId]);
  let streak = 0;
  for (let i = (rows || []).length - 1; i >= 0; i--) {
    const r = rows[i];
    if (!r || !ids.has(r.job) || typeof r.ok !== "boolean" || r.limit_hit === true) continue;
    if (r.ok === false) streak++; else break;
  }
  return streak;
}

// everRan(ledgerRows, jobId) → has this job EVER left a boolean-ok row (a real
// attempt, success or failure)? Skips (budget/agenda/gate) do not count as runs.
export function everRan(rows, jobId) {
  const ids = new Set(Array.isArray(jobId) ? jobId : [jobId]);
  return (rows || []).some((r) => r && ids.has(r.job) && typeof r.ok === "boolean");
}

// The one read helper (convenience for callers; brain/nightshift/dmn all already
// have their own readers — this exists so a caller with none can stay honest).
export function readJsonl(path) {
  try { return readFileSync(path, "utf8").split("\n").filter((l) => l.trim()).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean); }
  catch { return []; }
}

// ── SELFTEST — fixtures only; every check can fail ───────────────────────────
function selftest() {
  let pass = 0, fail = 0;
  const assert = (name, cond) => { if (cond) pass++; else fail++; console.log(`  ${cond ? "✓" : "✗"} ${name}`); };
  const NOW = new Date("2026-08-18T04:00:00Z");
  const iso = (dAgo) => new Date(NOW.getTime() - dAgo * DAY).toISOString();
  const J = (id, extra = {}) => ({ id, surface: { kind: "code", where: "scripts/learnstate.mjs diaryLine()" }, ...extra });

  // defaults
  const cfg = gateConfig({ id: "x" });
  assert("DEFAULTS — window 14d · fail_streak 5 · event null · consumers [] when the job declares nothing (no config edit needed to start)",
    cfg.window_days === 14 && cfg.fail_streak === 5 && cfg.event === null && cfg.consumers.length === 0);
  assert("DEFAULTS — a job's own gate block overrides field by field, garbage is ignored",
    gateConfig({ gate: { window_days: 3, fail_streak: "nope", event: "lock", consumers: ["a", 5] } }).window_days === 3
    && gateConfig({ gate: { fail_streak: "nope" } }).fail_streak === 5
    && gateConfig({ gate: { event: "lock" } }).event === "lock"
    && gateConfig({ gate: { consumers: ["a", 5] } }).consumers.join() === "a");

  // §5.5 fixture 1 — required input absent ⇒ asleep; restored ⇒ awake, no human action
  const asleepE = decide({ job: J("teamtalk_am"), evidence: { required_absent: ["season.json"] }, consumption: { last_at: iso(1) }, failures: { streak: 0 }, now: NOW });
  const awakeE = decide({ job: J("teamtalk_am"), evidence: { required_absent: [] }, consumption: { last_at: iso(1) }, failures: { streak: 0 }, now: NOW });
  assert("§5.5/1 — REQUIRED evidence absent ⇒ ASLEEP with E named; the same lane with evidence back ⇒ AWAKE by itself",
    asleepE.run === false && asleepE.state === "asleep" && asleepE.why.E.ok === false && /season\.json/.test(asleepE.why.E.detail)
    && awakeE.run === true && awakeE.state === "awake");
  assert("§5.5/1 — an OPTIONAL absence is reported and never a verdict (finding #64's trap: no ratio, no majority guard)",
    decide({ job: J("t"), evidence: { absent: ["notebook.json"], required_absent: [] }, consumption: { last_at: iso(1) }, now: NOW }).run === true);
  assert("§5.5/1 — wakes_when names the missing file, derived from the declaration",
    /season\.json exists again/.test(asleepE.wakes_when));

  // §5.5 fixture 2 — 5 consecutive failures ⇒ asleep; a wake runs it once; success clears
  const rowsFail = [{ job: "x", ok: true }, ...Array.from({ length: 5 }, () => ({ job: "x", ok: false }))];
  assert("§5.5/2 — failStreakOf counts the TAIL only, skips non-boolean rows and limit_hit rows",
    failStreakOf(rowsFail, "x") === 5
    && failStreakOf([...rowsFail, { job: "x", budget_skip: true }], "x") === 5
    && failStreakOf([...rowsFail, { job: "x", ok: false, limit_hit: true }], "x") === 5
    && failStreakOf([...rowsFail, { job: "x", ok: true }], "x") === 0
    && failStreakOf(rowsFail, "y") === 0);
  const asleepF = decide({ job: J("x"), evidence: {}, consumption: { last_at: iso(1) }, failures: { streak: 5 }, now: NOW });
  const wokeF = decide({ job: J("x"), evidence: {}, consumption: { last_at: iso(1) }, failures: { streak: 5 }, now: NOW, forced: { once: true } });
  assert("§5.5/2 — streak 5 ⇒ ASLEEP on F; forced.once ⇒ this ONE run is allowed and says a success clears it",
    asleepF.run === false && asleepF.why.F.ok === false && wokeF.run === true && /ONE run/.test(wokeF.why.F.detail));
  assert("§5.5/2 — streak 4 stays under the guard (a guard, never a budget)",
    decide({ job: J("x"), evidence: {}, consumption: { last_at: iso(1) }, failures: { streak: 4 }, now: NOW }).run === true);

  // §5.5 fixture 3 — spoken 3d ago ⇒ awake; 15d ago ⇒ asleep; card 'na' ⇒ awake 14d
  const c3 = decide({ job: J("night_coach"), evidence: {}, consumption: { last_at: iso(3), kind: "spoken", by: "dugout" }, failures: {}, now: NOW });
  const c15 = decide({ job: J("night_coach"), evidence: {}, consumption: { last_at: iso(15), kind: "spoken", by: "dugout" }, failures: {}, now: NOW });
  const cNa = decide({ job: J("night_coach"), evidence: {}, consumption: { last_at: iso(15), kind: "spoken" }, failures: {}, now: NOW, forced: { until: iso(-14) } });
  assert("§5.5/3 — consumed (spoken) 3d ago ⇒ AWAKE; 15d ago ⇒ ASLEEP on C; his 'na' (forced until +14d) ⇒ AWAKE",
    c3.run === true && /spoken/.test(c3.why.C.detail) && c15.run === false && c15.why.C.ok === false && cNa.run === true && /forced awake/.test(cNa.why.C.detail));
  assert("§5.5/3 — an EXPIRED force is not a force",
    decide({ job: J("n"), evidence: {}, consumption: { last_at: iso(15) }, now: NOW, forced: { until: iso(1) } }).run === false);
  assert("§5.5/3 — the window is the job's own: window_days 30 keeps a 15d-old consumption awake",
    decide({ job: J("n", { gate: { window_days: 30 } }), evidence: {}, consumption: { last_at: iso(15) }, now: NOW }).run === true);

  // event-driven and first-run grace
  assert("EVENT — an event-driven lane passes C by construction (the event is the gate, not consumption)",
    decide({ job: J("probe_bank", { gate: { event: "lock" } }), evidence: {}, consumption: { last_at: null }, now: NOW }).why.C.ok === true);
  assert("FIRST RUN — a lane that has never run passes C (it must run once to be consumable); a lane that ran and was never consumed does NOT",
    decide({ job: J("prepare_tomorrow"), evidence: {}, consumption: { last_at: null, never_ran: true }, now: NOW }).run === true
    && decide({ job: J("teamtalk_pm"), evidence: {}, consumption: { last_at: null, never_ran: false }, now: NOW }).run === false);
  assert("EVENT + F — an event lane still sleeps on a 5-fail streak (the guard is universal)",
    decide({ job: J("probe_bank", { gate: { event: "lock" } }), evidence: {}, consumption: {}, failures: { streak: 5 }, now: NOW }).run === false);
  assert("EVENT MEASURED — event_armed:false (the runner saw no event since the last run) ⇒ ASLEEP unless consumed inside the window or forced; armed again ⇒ AWAKE",
    decide({ job: J("probe_bank", { gate: { event: "lock" } }), evidence: {}, consumption: { event_armed: false, last_at: null }, now: NOW }).run === false
    && /has not fired/.test(decide({ job: J("probe_bank", { gate: { event: "lock" } }), evidence: {}, consumption: { event_armed: false, last_at: null }, now: NOW }).why.C.detail)
    && decide({ job: J("probe_bank", { gate: { event: "lock" } }), evidence: {}, consumption: { event_armed: false, last_at: iso(3), kind: "sat" }, now: NOW }).run === true
    && decide({ job: J("probe_bank", { gate: { event: "lock" } }), evidence: {}, consumption: { event_armed: false, last_at: iso(30) }, now: NOW, forced: { until: iso(-1) } }).run === true
    && decide({ job: J("probe_bank", { gate: { event: "lock" } }), evidence: {}, consumption: { event_armed: true, last_at: null }, now: NOW }).run === true);

  // the folds
  const rows = [
    { ts: iso(20), job: "diary", kind: "briefed", by: "learnstate" },
    { ts: iso(2), lane: "day_cartridge", kind: "sat", by: "dugout" },
    { ts: iso(1), job: "diary", kind: "not-a-kind", by: "x" },
    { ts: "garbage", job: "diary", kind: "spoken" },
    { ts: iso(0.5), job: "diary", kind: "spoken", by: "dugout" },
  ];
  assert("consumptionOf — newest VALID row wins, by job OR lane, unknown kinds and undateable rows ignored",
    consumptionOf(rows, ["diary"]).kind === "spoken" && consumptionOf(rows, ["diary"]).by === "dugout"
    && consumptionOf(rows, ["day_cartridge"]).kind === "sat"
    && consumptionOf(rows, ["nothing"]).last_at === null);
  assert("consumptionOf — `before` cuts the fold (a decision replayed for a past slot sees only what was known then)",
    consumptionOf(rows, ["diary"], { before: iso(1) }).kind === "briefed");
  assert("everRan — boolean-ok rows are runs; skips are not",
    everRan([{ job: "a", budget_skip: true }], "a") === false && everRan([{ job: "a", ok: false }], "a") === true);
  assert("ALIASES — a lane whose rows carry several job names (dmn_rollout+dmn_counter) is one lane to everRan and failStreakOf",
    everRan([{ job: "dmn_rollout", ok: true }], ["dmn_rollout", "dmn_counter"]) === true
    && everRan([{ job: "dmn_rollout", ok: true }], "dmn") === false
    && failStreakOf([{ job: "dmn_rollout", ok: false }, { job: "dmn_counter", ok: false }], ["dmn_rollout", "dmn_counter"]) === 2);

  // THE FOLD — the fourth letter (Block 5.2)
  {
    const NC = J("night_coach", { folded_into: "prepare_tomorrow" });
    const base = { evidence: {}, consumption: { last_at: iso(1), kind: "briefed" }, failures: {}, now: NOW };
    const covered = decide({ ...base, job: NC, fold: { target: "prepare_tomorrow", covered: true, detail: "folded → prepare_tomorrow: its artifact for 2026-08-19 exists" } });
    const open = decide({ ...base, job: NC, fold: { target: "prepare_tomorrow", covered: false, detail: "its run for 2026-08-19 left no artifact (1 attempt, failed)" } });
    const noFact = decide({ ...base, job: NC });
    const plain = decide({ ...base, job: J("night_coach") });
    assert("FOLD — a folded lane whose target COVERED the day sleeps on D alone (E·C·F all hold), and the detail names the fold",
      covered.run === false && covered.why.E.ok && covered.why.C.ok && covered.why.F.ok && covered.why.D.ok === false
      && /folded → prepare_tomorrow/.test(covered.why.D.detail) && covered.fold && covered.fold.target === "prepare_tomorrow" && covered.fold.covered === true);
    assert("FOLD — the night the target fails or misses, D holds and the folded lane RUNS as the fallback (nothing deleted, no list edited); wakes_when says so",
      open.run === true && open.why.D.ok === true && /fold OPEN/.test(open.why.D.detail) && /left no artifact/.test(open.why.D.detail)
      && /fold opens by itself the night prepare_tomorrow fails or misses/.test(covered.wakes_when));
    assert("FOLD — a folded lane with NO runner fact is OPEN (fail-open: an unreadable fold never silences a lane); an unfolded lane says so",
      noFact.run === true && /fold is OPEN/.test(noFact.why.D.detail) && plain.why.D.ok === true && plain.why.D.detail === "not folded into another lane" && plain.fold === null);
    assert("FOLD — his `na` / `gate wake` (forced.until live) opens a COVERED fold — reversibility outranks the design; an expired force does not",
      decide({ ...base, job: NC, fold: { target: "prepare_tomorrow", covered: true }, forced: { until: iso(-14) } }).run === true
      && decide({ ...base, job: NC, fold: { target: "prepare_tomorrow", covered: true }, forced: { until: iso(1) } }).run === false);
    assert("FOLD — a covered fold never masks E/C/F: a lane asleep on C AND covered reports both letters",
      (() => { const v = decide({ job: NC, evidence: {}, consumption: { last_at: iso(30) }, failures: {}, now: NOW, fold: { target: "prepare_tomorrow", covered: true } }); return v.run === false && v.why.C.ok === false && v.why.D.ok === false; })());
    assert("foldOf — reads the job's own declaration, blanks are not folds",
      foldOf(NC) === "prepare_tomorrow" && foldOf({ folded_into: "  " }) === null && foldOf({}) === null && foldOf(null) === null);
  }

  // the sentences
  assert("consumptionHint — reads the job's own surface declaration, names the reader organ off its path",
    /learnstate\.mjs/.test(consumptionHint(J("d"))) && /phone|matchday/.test(consumptionHint({ surface: { kind: "sheet" } }))
    && /downstream/.test(consumptionHint({ surface: { kind: "job_input" } })) && consumptionHint({}) === "no surface declared");
  assert("wakesWhen — one clause per failed check, none for a passing one, and the CLI door is named on C and F",
    (() => { const w = wakesWhen({ job: J("x"), E: true, C: false, F: false }); return /gate wake x/.test(w) && !/exists again/.test(w) && w.split(" · ").length === 2; })());
  assert("PURITY — decide() with a string `now` and no failures/consumption objects still returns a total verdict (never throws)",
    (() => { try { const r = decide({ job: J("z"), now: "2026-08-18T00:00:00Z" }); return typeof r.run === "boolean" && r.why && r.why.C; } catch { return false; } })());
  assert("THIS ORGAN WRITES NOTHING — its source has no write call (the journal, the lane and the card belong to their owners)",
    !/writeFileSync|appendFileSync|renameSync|mkdirSync|unlinkSync/.test(readFileSync(new URL(import.meta.url), "utf8").replace(/^\/\/.*$/gm, "").replace(/assert\("THIS ORGAN WRITES NOTHING[^\n]*\n[^\n]*/m, "")));

  console.log(`\ngate selftest: ${pass} passed, ${fail} failed`);
  return fail === 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const mode = process.argv[2] || "selftest";
  if (mode === "selftest") process.exit(selftest() ? 0 : 1);
  console.log("gate: pure helper — `node scripts/gate.mjs selftest`; the verdicts live in `node scripts/brain.mjs status` (GATE section)");
}
