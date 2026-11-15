#!/usr/bin/env node
// ============================================================================
// scripts/exchanges.mjs · ARSENAL AI FC — THE ARCHIVE'S EXCHANGES (rung L1 · fate 57, MOVED IN)
// ----------------------------------------------------------------------------
// WHAT: R1's archive reader — the part of the out-of-repo build_exchanges.mjs (C:/Users/nikhi/arsenal-samjhao/,
//   fate 57: "MOVE into the organism as R1's archive reader", learning-loop.txt:68) that the note compiler needs,
//   moved in and pointed at the ARCHIVE instead of Claude Code's own transcript folder. The out-of-repo file is
//   not edited and keeps running on his hand.
//
//   WHAT MOVED (build_exchanges.mjs line numbers as carried):
//     · the block model — role (him / the teacher) and the text, in time order (:53-93)
//     · the system-block filter (:47-48) — applied PER BLOCK here (see FIXED below)
//     · the MECHANICAL latencies and the exchange counter, no judgement and no labels (:154-182):
//       gap_since_teacher_s, gap_since_his_last_s, teacher_reply_after_s, and an exchange that advances only
//       on his text
//   WHAT DID NOT MOVE, on purpose: session discovery over ~/.claude/projects (:95-122), the 100 KB / mtime /
//     session-start floors (:41-42, :101, :105) and the raw byte copies (:110-117). The archive already holds
//     every word in both directions with its provenance — lane `afferent`, his prompts as source
//     "claude-code" and the teacher's turns as source "claude-code-teaching" (thalamus.mjs:2714-2715) — so a
//     selector over transcript files would only re-create the slice the archive does not need.
//   FIXED ON THE WAY IN (the two measured defects of learning-loop.txt:68 a move must not carry):
//     · :75 dropped his WHOLE message whenever a system block rode in it. Here a record is ONE block; a
//       record whose own text IS a system block is skipped, and nothing else is.
//     · :132's de-dup key had no timestamp, so a repeated "haan" was deleted as a fork duplicate. Here the
//       key is the archive's own record id (`rid`); text is never a key, and a repeat is a datum.
//
// WHERE THE ARCHIVE IS: archivist.mjs's exported archiveRoot() ($ARSENAL_ARCHIVE, outside every git work tree,
//   archivist.mjs:86 / :1439-1450) and its IST day key. The bag's layout is the documented one
//   (data/<lane>/YYYY/MM/DD.jsonl, archivist.mjs:529-532 dayFile) — archivist exports no record reader
//   (its laneRecords generator at :573 is module-private), and the bag is written to be read without its
//   writer's code (archive_audit.mjs is the organism's other reader of it).
//
// LAWS: READ-ONLY — this file writes nothing, anywhere. TIER 0: no model, no network, no key. Never throws
//   past its door: an unreadable day file is NAMED in the result, a missing one is counted, a torn line is
//   skipped and counted.
// WHO ELSE COULD ACT ON THIS OUTPUT? notes_compiler.mjs · postmatch.mjs autoclose (THE DAY CLOSES ITSELF, row 873 (2):
//   sessionsNamedOn hands study_scope the sessions the archive names on a day, studyTurnsOfDay counts the CAPTURED STUDY
//   TURNS that decide whether a day closes at all) · any future reader of his study words (the re-teach render, the
//   interview layer) — through here, never a second reader.
// CLI: node scripts/exchanges.mjs day <YYYY-MM-DD> [--session <id>] [--json] | selftest
// ============================================================================
import { readFileSync, existsSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import { archiveRoot, istDayKey } from "./archivist.mjs";
import { HARNESS_WRAPPERS, HARNESS_MARKERS } from "./harness_text.mjs";   // row 858 (1): the harness's wrapper names, one home

export const WORD_LANE = "afferent";
export const BANK_LANE = "gaffer_grade_queue";
// Provenance, never modality (thalamus.mjs:340-356): `source` says WHO spoke. A voice afferent carries no source,
// so the voice modality IS its provenance (thalamus.mjs provenanceOf).
export const HIS_SOURCES = Object.freeze(["claude-code"]);
export const TEACHER_SOURCES = Object.freeze(["claude-code-teaching", "dugout-gaffer-teaching"]);
// build_exchanges.mjs:47-48's shape — applied to ONE block's own text, never to its whole message: start-anchored, `<name`
// for each harness wrapper, the prefix for each marker. THE NAMES ARE scripts/harness_text.mjs's (row 858 (1)): this reader
// keeps none of its own, so it knows cross-session-message (row 852 (2)) and every next wrapper the day the module does.
const reEscape = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const SYSTEM_BLOCK_RE = new RegExp(`^\\s*(${[...HARNESS_WRAPPERS.map((n) => `<${reEscape(n)}`), ...HARNESS_MARKERS.map(reEscape)].join("|")})`);
export const isSystemBlock = (t) => SYSTEM_BLOCK_RE.test(String(t || ""));

/** dayPath — the bag's documented layout (archivist.mjs:529-532). */
export function dayPath(root, lane, day) {
  const [y, m, d] = String(day).split("-");
  return join(root, "data", lane, y, m, `${d}.jsonl`);
}

/** istDaysBetween — every IST day key from `from` to `to` (inclusive), oldest first; [] on a bad clock. */
export function istDaysBetween(from, to) {
  const a = new Date(from), b = new Date(to);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime()) || a > b) return [];
  const first = istDayKey(a), last = istDayKey(b), out = [];
  for (let d = first, guard = 0; d <= last && guard < 4000; guard++) {
    out.push(d);
    d = new Date(Date.parse(`${d}T00:00:00Z`) + 86400000).toISOString().slice(0, 10);
  }
  return out;
}

