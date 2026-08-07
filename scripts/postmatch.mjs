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
//         · selftest  (interactive prompts if TTY, no flags)
// SEASON.md (DAILY_CADENCE.md compact design, honest subset): TABLE standings +
//   MATCH ROWS newest-top + streak/form-line (rest-dot neutral) + KAL→kickoff
//   weld + shame-spiral guard + no date-countdown. Design fields with NO machine
//   source yet (M1 %, floor/surplus/save-flag per row, won-day=5 scoring) are
//   DEFERRED, not faked — they join when their owners exist.
// WHO ELSE COULD ACT ON THIS OUTPUT (Ruling 5): learnstate kickoff (streak line)
//   · viz wall · twin (bets read season.json) · outwork_audit o5 (sync watch).
// ============================================================================

import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync } from "node:fs";
import { join, dirname } from "node:path";
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

function renderSeasonMd({ season, lockedCount, python, benchmark, now }) {
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
  L.push(`- capsules locked: ${typeof lockedCount === "number" ? lockedCount : "—"}`);
  L.push(`- python: ${python ? `tier ${python.tier || "—"} · ${python.fluency || "—"}` : "no track state yet"}`);
  if (benchmark) {
    L.push(benchmark.status === "gated_pre_audit"
      ? `- benchmark: GATED (pre-audit) — ${(benchmark.gate && benchmark.gate.missions_line) || ""}`
      : `- benchmark: ${(benchmark.buckets || []).map((b) => `${b.id} locked ${b.counts.locked}/${b.counts.core_total}`).join(" · ")}`);
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

function gatherSeasonExtras(now) {
  const capsuleMap = readJson(join(STATE_DIR, "capsule_map.json"));
  return {
    season: readJson(SEASON),
    lockedCount: capsuleMap && Array.isArray(capsuleMap.concepts) ? capsuleMap.concepts.filter((c) => c.locked_on).length : null,
    python: readJson(join(STATE_DIR, "python_state.json")),
    benchmark: readJson(join(STATE_DIR, "benchmark.json")),
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
    assert("NO SHAME LAW on the logbook — no failure/broken-streak words, MISS renders a neutral dot",
      !/fail|failure|broke|shame/i.test(mdSeason));
    assert("NO-COUNTDOWN LAW on the logbook — no deadline/days-left language",
      !/deadline|days left|due by|countdown/i.test(mdSeason));
    const mdEmpty = renderSeasonMd({ season: null, lockedCount: null, python: null, benchmark: null, now: new Date(2026, 7, 8) });
    assert("SEASON.md: empty season renders the honest scaffold (starts when he plays, not a date)",
      /no matchday closed yet/.test(mdEmpty) && /starts when he plays/.test(mdEmpty) && /khaali — pehla full-time/.test(mdEmpty));
    assert("SEASON.md: he writes ZERO — the file says who writes it",
      /machine-written 100% by postmatch\.mjs/.test(mdSeason));
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
  if (mode === "route") {
    // routing WITHOUT re-running the evening ledger (the Dugout's spoken gate
    // lands here; season/notebook untouched — no double matchday, ever)
    const rest = process.argv.slice(3);
    const which = !rest.length || rest[0].toLowerCase() === "all" ? "all" : "ids";
    const routedPrev = readJson(ROUTED) || { routed: [] };
    const routedIds = new Set(routedPrev.routed.map(r => r.id));
    const pending = [
      ...readLines(join(STATE_DIR, "loose_balls.jsonl")).filter(b => !b.routed && !routedIds.has(b.id)),
      ...readLines(join(STATE_DIR, "dugout_notes.jsonl")).filter(n => !n.routed && n.text && !routedIds.has("note:" + n.ts)).map(n => ({ id: "note:" + n.ts, text: String(n.text) })),
    ];
    const pick = pickBallsToRoute(pending, which, rest);
    if (!pick.length) { console.log("postmatch: no pending throw-ins to route"); return; }
    writeAtomic(ROUTED, { routed: routedPrev.routed.concat(pick.map(b => ({ id: b.id, routed_on: localDate(new Date()) }))) });
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

  if (!hit) hit = ((await promptIfTTY("Result? HIT / MISS / PARTIAL / REST → ")) || "HIT").toUpperCase();
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
  const routedPrev = readJson(ROUTED) || { routed: [] };
  const routedIds = new Set(routedPrev.routed.map(r => r.id));
  // throw-ins + dugout notes ride the same routing gate (U4): notes he voiced
  // to the Gaffer surface here verbatim, keyed note:<ts> in routed_balls
  const pendingBalls = [
    ...readLines(join(STATE_DIR, "loose_balls.jsonl")).filter(b => !b.routed && !routedIds.has(b.id)),
    ...readLines(join(STATE_DIR, "dugout_notes.jsonl")).filter(n => !n.routed && n.text && !routedIds.has("note:" + n.ts)).map(n => ({ id: "note:" + n.ts, text: String(n.text) + " 〔dugout〕" })),
  ];

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
  if (newSeason.matches_played > 0 && newSeason.matches_played % 30 === 0 && WON_DAY.has(hit)) {
    try {
      const { execFileSync } = await import("node:child_process");
      execFileSync(process.execPath, [join(__dirname, "brain.mjs"), "trigger", "reanalysis", `matchday ${newSeason.matches_played} milestone`], { windowsHide: true, timeout: 15000 });
    } catch { }
  }
  // evening shadow-scoring (U3b): resolve today's would-have-spoken moments —
  // owner-writes via shadow.mjs; best-effort, never blocks the ritual
  try {
    const { execFileSync } = await import("node:child_process");
    execFileSync(process.execPath, [join(__dirname, "shadow.mjs"), "score"], { windowsHide: true, timeout: 30000 });
  } catch { }
  if (route === "all" && pendingBalls.length) {
    writeAtomic(ROUTED, { routed: routedPrev.routed.concat(pendingBalls.map(b => ({ id: b.id, routed_on: dateStr }))) });
  }
  // audit #82: this used to say "KAL-line locked" even when he declined the prompt.
  console.log(`postmatch: ${hit} · Matchday ${matchday} · ${kal ? "KAL-line locked" : "no KAL-line (declined)"}${route === "all" ? ` · ${pendingBalls.length} throw-in(s) routed` : ""} → ${join(PM_DIR, dateStr + ".md")}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { renderPostMatch, updateSeason, updateNotebook, pickBallsToRoute, KAL_RE, renderSeasonMd, seasonStreak };
