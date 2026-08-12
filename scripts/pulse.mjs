#!/usr/bin/env node
// ============================================================================
// pulse.mjs · ARSENAL AI FC — THE PULSE (12 Aug 2026)
//   ◇≤T LIVENESS LAW, IN CODE. Writes NOTHING (stateless by design, the herd
//   precedent) — it is a checker, and a checker that owns state needs a checker.
// ----------------------------------------------------------------------------
// WHY THIS EXISTS. Measured 12 Aug 2026: the suite held 4,341 assertions and
// ZERO of them were liveness — every one said "WHEN it runs, it is correct"
// (□P) and none said "it actually RAN and produced its artifact within T"
// (◇≤T P). Meanwhile the two loudest live faults were exactly that shape:
// diary (enabled, priority 10, nightly) had NEVER produced a page, and 42
// cards had arrived at λ≈6/day into a queue whose service rate was ZERO — he
// answered none, and nothing anywhere called either a defect. reconcile.mjs
// covers brain lanes only, surfaces at INFO (a level that never escalates),
// and NOTHING watched the watchman itself.
//
// THE LAW, one clause per lane family:
//   SCHEDULED LANES (schtasks): an enabled ArsenalFC task must have last run
//     within 2× its own period (one period to produce, one to notice — the
//     deadline is reconcile.mjs's own law, no new number). A task that has
//     NEVER run is the loudest class when its period is daily-or-faster; a
//     never-run weekly lane is a stated note (it may simply be younger than
//     its first Sunday — install dates are unknowable from schtasks).
//     Minute-lanes sleep with the laptop and catch up on wake
//     (StartWhenAvailable), so for them only NEVER-RAN and
//     scheduler-abandoned (stale AND no future NextRunTime) count.
//   BRAIN LANES: reconcile.mjs is the owner of that verdict; pulse SHELLS it
//     live (never trusts a stale report about staleness) and re-states its
//     bleeds as violations — never-produced with wired readers loudest.
//   HUMAN QUEUES (captains_call): arrivals with ZERO service in a rolling
//     week while cards sit open = queue-diverging (Little's law: λ>0, μ=0
//     has no steady state). His answer rate is reported alongside, never
//     demanded — the LAW is only that the machine's service lanes (retire,
//     TTL) keep the queue finite.
//   THE WATCHERS THEMSELVES: watchman_last.json (nightly ⇒ 48h) and
//     audit_ledger.jsonl's newest row (daily ⇒ 48h). This is the
//     who-watches-the-watchman wire: pulse shares no code with either, and
//     is itself run by BOTH (watchman probePulse nightly, audit daily) plus
//     the suite — kill any one of the three and another one names it.
//
// MEASURABILITY, fail-honest: on a machine with no ArsenalFC tasks and no
// watchman state (a CI checkout), `alive` prints NOT MEASURABLE and exits 0 —
// a bare clone cannot testify about his laptop. On his machine an unreadable
// schedule WITH watchman state present is itself a violation (fail-closed).
//
// LAWS: writes nothing · spawns only powershell Get-ScheduledTask (read-only)
//   and `node reconcile.mjs json` (read-only, exit-0-always) · selftest is
//   100% fixtures — no live read, no spawn.
// WHO ELSE ACTS ON THIS OUTPUT? watchman.mjs probePulse (nightly findings:
//   never-class RED, stale WARN) · audit.mjs daily run (violations → findings
//   → the one card) · organism_test.mjs `alive` mode (the suite's first
//   liveness assertions — RED on violation, on his machine only).
// CLI: node scripts/pulse.mjs [report|json|alive|selftest] [--no-reconcile]
// ============================================================================
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const STATE_DIR = process.env.ARSENAL_PULSE_STATE_DIR || join(ROOT, "dressing-room", "state");

