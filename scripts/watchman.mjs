#!/usr/bin/env node
// ============================================================================
// watchman.mjs · ARSENAL AI FC — THE NIGHT WATCHMAN (who watches the watchers)
// ----------------------------------------------------------------------------
// WHY THIS EXISTS (BRIEF__self_sustaining_organism.md §6.1, and his words that
// authorised it, 6 Aug 2026):
//   "mein yahi thodi dekhta rahunga ab that are you following the standard
//    correctly or gemini is following it correctly or is machine doing
//    everything correctly?"
//   "let brain fix things by itself, keep me out of this picture, that's
//    organism job to self sustain itself"
//
// On 6 Aug two organs failed in one day and BOTH were caught by the human:
// teaching_audit.mjs was dead behind a green 25/25 selftest (a reader that
// expected a `.session` wrapper), and the context gauge cried wolf at 23% real
// fill. Their common shape: every organ reports its own health, and nothing
// asked whether the reporter was alive or measuring the right thing. The whole
// §5.1 failure was catchable by `ls` — teaching_audit.jsonl did not exist — and
// nobody asked. This organ asks. Every night.
//
// WHAT MAKES IT DIFFERENT from the physio (staleness of state files vs their
// cadence) and organism_test.mjs (cross-organ invariants, run BY HAND):
//   1. CONDITIONAL LIVENESS — "did the organ that was supposed to produce output
//      today produce any?" is a pairing of evidence-of-input with expected
//      output. The physio's own NEVER-BORN law (a file that never existed is not
//      a wound) is exactly why the dead audit was invisible to it: its log had
//      never been born. Conditional expectation sees through that — teaching
//      afferents landed today + a forge session is open ⇒ audit rows MUST exist.
//   2. LIAR DETECTION — an organ's self-report cross-checked against the state
//      it reports on. teaching_audit_last.json saying "no open forge session"
//      while forge_session.json sits open IS §5.1's exact signature, on disk,
//      every single day it was dead. One comparison would have caught it on day
//      one. Now it is comparison c2, nightly.
//   3. IT RUNS ITSELF — nightly via Task Scheduler, and it ESCALATES: findings
//      trigger a Tier-2 repair run per his two-tier ruling (§7.2).
//
// THE TWO RULINGS THIS IMPLEMENTS (his words, 6 Aug 2026 — recorded in the brief):
//   §7.1 "let brain fix things by itself … do not keep me in the loop"
//      → Tier 2 repairs without asking, INSIDE the self-repair lane only (organs
//        and their state), with the two engineering constraints that ruling
//        converts into: every change REVERSIBLE (git commit per change, prefix
//        "watchman-repair:", revert path recorded at change time) and every
//        change LOGGED with the evidence that triggered it
//        (dressing-room/state/watchman_repairs.jsonl). Never the learning
//        content, never capsules/, never canonical .md files, never his staged
//        drift queue.
//   §7.2 "i think it should be checked everyday at night" · "keep it on max"
//      → TIER 1 (this file, `run`): deterministic, zero-LLM, free — file checks,
//        comparisons, one selftest sweep, one task-result sweep.
//      → TIER 2 (`claude -p --model claude-opus-5 --effort max`): spawned ONLY
//        when Tier 1 found something, at most once per local day. A clean night
//        costs nothing; a bad night gets the full model. This split is what
//        makes nightly-at-max affordable — M-3's billing guards do not exist
//        yet, so the split IS the guard.
//
// QUIET vs DEAD (§7.3, the design problem, answered here): an organ is expected
// to have produced output ONLY when its preconditions are on disk — afferents
// captured, a session open, rows appended. No afferents today = a day off, not a
// death; that is the conditional in every check below, and it is why this organ
// can be silent-when-clean without silence ever meaning dead. Its OWN death is
// covered the same way: `brief` (SessionStart, a surface he already reads §7.4)
// says so out loud when the nightly run is missing — the watcher announces its
// own absence, which is the one regress level this design closes; the level
// above it (hooks themselves dead) is covered by c4's capture check the next
// night, and the level above THAT is him noticing no kickoff block at all.
//
// COVERAGE HONESTY (§5.7 · §6.2): `report` states what is NOT covered — the
// Gemini surface has NO compliance check (nothing deterministic can audit
// teaching turns that never reach this machine; reps arrive shape-validated by
// capture.mjs but teaching quality is unmeasured until Gemini transcripts flow
// into the afferent bus), and the teaching audit covers only CHECKED_RULES.
// Stated, not fixed silently — "no finding" must never read as "all covered".
//
// LAWS: deterministic Tier 1, no LLM, no guessed thresholds — every check is a
// comparison or a presence test; the two numbers it carries (STALE_HOURS=18,
// suite timeout ceiling) are mirrored from their owners, not invented. Single
// writer of watchman_last.json + watchman.jsonl + watchman_repairs.jsonl +
// watchman_tier2_prompt.txt. READ-ONLY on everything else. `brief` is hook-safe:
// fail-silent, exit 0, ARSENAL_ORGAN-guarded.
// MODES: run [--no-tier2] [--skip-suite] | brief | report | selftest
// ============================================================================

import { readFileSync, writeFileSync, existsSync, appendFileSync, mkdirSync, statSync, renameSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn, spawnSync } from "node:child_process";
import net from "node:net";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const STATE_DIR = join(ROOT, "dressing-room", "state");
const FORGE = join(STATE_DIR, "forge_session.json");
const CONTRACT = join(STATE_DIR, "teaching_contract.json");
const AUDIT_LAST = join(STATE_DIR, "teaching_audit_last.json");
const AUDIT_LOG = join(STATE_DIR, "teaching_audit.jsonl");
const AFFERENT = join(STATE_DIR, "afferent.jsonl");
const LAST = join(STATE_DIR, "watchman_last.json");
const LOGJ = join(STATE_DIR, "watchman.jsonl");
const REPAIR_LOG = join(STATE_DIR, "watchman_repair.log");
const REPAIR_JOURNAL = join(STATE_DIR, "watchman_repairs.jsonl");
const TIER2_PROMPT_FILE = join(STATE_DIR, "watchman_tier2_prompt.txt");

// Mirrored from forge_session.mjs STALE_HOURS (its number, not a new one — line ref
// dropped 9 Aug: it had already rotted once): past this the
// pacer calls a session STALE and goes silent. The auditor deliberately does NOT
// gate on it (his "sab audit, no gates" ruling) — which is exactly why a
// forgotten-open session is worth a nightly INFO line.
const STALE_HOURS = 18;
// A CEILING on the selftest sweep, not a judgement — organism_test spawns 60+
// organs independently; this only stops a hung child from holding the night.
const SUITE_TIMEOUT_MS = 15 * 60 * 1000;

const readJson = (p) => { try { return JSON.parse(readFileSync(p, "utf8")); } catch { return null; } };
const localDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
// A row belongs to the day the captain lived, not the day UTC was having — the
// same IST lesson physio.mjs learned on 25 Jul (finding 87f8f8da).
const localDayOf = (ts) => {
  const d = new Date(String(ts || ""));
  return Number.isFinite(d.getTime()) ? localDate(d) : null;
};

