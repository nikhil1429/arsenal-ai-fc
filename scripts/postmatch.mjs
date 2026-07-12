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
//   season.json (own), notebook.json (own), routed_balls.json (own)
// OUTPUT: post_match/<date>.md · season.json · notebook.json · routed_balls.json
// MODES:  --hit HIT|MISS|PARTIAL|REST --signal "…" --kal "…" [--diag start|block|sleep]
//         [--route all|none] [--dry] · selftest  (interactive prompts if TTY, no flags)
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

const KAL_RE = /KAL-?LINE\s*→\s*(.+)/i;      // manager.mjs's exact parser contract
const BADGE = "⚪🔴";

const localDate = (now) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

function writeAtomic(path, obj) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = path + ".tmp";
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
  lines.push(`KAL-LINE → ${kal}`);
  lines.push("");
  lines.push(`COYG. ${BADGE}`);
  return lines.join("\n") + "\n";
}

function updateSeason(season, hit, dateStr) {
  const s = season || { season_day: 0, matches_played: 0, trophy_state: "unlit", pipeline_item: null, started_on: dateStr };
  const won = WON_DAY.has(hit);
  return {
    ...s,
    season_day: (s.season_day || 0) + 1,
    matches_played: (s.matches_played || 0) + (won ? 1 : 0),
    last_result: hit,
    last_played: dateStr,
  };
}

function updateNotebook(notebook, signal, hit, dateStr) {
  const nb = notebook && Array.isArray(notebook.moments) ? notebook : { moments: [] };
  if (signal) nb.moments.push({ date: dateStr, line: signal, result: hit });
  if (nb.moments.length > 45) nb.moments = nb.moments.slice(-45);   // ~30–40 day compressed memory
  return nb;
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
  const dry = process.argv.includes("--dry");
  const now = new Date();
  const dateStr = localDate(now);

  let hit = (argOf("--hit") || "").toUpperCase() || null;
  let signal = argOf("--signal");
  let kal = argOf("--kal");
  const diag = argOf("--diag");
  const route = (argOf("--route") || "").toLowerCase();

  if (!hit) hit = ((await promptIfTTY("Result? HIT / MISS / PARTIAL / REST → ")) || "HIT").toUpperCase();
  if (!["HIT", "MISS", "PARTIAL", "REST"].includes(hit)) { console.log("postmatch: --hit must be HIT|MISS|PARTIAL|REST"); process.exit(1); }
  if (!signal) signal = await promptIfTTY("One signal worth naming (data, not verdict) → ");
  if (!kal) kal = (await promptIfTTY("KAL-LINE — tomorrow's pre-decided first move → ")) || "one green ball, first thing. That's the whole plan.";

  const pulse = readJson(join(STATE_DIR, "pulse.json"));
  const drills = readJson(join(STATE_DIR, "drills.json"));
  const twin = readJson(join(STATE_DIR, "twin.json"));
  const disclosures = [
    ...((pulse && pulse.withheld_disclosures) || []),
    ...((drills && drills.withheld) || []),
  ];
  const routedPrev = readJson(ROUTED) || { routed: [] };
  const routedIds = new Set(routedPrev.routed.map(r => r.id));
  const pendingBalls = readLines(join(STATE_DIR, "loose_balls.jsonl")).filter(b => !b.routed && !routedIds.has(b.id));

  const season = readJson(SEASON);
  const matchday = ((season && season.matches_played) || 0) + 1;
  const md = renderPostMatch({ hit, signal, kal, diag, disclosures, twinVoice: twin && twin.voice, pendingBalls, matchday, dateStr });

  if (dry) {
    console.log("--- DRY RUN (nothing written) ---\n" + md);
    return;
  }
  writeAtomic(join(PM_DIR, dateStr + ".md"), md);
  writeAtomic(SEASON, updateSeason(season, hit, dateStr));
  writeAtomic(NOTEBOOK, updateNotebook(readJson(NOTEBOOK), signal, hit, dateStr));
  if (route === "all" && pendingBalls.length) {
    writeAtomic(ROUTED, { routed: routedPrev.routed.concat(pendingBalls.map(b => ({ id: b.id, routed_on: dateStr }))) });
  }
  console.log(`postmatch: ${hit} · Matchday ${matchday} · KAL-line locked${route === "all" ? ` · ${pendingBalls.length} throw-in(s) routed` : ""} → ${join(PM_DIR, dateStr + ".md")}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { renderPostMatch, updateSeason, updateNotebook, KAL_RE };