let pass = 0, fail = 0; const fails = [];
const assert = (n, c, d) => { if (c) { pass++; console.log(`  ok   ${n}`); } else { fail++; fails.push({ n, d }); console.log(`  FAIL ${n}${d ? `\n         ${d}` : ""}`); } };

const readJson = (p) => { try { return JSON.parse(readFileSync(p, "utf8")); } catch { return null; } };
const HOUR = 3600 * 1000;

// ── THE SCHEDULE READ (live PowerShell; fixture via env for sandbox/selftest) ─
export function liveTasks() {
  const fx = process.env.ARSENAL_PULSE_TASKS_JSON;
  if (fx) { const j = readJson(fx); return j ? { source: "fixture", rows: j } : { source: "fixture (UNREADABLE)", rows: null }; }
  try {
    // PowerShell, not schtasks /fo csv — the csv encoding mangles under Git Bash
    // (herd.mjs measured 0 tasks on a box that has 50). DateTimes are stringified
    // IN PowerShell because ConvertTo-Json on PS5.1 emits \/Date(ms)\/ otherwise.
    const ps = `Get-ScheduledTask | Where-Object { $_.TaskName -like 'ArsenalFC*' } | ForEach-Object { $t=$_; $i=($t | Get-ScheduledTaskInfo); $tr=($t.Triggers | Select-Object -First 1); [pscustomobject]@{ name=$t.TaskName; state=[string]$t.State; last=$(if($i.LastRunTime -and $i.LastRunTime.Year -gt 2000){$i.LastRunTime.ToString('yyyy-MM-ddTHH:mm:ss')}else{''}); next=$(if($i.NextRunTime){$i.NextRunTime.ToString('yyyy-MM-ddTHH:mm:ss')}else{''}); result=$i.LastTaskResult; rep=[string]$tr.Repetition.Interval; di=$(if($tr -and $tr.PSObject.Properties['DaysInterval']){[int]$tr.DaysInterval}else{0}); wi=$(if($tr -and $tr.PSObject.Properties['WeeksInterval']){[int]$tr.WeeksInterval}else{0}) } } | ConvertTo-Json -Compress -Depth 3`;
    const out = execFileSync("powershell", ["-NoProfile", "-NonInteractive", "-Command", ps], { encoding: "utf8", timeout: 60000, windowsHide: true });
    const j = JSON.parse(out.trim() || "[]");
    return { source: "live schtasks", rows: (Array.isArray(j) ? j : [j]).filter(Boolean) };
  } catch (e) {
    return { source: "UNREADABLE", rows: null, error: String(e.message || e).slice(0, 120) };
  }
}

// Period in hours from a task row. PTnM/PTnH repetition wins (minute-lanes);
// then DaysInterval / WeeksInterval; a bare StartBoundary with neither is
// unknowable and returns null (reported, never guessed).
export function periodHours(row) {
  const rep = String(row.rep || "");
  let m = /^PT(\d+)M$/.exec(rep); if (m) return +m[1] / 60;
  m = /^PT(\d+)H$/.exec(rep); if (m) return +m[1];
  if (row.di > 0) return 24 * row.di;
  if (row.wi > 0) return 168 * row.wi;
  return null;
}