// ---------------------------------------------------------------------------
// GATHER — one read pass over the bus, into a plain object the checks consume.
// Checks are pure(world) so the selftest can hand them fixtures; gather() is the
// only place Tier 1 touches disk.
// ---------------------------------------------------------------------------
export function gather(now = new Date()) {
  const today = localDate(now);
  const w = {
    now: now.toISOString(), today,
    forge: { exists: existsSync(FORGE), json: null, shapeless: false },
    contract: { exists: existsSync(CONTRACT), json: null, unreadable: false },
    auditLast: readJson(AUDIT_LAST),
    affToday: { total: 0, teaching: 0, readable: existsSync(AFFERENT) },
    auditRowsToday: 0,
    auditLogExists: existsSync(AUDIT_LOG),
    // THE OPPONENT PAIR (7 Aug 2026, captain's market_scan ruling). OPPONENT_SCOUT.md
    // is canon; dossier_weights.json is its machine projection (the projection's own
    // _comment says so), and SEVEN organs read only the projection — setpiece, scout,
    // nightshift, dugout, scorer, forge_session (teaching line), the demo sandbox.
    // mtimeMs of each side, null when absent; the comparison lives in checks().
    scout_pair: {
      canon_mtime: (() => { try { return statSync(join(ROOT, "learning-layer", "OPPONENT_SCOUT.md")).mtimeMs; } catch { return null; } })(),
      projection_mtime: (() => { try { return statSync(join(STATE_DIR, "dossier_weights.json")).mtimeMs; } catch { return null; } })(),
    },
  };
  // c9's inputs (7 Aug 2026, live-fire). The maiden Tier-2 child worked for six
  // minutes and died writing NOTHING — no output, no journal, no commit — and only
  // a human noticed. The EXIT stamp (tier2CmdLine) plus these three facts make
  // that death machine-visible the following night.
  w.tier2_trail = { last_start: null, exit_after_start: false, journal_after_start: false };
  try {
    if (existsSync(REPAIR_LOG)) {
      const log = readFileSync(REPAIR_LOG, "utf8");
      const starts = [...log.matchAll(/^== (\S+) :: TIER 2 START/gm)];
      if (starts.length) {
        const last = starts[starts.length - 1];
        w.tier2_trail.last_start = last[1];
        w.tier2_trail.exit_after_start = /TIER2 EXIT \d+/.test(log.slice(last.index));
        if (existsSync(REPAIR_JOURNAL)) {
          for (const line of readFileSync(REPAIR_JOURNAL, "utf8").split("\n")) {
            try { if (JSON.parse(line).ts >= last[1]) { w.tier2_trail.journal_after_start = true; break; } } catch {}
          }
        }
      }
    }
  } catch { /* an unreadable trail = no claim */ }
  if (w.forge.exists) {
    const j = readJson(FORGE);
    if (j && typeof j === "object" && !Array.isArray(j) && j.concept) w.forge.json = j;
    else w.forge.shapeless = true;
  }
  if (w.contract.exists) {
    const j = readJson(CONTRACT);
    if (j && typeof j === "object" && !Array.isArray(j) && Array.isArray(j.rules)) w.contract.json = j;
    else w.contract.unreadable = true;
  }
  try {
    if (w.affToday.readable) {
      for (const line of readFileSync(AFFERENT, "utf8").split("\n")) {
        if (!line.trim()) continue;
        try {
          const r = JSON.parse(line);
          if (localDayOf(r.ts) === today) {
            w.affToday.total++;
            if (r.source === "claude-code-teaching") w.affToday.teaching++;
          }
        } catch { /* a mangled line is skipped, never fatal */ }
      }
    }
  } catch { w.affToday.readable = false; }
  try {
    if (w.auditLogExists) {
      for (const line of readFileSync(AUDIT_LOG, "utf8").split("\n")) {
        if (!line.trim()) continue;
        try { if (localDayOf(JSON.parse(line).ts) === today) w.auditRowsToday++; } catch {}
      }
    }
  } catch { /* absent = 0 rows, which is exactly what c1 tests */ }
  // THE OUTWARD LOOP (8 Aug 2026, Ruling 5 edges) — the ≥2×/week floor's inputs
  // (HIS ruled 2, never a guess) + gemini_quality's honesty count. Reads only.
  w.gemini_quality = { rows: 0 };
  try {
    const gq = join(STATE_DIR, "gemini_quality.jsonl");
    if (existsSync(gq)) w.gemini_quality.rows = readFileSync(gq, "utf8").split("\n").filter((l) => l.trim()).length;
  } catch { /* unreadable = 0 recorded — c-gemini stays quiet */ }
  w.outward = { has_desk: existsSync(join(STATE_DIR, "missions.json")), returns7d: 0, benchRuns7d: 0 };
  try {
    const mj = readJson(join(STATE_DIR, "missions.json"));
    const bj = readJson(join(STATE_DIR, "benchmark.json"));
    const cutoff = now.getTime() - 7 * 86400000;
    const inWin = (iso) => { const t = Date.parse(iso || ""); return Number.isFinite(t) && t >= cutoff && t <= now.getTime(); };
    w.outward.returns7d = ((mj && mj.events) || []).filter((e) => (e.kind === "ingest" || e.kind === "audit_close") && inWin(e.ts)).length;
    w.outward.benchRuns7d = ((bj && bj.runs) || []).filter(inWin).length;
  } catch { /* unreadable desks make no floor claim */ }
  return w;
}

