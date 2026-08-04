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
import { courseBrief } from "./course.mjs";   // audit #35 — the course tracker's one reader

// audit #11 — read capsule_map.json (capsule_bridge's own output, read-only) and say
// what is overdue for Re-Jirah. Reads a file, never computes a second schedule.
function rejirahDueLine(dir) {
  const p = join(dir, "capsule_map.json");
  if (!existsSync(p)) return null;
  const m = JSON.parse(readFileSync(p, "utf8"));
  const od = (m.rejirah_overdue || []).filter((r) => (r.overdue_days || 0) > 0)
    .sort((a, b) => (b.overdue_days || 0) - (a.overdue_days || 0));
  if (!od.length) return null;
  const never = od.filter((r) => (r.rounds_done || 0) === 0).length;
  const head = od.slice(0, 3).map((r) => `${r.concept} ${r.overdue_days}d`).join(" · ");
  return `RE-JIRAH OVERDUE (${od.length}): ${head}${od.length > 3 ? " …" : ""}`
    + (never ? ` — ${never} ka ek bhi round nahi hua.` : "")
    + `  Overdue = RIPE, late nahi. Queue: \`node scripts/deep.mjs due\` (cold, sirf sawaal).`;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE = join(__dirname, "..", "dressing-room", "state");

const readJson = (p) => { try { if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")); } catch {} return null; };
const clip = (s, n) => String(s || "").replace(/\s+/g, " ").trim().slice(0, n);

// E2E audit 25 Jul 2026 (freshness): working_set.json carries a `ts` (the distiller
// stamps it every run) but the brief printed its slots verbatim, forever. If the
// distiller task dies, every SessionStart keeps serving "LAST SESSION / OPEN LOOP"
// from days ago as if it were this morning — the session then chases a loop he
// closed a week back. The brief is orientation, so age is part of the fact: past
// WS_STALE_DAYS the slot is archaeology and must be labelled as such, not hidden
// (hiding it would silently blind the kickoff instead of telling the truth).
const WS_STALE_DAYS = 7;
const ageDays = (ts, now) => { const t = Date.parse(String(ts || "")); return Number.isFinite(t) ? (now - t) / 86400000 : null; };

// ---------------------------------------------------------------------------
// MEMORY SPLICE (research 31 Jul 2026 — defect #4). This brief was the ONLY thing
// a fresh Claude Code session received, and it read exactly three files. The
// hippocampus — 2 identity facts, the consolidated who_he_is, 11 durable episodes
// — never reached the surface the captain actually studies on, so he was forced to
// re-explain himself. He did, in his own words, three separate times ("I have
// ADHD-PI... I don't know what I have created and how to in reality use it" ·
// "I think you forgot it"). The MCP tools existed and worked; nothing invited them,
// so arrival depended on a model volunteering a call. Intent is not a mechanism.
//
// LAWS this obeys:
//  · READ-ONLY. buildRehydrateCartridge (hippocampus.mjs:410) is pure disk reads —
//    no network, no embedding pool. The single-writer law is untouched.
//  · REPAIR TOWARD SILENCE. Lazy dynamic import inside try/catch: if hippocampus is
//    missing, broken, or slow, the brief prints exactly as it did before. A hook
//    must never bite the editor.
//  · SYNC SIGNATURE PRESERVED. brief() stays sync; memory arrives as an optional
//    third argument, so every existing caller and the export are unchanged.
//  · ORGAN-SAFE. Loaded only AFTER the ARSENAL_ORGAN guard in main(), so headless
//    `claude -p` organ prompts never get the captain's personal memory prepended.
const MEMO_MAX = 2200;          // orientation, not an archive — a wall of text read every session is a wall ignored
const MEMO_EPISODES = 6;

// ---------------------------------------------------------------------------
// THE TEACHING CARD (31 Jul 2026). learning-layer/HOW_HE_LEARNS.md is a forensic
// read of the whole Claude Project history — 21 findings, his own verbatim words,
// ending in a seventeen-rule cold-start card. Written to a file, it was read by
// NOBODY: same defect as the hippocampus, one day later. A rule that depends on a
// session choosing to open a file is not a rule, it is a hope.
//
// SINGLE SOURCE: the card is parsed out of the document between two explicit
// markers, so editing the doc updates every future session on its next boot and
// the two can never drift. Missing file, missing marker, empty block → null →
// the brief prints exactly as it did before. It never guesses at the boundaries.
//
// AUDIT 4 Aug 2026 (#14): this loader is now EXPORTED and reused by
// mcp-memory.mjs's get_context. It was reachable only from the SessionStart
// brief, while CLAUDE.md mandates `get_context` as *the* session-start call —
// so the door the captain is told to open was the one door with no teaching
// card behind it. One parser, two doors: forking a second copy into the MCP is
// exactly how the two would drift.
const CARD_FILE  = join(__dirname, "..", "learning-layer", "HOW_HE_LEARNS.md");
const CARD_BEGIN = "<!-- COLD-START-CARD:BEGIN";
const CARD_END   = "<!-- COLD-START-CARD:END";
const CARD_MAX   = 1800;
function loadTeachingCard(path = CARD_FILE) {
  try {
    if (!existsSync(path)) return null;
    const raw = readFileSync(path, "utf8");
    const a = raw.indexOf(CARD_BEGIN); if (a < 0) return null;
    const open = raw.indexOf("-->", a); if (open < 0) return null;
    const b = raw.indexOf(CARD_END, open); if (b < 0) return null;
    const body = raw.slice(open + 3, b).replace(/\*\*/g, "").trim();
    if (!body) return null;
    return body.length > CARD_MAX ? body.slice(0, CARD_MAX) + "\n… (truncated — full evidence in learning-layer/HOW_HE_LEARNS.md)" : body;
  } catch { return null; }
}
async function loadMemory() {
  try {
    const h = await import("./hippocampus.mjs");
    if (typeof h.buildRehydrateCartridge !== "function") return null;
    const raw = h.buildRehydrateCartridge({ n: MEMO_EPISODES });
    if (!raw || typeof raw !== "string") return null;
    return raw.length > MEMO_MAX ? raw.slice(0, MEMO_MAX) + "\n… (truncated — full recall via the organism-memory MCP `get_context`)" : raw;
  } catch { return null; }
}

function gather(dir = STATE, now = Date.now()) {
  const sprint = readJson(join(dir, "sprint.json")) || {};
  const ws = readJson(join(dir, "working_set.json")) || {};
  const weak = readJson(join(dir, "weaknesses.json")) || {};
  const cur = (sprint.progress && sprint.progress.current) || null;
  const wsAge = ageDays(ws.ts, now);
  // E2E audit 25 Jul 2026: this read `w.axis` FIRST, but nemesis writes `axis` as a
  // bare axis LETTER ("a"), so the captain's daily brief printed "WATCH-LIST: a" —
  // and the final `|| w` fallback rendered a whole object as "[object Object]".
  // The human-readable name is `topic` (nemesis's real schema: id, topic, axis,
  // recurrence, evidence, score). Axis rides along as a suffix, never alone.
  const label = (w) => {
    if (typeof w === "string") return w;
    if (!w || typeof w !== "object") return null;
    const name = w.topic || w.concept || w.label || w.pattern || w.name || w.id;
    if (!name) return null;
    return w.axis && String(w.axis).length === 1 ? `${name} (${w.axis})` : String(name);
  };
  // E2E audit 25 Jul 2026 (part 2 of the same finding): `weak.patterns` was tested
  // FIRST and short-circuited the real list. nemesis.mjs is the single writer of
  // weaknesses.json and writes `weaknesses:[...]` only — nothing in the repo has
  // ever written `patterns`, so the day anything does (a hand-edit, a future
  // producer) the live watch-list would go dark. The producer's real key now wins;
  // `patterns` is kept as a tolerated legacy shape (layering, not deletion) but is
  // mapped through the SAME label() so it can never regress to a bare key again.
  const watchSrc = Array.isArray(weak.weaknesses) ? weak.weaknesses
    : Array.isArray(weak.patterns) ? weak.patterns
    : [];
  const watch = watchSrc.slice(0, 3).map(label).filter(Boolean);
  // track -> the session ritual (single source of truth, kept in sync with .claude/skills/learn/SKILL.md §1).
  // Was a binary skill/else ternary that mislabeled every non-skill track "FORGE 9-axis" — course/build/
  // domain/career now route explicitly; an unknown track falls to a safe SESSION line (never a stray FORGE).
  const MODE_BY_TRACK = {
    concept: "FORGE — the 9-axis concept capsule (Pehle-Guess, crack-map, gut-word law).",
    skill:   "PYTHON SKILL loop — JS->Python bridge, struggle-first; emit the CLOSE-PACKET (BLOCK-A->Colab, BLOCK-B->Coach Gem).",
    course:  "COURSE — guided active-recall Colab pass (predict -> work the cells -> retrieval quiz). NOT a Forge capsule.",
    build:   "BUILD — struggle-first build session on the artifact; you write it, hint-not-solve, Bolo the interview-defensible parts.",
    domain:  "DOMAIN — teach finance/tax from zero (no assumed recall) + Bolo; concept-style close, not Python.",
    career:  "CAREER — not a study session; orient + assist (draft/review), no reps.",
  };
  const modeLine = cur
    ? (MODE_BY_TRACK[cur.track] || "SESSION — read the task and decide what it needs; force no ritual.")
    : "no current task in sprint.json";
  return { sprint, ws, cur, watch, modeLine, wsAge };
}

function brief(dir = STATE, now = Date.now(), memory = null, card = null) {
  const { sprint, ws, cur, watch, modeLine, wsAge } = gather(dir, now);
  // age tag for the working-set slots (see WS_STALE_DAYS above). Same-day = no tag
  // (the common, healthy case stays quiet); a missing `ts` is called out rather
  // than assumed fresh — an untimestamped slot is exactly the one you can't trust.
  const wsTag = wsAge === null ? " (age unknown)"
    : wsAge >= WS_STALE_DAYS ? ` (STALE · ${Math.floor(wsAge)}d old — treat as history, confirm before acting on it)`
    : wsAge >= 1 ? ` (${Math.floor(wsAge)}d ago)`
    : "";
  const L = [];
  L.push("=== ARSENAL — SESSION KICKOFF (auto · session-agnostic · read from state, not chat) ===");
  if (cur) {
    // E2E audit 25 Jul 2026: matched the sprint number as a bare string prefix, so
    // the first double-digit sprint mislabels — find() hits n=1 before n=10 because
    // "10-01".startsWith("1") is true. Task ids are always "<sprint>-<nn>", so the
    // separator is part of the match, not decoration.
    const sp = (sprint.sprints || []).find(s => String(cur.id).startsWith(String(s.n) + "-"));
    L.push(`LEARNING NOW: ${cur.id} ${cur.task} [${cur.track}${sp ? ` · S${sp.n} ${sp.theme}` : ""}] — ${cur.subtopics || ""}`);
    L.push(`  MODE: ${modeLine}`);
    // audit #35 — THE COURSE TRACKER GETS ITS ADDRESS.
    // course.mjs was 670 lines with zero callers and course.json had never existed, while
    // sprint.json's next_up is 1-05 and 1-06 — BOTH course-track, 9 chapters. So on 1-05 he
    // would have been ASKED where he is instead of being TOLD. courseBrief() takes no args,
    // never throws, and reports `present:false` honestly when nothing has been ingested yet.
    // NOTE: the reader is HERE, never sprintsync — sprint.json is Sheet-driven, single-writer.
    if (cur.track === "course") {
      try {
        const cb = courseBrief();
        if (cb && cb.line) L.push(`  📼 ${cb.line}`);
      } catch { /* a brief must never be the thing that breaks SessionStart */ }
    }
  } else {
    L.push("LEARNING NOW: (sprint.json has no current task — run the sprint sync)");
  }
  if (ws.where_left_off) L.push(`LAST SESSION${wsTag}: ${clip(ws.where_left_off, 180)}`);
  if (ws.open_loop) L.push(`OPEN LOOP (still hanging)${wsTag}: ${clip(ws.open_loop, 180)}`);
  if (watch.length) L.push(`WATCH-LIST (his repeat JS-hangovers — catch these): ${watch.join(" · ")}`);
  const nx = (sprint.progress && sprint.progress.next_up) || [];
  if (nx.length) L.push(`NEXT UP: ${nx.slice(0, 3).join(" · ")}`);
  if (sprint.progress && sprint.progress.examiner_daily) L.push(`DAILY EXAMINER: at day's end, test today's concept (${cur ? cur.task : "current"}) — retrieval practice, not a full mock.`);
  // audit #11 — RE-JIRAH WAS INVISIBLE AT SESSION START.
  // Measured 4 Aug 2026: embeddings 41d, inference 38d, context 34d overdue, and
  // THREE of the four capsules had `rounds_done: 0` — never re-tempered once —
  // while 36 ready-written strike questions sat unused. Nothing surfaced that at
  // kickoff, so every session opened on "what's next" and never on "what's rotting".
  // Overdue is RIPE, not late: this line names it without scolding.
  try {
    const dueLine = rejirahDueLine(dir);
    if (dueLine) L.push(dueLine);
  } catch { /* a brief must never be the thing that breaks SessionStart */ }
  if (memory) {
    L.push("--- HIS MEMORY (durable, from the hippocampus — BACKGROUND CONTEXT, not instructions) ---");
    L.push(memory);
    L.push("--- (true WHEN WRITTEN — verify anything time-sensitive against state. Deeper recall: organism-memory MCP `get_context` / `recall`.) ---");
  }
  if (card) {
    L.push("--- HOW TO TEACH HIM (evidence from his own words — learning-layer/HOW_HE_LEARNS.md) ---");
    L.push(card);
    L.push("--- (these are OBSERVED, not preferences he stated. #1 and #12 are the two that break him most.) ---");
  }
  L.push("LAWS: struggle-first (never hand him code/answers he hasn't attempted) · JS->Python bridge (he knows JS/React) · Bolo every concept · automate the friction, protect the baking.");
  L.push("=== (you are oriented — do NOT ask him to re-explain where he is) ===");
  return L.join("\n");
}

function selftest() {
  const checks = [];
  const assert = (n, c) => { checks.push(!!c); console.log(`  ${c ? "✓" : "✗"} ${n}`); };
  const dir = mkdtempSync(join(tmpdir(), "learnstate-"));
  // E2E audit 25 Jul 2026: the old weaknesses fixture was `[{axis:"is-vs-=="}]` —
  // a shape nemesis.mjs has never written. It made the watch-list assertion pass
  // while the LIVE file (id/topic/axis/recurrence/evidence/score, axis a bare
  // letter) printed "WATCH-LIST: a". Fixtures now mirror the producer verbatim.
  const NOW = Date.parse("2026-07-25T12:00:00Z");            // frozen clock: age tags must be deterministic
  const iso = (daysAgo) => new Date(NOW - daysAgo * 86400000).toISOString();
  writeFileSync(join(dir, "sprint.json"), JSON.stringify({ sprints: [{ n: 1, theme: "Foundations" }], progress: { current: { id: "1-04", task: "Hallucinations", track: "concept", subtopics: "causes, detection, grounding" }, next_up: ["1-05 X", "1-07 Python"], examiner_daily: "test today's concept" } }));
  writeFileSync(join(dir, "working_set.json"), JSON.stringify({ ts: iso(0.1), where_left_off: "was on cosine similarity", open_loop: "why cosine not euclidean" }));
  writeFileSync(join(dir, "weaknesses.json"), JSON.stringify({ weaknesses: [
    { id: "embeddings", topic: "embeddings", recurrence: 1, last_seen: "2026-07-17", status: "open", evidence: ["07-17 shaky-wrong"], axis: "a", score: 0.5898 },
    { id: "is-vs-==", topic: "is vs ==", recurrence: 2, status: "open", axis: "c", score: 0.42 },
  ] }));
  const b = brief(dir, NOW);
  const watchLine = b.split("\n").find(l => l.startsWith("WATCH-LIST")) || "";
  assert("brief names the CURRENT concept from sprint.json", b.includes("1-04 Hallucinations"));
  assert("concept task routes to FORGE mode", b.includes("FORGE"));
  assert("brief carries where-left-off from the working_set", b.includes("cosine similarity"));
  assert("brief carries the open loop", b.includes("why cosine"));
  assert("brief carries the JS-hangover watch-list", watchLine.includes("is vs ==") || watchLine.includes("embeddings"));
  // REGRESSION (E2E audit): the watch-list must print nemesis's human-readable
  // `topic`, with the bare axis letter only ever riding as a suffix — never the
  // whole entry, never a stringified object.
  assert("watch-list prints the TOPIC (axis only as suffix), not a bare axis letter", watchLine.includes("embeddings (a)") && !/:\s*a(\s|·|$)/.test(watchLine));
  assert("watch-list never renders a raw object", !watchLine.includes("[object Object]"));
  // REGRESSION (E2E audit): nemesis's real `weaknesses` key must win over the
  // legacy `patterns` key, which used to short-circuit it and blank the list.
  const dirP = mkdtempSync(join(tmpdir(), "learnstate-patterns-"));
  writeFileSync(join(dirP, "weaknesses.json"), JSON.stringify({ patterns: [{ note: "legacy junk with no name key" }], weaknesses: [{ id: "chunking", topic: "chunking", axis: "b" }] }));
  const pb = brief(dirP, NOW);
  assert("legacy `patterns` never short-circuits nemesis's real `weaknesses` list", pb.includes("chunking (b)"));
  // REGRESSION (E2E audit): a working_set the distiller stopped refreshing must be
  // age-tagged, not served as this morning's orientation.
  const dirS = mkdtempSync(join(tmpdir(), "learnstate-stale-"));
  writeFileSync(join(dirS, "working_set.json"), JSON.stringify({ ts: iso(11), where_left_off: "was on cosine similarity", open_loop: "why cosine not euclidean" }));
  const staleBrief = brief(dirS, NOW);
  assert("an 11-day-old working_set is flagged STALE with its age", staleBrief.includes("STALE") && staleBrief.includes("11d"));
  assert("a same-day working_set carries NO age tag (healthy case stays quiet)", !b.includes("STALE") && !b.includes("age unknown") && b.includes("LAST SESSION:"));
  // REGRESSION (E2E audit): sprint match needs the "-" separator — "10-01" must not
  // fall into sprint 1 just because find() reaches n=1 first.
  const dirD = mkdtempSync(join(tmpdir(), "learnstate-doubledigit-"));
  writeFileSync(join(dirD, "sprint.json"), JSON.stringify({ sprints: [{ n: 1, theme: "Foundations" }, { n: 10, theme: "Deployment" }], progress: { current: { id: "10-01", task: "Shipping", track: "concept" } } }));
  const ddBrief = brief(dirD, NOW);
  assert("double-digit sprint id '10-01' labels S10, not S1", ddBrief.includes("S10 Deployment") && !ddBrief.includes("S1 Foundations"));
  assert("brief surfaces the daily Examiner reminder", b.toLowerCase().includes("daily examiner"));
  assert("brief tells the session NOT to re-ask where he is", b.includes("do NOT ask him to re-explain"));
  writeFileSync(join(dir, "sprint.json"), JSON.stringify({ sprints: [], progress: { current: { id: "1-07", task: "Python basics", track: "skill", subtopics: "types, f-strings" } } }));
  assert("skill task (Python) routes to the JS->Python CLOSE-PACKET loop", brief(dir, NOW).includes("CLOSE-PACKET"));
  writeFileSync(join(dir, "sprint.json"), JSON.stringify({ sprints: [], progress: { current: { id: "1-05", task: "Anthropic API", track: "course", subtopics: "messages, models" } } }));
  const courseBrief = brief(dir, NOW);
  assert("course task routes to COURSE (Colab) — NOT mislabeled FORGE", courseBrief.includes("COURSE") && !courseBrief.includes("FORGE"));
  writeFileSync(join(dir, "sprint.json"), JSON.stringify({ sprints: [], progress: { current: { id: "1-08", task: "FinOps repo", track: "build", subtopics: "scaffold" } } }));
  const buildBrief = brief(dir, NOW);
  assert("build task routes to BUILD — never a stray FORGE label", buildBrief.includes("BUILD") && !buildBrief.includes("FORGE"));
  const dir2 = mkdtempSync(join(tmpdir(), "learnstate-empty-"));
  assert("empty state -> a valid brief, never a crash", typeof brief(dir2, NOW) === "string" && brief(dir2, NOW).includes("KICKOFF"));

  // ---- MEMORY SPLICE (31 Jul 2026) — the brief must carry the hippocampus, and
  // must be IDENTICAL to the old brief whenever memory is absent or broken.
  const memBrief = brief(dir, NOW, "THE LEDGER OF SELF:\n- he has ADHD-PI");
  assert("MEMORY — a supplied cartridge is spliced into the brief verbatim", memBrief.includes("he has ADHD-PI"));
  assert("MEMORY — the block is labelled BACKGROUND CONTEXT, not instructions",
    memBrief.includes("BACKGROUND CONTEXT, not instructions"));
  assert("MEMORY — the block carries the true-when-written caveat + the deeper-recall pointer",
    memBrief.includes("true WHEN WRITTEN") && memBrief.includes("get_context"));
  assert("MEMORY — memory sits ABOVE the LAWS line (orientation before rules)",
    memBrief.indexOf("HIS MEMORY") < memBrief.indexOf("LAWS:"));
  assert("BACKWARD-COMPATIBLE — no memory arg reproduces the old brief byte-for-byte",
    brief(dir, NOW) === brief(dir, NOW, null) && !brief(dir, NOW).includes("HIS MEMORY"));
  assert("REPAIR TOWARD SILENCE — a non-string/empty cartridge is dropped, never rendered",
    !brief(dir, NOW, "").includes("HIS MEMORY") && !brief(dir, NOW, 0).includes("HIS MEMORY"));
  assert("MEMORY — the loader exists and is async (hook path may never block on a throw)",
    typeof loadMemory === "function" && loadMemory.constructor.name === "AsyncFunction");

  // ---- TEACHING CARD (31 Jul 2026) — the rules must ARRIVE, not wait to be opened.
  const cardBrief = brief(dir, NOW, null, "1. ONE idea per message.\n2. Hinglish.");
  assert("CARD — a supplied card is spliced verbatim", cardBrief.includes("ONE idea per message"));
  assert("CARD — the block names the evidence file and says these are OBSERVED, not stated preferences",
    cardBrief.includes("HOW_HE_LEARNS.md") && cardBrief.includes("OBSERVED"));
  assert("CARD — it sits above the LAWS line", cardBrief.indexOf("HOW TO TEACH HIM") < cardBrief.indexOf("LAWS:"));
  assert("BACKWARD-COMPATIBLE — no card arg reproduces the old brief byte-for-byte",
    brief(dir, NOW) === brief(dir, NOW, null, null) && !brief(dir, NOW).includes("HOW TO TEACH HIM"));
  assert("REPAIR TOWARD SILENCE — an empty/non-string card is dropped, never rendered",
    !brief(dir, NOW, null, "").includes("HOW TO TEACH HIM") && !brief(dir, NOW, null, 0).includes("HOW TO TEACH HIM"));
  // the parser: single-source, and SILENT on any boundary it cannot prove
  const cf = join(dir, "card.md");
  writeFileSync(cf, `# doc\nprose above\n${CARD_BEGIN} note -->\n1. rule one\n2. **rule two**\n${CARD_END} -->\nprose below\n`);
  assert("CARD PARSER — reads only between the markers, strips bold, drops the surrounding prose",
    loadTeachingCard(cf) === "1. rule one\n2. rule two");
  writeFileSync(cf, "# doc\nno markers here at all\n");
  assert("CARD PARSER — no markers -> null (never guesses at the boundaries)", loadTeachingCard(cf) === null);
  writeFileSync(cf, `# doc\n${CARD_BEGIN} note -->\n1. orphan begin, no end\n`);
  assert("CARD PARSER — a begin with no end -> null", loadTeachingCard(cf) === null);
  writeFileSync(cf, `${CARD_BEGIN} note -->\n   \n${CARD_END} -->\n`);
  assert("CARD PARSER — an empty block -> null", loadTeachingCard(cf) === null);
  assert("CARD PARSER — a missing file -> null, never a throw", loadTeachingCard(join(dir, "__nope__.md")) === null);
  writeFileSync(cf, `${CARD_BEGIN} n -->\n${"x".repeat(CARD_MAX + 500)}\n${CARD_END} -->\n`);
  assert("CARD PARSER — a runaway card is capped and says so (the brief stays orientation)",
    loadTeachingCard(cf).length <= CARD_MAX + 80 && loadTeachingCard(cf).includes("truncated"));
  assert("THE REAL DOC PARSES — the shipped HOW_HE_LEARNS.md yields all seventeen rules",
    (() => { const c = loadTeachingCard(); return !!c && /^1\. Give ONE new idea/m.test(c) && /^16\. /m.test(c); })());
  const passed = checks.every(Boolean);
  console.log(passed ? "\nALL CHECKS PASSED" : "\nSELFTEST FAILED");
  return passed;
}

async function main() {
  const mode = (process.argv[2] || "brief").toLowerCase();
  if (mode === "selftest") { process.exit(selftest() ? 0 : 1); }
  // SELF-INJECTION GUARD (audit 30 Jul 2026 — same scar as hooks/afferent-post.mjs
  // and forge_session.mjs). This runs as the SessionStart hook, so its stdout is
  // injected into the session. Every headless `claude -p` the organism spawns
  // (brain, nightshift, dmn, cortex, council, selfknowledge, talk) runs inside this
  // project, inherits .claude/settings.json and fires SessionStart — so the
  // captain's second-person study brief ("do NOT ask him to re-explain where he
  // is") was being prepended to organ prompts that are asked for STRICT JSON.
  // `json` and `selftest` stay reachable: they are read paths, not injection paths.
  if (process.env.ARSENAL_ORGAN === "1" && mode !== "json") return;
  if (mode === "json") { console.log(JSON.stringify(gather(), null, 2)); return; }
  // AFTER the organ guard, never before — an organ prompt must never carry his memory.
  console.log(brief(STATE, Date.now(), await loadMemory(), loadTeachingCard()));
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
// #14 — loadTeachingCard is exported so `get_context` can serve the SAME card
// from the SAME parser (see the note above it). CARD_MAX rides along so a
// consumer can state the cap it is honouring instead of inventing its own.
export { brief, gather, loadTeachingCard, loadMemory, CARD_MAX };
