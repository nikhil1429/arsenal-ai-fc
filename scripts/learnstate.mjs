#!/usr/bin/env node
// ============================================================================
// learnstate.mjs · ARSENAL AI FC — THE SESSION-AGNOSTIC KICKOFF (working-memory)
// ----------------------------------------------------------------------------
// WHAT: prints a compact "where am I" brief that ANY Claude Code session reads at
//   start (via the .claude/settings.json SessionStart hook) — so a FRESH session
//   is oriented from STATE, not from its own chat history. This is what makes
//   "learn on Claude Code" session-agnostic: sprint position + where he left off
//   + open loop + watch-list + next-up + the day's Examiner target, in one read.
// READS (all read-only, defensive): sprint.json (curriculum + live progress),
//   working_set.json (the distiller's 4-slot memory), weaknesses.json (watch-list).
//   Writes NOTHING (single-writer law intact).
// ROUTING: current.track 'concept' -> FORGE (9-axis) · 'skill' (Python) -> the
//   JS->Python 5-phase loop (Claude learn -> Colab -> Coach Gem + CLOSE-PACKET).
// MODES: brief (default — for the SessionStart hook) · json · selftest
// ============================================================================
import { readFileSync, existsSync, mkdtempSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE = join(__dirname, "..", "dressing-room", "state");

const readJson = (p) => { try { if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")); } catch {} return null; };
const clip = (s, n) => String(s || "").replace(/\s+/g, " ").trim().slice(0, n);

function gather(dir = STATE) {
  const sprint = readJson(join(dir, "sprint.json")) || {};
  const ws = readJson(join(dir, "working_set.json")) || {};
  const weak = readJson(join(dir, "weaknesses.json")) || {};
  const cur = (sprint.progress && sprint.progress.current) || null;
  const watch = Array.isArray(weak.patterns) ? weak.patterns.slice(0, 3).map(p => p.label || p.pattern || p.name).filter(Boolean)
    : Array.isArray(weak.weaknesses) ? weak.weaknesses.slice(0, 3).map(w => w.axis || w.concept || w).filter(Boolean) : [];
  const modeLine = cur
    ? (cur.track === "skill"
        ? "PYTHON SKILL loop — JS->Python bridge, 5-phase (Samjhao->Dikhao->Saath->Akele->Bolo), struggle-first; emit the CLOSE-PACKET (BLOCK-A->Colab, BLOCK-B->Coach Gem)."
        : "FORGE — the 9-axis concept capsule (Pehle-Guess, crack-map, gut-word law).")
    : "no current task in sprint.json";
  return { sprint, ws, cur, watch, modeLine };
}

function brief(dir = STATE) {
  const { sprint, ws, cur, watch, modeLine } = gather(dir);
  const L = [];
  L.push("=== ARSENAL — SESSION KICKOFF (auto · session-agnostic · read from state, not chat) ===");
  if (cur) {
    const sp = (sprint.sprints || []).find(s => String(cur.id).startsWith(String(s.n)));
    L.push(`LEARNING NOW: ${cur.id} ${cur.task} [${cur.track}${sp ? ` · S${sp.n} ${sp.theme}` : ""}] — ${cur.subtopics || ""}`);
    L.push(`  MODE: ${modeLine}`);
  } else {
    L.push("LEARNING NOW: (sprint.json has no current task — run the sprint sync)");
  }
  if (ws.where_left_off) L.push(`LAST SESSION: ${clip(ws.where_left_off, 180)}`);
  if (ws.open_loop) L.push(`OPEN LOOP (still hanging): ${clip(ws.open_loop, 180)}`);
  if (watch.length) L.push(`WATCH-LIST (his repeat JS-hangovers — catch these): ${watch.join(" · ")}`);
  const nx = (sprint.progress && sprint.progress.next_up) || [];
  if (nx.length) L.push(`NEXT UP: ${nx.slice(0, 3).join(" · ")}`);
  if (sprint.progress && sprint.progress.examiner_daily) L.push(`DAILY EXAMINER: at day's end, test today's concept (${cur ? cur.task : "current"}) — retrieval practice, not a full mock.`);
  L.push("LAWS: struggle-first (never hand him code/answers he hasn't attempted) · JS->Python bridge (he knows JS/React) · Bolo every concept · automate the friction, protect the baking.");
  L.push("=== (you are oriented — do NOT ask him to re-explain where he is) ===");
  return L.join("\n");
}

function selftest() {
  const checks = [];
  const assert = (n, c) => { checks.push(!!c); console.log(`  ${c ? "✓" : "✗"} ${n}`); };
  const dir = mkdtempSync(join(tmpdir(), "learnstate-"));
  writeFileSync(join(dir, "sprint.json"), JSON.stringify({ sprints: [{ n: 1, theme: "Foundations" }], progress: { current: { id: "1-04", task: "Hallucinations", track: "concept", subtopics: "causes, detection, grounding" }, next_up: ["1-05 X", "1-07 Python"], examiner_daily: "test today's concept" } }));
  writeFileSync(join(dir, "working_set.json"), JSON.stringify({ where_left_off: "was on cosine similarity", open_loop: "why cosine not euclidean" }));
  writeFileSync(join(dir, "weaknesses.json"), JSON.stringify({ weaknesses: [{ axis: "is-vs-==" }, { axis: "None-vs-null" }] }));
  const b = brief(dir);
  assert("brief names the CURRENT concept from sprint.json", b.includes("1-04 Hallucinations"));
  assert("concept task routes to FORGE mode", b.includes("FORGE"));
  assert("brief carries where-left-off from the working_set", b.includes("cosine similarity"));
  assert("brief carries the open loop", b.includes("why cosine"));
  assert("brief carries the JS-hangover watch-list", b.includes("is-vs-==") || b.includes("None-vs-null"));
  assert("brief surfaces the daily Examiner reminder", b.toLowerCase().includes("daily examiner"));
  assert("brief tells the session NOT to re-ask where he is", b.includes("do NOT ask him to re-explain"));
  writeFileSync(join(dir, "sprint.json"), JSON.stringify({ sprints: [], progress: { current: { id: "1-07", task: "Python basics", track: "skill", subtopics: "types, f-strings" } } }));
  assert("skill task (Python) routes to the JS->Python CLOSE-PACKET loop", brief(dir).includes("CLOSE-PACKET"));
  const dir2 = mkdtempSync(join(tmpdir(), "learnstate-empty-"));
  assert("empty state -> a valid brief, never a crash", typeof brief(dir2) === "string" && brief(dir2).includes("KICKOFF"));
  const passed = checks.every(Boolean);
  console.log(passed ? "\nALL CHECKS PASSED" : "\nSELFTEST FAILED");
  return passed;
}

function main() {
  const mode = (process.argv[2] || "brief").toLowerCase();
  if (mode === "selftest") { process.exit(selftest() ? 0 : 1); }
  if (mode === "json") { console.log(JSON.stringify(gather(), null, 2)); return; }
  console.log(brief());
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
export { brief, gather };