/** readLaneDays — every parseable archive record of `lane` on the given IST days, in file order (= the lane's
 *  seq order). Never throws: { records, missing: [day], unreadable: [{day, why}], torn: n }. */
export function readLaneDays(lane, days, { root = archiveRoot() } = {}) {
  const records = [], missing = [], unreadable = [];
  let torn = 0;
  for (const day of days || []) {
    const p = dayPath(root, lane, day);
    if (!existsSync(p)) { missing.push(day); continue; }
    let text;
    try { text = readFileSync(p, "utf8"); } catch (e) { unreadable.push({ day, why: String((e && e.code) || (e && e.message) || e).slice(0, 80) }); continue; }
    for (const line of text.split(/\r?\n/)) {
      if (!line.trim()) continue;
      try { const r = JSON.parse(line); if (r && typeof r === "object" && !Array.isArray(r)) records.push(r); else torn++; } catch { torn++; }
    }
  }
  return { records, missing, unreadable, torn };
}

/** roleOf — "him" | "teacher" | null, from the record's payload provenance. */
export function roleOf(payload) {
  if (!payload || typeof payload !== "object") return null;
  const src = typeof payload.source === "string" ? payload.source : "";
  if (TEACHER_SOURCES.includes(src)) return "teacher";
  if (HIS_SOURCES.includes(src) || (!src && payload.modality === "voice")) return "him";
  return null;
}

const ms = (iso) => { const t = Date.parse(String(iso || "")); return Number.isFinite(t) ? t : null; };
const secs = (a, b) => +(((a - b) / 1000).toFixed(1));

/** exchanges — PURE. Archive records → the time-ordered word stream of one study scope, with
 *  build_exchanges.mjs's mechanical latencies. A record is kept iff it is a word (his or the teacher's),
 *  its own text is not a system block, its instant lies in [from, to] (either bound may be null), and it is
 *  in scope: its session_id is one of `sessions` when sessions are given, else its stamped moment names
 *  `concept` (the hook stamps forge_concept at write time, archivist.mjs:371-385).
 *  Each row: { n, exchange, rid, sha256, at, ist, role, source, session_id, text, gap_since_teacher_s?,
 *  gap_since_his_last_s?, teacher_reply_after_s? }. */