// One task row → verdict. `now` injected for fixtures.
export function taskVerdict(row, expectedDisabled, now = Date.now()) {
  if (String(row.state) === "Disabled") {
    return expectedDisabled.has(row.name)
      ? { name: row.name, class: "designed-off" }
      : { name: row.name, class: "off-unexpected", note: "disabled live but not expected_disabled — watchman's lane, named here for completeness" };
  }
  const p = periodHours(row);
  if (p == null) return { name: row.name, class: "period-unknown", note: "no repetition/daily/weekly trigger readable — cannot derive a deadline" };
  const lastMs = row.last ? Date.parse(row.last) : NaN;
  const nextMs = row.next ? Date.parse(row.next) : NaN;
  if (!Number.isFinite(lastMs)) {
    // NEVER-RAN: the diary class, on the schedule. Loud for daily-or-faster;
    // a weekly lane may just be younger than its first slot — stated, not red.
    return p <= 24
      ? { name: row.name, class: "never-ran", violation: true, period_h: p }
      : { name: row.name, class: "never-ran-weekly", note: `weekly lane with no run on record (period ${p}h) — young or dead, schtasks cannot say which`, period_h: p };
  }
  const ageH = (now - lastMs) / HOUR;
  if (p < 24) {
    // Minute-lanes sleep with the laptop; StartWhenAvailable catches them up.
    // Only a lane the SCHEDULER has abandoned (no future next run) is dead.
    if (ageH > 2 * p && !(Number.isFinite(nextMs) && nextMs > now))
      return { name: row.name, class: "abandoned", violation: true, age_h: +ageH.toFixed(1), period_h: p };
    return { name: row.name, class: "alive", age_h: +ageH.toFixed(1), period_h: p };
  }
  if (ageH > 2 * p) return { name: row.name, class: "stale", violation: true, age_h: +ageH.toFixed(1), period_h: p, deadline_h: 2 * p };
  return { name: row.name, class: "alive", age_h: +ageH.toFixed(1), period_h: p };
}

// ── BRAIN LANES via reconcile (the owner of that verdict) ────────────────────
export function brainLanes({ skip = false, reconcileJson = null } = {}) {
  if (skip) return { ran: false, violations: [] };
  let j = reconcileJson;
  if (!j) {
    try {
      const out = execFileSync(process.execPath, [join(HERE, "reconcile.mjs"), "json"], { encoding: "utf8", timeout: 120000, windowsHide: true });
      j = JSON.parse(out.trim());
    } catch (e) { return { ran: false, error: String(e.message || e).slice(0, 200), violations: [] }; }
  }
  const violations = [];
  for (const l of j.lanes || []) {
    if (!l.bleeds || !l.bleeds.length) continue;
    const never = l.files === 0;
    violations.push({
      name: `brain:${l.job}`, class: never ? "never-produced" : "stale", violation: true,
      consumers: (l.consumers || []).length, detail: l.bleeds.join(" · "),
    });
  }
  return { ran: true, violations, lanes_checked: j.lanes_checked ?? (j.lanes || []).length };
}

// ── THE QUEUE LAW (Little): arrivals with zero service diverge ───────────────
export function queueVerdict(cards, now = Date.now()) {
  const arr = Array.isArray(cards) ? cards : [];
  const W = 7 * 24 * HOUR;
  let open = 0, answeredEver = 0, filed7 = 0, served7 = 0;
  for (const c of arr) {
    const served = c.answered_at || c.retired_at;
    if (c.answered_at || c.answer) answeredEver++;
    if (!served && !(c.sleep_until && Date.parse(c.sleep_until) > now)) open++;
    const f = Date.parse(c.filed_at || 0);
    if (Number.isFinite(f) && now - f < W) filed7++;
    const s = Date.parse(served || 0);
    if (Number.isFinite(s) && now - s < W) served7++;
  }
  const diverging = open > 0 && filed7 > 0 && served7 === 0;
  return { total: arr.length, open, answered_ever: answeredEver, filed_7d: filed7, served_7d: served7, diverging };
}