// ---------------------------------------------------------------------------
// TIER 1 — the pure checks. Each returns a finding {id, level, finding, evidence}
// or null. Levels: DEAD (an organ that had work and did none) · LIAR (an organ's
// self-report contradicts the state it reports on) · RED (broken wire/red suite/
// failed task) · INFO (worth a line, not an escalation).
// ---------------------------------------------------------------------------
export function checks(w) {
  const F = [];
  const forgeOpen = !!(w.forge.json && !w.forge.json.closed_at);
  const stopAt = w.auditLast && w.auditLast.stop ? w.auditLast.stop : null;

  // c1 · CONDITIONAL LIVENESS — the §5.1 class, the check nobody made. Teaching
  // afferents landed today AND a forge session is open ⇒ the auditor MUST have
  // appended rows today. No afferents = day off = correctly quiet (NEVER-BORN
  // stays true for genuinely workless days; it just can't hide a working day).
  if (forgeOpen && w.affToday.teaching > 0 && w.auditRowsToday === 0) {
    F.push({
      id: "audit-dead", level: "DEAD",
      finding: "teaching turns were captured today with a forge session open, and the compliance auditor logged ZERO rows",
      evidence: `claude-code-teaching afferents today: ${w.affToday.teaching} · forge '${w.forge.json.concept}' open (no closed_at) · ${w.auditLogExists ? "teaching_audit.jsonl has no row dated today" : "teaching_audit.jsonl does not exist"} — the exact §5.1 silence, re-caught`,
    });
  }

  // c2 · LIAR — the auditor's own last-run record vs the file it gates on. This
  // single comparison, run any day between 6 Aug's ship and its discovery, would
  // have caught the dead reader on day one.
  if (forgeOpen && stopAt && stopAt.audited === false && /no open forge session/i.test(String(stopAt.why || ""))) {
    F.push({
      id: "audit-liar", level: "LIAR",
      finding: "the auditor's last run concluded 'no open forge session' while forge_session.json sits open — reader and writer disagree about the same file",
      evidence: `teaching_audit_last.stop = ${JSON.stringify(stopAt)} · forge '${w.forge.json.concept}' open since ${w.forge.json.started_at}`,
    });
  }

  // c3 · HEARTBEAT WIRE — audited rows landed today, so the checked_at stamp
  // (teaching_contract.json, read by every forge close since audit #40) must be
  // today's. Rows without a stamp = the wire broke between the two organs.
  if (w.auditRowsToday > 0 && w.contract.json && localDayOf(w.contract.json.checked_at) !== w.today) {
    F.push({
      id: "heartbeat-broken", level: "RED",
      finding: "the auditor logged rows today but teaching_contract.checked_at was not stamped today — the close report will call a measured day NOT MEASURED",
      evidence: `audit rows today: ${w.auditRowsToday} · checked_at: ${w.contract.json.checked_at || "(absent)"}`,
    });
  }

  // c4 · THE CAPTURE PAIR — hooks and the afferent bus vouch for each other.
  //   a) the audit hook wrote today but zero afferents landed → thalamus/capture dead.
  //   b) afferents landed today but the audit hook never wrote → the Stop wire to
  //      the auditor is dead (this is what tonight's install would look like if
  //      the settings.json edit were wrong).
  if (stopAt && localDayOf(stopAt.at) === w.today && w.affToday.total === 0) {
    F.push({
      id: "capture-dead", level: "RED",
      finding: "the audit hook fired today but ZERO afferents landed — the capture nerve or the thalamus is down",
      evidence: `teaching_audit_last.stop.at ${stopAt.at} · afferent rows today: 0 (${w.affToday.readable ? "file readable" : "afferent.jsonl unreadable"})`,
    });
  }
  if (w.affToday.total > 0 && (!stopAt || localDayOf(stopAt.at) !== w.today)) {
    F.push({
      id: "audit-hook-dead", level: "RED",
      finding: "afferents landed today but the auditor's Stop hook never wrote its last-run record — the wire from settings.json to teaching_audit.mjs is dead",
      evidence: `afferent rows today: ${w.affToday.total} · teaching_audit_last.stop.at: ${stopAt ? stopAt.at : "(never written)"}`,
    });
  }

  // c4b · THE PROJECTION LAG (7 Aug 2026 — the market_scan ruling's integrity
  // guard). The captain reads a market proposal and edits OPPONENT_SCOUT.md; if
  // dossier_weights.json is not regenerated to match, every drill, probe bank,
  // scrimmage and teaching line keeps running on the OLD opponent — a canon edit
  // that changes nothing, silently. Binary mtime comparison, no threshold: this
  // sweep runs at 23:55, so any lag it sees has already survived the whole day
  // (a mid-morning edit projected by evening never fires). Both mtimes print,
  // so a git-touch false positive is diagnosable on sight.
  if (w.scout_pair && w.scout_pair.canon_mtime != null && w.scout_pair.projection_mtime != null
      && w.scout_pair.canon_mtime > w.scout_pair.projection_mtime) {
    F.push({
      id: "projection-stale", level: "RED",
      finding: "OPPONENT_SCOUT.md moved after dossier_weights.json — the canon changed and its machine projection did not, so all seven dossier readers are running on the old opponent",
      evidence: `canon mtime ${new Date(w.scout_pair.canon_mtime).toISOString()} > projection mtime ${new Date(w.scout_pair.projection_mtime).toISOString()} — regenerate dossier_weights.json from OPPONENT_SCOUT.md (its _comment names the doc as source of truth)`,
    });
  }

  // c5 · SHAPE CONTRACTS — the PROBLEM-1 class: a file that exists but no longer
  // parses the way its readers expect. Both files here have single owners whose
  // load() would silently degrade; the watchman is what makes that loud.
  if (w.forge.shapeless) {
    F.push({
      id: "forge-shapeless", level: "RED",
      finding: "forge_session.json exists but is unreadable or shapeless (no concept) — every reader is silently degrading",
      evidence: "JSON.parse failed, or the parsed object is not {concept, ...} — the reader/writer contract is broken",
    });
  }
  if (w.contract.unreadable) {
    F.push({
      id: "contract-unreadable", level: "RED",
      finding: "teaching_contract.json exists but is unreadable — the contract organ is running on an in-memory seed and REFUSING saves (by design) until this is repaired",
      evidence: "JSON.parse failed or rules[] missing; the on-disk bytes still hold his data — do not reseed by hand, repair the file",
    });
  }

  // c9 · TIER-2 VANISHED (7 Aug 2026, from the maiden live-fire). A repair child
  // that started on a PREVIOUS day and left neither an EXIT stamp nor a journal
  // row died silently mid-repair — the repair arm's own §5.1. Same-day starts are
  // exempt (the child may legitimately still be running tonight's repair).
  if (w.tier2_trail && w.tier2_trail.last_start
      && localDayOf(w.tier2_trail.last_start) !== w.today
      && !w.tier2_trail.exit_after_start && !w.tier2_trail.journal_after_start) {
    F.push({
      id: "tier2-vanished", level: "RED",
      finding: "a Tier-2 repair child started on a previous day and left NO exit stamp and NO journal row — the repair arm died silently mid-run (the maiden-run class: minutes of work, zero bytes of trace)",
      evidence: `last TIER 2 START ${w.tier2_trail.last_start} · no "TIER2 EXIT" line after it in watchman_repair.log · no watchman_repairs.jsonl row at-or-after it`,
    });
  }

  // c10 · THE OUTWARD FLOOR (outward loop, 8 Aug 2026 — Ruling 2's ≥2×/week is
  // HIS ruled number). INFO, never an escalation: the floor nudges, it never owes.
  // Fires only once the missions desk EXISTS — before that there is no outward
  // machinery to have a floor about.
  if (w.outward && w.outward.has_desk && (w.outward.returns7d + w.outward.benchRuns7d) < 2) {
    F.push({
      id: "outward-floor-unmet", level: "INFO",
      finding: `outward checks this week: ${w.outward.returns7d + w.outward.benchRuns7d}/2 (his 7 Aug floor) — mission returns ${w.outward.returns7d} · benchmark runs ${w.outward.benchRuns7d}`,
      evidence: "missions.json events (ingest/audit_close) + benchmark.json runs[], trailing 7 local days",
    });
  }

  // c11 · GEMINI-QUALITY HONESTY (P6.1's outcome lane — Ruling 5 gave it its first
  // reader). Recorded batches are NAMED, and named as UNJUDGED: no number gets a
  // verdict before the 30-45d review (his 1 Aug rule).
  if (w.gemini_quality && w.gemini_quality.rows > 0) {
    F.push({
      id: "gemini-quality-recorded", level: "INFO",
      finding: `gemini_quality: ${w.gemini_quality.rows} paste-batch(es) recorded — judged by NO ONE until the 30-45d review (his rule); the lane exists so that review has data`,
      evidence: "dressing-room/state/gemini_quality.jsonl (writer: capture.mjs paste door)",
    });
  }

  // c8 · STALE FORGE SESSION — open past the pacer's own STALE_HOURS. The pacer
  // goes silent there; the auditor (per his sab-audit ruling) does not. Worth a
  // line, not an escalation: closing a session is HIS move.
  if (forgeOpen && w.forge.json.started_at) {
    const hrs = (Date.parse(w.now) - Date.parse(w.forge.json.started_at)) / 3.6e6;
    if (Number.isFinite(hrs) && hrs > STALE_HOURS) {
      F.push({
        id: "forge-stale-open", level: "INFO",
        finding: `forge session '${w.forge.json.concept}' has been open ${hrs.toFixed(1)}h (pacer calls >${STALE_HOURS}h stale and goes silent; the auditor keeps auditing every session machine-wide until it is closed)`,
        evidence: `started_at ${w.forge.json.started_at} — \`node scripts/forge_session.mjs close\` is the only thing that saves the coverage report`,
      });
    }
  }

  return F;
}

