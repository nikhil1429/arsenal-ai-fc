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
//         [--route all|none] [--dry] · route [all|<id>…] (route-only, no ledger)
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

import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync, mkdtempSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";                      // selftest only — the on-disk seam (benchmark.mjs:644 precedent)
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
  rows.push({ date: dateStr, matchday: won ? matches_played : null, result: hit,
    kal: extras.kal || null, signal: extras.signal || null });
  return {
    ...s,
    season_day: (s.season_day || 0) + 1,
    matches_played,
    last_result: hit,
    last_played: dateStr,
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
    const tail = rows.slice(-7);
    if (tail.length) L.push(`- form (last ${tail.length} close${tail.length > 1 ? "s" : ""}, oldest→newest): ${tail.map((r) => FORM_GLYPH[r.result] || "·").join(" ")}   (● won · ◦ rest — a won day too · «·» not-won: data, not a verdict)`);
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
  const dry = process.argv.includes("--dry");
  const now = new Date();
  const dateStr = localDate(now);

  // double-click guard: one full-time per day (a second click must never
  // double a matchday). --force is the deliberate override.
  if (!dry && !process.argv.includes("--force") && existsSync(join(PM_DIR, dateStr + ".md"))) {
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
  if (!kal) kal = (await promptIfTTY("KAL-LINE — tomorrow's pre-decided first move → ")) || null;

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
  const md = renderPostMatch({ hit, signal, kal, diag, disclosures, twinVoice: twin && twin.voice, pendingBalls, matchday, dateStr });

  if (dry) {
    console.log("--- DRY RUN (nothing written) ---\n" + md);
    return;
  }
  writeAtomic(join(PM_DIR, dateStr + ".md"), md);
  const newSeason = updateSeason(season, hit, dateStr, { kal, signal });
  writeAtomic(SEASON, newSeason);
  writeAtomic(NOTEBOOK, updateNotebook(readJson(NOTEBOOK), signal, hit, dateStr));
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
  console.log(`postmatch: ${hit} · Matchday ${matchday} · ${kal ? "KAL-line locked" : "no KAL-line (declined)"}${routeNote} → ${join(PM_DIR, dateStr + ".md")}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { renderPostMatch, updateSeason, updateNotebook, pickBallsToRoute, readRoutedLedger, pendingThrowIns, KAL_RE, renderSeasonMd, seasonStreak };