// ── THE WATCHERS' OWN ARTIFACTS (who watches the watchman — this wire) ───────
export function watcherVerdicts(stateDir = STATE_DIR, now = Date.now()) {
  const out = [];
  const wm = join(stateDir, "watchman_last.json");
  if (!existsSync(wm)) out.push({ name: "watchman", class: "watcher-never", violation: true, detail: "watchman_last.json does not exist — the nightly sweep has never left a verdict here" });
  else {
    const ageH = (now - statSync(wm).mtimeMs) / HOUR;
    if (ageH > 48) out.push({ name: "watchman", class: "watcher-stale", violation: true, age_h: +ageH.toFixed(1), detail: `watchman_last.json is ${ageH.toFixed(0)}h old — nightly cadence allows 48h` });
    else out.push({ name: "watchman", class: "alive", age_h: +ageH.toFixed(1) });
  }
  const led = join(stateDir, "audit_ledger.jsonl");
  if (!existsSync(led)) out.push({ name: "audit", class: "watcher-never", violation: true, detail: "audit_ledger.jsonl does not exist — the daily audit has never recorded a run" });
  else {
    let newest = NaN;
    try {
      const lines = readFileSync(led, "utf8").split("\n").filter((l) => l.trim());
      for (let i = lines.length - 1; i >= 0 && i >= lines.length - 50; i--) {
        try { const t = Date.parse(JSON.parse(lines[i]).at); if (Number.isFinite(t)) { newest = t; break; } } catch { /* torn row — keep walking */ }
      }
    } catch { /* unreadable — handled below */ }
    if (!Number.isFinite(newest)) out.push({ name: "audit", class: "watcher-never", violation: true, detail: "audit_ledger.jsonl has no parseable dated row" });
    else {
      const ageH = (now - newest) / HOUR;
      if (ageH > 48) out.push({ name: "audit", class: "watcher-stale", violation: true, age_h: +ageH.toFixed(1), detail: `newest audit_ledger row is ${ageH.toFixed(0)}h old — daily cadence allows 48h` });
      else out.push({ name: "audit", class: "alive", age_h: +ageH.toFixed(1) });
    }
  }
  return out;
}

// ── THE WHOLE MODEL ──────────────────────────────────────────────────────────
export function model({ skipReconcile = false } = {}) {
  const now = process.env.ARSENAL_PULSE_NOW ? Date.parse(process.env.ARSENAL_PULSE_NOW) : Date.now();
  const sched = liveTasks();
  const expected = readJson(join(STATE_DIR, "tasks_expected.json"));
  const expectedDisabled = new Set((expected && expected.expected_disabled) || []);
  const haveWatchmanState = existsSync(join(STATE_DIR, "watchman_last.json"));
  // A CI checkout has neither the schedule nor the watchman's state: not measurable.
  if (!sched.rows && !haveWatchmanState) {
    return { measurable: false, why: `schedule ${sched.source}; no watchman state at ${STATE_DIR} — a bare checkout cannot testify about his laptop`, violations: [] };
  }
  const tasks = (sched.rows || []).map((r) => taskVerdict(r, expectedDisabled, now));
  const violations = tasks.filter((t) => t.violation);
  if (!sched.rows && haveWatchmanState) {
    violations.push({ name: "schedule", class: "schedule-unreadable", violation: true, detail: `live state present but Get-ScheduledTask failed (${sched.error || "unknown"}) — fail-closed: an unverifiable schedule is not a green one` });
  }
  const brain = brainLanes({ skip: skipReconcile });
  violations.push(...brain.violations);
  const cards = readJson(join(STATE_DIR, "captains_call.json"));
  const queue = queueVerdict(cards && (cards.cards || cards), now);
  if (queue.diverging) violations.push({ name: "captains_call", class: "queue-diverging", violation: true, detail: `${queue.open} open · ${queue.filed_7d} filed in 7d · ZERO served in 7d — λ>0 with μ=0 has no steady state` });
  const watchers = watcherVerdicts(STATE_DIR, now);
  violations.push(...watchers.filter((w) => w.violation));
  return { measurable: true, source: sched.source, tasks, brain, queue, watchers, violations };
}

const fmt = (v) => `  [${/never/.test(v.class) ? "NEVER" : v.class === "queue-diverging" ? "QUEUE" : "STALE"}] ${v.name} — ${v.detail || v.class}${v.age_h ? ` (age ${v.age_h}h)` : ""}${v.consumers ? ` · ${v.consumers} wired reader(s)` : ""}`;