// ---------------------------------------------------------------------------
// TIER 1 — the two ACTIVE probes (spawn things; run-mode only, never in checks()
// so the selftest stays hermetic and fast).
// ---------------------------------------------------------------------------

// The selftest sweep. organism_test.mjs `all` is already the authority (it runs
// every member of both package.json suites INDEPENDENTLY — its own _runner_law);
// the watchman's job is only to RUN it nightly and read the exit code, which is
// precisely what "a selftest nobody runs is a hypothesis" (issue #75) asks for.
function probeSuite() {
  try {
    // ARSENAL_ORGAN is explicitly STRIPPED, never set: the suite sandboxes organs
    // like learnstate whose hook-safe commands exit silently under the organ guard
    // — running the suite AS an organ made exactly those assertions fail. Caught by
    // this file's own first live run (7 Aug 2026): the watchman's maiden sweep
    // reported suite-red, and the red was the watchman's own env. The suite is the
    // organism testing itself, not an organ talking to the bus.
    const env = { ...process.env };
    delete env.ARSENAL_ORGAN;
    const r = spawnSync(process.execPath, [join(__dirname, "organism_test.mjs"), "all"],
      { timeout: SUITE_TIMEOUT_MS, encoding: "utf8", env });
    if (r.error) {
      return { id: "suite-unrunnable", level: "RED", finding: "the cross-organ test suite could not run at all", evidence: String(r.error) };
    }
    if (r.status !== 0) {
      const tail = String(r.stdout || "").trim().split("\n").slice(-15).join("\n");
      return {
        id: "suite-red", level: "RED",
        finding: "the nightly selftest sweep (organism_test.mjs all) is RED",
        evidence: `exit ${r.status} · last lines:\n${tail}`,
      };
    }
    return null;
  } catch (e) {
    return { id: "suite-unrunnable", level: "RED", finding: "the cross-organ test suite could not run at all", evidence: String(e) };
  }
}

// The scheduled-task sweep. LastTaskResult ≠ 0 on an enabled ArsenalFC task is an
// organ that errored at the scheduler level — the layer below every file this
// organ reads (live example on install night: SelfKnowledge at 2147946720 for
// four days, surfaced by nothing). Status codes that mean "hasn't run yet" or
// "running right now" are not errors and are excluded by name, not by guess:
// 0x41303 = never yet run · 0x41301 = currently running.
const TASK_STATUS_NOT_ERRORS = new Set([0, 0x41303, 0x41301]);
const TASK_NEVER_RAN = 0x41303;

// A DAILY task whose last run is older than yesterday MISSED at least one whole
// schedule — no threshold invented, the cadence is the task's own trigger
// (DaysInterval=1). This is the check that would have caught 6 Aug: the
// Morning-Conductor skipped a day (StartWhenAvailable and all), the whole
// sensory lane served day-old state on the one day he actually studied, and the
// physio's 30h cadence window is structurally blind to a single missed morning
// (stale-by-25h at the 21:50 sweep is inside every 30h grace). Weekly tasks are
// exempt by construction — their DaysInterval is not 1. Pure, so the selftest
// drives it with fixtures.
export function missedDailyTasks(rows, today, yesterday) {
  return (Array.isArray(rows) ? rows : []).filter((t) =>
    t && t.daily === true
    && typeof t.result === "number" && t.result !== TASK_NEVER_RAN
    && typeof t.last === "string" && /^\d{4}-\d{2}-\d{2}$/.test(t.last)
    && t.last < yesterday);
}

function probeTasks(today, yesterday) {
  try {
    const ps = spawnSync("powershell", ["-NoProfile", "-Command",
      "Get-ScheduledTask | Where-Object {$_.TaskName -like 'ArsenalFC-*' -and $_.State -ne 'Disabled'} | ForEach-Object { $i = $_ | Get-ScheduledTaskInfo; $di = ($_.Triggers | Where-Object {$_.PSObject.Properties['DaysInterval'] -and $_.DaysInterval} | Select-Object -First 1).DaysInterval; [PSCustomObject]@{name=$_.TaskName; result=$i.LastTaskResult; last=$i.LastRunTime.ToString('yyyy-MM-dd'); daily=($di -eq 1)} } | ConvertTo-Json -Compress"],
      { timeout: 60000, encoding: "utf8" });
    if (ps.error || ps.status !== 0) return [];   // no scheduler read = no claim, never a fabricated finding
    let rows = [];
    try { const j = JSON.parse(String(ps.stdout || "").trim() || "[]"); rows = Array.isArray(j) ? j : [j]; } catch { return []; }
    const out = [];
    const bad = rows.filter((t) => t && typeof t.result === "number" && !TASK_STATUS_NOT_ERRORS.has(t.result));
    if (bad.length) {
      out.push({
        id: "task-errors", level: "RED",
        finding: `${bad.length} enabled scheduled organ(s) errored on their last run`,
        evidence: bad.map((t) => `${t.name}: result ${t.result} (last ${t.last})`).join(" · "),
      });
    }
    const missed = missedDailyTasks(rows, today, yesterday);
    if (missed.length) {
      out.push({
        id: "task-missed", level: "RED",
        finding: `${missed.length} DAILY organ(s) have not run since before yesterday — a whole schedule was skipped and every reader of their output is on stale state`,
        evidence: missed.map((t) => `${t.name}: last ran ${t.last}`).join(" · ") + " — the 6 Aug class: the morning lane silently skipped the one day he studied",
      });
    }
    return out;
  } catch { return []; }
}

// The outwork behavioural sweep (P8.2, 7 Aug 2026). outwork_audit.mjs asks the
// question this file deliberately does not — not "did the organ run" but "did
// the DAY do its job": full-time close, the KAL→kickoff weld, the honest-review
// paper trail, the 3-bucket split, season/post_match agreement. Spawned like
// probeSuite so the two layers ride ONE schedule; its findings merge into the
// same night's report and gate. A spawn failure is a finding, never a silence.
function probeOutwork() {
  try {
    const r = spawnSync(process.execPath, [join(__dirname, "outwork_audit.mjs"), "run", "--json"],
      { timeout: 60000, encoding: "utf8" });
    if (r.error || r.status !== 0) {
      return [{ id: "outwork-audit-unrunnable", level: "RED", finding: "the outwork behavioural audit could not run", evidence: String(r.error || `exit ${r.status}: ${String(r.stderr || "").slice(0, 200)}`) }];
    }
    const j = JSON.parse(String(r.stdout || "[]").trim() || "[]");
    return Array.isArray(j) ? j : [];
  } catch (e) {
    return [{ id: "outwork-audit-unrunnable", level: "RED", finding: "the outwork behavioural audit could not run", evidence: String(e) }];
  }
}