export function exchanges(records, { from = null, to = null, sessions = null, concept = null } = {}) {
  const lo = from ? ms(from) : null, hi = to ? ms(to) : null;
  const scope = Array.isArray(sessions) && sessions.length ? new Set(sessions) : null;
  const want = concept ? String(concept).toLowerCase() : null;
  const kept = [];
  for (const rec of records || []) {
    if (!rec || typeof rec !== "object" || !rec.payload) continue;
    const p = rec.payload, role = roleOf(p);
    if (!role) continue;
    const text = typeof p.text === "string" ? p.text : "";
    if (!text.trim() || isSystemBlock(text)) continue;
    const t = ms(rec.ts_utc || p.ts);
    if (t === null || (lo !== null && t < lo) || (hi !== null && t > hi)) continue;
    if (scope) { if (!scope.has(p.session_id)) continue; }
    else if (want) { const m = p.moment || rec.moment; if (!m || String(m.forge_concept || "").toLowerCase() !== want) continue; }
    kept.push({ rec, p, role, text, t });
  }
  kept.sort((a, b) => a.t - b.t || (a.rec.seq || 0) - (b.rec.seq || 0));
  let exch = 0, prevTeacherAt = null, lastHim = null;
  return kept.map(({ rec, p, role, text, t }, i) => {
    const row = { n: i + 1, exchange: exch, rid: rec.rid || null, sha256: rec.sha256 || null, at: new Date(t).toISOString(),
      ist: rec.ts_local || p.ts_local || null, role, source: p.source || p.modality || null, session_id: p.session_id || null, text };
    if (role === "him") {
      exch++; row.exchange = exch;
      if (prevTeacherAt !== null) row.gap_since_teacher_s = secs(t, prevTeacherAt);
      if (lastHim !== null) row.gap_since_his_last_s = secs(t, lastHim);
      lastHim = t;
    } else {
      if (lastHim !== null) row.teacher_reply_after_s = secs(t, lastHim);
      prevTeacherAt = t;
    }
    return row;
  });
}

// ---------------------------------------------------------------------------
// THE DAY'S STUDY EVIDENCE (mclose · row 873 (2), SPEC §1 items 2-3, ruled by row 877)
// ---------------------------------------------------------------------------
/** sessionsNamedOn — PURE READ. The Claude Code sessions the archive NAMES on one IST day: every session_id on one of HIS
 *  rows (HIS_SOURCES) in that day's afferent file. Evidence (c) of study_scope.studySessionsOfDay is handed this list — the
 *  leaf never learns where the archive lives. Never throws: { day, sessions, missing, unreadable, torn }. */
export function sessionsNamedOn(day, { root = archiveRoot() } = {}) {
  const r = readLaneDays(WORD_LANE, [day], { root });
  const ids = new Set();
  for (const rec of r.records) {
    const p = rec && rec.payload;
    if (p && HIS_SOURCES.includes(p.source) && typeof p.session_id === "string" && p.session_id) ids.add(p.session_id);
  }
  return { day, sessions: [...ids], missing: r.missing, unreadable: r.unreadable, torn: r.torn };
}

/** studyTurnsOfDay — PURE READ. THE CAPTURED STUDY TURNS of one IST day: his rows of lane afferent in that day's file (source
 *  claude-code), whose session is in `sessions`, whose own text is not a system block (scripts/harness_text.mjs's names, the
 *  isSystemBlock above) and carries at least 3 non-space characters (the capture hook's own floor for his text). A day closes
 *  itself only on at least one (L5: no evidence, no run). The rows of his OTHER sessions that day are counted apart
 *  (`outside`), never folded in. Never throws: { day, turns, last_ts, per_session, outside, system_blocks, short, undated,
 *  missing, unreadable, torn } — last_ts is the newest kept turn's archive instant (ISO), null when there is none. */
export function studyTurnsOfDay(day, sessions, { root = archiveRoot() } = {}) {
  const set = new Set((Array.isArray(sessions) ? sessions : []).filter((s) => typeof s === "string" && s));
  const r = readLaneDays(WORD_LANE, [day], { root });
  const per = {};
  for (const s of set) per[s] = 0;
  let turns = 0, last = null, outside = 0, systemBlocks = 0, short = 0, undated = 0;
  for (const rec of r.records) {
    const p = rec && rec.payload;
    if (!p || !HIS_SOURCES.includes(p.source)) continue;
    if (!set.has(p.session_id)) { outside++; continue; }
    const text = typeof p.text === "string" ? p.text : "";
    if (isSystemBlock(text)) { systemBlocks++; continue; }
    if (text.replace(/\s+/g, "").length < 3) { short++; continue; }
    turns++;
    per[p.session_id]++;
    const t = ms(rec.ts_utc || p.ts);
    if (t === null) { undated++; continue; }
    if (last === null || t > last) last = t;
  }
  return { day, turns, last_ts: last === null ? null : new Date(last).toISOString(), per_session: per, outside, system_blocks: systemBlocks, short, undated,
    missing: r.missing, unreadable: r.unreadable, torn: r.torn };
}