function report(m) {
  console.log("== THE PULSE — ◇≤T liveness over every lane ==");
  if (!m.measurable) { console.log(`  NOT MEASURABLE HERE: ${m.why}`); return; }
  console.log(`  schedule: ${m.source} · ${m.tasks.length} task(s) · brain lanes ${m.brain.ran ? `checked (${m.brain.lanes_checked})` : `SKIPPED${m.brain.error ? ` (${m.brain.error})` : ""}`}`);
  console.log(`  queue: ${m.queue.open} open · filed(7d) ${m.queue.filed_7d} · served(7d) ${m.queue.served_7d} · HIS answers ever: ${m.queue.answered_ever}`);
  if (!m.violations.length) console.log("  ALIVE — every measurable lane inside its deadline.");
  else { console.log(`  ${m.violations.length} VIOLATION(S):`); for (const v of m.violations) console.log(fmt(v)); }
  const notes = m.tasks.filter((t) => t.note);
  for (const n of notes) console.log(`  note: ${n.name} — ${n.note}`);
}

// ── SELFTEST — fixtures only, no live read, no spawn ─────────────────────────
function selftest() {
  console.log("pulse selftest — the liveness law's own fixtures\n");
  const NOW = Date.parse("2026-08-12T12:00:00");
  // LOCAL wall-clock roundtrip, not toISOString().slice() — that emits UTC text
  // which Date.parse then reads as LOCAL, shifting every fixture by the machine
  // offset. That is the F9 class, and this selftest's first draft committed it.
  const iso = (hAgo) => { const d = new Date(NOW - hAgo * HOUR); const p = (n) => String(n).padStart(2, "0"); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`; };

  assert("PERIOD — PT30M repetition is half an hour, PT2H is two, daily is 24, weekly is 168, and a bare boundary is UNKNOWN never a guess",
    periodHours({ rep: "PT30M" }) === 0.5 && periodHours({ rep: "PT2H" }) === 2
    && periodHours({ rep: "", di: 1 }) === 24 && periodHours({ rep: "", di: 0, wi: 1 }) === 168
    && periodHours({ rep: "", di: 0, wi: 0 }) === null);

  const ed = new Set(["ArsenalFC-Mirror"]);
  assert("NEVER-RAN — a daily lane with no run on record is the loudest class (the diary class, on the schedule)",
    taskVerdict({ name: "T", state: "Ready", last: "", next: iso(-2), rep: "", di: 1, wi: 0 }, ed, NOW).class === "never-ran"
    && taskVerdict({ name: "T", state: "Ready", last: "", next: iso(-2), rep: "", di: 1, wi: 0 }, ed, NOW).violation === true);
  assert("NEVER-RAN weekly — stated as a note, never a violation (install dates are unknowable from schtasks)",
    taskVerdict({ name: "W", state: "Ready", last: "", next: iso(-24), rep: "", di: 0, wi: 1 }, ed, NOW).class === "never-ran-weekly"
    && !taskVerdict({ name: "W", state: "Ready", last: "", next: iso(-24), rep: "", di: 0, wi: 1 }, ed, NOW).violation);
  assert("THE 2x LAW — a daily lane 50h old is STALE (deadline 48h), 20h old is alive",
    taskVerdict({ name: "D", state: "Ready", last: iso(50), next: iso(-2), rep: "", di: 1, wi: 0 }, ed, NOW).class === "stale"
    && taskVerdict({ name: "D", state: "Ready", last: iso(20), next: iso(-2), rep: "", di: 1, wi: 0 }, ed, NOW).class === "alive");
  assert("MINUTE-LANES sleep with the laptop — 5h old with a FUTURE next run is alive-pending (catch-up owns it); 5h old with NO next run is ABANDONED",
    taskVerdict({ name: "M", state: "Ready", last: iso(5), next: iso(-1), rep: "PT30M", di: 0, wi: 0 }, ed, NOW).class === "alive"
    && taskVerdict({ name: "M", state: "Ready", last: iso(5), next: "", rep: "PT30M", di: 0, wi: 0 }, ed, NOW).class === "abandoned");
  assert("DESIGNED-OFF — an expected_disabled task is a decision, not a defect; an UNexpected disabled one is named",
    taskVerdict({ name: "ArsenalFC-Mirror", state: "Disabled", last: "", next: "", rep: "", di: 1, wi: 0 }, ed, NOW).class === "designed-off"
    && taskVerdict({ name: "X", state: "Disabled", last: "", next: "", rep: "", di: 1, wi: 0 }, ed, NOW).class === "off-unexpected");

  const mkCard = (fA, sA) => ({ filed_at: iso(fA), ...(sA != null ? { retired_at: iso(sA) } : {}) });
  assert("QUEUE LAW — open cards + arrivals + ZERO service in 7d = diverging (λ>0, μ=0)",
    queueVerdict([mkCard(24), mkCard(48), mkCard(400, 400)], NOW).diverging === true);
  assert("QUEUE LAW — one recent retirement is service: the machine lane keeps the queue finite, no violation",
    queueVerdict([mkCard(24), mkCard(48, 2)], NOW).diverging === false);
  assert("QUEUE LAW — an empty deck diverges nowhere",
    queueVerdict([], NOW).diverging === false && queueVerdict(null, NOW).open === 0);
  assert("QUEUE LAW — HIS answer count is reported, never demanded: answered_ever rides answered_at/answer only",
    queueVerdict([{ filed_at: iso(24), answered_at: iso(1), answer: "haan" }], NOW).answered_ever === 1
    && queueVerdict([mkCard(24, 1)], NOW).answered_ever === 0);

  assert("BRAIN LANES — a reconcile lane with files:0 and bleeds is NEVER-PRODUCED carrying its wired-reader count; a stale lane is stale; a clean lane is silent",
    (() => {
      const r = brainLanes({ reconcileJson: { lanes: [
        { job: "diary", files: 0, bleeds: ["never produced"], consumers: ["a", "b", "c"] },
        { job: "dreams", files: 1, bleeds: ["stale — 60h"], consumers: ["x"] },
        { job: "midday", files: 9, bleeds: [], consumers: [] },
      ] } });
      return r.violations.length === 2
        && r.violations[0].class === "never-produced" && r.violations[0].consumers === 3
        && r.violations[1].class === "stale";
    })());
  assert("BRAIN LANES — skip is honest: ran:false, zero violations invented",
    brainLanes({ skip: true }).ran === false && brainLanes({ skip: true }).violations.length === 0);

  // Watcher verdicts against a fixture dir: this file's own directory has no
  // watchman_last.json, which IS the watcher-never shape.
  const wv = watcherVerdicts(HERE, NOW);
  assert("WATCHERS — a directory with no watchman_last.json and no audit ledger reads watcher-never TWICE (fail-closed, never fail-quiet)",
    wv.filter((w) => w.class === "watcher-never").length === 2);

  console.log(`\npulse selftest: ${pass} passed, ${fail} failed`);
  return fail === 0;
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const mode = process.argv[2] || "report";
  const skipReconcile = process.argv.includes("--no-reconcile");
  if (mode === "selftest") process.exit(selftest() ? 0 : 1);
  else if (mode === "json") console.log(JSON.stringify(model({ skipReconcile }), null, 1));
  else if (mode === "alive") {
    const m = model({ skipReconcile });
    report(m);
    // NOT MEASURABLE exits 0 — a bare checkout cannot testify. Violations exit 1:
    // these are the suite's first liveness assertions, and they FAIL on violation.
    process.exit(m.measurable && m.violations.length ? 1 : 0);
  }
  else if (mode === "report") report(model({ skipReconcile }));
  else { console.error(`pulse: unknown mode "${mode}" — modes: report | json | alive | selftest`); process.exit(1); }
}
