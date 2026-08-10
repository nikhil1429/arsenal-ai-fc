#!/usr/bin/env node
// ============================================================================
// outwork_audit.mjs · ARSENAL AI FC — DID THE DAY DO ITS JOB (the outwork half)
// ----------------------------------------------------------------------------
// WHY (full-organism audit P8.2, 7 Aug 2026): behavioural self-correction
// existed for exactly ONE thing — teaching. teaching_audit.mjs measures whether
// Claude taught correctly; NOTHING measured whether the day's cadence did its
// job: kickoff/full-time, the floor, the KAL→next-morning weld, the honest
// review, the 3-bucket time split. For that whole layer the only question ever
// asked was "did the organ run" (watchman), never "did it do its job right".
// This organ is the outwork layer's teaching_audit: deterministic, evidence-
// paired, threshold-free — presence and pairing tests only, per the captain's
// standing no-guessed-numbers rule.
//
// QUIET vs DEAD, same law as the watchman: a check fires only when its
// PRECONDITIONS are on disk (a day with zero activity owes no full-time; a
// missing KAL-line owes no weld). Silence = measured-clean or no-work-today,
// and the report says which.
//
// COVERAGE HONESTY, stated where he will see it (report + the watchman ride):
// canon's WON-DAY = 5 non-negotiables (DAILY_CADENCE.md). What is machine-
// checkable is the PAPER TRAIL, not the substance:
//   1 floor-attempt/conscious-rest — the RESULT line records it; the truth of
//     it is his word at full-time. Machine sees the line exists.
//   2 depth-when-working             — NOT machine-checkable (no depth sensor).
//   3 Bolo on every touched concept  — NOT machine-checkable here (voice-first
//     by canon; no transcript of his voice reaches this machine).
//   4 honest review                  — machine sees a RESULT: line was written;
//     honesty itself is exactly what cannot be automated.
//   5 Sunday off                     — deliberately unchecked (his life; a rest
//     day needs no permission slip from a script).
// The BOLO→GRADER weld (PROJECT_OS §ONE ORGANISM seam 2) lives in the /forge
// and /scrimmage skills (DOSSIER rubric via dossier_weights.json) — a skill-
// level behaviour this organ cannot see and does not pretend to.
//
// CHECKS (each returns a finding or null; all pure(world) for the selftest):
//   o1 FULL-TIME-MISSING  activity today + evening hour ⇒ post_match/<today>.md
//   o2 WELD-BROKEN        yesterday's KAL-line exists ⇒ today's team_sheet.md
//                         exists (the sheet is the weld's carrier; whether the
//                         sheet HONOURS the KAL is the Gaffer's semantic lane)
//   o3 REVIEW-SHAPELESS   a post_match file without a RESULT: line (the honest-
//                         grade rule's paper trail broke — PROBLEM-1 class)
//   o4 TIME-UNMEASURED    activity today (afferents landed) + no timeaudit.json
//                         dated today — the 3-bucket split went dark on a live day
//   o5 SEASON-DESYNC      season.json's last date ≠ newest post_match date —
//                         the streak ledger and the match record disagree
//   o6 PRESENCE≠OUTPUT    Learning-bucket minutes > 0 AND zero reps AND zero
//                         teaching afferents today — presence without a single
//                         learning signal (his own guard, made visible; INFO)
//   o7 REP-CLOCK-CORRECTED  a rep on today's ledger whose AUTHORED timestamp was
//                         impossible — capture moved `ts` to the arrival clock (INFO)
//   o8 REP-OFF-DOOR       a rep on today's ledger with NO arrival stamp — it did not
//                         pass capture's ingest door (RED; see the block below)
//
// THE THREE CLOCKS FINALLY GET A READER (wiring audit, 10 Aug 2026).
//   capture.mjs's #24 amendment (4 Aug 2026) enriches every stored rep with
//   `ts_claimed` · `observed_at` · `ts_source` — built because the ledger caught the
//   model AUTHORING its own timestamps (reps_log rows 3-6: four reps across ninety
//   minutes sharing one millisecond). A repo-wide grep on 10 Aug 2026 found ZERO
//   readers of `observed_at` / `ts_source` outside capture.mjs itself: the provenance
//   was written to disk on every rep and consumed by nobody, so no organ could tell a
//   corrected rep from a claimed one. It is read HERE because this organ already opens
//   reps_log for `reps_today` (o6), already asks "did today's paper trail hold", and
//   already rides the watchman's one nightly schedule — a consumer, not a new organ.
//   Both checks are day-scoped and threshold-free, exactly like o1-o6: presence tests
//   on fields the writer either stamped or did not.
//
// WRITES: outwork_audit_last.json (single writer). READ-ONLY on everything else.
// The watchman's nightly run rides this via `run --json` and merges findings —
// one schedule, two layers, zero new tasks.
// MODES: run [--json] | report | selftest
// ============================================================================