// D3 (9 Aug 2026, launch worklist): reconcile.mjs — the produce-and-consume
// instrument the 2 Aug audit said would have caught most of that audit — was
// itself unproduced-for: no schedule, no hook, no skill ever ran it, and its
// reconcile.json had zero readers. Same ride as the outwork audit ("one
// schedule, two layers, zero new tasks"): the nightly watchman runs it and
// surfaces its BLEEDS as INFO findings (reconcile's own exit-0 law means the
// verdict rides the JSON, never the exit code).
function probeReconcile() {
  try {
    const r = spawnSync(process.execPath, [join(__dirname, "reconcile.mjs"), "json"],
      { timeout: 60000, encoding: "utf8" });
    if (r.error || r.status !== 0) {
      return [{ id: "reconcile-unrunnable", level: "WARN", finding: "the produce-and-consume reconciliation could not run", evidence: String(r.error || `exit ${r.status}: ${String(r.stderr || "").slice(0, 200)}`) }];
    }
    const j = JSON.parse(String(r.stdout || "{}").trim() || "{}");
    // live shape (verified 9 Aug): lanes_bleeding count + lanes[] rows with .bleeds[],
    // plus orphans[] for state files nobody reads.
    const rows = [];
    for (const lane of (Array.isArray(j.lanes) ? j.lanes : [])) {
      for (const b of (Array.isArray(lane.bleeds) ? lane.bleeds : [])) {
        rows.push(`${lane.job || lane.out || "?"}: ${typeof b === "string" ? b : JSON.stringify(b).slice(0, 120)}`);
      }
    }
    for (const o of (Array.isArray(j.orphans) ? j.orphans : [])) {
      rows.push(`orphan state file (no reader): ${typeof o === "string" ? o : (o.file || JSON.stringify(o).slice(0, 100))}`);
    }
    return rows.slice(0, 5).map((line, i) => ({
      id: `reconcile-bleed-${i + 1}`, level: "INFO",
      finding: line,
      evidence: "reconcile.mjs json — full report in dressing-room/state/reconcile.json",
    })).concat(rows.length > 5 ? [{ id: "reconcile-bleed-more", level: "INFO", finding: `${rows.length - 5} more reconcile bleed(s) — read reconcile.json`, evidence: "cap keeps the night readable; nothing is dropped from the file" }] : []);
  } catch (e) {
    return [{ id: "reconcile-unrunnable", level: "WARN", finding: "the produce-and-consume reconciliation could not run", evidence: String(e) }];
  }
}

// ---------------------------------------------------------------------------
// TIER 2 — escalation, per his §7.1/§7.2 rulings. Fires ONLY on non-INFO
// findings, at most once per local day, detached so the nightly task never
// hangs on a model run. ARSENAL_ORGAN=1 so the child's own hooks stay silent
// and its transcript is never captured as the captain's words.
// ---------------------------------------------------------------------------
export function tier2Gate(lastJson, findings, today, noTier2) {
  const hard = findings.filter((f) => f.level !== "INFO");
  if (!hard.length) return { fire: false, why: "clean night — Tier 2 costs nothing (the split IS the billing guard)" };
  if (noTier2) return { fire: false, why: "--no-tier2 flag (manual/demo run)" };
  if (lastJson && lastJson.tier2 && lastJson.tier2.day === today) {
    return { fire: false, why: `Tier 2 already ran today (${lastJson.tier2.started_at}) — once per night, structural, not a threshold` };
  }
  return { fire: true, why: `${hard.length} non-INFO finding(s)` };
}

function tier2Prompt(findings) {
  return [
    "You are the NIGHT REPAIR ENGINEER of ARSENAL AI FC (repo: this cwd). The nightly",
    "Tier-1 watchman found the following organ failures. Diagnose and FIX them now.",
    "",
    "FINDINGS (deterministic, with evidence):",
    JSON.stringify(findings, null, 2),
    "",
    "THE CAPTAIN'S STANDING RULINGS (6 Aug 2026, recorded in BRIEF__self_sustaining_organism.md §7.1):",
    "- Repair WITHOUT asking. Do not produce a report of options; produce working, run code.",
    "- EVERY change reversible: one git commit per logical change, message prefixed 'watchman-repair:',",
    "  and the revert path stated in the commit body.",
    "- EVERY change logged WITH ITS EVIDENCE: append one JSON line per change to",
    "  dressing-room/state/watchman_repairs.jsonl: {ts, finding_id, change, files, evidence, revert}.",
    "- Unrun system = hypothesis: RUN what you fix (selftest + the real path) and put the output in the journal line.",
    "",
    "HARD LIMITS (violating any of these is worse than the defect):",
    "- Touch ONLY organs and their state. NEVER: dressing-room/state/capsules/ · learning-layer content",
    "  · CLAUDE.md · OPS_STATE.md · ARSENAL_AI_FC_MASTERPLAN.md · THE_MANAGER__Master_Prompt.md · THE_GAFFER.md.",
    "- NEVER confirm/dismiss staged drifts in teaching_contract.json — his word alone.",
    "- NEVER close, advance, or mark axes on an open forge session.",
    "- NEVER commit gitignored secrets/biometrics (oura_*, readiness.json, intake_log.json). Do not push.",
    "- Single-writer law: mutate a state file only through its owning script's CLI.",
    "- A checker/hook must stay fail-silent — nothing you write may be able to block his session.",
    "If a finding cannot be safely repaired within these limits, write a journal line with",
    "change:'DEFERRED' and the reason — deferred-with-evidence is honest; silent is not.",
  ].join("\n");
}

// THE REPAIR LANE'S OWN GRANTS (7 Aug 2026, live-fire finding). The maiden Tier-2
// run PROVED the lane end-to-end except for one wall: headless `claude -p` runs
// under the project's permission config, and .claude/settings.local.json's stale
// allowlist (git + `node -e` only) DENIED every Edit/Write/`node scripts` — so the
// child diagnosed perfectly, refused to circumvent (correctly), and could repair
// NOTHING. His ruling ("let brain fix things by itself, do not keep me in the
// loop") authorises the repair lane to write; these per-run grants scope that
// authority to exactly what the prompt's own HARD LIMITS permit — file edits,
// running organs/selftests, and local git for the reversibility law. Deliberately
// ABSENT: git push (the prompt forbids it), schtasks, rm, anything network.
// Passed on the spawn, never written into his settings files — the grant lives
// and dies with the child.
export const TIER2_ALLOWED_TOOLS =
  'Edit Write Read Glob Grep "Bash(node *)" "Bash(git add *)" "Bash(git commit *)" "Bash(git diff *)" "Bash(git log *)" "Bash(git status *)" "Bash(git checkout -- *)"';

// The full cmd line, pure and exported so the selftest can pin its load-bearing
// parts. /v:on = delayed expansion, so !ERRORLEVEL! reads the CHILD's real exit
// code at run time (%ERRORLEVEL% in a /c string expands at PARSE time — before
// the run — and would stamp a lie). The EXIT stamp is what makes a silently-dead
// child (the maiden run's other lesson: minutes of work, zero bytes of output)
// distinguishable from one still running — c9 reads it the next night.
export function tier2CmdLine() {
  return `claude -p --model claude-opus-5 --effort max --allowedTools ${TIER2_ALLOWED_TOOLS}`
    + ` < "${TIER2_PROMPT_FILE}" >> "${REPAIR_LOG}" 2>&1`
    + ` & echo TIER2 EXIT !ERRORLEVEL! >> "${REPAIR_LOG}"`;
}

