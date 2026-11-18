#!/usr/bin/env node
// ============================================================================
// postmatch.mjs · ARSENAL AI FC — THE ORGANISM: THE POST-MATCH
// ----------------------------------------------------------------------------
// WHAT:  The evening ledger (~30-second ritual) — and the writers the Manager
//        M-1 has been READING from since birth, finally built: post_match/
//        <date>.md (the KAL-line!), season.json (matches_played), notebook.json
//        (real moments for the Season Arc). Also the throw-in routing gate:
//        pending loose balls are SHOWN; one word routes them; nothing is ever
//        auto-written.
// WHY:   The KAL→KICKOFF weld is the loop's biggest mechanic: tonight's last
//        sentence is tomorrow's first move, pre-decided — zero morning
//        ambiguity for a brain that pays a re-entry tax on every gap.
// CONSTITUTIONAL (each selftested):
//   · KAL-LINE format MUST match manager.mjs's parser: /KAL-?LINE\s*→\s*(.+)/i.
//   · Every silent adaptation of the day is DISCLOSED here (pulse.withheld_
//     disclosures + drills.withheld render always).
//   · The twin's line renders IFF twin.json.voice is non-null (win-only law
//     lives in twin.mjs; this organ never invents a line).
//   · The ROUTING LEDGER (routed_balls.json) is the ONLY durable record of what
//     he routed — the rows' own `routed:false` is inert by design. An unreadable
//     ledger therefore REFUSES the write instead of starting from empty.
//   · MISS never writes shame: no "failure/failed/streak broken" strings;
//     REST = LOAD-MANAGED and increments matches_played (conscious rest is a
//     won day by the outwork law).
//   · --dry renders everything and writes NOTHING.
//
// INPUT (read-only): pulse.json · drills.json · twin.json · loose_balls.jsonl ·
//   capsule_map.json · python_state.json · benchmark.json (SEASON.md standings) ·
//   season.json (own), notebook.json (own), routed_balls.json (own)
// OUTPUT: post_match/<date>.md · season.json · notebook.json · routed_balls.json ·
//   dressing-room/SEASON.md (the logbook — un-parked by his word 7 Aug 2026;
//   Claude fills 100%, he writes ZERO)
// MODES:  --hit HIT|MISS|PARTIAL|REST --signal "…" --kal "…" [--diag start|block|sleep]
//         [--route all|none] [--date YYYY-MM-DD] [--dry] · route [all|<id>…] (route-only, no ledger)
//           (mpast A1: --date closes the NEWEST open day the day-close card names — refused by name, nothing written,
//           for a malformed date, a future day, a day with no machine record, his own closed day; every OLDER named
//           day gets ONE appended line recording the ABSENCE of his word, read as closed, never re-asked)
//         · named (READ-ONLY, for /full-time: the day his line closes, the older named days, whether the KAL is asked)
//         · autoclose --date <YYYY-MM-DD|chain|chain-1> --anchor evening|morning|close [--dry]   (close: day.mjs end, unit mday)
//           (THE DAY CLOSES ITSELF, mclose · rows 873 (2) / 877 / 883 / 891 — the MACHINE half of his
//           full time, fired by the conductor's dayclose steps; see autoclose() below)
//         · season (regen SEASON.md only — no ledger, no matchday)
//         · interview --date YYYY-MM-DD [--drop] (season.json's interview_dates —
//           D14's lawful writer, which scout's war-room reads; dispatched at :408 and
//           unnamed here until the wiring audit, 10 Aug 2026. MORNING_RUNBOOK.md:127
//           sends a session to THIS line for postmatch's surface, so the one verb that
//           exists to keep him off a hand-edit was invisible on the documented path.)
//         · selftest  (interactive prompts if TTY, no flags)
// SEASON.md (DAILY_CADENCE.md compact design, honest subset): TABLE standings +
//   MATCH ROWS newest-top + streak/form-line (rest-dot neutral) + KAL→kickoff
//   weld + shame-spiral guard + no date-countdown. Design fields with NO machine
//   source yet (M1 %, floor/surplus/save-flag per row, won-day=5 scoring) are
//   DEFERRED, not faked — they join when their owners exist.
// WHO ELSE COULD ACT ON THIS OUTPUT (Ruling 5): learnstate kickoff (streak line)
//   · viz wall · twin (bets read season.json) · outwork_audit o5 (sync watch).
// ============================================================================

import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync, mkdtempSync, rmSync, realpathSync } from "node:fs";
import { join, dirname, resolve, relative, isAbsolute } from "node:path";
import { tmpdir } from "node:os";                      // selftest's on-disk seam (benchmark.mjs:644 precedent) · mclose: the clock door's "only under tmpdir" test
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const PM_DIR    = join(STATE_DIR, "post_match");
const SEASON    = join(STATE_DIR, "season.json");
const NOTEBOOK  = join(STATE_DIR, "notebook.json");
const ROUTED    = join(STATE_DIR, "routed_balls.json");
const SEASON_MD = join(__dirname, "..", "dressing-room", "SEASON.md");   // the logbook (8 Aug 2026)

const KAL_RE = /KAL-?LINE\s*→\s*(.+)/i;      // manager.mjs's exact parser contract
const BADGE = "⚪🔴";

const localDate = (now) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
import { READER_BUDGET_MS } from "./notes_compiler.mjs";   // mclose row 914 G — the cold reader's ONE budget, read from its owner
import { JUDGE_BUDGET_MS, JUDGE_DISPATCH_MS, outstandingBank, captureDay } from "./gaffer_brain.mjs";       // mclose row 914 G — the judge call's ONE budget, read from its owner · mpm F5 — the grade queue's outstanding captures, read by its owner's own reader · unit mtail F-B — the judge's dispatch margin, from the same owner · mpm F1 — the mjday rule, imported from its ONE home
import { recentRows, launchContext, addDays } from "./daykey.mjs";   // S11 — the recency gate (the form strip is a window of NOW, not the last 7 rows) · mclose — the chain's day-key (autoclose --date chain|chain-1)