import { readFileSync, writeFileSync, existsSync, readdirSync, renameSync, mkdirSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const STATE_DIR = process.env.ARSENAL_OUTWORK_STATE_DIR || join(ROOT, "dressing-room", "state");
const LAST = () => join(STATE_DIR, "outwork_audit_last.json");

const readJson = (p) => { try { return JSON.parse(readFileSync(p, "utf8")); } catch { return null; } };
const localDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const localDayOf = (ts) => { const d = new Date(String(ts || "")); return Number.isFinite(d.getTime()) ? localDate(d) : null; };

// Evening boundary for o1: post_match is an END-of-day ritual, so its absence is
// only a finding once the day is actually ending. 21:00 is not a guessed number —
// it is BEFORE every nightly organ (watchman 23:55, physio-PM 21:50), so by the
// time anything reads this the boundary has long passed; running it earlier in
// the day simply reports "day still open", never a false MISS.
const EVENING_HOUR = 21;

// ---------------------------------------------------------------------------
// GATHER — one read pass, plain object out, so checks() stays pure for fixtures.
// ---------------------------------------------------------------------------
export function gather(now = new Date()) {
  const today = localDate(now);
  const y = new Date(now.getTime() - 24 * 3.6e6);
  const yesterday = localDate(y);
  const pmDir = join(STATE_DIR, "post_match");
  const w = {
    now: now.toISOString(), today, yesterday, hour: now.getHours(),
    afferents_today: 0, teaching_today: 0, reps_today: 0,
    // THE THREE CLOCKS (o7/o8) — named rows, never bare counts: a finding this file
    // cannot point at is a finding he cannot check.
    reps_clock_corrected: [], reps_clock_unstamped: [],
    post_match_today: existsSync(join(pmDir, `${today}.md`)),
    post_match_yesterday_kal: null,
    post_match_files: [],
    result_line_missing: [],
    team_sheet_today: false,
    timeaudit: readJson(join(STATE_DIR, "timeaudit.json")),
    season_last_date: null,
  };
  try {
    for (const line of readFileSync(join(STATE_DIR, "afferent.jsonl"), "utf8").split("\n")) {
      if (!line.trim()) continue;
      try {
        const r = JSON.parse(line);
        if (localDayOf(r.ts) === today) { w.afferents_today++; if (r.source === "claude-code-teaching") w.teaching_today++; }
      } catch {}
    }
  } catch {}
  try {
    for (const line of readFileSync(join(STATE_DIR, "reps_log.jsonl"), "utf8").split("\n")) {
      if (!line.trim()) continue;
      try {
        const r = JSON.parse(line);
        if (localDayOf(r.ts) !== today) continue;
        w.reps_today++;
        // The clocks, as capture.mjs stamps them (resolveClocks — its names, read
        // verbatim, never re-derived here). A corrected rep is one whose claim was
        // impossible; an unstamped rep is one capture never saw arrive.
        const who = `${r.concept}${r.axis ? "/" + r.axis : ""}`;
        if (r.ts_source && r.ts_source !== "claimed") w.reps_clock_corrected.push(`${who} (claimed ${r.ts_claimed} · ts ${r.ts})`);
        if (!r.observed_at) w.reps_clock_unstamped.push(`${who} (ts ${r.ts})`);
      } catch {}
    }
  } catch {}
  try {
    const files = readdirSync(pmDir).filter((f) => /^\d{4}-\d{2}-\d{2}\.md$/.test(f)).sort();
    w.post_match_files = files;
    for (const f of files.slice(-7)) {                       // shape-check the recent week, not all history
      const txt = readFileSync(join(pmDir, f), "utf8");
      if (!/^RESULT:/m.test(txt)) w.result_line_missing.push(f);
      if (f === `${yesterday}.md`) {
        const m = txt.match(/^KAL-LINE\s*→\s*(.+)$/m);
        w.post_match_yesterday_kal = m ? m[1].trim() : null;
      }
    }
  } catch {}
  try {
    const sheet = join(STATE_DIR, "team_sheet.md");
    if (existsSync(sheet)) {
      const first = readFileSync(sheet, "utf8").slice(0, 200);
      w.team_sheet_today = first.includes(today);
    }
  } catch {}
  try {
    // Shape mirrored from the WRITER (postmatch.mjs updateSeason): the date field is
    // `last_played` — verified against the source on 7 Aug 2026, not guessed. (The
    // first draft of this reader guessed days[]/history/last_date — the exact
    // PROBLEM-1 class this audit exists to catch, caught in its own review.)
    const season = readJson(join(STATE_DIR, "season.json"));
    w.season_last_date = (season && season.last_played) || null;
  } catch {}
  return w;
}

// ---------------------------------------------------------------------------
export function checks(w) {
  const F = [];
  const activity = w.afferents_today > 0 || (w.timeaudit && w.timeaudit.date === w.today && (w.timeaudit.activeMinutes || 0) > 0);

  // o1 — a lived day, evening reached, no full-time close on disk.
  if (activity && w.hour >= EVENING_HOUR && !w.post_match_today) {
    F.push({
      id: "fulltime-missing", level: "INFO",
      finding: "aaj din chala (activity on record) aur evening tak koi full-time close nahi — HIT/MISS unrecorded, KAL-line unwritten, kal ka kickoff bina weld ke khulega",
      evidence: `afferents today ${w.afferents_today} · timeaudit ${w.timeaudit && w.timeaudit.date === w.today ? (w.timeaudit.activeMinutes || 0) + "m active" : "not today"} · post_match/${w.today}.md absent — \`/full-time\` is the 30-second close`,
    });
  }

  // o2 — the KAL→KICKOFF weld's carrier: yesterday committed a first move, and the
  // sheet that must resume him today never got written.
  if (w.post_match_yesterday_kal && !w.team_sheet_today) {
    F.push({
      id: "weld-broken", level: "RED",
      finding: "kal raat KAL-LINE commit hui thi aur aaj ki team_sheet.md nahi bani — the weld's carrier is missing, so the pre-decided first move never reached the morning",
      evidence: `post_match/${w.yesterday}.md KAL-LINE → "${w.post_match_yesterday_kal.slice(0, 80)}" · team_sheet.md not dated ${w.today}`,
    });
  }

  // o3 — a close that lost its RESULT line (writer/reader contract broke).
  if (w.result_line_missing.length) {
    F.push({
      id: "review-shapeless", level: "RED",
      finding: `${w.result_line_missing.length} post_match file(s) in the last week carry NO RESULT: line — the honest-grade paper trail is broken for those days`,
      evidence: w.result_line_missing.join(" · ") + " — postmatch.mjs always writes RESULT:; a file without one was not written by its owner",
    });
  }

  // o4 — a live day whose time went unmeasured (the 3-bucket split dark).
  if (w.afferents_today > 0 && !(w.timeaudit && w.timeaudit.date === w.today)) {
    F.push({
      id: "time-unmeasured", level: "RED",
      finding: "afferents landed today but timeaudit.json is not dated today — the 3-bucket time split went dark on a live day",
      evidence: `afferents today ${w.afferents_today} · timeaudit.date ${w.timeaudit ? w.timeaudit.date : "(no file)"} — ArsenalFC-TimeAuditor tasks own this`,
    });
  }

  // o5 — the streak ledger and the match record disagree.
  if (w.season_last_date && w.post_match_files.length) {
    const lastPm = w.post_match_files[w.post_match_files.length - 1].replace(/\.md$/, "");
    if (w.season_last_date < lastPm) {
      F.push({
        id: "season-desync", level: "RED",
        finding: "season.json's last recorded day is OLDER than the newest post_match file — the streak ledger missed a close",
        evidence: `season last ${w.season_last_date} < post_match ${lastPm} — postmatch.mjs writes both in one run; a gap means a partial write`,
      });
    }
  }

  // o6 — presence without a single learning signal (his own guard: presence ≠ output).
  // Threshold-free: every test is >0/absence, no invented number.
  if (w.timeaudit && w.timeaudit.date === w.today
      && w.timeaudit.buckets && w.timeaudit.buckets.Learning && (w.timeaudit.buckets.Learning.minutes || 0) > 0
      && w.reps_today === 0 && w.teaching_today === 0) {
    F.push({
      id: "presence-not-output", level: "INFO",
      finding: "Learning-bucket minutes measured today with ZERO reps and ZERO teaching turns — presence without a single learning signal (canon: presence ≠ output, 12 ghante baith ke zero seekha = won-day NAHI)",
      evidence: `Learning ${w.timeaudit.buckets.Learning.minutes}m · reps today 0 · teaching afferents today 0 — data, not a verdict; a pure-reading day can look like this`,
    });
  }

  // o7 — an AUTHORED rep-time that was impossible. capture.mjs only sets
  // ts_source ≠ "claimed" for one reason: the rep claims to have happened AFTER the
  // instant capture saw it, so the claim is a fact-check failure, not a judgement
  // call (no threshold anywhere in that path). capture has already corrected `ts` to
  // the arrival clock — the ledger is right. What was missing until today is anyone
  // SAYING it happened, on the day it happened: the #24 evidence reached consumers
  // only through `ts`, never through the provenance built to preserve it. INFO,
  // because the row is correct on disk; what this line reports is who wrote its clock.
  if ((w.reps_clock_corrected || []).length) {
    F.push({
      id: "rep-clock-corrected", level: "INFO",
      finding: `${w.reps_clock_corrected.length} rep aaj ke ledger mein aisi hai jiska authored timestamp NAAMUMKIN tha (rep apne aane se pehle hui hoti hai, baad mein nahi) — capture ne ts ko arrival clock pe khiska diya; us rep ka waqt LIKHA gaya tha, naapa nahi gaya`,
      evidence: `${w.reps_clock_corrected.join(" · ")} — ts_source "observed(claim_after_arrival)" (capture.mjs resolveClocks, organism audit #24). The stored ts is already the arrival clock; this finding names the authorship, it does not re-correct anything.`,
    });
  }

  // o8 — a rep on today's ledger that never passed capture's door. Since #24 every
  // rep that goes through ingest is stamped (ingestUnlocked always supplies
  // observedAt; loadReps deliberately supplies none, so a stored value is preserved
  // and never restamped). observed_at:null is the HONEST value for rows written
  // before 4 Aug 2026 — we do not know when those arrived — but a row whose `ts`
  // lands on TODAY cannot be one of them, and capture.mjs is the single writer of
  // reps_log (throwin and dugout both shell `capture.mjs paste`). So a null arrival
  // clock on a today-row means the line was written out-of-band. Same class, and the
  // same RED, as o3's "a file without one was not written by its owner".
  if ((w.reps_clock_unstamped || []).length) {
    F.push({
      id: "rep-off-door", level: "RED",
      finding: `${w.reps_clock_unstamped.length} rep aaj ke ledger mein bina arrival stamp ke hai (observed_at:null) — since 4 Aug har ingested rep stamp hoti hai, to yeh line capture ke darwaze se nahi aayi: single-writer law toota hai ya koi purana capture.mjs chal raha hai`,
      evidence: `${w.reps_clock_unstamped.join(" · ")} — capture.mjs is the ONLY writer of reps_log.jsonl and stamps observed_at on every ingest (resolveClocks + ingestUnlocked). Check: \`node scripts/capture.mjs selftest\`, and whether anything hand-edited reps_log.jsonl today.`,
    });
  }

  return F;
}

// ---------------------------------------------------------------------------
function run(argv) {
  const asJson = argv.includes("--json");
  const w = gather();
  const findings = checks(w);
  try {
    // C2 (9 Aug 2026): tmp+rename — same house pattern as every other _last writer.
    const out = LAST(), tmp = `${out}.tmp${process.pid}`;
    writeFileSync(tmp, JSON.stringify({ at: w.now, today: w.today, findings,
      counts: { afferents: w.afferents_today, teaching: w.teaching_today, reps: w.reps_today } }, null, 1));
    renameSync(tmp, out);
  } catch {}
  if (asJson) { console.log(JSON.stringify(findings)); return; }
  console.log(`outwork_audit: ${findings.length} finding(s)`);
  for (const f of findings) console.log(`  [${f.level}] ${f.id} — ${f.finding}`);
  if (!findings.length) console.log("  clean — and every check CAN fail (selftest proves both sides), so this is a measured clean.");
}

function report() {
  const j = readJson(LAST());
  console.log("\n== OUTWORK AUDIT — did the day do its job ==");
  if (!j) { console.log("  never run. `node scripts/outwork_audit.mjs run`\n"); return; }
  console.log(`  last run: ${j.at} · afferents ${j.counts?.afferents ?? "?"} · teaching ${j.counts?.teaching ?? "?"} · reps ${j.counts?.reps ?? "?"}`);
  if (!(j.findings || []).length) console.log("  findings: none — measured clean, not silent.");
  for (const f of (j.findings || [])) console.log(`\n  [${f.level}] ${f.id}\n    ${f.finding}\n    evidence: ${f.evidence}`);
  console.log(`\n  NOT MACHINE-CHECKABLE (stated, not silently absent — same law as the watchman's §6.2 line):`);
  console.log(`    · WON-DAY #2 depth-when-working — no depth sensor exists`);
  console.log(`    · WON-DAY #3 Bolo per touched concept — voice-first by canon; his voice never reaches this machine`);
  console.log(`    · WON-DAY #4's honesty itself — the machine sees the RESULT line, not its truth`);
  console.log(`    · WON-DAY #5 Sunday off — deliberately unchecked (a rest day needs no permission slip)`);
  console.log(`    · BOLO→GRADER bar-cleared enforcement — lives in /forge + /scrimmage skill behaviour (dossier rubric), not in any organ this file can read\n`);
}

// ---------------------------------------------------------------------------
function selftest() {
  let pass = 0, fail = 0;
  const assert = (name, cond) => { if (cond) { pass++; console.log(`  ✓ ${name}`); } else { fail++; console.log(`  ✗ ${name}`); } };
  console.log("\n== outwork_audit selftest ==\n");

  const TODAY = "2026-08-07", YDAY = "2026-08-06";
  const base = {
    now: "2026-08-07T22:00:00+05:30", today: TODAY, yesterday: YDAY, hour: 22,
    afferents_today: 50, teaching_today: 10, reps_today: 5,
    post_match_today: true,
    post_match_yesterday_kal: "pehla move: context Re-Jirah",
    post_match_files: [`${YDAY}.md`, `${TODAY}.md`],
    result_line_missing: [],
    team_sheet_today: true,
    timeaudit: { date: TODAY, activeMinutes: 179, buckets: { Learning: { minutes: 163 } } },
    season_last_date: TODAY,
    reps_clock_corrected: [], reps_clock_unstamped: [],
  };
  assert("CLEAN — a fully-closed day yields ZERO findings (measured clean, the detector can fail)",
    checks(base).length === 0);
  assert("o1 — activity + evening + no post_match = fulltime-missing (INFO, his ritual, never RED)",
    (() => { const f = checks({ ...base, post_match_today: false }).find((x) => x.id === "fulltime-missing");
      return f && f.level === "INFO"; })());
  assert("o1 CONDITIONAL — same gap at 14:00 is silent (day still open), and a zero-activity day owes NO close",
    !checks({ ...base, post_match_today: false, hour: 14 }).some((x) => x.id === "fulltime-missing")
    && !checks({ ...base, post_match_today: false, afferents_today: 0, timeaudit: null }).some((x) => x.id === "fulltime-missing"));
  assert("o2 — yesterday's KAL-line + no today team_sheet = weld-broken RED; no KAL owes no weld",
    checks({ ...base, team_sheet_today: false }).some((x) => x.id === "weld-broken" && x.level === "RED")
    && !checks({ ...base, team_sheet_today: false, post_match_yesterday_kal: null }).some((x) => x.id === "weld-broken"));
  assert("o3 — a post_match file without RESULT: is review-shapeless RED, with the files named",
    (() => { const f = checks({ ...base, result_line_missing: [`${YDAY}.md`] }).find((x) => x.id === "review-shapeless");
      return f && f.level === "RED" && f.evidence.includes(`${YDAY}.md`); })());
  assert("o4 — afferents today + timeaudit not dated today = time-unmeasured; a dead-quiet day is exempt",
    checks({ ...base, timeaudit: { date: YDAY } }).some((x) => x.id === "time-unmeasured")
    && !checks({ ...base, afferents_today: 0, teaching_today: 0, reps_today: 0, timeaudit: { date: YDAY }, post_match_today: true }).some((x) => x.id === "time-unmeasured"));
  assert("o5 — season older than newest post_match = season-desync; in-sync is silent",
    checks({ ...base, season_last_date: "2026-08-01" }).some((x) => x.id === "season-desync")
    && !checks(base).some((x) => x.id === "season-desync"));
  assert("o6 — Learning minutes with zero reps AND zero teaching = presence-not-output INFO; any learning signal silences it",
    checks({ ...base, reps_today: 0, teaching_today: 0 }).some((x) => x.id === "presence-not-output")
    && !checks({ ...base, reps_today: 0, teaching_today: 3 }).some((x) => x.id === "presence-not-output")
    && !checks({ ...base, reps_today: 0, teaching_today: 0, timeaudit: { date: TODAY, buckets: { Learning: { minutes: 0 } } } }).some((x) => x.id === "presence-not-output"));
  assert("o7 — a rep whose authored ts was impossible is NAMED (INFO); an all-\"claimed\" day is silent",
    (() => { const f = checks({ ...base, reps_clock_corrected: ["embeddings/c (claimed 2026-08-07T23:30:00.000Z · ts 2026-08-07T11:00:00.000Z)"] })
      .find((x) => x.id === "rep-clock-corrected");
      return f && f.level === "INFO" && f.evidence.includes("embeddings/c") && !checks(base).some((x) => x.id === "rep-clock-corrected"); })());
  assert("o8 — a today-rep with NO arrival stamp is RED and named; a stamped ledger is silent",
    (() => { const f = checks({ ...base, reps_clock_unstamped: ["hallucinations/a (ts 2026-08-07T12:00:00.000Z)"] })
      .find((x) => x.id === "rep-off-door");
      return f && f.level === "RED" && f.evidence.includes("hallucinations/a") && !checks(base).some((x) => x.id === "rep-off-door"); })());

  // THE WIRE ITSELF, disk to finding — a real child process against its own STATE_DIR.
  // The pure assertions above hand `checks()` a fixture and would stay green even if
  // gather() stopped reading the clocks entirely: that is precisely how teaching_audit
  // sat 25/25 green while its disk reader was dead (its header, THE BLIND SELFTEST).
  // This one writes three real rows — one clean, one corrected, one unstamped — and
  // asserts the findings come back out of `run --json`, the same call the watchman
  // makes every night. If observed_at / ts_source ever lose their reader again, THIS
  // assertion is what goes red.
  {
    const dir = join(tmpdir(), `arsenal_outwork_selftest_${process.pid}`);
    mkdirSync(dir, { recursive: true });
    const n = new Date();
    const at = (h) => new Date(n.getFullYear(), n.getMonth(), n.getDate(), h, 0, 0).toISOString();
    const row = (o) => JSON.stringify({ surface: "gem", track: "concept", axis: "a", question: "q", confidence: "knew", correct: true, ...o });
    writeFileSync(join(dir, "reps_log.jsonl"), [
      row({ ts: at(10), concept: "wireprobe-clean",     ts_claimed: at(10), observed_at: at(10), ts_source: "claimed" }),
      row({ ts: at(11), concept: "wireprobe-corrected", ts_claimed: at(23), observed_at: at(11), ts_source: "observed(claim_after_arrival)" }),
      row({ ts: at(12), concept: "wireprobe-offdoor",   ts_claimed: at(12), observed_at: null,   ts_source: "claimed" }),
    ].join("\n") + "\n");
    const child = spawnSync(process.execPath, [fileURLToPath(import.meta.url), "run", "--json"],
      { encoding: "utf8", timeout: 60000, env: { ...process.env, ARSENAL_OUTWORK_STATE_DIR: dir } });
    let live = [];
    try { live = JSON.parse(String(child.stdout || "[]").trim() || "[]"); } catch {}
    const got = (id) => live.find((x) => x.id === id);
    assert("WIRE e2e — gather() really reads ts_source off disk: the corrected rep comes back out of `run --json`, named",
      (() => { const f = got("rep-clock-corrected"); return !!f && f.evidence.includes("wireprobe-corrected") && !f.evidence.includes("wireprobe-clean"); })());
    assert("WIRE e2e — gather() really reads observed_at off disk: the unstamped rep is RED, the stamped ones are not in it",
      (() => { const f = got("rep-off-door");
        return !!f && f.level === "RED" && f.evidence.includes("wireprobe-offdoor")
          && !f.evidence.includes("wireprobe-clean") && !f.evidence.includes("wireprobe-corrected"); })());
    assert("WIRE e2e — the counts block still rides along (all three rows counted as today's reps)",
      (() => { try { return JSON.parse(readFileSync(join(dir, "outwork_audit_last.json"), "utf8")).counts.reps === 3; } catch { return false; } })());
    try { rmSync(dir, { recursive: true, force: true }); } catch {}
  }

  assert("EVERY finding carries evidence with the actual numbers/files in it",
    checks({ ...base, post_match_today: false, team_sheet_today: false, season_last_date: "2026-08-01", result_line_missing: ["x.md"] })
      .every((f) => typeof f.evidence === "string" && f.evidence.length > 20));
  assert("THRESHOLD-FREE — no check anywhere compares against an invented magnitude (presence/pairing/date tests only)",
    (() => { const src = readFileSync(fileURLToPath(import.meta.url), "utf8");
      const checksrc = src.slice(src.indexOf("export function checks"), src.indexOf("function run("));
      return !/[><]=?\s*\d{2,}/.test(checksrc.replace(/slice\(0,\s*\d+\)/g, "")); })());

  console.log(`\n${fail === 0 ? "ALL CHECKS PASSED" : "SELFTEST FAILED"} (${pass} passed, ${fail} failed)\n`);
  if (fail) process.exit(1);
}

// ---------------------------------------------------------------------------
const cmd = process.argv[2] || "run";
if (cmd === "run") run(process.argv.slice(3));
else if (cmd === "report") report();
else if (cmd === "selftest") selftest();
else console.log("outwork_audit: run [--json] | report | selftest");
