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
// WHO ELSE COULD ACT ON THIS OUTPUT? notes_compiler.mjs (its only caller today) · any future reader of his
//   study words (the re-teach render, the interview layer) — through here, never a second reader.
// CLI: node scripts/exchanges.mjs day <YYYY-MM-DD> [--session <id>] [--json] | selftest
// ============================================================================
import { readFileSync, existsSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import { archiveRoot, istDayKey } from "./archivist.mjs";

export const WORD_LANE = "afferent";
export const BANK_LANE = "gaffer_grade_queue";
// Provenance, never modality (thalamus.mjs:340-356): `source` says WHO spoke. A voice afferent carries no source,
// so the voice modality IS its provenance (thalamus.mjs provenanceOf).
export const HIS_SOURCES = Object.freeze(["claude-code"]);
export const TEACHER_SOURCES = Object.freeze(["claude-code-teaching", "dugout-gaffer-teaching"]);
// build_exchanges.mjs:47-48, verbatim pattern — applied to ONE block's own text, never to its whole message.
export const isSystemBlock = (t) => /^\s*(<(task-notification|system-reminder)|\[Request interrupted)/.test(String(t || ""));

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