function writeAtomic(path, obj) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = path + "." + process.pid + ".tmp";   // per-pid: two live writers must never share one temp name (same scar capture.mjs:319 fixed)
  writeFileSync(tmp, typeof obj === "string" ? obj : JSON.stringify(obj, null, 2) + "\n");
  renameSync(tmp, path);
}
const readJson = (p) => { try { if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")); } catch {} return null; };
const readLines = (p) => {
  const out = [];
  try { if (existsSync(p)) for (const l of readFileSync(p, "utf8").split("\n")) { if (!l.trim()) continue; try { out.push(JSON.parse(l)); } catch {} } } catch {}
  return out;
};

// ---------------------------------------------------------------------------
// pure core
// ---------------------------------------------------------------------------
const WON_DAY = new Set(["HIT", "PARTIAL", "REST"]);   // conscious rest = won day (outwork law)

function renderPostMatch({ hit, signal, kal, diag, disclosures, twinVoice, pendingBalls, matchday, dateStr }) {
  const lines = [];
  lines.push(`${BADGE} POST-MATCH · ${dateStr} · Matchday ${matchday}`);
  lines.push("");
  if (hit === "REST") lines.push(`RESULT: LOAD-MANAGED — conscious rest. That is a won day.`);
  else lines.push(`RESULT: ${hit}${hit === "PARTIAL" ? " — partial counts; the floor was touched." : hit === "MISS" ? " — data, not a verdict. We go again." : "."}`);
  if (signal) lines.push(`SIGNAL: ${signal}`);
  if (hit === "MISS") lines.push(`DIAGNOSTIC (pick one): ${diag || "start / block / sleep"}`);
  if (disclosures.length) {
    lines.push("");
    lines.push("TODAY'S QUIET ADAPTATIONS (disclosed, as always):");
    for (const d of disclosures) lines.push(`  · ${d}`);
  }
  if (twinVoice) { lines.push(""); lines.push(`THE BOOK: ${twinVoice}`); }
  if (pendingBalls.length) {
    lines.push("");
    lines.push(`THROW-INS AWAITING ROUTING (${pendingBalls.length}) — one word routes them:`);
    for (const b of pendingBalls.slice(0, 5)) lines.push(`  · [${b.id}] "${b.text}"`);
  }
  lines.push("");
  // 2 Aug 2026 audit, finding #82 — THE SLOT RESERVED FOR HIS OWN WORDS.
  // The KAL-line is the one place on the wall, the wallpaper and the voice brief
  // that is supposed to carry HIS sentence, decided last night. It used to default
  // to "one green ball, first thing. That's the whole plan." when he declined the
  // prompt — which collided almost verbatim with WALLPAPER.ps1's never-run
  // fallback, so a real DECLINED run and a NEVER-RUN night rendered identically on
  // his desktop. Two different states, one string, no way to tell them apart.
  //
  // Now: a declined prompt writes NO KAL-LINE at all. The marker below is worded so
  // it deliberately does NOT match KAL_RE (manager.mjs's parser contract, line 44),
  // so every downstream consumer — manager.mjs:71/:186, viz's kal_line,
  // WALLPAPER.ps1 — correctly reads null and renders its own honest empty state
  // instead of a commitment he never made.
  if (kal) {
    lines.push(`KAL-LINE → ${kal}`);
  } else {
    lines.push(`(no KAL-line tonight — the prompt was declined, so tomorrow opens without one)`);
  }
  lines.push("");
  lines.push(`COYG. ${BADGE}`);
  return lines.join("\n") + "\n";
}

function updateSeason(season, hit, dateStr, extras = {}) {
  const s = season || { season_day: 0, matches_played: 0, trophy_state: "unlit", pipeline_item: null, started_on: dateStr };
  const won = WON_DAY.has(hit);
  const matches_played = (s.matches_played || 0) + (won ? 1 : 0);
  // MATCH ROWS ledger (SEASON.md's raw layer, 8 Aug 2026) — one row per close,
  // MISS days included (a row is data, not a verdict). Uncapped: this IS the
  // season's memory; SEASON.md renders the tail, season.json holds it all.
  const rows = Array.isArray(s.rows) ? s.rows.slice() : [];
  // mpast (ruled): the row is INSERTED BY DATE — after every row of its day or older — so the streak (seasonStreak reads the
  // tail) reads DAYS, never close order: his full time for a past day the card named lands among its days, not at the end.
  const row = { date: dateStr, matchday: won ? matches_played : null, result: hit, kal: extras.kal || null, signal: extras.signal || null };
  const at = rows.findIndex((r) => r && String(r.date) > dateStr);
  if (at < 0) rows.push(row); else rows.splice(at, 0, row);
  const newest = rows[rows.length - 1];
  return {
    ...s,
    season_day: (s.season_day || 0) + 1,
    matches_played,
    last_result: newest.result,
    last_played: newest.date,
    rows,
  };
}

// ---------------------------------------------------------------------------
// SEASON.md — the logbook (his word 7 Aug 2026 un-parked it; DAILY_CADENCE design)
// Claude fills 100%, he writes ZERO. Pure render — the selftest drives it disk-free.
// ---------------------------------------------------------------------------
const FORM_GLYPH = { HIT: "●", PARTIAL: "●", REST: "◦", MISS: "·" };   // rest-dot NEUTRAL by design; MISS is a small dot, never an ✗

function seasonStreak(rows) {
  let k = 0;
  for (let i = rows.length - 1; i >= 0; i--) { if (WON_DAY.has(rows[i].result)) k++; else break; }
  return k;
}

function renderSeasonMd({ season, lockedCount, lockedNote, python, benchmark, now }) {
  const dateStr = localDate(now);
  const rows = (season && Array.isArray(season.rows) ? season.rows : []);
  const L = [];
  L.push(`# ${BADGE} SEASON — the match record`);
  L.push("");
  L.push(`> Execution-memory, Forge ka sibling — machine-written 100% by postmatch.mjs at every`);
  L.push(`> full-time (un-parked by his word, 7 Aug 2026; he writes ZERO here). Regen anytime:`);
  L.push("> `node scripts/postmatch.mjs season`. Tarikh yahan sirf RECORD hai — kabhi demand nahi.");
  L.push("");
  L.push(`## STANDINGS · ${dateStr}`);
  if (!season) {
    L.push(`- no matchday closed yet — the first /full-time writes row 1. The season starts when he plays, not when a date says so.`);
  } else {
    L.push(`- season day ${season.season_day || 0} · matchdays played ${season.matches_played || 0} · current run: ${seasonStreak(rows)} won-day(s)`);
    // RECENCY GATE (S11 · §9 SHAPE 4). `rows.slice(-7)` is the last seven CLOSES, not the
    // last seven DAYS: after a fortnight away it drew a fortnight-old strip under the words
    // "current run". The window comes first, and when it is empty the line SAYS the record
    // is old instead of drawing stale glyphs — a form strip that cannot go quiet is a lie.
    const form = recentRows(rows, { anchor: dateStr, days: 14, cap: 7 });
    const tail = form.rows;
    if (tail.length) L.push(`- form (last ${tail.length} close${tail.length > 1 ? "s" : ""} in the past fortnight, ${form.span.from}→${form.span.to}): ${tail.map((r) => FORM_GLYPH[r.result] || "·").join(" ")}   (● won · ◦ rest — a won day too · «·» not-won: data, not a verdict)`);
    else if (rows.length) L.push(`- form: NO close in the past fortnight — the newest row is ${rows[rows.length - 1].date}. The record is not gone, it is OLD, and a glyph strip would have read as now.`);
  }
  L.push(`- capsules locked: ${typeof lockedCount === "number" ? lockedCount : "—"}${lockedNote ? ` ⚠ ${lockedNote}` : ""}`);
  L.push(`- python: ${python ? `tier ${python.tier || "—"} · ${python.fluency || "—"}` : "no track state yet"}`);
  if (benchmark) {
    L.push(benchmark.status === "gated_pre_audit"
      ? `- benchmark: GATED (pre-audit) — ${(benchmark.gate && benchmark.gate.missions_line) || ""}`
      // Same pass — the per-bucket string comes from benchmark.mjs (`projection`),
      // not rebuilt here. This row composed `locked ${locked}/${core_total}` for
      // every bucket, which wrote "B5 locked 0/0" into the permanent logbook for
      // the one bucket whose concept_buckets is [] BY DESIGN (its evidence is the
      // shipped product). The word "locked" moves into the row label because it is
      // no longer true of every bucket. Fallback = the old expression verbatim.
      : `- benchmark (locked/core per bucket; a bucket with no concept core names its own evidence): ${(benchmark.buckets || []).map((b) => b.projection || `${b.id} locked ${b.counts.locked}/${b.counts.core_total}`).join(" · ")}`);
    // DEAD-WIRE SWEEP 11 Aug 2026 — the differentiators enter the logbook. The row
    // above maps over `buckets`, and 6-cross-cut + 7-domain are deliberately NOT
    // buckets (the ROADMAP has five), so SEASON.md has recorded every bucket's standing
    // on a date and never the two lanes that carry 46.7% and 44.5% of the interview.
    // This file is what we read back months later; a standing that is missing from it
    // never happened. benchmark.mjs owns the string; absent ⇒ no row (pre-wire file).
    if (benchmark.differentiators_line) L.push(`- benchmark ${benchmark.differentiators_line}`);
    // Same sweep — the HAVE half enters the logbook. The standings row above is
    // `projection` (locked/core), so what he actually HELD on that date — cold
    // re-proof, Re-Jirah rounds sat, which skills had reps and at what fluency,
    // chapters covered, Building% — was recorded nowhere, while the need row two
    // lines down has recorded the debt since 10 Aug. A logbook with a debt column
    // and no credit column reads back as a season of pure arrears. Whole list, for
    // the same reason the need row takes the whole list: a logbook that summarises
    // is a logbook that lies. benchmark.mjs owns haves[]; absent ⇒ no row.
    if (Array.isArray(benchmark.haves) && benchmark.haves.length)
      L.push(`- benchmark have: ${benchmark.haves.join(" · ")}`);
    // 10 Aug 2026 wiring pass — the NEED names enter the logbook. The standings
    // row above carried counts only since 8 Aug, so SEASON.md recorded where he
    // stood on a date and never what was still open on that date — and this file
    // is the record we read back months later. benchmark.mjs owns needs[]; the
    // whole list, because a logbook that summarises is a logbook that lies.
    if (Array.isArray(benchmark.needs) && benchmark.needs.length)
      L.push(`- benchmark need: ${benchmark.needs.join(" · ")}`);
  } else L.push(`- benchmark: never run`);
  const lastKal = [...rows].reverse().find((r) => r.kal);
  L.push(`- KAL→KICKOFF weld: ${lastKal ? `"${lastKal.kal}" (${lastKal.date})` : "no KAL-line on record yet"}`);
  L.push("");
  L.push(`## MATCH ROWS (newest first${rows.length > 30 ? ", last 30 — full ledger: season.json" : ""})`);
  if (!rows.length) {
    L.push(`_khaali — pehla full-time isse likhega._`);
  } else {
    L.push(`| date | MD | result | KAL |`);
    L.push(`|---|---|---|---|`);
    for (const r of rows.slice(-30).reverse()) {
      L.push(`| ${r.date} | ${r.matchday ?? "—"} | ${r.result === "REST" ? "REST (load-managed)" : r.result} | ${r.kal ? r.kal.replace(/\|/g, "/") : "—"} |`);
    }
  }
  L.push("");
  L.push(`COYG. ${BADGE}`);
  return L.join("\n") + "\n";
}

// `dir` is a DEFAULTED parameter, not a new mode (benchmark.mjs:731 precedent): main()
// still calls gatherSeasonExtras(now) and gets STATE_DIR exactly as before. It exists so
// the selftest can point the REAL reader at a real directory — the wire below lives HERE,
// and a fixture handed straight to renderSeasonMd can never prove this function reads it.
function gatherSeasonExtras(now, dir = STATE_DIR) {
  const capsuleMap = readJson(join(dir, "capsule_map.json"));
  return {
    season: readJson(SEASON),
    lockedCount: capsuleMap && Array.isArray(capsuleMap.concepts) ? capsuleMap.concepts.filter((c) => c.locked_on).length : null,
    // DEAD-WIRE SWEEP (10 Aug 2026). SEASON.md is the PERMANENT logbook — 100% machine-
    // written, he writes zero — so a number that lands here wrong stays wrong forever.
    // Until today a capsule file that could not be parsed VANISHED inside capsule_bridge
    // (empty catch → .filter(Boolean)) and this line published the short count as fact.
    // capsule_bridge now refuses to ship a short count and stamps capsules_complete:false
    // on its last true map instead; so the count above is still TRUE but may be OLD, and
    // an old count printed under today's date is the same lie one level quieter. Named,
    // with the owner, so the fix is one hop away. Clean map ⇒ null ⇒ the row is unchanged.
    lockedNote: capsuleMap && capsuleMap.capsules_complete === false
      ? `as of ${capsuleMap.date || "an earlier run"} — capsule_map incomplete: ${(capsuleMap.blocking_faults || []).join(", ") || "a capsule"} unreadable, owner mirror.mjs`
      : null,
    python: readJson(join(dir, "python_state.json")),
    benchmark: readJson(join(dir, "benchmark.json")),
    now,
  };
}

function updateNotebook(notebook, signal, hit, dateStr) {
  const nb = notebook && Array.isArray(notebook.moments) ? notebook : { moments: [] };
  if (signal) nb.moments.push({ date: dateStr, line: signal, result: hit });
  // law-waiver:trailing-n a WRITE-SIDE CAP: keeps the NEWEST 45 moments and drops older
  // ones. The read side (the notebook panel) is what would need a window, and it does not
  // present these as "now" — they are the compressed memory, dated per row.
  if (nb.moments.length > 45) nb.moments = nb.moments.slice(-45);   // ~30–40 day compressed memory
  return nb;
}

// route-only picker (the spoken gate's deterministic half) — which pending
// balls get routed; "all" or an explicit id list. Pure; caller writes ROUTED.
function pickBallsToRoute(pending, which, ids = []) {
  return which === "all" ? pending.slice() : pending.filter(b => ids.includes(b.id));
}

// ---------------------------------------------------------------------------
// THE ROUTING LEDGER — dead-wire sweep, 11 Aug 2026.
//
// A tracer flagged `routed:false` on every dugout note and loose ball as an
// ORPHAN FIELD: nothing in this repo ever writes routed:true. That is TRUE, and
// as far as this organ is concerned it is also deliberate — throwin.mjs stamps
// it on arrival under its own never-auto-routed law (`grep -n "routed:false on
// arrival" scripts/throwin.mjs`), dugout.mjs stamps the same on take_note, and
// BOTH lanes are declared append-only, sole-writer, VERBATIM stores of his own
// words. Flipping a bit inside them means rewriting those lanes from a second
// process while the live Gaffer can append mid-rewrite — risking his spoken
// words to maintain a bookkeeping bit whose information already lives here.
// Not done, not guessed: whether that field gets a writer or gets dropped is a
// schema call on a verbatim store, and that is HIS.
//
// What WAS broken is the record that actually carries the routing state. Both
// call sites read it as `readJson(ROUTED) || { routed: [] }`, and readJson (:73)
// swallows a parse error and returns null. So a truncated or half-written
// routed_balls.json read as EMPTY — every ball he had ever routed re-appeared as
// pending, and the very next write concat'd onto [] and OVERWROTE the history for
// good. That is the tracer's damage clause exactly, one silent catch away from
// live, on a gitignored file with no second home anywhere in the organism.
// Now: ABSENT = legitimately empty (nothing routed yet). PRESENT-but-unreadable
// = refuse to write, say so loudly, and show everything as pending — the honest
// read when we cannot know what was routed.
function readRoutedLedger(path = ROUTED) {
  if (!existsSync(path)) return { present: false, readable: true, rows: [] };
  try {
    const obj = JSON.parse(readFileSync(path, "utf8"));
    // shape, not just parse: `{routed:"…"}` maps to [] just as silently as a torn file
    if (!obj || !Array.isArray(obj.routed)) return { present: true, readable: false, rows: [] };
    return { present: true, readable: true, rows: obj.routed };
  } catch { return { present: true, readable: false, rows: [] }; }
}

// THE ONE FILTER that decides what he is shown at full-time. It lived twice
// (route mode + the main close), byte-drifted apart — only one copy carried the
// 〔dugout〕 suffix — and in each copy the inert `!routed` check sat next to the
// ledger subtraction that does all the real work, which is precisely how a
// reader concludes the flag is load-bearing and goes off to "repair" a verbatim
// lane. The check stays (a row hand-repaired by him may legitimately say true)
// but it is no longer alone, and no longer duplicated.
function pendingThrowIns(routedIds, { dugoutSuffix = "" } = {}, dir = STATE_DIR) {
  return [
    ...readLines(join(dir, "loose_balls.jsonl")).filter(b => !b.routed && !routedIds.has(b.id)),
    ...readLines(join(dir, "dugout_notes.jsonl"))
      .filter(n => !n.routed && n.text && !routedIds.has("note:" + n.ts))
      .map(n => ({ id: "note:" + n.ts, text: String(n.text) + dugoutSuffix })),
  ];
}

// ---------------------------------------------------------------------------
// THE DAY CLOSES ITSELF — autoclose (mclose · rows 873 (2) / 877 F1-F6 / 883 / 891 · lane M's file by F6)
// ---------------------------------------------------------------------------
// WHY: his day was closed ONLY by his spoken full time (the close in main(), fired by the full-time skill alone), and his
//   last spoken close was 18 Aug — so the notes compile (this file's NOTES ANCHOR is the compiler's ONE runtime caller),
//   the judge round and three rungs of his day hung on a word he had not said since. Row 873 (2), as row 877 ruled it:
//   THE MACHINE HALF of the close is fired by CODE, once per day, for a day that holds captured study turns and no close —
//   at the EVENING anchor (conductor EVENING `dayclose`) and at the next MORNING anchor for a day the laptop slept through
//   (MORNING `dayclose-prev`); idempotent by day; no evidence, no run (L5). HIS half stays his and is never required.
// THE PATH, in this order:
//   (i)    archivist.mjs run, its OWN CLI — the archive catches up (best effort; its line is kept on the record)
//   (ii)   THE EVIDENCE: study_scope.studySessionsOfDay(D) — handed the sessions the archive names that day
//          (exchanges.sessionsNamedOn: the leaf never learns where the archive lives) — then exchanges.studyTurnsOfDay(D,
//          sessions); no study session or no captured turn = ONE line, exit 0, NOTHING written (F5) — UNLESS the gaffer grade
//          queue holds outstanding captures OF D (mpm F5 below, queueEvidenceOf): those are evidence the archive saw, and the
//          day closes with its judge step; with neither, the one line, as before
//   (iii)  THE QUIET RULE (F3): at the EVENING anchor, a last captured study turn under 30 min older than the step's clock
//          DEFERS the close — nothing written; the morning step closes that day
//   (iv)   IDEMPOTENT BY DAY (autocloseDecision): HIS RESULT on post_match/D.md is never touched; a MACHINE record whose
//          turns_until ≥ last_ts with its compile DONE and its judge SETTLED is nothing new — nothing written (bytes and
//          mtime); a current record with an UNSETTLED line (the judge NOT DUE inside the round's idle definition, a dead
//          lane, a compile not done or interrupted) re-runs ONLY that step and refreshes ONLY that line, even with no new
//          turn (row 891 (1): a day.close that could never be due is the never-fires class); a newer turn refreshes it whole
//   (v)    THE MACHINE RECORD, post_match/D.md: CLOSED-BY · RESULT absent · KAL-LINE absent (a COLON, so KAL_RE never matches
//          it, F1) · the evidence · the compile line · the judge line — written BEFORE the compile (the NOTES ANCHOR's order)
//   (vi)   notes_compiler.mjs, its own CLI: `compile --date D --session <each study session>` FIRST — the compiler's own
//          back-fill door, because its own scope is sitting.json's host (notes_compiler.mjs:265-272), which on a past or slept
//          day is not that day's session — THEN `fulltime --date D --no-archive-run` (its scope now carries the sessions the
//          note used, so the compile reads "unchanged" and the cold gate runs on it); every compiled row carries day D,
//          whatever the clock (row 883)
//   (vii)  gaffer_brain.mjs judge-due --trigger day.close with ARSENAL_ORGAN=1 — judgeDue's rule decides (the PACER's idle rule)
//   (viii) after an EVENING close only, ONE card through captains_call.mjs `file`, KEYED (a loop must key its card,
//          captains_call.mjs:339-344; the rolling day-key keeps ONE live ask) — the morning files none and rewrites nothing.
//          When a card of the family is KEPT (live, his word not on it), the deck's door (`reline`, mcard) rewrites ITS line
//          to name EVERY day still open since that card's own day, oldest first, inside the deck's line bound; when none is
//          kept, `file` as before (dayCloseCard below)
//   (ix)   ONE summary line.
// IT NEVER writes season.json, notebook.json, routed_balls.json or SEASON.md (matches_played counts HIS result) and NEVER
//   arms `brain.mjs trigger fulltime` (F2: the evening voice lanes ride HIS close and spend a model). Rung 8 stays RED on a
//   machine-closed day by daily_green's own code (F1). His later full time upgrades the record (the close in main()).
const AUTOCLOSE_QUIET_MIN = 30;                                     // F3, as ruled (row 877): "under 30 minutes old"
const AUTOCLOSE_CLOCK_ENV = "ARSENAL_AUTOCLOSE_CLOCK";        // the step's clock — honoured ONLY for a copy under os.tmpdir()
const CHAIN_DAY_FORMS = Object.freeze({ chain: 0, "chain-1": -1 });  // conductor EVENING dayclose / MORNING dayclose-prev
const ANCHORS = Object.freeze(["evening", "morning", "close"]);
// unit mday (forks rows 1044 / 1050 F3 A) — THE CLOSE ANCHOR: `day.mjs end` runs the machine half the moment HE means the day is
// over. It is a close like the evening's (the record, the compile, the judge, ONE day-close card) but it never defers on the quiet
// rule (quietVerdict defers the EVENING only — he closed, so no study turn is still arriving), and a record it writes is read as
// a close by autocloseDecision, so the evening and morning steps after it write nothing (bytes and mtime).
const CARD_ANCHORS = Object.freeze(["evening", "close"]);
// mclose row 914 G-n (b) — THE CLOSE RUNS UNDER A DEADLINE, ITS BUDGET SUMMED IN CODE: one cold-reader budget (notes_compiler's
// export), one judge budget (gaffer_brain's export) and one child budget per organ the close runs besides them (the archive, the
// compile's scope seed, the card). No typed total anywhere: the conductor's two close steps declare `budget: autocloseBudget()`.
export const CHILD_TIMEOUT_MS = 300000;
export const AUTOCLOSE_CHILDREN = Object.freeze(["archive", "compile", "card"]);
export function autocloseBudget() { return READER_BUDGET_MS + JUDGE_BUDGET_MS + AUTOCLOSE_CHILDREN.length * CHILD_TIMEOUT_MS; }
// unit mtail F-B (forks row 1017 (5) item 1) — THE JUDGE CHILD WAITS ITS ROUND'S BUDGET PLUS ITS DISPATCH MARGIN. A judge round
// spends up to JUDGE_BUDGET_MS on its batches and then settles and dispatches (gaffer_brain.mjs settleBatch, each owner spawn at
// JUDGE_DISPATCH_MS), so a child killed at JUDGE_BUDGET_MS alone could die mid-dispatch. Both read by import from the owner, never
// typed; every reserve the close holds for the judge below is this value. The close's own budget (autocloseBudget) does NOT move:
// the margin is taken from the time the earlier children leave, so the compile starts only when it still fits (row 914 G5).
export const JUDGE_CHILD_MS = JUDGE_BUDGET_MS + JUDGE_DISPATCH_MS;
const AUTOCLOSE_DEADLINE_ENV = "ARSENAL_AUTOCLOSE_DEADLINE";   // the close's deadline — honoured ONLY for a copy under os.tmpdir()
const MACHINE_KEPT = "MACHINE CLOSE (kept, L9)";
// HIS RESULT: the four legal results, as daily_green.mjs:250 reads them (REST renders as LOAD-MANAGED, renderPostMatch above)
const HIS_RESULT_RE = /^RESULT:\s*(HIT|MISS|PARTIAL|LOAD-MANAGED)/m;
const CLOSED_BY_RE = /^CLOSED-BY: code · (evening|morning|close) anchor · (\S+)$/m;
const PENDING_COMPILE = "COMPILE: pending — the close is still writing (an interrupted close is finished by the next anchor)";
const PENDING_JUDGE = "JUDGE: pending — the close is still writing (an interrupted close is finished by the next anchor)";
const oneLine = (s, n = 240) => { const t = String(s == null ? "" : s).replace(/\s+/g, " ").trim(); return t.length > n ? t.slice(0, n - 1) + "…" : t; };
const lastLineOf = (r) => `${(r && r.stdout) || ""}${(r && r.stderr) || ""}`.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).at(-1) || "";
const exitOf = (r) => (!r ? "not run" : r.status === null ? `did not finish (${(r.error && r.error.code) || r.signal || "?"})` : `exit ${r.status}`);

/** resolveAutocloseDay — the IST day to close: a literal YYYY-MM-DD, or the CHAIN's own day (`chain`, `chain-1` = the slept
 *  day) read off its ARSENAL_DAY_KEY token through daykey.mjs. Never now(): with no valid token the chain forms are REFUSED. */
function resolveAutocloseDay(arg, { env = process.env, now = new Date() } = {}) {
  const a = String(arg == null ? "" : arg).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(a)) return { day: a, source: "literal" };
  if (!Object.prototype.hasOwnProperty.call(CHAIN_DAY_FORMS, a)) return { error: `--date must be YYYY-MM-DD, chain or chain-1 (got "${oneLine(a, 40)}")` };
  const ctx = launchContext({ env, now, realNow: now });
  if (ctx.source !== "token") return { error: `--date ${a} is the chain's day and no chain day-key token is valid here (${ctx.why}) — a hand run passes --date YYYY-MM-DD` };
  const off = CHAIN_DAY_FORMS[a];
  return { day: off ? addDays(ctx.day, off) : ctx.day, source: `chain token ${ctx.day}${off ? " minus one" : ""}` };
}

const realOr = (p) => { try { return realpathSync(p); } catch { return resolve(p); } };
const underDir = (p, root) => { const rel = relative(realOr(root), realOr(p)); return !!rel && !rel.startsWith("..") && !isAbsolute(rel); };
/** autocloseClock — THE STEP'S CLOCK. His tree runs on the real clock, always; a COPY of the tree under os.tmpdir() (the
 *  witness's) may hand it one instant through ARSENAL_AUTOCLOSE_CLOCK. ONE door, planted both ways (F3). */
function autocloseClock({ env = process.env, here = __dirname, tmp = tmpdir(), now = () => new Date() } = {}) {
  const raw = env ? env[AUTOCLOSE_CLOCK_ENV] : null;
  if (!raw) return { at: now(), door: null };
  if (!underDir(here, tmp)) return { at: now(), door: `REFUSED — ${AUTOCLOSE_CLOCK_ENV} is honoured only for a copy under ${tmp}; this tree runs on the real clock` };
  const t = Date.parse(String(raw));
  if (!Number.isFinite(t)) return { at: now(), door: `REFUSED — ${AUTOCLOSE_CLOCK_ENV}=${oneLine(raw, 40)} is not an instant; the real clock stands` };
  return { at: new Date(t), door: `honoured (${new Date(t).toISOString()}) — a copy under ${tmp}` };
}

/** autocloseDeadline — row 914 G-n (b): the close's deadline = the process's boot instant on the step's clock plus autocloseBudget().
 *  A COPY under os.tmpdir() (the witness's) may hand it one instant through ARSENAL_AUTOCLOSE_DEADLINE. ONE door, planted both ways. */
function autocloseDeadline({ at, env = process.env, here = __dirname, tmp = tmpdir(), uptimeS = process.uptime() } = {}) {
  const own = at.getTime() - Math.round(uptimeS * 1000) + autocloseBudget();   // a WHOLE ms: process.uptime() is fractional (row 932)
  const raw = env ? env[AUTOCLOSE_DEADLINE_ENV] : null;
  if (!raw) return { ms: own, door: null };
  if (!underDir(here, tmp)) return { ms: own, door: `REFUSED — ${AUTOCLOSE_DEADLINE_ENV} is honoured only for a copy under ${tmp}; the summed budget stands` };
  const t = Date.parse(String(raw));
  if (!Number.isFinite(t)) return { ms: own, door: `REFUSED — ${AUTOCLOSE_DEADLINE_ENV}=${oneLine(raw, 40)} is not an instant; the summed budget stands` };
  return { ms: t, door: `honoured (${new Date(t).toISOString()}) — a copy under ${tmp}` };
}

/** closeTimer — THE CLOSE'S ONE CLOCK AND ITS SPAWN VALUES (row 925 (5); ruled row 932 on lane M's m914c diagnosis). stepNow() is the
 *  step's clock now: the clock door's instant when the door is set, else the real boot instant, moved on by real elapsed time; every
 *  deadline sum of the close reads it and nothing else. fits(need) says whether the time left covers `need`; below it the child is
 *  not started and its line says "not reached". spawnMs(f, reserve) is the timeout handed to spawn: the time left minus the reserve
 *  for the calls after it, and ONLY a safe positive whole number of milliseconds; anything else (a fraction, zero, a negative, NaN)
 *  starts nothing and the line reads UNSETTLED by name, retried at the next anchor (row 914 (2)). */
function closeTimer({ at, dlMs, realNow = () => Date.now() }) {
  const realStart = realNow();
  const stepNow = () => at.getTime() + (realNow() - realStart);
  const fits = (need) => {
    const left = dlMs - stepNow();
    return left >= need ? { ok: true, left } : { ok: false, left, line: `not reached · ${Math.max(0, Math.floor(left / 1000))} s left, ${Math.ceil(need / 1000)} s needed` };
  };
  const spawnMs = (f, reserve) => {
    const ms = f.left - reserve;
    return Number.isSafeInteger(ms) && ms > 0 ? { ok: true, ms } : { ok: false, ms, line: `not started · the spawn timeout ${ms} ms is not a positive whole number of milliseconds` };
  };
  return { stepNow, fits, spawnMs };
}

/** quietVerdict — F3: the EVENING close waits while study turns may still be arriving; the morning never defers. */
function quietVerdict({ anchor, lastTs, at }) {
  const age = (at.getTime() - Date.parse(String(lastTs))) / 60000;
  return { defer: anchor === "evening" && !(age >= AUTOCLOSE_QUIET_MIN), age_min: Number.isFinite(age) ? Math.floor(age) : null };
}