function spawnTier2(findings) {
  try {
    writeFileSync(TIER2_PROMPT_FILE, tier2Prompt(findings));
    appendFileSync(REPAIR_LOG, `\n== ${new Date().toISOString()} :: TIER 2 START (${findings.length} findings) ==\n`);
    // Detached cmd with redirects: the nightly task exits immediately; the model
    // run streams into watchman_repair.log. `claude -p` reads the prompt on stdin.
    const child = spawn("cmd.exe", ["/v:on", "/c", tier2CmdLine()],
      { cwd: ROOT, detached: true, stdio: "ignore", env: { ...process.env, ARSENAL_ORGAN: "1" } });
    child.unref();
    return { started_at: new Date().toISOString(), pid: child.pid };
  } catch (e) {
    try { appendFileSync(REPAIR_LOG, `TIER 2 SPAWN FAILED: ${String(e)}\n`); } catch {}
    return null;
  }
}

// ---------------------------------------------------------------------------
// BRIEF — the SessionStart surface (§7.4: the one place he already reads).
// Silent on a clean, fresh night. Speaks on findings, and speaks about ITSELF
// when the nightly run is missing — the watcher announces its own absence.
// ---------------------------------------------------------------------------
export function briefLines(lastJson, today, yesterday) {
  if (!lastJson || !lastJson.at) {
    return [`🌙 WATCHMAN: never run yet — first nightly sweep pending (task ArsenalFC-Watchman; \`node scripts/watchman.mjs run\` runs it now)`];
  }
  const day = localDayOf(lastJson.at);
  if (day !== today && day !== yesterday) {
    return [`🌙 WATCHMAN HAS NOT RUN since ${day || "unknown"} — the watcher itself is down; \`node scripts/watchman.mjs run\` + check task ArsenalFC-Watchman`];
  }
  const hard = (lastJson.findings || []).filter((f) => f.level !== "INFO");
  if (hard.length) {
    const ids = [...new Set(hard.map((f) => `${f.level}:${f.id}`))].join(" · ");
    return [`🌙 WATCHMAN (${day}): ${hard.length} finding(s) — ${ids}${lastJson.tier2 && lastJson.tier2.day === (day || "") ? " · Tier-2 repair ran, journal: watchman_repairs.jsonl" : ""} → \`node scripts/watchman.mjs report\``];
  }
  return [];
}

// ---------------------------------------------------------------------------
// D8 (9 Aug 2026, launch worklist): the daemons finally get a night watcher.
// Turnstile (:4111) had NO port watcher at all (AUDIT_NOTES' not-done ledger) —
// only the 09:15 conductor restart, so a mid-day death stayed invisible until
// the next morning. Same probe shape as conductor.portOpen; a closed port on a
// daemon that should be 24/7 is a WARN with the restart path in the evidence.
const DAEMON_PORTS = [
  { port: 4111, name: "turnstile" },
  { port: 4112, name: "cortex" },
  { port: 4113, name: "thalamus" },
];
function probePort(port, timeoutMs = 1500) {
  return new Promise((resolve) => {
    const sock = new net.Socket();
    let done = false;
    const finish = (v) => { if (!done) { done = true; try { sock.destroy(); } catch {} resolve(v); } };
    sock.setTimeout(timeoutMs);
    sock.once("connect", () => finish(true));
    sock.once("timeout", () => finish(false));
    sock.once("error", () => finish(false));
    try { sock.connect(port, "127.0.0.1"); } catch { finish(false); }
  });
}
async function probeDaemons() {
  const out = [];
  for (const d of DAEMON_PORTS) {
    if (!(await probePort(d.port))) {
      out.push({ id: `daemon-down-${d.name}`, level: "WARN",
        finding: `${d.name} (:${d.port}) is not answering — the capture/memory nerve is degraded until it restarts`,
        evidence: `TCP connect to 127.0.0.1:${d.port} failed/timed out · restart: wscript setup/START_DAEMONS.vbs (or the 09:15 conductor relaunches it)` });
    }
  }
  return out;
}

async function run(argv) {
  const noTier2 = argv.includes("--no-tier2");
  const skipSuite = argv.includes("--skip-suite");
  const now = new Date();
  const w = gather(now);
  const findings = checks(w);
  if (!skipSuite) { const f = probeSuite(); if (f) findings.push(f); }
  const yday = localDate(new Date(now.getTime() - 24 * 3.6e6));
  findings.push(...probeTasks(w.today, yday));
  findings.push(...probeOutwork());
  findings.push(...await probeDaemons());
  findings.push(...probeReconcile());

  const prevLast = readJson(LAST);
  const gate = tier2Gate(prevLast, findings, w.today, noTier2);
  const tier2 = gate.fire ? spawnTier2(findings.filter((f) => f.level !== "INFO")) : null;

  try { mkdirSync(STATE_DIR, { recursive: true }); } catch {}
  try { appendFileSync(LOGJ, JSON.stringify({ ts: w.now, findings, tier2: gate }) + "\n"); } catch {}
  try {
    // C2 (9 Aug 2026): tmp+rename — the SessionStart brief reads this file at every
    // boot; a torn read there means a silent no-brief morning.
    const tmp = `${LAST}.tmp${process.pid}`;
    writeFileSync(tmp, JSON.stringify({
      at: w.now, today: w.today, findings,
      counts: { afferents_today: w.affToday.total, teaching_today: w.affToday.teaching, audit_rows_today: w.auditRowsToday },
      tier2: tier2 ? { day: w.today, ...tier2 } : (prevLast && prevLast.tier2) || null,
      tier2_gate: gate.why,
    }, null, 1));
    renameSync(tmp, LAST);
  } catch {}

  console.log(`watchman: ${findings.length} finding(s) · ${findings.filter((f) => f.level !== "INFO").length} escalation-grade`);
  for (const f of findings) console.log(`  [${f.level}] ${f.id} — ${f.finding}`);
  console.log(`  tier2: ${gate.fire ? `SPAWNED (pid ${tier2 && tier2.pid}, log: watchman_repair.log)` : `not fired — ${gate.why}`}`);
}

function report() {
  const j = readJson(LAST);
  console.log("\n== THE NIGHT WATCHMAN ==");
  if (!j) { console.log("  never run. `node scripts/watchman.mjs run`\n"); return; }
  console.log(`  last sweep: ${j.at} · afferents today ${j.counts?.afferents_today ?? "?"} · teaching ${j.counts?.teaching_today ?? "?"} · audit rows ${j.counts?.audit_rows_today ?? "?"}`);
  if (!(j.findings || []).length) console.log("  findings: none — and the checks CAN fail (see selftest), so this is a measured clean, not a silent one.");
  for (const f of (j.findings || [])) {
    console.log(`\n  [${f.level}] ${f.id}\n    ${f.finding}\n    evidence: ${String(f.evidence).split("\n").join("\n              ")}`);
  }
  console.log(`  tier2: ${j.tier2 ? `last ran ${j.tier2.day} (${j.tier2.started_at})` : "never fired"} · gate: ${j.tier2_gate || "?"}`);
  // §5.7 + §6.2 — the honest edges, stated where he will see them:
  const tc = readJson(CONTRACT);
  const al = readJson(AUDIT_LAST);
  if (tc && Array.isArray(tc.rules) && al && Array.isArray(al.checked_rules)) {
    const unchecked = tc.rules.map((r) => r.id).filter((id) => !al.checked_rules.includes(id));
    if (unchecked.length) console.log(`\n  NOT COVERED — teaching audit has no check for: ${unchecked.join(" · ")} ("no drift caught" ≠ "taught correctly")`);
  }
  console.log("  NOT COVERED — the GEMINI surface: no compliance check exists for teaching that happens off this machine;");
  console.log("    reps arrive shape-validated (capture.mjs) but teaching quality there is UNMEASURED until Gemini transcripts");
  console.log("    flow into the afferent bus. This line stays until that lane exists (§6.2 — stated, not silently absent).\n");
}

