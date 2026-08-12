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
// COVERAGE HONESTY (§5.7 · §6.2): `report` states what is NOT covered. The
// Gemini surface carried "NO compliance check — permanently impossible" until
// 9 Aug 2026, when the /harvest lane shipped (scripts/harvest.mjs, his 'data
// flows everywhere' word): his sittings CAN reach the afferent bus now, so the
// report measures the lane LIVE — covered exactly as harvested, never assumed
// from the lane's existence, and un-harvested sittings stay stated as invisible.
// The teaching audit still covers only CHECKED_RULES. Stated, not fixed
// silently — "no finding" must never read as "all covered".
//
// LAWS: deterministic Tier 1, no LLM, no guessed thresholds — every check is a
// comparison or a presence test; the two numbers it carries (STALE_HOURS=18,
// suite timeout ceiling) are mirrored from their owners, not invented. Single
// writer of watchman_last.json + watchman.jsonl + watchman_repairs.jsonl +
// watchman_tier2_prompt.txt. READ-ONLY on everything else. `brief` is hook-safe:
// fail-silent, exit 0, ARSENAL_ORGAN-guarded.
// MODES: run [--no-tier2] [--skip-suite] | brief | report | selftest
// ============================================================================

import { readFileSync, writeFileSync, existsSync, appendFileSync, mkdirSync, statSync, renameSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn, spawnSync } from "node:child_process";
import net from "node:net";
// H0 FLOW AUDIT (10 Aug 2026): the evening chain's declared shape — its last
// step's `at` is the moment after which "silent tonight" is a fair claim.
// conductor.mjs is import-safe (main() is argv-guarded, zero side effects).
import { EVENING } from "./conductor.mjs";

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
  // LADDER B3 (9 Aug 2026) — the claude CLI's login health, as brain.mjs already
  // measures it every tick (failureStreak → token_vitals.json.health). Read-only.
  w.token_health = ((readJson(join(STATE_DIR, "token_vitals.json")) || {}).health) || null;
  // LADDER E4 + E8 (9 Aug 2026) — today's utterance rows (brain's mouth_log) and
  // whether THIS morning got its night-coach lesson. Both read-only.
  {
    const bc = readJson(join(STATE_DIR, "brain_config.json"));
    w.mouth = { enabled: !!(bc && bc.ntfy && bc.ntfy.enabled), attempts_today: 0, sent_today: 0 };
    try {
      const ml = join(STATE_DIR, "mouth_log.jsonl");
      if (existsSync(ml)) {
        for (const line of readFileSync(ml, "utf8").split("\n")) {
          if (!line.trim()) continue;
          try { const r = JSON.parse(line); if (localDayOf(r.ts) === today) { w.mouth.attempts_today++; if (r.sent) w.mouth.sent_today++; } } catch { }
        }
      }
    } catch { /* unreadable log = 0 rows, the check stays honest about counts */ }
    w.night_coach = {
      enabled: !!(((bc && bc.jobs) || []).find((j) => j.id === "night_coach" && j.enabled !== false)),
      today_file: existsSync(join(STATE_DIR, "brain_out", "night_coach", `${today}.md`)),
    };
  }
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
    // 11 Aug 2026 — A DEAD LANE'S LAST FOOTPRINT IS NOT A LIVE FAULT.
    // The arm was switched off by his ruling, so this row can never clear on its
    // own: the vanished child is history, and no future run will ever stamp an
    // exit for it. Left as RED it becomes a permanent alarm, and a permanent
    // alarm is how he learns to stop reading the watchman at all — the exact
    // failure this organ exists to prevent. Kept VISIBLE (never deleted: the
    // corpse is real and the day it happened is evidence), demoted to INFO, and
    // it says in its own words that the silence is a decision.
    const dead = !tier2Enabled();
    F.push({
      id: "tier2-vanished", level: dead ? "INFO" : "RED",
      finding: dead
        ? "the last Tier-2 repair child (before the lane was switched off) left no exit stamp and no journal row — history, not a live fault: the arm is DISABLED by his 11 Aug ruling, so nothing will ever stamp an exit for it"
        : "a Tier-2 repair child started on a previous day and left NO exit stamp and NO journal row — the repair arm died silently mid-run (the maiden-run class: minutes of work, zero bytes of trace)",
      evidence: `last TIER 2 START ${w.tier2_trail.last_start} · no "TIER2 EXIT" line after it in watchman_repair.log · no watchman_repairs.jsonl row at-or-after it${dead ? " · lane OFF (ARSENAL_TIER2 unset) — re-arming it makes this RED again, which is correct" : ""}`,
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

  // LADDER B3 · CLAUDE CLI LOGGED OUT — the single failure that silently kills
  // all 19 LLM jobs at once. brain.mjs's own failureStreak verdict (dead ≥ 5 with
  // auth-shaped errors) is the evidence; the card organ derives the same signal
  // into ONE card, and the morning sheet push carries one line (brain.mjs B3).
  if (w.token_health && w.token_health.not_logged_in === true) {
    F.push({
      id: "claude-logged-out", level: "RED",
      finding: `the claude CLI is NOT LOGGED IN — ${w.token_health.streak} consecutive failures with auth-shaped errors; every overnight LLM job is dark until his hands run /login`,
      evidence: w.token_health.hint || "token_vitals.json.health (brain.mjs failureStreak)",
    });
  }

  // LADDER E4 · THE SILENT MOUTH — the organism gets two utterances a day; a day
  // with ZERO sent rows while ntfy is enabled means the phone heard nothing at
  // all. INFO, not RED: a sleeping laptop is covered by the cloud sentinel, and
  // the absence line already speaks for the morning slot — this is the tally.
  if (w.mouth && w.mouth.enabled && w.mouth.sent_today === 0) {
    F.push({
      id: "mouth-silent-today", level: "INFO",
      finding: `the mouth sent NOTHING today (${w.mouth.attempts_today} attempt(s) recorded, 0 delivered) — expected 1-2 utterances; if the laptop slept the sentinel covered the morning`,
      evidence: "mouth_log.jsonl (brain.mjs records every pushNtfy attempt since LADDER E4)",
    });
  }

  // LADDER E8 · THE COACH THAT DIDN'T TEACH — night_coach is enabled and this
  // morning's lesson file never appeared. The map, the examiner probe, the
  // kickoff line and the Gaffer's cartridge all ran without it today.
  if (w.night_coach && w.night_coach.enabled && !w.night_coach.today_file) {
    F.push({
      id: "night-coach-absent", level: "WARN",
      finding: `night_coach produced nothing for ${w.today} — this morning had no misconception map (setpiece/examiner/kickoff/Gaffer all ran uncoached)`,
      evidence: `brain_out/night_coach/${w.today}.md missing — check brain_ledger.jsonl for the overnight run's error`,
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

// THE PULSE RIDE (12 Aug 2026, ULTRACODE liveness law). reconcile's bleeds ride
// at INFO above — a level that never escalates and never wakes anyone, which is
// how diary sat NEVER-PRODUCED with three wired readers while every check was
// green. pulse.mjs owns the ◇≤T law (schtasks lanes, the card queue, and the
// watchers' own artifacts); this probe runs it nightly WITHOUT the reconcile
// half (--no-reconcile — probeReconcile above already walks the brain lanes,
// and pulse re-walking them here would double-report every bleed). Severity is
// the whole point: a NEVER class is RED — "has never produced" is the loudest
// fact an organism can state about its own lane — and stale/queue is WARN.
// pulse failing to run is WARN fail-closed, never silence. The other half of
// the watch: audit.mjs runs pulse FULL daily at 13:10, so a dead watchman is
// noticed by audit's pulse and a dead audit by this one — two drivers, no
// shared code, which is the Byzantine answer to who-watches-the-watchman.
function probePulse() {
  try {
    const r = spawnSync(process.execPath, [join(__dirname, "pulse.mjs"), "json", "--no-reconcile"],
      { timeout: 120000, encoding: "utf8" });
    if (r.error || (r.status !== 0 && r.status !== 1)) {
      return [{ id: "pulse-unrunnable", level: "WARN", finding: "the liveness law could not run — every ◇≤T obligation is unverified tonight", evidence: String(r.error || `exit ${r.status}: ${String(r.stderr || "").slice(0, 200)}`) }];
    }
    const j = JSON.parse(String(r.stdout || "{}").trim() || "{}");
    if (j.measurable === false) return [];   // a bare checkout cannot testify (never fires on his laptop)
    return (Array.isArray(j.violations) ? j.violations : []).slice(0, 6).map((v) => ({
      id: `pulse-${v.class}-${String(v.name).replace(/[^A-Za-z0-9_-]/g, "_")}`,
      level: /never|watcher/.test(v.class) ? "RED" : "WARN",
      finding: `${v.name}: ${v.detail || v.class}${v.consumers ? ` · ${v.consumers} wired reader(s) starving` : ""}`,
      evidence: "node scripts/pulse.mjs report — the ◇≤T law, deadline 2x the lane's own cadence",
    }));
  } catch (e) {
    return [{ id: "pulse-unrunnable", level: "WARN", finding: "the liveness law could not run — every ◇≤T obligation is unverified tonight", evidence: String(e) }];
  }
}

// ---------------------------------------------------------------------------
// TIER 2 — escalation, per his §7.1/§7.2 rulings. Fires ONLY on non-INFO
// findings, at most once per local day, detached so the nightly task never
// hangs on a model run. ARSENAL_ORGAN=1 so the child's own hooks stay silent
// and its transcript is never captured as the captain's words.
// ---------------------------------------------------------------------------
// HH:MM inside a possibly-midnight-wrapping window (22:00→07:30 wraps; string
// compare is safe on zero-padded HH:MM).
export function inWindow(hm, start, end) {
  return start <= end ? (hm >= start && hm <= end) : (hm >= start || hm <= end);
}

// ---------------------------------------------------------------------------
// THE TIER-2 KILL SWITCH (11 Aug 2026 — HIS RULING: "find out if it is usefull
// or not and if not then close it").
//
// MEASURED, not guessed. watchman_repair.log on the day of the ruling:
//     TIER 2 START : 5   (7, 8, 9, 10, 10 Aug)
//     TIER2 EXIT   : 0
//     watchman_repairs.jsonl rows since 7 Aug : 0
// Five `claude -p --model claude-opus-5 --effort max` runs, every one of them
// silent: no exit stamp, no journal row, no repair anyone can point to. The arm
// has produced nothing measurable since 7 Aug while spending the most expensive
// call in the organism, nightly.
//
// AND IT CANNOT STOP ITSELF. c9's `tier2-vanished` finding is level RED, so a
// vanished child guarantees a non-INFO finding tomorrow, which re-arms the gate,
// which spawns another child that vanishes. The comment above the window check
// calls that self-re-arming "the recovery path"; measured over five nights it is
// a self-feeding loop, not a recovery.
//
// COST, on the night it was caught: the diary starved on the 2026-08-10 shift —
// 127 beats refused at 17,62,791 tokens against the overnight cap of 6,40,000
// (token_vitals.json `starved`). The night's own budget was gone.
//
// WHAT THIS DOES AND DOES NOT DO. It stops the SPEND, not the SIGHT: every
// finding is still measured, still reported, still in the brief. Only the silent
// Opus child is refused, and the gate says so out loud in `why` so a reader sees
// a decision rather than an absence. OFF by default, one env var to re-arm:
//     ARSENAL_TIER2=1 node scripts/watchman.mjs run
// Re-open the question the honest way — when the arm can prove an exit stamp and
// a journal row on a manual run, flip the default back.
// Read at CALL time, not at module load: the selftest has to be able to exercise
// both the live-lane and the dead-lane behaviour in one process, and a frozen
// const would leave whichever half is not the current default permanently untested.
const tier2Enabled = () => process.env.ARSENAL_TIER2 === "1";

// `enabled` is a PARAMETER, not only a module constant, so the gate's LOGIC
// stays testable while the POLICY is off: the selftest below passes `true` to
// assert firing/deferring/once-per-day still behave, and one assertion pins the
// DEFAULT to off. A policy that cannot be tested around is a policy that rots.
export function tier2Gate(lastJson, findings, today, noTier2, nowHM = null, win = null, enabled = tier2Enabled()) {
  const hard = findings.filter((f) => f.level !== "INFO");
  if (!hard.length) return { fire: false, why: "clean night — Tier 2 costs nothing (the split IS the billing guard)" };
  if (noTier2) return { fire: false, why: "--no-tier2 flag (manual/demo run)" };
  if (!enabled) {
    return { fire: false, why: "DISABLED by his 11 Aug ruling — 5 starts / 0 exits / 0 journal rows since 7 Aug, and its own vanished-child RED re-armed it nightly. Findings are still measured and reported; only the silent Opus spend is refused. Re-arm with ARSENAL_TIER2=1" };
  }
  // H0 FLOW AUDIT (10 Aug 2026) — the 8 Aug maiden-class death, diagnosed: the
  // watchman task itself fired as a mid-day CATCH-UP (13:13 IST, seconds after a
  // wake), spawned the detached repair child, and the laptop re-slept minutes
  // later — the process tree died before even the UNCONDITIONAL exit echo could
  // run (zero bytes after START; a claude-side failure would have stamped EXIT).
  // The repair arm is the NIGHT engineer by design (§7.2), so Tier 2 now fires
  // only inside the overnight window (brain_config overnight.start/end — the
  // same 22:00→07:30 the whole night lane rides; no new number). A daytime run
  // with real findings DEFERS to the scheduled night sweep, which re-measures
  // and fires on fresh findings. That same mechanism is the recovery path for a
  // vanished child: c9's tier2-vanished RED is non-INFO, so the following night
  // re-arms automatically (asserted in selftest). A keep-awake assertion is
  // deliberately NOT built: whether wake windows hold through a night run is
  // exactly F14's open measurement (the WakeProbe) — mechanism after data.
  if (nowHM && win && !inWindow(nowHM, win.start, win.end)) {
    return { fire: false, why: `outside the overnight window (${nowHM}, window ${win.start}→${win.end}) — deferred to the scheduled night sweep (8 Aug maiden-class death: a mid-day catch-up spawn died with the re-sleep)` };
  }
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
    // windowsHide (11 Aug 2026, HIS ruling on the popping consoles): without it a
    // detached cmd.exe draws a REAL console in his session, and unlike the 15-minute
    // organs this one does not flash and vanish -- it is a `claude -p --effort max`
    // run that can sit open on screen for the length of a Tier-2 repair. Every other
    // detached spawn in the organism (conductor's launchDetached, dugout's restart)
    // already passes it; this one was the last that did not.
    const child = spawn("cmd.exe", ["/v:on", "/c", tier2CmdLine()],
      { cwd: ROOT, detached: true, stdio: "ignore", windowsHide: true, env: { ...process.env, ARSENAL_ORGAN: "1" } });
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
  // LADDER D2 (9 Aug 2026): the brain PACEMAKER joins the night watch — :4116 is
  // its daemon singleton (:4115 is only the tick lock). The dugout (:4114) stays
  // deliberately absent here AND in the 10-min watchdog: his surface, his hands.
  { port: 4116, name: "brain" },
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

// ---------------------------------------------------------------------------
// LADDER B8 (9 Aug 2026) — THE CANON WATCH. The four canonical .md files change
// only on HIS word (CLAUDE.md's no-auto-approve law), yet nothing ever checked.
// This probe asks git for uncommitted working-tree deltas on exactly those four;
// any hit is a RED finding AND one idempotent card (key: canon:<file>:<day>) so
// the question "aapke word se tha?" reaches him at an anchor, once per file per
// day, never as a list. Injectable for the selftest (no git, no card spawn).
// ---------------------------------------------------------------------------
export const CANON_FILES = ["OPS_STATE.md", "ARSENAL_AI_FC_MASTERPLAN.md", "THE_MANAGER__Master_Prompt.md", "THE_GAFFER.md"];
export function probeCanon(today, deps = {}) {
  const git = deps.git || (() => {
    const r = spawnSync("git", ["status", "--porcelain", "--", ...CANON_FILES], { cwd: ROOT, encoding: "utf8", timeout: 15000 });
    return r.status === 0 ? String(r.stdout || "") : null;
  });
  const fileCard = deps.fileCard || ((line, key) => {
    try {
      spawnSync(process.execPath, [join(__dirname, "captains_call.mjs"), "file", "--line", line, "--key", key],
        { encoding: "utf8", timeout: 15000, env: { ...process.env, ARSENAL_ORGAN: "" } });
      return true;
    } catch { return false; }
  });
  const out = [];
  const porcelain = git();
  if (porcelain == null) {
    out.push({ id: "canon-watch-unrunnable", level: "INFO", finding: "git status failed — the canon watch measured nothing tonight", evidence: "spawnSync git status --porcelain on the 4 canon files" });
    return out;
  }
  for (const l of porcelain.split("\n")) {
    const m = l.match(/^\s*([MADRC?]{1,2})\s+(.+)$/);
    if (!m) continue;
    const file = m[2].trim();
    if (!CANON_FILES.includes(file)) continue;
    const carded = fileCard(`Canon ${file} mein UNCOMMITTED badlav hai (${m[1].trim()}) — aapke word se tha? Nahi to git checkout se wapas.`, `canon:${file}:${today}`);
    out.push({
      id: `canon-drift-${file}`, level: "RED",
      finding: `${file} has an uncommitted working-tree change (${m[1].trim()}) — canon moves only on HIS word; a card ${carded ? "is filed" : "could NOT be filed"} asking whether this one had it`,
      evidence: `git status --porcelain → "${l.trim()}" · card key canon:${file}:${today} (idempotent — one per file per day)`,
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// LADDER E2 (9 Aug 2026) — THE EXPECTED SHAPE. tasks_expected.json is the
// schedule's declared truth (snapshotted post-ladder); this probe diffs the live
// Task Scheduler against it nightly. A vanished expected task is RED, a
// designed-absent task REAPPEARING is RED (an installer resurrected something
// his word killed), enabled/disabled drift is WARN, an unlisted new task INFO.
// ---------------------------------------------------------------------------
export function probeExpectedTasks(deps = {}) {
  const expected = deps.expected !== undefined ? deps.expected : readJson(join(STATE_DIR, "tasks_expected.json"));
  if (!expected) return [];                              // no snapshot on this box = no claim
  const live = deps.live !== undefined ? deps.live : (() => {
    const ps = spawnSync("powershell", ["-NoProfile", "-Command",
      'Get-ScheduledTask | Where-Object { $_.TaskName -like "ArsenalFC*" } | ForEach-Object { "$($_.TaskName)|$($_.State)" }'],
      { encoding: "utf8", timeout: 30000, windowsHide: true });
    if (ps.status !== 0) return null;
    const m = new Map();
    for (const l of String(ps.stdout || "").split("\n")) { const [n, s] = l.trim().split("|"); if (n) m.set(n, s); }
    return m;
  })();
  if (!live) return [{ id: "tasks-expected-unrunnable", level: "INFO", finding: "Get-ScheduledTask failed — the schedule diff measured nothing tonight", evidence: "spawnSync powershell Get-ScheduledTask" }];
  const out = [];
  for (const n of expected.expected_enabled || []) {
    if (!live.has(n)) out.push({ id: `task-vanished-${n}`, level: "RED", finding: `${n} is EXPECTED and GONE — a lane the organism counts on no longer exists`, evidence: "tasks_expected.json expected_enabled vs live Get-ScheduledTask" });
    else if (live.get(n) === "Disabled") out.push({ id: `task-darkened-${n}`, level: "WARN", finding: `${n} is expected ENABLED but sits Disabled — its lane is dark`, evidence: "tasks_expected.json vs live state" });
  }
  for (const n of expected.expected_disabled || []) {
    if (live.has(n) && live.get(n) !== "Disabled") out.push({ id: `task-double-run-${n}`, level: "WARN", finding: `${n} is designed-DISABLED (a conductor owns its organ) but sits enabled — it will double-run against its chain`, evidence: "tasks_expected.json expected_disabled vs live state" });
  }
  for (const n of Object.keys(expected.designed_absent || {})) {
    if (live.has(n)) out.push({ id: `task-resurrected-${n}`, level: "RED", finding: `${n} is designed-ABSENT and has REAPPEARED — ${expected.designed_absent[n]}`, evidence: "tasks_expected.json designed_absent vs live state" });
  }
  const known = new Set([...(expected.expected_enabled || []), ...(expected.expected_disabled || []), ...Object.keys(expected.designed_absent || {})]);
  for (const n of live.keys()) {
    if (!known.has(n)) out.push({ id: `task-unlisted-${n}`, level: "INFO", finding: `${n} exists live but tasks_expected.json has never heard of it — a new build should update the snapshot in its own commit`, evidence: "live Get-ScheduledTask vs tasks_expected.json" });
  }
  return out;
}

// ---------------------------------------------------------------------------
// LADDER E8 (9 Aug 2026) — THE SENTINEL'S PULSE. The cloud routine is the one
// organ that cannot die with the laptop — and therefore the one organ nothing
// on the laptop was watching. Proof-of-life for any given day: SOMETHING put a
// row on the ntfy topic — the laptop's own badge-signed pushes (sheet/bells/
// absence, all RFC2047-encoded ⚪🔴 titles) or the sentinel's "Laptop soya"
// fallback. A day with NEITHER means the mouth AND the sentinel are both dead.
// ---------------------------------------------------------------------------
export async function probeSentinel(today, deps = {}) {
  const topic = deps.topic !== undefined ? deps.topic : (() => {
    if (process.env.ARSENAL_NTFY_TOPIC && process.env.ARSENAL_NTFY_TOPIC.trim()) return process.env.ARSENAL_NTFY_TOPIC.trim();
    try { const t = readFileSync(join(STATE_DIR, "throwin_topic.txt"), "utf8").trim(); if (t) return t; } catch { }
    const bc = readJson(join(STATE_DIR, "brain_config.json"));
    return (bc && bc.ntfy && bc.ntfy.topic) || null;
  })();
  if (!topic) return [{ id: "sentinel-unmeasurable", level: "INFO", finding: "no ntfy topic reachable on this machine — the sentinel pulse measured nothing", evidence: "env ARSENAL_NTFY_TOPIC / throwin_topic.txt / brain_config ntfy.topic all empty" }];
  let rows = null;
  try {
    const since = Math.floor(new Date(`${today}T00:00:00`).getTime() / 1000);
    const r = await (deps.fetchFn || fetch)(`https://ntfy.sh/${encodeURIComponent(topic)}/json?poll=1&since=${since}`, { signal: AbortSignal.timeout(deps.timeoutMs || 8000) });
    if (r.ok) {
      rows = [];
      for (const line of (await r.text()).split("\n")) {
        if (!line.trim()) continue;
        try { const j = JSON.parse(line); if (j.event === "message") rows.push(j); } catch { }
      }
    }
  } catch { /* offline night — an honest unknown below */ }
  if (rows == null) return [{ id: "sentinel-unmeasurable", level: "INFO", finding: "ntfy history unreachable tonight — the sentinel pulse measured nothing (offline?)", evidence: "GET ntfy.sh/<topic>/json failed" }];
  const ours = (m) => /⚪🔴/.test(String(m.title || "")) || /^=\?UTF-8\?B\?/.test(String(m.title || "")) || /Laptop soya/i.test(`${m.title || ""} ${m.message || ""}`);
  if (!rows.some(ours)) {
    return [{ id: "sentinel-blind", level: "RED",
      finding: `today's ntfy history holds NEITHER a laptop row NOR the sentinel's fallback (${rows.length} row(s), none ours) — the mouth and the cloud sentinel cannot both be silent on the same day; check claude.ai/code/routines`,
      evidence: "ntfy.sh JSON history since local midnight — no ⚪🔴-badged title, no RFC2047 title, no 'Laptop soya'" }];
  }
  return [];
}

// ---------------------------------------------------------------------------
// LADDER G15 (9 Aug 2026) — THE WAKE-ECONOMY RE-FIT. est_tokens_per_wake (40k)
// was fitted on CACHE-BLIND rows from the full un-lean CLI — both wrong sides
// of G0+G1. The re-fit reads ONLY honest rows (job cortex_wake, ok, cache pair
// PRESENT — those exist only post-G1), needs ten of them (the G14 probe-count
// precedent, stated not hidden), takes p95×2, and writes it into
// thalamus_config.deep.est_tokens_per_wake with a dated receipt (the same
// blanket-ruling note pattern gate_tune uses for tiers; this probe owns ONLY
// this one key + its receipt). wake_cap 15 is untouched — the humane clamp.
// ---------------------------------------------------------------------------
export function probeWakeEconomy(deps = {}) {
  const rows = deps.rows !== undefined ? deps.rows : (() => {
    const out = [];
    try { for (const l of readFileSync(join(STATE_DIR, "brain_ledger.jsonl"), "utf8").split("\n")) { if (!l.trim()) continue; try { out.push(JSON.parse(l)); } catch { } } } catch { }
    return out;
  })();
  const honest = rows.filter((r) => r && r.job === "cortex_wake" && r.ok === true && r.cache_read_tokens != null && Number.isFinite(r.total_tokens) && r.total_tokens > 0);
  if (honest.length < 10) {
    return [{ id: "wake-economy-unmeasured", level: "INFO",
      finding: `wake-economy re-fit waiting — ${honest.length}/10 honest cortex rows (post-G1, cache pair present); est_tokens_per_wake stays as-is until the sample exists`,
      evidence: "brain_ledger.jsonl job=cortex_wake with cache_read_tokens non-null" }];
  }
  const totals = honest.map((r) => r.total_tokens).sort((a, b) => a - b);
  const p95 = totals[Math.min(totals.length - 1, Math.floor(totals.length * 0.95))];
  const fit = Math.ceil(p95 * 2);
  const write = deps.writeCfg || ((f) => {
    const p = join(STATE_DIR, "thalamus_config.json");
    const c = readJson(p);
    if (!c || !c.deep) return null;
    const prev = c.deep.est_tokens_per_wake;
    if (prev === f) return { prev, unchanged: true };
    c.deep.est_tokens_per_wake = f;
    c._wake_economy_refit = { at: new Date().toISOString(), n: honest.length, p95, fit: f, prev, by: "watchman probeWakeEconomy (LADDER G15, blanket ladder haan — this probe owns only this key + this receipt)" };
    try { writeFileSync(p + ".tmp" + process.pid, JSON.stringify(c, null, 1)); renameSync(p + ".tmp" + process.pid, p); return { prev }; } catch { return null; }
  });
  const res = write(fit);
  return [{ id: "wake-economy-refit", level: "INFO",
    finding: res === null ? `wake-economy re-fit computed (p95×2 = ${fit} from ${honest.length} honest rows) but the config write failed — nothing changed`
      : res.unchanged ? `wake-economy holds — p95×2 = ${fit} over ${honest.length} honest rows, already the configured est`
        : `wake-economy RE-FIT — est_tokens_per_wake ${res.prev} → ${fit} (p95 ${p95} × 2, ${honest.length} honest post-G1 rows); receipt in thalamus_config._wake_economy_refit`,
    evidence: "honest rows only: cortex_wake + ok + cache pair present (cache-blind rows can never re-enter the fit)" }];
}

// ---------------------------------------------------------------------------
// H0 FLOW AUDIT (10 Aug 2026) — THE EVENING CHAIN'S FIRST READER. LADDER D1
// gave the evening a spine and a report (conductor_evening.json, 9/9 on its
// maiden run) — and the H0 wire-check found ZERO readers anywhere: doctor and
// sentinel both read only the MORNING conductor.json, so a failed evening
// (scorer dead, wallpaper degraded, chain never fired) was invisible to every
// watcher. QUIET vs DEAD holds: the "silent tonight" claim is conditional on
// the sweep running AFTER the chain's own last step (EVENING's wallpaper `at`,
// the chain's declared shape — not a new number), so a morning or manual
// daytime sweep never cries wolf, and the just-past-midnight catch-up can't
// misread yesterday's report as tonight's absence (nowHM drops below lastAt).
// ---------------------------------------------------------------------------
export function probeEveningChain(today, nowHM, deps = {}) {
  const rep = deps.report !== undefined ? deps.report : readJson(join(STATE_DIR, "conductor_evening.json"));
  const lastAt = deps.lastAt || (EVENING.length && EVENING[EVENING.length - 1].at) || "23:10";
  if (!rep) {
    return nowHM >= lastAt
      ? [{ id: "evening-chain-unborn", level: "INFO", finding: "the evening conductor has NEVER written its report — the chain may never have run on this box", evidence: "conductor_evening.json absent" }]
      : [];
  }
  const day = localDayOf(rep.started);
  const out = [];
  if (Array.isArray(rep.steps)) {
    const failed = rep.steps.filter((s) => s && s.ok === false).map((s) => s.id);
    if (failed.length) out.push({ id: "evening-step-failed", level: "WARN", finding: `the evening chain's last run has ${failed.length} FAILED step(s): ${failed.join(", ")}`, evidence: `conductor_evening.json (${day}) failed=${rep.failed}` });
    const degraded = rep.steps.filter((s) => s && s.ok !== false && s.degraded).map((s) => s.id);
    if (degraded.length) out.push({ id: "evening-step-degraded", level: "INFO", finding: `evening step(s) ran DEGRADED: ${degraded.join(", ")}`, evidence: `conductor_evening.json (${day})` });
  }
  if (nowHM >= lastAt && day !== today) {
    out.push({ id: "evening-chain-silent", level: "WARN", finding: `tonight's evening chain has NOT reported (last report ${day}) — bell/scorer/examiner/wallpaper may not have run`, evidence: `conductor_evening.json started=${rep.started} vs today ${today}, sweep at ${nowHM} (chain's last step ${lastAt})` });
  }
  return out;
}

// ---------------------------------------------------------------------------
// H1 (10 Aug 2026) — THE SCOREBOARD'S NIGHT READER. brain_outcomes.jsonl is
// H1's outcome journal (sole writer scoreboard.mjs, evening chain 22:38).
// Conditional by the house law — a clean day emits NOTHING (H2/H6 read the
// journal directly; the watchman is for anomalies):
//   · cracked>0 on YESTERDAY (settled by the evening-D revisit; today's rows
//     are still subject to tomorrow's straggler supersede) → INFO naming them
//   · the evening chain RAN yesterday yet the journal has no yesterday rows
//     → WARN (a broken wire between conductor and scoreboard)
//   · this morning's night_coach .md exists with NO .json sibling → INFO —
//     the sibling is Join 1's whole food and its live emission rate was 0-for-1
//     when H1 shipped; a silent parse-miss must not stay silent for a week.
// ---------------------------------------------------------------------------
export function probeOutcomes(today, yday, deps = {}) {
  const out = [];
  const rows = deps.rows !== undefined ? deps.rows : (() => {
    const r = [];
    try {
      for (const line of readFileSync(join(STATE_DIR, "brain_outcomes.jsonl"), "utf8").split("\n")) {
        if (!line.trim()) continue;
        try { r.push(JSON.parse(line)); } catch { }
      }
    } catch { }
    return r;
  })();
  const last = new Map();
  for (const r of rows) last.set(`${r.day}|${r.kind}|${r.subject}`, r);   // append order = last wins
  const yRows = [...last.values()].filter((r) => r.day === yday);
  const cracked = yRows.filter((r) => (r.kind === "misconception" || r.kind === "lesson") && r.verdict === "cracked");
  if (cracked.length) {
    out.push({ id: "outcomes-cracked", level: "INFO",
      finding: `yesterday's named misconception(s) CRACKED again in his own reps: ${cracked.map((r) => r.subject).join(", ")} — the lesson has not landed`,
      evidence: `brain_outcomes.jsonl day ${yday}: ${cracked.map((r) => `${r.subject} ${r.n_correct}✓/${r.n_wrong}✗`).join(" · ")}` });
  }
  const evRep = deps.eveningReport !== undefined ? deps.eveningReport : readJson(join(STATE_DIR, "conductor_evening.json"));
  if (!yRows.length && evRep && localDayOf(evRep.started) === yday) {
    out.push({ id: "scoreboard-silent", level: "WARN",
      finding: `the evening chain RAN yesterday (conductor_evening ${yday}) but the scoreboard journal holds NO rows for that day — the wire between conductor and scoreboard is broken`,
      evidence: `brain_outcomes.jsonl has 0 ${yday} rows · conductor_evening.json started=${evRep.started}` });
  }
  const ncDir = deps.ncDir || join(STATE_DIR, "brain_out", "night_coach");
  if (existsSync(join(ncDir, today + ".md")) && !existsSync(join(ncDir, today + ".json"))) {
    out.push({ id: "coach-json-absent", level: "INFO",
      finding: `this morning's night_coach lesson exists as .md only — the machine sibling (.json) did not parse, so H1's misconception join reads 'unmeasurable' today`,
      evidence: `brain_out/night_coach/${today}.md present, ${today}.json absent (the sibling's live emission rate was 0-for-1 when H1 shipped)` });
  }
  return out;
}

// ---------------------------------------------------------------------------
// THE RECITAL WATCH (10 Aug 2026) — the second reader of a journal that had one.
// Today the Gaffer learned to read the captain's locked capsules back to him
// VERBATIM, and every recital is graded BY THE MACHINE (dugout.mjs /recital →
// recital_audit.jsonl, its single writer — he is never asked to check it, per
// THE ANCHOR LAW). dugout's recitalScar() then injects the Gaffer's own worst
// verdicts into his constitution every session, so the organ self-corrects.
// That is exactly half a loop: it corrects itself where nobody can see it. If
// he drifts every night for a week, the constitution knows and the captain does
// not — the black box he objected to. This probe is the visible half. READ-ONLY;
// a cross-organ write would break the single-writer law for no gain.
//
// The four verdicts, and why they are not equal:
//   DRIFT      his own prose paraphrased back at him (dugout's coverage < 85%).
//              The worst of the four by construction — the entire surface exists
//              to give him HIS sentences, so a smoother version does not degrade
//              the feature, it defeats it. Ranked first here because dugout ranks
//              it first itself: it paints DRIFT Arsenal red (#EF0107) and both
//              others amber (#d29922). Among the amber pair, by count — the same
//              worst-first tally recitalScar() already sorts by.
//   NO-PRICE   it began reading without saying what the read costs; he cannot
//              see the text, so the price is his only way to know the length.
//   OVERRUN    it kept going past the page instead of stopping for his word.
//   UNVERIFIED no transcript that session (the wire strips its own
//              outputTranscription after two early closes). NEVER a pass — and
//              never a failure either. Ungraded rows are counted apart, kept out
//              of the denominator, and named, so "clean" can never be a night
//              nothing was actually measured.
//
// WINDOW: the local day — the same filter gather() puts on afferent rows, audit
// rows and mouth rows. This is the 23:55 sweep, so the day is closed when it
// reads. THRESHOLD: none invented. ANY failing verdict in the window speaks;
// dugout owns the one real number (its 85% coverage cut) and a second threshold
// here would be a guess. QUIET vs DEAD holds at both ends: an absent journal and
// a day with no recitals are both silence, because a day he never opened the
// dugout is a day off, not a failure.
// ---------------------------------------------------------------------------
export function probeRecital(today, deps = {}) {
  const rows = deps.rows !== undefined ? deps.rows : (() => {
    const r = [];
    try {
      for (const line of readFileSync(join(STATE_DIR, "recital_audit.jsonl"), "utf8").split("\n")) {
        if (!line.trim()) continue;
        try { r.push(JSON.parse(line)); } catch { }
      }
    } catch { /* never born = no recital has ever been graded, which is not a wound */ }
    return r;
  })();
  const day = rows.filter((r) => r && localDayOf(r.ts) === today);
  if (!day.length) return [];
  const ungraded = day.filter((r) => r.verdict === "UNVERIFIED");
  const graded = day.filter((r) => r.verdict && r.verdict !== "UNVERIFIED");
  if (!graded.length) {
    return [{ id: "recital-unverified", level: "INFO",
      finding: `all ${ungraded.length} recital(s) today came back UNVERIFIED — the transcript was stripped, so NOTHING about the Gaffer's reading could be graded tonight, in either direction`,
      evidence: "recital_audit.jsonl verdict=UNVERIFIED (dugout: the wire drops its own outputTranscription after two early closes) — an UNVERIFIED row is never counted as a pass, in any organ" }];
  }
  const bad = graded.filter((r) => r.verdict !== "PASS");
  if (!bad.length) return [];
  const tally = {};
  for (const r of bad) tally[r.verdict] = (tally[r.verdict] || 0) + 1;
  const worst = Object.entries(tally)
    .sort((a, b) => (a[0] === "DRIFT" ? 0 : 1) - (b[0] === "DRIFT" ? 0 : 1) || b[1] - a[1] || a[0].localeCompare(b[0]));
  const WHAT = {
    DRIFT: "HIS OWN PROSE PARAPHRASED BACK AT HIM",
    "NO-PRICE": "started reading without first saying what the read costs",
    OVERRUN: "kept reading past the page instead of stopping for his word",
  };
  // Both caps are mirrored, not chosen: 5 rows is probeReconcile's own display cap
  // (the night stays readable, the journal keeps everything), and 8 dropped words
  // is recitalScar's slice — the Gaffer and the captain read the same sample.
  const dropped = [...new Set(bad.filter((r) => r.verdict === "DRIFT").flatMap((r) => r.missing || []))].slice(0, 8);
  return [{
    // WARN, not INFO, and the choice is deliberate: INFO never reaches briefLines,
    // and a record he cannot see is the defect this probe exists to close. Non-INFO
    // also arms Tier 2, which is in-lane — the repair, if there is one, lives in
    // dugout.mjs's recital law; the capsules whose prose was smoothed are already
    // forbidden ground in the Tier-2 prompt's HARD LIMITS.
    id: "recital-failed", level: "WARN",
    finding: `the Gaffer failed ${bad.length} of ${graded.length} graded recital(s) today — `
      + worst.map(([v, c]) => `${v} ×${c} (${WHAT[v] || "re-read THE RECITAL LAW"})`).join(" · "),
    evidence: bad.slice(0, 5).map((r) => `${r.capsule || "?"} ${r.page || "?"}: ${r.verdict}, ${r.coverage}% of his words in order (${r.spoken_words} spoken vs ${r.payload_words} handed over)`).join(" · ")
      + (bad.length > 5 ? ` · ${bad.length - 5} more in recital_audit.jsonl` : "")
      + (ungraded.length ? ` · ${ungraded.length} further recital(s) UNVERIFIED tonight — ungraded, counted as neither pass nor failure` : "")
      + (dropped.length ? ` · words of HIS that were dropped: ${dropped.join(", ")}` : "")
      + " — dugout.mjs recitalScar() already feeds this into the Gaffer's own constitution; this line exists so the captain sees what the machine corrected",
  }];
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
  findings.push(...probePulse());          // ULTRACODE 12 Aug — the ◇≤T liveness law (NEVER class = RED)
  findings.push(...probeCanon(w.today));   // LADDER B8 — the canon watch
  findings.push(...probeExpectedTasks()); // LADDER E2 — the schedule diff
  findings.push(...await probeSentinel(w.today)); // LADDER E8 — the sentinel's pulse
  findings.push(...probeWakeEconomy());   // LADDER G15 — the honest wake re-fit
  const nowHM = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  findings.push(...probeEveningChain(w.today, nowHM)); // H0 — the evening report's first reader
  findings.push(...probeOutcomes(w.today, yday));      // H1 — the scoreboard's night reader
  findings.push(...probeRecital(w.today));             // the recital watch — the Gaffer's graded reads

  const prevLast = readJson(LAST);
  // H0 (10 Aug 2026): the overnight window rides brain_config (same night the
  // whole lane rides); fallback = brain.mjs DEFAULTS.overnight, not a new number.
  const bcfgOvernight = ((readJson(join(STATE_DIR, "brain_config.json")) || {}).overnight) || {};
  const win = { start: bcfgOvernight.start || "22:00", end: bcfgOvernight.end || "07:30" };
  const gate = tier2Gate(prevLast, findings, w.today, noTier2, nowHM, win);
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
  // §6.2, remeasured live every print (P7, 9 Aug 2026): "permanently impossible" fell
  // the day scripts/harvest.mjs shipped. Coverage = what actually reached the bus —
  // the same conditional-live-read shape as the CHECKED_RULES block above, because a
  // hardcoded prose line here is exactly what rotted for a month before this.
  const gl = geminiLane();
  if (gl.turns > 0) {
    console.log("  COVERED AS HARVESTED — the GEMINI surface: /harvest lane live since 9 Aug 2026; coverage = the sittings");
    console.log(`    he harvests. On the bus: ${gl.his} of his turns · ${gl.gem} Gem turns · last ${String(gl.last || "?").slice(0, 10)}. Un-harvested`);
    console.log("    sittings stay invisible; reps stay shape-validated (capture.mjs), outcomes in gemini_quality.jsonl.\n");
  } else {
    console.log("  NOT COVERED YET — the GEMINI surface: the /harvest lane exists (since 9 Aug 2026) but no sitting has been");
    console.log("    harvested yet — until he says \"harvest\" after a Gem sitting, teaching there stays UNMEASURED. Reps arrive");
    console.log("    shape-validated (capture.mjs); outcome lane = gemini_quality.jsonl (§6.2 — stated, not silently absent).\n");
  }
}

// the gemini lane, read off the bus itself — live file AND monthly archives
// (afferent.YYYY-MM.jsonl: the roll is boot-armed; a reader that forgets the
// siblings goes blind the morning after a daemon restart). Read-only.
function geminiLane() {
  const out = { turns: 0, his: 0, gem: 0, last: null };
  try {
    const files = readdirSync(STATE_DIR).filter((f) => /^afferent(\.\d{4}-\d{2})?\.jsonl$/.test(f));
    for (const f of files) {
      for (const line of readFileSync(join(STATE_DIR, f), "utf8").split("\n")) {
        if (!line.trim()) continue;
        let r; try { r = JSON.parse(line); } catch { continue; }
        if (!r || (r.source !== "gemini-study" && r.source !== "gemini-study-teaching")) continue;
        out.turns += 1;
        if (r.source === "gemini-study") out.his += 1; else out.gem += 1;
        if (r.ts && (!out.last || r.ts > out.last)) out.last = r.ts;
      }
    }
  } catch { }
  return out;
}

// ---------------------------------------------------------------------------
async function selftest() {   // async since LADDER E8 — probeSentinel checks await injected fetches
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

  // LADDER B3 — the claude CLI's login health rides the sweep
  assert("B3 RED — token_vitals health.not_logged_in ⇒ claude-logged-out with the streak; healthy or absent stays silent",
    checks({ ...base, token_health: { streak: 7, dead: true, not_logged_in: true, hint: "run /login" } })
      .some((f) => f.id === "claude-logged-out" && f.level === "RED" && /7 consecutive/.test(f.finding))
    && !checks({ ...base, token_health: { streak: 0, dead: false, not_logged_in: false } }).some((f) => f.id === "claude-logged-out")
    && !checks(base).some((f) => f.id === "claude-logged-out"));

  // LADDER B8 — the canon watch (injected: no git, no card spawn)
  {
    const filed = [];
    const f1 = probeCanon(TODAY, {
      git: () => " M OPS_STATE.md\n?? scratch.txt\n M scripts/brain.mjs\n",
      fileCard: (line, key) => { filed.push(key); return true; },
    });
    assert("B8 — an uncommitted canon delta is RED + files ONE idempotent day-keyed card; non-canon files are ignored",
      f1.length === 1 && f1[0].id === "canon-drift-OPS_STATE.md" && f1[0].level === "RED"
      && filed.length === 1 && filed[0] === `canon:OPS_STATE.md:${TODAY}`);
    assert("B8 — a clean tree measures ZERO findings; a dead git is an INFO honest-unknown, never a fake clean",
      probeCanon(TODAY, { git: () => "", fileCard: () => true }).length === 0
      && probeCanon(TODAY, { git: () => null, fileCard: () => true })
        .some((f) => f.id === "canon-watch-unrunnable" && f.level === "INFO"));
    assert("B8 — all four canon files are watched (the exact four CLAUDE.md names)",
      CANON_FILES.length === 4 && CANON_FILES.includes("THE_GAFFER.md")
      && probeCanon(TODAY, { git: () => CANON_FILES.map((f) => ` M ${f}`).join("\n"), fileCard: () => true }).length === 4);
  }

  // LADDER E4 — the silent mouth (tally, INFO)
  assert("E4 — ntfy enabled + zero sent rows today ⇒ mouth-silent-today with the attempt count; a sent row or disabled ntfy stays quiet",
    checks({ ...base, mouth: { enabled: true, attempts_today: 2, sent_today: 0 } })
      .some((f) => f.id === "mouth-silent-today" && f.level === "INFO" && /2 attempt/.test(f.finding))
    && !checks({ ...base, mouth: { enabled: true, attempts_today: 2, sent_today: 1 } }).some((f) => f.id === "mouth-silent-today")
    && !checks({ ...base, mouth: { enabled: false, attempts_today: 0, sent_today: 0 } }).some((f) => f.id === "mouth-silent-today")
    && !checks(base).some((f) => f.id === "mouth-silent-today"));

  // LADDER E8 — the coach that didn't teach (WARN)
  assert("E8 — night_coach enabled + no lesson file for today ⇒ WARN; file present or job disabled stays quiet",
    checks({ ...base, night_coach: { enabled: true, today_file: false } })
      .some((f) => f.id === "night-coach-absent" && f.level === "WARN")
    && !checks({ ...base, night_coach: { enabled: true, today_file: true } }).some((f) => f.id === "night-coach-absent")
    && !checks({ ...base, night_coach: { enabled: false, today_file: false } }).some((f) => f.id === "night-coach-absent"));

  // LADDER E2 — the schedule diff (injected)
  {
    const EXP = {
      expected_enabled: ["ArsenalFC-Watchman", "ArsenalFC-BrainDaemon"],
      expected_disabled: ["ArsenalFC-Scorer"],
      designed_absent: { "ArsenalFC-SelfKnowledge": "his 7 Aug freeze" },
    };
    const mkLive = (pairs) => new Map(pairs);
    assert("E2 — vanished expected task is RED; darkened is WARN; a re-enabled designed-disabled is a double-run WARN",
      probeExpectedTasks({ expected: EXP, live: mkLive([["ArsenalFC-BrainDaemon", "Ready"], ["ArsenalFC-Scorer", "Ready"]]) })
        .some((f) => f.id === "task-vanished-ArsenalFC-Watchman" && f.level === "RED")
      && probeExpectedTasks({ expected: EXP, live: mkLive([["ArsenalFC-Watchman", "Disabled"], ["ArsenalFC-BrainDaemon", "Ready"], ["ArsenalFC-Scorer", "Disabled"]]) })
        .some((f) => f.id === "task-darkened-ArsenalFC-Watchman" && f.level === "WARN")
      && probeExpectedTasks({ expected: EXP, live: mkLive([["ArsenalFC-Watchman", "Ready"], ["ArsenalFC-BrainDaemon", "Ready"], ["ArsenalFC-Scorer", "Ready"]]) })
        .some((f) => f.id === "task-double-run-ArsenalFC-Scorer" && f.level === "WARN"));
    assert("E2 — a designed-absent task REAPPEARING is RED with the why; an unlisted new task is only INFO; a clean diff is zero findings",
      probeExpectedTasks({ expected: EXP, live: mkLive([["ArsenalFC-Watchman", "Ready"], ["ArsenalFC-BrainDaemon", "Ready"], ["ArsenalFC-Scorer", "Disabled"], ["ArsenalFC-SelfKnowledge", "Disabled"]]) })
        .some((f) => f.id === "task-resurrected-ArsenalFC-SelfKnowledge" && f.level === "RED" && /7 Aug freeze/.test(f.finding))
      && probeExpectedTasks({ expected: EXP, live: mkLive([["ArsenalFC-Watchman", "Ready"], ["ArsenalFC-BrainDaemon", "Ready"], ["ArsenalFC-Scorer", "Disabled"], ["ArsenalFC-NewThing", "Ready"]]) })
        .some((f) => f.id === "task-unlisted-ArsenalFC-NewThing" && f.level === "INFO")
      && probeExpectedTasks({ expected: EXP, live: mkLive([["ArsenalFC-Watchman", "Ready"], ["ArsenalFC-BrainDaemon", "Ready"], ["ArsenalFC-Scorer", "Disabled"]]) }).length === 0
      && probeExpectedTasks({ expected: null }).length === 0
      && probeExpectedTasks({ expected: EXP, live: null }).some((f) => f.id === "tasks-expected-unrunnable"));
  }

  // LADDER E8 — the sentinel's pulse (injected fetch)
  {
    const day = "2026-08-09";
    const mkFetch = (lines) => async () => ({ ok: true, text: async () => lines.join("\n") });
    const sheetRow = JSON.stringify({ event: "message", title: "⚪🔴 Team sheet is up", message: "x" });
    const encRow = JSON.stringify({ event: "message", title: "=?UTF-8?B?4pqq8J+UtA==?=", message: "x" });
    const sentinelRow = JSON.stringify({ event: "message", title: "Laptop soya", message: "mini-brief" });
    const noise = JSON.stringify({ event: "message", title: "someone else", message: "spam" });
    assert("E8 SENTINEL — a badge-signed row, an RFC2047 row, or the fallback each count as proof-of-life; pure noise is RED sentinel-blind",
      (await probeSentinel(day, { topic: "t", fetchFn: mkFetch([sheetRow]) })).length === 0
      && (await probeSentinel(day, { topic: "t", fetchFn: mkFetch([encRow]) })).length === 0
      && (await probeSentinel(day, { topic: "t", fetchFn: mkFetch([sentinelRow]) })).length === 0
      && (await probeSentinel(day, { topic: "t", fetchFn: mkFetch([noise]) })).some((f) => f.id === "sentinel-blind" && f.level === "RED"));
    assert("E8 SENTINEL — no topic and a dead fetch are each an honest INFO unknown, never a fake RED",
      (await probeSentinel(day, { topic: null })).some((f) => f.id === "sentinel-unmeasurable")
      && (await probeSentinel(day, { topic: "t", fetchFn: async () => { throw new Error("offline"); } })).some((f) => f.id === "sentinel-unmeasurable"));
  }

  // LADDER G15 — the wake-economy re-fit (injected rows + write stub)
  {
    const mkRow = (tok, cache) => ({ job: "cortex_wake", ok: true, total_tokens: tok, cache_read_tokens: cache });
    const blind = Array.from({ length: 20 }, () => ({ job: "cortex_wake", ok: true, total_tokens: 40000, cache_read_tokens: null }));
    assert("G15 — cache-blind rows can NEVER enter the fit; under ten honest rows the probe waits out loud",
      probeWakeEconomy({ rows: blind }).some((f) => f.id === "wake-economy-unmeasured" && /0\/10/.test(f.finding)));
    const honest = Array.from({ length: 19 }, (_, i) => mkRow(10000 + i * 500, 5000)).concat([mkRow(30000, 5000)]);
    let wrote = null;
    const f2 = probeWakeEconomy({ rows: honest, writeCfg: (fit) => { wrote = fit; return { prev: 40000 }; } });
    assert("G15 — ten+ honest rows re-fit at p95×2 with the receipt named, and the write carries the new number",
      f2.some((x) => x.id === "wake-economy-refit" && /RE-FIT/.test(x.finding)) && wrote === 60000);   // p95 idx floor(20×.95)=19 → 30000 × 2
    assert("G15 — an unchanged fit reports HOLD, never a phantom rewrite",
      probeWakeEconomy({ rows: honest, writeCfg: () => ({ prev: 38000, unchanged: true }) })
        .some((x) => /wake-economy holds/.test(x.finding)));
  }

  // Tier-2 gate
  const hard = [{ id: "x", level: "DEAD", finding: "f", evidence: "e" }];
  const info = [{ id: "y", level: "INFO", finding: "f", evidence: "e" }];
  // ON = the 7th arg. These assertions pin the gate's LOGIC; the assertion right
  // below them pins the POLICY (off by default, his 11 Aug ruling). Kept apart on
  // purpose: if the switch is ever re-armed, the logic tests must already be green.
  const ON = true;
  assert("TIER-2 GATE — fires on a non-INFO finding when it has not run today",
    tier2Gate(null, hard, TODAY, false, null, null, ON).fire === true);
  assert("TIER-2 GATE — a clean night never fires (the split IS the billing guard, M-3 does not exist yet)",
    tier2Gate(null, [], TODAY, false, null, null, ON).fire === false);
  assert("TIER-2 GATE — INFO-only never fires",
    tier2Gate(null, info, TODAY, false, null, null, ON).fire === false);
  assert("TIER-2 GATE — once per local day, structural, not a threshold",
    tier2Gate({ tier2: { day: TODAY, started_at: "x" } }, hard, TODAY, false, null, null, ON).fire === false
    && tier2Gate({ tier2: { day: YDAY, started_at: "x" } }, hard, TODAY, false, null, null, ON).fire === true);
  assert("TIER-2 GATE — --no-tier2 (manual/demo) is honoured and says so",
    tier2Gate(null, hard, TODAY, true).fire === false && /no-tier2/.test(tier2Gate(null, hard, TODAY, true).why));

  // THE KILL SWITCH (11 Aug 2026, HIS RULING). Measured: 5 starts / 0 exits / 0
  // journal rows since 7 Aug. Default OFF, and the refusal must SAY it is a
  // decision — an absence that looks like a clean night is how this rots back in.
  assert("TIER-2 KILL SWITCH — OFF by default even with real findings, and the why names the ruling",
    tier2Gate(null, hard, TODAY, false).fire === false
    && /DISABLED by his 11 Aug ruling/.test(tier2Gate(null, hard, TODAY, false).why)
    && /ARSENAL_TIER2=1/.test(tier2Gate(null, hard, TODAY, false).why));
  assert("TIER-2 KILL SWITCH — a clean night still reports the CLEAN reason, not the kill reason (the two must never blur)",
    /clean night/.test(tier2Gate(null, [], TODAY, false).why));

  // --- H0 FLOW AUDIT (10 Aug 2026): the maiden-class death's guards ---------
  const WIN = { start: "22:00", end: "07:30" };
  assert("TIER-2 GATE H0 — a mid-day catch-up spawn DEFERS (the 8 Aug death class), and says why",
    tier2Gate(null, hard, TODAY, false, "13:13", WIN, ON).fire === false
    && /re-sleep/.test(tier2Gate(null, hard, TODAY, false, "13:13", WIN, ON).why));
  assert("TIER-2 GATE H0 — inside the overnight window (both sides of midnight) still fires",
    tier2Gate(null, hard, TODAY, false, "23:55", WIN, ON).fire === true
    && tier2Gate(null, hard, TODAY, false, "02:30", WIN, ON).fire === true);
  assert("TIER-2 GATE H0 — no clock supplied (legacy caller/selftest) keeps the old behaviour",
    tier2Gate(null, hard, TODAY, false, null, null, ON).fire === true);
  assert("TIER-2 GATE H0 — a tier2-vanished RED alone RE-ARMS the lane the following night (the recovery path is the gate itself)",
    tier2Gate(null, [{ id: "tier2-vanished", level: "RED", finding: "f", evidence: "e" }], TODAY, false, "23:55", WIN, ON).fire === true);
  assert("inWindow — wraps midnight and honours a plain window",
    inWindow("23:55", "22:00", "07:30") && inWindow("02:30", "22:00", "07:30")
    && !inWindow("13:13", "22:00", "07:30") && inWindow("12:00", "09:00", "21:00") && !inWindow("22:00", "09:00", "21:00"));

  // --- H0: the evening chain's first reader ---------------------------------
  const evOk = { started: `${TODAY}T17:03:29.758Z`, failed: 0, steps: [{ id: "bell", ok: true }, { id: "scorer", ok: true }] };
  assert("EVENING PROBE — a clean same-day report after the chain's last step = silence",
    probeEveningChain(TODAY, "23:55", { report: { ...evOk, started: `${TODAY}T18:00:00+05:30` }, lastAt: "23:10" }).length === 0);
  assert("EVENING PROBE — a FAILED step is a WARN naming the step, whenever the sweep runs",
    probeEveningChain(TODAY, "12:00", { report: { ...evOk, failed: 1, steps: [{ id: "bell", ok: true }, { id: "scorer", ok: false }] }, lastAt: "23:10" })
      .some((f) => f.id === "evening-step-failed" && /scorer/.test(f.finding)));
  assert("EVENING PROBE — a DEGRADED step is an INFO, not a WARN (it ran; it limped)",
    probeEveningChain(TODAY, "23:55", { report: { ...evOk, started: `${TODAY}T18:00:00+05:30`, steps: [{ id: "wallpaper", ok: true, degraded: "wall dead" }] }, lastAt: "23:10" })
      .some((f) => f.id === "evening-step-degraded" && f.level === "INFO"));
  assert("EVENING PROBE — silent tonight fires ONLY after the chain's own last step (QUIET vs DEAD)",
    probeEveningChain(TODAY, "23:55", { report: { ...evOk, started: `${YDAY}T18:00:00+05:30` }, lastAt: "23:10" })
      .some((f) => f.id === "evening-chain-silent")
    && !probeEveningChain(TODAY, "12:00", { report: { ...evOk, started: `${YDAY}T18:00:00+05:30` }, lastAt: "23:10" })
      .some((f) => f.id === "evening-chain-silent"));
  assert("EVENING PROBE — just-past-midnight catch-up cannot misread yesterday's report as tonight's absence",
    probeEveningChain(TODAY, "00:15", { report: { ...evOk, started: `${YDAY}T18:00:00+05:30` }, lastAt: "23:10" }).length === 0);
  assert("EVENING PROBE — never-born says so once (INFO), and only after the chain's hour",
    probeEveningChain(TODAY, "23:55", { report: null, lastAt: "23:10" }).some((f) => f.id === "evening-chain-unborn")
    && probeEveningChain(TODAY, "12:00", { report: null, lastAt: "23:10" }).length === 0);

  // --- H1: the scoreboard's night reader (conditional by the house law) -----
  const noNc = { ncDir: join(STATE_DIR, "__no_such_dir__") };
  const oRows = (v) => [{ day: YDAY, kind: "misconception", subject: "hallucinations", verdict: v, n_correct: v === "cracked" ? 0 : 2, n_wrong: v === "cracked" ? 2 : 0 }];
  assert("OUTCOMES PROBE — a clean/held yesterday emits NOTHING (quiet-when-clean)",
    probeOutcomes(TODAY, YDAY, { rows: oRows("held"), eveningReport: null, ...noNc }).length === 0);
  assert("OUTCOMES PROBE — a cracked misconception speaks (INFO), naming the concept",
    probeOutcomes(TODAY, YDAY, { rows: oRows("cracked"), eveningReport: null, ...noNc })
      .some((f) => f.id === "outcomes-cracked" && /hallucinations/.test(f.finding)));
  assert("OUTCOMES PROBE — chain ran + journal empty = WARN broken wire; chain absent = silence (never guesses)",
    probeOutcomes(TODAY, YDAY, { rows: [], eveningReport: { started: `${YDAY}T18:00:00+05:30` }, ...noNc })
      .some((f) => f.id === "scoreboard-silent" && f.level === "WARN")
    && probeOutcomes(TODAY, YDAY, { rows: [], eveningReport: null, ...noNc }).length === 0);
  assert("OUTCOMES PROBE — supersede rows read last-wins (a cracked row superseded by held is silence)",
    probeOutcomes(TODAY, YDAY, { rows: oRows("cracked").concat(oRows("held")), eveningReport: null, ...noNc }).length === 0);

  // --- THE RECITAL WATCH (10 Aug 2026): fixtures only, never the live journal --
  {
    const rct = (verdict, over = {}) => ({
      ts: `${TODAY}T20:15:00+05:30`, capsule: "embeddings", page: "weld", verdict,
      coverage: verdict === "DRIFT" ? 61 : 97, priced: verdict !== "NO-PRICE", overrun: verdict === "OVERRUN",
      payload_words: 180, spoken_words: verdict === "OVERRUN" ? 600 : 176, missing: [], ...over,
    });
    assert("RECITAL — a night of clean reads says NOTHING (silence is the contract; a line that always fires is one he learns to ignore)",
      probeRecital(TODAY, { rows: [rct("PASS"), rct("PASS")] }).length === 0);
    assert("RECITAL — an empty/never-born journal and a day with no recitals are both silence (QUIET vs DEAD: he simply did not open the dugout)",
      probeRecital(TODAY, { rows: [] }).length === 0
      && probeRecital(TODAY, { rows: [rct("DRIFT", { ts: `${YDAY}T20:15:00+05:30` })] }).length === 0);
    assert("RECITAL — DRIFT is named as HIS PROSE PARAPHRASED and ranked FIRST even when outnumbered (dugout paints it red, the other two amber)",
      (() => {
        const f = probeRecital(TODAY, { rows: [rct("NO-PRICE"), rct("NO-PRICE"), rct("NO-PRICE"), rct("DRIFT", { missing: ["jhoot", "confidently"] })] });
        return f.length === 1 && f[0].id === "recital-failed" && f[0].level === "WARN"
          && /DRIFT ×1.*NO-PRICE ×3/.test(f[0].finding) && /PARAPHRASED BACK AT HIM/.test(f[0].finding)
          && /failed 4 of 4/.test(f[0].finding) && /jhoot, confidently/.test(f[0].evidence);
      })());
    assert("RECITAL — OVERRUN and NO-PRICE each speak on their own: ANY failure in the window, no invented percentage",
      probeRecital(TODAY, { rows: [rct("PASS"), rct("OVERRUN")] }).some((f) => f.id === "recital-failed" && /OVERRUN ×1/.test(f.finding))
      && probeRecital(TODAY, { rows: [rct("PASS"), rct("NO-PRICE")] }).some((f) => f.id === "recital-failed" && /NO-PRICE ×1/.test(f.finding)));
    assert("RECITAL — UNVERIFIED is never a PASS: it stays out of the graded denominator and is named separately in the evidence",
      (() => {
        const f = probeRecital(TODAY, { rows: [rct("PASS"), rct("DRIFT"), rct("UNVERIFIED"), rct("UNVERIFIED")] });
        return f.length === 1 && /failed 1 of 2 graded/.test(f[0].finding)
          && /2 further recital\(s\) UNVERIFIED/.test(f[0].evidence);
      })());
    assert("RECITAL — UNVERIFIED is never a FAILURE either: passes plus stripped transcripts stay silent",
      probeRecital(TODAY, { rows: [rct("PASS"), rct("UNVERIFIED")] }).length === 0);
    assert("RECITAL — a night that is ENTIRELY UNVERIFIED says so plainly (INFO): the transcript was stripped, nothing could be graded",
      (() => {
        const f = probeRecital(TODAY, { rows: [rct("UNVERIFIED"), rct("UNVERIFIED")] });
        return f.length === 1 && f[0].id === "recital-unverified" && f[0].level === "INFO"
          && /all 2 recital\(s\) today came back UNVERIFIED/.test(f[0].finding) && /never counted as a pass/.test(f[0].evidence);
      })());
    assert("RECITAL — the finding is WARN, so it REACHES the kickoff line: the self-correcting loop is no longer invisible to the captain",
      (() => {
        const f = probeRecital(TODAY, { rows: [rct("DRIFT")] });
        return briefLines({ at: `${TODAY}T23:55:00+05:30`, findings: f }, TODAY, YDAY).some((l) => /WARN:recital-failed/.test(l));
      })());
  }

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
  // Both halves exercised in one process by toggling the env the lane reads. The
  // RED half is the one that would otherwise rot: with the lane off by default,
  // an assertion that only checked today's behaviour would stop guarding the
  // behaviour that returns the moment he re-arms it.
  const withTier2 = (on, fn) => {
    const prev = process.env.ARSENAL_TIER2;
    if (on) process.env.ARSENAL_TIER2 = "1"; else delete process.env.ARSENAL_TIER2;
    try { return fn(); } finally { if (prev === undefined) delete process.env.ARSENAL_TIER2; else process.env.ARSENAL_TIER2 = prev; }
  };
  assert("c9 — with the lane ARMED, a previous-day start with no exit and no journal row = tier2-vanished RED",
    withTier2(true, () => checks(trail("2026-08-05T14:16:16.376Z", false, false)).some((f) => f.id === "tier2-vanished" && f.level === "RED")));
  assert("c9 — with the lane DISABLED the same corpse is INFO, not RED: a dead lane's last footprint can never clear, and a permanent RED teaches him to stop reading the watchman",
    withTier2(false, () => {
      const f = checks(trail("2026-08-05T14:16:16.376Z", false, false)).find((x) => x.id === "tier2-vanished");
      return f && f.level === "INFO" && /DISABLED by his 11 Aug ruling|history, not a live fault/.test(f.finding);
    }));
  assert("c9 — the corpse is never DELETED, in either state (the day it happened stays evidence)",
    withTier2(false, () => checks(trail("2026-08-05T14:16:16.376Z", false, false)).some((f) => f.id === "tier2-vanished"))
    && withTier2(true, () => checks(trail("2026-08-05T14:16:16.376Z", false, false)).some((f) => f.id === "tier2-vanished")));
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