/** hisResultOf — HIS result on a post_match file (the first legal RESULT line, daily_green's own reading), or null. */
const hisResultOf = (text) => (String(text == null ? "" : text).match(HIS_RESULT_RE) || [])[1] || null;

// mpast A1 — THE ABSENCE OF HIS WORD, RECORDED. A day his one full-time line did not close (an OLDER day the day-close card
//   named), or every day a card he answered `na` named, gets ONE line appended to its machine record. It reads as ABSENCE,
//   never as a word of his: no legal RESULT (daily_green rung 8 stays RED on it by its own code), no KAL-LINE (KAL_RE never
//   matches it), no season row (matches_played does not move). parseMachineRecord then reads the day as CLOSED — a recorded
//   decision, never re-asked — and the close's idempotence never touches it again.
const ABSENCE_RE = /^NO LINE OF HIS for this day — closed by /m;
/** absenceLine — the ONE appended line: `by` is "his full time on <D>" or "his na on the day-close card <id>"; `at` the instant. */
const absenceLine = (by, at) => `NO LINE OF HIS for this day — closed by ${by} at ${at}, a recorded decision (never re-asked; no RESULT, no matchday)`;
const isAbsenceClosed = (text) => ABSENCE_RE.test(String(text == null ? "" : text));

/** parseMachineRecord — the state of a MACHINE record, or null when the text is not one (or already carries HIS result, or
 *  the recorded absence of it — mpast A1). */
function parseMachineRecord(text) {
  const t = String(text == null ? "" : text);
  if (hisResultOf(t)) return null;
  if (isAbsenceClosed(t)) return null;
  const cb = CLOSED_BY_RE.exec(t);
  if (!cb) return null;
  const ev = /^EVIDENCE: (\d+) captured study turn\(s\) · turns_until (\S+)/m.exec(t);
  const compile = (/^COMPILE: .*$/m.exec(t) || [""])[0], judge = (/^JUDGE: .*$/m.exec(t) || [""])[0];
  return { anchor: cb[1], at: cb[2], turns: ev ? Number(ev[1]) : null, turns_until: ev ? ev[2] : null,
    compile_line: compile, compile_done: /^COMPILE: DONE\b/.test(compile), judge_line: judge, judge_settled: /^JUDGE: SETTLED\b/.test(judge) };
}

/** machineBlockOf — the machine record a post_match file keeps: the whole file when it IS one, the block under MACHINE CLOSE
 *  (kept, L9) when his close already sits on top of one, else null. Byte-for-byte (L9). */
function machineBlockOf(text) {
  if (text == null) return null;
  const t = String(text), mark = `\n${MACHINE_KEPT}\n`, i = t.indexOf(mark);
  if (i >= 0) return t.slice(i + mark.length);
  return parseMachineRecord(t) ? t : null;
}
/** keptBlock — what HIS close appends below his own record: the header, then the machine record verbatim (L9). */
const keptBlock = (machine) => (machine ? `\n${MACHINE_KEPT}\n${machine}` : "");

/** autocloseDecision — (iv), PURE: what the close may do with the post_match file it finds for its day. */
function autocloseDecision(prior, lastTs) {
  if (prior == null) return { act: "write", prev: null };
  const his = hisResultOf(prior);
  if (his) return { act: "his", result: his };
  if (isAbsenceClosed(prior)) return { act: "decided" };   // mpast A1: closed by a recorded decision — never touched again
  const prev = parseMachineRecord(prior);
  if (!prev) return { act: "foreign" };
  const current = !!prev.turns_until && Date.parse(prev.turns_until) >= Date.parse(String(lastTs));
  if (!current) return { act: "refresh", prev };
  if (prev.compile_done && prev.judge_settled) return { act: "nothing-new", prev };
  return { act: "unsettled", prev, redo: [...(prev.compile_done ? [] : ["compile"]), ...(prev.judge_settled ? [] : ["judge"])] };
}

/** renderMachineRecord — post_match/D.md written by CODE: his two lines NAMED absent, never fabricated (F1: no legal RESULT;
 *  the KAL-LINE carries a colon, so KAL_RE — manager.mjs's and daily_green's parser — never matches it). */
function renderMachineRecord({ day, anchor, at, ev, tt, archiveLine, compileLine, judgeLine, queueLine = null }) {
  const L = [];
  L.push(`${BADGE} POST-MATCH · ${day} · closed by code — his word not given`);
  L.push("");
  L.push(`CLOSED-BY: code · ${anchor} anchor · ${at}`);
  L.push("RESULT: absent (his word not given; the day closed itself)");
  L.push("KAL-LINE: absent");
  L.push("");
  L.push(`EVIDENCE: ${tt.turns} captured study turn(s) · turns_until ${tt.last_ts} · ${tt.outside} row(s) of his other sessions that day counted apart`);
  if (queueLine) L.push(queueLine);   // mpm F5: a queue-only day names its captures (absent otherwise: the bytes stay as before)
  for (const s of ev.sessions) L.push(`  · session ${s.id} · source ${s.sources.join(" + ")} · ${(tt.per_session && tt.per_session[s.id]) || 0} captured turn(s)`);
  for (const m of ev.misses.slice(0, 10)) L.push(`  · miss: the ${m.source} of ${m.session} — ${oneLine(m.why, 160)}`);
  if (ev.misses.length > 10) L.push(`  · miss: … +${ev.misses.length - 10} more named misses`);
  L.push(`  · read: teaching_audit ${oneLine(ev.read.teaching_audit || "—", 80)} · sitting ${oneLine(ev.read.sitting || "—", 90)} · transcript ${oneLine(ev.read.transcript || "—", 110)}`);
  L.push(`ARCHIVE: ${oneLine(archiveLine, 220)}`);
  L.push(compileLine);
  L.push(judgeLine);
  L.push("");
  L.push("His half stays his: his full time (/full-time) writes his RESULT and KAL-line on top of this record, and this block stays below it (L9).");
  return L.join("\n") + "\n";
}

/** compileLineOf — the record's compile line from the compiler's own two runs: the scope seed (`compile --session`), then
 *  `fulltime`. DONE only when both exit 0; anything else says NOTES NOT DONE, out loud, and stays UNSETTLED. */
function compileLineOf(seed, full) {
  const sum = (r) => (String((r && r.stdout) || "").split(/\r?\n/).find((l) => l.startsWith("notes_compiler:")) || "").replace(/^notes_compiler:\s*/, "");
  if (!seed || seed.status !== 0) return `COMPILE: NOTES NOT DONE · compile --session ${exitOf(seed)}: ${oneLine(sum(seed) || lastLineOf(seed), 160)}`;
  // row 914 G6: notes the deadline did not reach keep the compile UNSETTLED by count (the next anchor's gate takes them), never DONE
  const unreached = Number((/(\d+) note\(s\) not reached by the deadline/.exec(sum(full)) || [])[1] || 0);
  if (full && unreached > 0) return `COMPILE: UNSETTLED · ${unreached} note(s) not reached by the deadline — the next anchor gates them · notes_compiler: ${oneLine(sum(full), 160)}`;
  if (!full || full.status !== 0) return `COMPILE: NOTES NOT DONE · fulltime ${exitOf(full)}: ${oneLine(sum(full) || lastLineOf(full), 160)}`;
  return `COMPILE: DONE · notes_compiler: ${oneLine(sum(full), 200)} · scope seeded by compile --session ×${seed.sessions || 0} (${oneLine(sum(seed), 90)})`;
}

/** judgeLineOf — the record's judge line, read off `gaffer_brain.mjs judge-due`'s own printed lines (gaffer_brain.mjs:2327-
 *  2334). SETTLED = the round banked, or nothing outstanding; every other answer is UNSETTLED: the next anchor runs it again. */
function judgeLineOf(r) {
  const first = String((r && r.stdout) || "").split(/\r?\n/).find((l) => l.startsWith("gaffer_brain:")) || lastLineOf(r) || "no output";
  const line = oneLine(first, 220);
  if (!r || r.status !== 0) return `JUDGE: NOT BANKED · ${exitOf(r)} · ${line}`;
  if (/^gaffer_brain: not due \(day\.close\) — nothing outstanding/.test(first) || /^gaffer_brain: nothing captured since the last judge/.test(first)) return `JUDGE: SETTLED · nothing outstanding · ${line}`;
  if (/^gaffer_brain: not due /.test(first)) return `JUDGE: NOT DUE · ${line}`;
  if (/^gaffer_brain: \d+ item\(s\) graded in ONE Opus call/.test(first)) return /still outstanding/.test(first) ? `JUDGE: NOT BANKED · partly graded · ${line}` : `JUDGE: SETTLED · banked · ${line}`;
  return `JUDGE: NOT BANKED · ${line}`;
}

// ---------------------------------------------------------------------------
// THE DAY-CLOSE CARD NAMES EVERY OPEN DAY (mcard · rows 913 (2) / 915 (3) / 938 (2) A3 · step (viii) · lane M's file)
// ---------------------------------------------------------------------------
// WHY: step (viii) files `dayclose:<D>`, a ROLLING key, so fileGuard keeps ONE live ask (captains_call.mjs fileGuard): an
//   evening that closes D+1 while D's card waits mints nothing, and the kept card went on naming D alone while the days after
//   it closed unnamed (row 914 (3); RED by name on mclose's landing row, row 943 (2)). Row 913 (2) ruled the branch: the
//   deck's door (captains_call.mjs `reline`, row 915 (3)) rewrites the KEPT card's line each evening to name every day still open.
// AN OPEN DAY, in this close's own terms: post_match/<D>.md is a MACHINE record (parseMachineRecord: CLOSED-BY by code, no
//   HIT/MISS of his on it); his full time on top makes the day his, and the next rewrite drops it.
// THE WINDOW: from the kept card's OWN day (its key's date — the door never changes a key) to the day this close closed:
//   the days that one ask has stood over, a morning-closed day among them. His answer ends the window (a haan or a na is a
//   decision); the next evening files a new card for its own day, as before. Named oldest first, inside the deck's line
//   bound (CARD_LINE_BOUND, read from its owner); when they do not all fit, the oldest that fit are named and the rest are
//   COUNTED, never dropped in silence.
// OWNERS-ONLY: the deck is READ here (its bound and its door's own target rule, relineTarget); its one write is the door,
//   through captains_call.mjs's own CLI, under the card's own child budget. A deck that cannot be read, or a door that
//   refuses (he answered a moment ago), leaves the card step exactly as before: `file`, keyed, with its reason.
const DAYCLOSE_FAMILY = "dayclose";   // step (viii)'s rolling key is `${DAYCLOSE_FAMILY}:<D>` (captains_call.mjs ROLLING_KEY)
const DAYCLOSE_ASK = "your HIT/MISS and tomorrow's line, if you want (/full-time)";
const DAYCLOSE_WHY = "his HIT/MISS and his KAL-line are his own words: code closed the machine half of the day and may never speak them (rows 873 (3) / 877 F1-F2)";
/** dayClosedLine — the line step (viii) has always filed for one closed day. */
const dayClosedLine = (day) => `${day}: the day closed itself — ${DAYCLOSE_ASK}`;

/** dayCloseLine — PURE. The kept card's line for the open days (any order, deduped, named oldest first): one day is the line
 *  step (viii) has always filed; more name every day that fits `bound` and COUNT the rest. null when not one day fits. */
function dayCloseLine(days, bound) {
  const ds = [...new Set((Array.isArray(days) ? days : []).map(String).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)))].sort();
  if (!ds.length || !(Number(bound) > 0)) return null;
  if (ds.length === 1) { const one = dayClosedLine(ds[0]); return one.length <= bound ? one : null; }
  for (let k = ds.length; k >= 1; k--) {
    const line = `${ds.slice(0, k).join(", ")}${k < ds.length ? ` +${ds.length - k} more` : ""}: the days closed themselves — ${DAYCLOSE_ASK}`;
    if (line.length <= bound) return line;
  }
  return null;
}

/** openDaysOf — READ-ONLY. The open days of post_match/ from one day to another (both YYYY-MM-DD, inclusive, either order),
 *  oldest first: each <D>.md that is a machine record with no result of his. An unreadable file is NAMED, never counted. */
function openDaysOf(from, to, { dir = PM_DIR } = {}) {
  const out = { days: [], unreadable: [] };
  const a = String(from || ""), b = String(to || ""), isDay = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d);
  if (!isDay(a) || !isDay(b)) return out;
  const lo = a < b ? a : b, hi = a < b ? b : a;
  for (let d = lo, guard = 0; d <= hi && guard < 4000; d = addDays(d, 1), guard++) {
    const f = join(dir, `${d}.md`);
    if (!existsSync(f)) continue;
    let text = null;
    try { text = readFileSync(f, "utf8"); } catch (e) { out.unreadable.push(`${d} (${(e && e.code) || "unreadable"})`); continue; }
    if (parseMachineRecord(text)) out.days.push(d);
  }
  return out;
}

// ---------------------------------------------------------------------------
// mpast · HIS FULL-TIME LINE FOR A PAST DAY THE DAY-CLOSE CARD NAMES (ruling A1 + B1, forks rows 956 (3) / 1015 (2)-(4))
// ---------------------------------------------------------------------------
// THE NAMED DAYS of a day-close card are the days its line names: the dates it spells (oldest first, dayCloseLine above) and,
//   when it says `+k more`, the k oldest open days after the last one it spells, up to `upto`. Only days STILL OPEN count.
// THE CARD whose named days his full time reads: the KEPT card (live, his word not on it); else the newest card of the family
//   he answered `haan` (his haan is "I will close it"). A `na` card's days are closed by the evening step instead (MP7).
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const isRealDay = (d) => DAY_RE.test(String(d)) && Number.isFinite(Date.parse(`${d}T00:00:00.000Z`)) && new Date(Date.parse(`${d}T00:00:00.000Z`)).toISOString().slice(0, 10) === d;
const keyDayOf = (card) => String((card && card.key) || "").slice(DAYCLOSE_FAMILY.length + 1);
/** namedDaysOf — READ-ONLY. The OPEN days a day-close card names (see above), oldest first. */
function namedDaysOf(card, { upto, dir = PM_DIR } = {}) {
  const m = /^((?:\d{4}-\d{2}-\d{2})(?:, \d{4}-\d{2}-\d{2})*)(?: \+(\d+) more)?: /.exec(String((card && card.line) || ""));
  if (!m) return [];
  const spelled = m[1].split(", ").filter(isRealDay).sort();
  const more = Number(m[2] || 0), last = spelled[spelled.length - 1];
  const counted = more > 0 && last && isRealDay(upto) && upto > last ? openDaysOf(addDays(last, 1), upto, { dir }).days.slice(0, more) : [];
  const open = new Set(openDaysOf(spelled[0], spelled[spelled.length - 1], { dir }).days);
  return [...new Set([...spelled.filter((d) => open.has(d)), ...counted])].sort();
}
/** readDayCloseDeck — READ-ONLY, through the deck's own exports: its bound, the KEPT card, and the newest ANSWERED card of the
 *  family (newest by its key's day). Never throws: an unreadable deck returns `error`. */
async function readDayCloseDeck() {
  try {
    const CC = await import("./captains_call.mjs");
    const cards = CC.loadState().cards;
    const t = CC.relineTarget(cards, { family: DAYCLOSE_FAMILY });
    const answered = (Array.isArray(cards) ? cards : []).filter((c) => c && c.source === "hand-filed" && c.answer
      && String(c.key || "").startsWith(`${DAYCLOSE_FAMILY}:`) && isRealDay(keyDayOf(c)))
      .sort((a, b) => (keyDayOf(a) < keyDayOf(b) ? -1 : keyDayOf(a) > keyDayOf(b) ? 1 : String(a.answered_at || "") < String(b.answered_at || "") ? -1 : 1)).at(-1) || null;
    return { bound: CC.CARD_LINE_BOUND, kept: t.card || null, answered };
  } catch (e) { return { error: oneLine((e && e.message) || e, 80), bound: null, kept: null, answered: null }; }
}
/** cardNamedOpen — the card his full time reads and its named OPEN days (oldest first); the newest is the day his line closes. */
async function cardNamedOpen({ today, dir = PM_DIR } = {}) {
  const deck = await readDayCloseDeck();
  const card = deck.kept || (deck.answered && deck.answered.answer === "haan" ? deck.answered : null);
  if (!card) return { card: null, how: null, days: [], error: deck.error || null };
  const upto = deck.kept ? today : (istDayOf(new Date(Date.parse(card.answered_at) || Date.now())) < today ? istDayOf(new Date(Date.parse(card.answered_at))) : today);
  return { card, how: deck.kept ? "kept" : "answered haan", days: namedDaysOf(card, { upto, dir }), error: null };
}
/** kalAsked — PURE. The KAL-line is asked only when the day his line closes is yesterday or today (manager reads yesterday's). */
const kalAsked = (closed, today) => closed === today || closed === addDays(today, -1);
/** appendAbsence — ONE line appended to an OPEN machine record (the bytes above it kept, L9). Returns a summary word. */
function appendAbsence(day, line, { dir = PM_DIR } = {}) {
  const f = join(dir, `${day}.md`);
  let text;
  try { text = readFileSync(f, "utf8"); } catch (e) { return `${day} unreadable (${(e && e.code) || "?"})`; }
  if (!parseMachineRecord(text)) return `${day} not open — untouched`;
  writeAtomic(f, `${text}${text.endsWith("\n") ? "" : "\n"}${line}\n`);
  return null;
}
/** settleNaCard — MP7: the newest ANSWERED card of the family, when its word is `na`, closes every day it named by the recorded
 *  absence (baad is not an answer — it sleeps the card and closes nothing). Idempotent: a closed day is not open. */
function settleNaCard(card, { dir = PM_DIR } = {}) {
  if (!card || card.answer !== "na") return { closed: [], misses: [] };
  const at = String(card.answered_at || card.retired_at || "");
  const upto = Number.isFinite(Date.parse(at)) ? istDayOf(new Date(Date.parse(at))) : keyDayOf(card);
  const days = namedDaysOf(card, { upto, dir }), closed = [], misses = [];
  for (const d of days) { const miss = appendAbsence(d, absenceLine(`his na on the day-close card ${card.id}`, at), { dir }); if (miss) misses.push(miss); else closed.push(d); }
  return { closed, misses };
}