// ---------------------------------------------------------------------------
function selftest() {
  let pass = 0, fail = 0;
  const assert = (name, cond) => { if (cond) { pass++; console.log(`  ✓ ${name}`); } else { fail++; console.log(`  ✗ ${name}`); } };
  console.log("\n== watchman selftest ==\n");

  const TODAY = "2026-08-06", YDAY = "2026-08-05";
  const base = {
    now: "2026-08-06T21:00:00+05:30", today: TODAY,
    forge: { exists: true, json: { concept: "hallucinations", started_at: "2026-08-06T12:39:39.506Z" }, shapeless: false },
    contract: { exists: true, json: { rules: [], checked_at: "2026-08-06T13:00:00+05:30" }, unreadable: false },
    auditLast: { stop: { at: "2026-08-06T13:00:00+05:30", audited: true, why: null } },
    affToday: { total: 20, teaching: 8, readable: true },
    auditRowsToday: 8, auditLogExists: true,
  };
  assert("c4b PROJECTION LAG — canon newer than its projection → RED projection-stale, both mtimes in evidence",
    checks({ ...base, scout_pair: { canon_mtime: 2000, projection_mtime: 1000 } })
      .some((f) => f.id === "projection-stale" && f.level === "RED" && /canon mtime/.test(f.evidence)));
  assert("c4b PROJECTION LAG — projection newer-or-equal is clean, and a missing side stays silent (never guesses)",
    !checks({ ...base, scout_pair: { canon_mtime: 1000, projection_mtime: 1000 } }).some((f) => f.id === "projection-stale")
    && !checks({ ...base, scout_pair: { canon_mtime: 1000, projection_mtime: 2000 } }).some((f) => f.id === "projection-stale")
    && !checks({ ...base, scout_pair: { canon_mtime: null, projection_mtime: 1000 } }).some((f) => f.id === "projection-stale")
    && !checks({ ...base, scout_pair: { canon_mtime: 2000, projection_mtime: null } }).some((f) => f.id === "projection-stale")
    && !checks({ ...base }).some((f) => f.id === "projection-stale"));

  assert("CLEAN — a healthy day yields ZERO findings (the detector can fail, so a clean is a measured clean)",
    checks(base).length === 0);
  assert("c1 DEAD — teaching captured today + forge open + zero audit rows = the §5.1 silence, re-caught",
    checks({ ...base, auditRowsToday: 0, auditLogExists: false }).some((f) => f.id === "audit-dead" && f.level === "DEAD"));
  assert("c1 CONDITIONAL — a day with NO teaching afferents is a day off, not a death (NEVER-BORN stays true for workless days)",
    !checks({ ...base, affToday: { total: 0, teaching: 0, readable: true }, auditRowsToday: 0, auditLast: null }).some((f) => f.id === "audit-dead"));
  assert("c1 CONDITIONAL — no open forge session ⇒ no audit expectation, however many teaching rows landed",
    !checks({ ...base, forge: { exists: false, json: null, shapeless: false }, auditRowsToday: 0 }).some((f) => f.id === "audit-dead"));
  assert("c2 LIAR — 'no open forge session' in the auditor's own record while the file sits open (the day-one catch §5.1 never got)",
    checks({ ...base, auditLast: { stop: { at: "2026-08-06T13:00:00+05:30", audited: false, why: "no open forge session — THE METHOD does not apply to this turn" } } })
      .some((f) => f.id === "audit-liar" && f.level === "LIAR"));
  assert("c2 — the same words with the session genuinely closed are the TRUTH, not a lie",
    !checks({ ...base, forge: { exists: true, json: { concept: "x", closed_at: "2026-08-06T14:00:00Z" }, shapeless: false }, auditRowsToday: 0, affToday: { total: 5, teaching: 2, readable: true }, auditLast: { stop: { at: "2026-08-06T13:00:00+05:30", audited: false, why: "no open forge session — THE METHOD does not apply to this turn" } } })
      .some((f) => f.id === "audit-liar"));

  // c10/c11 — THE OUTWARD LOOP (8 Aug 2026)
  assert("c10 OUTWARD FLOOR — desk exists + <2 outward checks this week ⇒ INFO with both counts",
    checks({ ...base, outward: { has_desk: true, returns7d: 1, benchRuns7d: 0 } })
      .some((f) => f.id === "outward-floor-unmet" && f.level === "INFO" && /1\/2/.test(f.finding) && /mission returns 1/.test(f.finding)));
  assert("c10 OUTWARD FLOOR — floor met (1 return + 1 bench run) ⇒ silence",
    !checks({ ...base, outward: { has_desk: true, returns7d: 1, benchRuns7d: 1 } }).some((f) => f.id === "outward-floor-unmet"));
  assert("c10 OUTWARD FLOOR — no missions desk yet ⇒ no floor claim (machinery precedes the floor)",
    !checks({ ...base, outward: { has_desk: false, returns7d: 0, benchRuns7d: 0 } }).some((f) => f.id === "outward-floor-unmet")
    && !checks(base).some((f) => f.id === "outward-floor-unmet"));
  assert("c11 GEMINI-QUALITY — recorded batches surface as UNJUDGED (30-45d rule named), zero rows stay silent",
    checks({ ...base, gemini_quality: { rows: 3 } })
      .some((f) => f.id === "gemini-quality-recorded" && f.level === "INFO" && /3 paste-batch/.test(f.finding) && /30-45d/.test(f.finding))
    && !checks({ ...base, gemini_quality: { rows: 0 } }).some((f) => f.id === "gemini-quality-recorded"));
  assert("c3 RED — rows today without today's checked_at stamp = the heartbeat wire broke between the two organs",
    checks({ ...base, contract: { exists: true, json: { rules: [], checked_at: "2026-08-01T10:00:00Z" }, unreadable: false } })
      .some((f) => f.id === "heartbeat-broken"));
  assert("c4a RED — audit hook fired today, zero afferents = capture/thalamus down",
    checks({ ...base, affToday: { total: 0, teaching: 0, readable: true }, auditRowsToday: 0 })
      .some((f) => f.id === "capture-dead"));
  assert("c4b RED — afferents today, audit hook never wrote = the settings.json wire is dead",
    checks({ ...base, auditLast: null, auditRowsToday: 0, affToday: { total: 12, teaching: 0, readable: true } })
      .some((f) => f.id === "audit-hook-dead"));
  assert("c5 RED — a shapeless forge file and an unreadable contract are both loud (the PROBLEM-1 class)",
    checks({ ...base, forge: { exists: true, json: null, shapeless: true } }).some((f) => f.id === "forge-shapeless")
    && checks({ ...base, contract: { exists: true, json: null, unreadable: true } }).some((f) => f.id === "contract-unreadable"));
  assert("c8 INFO — a forge session open past the pacer's own 18h is a line, not an escalation; under 18h it is silent",
    (() => { const f = checks({ ...base, now: "2026-08-07T18:00:00+05:30" }).find((x) => x.id === "forge-stale-open");
      const under = checks({ ...base, now: "2026-08-06T20:00:00+05:30" }).find((x) => x.id === "forge-stale-open");
      return f && f.level === "INFO" && !under; })());

  // Tier-2 gate
  const hard = [{ id: "x", level: "DEAD", finding: "f", evidence: "e" }];
  const info = [{ id: "y", level: "INFO", finding: "f", evidence: "e" }];
  assert("TIER-2 GATE — fires on a non-INFO finding when it has not run today",
    tier2Gate(null, hard, TODAY, false).fire === true);
  assert("TIER-2 GATE — a clean night never fires (the split IS the billing guard, M-3 does not exist yet)",
    tier2Gate(null, [], TODAY, false).fire === false);
  assert("TIER-2 GATE — INFO-only never fires",
    tier2Gate(null, info, TODAY, false).fire === false);
  assert("TIER-2 GATE — once per local day, structural, not a threshold",
    tier2Gate({ tier2: { day: TODAY, started_at: "x" } }, hard, TODAY, false).fire === false
    && tier2Gate({ tier2: { day: YDAY, started_at: "x" } }, hard, TODAY, false).fire === true);
  assert("TIER-2 GATE — --no-tier2 (manual/demo) is honoured and says so",
    tier2Gate(null, hard, TODAY, true).fire === false && /no-tier2/.test(tier2Gate(null, hard, TODAY, true).why));

  // The brief
  assert("BRIEF — silent on a clean, fresh night (no line he learns to ignore)",
    briefLines({ at: `${TODAY}T22:00:00+05:30`, findings: [] }, TODAY, YDAY).length === 0);
  assert("BRIEF — a finding night speaks, with level:id and the report command",
    briefLines({ at: `${TODAY}T22:00:00+05:30`, findings: hard }, TODAY, YDAY)
      .some((l) => /DEAD:x/.test(l) && /watchman\.mjs report/.test(l)));
  assert("BRIEF — INFO-only stays silent (worth a report line, not a kickoff line)",
    briefLines({ at: `${TODAY}T22:00:00+05:30`, findings: info }, TODAY, YDAY).length === 0);
  assert("BRIEF — the watcher announces its OWN absence when the nightly run is missing (quiet and dead must never look alike)",
    briefLines({ at: "2026-08-03T22:00:00+05:30", findings: [] }, TODAY, YDAY).some((l) => /HAS NOT RUN/.test(l))
    && briefLines(null, TODAY, YDAY).some((l) => /never run yet/.test(l)));
  assert("BRIEF — yesterday's run still counts as fresh (nightly cadence, date compare, no invented number)",
    briefLines({ at: `${YDAY}T23:55:00+05:30`, findings: [] }, TODAY, YDAY).length === 0);

  // The missed-daily net (the 6 Aug class) — pure, fixture-driven, each side can fail
  const taskRows = [
    { name: "A-Daily-Missed", result: 0, last: "2026-08-04", daily: true },
    { name: "B-Daily-Fresh", result: 0, last: YDAY, daily: true },
    { name: "C-Weekly-Old", result: 0, last: "2026-07-28", daily: false },
    { name: "D-Daily-NeverRan", result: 0x41303, last: "1999-11-30", daily: true },
  ];
  assert("MISSED-DAILY — a daily task last run before yesterday is caught; fresh, weekly and never-ran are all exempt",
    (() => { const m = missedDailyTasks(taskRows, TODAY, YDAY);
      return m.length === 1 && m[0].name === "A-Daily-Missed"; })());
  assert("MISSED-DAILY — yesterday's run still counts as on-schedule (nightly cadence, date compare, no invented number)",
    missedDailyTasks([{ name: "X", result: 0, last: YDAY, daily: true }], TODAY, YDAY).length === 0);

  // c9 — the repair arm's own liveness (from the maiden live-fire)
  const trail = (last_start, exit, journal) => ({ ...base, tier2_trail: { last_start, exit_after_start: exit, journal_after_start: journal } });
  assert("c9 — a PREVIOUS-day Tier-2 start with no EXIT stamp and no journal row = tier2-vanished RED",
    checks(trail("2026-08-05T14:16:16.376Z", false, false)).some((f) => f.id === "tier2-vanished" && f.level === "RED"));
  assert("c9 — an EXIT stamp OR a journal row OR a same-day start all silence it (the child may still be running tonight)",
    !checks(trail("2026-08-05T14:16:16.376Z", true, false)).some((f) => f.id === "tier2-vanished")
    && !checks(trail("2026-08-05T14:16:16.376Z", false, true)).some((f) => f.id === "tier2-vanished")
    && !checks(trail(`${TODAY}T14:16:16.376Z`, false, false)).some((f) => f.id === "tier2-vanished")
    && !checks(base).some((f) => f.id === "tier2-vanished"));

  // The spawn line — pinned pure (the maiden run's two lessons live here)
  const CMD = tier2CmdLine();
  assert("SPAWN LINE — carries the per-run tool grants (the permission wall that stopped the maiden repair), the delayed-expansion EXIT stamp, and NO push grant",
    /--allowedTools .*Edit/.test(CMD) && /Bash\(git commit \*\)/.test(CMD)
    && /TIER2 EXIT !ERRORLEVEL!/.test(CMD) && !/git push/.test(CMD) && !/%ERRORLEVEL%/.test(CMD));

  // Tier-2 prompt carries the §7.1 constraints verbatim
  const P = tier2Prompt(hard);
  assert("TIER-2 PROMPT — reversibility (git, watchman-repair: prefix), the evidence journal, the hard limits and the staged-drift ban are all in the child's orders",
    /watchman-repair:/.test(P) && /watchman_repairs\.jsonl/.test(P) && /capsules/.test(P)
    && /NEVER confirm\/dismiss staged drifts/.test(P) && /Unrun system = hypothesis/.test(P) && /Do not push/.test(P));

  console.log(`\n${fail === 0 ? "ALL CHECKS PASSED" : "SELFTEST FAILED"} (${pass} passed, ${fail} failed)\n`);
  if (fail) process.exit(1);
}

// ---------------------------------------------------------------------------
const cmd = process.argv[2] || "run";
if (cmd === "run") run(process.argv.slice(3));
else if (cmd === "brief") {
  // HOOK PATH — ARSENAL_ORGAN-guarded, fail-silent, exit 0, ≤1 line.
  if (process.env.ARSENAL_ORGAN !== "1") {
    try {
      const now = new Date();
      const y = new Date(now.getTime() - 24 * 3.6e6);
      const L = briefLines(readJson(LAST), localDate(now), localDate(y));
      if (L.length) console.log(L.join("\n"));
    } catch { /* silence is the contract */ }
  }
  process.exit(0);
} else if (cmd === "report") report();
else if (cmd === "selftest") selftest();
else console.log("watchman: run [--no-tier2] [--skip-suite] | brief | report | selftest");