// ---------------------------------------------------------------------------
// SELFTEST — a temp archive written by archivist's OWN writer, never his
// ---------------------------------------------------------------------------
async function selftest() {
  let pass = 0, fail = 0;
  const assert = (name, cond, detail = "") => { if (cond) { pass++; console.log(`  ok   ${name}`); } else { fail++; console.log(`  FAIL ${name}${detail ? `\n         ${detail}` : ""}`); } };
  console.log("=== EXCHANGES SELFTEST — the archive reader moved in from build_exchanges.mjs (fate 57) ===\n");
  const { runArchive, initArchive } = await import("./archivist.mjs");
  const tmp = mkdtempSync(join(tmpdir(), "arsenal-exchanges-test-"));
  try {
    const arc = join(tmp, "archive"), repo = join(tmp, "repo"), lane = join(repo, "dressing-room", "state", "afferent.jsonl");
    mkdirSync(join(repo, "dressing-room", "state"), { recursive: true });
    initArchive({ root: arc, repo, quiet: true, warn: () => {} });   // archivist's own init, pinned to the temp repo (its selftest's shape, archivist.mjs:2323/:2336)
    const S = "f1c7e000-0000-4000-8000-0000000000aa", E = "f1c7e000-0000-4000-8000-0000000000ee";
    const at = (m) => new Date(Date.UTC(2026, 9, 6, 4, m, 0)).toISOString();   // 09:30 IST onwards, 6 Oct
    const row = (m, source, text, session = S, extra = {}) => ({ event_id: `e${m}${source.length}`, modality: "code", source, surface: "claude-code", session_id: session,
      text, tier: "private", moment: { forge_step: 3, forge_concept: "tokenization", cwd: "x" }, v: 3, ts: at(m), ...extra });
    const rows = [
      row(0, "claude-code", "haan"),
      row(1, "claude-code-teaching", "token ek tukda hai — haan ya nahi?"),
      row(2, "claude-code", "<system-reminder>a reminder, not his words</system-reminder>"),
      row(3, "claude-code", "haan"),                                       // a REPEAT — a datum, never a duplicate
      row(4, "claude-code", "architect, run the fleet", E, { moment: { forge_step: 3, forge_concept: "tokenization" } }),   // engineering, same minutes
      row(5, "activitywatch", "claude.exe 5m"),
      row(6, "claude-code-teaching", "sahi."),
    ];
    writeFileSync(lane, rows.map((r) => JSON.stringify(r)).join("\n") + "\n");
    const w = runArchive({ root: arc, repo, quiet: true, warn: () => {} });
    assert("FIXTURE — archivist's OWN writer archived the seeded lane into a temp bag (no record is hand-written)", w && w.ok !== false && existsSync(dayPath(arc, WORD_LANE, "2026-10-06")), JSON.stringify(w).slice(0, 200));
    const read = readLaneDays(WORD_LANE, ["2026-10-05", "2026-10-06"], { root: arc });
    assert("READ — the day file in the bag's layout; a missing day is counted, never fatal", read.records.length === rows.length && read.missing.join() === "2026-10-05" && !read.unreadable.length);
    assert("READ — every record carries archivist's provenance (rid, sha256, ts_utc, payload byte-for-byte)",
      read.records.every((r) => typeof r.rid === "string" && typeof r.sha256 === "string" && typeof r.ts_utc === "string" && r.payload && typeof r.payload.text === "string"));
    const ex = exchanges(read.records, { sessions: [S] });
    assert("SCOPE — the study session only: another session's prompt in the same minutes is NOT his study word", ex.every((x) => x.session_id === S) && !ex.some((x) => /fleet/.test(x.text)));
    assert("FIXED :75 — a system block is skipped as ONE block; his own words around it survive", !ex.some((x) => isSystemBlock(x.text)) && ex.filter((x) => x.role === "him").length === 2);
    // rows 852 (2) / 858: EVERY name of scripts/harness_text.mjs at the START of a block is the harness's; a sentence of his that
    // names one mid-text is HIS. Built from the module's own lists (the next wrapper is planted the day it is added), plus the
    // one name row 852 (2) ruled this reader must gain, typed, so a module that lost it reds here too.
    const atStart = [...HARNESS_WRAPPERS.map((n) => `<${n} id="x1">\nnot his words\n</${n}>`), ...HARNESS_MARKERS.map((m) => `${m} by user]`)];
    const midText = [...HARNESS_WRAPPERS.map((n) => `dekho yeh <${n}> kya hota hai`), ...HARNESS_MARKERS.map((m) => `maine ${m} by user] dekha`)];
    assert("HARNESS NAMES (row 858) — every name of scripts/harness_text.mjs at the START of a block is a system block (each wrapper, attributes allowed, and each marker)",
      HARNESS_WRAPPERS.length > 0 && HARNESS_MARKERS.length > 0 && atStart.every((x) => isSystemBlock(x)), atStart.filter((x) => !isSystemBlock(x)).join(" | "));
    assert("HARNESS NAMES (row 858 (3)) — a sentence of his that only NAMES one mid-text is NOT a system block: his words stay his",
      midText.every((x) => !isSystemBlock(x)), midText.filter((x) => isSystemBlock(x)).join(" | "));
    assert("ROW 852 (2) — a <cross-session-message …> block (another session's message, attributes and all) is a system block: the name every list missed on 13 Nov",
      isSystemBlock('<cross-session-message from="session_b2">\nlane V asks: is the unit landed?\n</cross-session-message>') && !isSystemBlock("maine <cross-session-message> ka matlab poocha"));
    assert("FIXED :132 — a repeated \"haan\" is a datum, never a de-dup casualty (the key is the archive's rid, never the text)",
      ex.filter((x) => x.text === "haan").length === 2 && new Set(ex.map((x) => x.rid)).size === ex.length);
    assert("ROLES — provenance, never modality: an activitywatch row is nobody's word", ex.every((x) => x.role === "him" || x.role === "teacher") && !ex.some((x) => /claude\.exe/.test(x.text)));
    const t = ex.find((x) => x.text.startsWith("token")), h2 = ex.filter((x) => x.role === "him")[1], last = ex[ex.length - 1];
    assert("LATENCIES — build_exchanges.mjs's mechanical three, from the archive's own clock",
      t?.teacher_reply_after_s === 60 && h2?.gap_since_teacher_s === 120 && h2?.gap_since_his_last_s === 180 && last?.teacher_reply_after_s === 180 && h2?.exchange === 2);
    assert("ORDER — time order, and every row names its archive record (rid) and its IST wall clock",
      ex.every((x, i) => i === 0 || x.at >= ex[i - 1].at) && ex.every((x) => x.rid && typeof x.ist === "string" && /\+05:30$/.test(x.ist)));
    const byConcept = exchanges(read.records, { concept: "tokenization" });
    assert("NO HOST BOUND — the fallback scope is the stamped concept, and it SAYS less than a host does (the engineering row rides it)",
      byConcept.length === ex.length + 1 && byConcept.some((x) => /fleet/.test(x.text)));
    const win = exchanges(read.records, { sessions: [S], from: at(1), to: at(3) });
    assert("WINDOW — [from, to] bounds are inclusive and exact", win.length === 2 && !!win[0]?.text?.startsWith("token") && win[1]?.text === "haan");
    assert("NEVER THROWS — an absent archive root reads as missing days", (() => { const r = readLaneDays(WORD_LANE, ["2026-10-06"], { root: join(tmp, "nope") }); return r.records.length === 0 && r.missing.length === 1; })());
    // ── mclose (row 873 (2)) — THE DAY'S STUDY EVIDENCE: a second day, seeded and archived by archivist's OWN writer ──
    const S2 = "f1c7e000-0000-4000-8000-0000000000bb", E2 = "f1c7e000-0000-4000-8000-0000000000cc";
    const at7 = (m) => new Date(Date.UTC(2026, 9, 7, 4, m, 0)).toISOString();   // 7 Oct, 09:30 IST onwards
    const day7 = [
      row(100, "claude-code", "ok", S2, { ts: at7(0) }),                                                         // 2 non-space characters: under the floor
      row(101, "claude-code", "<task-notification>\n<task-id>x1</task-id>\n</task-notification>", S2, { ts: at7(1) }),   // the harness's, never his
      row(102, "claude-code", "embeddings kya hote hain, ek vector?", S2, { ts: at7(2) }),
      row(103, "claude-code-teaching", "haan — ek vector, har token ka.", S2, { ts: at7(3) }),                    // the teacher's: never a turn of his
      row(104, "claude-code", "runner, land the unit", E2, { ts: at7(4) }),                                        // his ENGINEERING session, same day
      row(105, "claude-code", "  h i  ", S2, { ts: at7(5) }),                                                     // 2 non-space characters, spaced out
      row(106, "claude-code", "abc", S2, { ts: at7(6) }),                                                         // exactly 3: kept
    ];
    writeFileSync(lane, [...rows, ...day7].map((r) => JSON.stringify(r)).join("\n") + "\n");
    runArchive({ root: arc, repo, quiet: true, warn: () => {} });
    const t7 = studyTurnsOfDay("2026-10-07", [S2], { root: arc });
    assert("STUDY TURNS (mclose) — his rows of the day in the session set, not a system block, ≥ 3 non-space characters; the floor, the harness block and the teacher counted apart",
      t7.turns === 2 && t7.short === 2 && t7.system_blocks === 1 && t7.per_session[S2] === 2, JSON.stringify(t7));
    assert("STUDY TURNS (mclose) — last_ts is the newest KEPT turn's archive instant; his engineering session that day is counted apart (outside), never folded in",
      t7.last_ts === at7(6) && t7.outside === 1 && !t7.missing.length, JSON.stringify(t7));
    const named7 = sessionsNamedOn("2026-10-07", { root: arc });
    assert("SESSIONS NAMED (mclose) — every session his rows name that day, study and engineering alike (the transcript decides, not this reader)",
      named7.sessions.length === 2 && named7.sessions.includes(S2) && named7.sessions.includes(E2), JSON.stringify(named7));
    const drained = row(107, "claude-code", "aur dimension kitni hoti hai?", S2, { ts: at7(7) });   // a turn the hook lost, archived later (mcap's drain)
    writeFileSync(lane, [...rows, ...day7, drained].map((r) => JSON.stringify(r)).join("\n") + "\n");
    runArchive({ root: arc, repo, quiet: true, warn: () => {} });
    const t7b = studyTurnsOfDay("2026-10-07", [S2], { root: arc });
    assert("STUDY TURNS (mclose) — ONE drained turn, archived later, raises the count by exactly one and moves last_ts to it",
      t7b.turns === t7.turns + 1 && t7b.last_ts === at7(7), JSON.stringify({ before: t7.turns, after: t7b.turns, last: t7b.last_ts }));
    const his7 = [...day7, drained].filter((r) => HIS_SOURCES.includes(r.source)).length;   // DERIVED from the plant, never typed
    const none7 = studyTurnsOfDay("2026-10-07", [], { root: arc }), gone = studyTurnsOfDay("2026-10-07", [S2], { root: join(tmp, "nope") });
    assert("STUDY TURNS (mclose) — no session, no turn (every row of his is outside); an absent root is a missing day, never a throw",
      none7.turns === 0 && none7.last_ts === null && none7.outside === his7 && gone.turns === 0 && gone.missing.join() === "2026-10-07", JSON.stringify({ his7, none7, gone }));
  } catch (e) { fail++; console.log(`  CRASH the selftest threw — ${String((e && e.message) || e).slice(0, 200)} (a crash is never a pass)`); }
  finally { rmSync(tmp, { recursive: true, force: true }); }
  console.log(`\nexchanges selftest: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
const flag = (argv, k) => { const i = argv.indexOf(k); return i >= 0 ? (argv[i + 1] ?? "") : null; };
async function main() {
  const [mode, ...rest] = process.argv.slice(2);
  if (mode === "selftest") return selftest();
  if (mode === "day") {
    const day = rest[0] || istDayKey(new Date());
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) { console.error("exchanges: day YYYY-MM-DD [--session <id>] [--json]"); process.exitCode = 2; return; }
    const r = readLaneDays(WORD_LANE, [day]);
    const session = flag(rest, "--session");
    const ex = exchanges(r.records, session ? { sessions: [session] } : {});
    if (rest.includes("--json")) { console.log(JSON.stringify({ day, root: archiveRoot(), missing: r.missing, unreadable: r.unreadable, torn: r.torn, exchanges: ex }, null, 1)); return; }
    console.log(`exchanges: ${day} IST · ${ex.length} word(s) (${ex.filter((x) => x.role === "him").length} his · ${ex.filter((x) => x.role === "teacher").length} the teacher's)${session ? ` · session ${session.slice(0, 8)}` : " · every session"}${r.missing.length ? " · no day file in the archive" : ""}${r.unreadable.length ? ` · UNREADABLE ${r.unreadable[0].why}` : ""}`);
    return;
  }
  console.log("exchanges: day <YYYY-MM-DD> [--session <id>] [--json] | selftest   (READ-ONLY over $ARSENAL_ARCHIVE)");
  if (mode) process.exitCode = 2;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