/** dayCloseCard — step (viii) after an EVENING close: through the deck's door when a card of the family is kept, `file` as
 *  before when none is (or when the door refuses). Returns the card's piece of the summary line; never throws.
 *  mpast B1: with NO kept card, the filed card names every open day since the day AFTER the newest ANSWERED card's day — the
 *  door rewrites the line `file` just filed (the card is born once, by `file`, as before) — and a `na` on that answered card
 *  first closes every day it named (settleNaCard). The morning still files none and rewrites none (row 877). */
async function dayCloseCard({ day, run, dir = PM_DIR }) {
  let kept = null, bound = null, note = "", answered = null;
  const deck = await readDayCloseDeck();   // READ-ONLY: the deck's line bound, its door's own target rule, its newest answered card
  if (deck.error) note = ` (the deck could not be read: ${deck.error})`;
  else { bound = deck.bound; kept = deck.kept; answered = deck.answered; }
  const na = settleNaCard(answered, { dir });
  const naNote = na.closed.length || na.misses.length ? ` · na on ${answered.id} closed ${na.closed.length} named day(s) with no line of his${na.misses.length ? ` (${oneLine(na.misses.join(", "), 60)})` : ""}` : "";
  if (kept) {
    const open = openDaysOf(kept.key.slice(DAYCLOSE_FAMILY.length + 1), day, { dir });
    const line = dayCloseLine(open.days, bound);
    const unread = open.unreadable.length ? ` · ${open.unreadable.length} record(s) unreadable: ${oneLine(open.unreadable.join(", "), 60)}` : "";
    if (!line) return `CARD LINE NOT REWRITTEN (${kept.id} kept · ${open.days.length} open day(s) · no line fits the deck's bound ${bound}${unread})`;
    const r = run("captains_call.mjs", ["reline", "--family", DAYCLOSE_FAMILY, "--key", kept.key, "--line", line], { timeout: 30000 });
    if (r.status === 0) return `card ${kept.id} kept · its line names ${open.days.length} open day(s), ${open.days[0]} to ${open.days[open.days.length - 1]}${unread}${naNote}`;
    note = ` (the door refused first: captains_call ${exitOf(r)}: ${oneLine(lastLineOf(r), 90)})`;
  }
  const c = run("captains_call.mjs", ["file", "--line", dayClosedLine(day), "--key", `${DAYCLOSE_FAMILY}:${day}`, "--why-code-cannot-decide", DAYCLOSE_WHY], { timeout: 30000 });
  if (c.status !== 0) return `CARD NOT FILED (captains_call ${exitOf(c)}: ${oneLine(lastLineOf(c), 100)})${note}${naNote}`;
  const filed = oneLine(lastLineOf(c).replace(/^captains_call:\s*/, "card "), 120);
  // mpast B1: the window opens the day AFTER the newest answered card's day (with none answered, D alone — the BASE line)
  const from = answered && !kept && addDays(keyDayOf(answered), 1) < day ? addDays(keyDayOf(answered), 1) : day;
  const open = from < day ? openDaysOf(from, day, { dir }) : { days: [day], unreadable: [] };
  const line = open.days.length > 1 ? dayCloseLine(open.days, bound) : null;
  if (!line) return `${filed}${note}${naNote}`;
  const r = run("captains_call.mjs", ["reline", "--family", DAYCLOSE_FAMILY, "--key", `${DAYCLOSE_FAMILY}:${day}`, "--line", line], { timeout: 30000 });
  return `${filed} · ${r.status === 0 ? `its line names ${open.days.length} open day(s), ${open.days[0]} to ${open.days[open.days.length - 1]}` : `its line NOT REWRITTEN to name ${open.days.length} open day(s) (captains_call ${exitOf(r)}: ${oneLine(lastLineOf(r), 80)})`}${note}${naNote}`;
}

// ---------------------------------------------------------------------------
// mpm F5 · THE DAY CLOSE JUDGES ONLY A DAY THE ARCHIVE SAW — and an outstanding capture IS the archive having seen it
// ---------------------------------------------------------------------------
// WHY: step (ii) asked only the archive's study turns, so a day whose ONLY trace is his spoken answers waiting on the gaffer
//   grade queue (captured by gradeCapture, never judged) read "no evidence · nothing run" and its judge step never fired for
//   it. Those captures are evidence of D by the mjday rule: each capture keeps ITS OWN IST day (gaffer_brain.mjs captureDay —
//   its instant through the IST helper; with no instant, the day it carries; with neither, no day). Outstanding = no settled
//   row after it (the owner's own outstandingBank). A queue-only day closes with its judge step and NO compile (no study
//   session names a note to compile); a day with neither stays exactly as today.
// THE RULE'S ONE HOME is gaffer_brain.mjs: unit mtail (mpm F1) — it exports captureDay and this file IMPORTS it (top of file);
//   the pinned copy and its own copy of the IST helper are gone. The import adds no edge (this file already imported
//   gaffer_brain.mjs), so it closes no cycle.
/** istDayOf — the IST day of an instant, read THROUGH the owner's mjday rule (captureDay of that instant), never a second copy
 *  of the IST helper: the mpast card days (dayCloseCard's `upto`) and the capture days agree by construction. */
const istDayOf = (d) => captureDay({ ts: d.toISOString() }).day;
/** queueEvidenceOf — PURE. The outstanding captures OF `day` (each by its own IST day): their count, their ids in queue order,
 *  and the newest instant among them (a capture with only a day stands at that IST day's start, judgeOrder's own placing). */
function queueEvidenceOf(day, outstanding) {
  const mine = (Array.isArray(outstanding) ? outstanding : []).filter((r) => r && r.kind === "capture" && captureDay(r).day === day);
  const at = mine.map((r) => { const c = captureDay(r); return c.at ? Date.parse(c.at) : Date.parse(`${c.day}T00:00:00.000Z`) - 5.5 * 3600000; });
  return { count: mine.length, ids: mine.map((r) => String(r.id)), last_ts: at.length ? new Date(Math.max(...at)).toISOString() : null };
}
/** queueEvidenceLine — the record's evidence sub-line on a queue-only day. */
const queueEvidenceLine = (day, q) => `  · grade queue: ${q.count} outstanding capture(s) of ${day} (each capture's own IST day) · ${oneLine(q.ids.join(", "), 160)}`;
/** queueCompileLine — a queue-only day has no study session, so no note to compile: DONE by name, never run. */
const queueCompileLine = (day, q) => `COMPILE: DONE · nothing to compile — no study session on ${day}; the evidence is ${q.count} outstanding capture(s) on the grade queue`;

/** autoclose — the machine half of the close (see the header above). Returns the exit code; never process.exit (a piped
 *  stdout on Windows is asynchronous, and the conductor tees this organ's voice into its log). */
async function autoclose(argv) {
  const opt = (k) => { const i = argv.indexOf(k); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : null; };
  const dry = argv.includes("--dry");
  const anchor = opt("--anchor");
  if (!ANCHORS.includes(anchor)) { console.error("postmatch: autoclose --date <YYYY-MM-DD|chain|chain-1> --anchor <evening|morning|close> [--dry] — the conductor's dayclose steps pass both; a hand back-fill passes its day and --anchor morning; day.mjs end passes --anchor close"); return 2; }
  const dres = resolveAutocloseDay(opt("--date"));
  if (dres.error) { console.error(`postmatch: autoclose REFUSED — ${dres.error}`); return 2; }
  const day = dres.day;
  const clock = autocloseClock();
  if (clock.door) console.error(`postmatch: autoclose clock door ${clock.door}`);
  // row 914 G-n (b): THE DEADLINE, on the step's clock. A child starts only when the time left covers its own budget plus the
  // budgets reserved for the calls after it; its spawn timeout is the time left minus that reserve, so a hung child never eats a
  // later child's slot. A call that does not fit is not started, and its line says so: UNSETTLED, not reached.
  const dl = autocloseDeadline({ at: clock.at });
  if (dl.door) console.error(`postmatch: autoclose deadline door ${dl.door}`);
  const { fits, spawnMs } = closeTimer({ at: clock.at, dlMs: dl.ms });   // the ONE clock: every time left below is read through it
  const { spawnSync } = await import("node:child_process");
  const run = (file, args, { env = process.env, timeout = CHILD_TIMEOUT_MS } = {}) => spawnSync(process.execPath, [join(__dirname, file), ...args],
    { cwd: join(__dirname, ".."), encoding: "utf8", windowsHide: true, timeout, env });
  const voice = (r) => { if (r && r.stdout) process.stdout.write(r.stdout); if (r && r.stderr) process.stderr.write(r.stderr); };

  // (i) THE ARCHIVE CATCHES UP — archivist's own CLI (notes_compiler fullTime's own first step and number, :633), best effort
  let archiveLine = "not run (--dry)";
  if (!dry) {
    const a = run("archivist.mjs", ["run"]);
    archiveLine = a.status === 0 ? `caught up (archivist run: ${oneLine(lastLineOf(a), 140)})`
      : `NOT CAUGHT UP (archivist run ${exitOf(a)}: ${oneLine(lastLineOf(a), 140)}) — the close reads what the archive holds`;
  }

  // (ii) THE EVIDENCE — no study session, or no captured study turn: ONE line, nothing run, nothing written (F5)
  const { sessionsNamedOn, studyTurnsOfDay } = await import("./exchanges.mjs");
  const { studySessionsOfDay } = await import("./study_scope.mjs");
  const named = sessionsNamedOn(day);
  const ev = studySessionsOfDay(day, { archiveSessions: named.sessions });
  const ids = ev.sessions.map((s) => s.id);
  const tt0 = studyTurnsOfDay(day, ids);
  // mpm F5 — the grade queue's outstanding captures OF D, by the owner's reader and the mjday rule (queueEvidenceOf above)
  const studySeen = ids.length > 0 && tt0.turns >= 1;
  const queue = studySeen ? null : queueEvidenceOf(day, outstandingBank());
  const queueOnly = !!queue && queue.count > 0;
  const tt = queueOnly ? { ...tt0, last_ts: queue.last_ts } : tt0;   // a queue-only day's evidence instant is its newest capture
  if (!studySeen && !queueOnly) {
    console.log(`autoclose · ${day} · no evidence · nothing run (${ids.length} study session(s) · ${tt.turns} captured study turn(s) · teaching_audit ${oneLine(ev.read.teaching_audit || "—", 70)} · archive ${oneLine(archiveLine, 90)})`);
    return 0;
  }

  // (iii) THE QUIET RULE (F3) — the evening waits while study may still be arriving; the morning step closes that day
  const quiet = quietVerdict({ anchor, lastTs: tt.last_ts, at: clock.at });
  if (quiet.defer) {
    console.log(`autoclose · ${day} · deferred · last study turn ${quiet.age_min} min ago (under ${AUTOCLOSE_QUIET_MIN}; the morning step closes it) · nothing written`);
    return 0;
  }

  // (iv) IDEMPOTENT BY DAY
  const pmFile = join(PM_DIR, `${day}.md`);
  let prior = null;
  try { if (existsSync(pmFile)) prior = readFileSync(pmFile, "utf8"); }
  catch (e) { console.error(`postmatch: autoclose — ${pmFile} exists and cannot be read (${oneLine((e && e.code) || (e && e.message) || e, 60)}) — nothing written`); return 1; }
  const dec = autocloseDecision(prior, tt.last_ts);
  if (dec.act === "his") { console.log(`autoclose · ${day} · closed by his word (RESULT ${dec.result}) · never touched`); return 0; }
  if (dec.act === "decided") { console.log(`autoclose · ${day} · closed by a recorded decision (no line of his) · never touched`); return 0; }
  if (dec.act === "foreign") { console.error(`autoclose · ${day} · post_match/${day}.md is neither his close nor a machine record — never touched (a hand's file is not code's to overwrite)`); return 0; }
  if (dec.act === "nothing-new") { console.log(`autoclose · ${day} · nothing new (turns_until ${dec.prev.turns_until} ≥ the last study turn ${tt.last_ts}; the compile done, the judge settled) · nothing written`); return 0; }

  // the compiler's own CLI, twice — the scope seed, then fulltime — keyed to THE CLOSED DAY, never the clock's (row 883)
  const noteDay = day;
  const compileRun = () => {
    if (queueOnly) return queueCompileLine(day, queue);   // mpm F5: no study session names a note — nothing is spawned
    // row 914 G5: the compile starts only when the time left covers its seed, one reader budget, the judge and the card after it
    const f0 = fits(CHILD_TIMEOUT_MS + READER_BUDGET_MS + JUDGE_CHILD_MS + CHILD_TIMEOUT_MS);
    if (!f0.ok) return `COMPILE: UNSETTLED · ${f0.line} (the compile's seed, one reader budget, the judge and the card)`;
    const s0 = spawnMs(f0, READER_BUDGET_MS + JUDGE_CHILD_MS + CHILD_TIMEOUT_MS);
    if (!s0.ok) return `COMPILE: UNSETTLED · ${s0.line} (the compile's seed)`;
    const seed = run("notes_compiler.mjs", ["compile", "--date", noteDay, ...ids.flatMap((s) => ["--session", s])], { timeout: s0.ms });
    voice(seed);
    let full = null;
    if (seed.status === 0) {
      // row 914 G6: fulltime carries the GATE's deadline — the close's, minus the judge's budget and the card's — so the notes never
      // eat the judge's slot; handed as a real-clock instant (the time left, translated), so a child on the real clock agrees
      const f1 = fits(READER_BUDGET_MS + JUDGE_CHILD_MS + CHILD_TIMEOUT_MS);
      if (!f1.ok) return `COMPILE: UNSETTLED · fulltime ${f1.line} (one reader budget, the judge and the card)`;
      const s1 = spawnMs(f1, JUDGE_CHILD_MS + CHILD_TIMEOUT_MS);
      if (!s1.ok) return `COMPILE: UNSETTLED · fulltime ${s1.line}`;
      const gateLeft = s1.ms;
      full = run("notes_compiler.mjs", ["fulltime", "--date", noteDay, "--no-archive-run", "--deadline", new Date(Date.now() + gateLeft).toISOString()], { timeout: gateLeft });
      voice(full);
    }
    return compileLineOf({ status: seed.status, stdout: seed.stdout, stderr: seed.stderr, error: seed.error, signal: seed.signal, sessions: ids.length }, full);
  };
  // the judge round through its own CODE door — judgeDue's rule (the PACER's idle rule) decides; nothing banked = not due
  const judgeRun = () => {
    const f = fits(JUDGE_CHILD_MS + CHILD_TIMEOUT_MS);   // row 914 G5: the judge's own budget plus the card's after it · mtail F-B: the judge's = its budget + its dispatch margin
    if (!f.ok) return `JUDGE: UNSETTLED · ${f.line} (the judge and the card)`;
    const s = spawnMs(f, CHILD_TIMEOUT_MS);
    if (!s.ok) return `JUDGE: UNSETTLED · ${s.line} (the judge)`;
    const r = run("gaffer_brain.mjs", ["judge-due", "--trigger", "day.close"], { env: { ...process.env, ARSENAL_ORGAN: "1" }, timeout: s.ms });
    voice(r);
    return judgeLineOf(r);
  };
  const shortJudge = (l) => l.replace(/^JUDGE: /, "judge ").split(" · ").slice(0, 2).join(" · ");

  if (dec.act === "unsettled") {
    // row 891 (1): re-run ONLY what did not finish and refresh ONLY its line — the record's other bytes stay as they are
    if (dry) { console.log(`autoclose · ${day} · unsettled (${dec.redo.join(" + ")}) · --dry: would re-run ${dec.redo.join(" + ")} and refresh only that line · nothing written`); return 0; }
    let text = prior;
    if (dec.redo.includes("compile")) { const l = compileRun(); text = text.replace(dec.prev.compile_line, () => l); }
    if (dec.redo.includes("judge")) { const l = judgeRun(); text = text.replace(dec.prev.judge_line, () => l); }
    if (text === prior) { console.log(`autoclose · ${day} · unsettled (${dec.redo.join(" + ")}) · re-run, the same answer · nothing written`); return 0; }
    try { writeAtomic(pmFile, text); } catch (e) { console.error(`postmatch: autoclose — the refreshed line could NOT be written (${oneLine((e && e.message) || e, 120)})`); return 1; }
    const after = parseMachineRecord(text) || {};
    console.log(`autoclose · ${day} · refreshed ${dec.redo.join(" + ")} line(s) (${anchor} anchor, no new study turn) · compile ${after.compile_done ? "DONE" : "NOT DONE"} · ${shortJudge(after.judge_line || "")} → ${pmFile}`);
    return 0;
  }

  // (v) THE MACHINE RECORD — written first; the compile and the judge fill their lines as they finish
  const at = clock.at.toISOString();
  const record = (compileLine, judgeLine) => renderMachineRecord({ day, anchor, at, ev, tt, archiveLine, compileLine, judgeLine, queueLine: queueOnly ? queueEvidenceLine(day, queue) : null });
  if (dry) { console.log("--- AUTOCLOSE DRY RUN (nothing written) ---\n" + record(PENDING_COMPILE, PENDING_JUDGE)); return 0; }
  const did = dec.act === "refresh" ? "refreshed" : "closed";
  try { writeAtomic(pmFile, record(PENDING_COMPILE, PENDING_JUDGE)); }
  catch (e) { console.error(`postmatch: autoclose — the machine record could NOT be written (${oneLine((e && e.message) || e, 120)}) — the day is NOT closed`); return 1; }
  // (vi) THE NOTES
  const compileLine = compileRun();
  // (vii) THE JUDGE ROUND
  let judgeLine = PENDING_JUDGE;
  try {
    writeAtomic(pmFile, record(compileLine, PENDING_JUDGE));
    judgeLine = judgeRun();
    writeAtomic(pmFile, record(compileLine, judgeLine));
  } catch (e) { console.error(`postmatch: autoclose — a line of the record could NOT be written (${oneLine((e && e.message) || e, 120)}); the next anchor finishes it`); return 1; }
  // (viii) HIS HALF — ONE card, after an evening close only; a KEPT card names every day still open (mcard, dayCloseCard)
  let card = "no card (the morning anchor files none)";
  const fc = fits(CHILD_TIMEOUT_MS);   // row 914 G5: the card starts only with its own budget left
  if (CARD_ANCHORS.includes(anchor) && !fc.ok) card = `CARD NOT FILED (${fc.line} — the card)`;
  else if (CARD_ANCHORS.includes(anchor)) card = await dayCloseCard({ day, run });
  // (ix) ONE summary line
  console.log(`autoclose · ${day} · ${did} by code (${anchor} anchor) · ${tt.turns} captured study turn(s) in ${ids.length} session(s) · ${compileLine.startsWith("COMPILE: DONE") ? "notes DONE" : "NOTES NOT DONE"} · ${shortJudge(judgeLine)} · ${card} → ${pmFile}`);
  return 0;
}

// ---------------------------------------------------------------------------
// selftest — fixtures only, everything in-memory
// ---------------------------------------------------------------------------
async function selftest() {
  const checks = [];
  const assert = (name, cond) => { checks.push([name, !!cond]); console.log(`  ${cond ? "✓" : "✗"} ${name}`); };
  const dateStr = "2026-07-12";

  const md = renderPostMatch({
    hit: "HIT", signal: "context capsule held under a cold derby", kal: "pehla move: context-window Re-Jirah, phir M1 parser",
    diag: null, disclosures: ["nemesis headline withheld today (RED mercy — nobody rubs a wound on a broken day)"],
    twinVoice: null, pendingBalls: [{ id: "m1", text: "dot vs cosine same cheez?" }], matchday: 5, dateStr,
  });
  assert("KAL-LINE matches manager.mjs parser regex", KAL_RE.test(md) && md.match(KAL_RE)[1].includes("context-window Re-Jirah"));

  // audit #82 — A DECLINED KAL-LINE MUST BE INDISTINGUISHABLE FROM NOTHING, NOT FROM A COMMITMENT.
  // The old code defaulted a declined prompt to "one green ball, first thing. That's the whole
  // plan." and WALLPAPER.ps1's never-run fallback printed "one green ball, first thing." — so
  // the desktop showed the same amber headline whether he had declined or never played at all.
  const mdNoKal = renderPostMatch({
    hit: "HIT", signal: "s", kal: null, diag: null, disclosures: [],
    twinVoice: null, pendingBalls: [], matchday: 5, dateStr,
  });
  assert("DECLINED KAL: the parser finds NOTHING (so kal_line reads null downstream, not a fake line)",
    KAL_RE.test(mdNoKal) === false);
  assert("DECLINED KAL: the file still says out loud that the prompt was declined",
    /declined/i.test(mdNoKal));
  assert("DECLINED KAL: the old fabricated sentence appears nowhere in the tree's output",
    !/one green ball, first thing/i.test(mdNoKal));
  assert("badge + matchday + COYG present", md.includes(BADGE) && md.includes("Matchday 5") && md.includes("COYG."));
  // OVERHAUL Block 5.2 — THE FULL-TIME EVENT: the close arms brain's `fulltime` trigger AFTER the record is
  // written (never before, never on --dry), through the owner's door, inside its own try (best-effort).
  {
    const src = readFileSync(fileURLToPath(import.meta.url), "utf8");   // fileURLToPath: xray resolves it; `new URL(...)` it cannot (the ratchet)
    const armCall = 'execFileSync(process.execPath, [join(__dirname, "brain.mjs"), "trigger", "fulltime"';   // the runtime call, not this selftest's own literals
    const iWrite = src.lastIndexOf("writeAtomic(SEASON, newSeason)"), iArm = src.lastIndexOf(armCall), iDry = src.lastIndexOf('console.log("--- DRY RUN (nothing written) ---');
    assert("FULL-TIME EVENT — `brain.mjs trigger fulltime` is armed AFTER season/post_match are written and after the dry-run return (a dry close arms nothing), through the owner's CLI, best-effort",
      iArm > iWrite && iWrite > iDry && iDry > 0 && /try \{\s*const \{ execFileSync \} = await import\("node:child_process"\);\s*execFileSync\(process\.execPath, \[join\(__dirname, "brain\.mjs"\), "trigger", "fulltime"[^\n]*\n\s*\} catch \{ \}/.test(src));
  }
  // RUNG L1 (15 Oct 2026) — THE NOTES ANCHOR: the close fires the compiler's OWN `fulltime` for the day it closed, AFTER
  // post_match/<date>.md is written and after the dry-run return, and a notes failure is LOUD — never a bare catch.
  {
    const src = readFileSync(fileURLToPath(import.meta.url), "utf8");
    const iCall = src.lastIndexOf('[join(__dirname, "notes_compiler.mjs"), "fulltime", "--date", dateStr]');   // the runtime call, not this assertion's literal
    const iPm = src.lastIndexOf('writeAtomic(join(PM_DIR, dateStr + ".md"), md)'), iDryRet = src.lastIndexOf('console.log("--- DRY RUN (nothing written) ---');
    const block = iCall > 0 ? src.slice(iCall, src.indexOf("const routedTonight", iCall)) : "";
    assert("NOTES ANCHOR — notes_compiler.mjs `fulltime --date <the closed day>` fires AFTER post_match/<date>.md is written and after the dry return, through the compiler's own CLI; a failure says NOTES NOT DONE out loud and on the close line, never a bare catch",
      iCall > iPm && iPm > iDryRet && iDryRet > 0 && block.includes("NOTES NOT DONE") && !/catch \{ \}/.test(block) && /\$\{notesLine\} → /.test(src));
  }
  assert("DISCLOSURE LAW — withheld adaptations always render", md.includes("QUIET ADAPTATIONS") && md.includes("nemesis headline withheld"));
  assert("pending throw-ins shown verbatim, never auto-routed", md.includes("dot vs cosine same cheez?") && md.includes("one word routes them"));
  assert("null twin voice renders nothing (win-only respected)", !md.includes("THE BOOK:"));
  const mdVoice = renderPostMatch({ hit: "HIT", signal: "x", kal: "y", diag: null, disclosures: [], twinVoice: "the book had you at 35% — you landed it anyway.", pendingBalls: [], matchday: 6, dateStr });
  assert("earned twin voice renders", mdVoice.includes("THE BOOK:") && mdVoice.includes("35%"));

  const mdMiss = renderPostMatch({ hit: "MISS", signal: "wall won today", kal: "one green ball at 09:00", diag: "start", disclosures: [], twinVoice: null, pendingBalls: [], matchday: 7, dateStr });
  assert("MISS gets warm-diagnostic + 3-choice", mdMiss.includes("data, not a verdict") && mdMiss.includes("DIAGNOSTIC"));
  assert("NO SHAME LAW — no failure/streak language on MISS", !/fail|failure|streak|broke your/i.test(mdMiss));
  const mdRest = renderPostMatch({ hit: "REST", signal: null, kal: "kal fresh", diag: null, disclosures: [], twinVoice: null, pendingBalls: [], matchday: 8, dateStr });
  assert("REST = LOAD-MANAGED, a won day", mdRest.includes("LOAD-MANAGED") && mdRest.includes("won day"));

  // season math
  const s1 = updateSeason(null, "HIT", dateStr);
  assert("season skeleton created; HIT increments matches_played", s1.matches_played === 1 && s1.trophy_state === "unlit");
  assert("REST increments (conscious rest = won day)", updateSeason(s1, "REST", dateStr).matches_played === 2);
  assert("MISS does NOT increment (but never shames)", updateSeason(s1, "MISS", dateStr).matches_played === 1);
  assert("first post-match is season day 1", s1.season_day === 1);
  assert("season_day always advances", updateSeason(s1, "MISS", dateStr).season_day === 2);

  // notebook
  const nb = updateNotebook(null, "the Tuesday you thought you'd break and didn't", "HIT", dateStr);
  assert("notebook records real moments", nb.moments.length === 1 && nb.moments[0].line.includes("Tuesday"));
  const big = { moments: Array(50).fill({ date: "x", line: "y" }) };
  assert("notebook stays compressed (~45 moments)", updateNotebook(big, "new", "HIT", dateStr).moments.length === 45);

  // route-only mode (the Dugout's spoken gate)
  const pend = [{ id: "m1", text: "a" }, { id: "m2", text: "b" }];
  assert("route picker: 'all' takes everything", pickBallsToRoute(pend, "all").length === 2);
  assert("route picker: explicit ids take the subset only", pickBallsToRoute(pend, "ids", ["m2"]).map(b => b.id).join() === "m2");
  assert("route picker: unknown id routes nothing (safe no-op)", pickBallsToRoute(pend, "ids", ["zz"]).length === 0);

  // DEAD-WIRE SWEEP (11 Aug 2026) — THE ROUTING LEDGER, the ONLY durable record
  // of what he routed. Off DISK, through the real reader, because the bug was in
  // the read and never in the render: `readJson(ROUTED) || {routed:[]}` turned a
  // torn file into an empty one, and the next write erased the history for good.
  // The `routed:false` flag on the rows is inert BY DESIGN (see readRoutedLedger's
  // header) — these checks pin that the LEDGER is what does the subtracting, so a
  // future reader cannot delete the ledger arm believing the flag covers it.
  {
    const tmp = mkdtempSync(join(tmpdir(), "arsenal-postmatch-route-"));
    try {
      const led = join(tmp, "routed_balls.json");
      // both lanes carry routed:false, exactly as their owners stamp them on arrival
      writeFileSync(join(tmp, "loose_balls.jsonl"), JSON.stringify({ ts: "2026-07-17T07:53:33.000Z", id: "m1", text: "dot vs cosine same cheez?", routed: false }) + "\n");
      writeFileSync(join(tmp, "dugout_notes.jsonl"), JSON.stringify({ ts: "2026-08-10T10:12:11.964Z", text: "study hallucinations from scratch", routed: false }) + "\n");

      const absent = readRoutedLedger(led);
      assert("ROUTING LEDGER: an ABSENT file is legitimately empty — nothing routed yet, and safe to write",
        absent.present === false && absent.readable === true && absent.rows.length === 0);

      writeFileSync(led, JSON.stringify({ routed: [{ id: "m1", routed_on: "2026-08-10" }] }));
      const good = readRoutedLedger(led);
      assert("ROUTING GATE: the LEDGER — not the inert routed:false flag — is what drops a routed ball from pending",
        good.readable === true
        && pendingThrowIns(new Set(good.rows.map(r => r.id)), {}, tmp).map(b => b.id).join() === "note:2026-08-10T10:12:11.964Z");

      writeFileSync(led, '{"routed":[{"id":"m1",');            // half a write — the crash-mid-rename shape
      const torn = readRoutedLedger(led);
      assert("ROUTING LEDGER: a TORN file is present-but-UNREADABLE, never a silent empty (the old readJson swallowed it and the next write wiped the history)",
        torn.present === true && torn.readable === false);
      writeFileSync(led, JSON.stringify({ routed: "not-an-array" }));
      assert("ROUTING LEDGER: a WRONG-SHAPED file is unreadable too — shape is checked, not just parseability",
        readRoutedLedger(led).readable === false);
      assert("ROUTING LEDGER: on an unreadable ledger nothing is subtracted — every throw-in shows as pending, which is the honest read when we cannot know",
        pendingThrowIns(new Set(readRoutedLedger(led).rows.map(r => r.id)), {}, tmp).length === 2);

      assert("ROUTING GATE: one filter, two callers — the 〔dugout〕 suffix rides only where it is asked for (the two copies had drifted apart)",
        pendingThrowIns(new Set(), { dugoutSuffix: " 〔dugout〕" }, tmp).some(b => b.id.startsWith("note:") && b.text.endsWith(" 〔dugout〕"))
        && !pendingThrowIns(new Set(), {}, tmp).some(b => b.text.includes("〔dugout〕")));
    } finally { rmSync(tmp, { recursive: true, force: true }); }
  }

  // SEASON.md — the logbook (8 Aug 2026)
  {
    const s1r = updateSeason(null, "HIT", "2026-08-10", { kal: "pehla move: rejirah embeddings", signal: "held cold" });
    const s2r = updateSeason(s1r, "MISS", "2026-08-11", {});
    const s3r = updateSeason(s2r, "REST", "2026-08-12", { kal: "kal fresh: M1 parser" });
    assert("SEASON rows: one row per close, MISS days included (data, not a verdict)",
      s3r.rows.length === 3 && s3r.rows[1].result === "MISS" && s3r.rows[1].matchday === null);
    assert("SEASON rows: won days carry their matchday number; KAL + signal ride the row",
      s3r.rows[0].matchday === 1 && s3r.rows[2].matchday === 2 && s3r.rows[0].kal.includes("rejirah"));
    const mdSeason = renderSeasonMd({ season: s3r, lockedCount: 4, python: { tier: null, fluency: "🔴" },
      benchmark: { status: "gated_pre_audit", gate: { missions_line: "full-syllabus audit 0/4 returned" } }, now: new Date(2026, 7, 12) });
    assert("SEASON.md: standings carry day/matchdays/run + form glyphs (rest-dot neutral)",
      /season day 3 · matchdays played 2 · current run: 1 won-day/.test(mdSeason) && /● · ◦/.test(mdSeason));
    assert("SEASON.md: KAL→KICKOFF weld shows the LAST recorded KAL verbatim",
      /KAL→KICKOFF weld: "kal fresh: M1 parser" \(2026-08-12\)/.test(mdSeason));
    assert("SEASON.md: match rows newest-first with REST labelled load-managed",
      mdSeason.indexOf("| 2026-08-12 |") < mdSeason.indexOf("| 2026-08-10 |") && /REST \(load-managed\)/.test(mdSeason));
    assert("SEASON.md: benchmark gate line passes through honestly",
      /benchmark: GATED \(pre-audit\) — full-syllabus audit 0\/4 returned/.test(mdSeason));
    // 10 Aug 2026 wiring pass — the standings row carried counts only, so the
    // logbook recorded where he stood on a date and never what was still open on
    // that date. benchmark.mjs owns needs[]; this is its record.
    const mdNeeds = renderSeasonMd({ season: s3r, lockedCount: 4, python: null, now: new Date(2026, 7, 12),
      benchmark: { status: "ok", buckets: [{ id: "B2", counts: { locked: 1, core_total: 5 } }],
        needs: ["2-rag: unlock chunking, retrieval", "course: 6 chapters remain"] } });
    assert("SEASON.md: the benchmark's NEED NAMES enter the logbook whole (a logbook that summarises lies)",
      /- benchmark need: 2-rag: unlock chunking, retrieval · course: 6 chapters remain/.test(mdNeeds));
    // DEAD-WIRE SWEEP 11 Aug 2026 — the standings row maps over buckets[], and the two
    // differentiators are deliberately NOT buckets, so the logbook has recorded every
    // bucket on a date and never the lanes carrying 46.7% + 44.5% of the interview.
    const mdDx = renderSeasonMd({ season: s3r, lockedCount: 4, python: null, now: new Date(2026, 7, 12),
      benchmark: { status: "ok", buckets: [{ id: "B2", counts: { locked: 1, core_total: 5 } }],
        differentiators_line: "differentiators (not a 6th bucket — the #1 senior signal + the fintech moat): 6-cross-cut: locked 0/1 (rides: system_design 26.7% + production_eval 20% = 46.7% of the interview)" } });
    assert("SEASON.md: the benchmark's DIFFERENTIATORS get their own permanent row, counts + interview weight (never folded into the bucket row)",
      /^- benchmark differentiators \(not a 6th bucket[^\n]*6-cross-cut: locked 0\/1[^\n]*46\.7% of the interview/m.test(mdDx)
      && !/locked\/core per bucket[^\n]*cross-cut/.test(mdDx));
    assert("SEASON.md: a pre-wire benchmark (no differentiators_line) writes no differentiators row (absence, not a zero)",
      !/differentiators/.test(mdNeeds));
    // DEAD-WIRE SWEEP 11 Aug 2026 — the HAVE half enters the logbook. needs[] was
    // wired 10 Aug; have[] had no reader anywhere in the organism, so SEASON.md has
    // recorded this season's debt on every date and never its credit.
    const mdHaves = renderSeasonMd({ season: s3r, lockedCount: 4, python: null, now: new Date(2026, 7, 12),
      benchmark: { status: "ok", buckets: [{ id: "B2", counts: { locked: 1, core_total: 5 } }],
        haves: ["2-rag: locked 1/5 · cold re-proof 1/1 · Re-Jirah rounds sat 1/1 (capsule reJirahDone)",
          "skills: 1/3 with reps — anthropic_api 🔴 learning"] } });
    assert("SEASON.md: the benchmark's HAVE lines enter the logbook whole — the credit column (cold re-proof, skills with reps), which lived on no surface at all",
      /- benchmark have: 2-rag: locked 1\/5 · cold re-proof 1\/1 · Re-Jirah rounds sat 1\/1 \(capsule reJirahDone\) · skills: 1\/3 with reps — anthropic_api 🔴 learning/.test(mdHaves));
    assert("SEASON.md: a benchmark with no haves[] writes no have row (absence, not a zero)",
      !/benchmark have/.test(renderSeasonMd({ season: s3r, lockedCount: 4, python: null, now: new Date(2026, 7, 12),
        benchmark: { status: "ok", buckets: [], regressions: [] } })));
    assert("SEASON.md: a benchmark with no needs[] writes no need row (absence, not a zero)",
      !/benchmark need/.test(renderSeasonMd({ season: s3r, lockedCount: 4, python: null, now: new Date(2026, 7, 12),
        benchmark: { status: "ok", buckets: [], regressions: [] } })));
    assert("NO SHAME LAW on the logbook — no failure/broken-streak words, MISS renders a neutral dot",
      !/fail|failure|broke|shame/i.test(mdSeason));
    assert("NO-COUNTDOWN LAW on the logbook — no deadline/days-left language",
      !/deadline|days left|due by|countdown/i.test(mdSeason));
    const mdEmpty = renderSeasonMd({ season: null, lockedCount: null, python: null, benchmark: null, now: new Date(2026, 7, 8) });
    assert("SEASON.md: empty season renders the honest scaffold (starts when he plays, not a date)",
      /no matchday closed yet/.test(mdEmpty) && /starts when he plays/.test(mdEmpty) && /khaali — pehla full-time/.test(mdEmpty));
    assert("SEASON.md: he writes ZERO — the file says who writes it",
      /machine-written 100% by postmatch\.mjs/.test(mdSeason));

    // DEAD-WIRE SWEEP (10 Aug 2026) — THE VANISHING CAPSULE reaches the logbook.
    // Off DISK through the real gatherSeasonExtras, because that is where the wire is:
    // a fixture handed to renderSeasonMd proves only that the renderer can print a note
    // somebody else computed. Delete the lockedNote lines and both halves fail.
    {
      const tmp = mkdtempSync(join(tmpdir(), "arsenal-postmatch-cap-"));
      try {
        const capMap = (extra) => JSON.stringify({ date: "2026-08-09", status: "ok",
          concepts: [{ concept: "tokenization", locked_on: "2026-06-15" }, { concept: "inference", locked_on: "2026-06-24" }], ...extra });
        writeFileSync(join(tmp, "capsule_map.json"), capMap({ capsules_complete: false, blocking_faults: ["capsules/embeddings.json"] }));
        const short = gatherSeasonExtras(new Date(2026, 7, 12), tmp);
        const mdShort = renderSeasonMd(short);
        assert("SEASON.md: an INCOMPLETE capsule_map never writes a bare locked count into the permanent logbook",
          short.lockedNote !== null
          && /- capsules locked: 2 ⚠ as of 2026-08-09 — capsule_map incomplete: capsules\/embeddings\.json unreadable, owner mirror\.mjs/.test(mdShort));
        writeFileSync(join(tmp, "capsule_map.json"), capMap({ capsules_complete: true }));
        const whole = gatherSeasonExtras(new Date(2026, 7, 12), tmp);
        assert("SEASON.md: a COMPLETE capsule_map writes the row exactly as before (no noise on the healthy path)",
          whole.lockedNote === null && /- capsules locked: 2\n/.test(renderSeasonMd(whole)));
      } finally { rmSync(tmp, { recursive: true, force: true }); }
    }
  }

  // ── mclose (rows 873 (2) / 877 F1-F3 / 891) — THE DAY CLOSES ITSELF: the machine half, pure and in-memory ──
  {
    const SID = "5d17150f-fc93-44f8-b209-2a8dafc64ddd";
    const tt = { turns: 3, last_ts: "2026-11-13T09:17:57.037Z", outside: 5, per_session: { [SID]: 3 } };
    const ev = { sessions: [{ id: SID, sources: ["teaching_audit", "sitting"] }], misses: [{ session: "x", source: "transcript", why: "transcript absent (p)" }],
      read: { teaching_audit: "3 study row(s)", sitting: "sit_x · host bound", transcript: "1 archive-named session(s)" } };
    const recWith = (judgeLine, compileLine = "COMPILE: DONE · notes_compiler: 2026-11-13 IST · compiled 1") => renderMachineRecord({ day: "2026-11-13", anchor: "evening",
      at: "2026-11-13T16:57:00.000Z", ev, tt, archiveLine: "caught up", compileLine, judgeLine });
    const rec = recWith("JUDGE: NOT DUE · gaffer_brain: not due (day.close) — the newest unjudged capture is 5 min old (< 20) — the round may still be live");
    const settledRec = recWith("JUDGE: SETTLED · banked · gaffer_brain: 1 item(s) graded in ONE Opus call · types: doubt_quality");
    assert("AUTOCLOSE (F1) — the machine record NAMES his two lines absent: daily_green's RESULT regex and KAL_RE (manager.mjs's parser) both find NOTHING, so rung 8 stays RED by its own code",
      /^RESULT: absent \(his word not given; the day closed itself\)$/m.test(rec) && /^KAL-LINE: absent$/m.test(rec) && hisResultOf(rec) === null && !KAL_RE.test(rec)
      && /^CLOSED-BY: code · evening anchor · 2026-11-13T16:57:00\.000Z$/m.test(rec));
    const p = parseMachineRecord(rec);
    assert("AUTOCLOSE — the record reads back: anchor, turns, turns_until, the compile DONE, the judge NOT DUE = UNSETTLED (row 891 (1): the next anchor runs the judge again)",
      !!p && p.anchor === "evening" && p.turns === 3 && p.turns_until === tt.last_ts && p.compile_done === true && p.judge_settled === false && parseMachineRecord(settledRec).judge_settled === true);
    assert("AUTOCLOSE — the judge line: banked and nothing-outstanding are SETTLED; not due inside the idle definition, a dead lane, an undeclared door, a partial round are UNSETTLED",
      /^JUDGE: SETTLED · banked/.test(judgeLineOf({ status: 0, stdout: "gaffer_brain: 1 item(s) graded in ONE Opus call · types: doubt_quality\n" }))
      && /^JUDGE: SETTLED · nothing outstanding/.test(judgeLineOf({ status: 0, stdout: "gaffer_brain: not due (day.close) — nothing outstanding — every captured item is already judged\n" }))
      && /^JUDGE: NOT DUE/.test(judgeLineOf({ status: 0, stdout: "gaffer_brain: not due (day.close) — the newest unjudged capture is 5 min old (< 20) — the round may still be live\n" }))
      && /^JUDGE: NOT BANKED/.test(judgeLineOf({ status: 1, stdout: "gaffer_brain: the judge lane did not answer (x) — the round STAYS in the queue and nothing was invented. Run judge-round again.\n" }))
      && /^JUDGE: NOT BANKED/.test(judgeLineOf({ status: 1, stdout: "gaffer_brain: \"day.close\" is not a declared code trigger (sitting.close | pacer) — an undeclared door mints no stamp\n" }))
      && /^JUDGE: NOT BANKED · partly/.test(judgeLineOf({ status: 0, stdout: "gaffer_brain: 1 item(s) graded in ONE Opus call · types: x · 1 still outstanding\n" })));
    assert("AUTOCLOSE — the compile line is DONE only when BOTH of the compiler's own runs (the --session seed, then fulltime) exit 0; anything else says NOTES NOT DONE",
      /^COMPILE: DONE/.test(compileLineOf({ status: 0, stdout: "notes_compiler: 2026-11-13 IST · compiled 1\n", sessions: 1 }, { status: 0, stdout: "notes_compiler: 2026-11-13 IST · compiled 0 · unchanged 1\n" }))
      && /^COMPILE: NOTES NOT DONE · fulltime exit 1/.test(compileLineOf({ status: 0, stdout: "", sessions: 1 }, { status: 1, stdout: "notes_compiler: x\n" }))
      && /^COMPILE: NOTES NOT DONE · compile --session did not finish/.test(compileLineOf({ status: null, signal: "SIGTERM", sessions: 1 }, null)));
    const TOK = `2026-11-13|${new Date().toISOString()}`;
    assert("AUTOCLOSE — the chain's day comes off ITS day-key token: `chain` = the token's day, `chain-1` = the slept day before it; a literal day is itself; no token = REFUSED by name, never now()",
      resolveAutocloseDay("chain", { env: { ARSENAL_DAY_KEY: TOK } }).day === "2026-11-13" && resolveAutocloseDay("chain-1", { env: { ARSENAL_DAY_KEY: TOK } }).day === "2026-11-12"
      && resolveAutocloseDay("2026-10-18", { env: {} }).day === "2026-10-18" && /no chain day-key token/.test(resolveAutocloseDay("chain", { env: {} }).error || "")
      && !!resolveAutocloseDay("tomorrow", { env: {} }).error);
    const T0 = "2026-11-13T16:20:00.000Z";
    const inside = autocloseClock({ env: { [AUTOCLOSE_CLOCK_ENV]: T0 }, here: join(tmpdir(), "mclose-copy", "scripts"), now: () => new Date(0) });
    const outside = autocloseClock({ env: { [AUTOCLOSE_CLOCK_ENV]: T0 }, here: resolve(tmpdir(), "..", `not-tmp-${process.pid}`, "scripts"), now: () => new Date(0) });
    assert("AUTOCLOSE (F3) — THE CLOCK DOOR, planted both ways: honoured for a copy under os.tmpdir(); a tree outside it runs on the real clock and SAYS the door was refused; no door, no line",
      inside.at.toISOString() === T0 && /honoured/.test(inside.door || "") && outside.at.getTime() === 0 && /REFUSED/.test(outside.door || "")
      && autocloseClock({ env: {}, now: () => new Date(0) }).door === null);
    // row 914 G-n (b): THE DEADLINE — the budget summed from its owners, the deadline door planted both ways, the unreached named
    assert("AUTOCLOSE (row 914 G) — THE BUDGET IS SUMMED IN CODE: one reader budget + one judge budget + one child budget per child (archive · compile · card), each read from its owner",
      autocloseBudget() === READER_BUDGET_MS + JUDGE_BUDGET_MS + AUTOCLOSE_CHILDREN.length * CHILD_TIMEOUT_MS && AUTOCLOSE_CHILDREN.join() === "archive,compile,card");
    const atD = new Date(T0), D1 = "2026-11-13T17:00:00.000Z";
    const dIn = autocloseDeadline({ at: atD, env: { [AUTOCLOSE_DEADLINE_ENV]: D1 }, here: join(tmpdir(), "mclose-copy", "scripts"), uptimeS: 0 });
    const dOut = autocloseDeadline({ at: atD, env: { [AUTOCLOSE_DEADLINE_ENV]: D1 }, here: resolve(tmpdir(), "..", `not-tmp-${process.pid}`, "scripts"), uptimeS: 0 });
    assert("AUTOCLOSE (row 914 G) — THE DEADLINE DOOR, planted both ways: honoured for a copy under os.tmpdir(); outside it the boot instant plus the summed budget stands and the refusal is said",
      dIn.ms === Date.parse(D1) && /honoured/.test(dIn.door || "") && dOut.ms === atD.getTime() + autocloseBudget() && /REFUSED/.test(dOut.door || "")
      && autocloseDeadline({ at: atD, env: {}, uptimeS: 2 }).ms === atD.getTime() - 2000 + autocloseBudget());
    // row 932 (lane M's m914c diagnosis): every value the close hands to spawn is a safe positive integer, planted with a FRACTIONAL
    // uptime (the kind process.uptime() returns), so this selftest alone catches the fraction that killed the build witness
    {
      const dlF = autocloseDeadline({ at: atD, env: {}, uptimeS: 0.0829779 });
      const tm = closeTimer({ at: atD, dlMs: dlF.ms, realNow: () => 0 });
      const vals = [[CHILD_TIMEOUT_MS + READER_BUDGET_MS + JUDGE_CHILD_MS + CHILD_TIMEOUT_MS, READER_BUDGET_MS + JUDGE_CHILD_MS + CHILD_TIMEOUT_MS],
        [READER_BUDGET_MS + JUDGE_CHILD_MS + CHILD_TIMEOUT_MS, JUDGE_CHILD_MS + CHILD_TIMEOUT_MS], [JUDGE_CHILD_MS + CHILD_TIMEOUT_MS, CHILD_TIMEOUT_MS]]
        .map(([need, reserve]) => { const f = tm.fits(need); return f.ok ? tm.spawnMs(f, reserve) : { ok: false, ms: null }; });
      assert("AUTOCLOSE (row 932) — THE SPAWN VALUE: under a fractional uptime the compile's seed, fulltime and the judge each get a safe positive whole number of ms; a fraction, zero or a negative starts nothing and says so; the one clock reads the step's instant",
        vals.every((v) => v.ok && Number.isSafeInteger(v.ms) && v.ms > 0)
        && tm.spawnMs({ left: 1000.5 }, 0).ok === false && tm.spawnMs({ left: 0 }, 0).ok === false && tm.spawnMs({ left: 5 }, 10).ok === false
        && /^not started · /.test(tm.spawnMs({ left: 1000.5 }, 0).line) && tm.stepNow() === atD.getTime());
    }
    // unit mtail F-B — the judge child's wait is its budget PLUS its dispatch margin (both imported), the close's budget unmoved
    {
      const ownB = readFileSync(fileURLToPath(import.meta.url), "utf8").replace(/\r\n/g, "\n"), a0 = ownB.indexOf("const judgeRun = () => {"), jr = a0 < 0 ? "" : ownB.slice(a0, ownB.indexOf("\n  };\n", a0));
      const tmJ = closeTimer({ at: atD, dlMs: atD.getTime() + JUDGE_CHILD_MS + CHILD_TIMEOUT_MS, realNow: () => 0 });
      const fJ = tmJ.fits(JUDGE_CHILD_MS + CHILD_TIMEOUT_MS), sJ = fJ.ok ? tmJ.spawnMs(fJ, CHILD_TIMEOUT_MS) : { ok: false, ms: 0 };
      const short = closeTimer({ at: atD, dlMs: atD.getTime() + JUDGE_BUDGET_MS + CHILD_TIMEOUT_MS, realNow: () => 0 }).fits(JUDGE_CHILD_MS + CHILD_TIMEOUT_MS);
      assert("mtail F-B — the judge-due child waits AT LEAST JUDGE_BUDGET_MS + JUDGE_DISPATCH_MS (both from gaffer_brain.mjs, none typed); a close with only the old budget left does not start it (UNSETTLED, retried); every judge reserve of the close is that value; the close's own budget does not move",
        JUDGE_CHILD_MS === JUDGE_BUDGET_MS + JUDGE_DISPATCH_MS && JUDGE_DISPATCH_MS > 0 && sJ.ok && sJ.ms >= JUDGE_BUDGET_MS + JUDGE_DISPATCH_MS
        && short.ok === false && /fits\(JUDGE_CHILD_MS \+ CHILD_TIMEOUT_MS\)/.test(jr) && /run\("gaffer_brain\.mjs", \["judge-due"[^\n]*timeout: s\.ms/.test(jr)
        && !/JUDGE_BUDGET_MS/.test(ownB.slice(ownB.indexOf("const compileRun = () => {"), ownB.indexOf("const shortJudge = ")))
        && autocloseBudget() === READER_BUDGET_MS + JUDGE_BUDGET_MS + AUTOCLOSE_CHILDREN.length * CHILD_TIMEOUT_MS);
    }
    assert("AUTOCLOSE (row 914 G6) — notes the deadline did not reach make the compile line UNSETTLED by count, never DONE",
      /^COMPILE: UNSETTLED · 1 note\(s\) not reached by the deadline/.test(compileLineOf({ status: 0, stdout: "notes_compiler: x\n", sessions: 1 }, { status: 1, stdout: "notes_compiler: 2026-11-13 IST · compiled 0 (0 superseding) · unchanged 2 · refused 0 · gate 1 pass / 0 fail / 0 absent (named) / 0 not run (reader stub) · names guard OFF · 1 note(s) not reached by the deadline\n" })));
    {
      const own = readFileSync(fileURLToPath(import.meta.url), "utf8").replace(/\r\n/g, "\n"), a0 = own.indexOf("async function autoclose("), body = a0 < 0 ? "" : own.slice(a0, own.indexOf("\n}\n", a0));
      assert("AUTOCLOSE (row 914 G5) — no child of the close carries a typed 20-minute timeout: each starts on the deadline's time left",
        !!body && !/20\s*\*\s*60000/.test(body) && /timeout: s\.ms/.test(body));
    }
    const last = "2026-11-13T16:00:00.000Z", plus = (m) => new Date(Date.parse(last) + m * 60000);
    assert("AUTOCLOSE (F3) — THE QUIET RULE: an EVENING close 29 min after the last study turn is DEFERRED, at 31 min it closes; the MORNING never defers",
      quietVerdict({ anchor: "evening", lastTs: last, at: plus(29) }).defer === true && quietVerdict({ anchor: "evening", lastTs: last, at: plus(31) }).defer === false
      && quietVerdict({ anchor: "morning", lastTs: last, at: plus(1) }).defer === false && quietVerdict({ anchor: "evening", lastTs: last, at: plus(29) }).age_min === 29);
    const his = renderPostMatch({ hit: "HIT", signal: "s", kal: "kal axis b pehle", diag: null, disclosures: [], twinVoice: null, pendingBalls: [], matchday: 9, dateStr: "2026-11-13" });
    const up = his + keptBlock(machineBlockOf(rec));
    assert("--hit UPGRADE (row 873 (3)) — a MACHINE record lets his close through: HIS RESULT + KAL on top (the first legal RESULT and KAL_RE read HIS), the machine record byte-for-byte below MACHINE CLOSE (kept, L9)",
      machineBlockOf(rec) === rec && up.startsWith(his) && up.endsWith(`\n${MACHINE_KEPT}\n${rec}`) && hisResultOf(up) === "HIT" && up.match(KAL_RE)[1].includes("kal axis b pehle")
      && parseMachineRecord(up) === null && machineBlockOf(up) === rec && machineBlockOf(his) === null && machineBlockOf(null) === null);
    assert("AUTOCLOSE (iv) — IDEMPOTENT BY DAY: HIS result is never touched; a current SETTLED record is nothing new; a current UNSETTLED one re-runs ONLY its unfinished step; a newer study turn refreshes it; a hand's file is never overwritten",
      autocloseDecision(up, tt.last_ts).act === "his" && autocloseDecision(null, tt.last_ts).act === "write" && autocloseDecision(settledRec, tt.last_ts).act === "nothing-new"
      && autocloseDecision(rec, tt.last_ts).act === "unsettled" && autocloseDecision(rec, tt.last_ts).redo.join() === "judge"
      && autocloseDecision(recWith(PENDING_JUDGE, PENDING_COMPILE), tt.last_ts).redo.join() === "compile,judge"
      && autocloseDecision(settledRec, "2026-11-13T23:00:00.000Z").act === "refresh" && autocloseDecision("a note of his, no result line\n", tt.last_ts).act === "foreign");
    const src = readFileSync(fileURLToPath(import.meta.url), "utf8").replace(/\r\n/g, "\n"), at0 = src.indexOf("async function autoclose(");
    const body = at0 > 0 ? src.slice(at0, src.indexOf("\n}\n", at0)) : "";
    assert("AUTOCLOSE (F2) — its body never writes season.json, notebook.json, routed_balls.json or SEASON.md and never arms a brain trigger (the evening voice rides HIS close)",
      body.length > 2000 && /writeAtomic\(pmFile/.test(body) && !/writeAtomic\((SEASON|NOTEBOOK|ROUTED|SEASON_MD)\b/.test(body) && !/["/\\]brain\.mjs"/.test(body) && !/"trigger"/.test(body));
  }

  // ── mcard (rows 913 (2) / 915 (3)) — THE DAY-CLOSE CARD NAMES EVERY OPEN DAY: pure, and on a temp post_match dir ──
  {
    const CC = await import("./captains_call.mjs");   // the deck's OWN bound and target rule, never a copy of them
    const B = CC.CARD_LINE_BOUND;
    const BASE_LINE = "2026-11-13: the day closed itself — your HIT/MISS and tomorrow's line, if you want (/full-time)";
    assert("mcard — ONE open day is the line step (viii) has always filed, byte for byte (and the `file` call still files it)",
      dayCloseLine(["2026-11-13"], B) === BASE_LINE && dayClosedLine("2026-11-13") === BASE_LINE);
    assert("mcard — more open days are ALL named, oldest first and once each, in one line inside the deck's bound",
      dayCloseLine(["2026-11-14", "2026-11-13", "2026-11-14"], B) === "2026-11-13, 2026-11-14: the days closed themselves — your HIT/MISS and tomorrow's line, if you want (/full-time)");
    const daysFrom = (d0, n) => Array.from({ length: n }, (_, i) => addDays(d0, i));
    const fitOk = (n) => {
      const ds = daysFrom("2026-11-13", n), l = dayCloseLine([...ds].reverse(), B);
      const named = (String(l).match(/\d{4}-\d{2}-\d{2}/g) || []), more = Number((/ \+(\d+) more:/.exec(String(l)) || [])[1] || 0);
      return !!l && l.length <= B && named.join() === ds.slice(0, named.length).join() && named.length + more === n && (more === 0) === (named.length === n);
    };
    assert("mcard — when they do not fit, the OLDEST that fit are named and the rest COUNTED (named + counted = every open day), never over the bound, for 1 to 60 days",
      Array.from({ length: 60 }, (_, i) => fitOk(i + 1)).every(Boolean) && /^2026-11-13, 2026-11-14, 2026-11-15 \+3 more: /.test(dayCloseLine(daysFrom("2026-11-13", 6), B) || ""));
    assert("mcard — nothing to name, or a bound that cannot hold one day, is null (the step then rewrites nothing)",
      dayCloseLine([], B) === null && dayCloseLine(["x"], B) === null && dayCloseLine(["2026-11-13"], 20) === null && dayCloseLine(["2026-11-13"], undefined) === null);
    const tmp = mkdtempSync(join(tmpdir(), "mcard-pm-"));
    try {
      const mrec = (d) => renderMachineRecord({ day: d, anchor: "evening", at: `${d}T17:27:00.000Z`, ev: { sessions: [], misses: [], read: {} },
        tt: { turns: 1, last_ts: `${d}T10:00:00.000Z`, outside: 0, per_session: {} }, archiveLine: "caught up", compileLine: "COMPILE: DONE · x", judgeLine: "JUDGE: SETTLED · x" });
      const hisOn = (d) => renderPostMatch({ hit: "HIT", signal: "s", kal: "k", diag: null, disclosures: [], twinVoice: null, pendingBalls: [], matchday: 1, dateStr: d }) + keptBlock(mrec(d));
      writeFileSync(join(tmp, "2026-11-12.md"), mrec("2026-11-12"));   // before the window
      writeFileSync(join(tmp, "2026-11-13.md"), mrec("2026-11-13"));   // open
      writeFileSync(join(tmp, "2026-11-14.md"), hisOn("2026-11-14"));  // his full time on top of the machine record — his day
      writeFileSync(join(tmp, "2026-11-15.md"), mrec("2026-11-15"));   // open (closed in the morning or the evening alike)
      writeFileSync(join(tmp, "2026-11-16.md"), "a note of his, no result line\n");   // a hand's file — not a close at all
      writeFileSync(join(tmp, "2026-11-17.md"), renderPostMatch({ hit: "MISS", signal: "s", kal: null, diag: "start", disclosures: [], twinVoice: null, pendingBalls: [], matchday: 1, dateStr: "2026-11-17" }));
      writeFileSync(join(tmp, "notes.md"), mrec("2026-11-15"));
      const o = openDaysOf("2026-11-13", "2026-11-18", { dir: tmp }), rev = openDaysOf("2026-11-18", "2026-11-13", { dir: tmp });
      assert("mcard — an OPEN day is a machine record with no result of his, from the kept card's own day on: his close on top, a hand's file, his own close and a day before the window are not",
        o.days.join() === "2026-11-13,2026-11-15" && rev.days.join() === o.days.join() && o.unreadable.length === 0
        && openDaysOf("2026-11-12", "2026-11-12", { dir: tmp }).days.join() === "2026-11-12" && openDaysOf("nope", "2026-11-13", { dir: tmp }).days.length === 0
        && openDaysOf("2026-11-13", "2026-11-18", { dir: join(tmp, "absent") }).days.length === 0);
    } finally { rmSync(tmp, { recursive: true, force: true }); }
    const keptCard = { id: "c7", key: "dayclose:2026-11-13", source: "hand-filed", line: BASE_LINE, answer: null, retired_at: null, dealt: [] };
    assert("mcard — KEPT is the deck's own rule (captains_call relineTarget): the live day-close card is found; an answered one and another family's are not",
      CC.relineTarget([keptCard, { ...keptCard, id: "c3", key: "canon:OPS_STATE.md:2026-11-13" }], { family: DAYCLOSE_FAMILY }).card.id === "c7"
      && !CC.relineTarget([{ ...keptCard, answer: "haan", retired_at: "2026-11-14T03:00:00.000Z" }], { family: DAYCLOSE_FAMILY }).card
      && !CC.relineTarget([{ ...keptCard, key: "canon:OPS_STATE.md:2026-11-13" }], { family: DAYCLOSE_FAMILY }).card
      && dayCloseLine(["2026-11-13", "2026-11-14"], B).length <= B && !CC.relineCard({ cards: [keptCard] }, { family: DAYCLOSE_FAMILY, line: dayCloseLine(["2026-11-13", "2026-11-14"], B) }).refuse);
    const own = readFileSync(fileURLToPath(import.meta.url), "utf8").replace(/\r\n/g, "\n");
    const a0 = own.indexOf("async function autoclose("), ac = a0 < 0 ? "" : own.slice(a0, own.indexOf("\n}\n", a0));
    const d0 = own.indexOf("async function dayCloseCard("), dc = d0 < 0 ? "" : own.slice(d0, own.indexOf("\n}\n", d0));
    assert("mcard — step (viii) reaches the card ONLY on the evening path and the close anchor (unit mday F3 A: `day.mjs end`) — the morning files none and rewrites nothing — through ONE call",
      /else if \(CARD_ANCHORS\.includes\(anchor\)\) card = await dayCloseCard\(\{ day, run \}\);/.test(ac) && CARD_ANCHORS.join() === "evening,close" && (ac.match(/dayCloseCard\(/g) || []).length === 1
      && /let card = "no card \(the morning anchor files none\)";/.test(ac) && !/"reline"|"file", "--line"/.test(ac));
    assert("mcard — the card step writes the deck only through captains_call.mjs's OWN CLI: the door with family + kept key, else `file` with the rolling key and its reason, as before",
      dc.length > 0 && /run\("captains_call\.mjs", \["reline", "--family", DAYCLOSE_FAMILY, "--key", kept\.key, "--line", line\]/.test(dc)
      && /run\("captains_call\.mjs", \["file", "--line", dayClosedLine\(day\), "--key", `\$\{DAYCLOSE_FAMILY\}:\$\{day\}`, "--why-code-cannot-decide", DAYCLOSE_WHY\]/.test(dc)
      && !/writeAtomic|writeFileSync|captains_call\.json/.test(dc) && `${DAYCLOSE_FAMILY}:2026-11-13` === keptCard.key);
  }

  // ── mpm F5 · an outstanding capture of D is evidence for the close of D ──
  {
    const fnOf = (text, head) => { const t = String(text).replace(/\r\n/g, "\n"), i = t.indexOf(head); return i < 0 ? "" : t.slice(i, t.indexOf("\n}\n", i) + 2); };
    const own = readFileSync(fileURLToPath(import.meta.url), "utf8");
    const gb = readFileSync(join(__dirname, "gaffer_brain.mjs"), "utf8");
    const gbMod = await import("./gaffer_brain.mjs");
    const codeOf = (t) => String(t).replace(/\r\n/g, "\n").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    // unit mtail (mpm F1) — the pin is replaced: the function this file uses IS the owner's (one object), it has no definition
    // here, and no copy of the IST helper is left in this file's code.
    assert("mpm F5 · mtail F1 — THE mjday RULE HAS ONE HOME: the captureDay this file uses IS gaffer_brain.mjs's exported one (imported, the same function); this file defines none and carries no copy of the IST helper",
      typeof gbMod.captureDay === "function" && captureDay === gbMod.captureDay && fnOf(gb, "export function captureDay(it) {").length > 0
      && !/^\s*(?:export\s+)?(?:async\s+)?function\s+captureDay\s*\(/m.test(codeOf(own)) && !/5\.5 \* 3600000\)\.toISOString\(\)\.slice\(0, 10\)/.test(codeOf(own))
      && /import \{[^}]*\bcaptureDay\b[^}]*\} from "\.\/gaffer_brain\.mjs";/.test(own)
      && istDayOf(new Date("2026-11-14T20:00:00.000Z")) === "2026-11-15" && istDayOf(new Date("2026-11-14T18:00:00.000Z")) === "2026-11-14");
    const D = "2026-11-14";
    const rows = [
      { kind: "capture", id: "g-a", ts: "2026-11-13T20:00:00.000Z" },   // 01:30 IST on D — D's, though its UTC date is D-1
      { kind: "capture", id: "g-b", ts: "2026-11-14T19:00:00.000Z" },   // 00:30 IST on D+1 — not D's, though its UTC date is D
      { kind: "capture", id: "g-c", day: D },                            // no instant: the day it carries
      { kind: "capture", id: "g-d" },                                    // neither: no day, claims none
      { kind: "settled", id: "s-x", of: "g-z" },                         // not a capture
    ];
    const q = queueEvidenceOf(D, rows), none = queueEvidenceOf("2026-11-16", rows);
    assert("mpm F5 — queueEvidenceOf counts each capture by ITS OWN IST day: 01:30 IST in, 00:30 IST next day out, a carried day in, a dayless one and a settled row never",
      q.count === 2 && q.ids.join() === "g-a,g-c" && q.last_ts === "2026-11-13T20:00:00.000Z"
      && none.count === 0 && none.last_ts === null && queueEvidenceOf(D, null).count === 0
      && queueEvidenceOf(D, [{ kind: "capture", id: "g-c", day: D }]).last_ts === "2026-11-13T18:30:00.000Z");
    const a0 = own.replace(/\r\n/g, "\n").indexOf("async function autoclose("), ac = fnOf(own, "async function autoclose(");
    assert("mpm F5 — the gate reads the queue only when the archive's study turns are absent, through the owner's own reader, and a queue-only day spawns no compile",
      a0 > 0 && /const queue = studySeen \? null : queueEvidenceOf\(day, outstandingBank\(\)\);/.test(ac)
      && /if \(!studySeen && !queueOnly\) \{/.test(ac) && /if \(queueOnly\) return queueCompileLine\(day, queue\);/.test(ac)
      && parseMachineRecord(renderMachineRecord({ day: D, anchor: "morning", at: "2026-11-15T01:35:00.000Z",
        ev: { sessions: [], misses: [], read: {} }, tt: { turns: 0, last_ts: q.last_ts, outside: 0, per_session: {} }, archiveLine: "caught up",
        compileLine: queueCompileLine(D, q), judgeLine: "JUDGE: SETTLED · x", queueLine: queueEvidenceLine(D, q) })).compile_done === true);
  }

  // ── mpast (A1 + B1, forks rows 956 (3) / 1015 (2)-(4)) — his full-time line for a past day the card names ──
  {
    const mrec = (d) => renderMachineRecord({ day: d, anchor: "morning", at: `${d}T02:00:00.000Z`, ev: { sessions: [], misses: [], read: {} },
      tt: { turns: 1, last_ts: `${d}T10:00:00.000Z`, outside: 0, per_session: {} }, archiveLine: "caught up", compileLine: "COMPILE: DONE · x", judgeLine: "JUDGE: SETTLED · x" });
    const abs = absenceLine("his full time on 2026-11-14", "2026-11-15T12:00:00.000Z");
    const closedRec = `${mrec("2026-11-13")}${abs}\n`;
    assert("mpast — THE ABSENCE LINE reads as absence, never as his word: no legal RESULT (daily_green's reading), no KAL_RE match, and the record it closes is no longer open, never re-closed by code",
      abs.startsWith("NO LINE OF HIS for this day — closed by his full time on 2026-11-14 at ") && hisResultOf(closedRec) === null && !KAL_RE.test(closedRec)
      && !/^RESULT:\s*(HIT|MISS|PARTIAL|LOAD-MANAGED)/m.test(closedRec) && parseMachineRecord(mrec("2026-11-13")) !== null && parseMachineRecord(closedRec) === null
      && autocloseDecision(closedRec, "2026-11-13T10:00:00.000Z").act === "decided" && machineBlockOf(closedRec) === null);
    const s0 = { season_day: 2, matches_played: 1, rows: [{ date: "2026-11-10", result: "HIT" }, { date: "2026-11-14", result: "MISS" }] };
    const s1 = updateSeason(s0, "HIT", "2026-11-12", {}), s2 = updateSeason(s0, "HIT", "2026-11-15", {});
    assert("mpast — season.json's row is INSERTED BY DATE (the streak reads days, never close order); a newest day still appends, and last_played is the newest day",
      s1.rows.map((r) => r.date).join() === "2026-11-10,2026-11-12,2026-11-14" && seasonStreak(s1.rows) === 0 && s1.last_played === "2026-11-14" && s1.matches_played === 2
      && s2.rows.map((r) => r.date).join() === "2026-11-10,2026-11-14,2026-11-15" && seasonStreak(s2.rows) === 1 && s2.last_played === "2026-11-15");
    assert("mpast — the KAL-line is asked only when the closed day is yesterday or today",
      kalAsked("2026-11-15", "2026-11-15") && kalAsked("2026-11-14", "2026-11-15") && !kalAsked("2026-11-13", "2026-11-15"));
    assert("mpast — a real day only: malformed or impossible dates are not days",
      isRealDay("2026-11-15") && !isRealDay("2026-11-31") && !isRealDay("2026-1-5") && !isRealDay("") && !isRealDay("2026-11-15x"));
    const tmp = mkdtempSync(join(tmpdir(), "mpast-pm-"));
    try {
      for (const d of ["2026-11-12", "2026-11-13", "2026-11-14", "2026-11-16", "2026-11-17"]) writeFileSync(join(tmp, `${d}.md`), mrec(d));
      writeFileSync(join(tmp, "2026-11-15.md"), closedRec.replace(/2026-11-13/g, "2026-11-15"));
      const card = (line, extra = {}) => ({ id: "c9", key: "dayclose:2026-11-12", source: "hand-filed", line, ...extra });
      const nd1 = namedDaysOf(card("2026-11-12, 2026-11-13: the days closed themselves — x"), { upto: "2026-11-17", dir: tmp });
      const nd2 = namedDaysOf(card("2026-11-12, 2026-11-13 +2 more: the days closed themselves — x"), { upto: "2026-11-17", dir: tmp });
      assert("mpast — a card's NAMED days are the days its line spells plus its `+k more` counted open days after them, only those still open",
        nd1.join() === "2026-11-12,2026-11-13" && nd2.join() === "2026-11-12,2026-11-13,2026-11-14,2026-11-16"
        && namedDaysOf(card("2026-11-15: the day closed itself — x"), { upto: "2026-11-17", dir: tmp }).length === 0 && namedDaysOf(card("no dates"), { upto: "2026-11-17", dir: tmp }).length === 0);
      const before = readFileSync(join(tmp, "2026-11-12.md"), "utf8");
      const miss = appendAbsence("2026-11-12", abs, { dir: tmp }), after = readFileSync(join(tmp, "2026-11-12.md"), "utf8");
      assert("mpast — appendAbsence adds exactly ONE line below the machine record's bytes (L9), and a closed day is never written twice",
        miss === null && after === `${before}${abs}\n` && appendAbsence("2026-11-12", abs, { dir: tmp }) === "2026-11-12 not open — untouched" && readFileSync(join(tmp, "2026-11-12.md"), "utf8") === after);
      const na = settleNaCard(card("2026-11-13, 2026-11-14: the days closed themselves — x", { answer: "na", answered_at: "2026-11-17T03:00:00.000Z" }), { dir: tmp });
      const baad = settleNaCard(card("2026-11-16: the day closed itself — x", { answer: null, sleep_until: "2026-11-18" }), { dir: tmp });
      assert("mpast — na closes every day the card named by the recorded absence (its own wording); baad closes nothing",
        na.closed.join() === "2026-11-13,2026-11-14" && /^NO LINE OF HIS for this day — closed by his na on the day-close card c9 at 2026-11-17T03:00:00\.000Z/m.test(readFileSync(join(tmp, "2026-11-14.md"), "utf8"))
        && baad.closed.length === 0 && parseMachineRecord(readFileSync(join(tmp, "2026-11-16.md"), "utf8")) !== null);
    } finally { rmSync(tmp, { recursive: true, force: true }); }
    const own = readFileSync(fileURLToPath(import.meta.url), "utf8").replace(/\r\n/g, "\n");
    const m0 = own.lastIndexOf("async function main("), mn = m0 < 0 ? "" : own.slice(m0, own.indexOf("\n}\n", m0));
    assert("mpast — main's --date refusals come BEFORE any write, each by name, and the double-click guard reads the day closed (dateStr), never the clock's today",
      /if \(!isRealDay\(dateStr\)\) refuse\(/.test(mn) && /if \(dateStr > today\) refuse\(/.test(mn) && /if \(t == null\) refuse\(/.test(mn) && /if \(hisResultOf\(t\)\) refuse\(/.test(mn)
      && mn.indexOf("refuse(") > 0 && mn.indexOf("refuse(") < mn.indexOf('writeAtomic(join(PM_DIR, dateStr + ".md"), md)') && /existsSync\(join\(PM_DIR, dateStr \+ "\.md"\)\) && !parseMachineRecord\(priorPm\)/.test(mn));
  }

  const passed = checks.every(c => c[1]);
  console.log(passed ? "\nALL CHECKS PASSED" : "\nSELFTEST FAILED");
  return passed;
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
function argOf(flag) {
  const i = process.argv.indexOf(flag);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : null;
}

async function promptIfTTY(question) {
  if (!process.stdin.isTTY) return null;
  const readline = await import("node:readline/promises");
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ans = await rl.question(question);
  rl.close();
  return ans.trim() || null;
}

async function main() {
  const mode = (process.argv[2] || "").toLowerCase();
  if (mode === "selftest") { process.exit((await selftest()) ? 0 : 1); }
  if (mode === "season") {
    // Regen the logbook WITHOUT closing a day — no ledger, no matchday, no
    // prompts. Honest on an empty season (the scaffold says so out loud).
    const md = renderSeasonMd(gatherSeasonExtras(new Date()));
    writeAtomic(SEASON_MD, md);
    console.log(`postmatch: SEASON.md regenerated → ${SEASON_MD}`);
    return;
  }
  if (mode === "interview") {
    // D14 (9 Aug 2026): the WAR-ROOM's missing lawful writer. scout.mjs reads
    // season.interview_dates but season.json's owner (this file) had no verb to
    // write them — the comment told the captain to hand-edit, against the
    // owners-only law. His word arrives as a date; this owner records it.
    const di = process.argv.indexOf("--date");
    const d = di > -1 ? String(process.argv[di + 1] || "") : "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) { console.error("postmatch: interview --date YYYY-MM-DD (add) · add --drop to remove that date"); process.exit(1); }
    const s = readJson(SEASON) || {};
    const dates = new Set(Array.isArray(s.interview_dates) ? s.interview_dates : []);
    if (process.argv.includes("--drop")) dates.delete(d); else dates.add(d);
    s.interview_dates = [...dates].sort();
    writeAtomic(SEASON, s);
    console.log(`postmatch: interview_dates = [${s.interview_dates.join(", ")}] — scout's war-room reads this (taper window, no countdown at him)`);
    return;
  }
  if (mode === "route") {
    // routing WITHOUT re-running the evening ledger (the Dugout's spoken gate
    // lands here; season/notebook untouched — no double matchday, ever)
    const rest = process.argv.slice(3);
    const which = !rest.length || rest[0].toLowerCase() === "all" ? "all" : "ids";
    const ledger = readRoutedLedger();
    // this verb exists ONLY to write the ledger; if it cannot write it safely it
    // must refuse, not "start fresh" and erase every routing decision he ever made.
    if (!ledger.readable) {
      console.error(`postmatch: routed_balls.json is present but unreadable — REFUSING to route. Writing now would replace the whole routing history with tonight's picks. Repair or move ${ROUTED}, then re-run.`);
      process.exit(1);
    }
    const routedIds = new Set(ledger.rows.map(r => r.id));
    const pending = pendingThrowIns(routedIds);
    const pick = pickBallsToRoute(pending, which, rest);
    if (!pick.length) { console.log("postmatch: no pending throw-ins to route"); return; }
    writeAtomic(ROUTED, { routed: ledger.rows.concat(pick.map(b => ({ id: b.id, routed_on: localDate(new Date()) }))) });
    console.log(`postmatch: routed ${pick.length} throw-in(s) [${pick.map(b => b.id).join(", ")}]`);
    return;
  }
  if (mode === "autoclose") {
    // THE DAY CLOSES ITSELF (mclose) — the conductor's dayclose steps; exitCode, never process.exit (see autoclose())
    process.exitCode = await autoclose(process.argv.slice(3));
    return;
  }
  const dry = process.argv.includes("--dry");
  // mpast: the close's clock is the step's clock door (autocloseClock: the real clock on his tree, always; an instant only for a
  // COPY under os.tmpdir(), the witness's) — so "today", "a future day" and "yesterday" are read off ONE clock
  const clock = autocloseClock();
  if (clock.door) console.error(`postmatch: clock door ${clock.door}`);
  const now = clock.at;
  const today = localDate(now);
  if (mode === "named") {
    // mpast A1 — READ-ONLY, for the full-time skill: the day his ONE line closes (the NEWEST open day the day-close card names),
    // the OLDER named days that close with no line of his, and whether the KAL-line is asked. Writes nothing.
    const n = await cardNamedOpen({ today });
    if (n.error) console.log(`postmatch named · the deck could not be read (${n.error}) · his full time closes today ${today} · KAL asked`);
    else if (!n.days.length) console.log(`postmatch named · no open day named by a day-close card${n.card ? ` (${n.card.id} ${n.how} names none still open)` : ""} · his full time closes today ${today} · KAL asked`);
    else {
      const newest = n.days[n.days.length - 1], older = n.days.slice(0, -1);
      console.log(`postmatch named · card ${n.card.id} (${n.how}) · his line closes ${newest} (--date ${newest}) · ${older.length ? `older, closed with no line of his: ${older.join(", ")}` : "no older named day"} · ${kalAsked(newest, today) ? "KAL asked" : `KAL not asked (${newest} is older than yesterday; an older day's KAL is read by nobody)`}`);
    }
    return;
  }
  // mpast A1 — `--date D`: his line closes D, the newest open day the card names. REFUSED by name, nothing written: a malformed
  // date, a future day, a day with no machine record, his own closed day (even with --force — the double-click guard is keyed
  // on the day closed, never on today), a day already closed by a recorded decision.
  const dateGiven = process.argv.includes("--date");
  const dateStr = dateGiven ? String(argOf("--date") || "") : today;
  if (dateGiven) {
    const refuse = (why) => { console.error(`postmatch: --date ${oneLine(dateStr, 20) || "(none)"} REFUSED — ${why} · nothing written`); process.exit(1); };
    if (!isRealDay(dateStr)) refuse("not a real YYYY-MM-DD day");
    if (dateStr > today) refuse(`a future day (today is ${today})`);
    const f = join(PM_DIR, dateStr + ".md");
    let t = null;
    try { t = existsSync(f) ? readFileSync(f, "utf8") : null; } catch (e) { refuse(`post_match/${dateStr}.md cannot be read (${(e && e.code) || "?"})`); }
    if (t == null) refuse(`no machine record for ${dateStr} (no post_match/${dateStr}.md) — only a day the code closed is his to close by date`);
    if (hisResultOf(t)) refuse(`${dateStr} is already closed by his own word (RESULT ${hisResultOf(t)})`);
    if (isAbsenceClosed(t)) refuse(`${dateStr} was closed by a recorded decision (no line of his) — never re-asked`);
    if (!parseMachineRecord(t)) refuse(`post_match/${dateStr}.md is not a machine record`);
  }

  // THE --hit UPGRADE (mclose · row 873 (3)): a day the MACHINE closed (autoclose) was never closed by HIM. His full time goes
  // through, writes his RESULT + KAL on top, and keeps the machine record byte-for-byte below MACHINE CLOSE (kept, L9); a
  // --force over his own upgraded close keeps it too. A file that cannot be read is never overwritten (the guard refuses).
  const priorPm = (() => { try { return existsSync(join(PM_DIR, dateStr + ".md")) ? readFileSync(join(PM_DIR, dateStr + ".md"), "utf8") : null; } catch { return null; } })();
  const machineKept = machineBlockOf(priorPm);
  // double-click guard: one full-time per day (a second click must never
  // double a matchday). --force is the deliberate override.
  if (!dry && !process.argv.includes("--force") && existsSync(join(PM_DIR, dateStr + ".md")) && !parseMachineRecord(priorPm)) {
    const s = readJson(SEASON) || {};
    console.log(`postmatch: today is already closed (Matchday ${s.matches_played ?? "?"}). Nothing written. (--force to redo, if you really mean it)`);
    return;
  }

  let hit = (argOf("--hit") || "").toUpperCase() || null;
  let signal = argOf("--signal");
  let kal = argOf("--kal");
  const diag = argOf("--diag");
  const route = (argOf("--route") || "").toLowerCase();

  // B1 (9 Aug 2026, launch worklist): this line used to default a declined or
  // non-TTY run to "HIT" — a fabricated result in the one field the whole season
  // logbook is built on, two lines above the audit-#82 comment that forbids
  // exactly this for kal. No answer = no result = refuse honestly.
  if (!hit) hit = ((await promptIfTTY("Result? HIT / MISS / PARTIAL / REST → ")) || "").toUpperCase() || null;
  if (!hit) { console.error("postmatch: no result given — pass --hit HIT|MISS|PARTIAL|REST (nothing recorded, nothing fabricated)"); process.exit(1); }
  if (!["HIT", "MISS", "PARTIAL", "REST"].includes(hit)) { console.log("postmatch: --hit must be HIT|MISS|PARTIAL|REST"); process.exit(1); }
  if (!signal) signal = await promptIfTTY("One signal worth naming (data, not verdict) → ");
  // audit #82: NO fabricated fallback here. If he declines, `kal` stays null and
  // renderPostMatch writes an honest "declined" marker instead of putting a canned
  // motivational sentence into the one slot that is supposed to be his own voice.
  // mpast: asked only when the closed day is yesterday or today (manager reads yesterday's file; an older day's KAL nobody reads)
  if (!kal && kalAsked(dateStr, today)) kal = (await promptIfTTY("KAL-LINE — tomorrow's pre-decided first move → ")) || null;

  const pulse = readJson(join(STATE_DIR, "pulse.json"));
  const drills = readJson(join(STATE_DIR, "drills.json"));
  const twin = readJson(join(STATE_DIR, "twin.json"));
  const disclosures = [
    ...((pulse && pulse.withheld_disclosures) || []),
    ...((drills && drills.withheld) || []),
  ];
  const ledger = readRoutedLedger();
  const routedIds = new Set(ledger.rows.map(r => r.id));
  // throw-ins + dugout notes ride the same routing gate (U4): notes he voiced
  // to the Gaffer surface here verbatim, keyed note:<ts> in routed_balls
  const pendingBalls = pendingThrowIns(routedIds, { dugoutSuffix: " 〔dugout〕" });
  // the close itself must NEVER be blocked by the routing lane (same law as the
  // SEASON.md render below) — so on a torn ledger the ritual runs, everything
  // shows as pending because we genuinely cannot know what was routed, and the
  // ledger write is skipped rather than rewritten from nothing.
  if (!ledger.readable) console.error(`postmatch: routed_balls.json unreadable — showing EVERY throw-in as pending (we cannot know what was routed) and writing NOTHING to ${ROUTED} tonight. Repair it before using --route.`);

  const season = readJson(SEASON);
  const matchday = ((season && season.matches_played) || 0) + 1;
  const md = renderPostMatch({ hit, signal, kal, diag, disclosures, twinVoice: twin && twin.voice, pendingBalls, matchday, dateStr }) + keptBlock(machineKept);

  if (dry) {
    console.log("--- DRY RUN (nothing written) ---\n" + md);
    return;
  }
  writeAtomic(join(PM_DIR, dateStr + ".md"), md);
  const newSeason = updateSeason(season, hit, dateStr, { kal, signal });
  writeAtomic(SEASON, newSeason);
  writeAtomic(NOTEBOOK, updateNotebook(readJson(NOTEBOOK), signal, hit, dateStr));
  // mpast A1 — every OLDER day the card named closes with ONE appended line recording the ABSENCE of his word (never a word of
  // his: no RESULT, no KAL, no season row). Only on a --date close: his line went to the newest named day.
  let olderNote = "";
  if (dateGiven) {
    const n = await cardNamedOpen({ today });
    const older = n.days.filter((d) => d < dateStr), closed = [], misses = [];
    for (const d of older) { const miss = appendAbsence(d, absenceLine(`his full time on ${dateStr}`, now.toISOString())); if (miss) misses.push(miss); else closed.push(d); }
    if (closed.length || misses.length) olderNote = ` · ${closed.length} older named day(s) closed with no line of his${closed.length ? `: ${closed.join(", ")}` : ""}${misses.length ? ` (${oneLine(misses.join(", "), 60)})` : ""}`;
    if (n.error) olderNote = ` · the deck could not be read (${n.error}) — no older day closed`;
  }
  // THE LOGBOOK (8 Aug 2026): SEASON.md rides every full-time — Claude fills
  // 100%, he writes ZERO. Best-effort: a logbook render must never block the ritual.
  try { writeAtomic(SEASON_MD, renderSeasonMd({ ...gatherSeasonExtras(now), season: newSeason })); } catch { }
  // milestone → arm the brain's deep re-analysis (U4; every 30th matchday)
  // WHERE THIS LANDS TODAY — read before "fixing" it (11 Aug 2026, dead-wire pass).
  // A tracer filed this line as a PRODUCER_NO_CONSUMER: no job in brain_config.json
  // declares `trigger: "reanalysis"`, so the arming is consumed by nothing and the key
  // sits in brain_queue.json.triggers forever. The first half is TRUE; the conclusion
  // drawn from it ("the milestone deep re-read never fires") is FALSE, and acting on it
  // would reverse a captain's ruling. deep_reanalysis was un-gated from trigger-only to
  // NIGHTLY on 9 Aug 2026 (P1 unleash, his word) — enabled, window overnight, priority 85
  // — so the re-read now runs every night, which is strictly MORE than every 30th
  // matchday, and the arming was left standing on purpose: brain_config's own
  // `_window_note` says "RE-GATING is one edit: restore \"trigger\": \"reanalysis\" and set
  // window back to \"any\"". The orphan key is inert — nothing but brain.mjs and
  // conductor.mjs read `triggers` at all, and neither reports an armed one at him — so it
  // is NOT aged out here: a TTL would be a guessed number for zero measured damage.
  // The net that catches the real version of this (deep_reanalysis disabled or deleted
  // while this line still arms) is organism_test.mjs § ARMING-DESTINATION CONTRACT.
  if (newSeason.matches_played > 0 && newSeason.matches_played % 30 === 0 && WON_DAY.has(hit)) {
    try {
      const { execFileSync } = await import("node:child_process");
      execFileSync(process.execPath, [join(__dirname, "brain.mjs"), "trigger", "reanalysis", `matchday ${newSeason.matches_played} milestone`], { windowsHide: true, timeout: 15000 });
    } catch { }
  }
  // THE FULL-TIME EVENT (OVERHAUL Block 5.2, 18 Aug 2026 §10): the day is CLOSED by his word — the
  // one moment the evening voice lanes have something real to speak to. brain_config's teamtalk_pm
  // and evening_voice declare `trigger: "fulltime"` + `gate.event: "fulltime"`, so they run only
  // after THIS arm and never on a day he did not close (the arm belongs to this shift; brain.mjs
  // eligibleJobs · armFresh). Through the OWNER's own door (`brain.mjs trigger`), best-effort:
  // arming can never block the ritual. Same idiom as the milestone arm above.
  try {
    const { execFileSync } = await import("node:child_process");
    execFileSync(process.execPath, [join(__dirname, "brain.mjs"), "trigger", "fulltime", `full-time ${dateStr} (${hit})`], { windowsHide: true, timeout: 15000 });
  } catch { }
  // evening shadow-scoring (U3b): resolve today's would-have-spoken moments —
  // owner-writes via shadow.mjs; best-effort, never blocks the ritual
  try {
    const { execFileSync } = await import("node:child_process");
    execFileSync(process.execPath, [join(__dirname, "shadow.mjs"), "score"], { windowsHide: true, timeout: 30000 });
  } catch { }
  // THE NOTES ANCHOR (rung L1 · fates 22 / 51, 15 Oct 2026): the day is CLOSED by his word, so its notes are
  // compiled and cold-gated now — through the compiler's OWN CLI (scripts/notes_compiler.mjs, the sole writer of
  // compiled_notes.jsonl), AFTER post_match/<date>.md is written and never on --dry. NOT best-effort: the close is
  // already recorded (its exit code stays the close's), but a notes failure is said OUT LOUD on stderr and on the
  // close line — never a bare catch. The skill is never edited for this; the code path is here.
  let notesLine = "";
  try {
    const { spawnSync } = await import("node:child_process");
    const nc = spawnSync(process.execPath, [join(__dirname, "notes_compiler.mjs"), "fulltime", "--date", dateStr], { encoding: "utf8", windowsHide: true, timeout: 20 * 60000 });
    if (nc.stdout) process.stdout.write(nc.stdout);
    if (nc.stderr) process.stderr.write(nc.stderr);
    const sum = String(nc.stdout || "").split(/\r?\n/).find((l) => l.startsWith("notes_compiler:"));
    if (nc.status === 0 && sum) notesLine = ` · notes: ${sum.replace(/^notes_compiler:\s*/, "")}`;
    else {
      console.error(`postmatch: NOTES NOT DONE — notes_compiler.mjs fulltime ${nc.status === null ? `did not finish (${(nc.error && nc.error.code) || nc.signal || "?"})` : `exit ${nc.status}`} (its own lines above say which step); the close itself is recorded. Finish or back-fill: node scripts/notes_compiler.mjs fulltime --date ${dateStr}`);
      notesLine = ` · NOTES NOT DONE${sum ? ` (${sum.replace(/^notes_compiler:\s*/, "")})` : " (see above)"}`;
    }
  } catch (e) {
    console.error(`postmatch: NOTES NOT DONE — ${String((e && e.message) || e).slice(0, 200)}; the close itself is recorded. Finish or back-fill: node scripts/notes_compiler.mjs fulltime --date ${dateStr}`);
    notesLine = " · NOTES NOT DONE (see above)";
  }
  const routedTonight = route === "all" && pendingBalls.length > 0 && ledger.readable;
  if (routedTonight) {
    writeAtomic(ROUTED, { routed: ledger.rows.concat(pendingBalls.map(b => ({ id: b.id, routed_on: dateStr }))) });
  }
  // audit #82: this used to say "KAL-line locked" even when he declined the prompt.
  // 11 Aug 2026, same shape one field over: the routed count came off the FLAG
  // (--route all) and not off the write, so a refused ledger write would still
  // have printed "N throw-in(s) routed" at him. It reports what happened now.
  const routeNote = route !== "all" ? ""
    : ledger.readable ? ` · ${pendingBalls.length} throw-in(s) routed`
    : " · throw-ins NOT routed (routing ledger unreadable — see above)";
  console.log(`postmatch: ${hit} · Matchday ${matchday} · ${kal ? "KAL-line locked" : "no KAL-line (declined)"}${routeNote}${machineKept ? " · the machine close kept below (L9)" : ""}${olderNote}${notesLine} → ${join(PM_DIR, dateStr + ".md")}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { renderPostMatch, updateSeason, updateNotebook, pickBallsToRoute, readRoutedLedger, pendingThrowIns, KAL_RE, renderSeasonMd, seasonStreak };
