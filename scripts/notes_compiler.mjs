#!/usr/bin/env node
// ============================================================================
// scripts/notes_compiler.mjs · ARSENAL AI FC — THE NOTE COMPILER AND ITS COLD GATE (rung L1 · fates 49, 50, 51, 57)
//   SOLE WRITER of dressing-room/state/compiled_notes.jsonl (SOLE WRITER: scripts/notes_compiler.mjs)
// ----------------------------------------------------------------------------
// WHY: his notes design (NOTES_DESIGN__2026-09-23, forks rows 262 / 550 (2)): P1 THE NOTE IS COMPILED, NEVER
//   WRITTEN. The archive holds every word of every study session in both directions; until this file nothing
//   compiled it (row 239), the hand-written block died on 7 Sep, and the day meter printed "notes not born"
//   (row 295). A better compiler RECOMPILES from the same source; a note can only be "not compiled yet", never
//   "lost because nobody wrote it down".
//
// LAWS:
//   · SOLE WRITER of dressing-room/state/compiled_notes.jsonl (row 550 (2) F4: the organism repo, ONE sole
//     writer = this file, git-versioned). APPEND-ONLY in the rung witness's two row kinds (forks row 551 (1),
//     cloud/ml1/witness/rung_L1.mjs CLASS A):
//       {v:1, kind:"compiled",  id, ts, day, concept, axis, compiler, sources[], note, content_sha, supersedes?}
//       {v:1, kind:"cold_gate", id, of, ts, day, verdict:"pass"|"fail", traps_named[], reader, role, model, effort, via, …}
//       {v:1, kind:"cold_gate", id, of, ts, day, verdict:"absent", traps_named:[], reader, role, cause, why}   (row 774 (2))
//     `day` (row 883 (1), A ROW ABOUT A DAY CARRIES THAT DAY): a compiled row's is the IST day it was compiled FOR, a gate
//     row's is its note's; ts stays the clock. Every day reader keys by noteDay(), a row without `day` by the IST day of ts.
//     An ABSENT row is a named non-verdict: the cold read could not run (cause ∈ ABSENT_CAUSES). It is never a
//     pass, the rung reads it RED, and the next gate reads that note again.
//     No id repeats. A compiled row NEVER carries a verdict: the gate APPENDS its own row naming the note
//     (`of`). A recompile APPENDS a compiled row whose `supersedes` names the older one; the older row stays
//     byte-identical on the ledger (L9) and leaves the live set. `sources[]` are the archive record ids (rid)
//     the compile read — a note with no source is never written.
//   · TIER 0 over the ARCHIVE through scripts/exchanges.mjs (fate 57: build_exchanges.mjs MOVED in as R1's
//     archive reader) — no model, no network, no key in the compile. The only model call is the cold gate,
//     and only through scripts/models.mjs's role (LAW M: no model literal here).
//   · THE CORRECTIONS LANE IS READ FIRST (NOTES_DESIGN §6, row 277 (b)): scripts/notes_corrections.mjs's live
//     rows are loaded before anything else, and a compile REFUSES when the lane exists but cannot be read. A
//     corrected claim is never served as truth: every rendered line that states it carries ⟦CORRECTED <id>⟧,
//     and the correction itself becomes a trap of the note.
//   · [N] AND [T] NEVER MIXED (G-B): an [N] item is ONE of his archive records, verbatim, with its archive
//     timestamp and rid; a [T] item is ONE of the teacher's records. Character fidelity: stored text is never
//     normalised (₹ stays ₹, — stays —); only a render folds a newline into ⏎.
//   · CAPSULES ARE IMMUTABLE — read through rejirah.mjs loadCapsules, never written. THE GIST IS NEVER WRITTEN
//     (F2). brief_log.jsonl is L6's and is never touched.
//   · A FAILED APPEND RETURNS ok:false, loud — never a bare catch that reports ok: the row is read back off the
//     disk before ok:true is said (resume_pointer.mjs's appendChecked, the sl2 bank-write rule).
//   · THE CARVE-OUTS STAND (F4: never another person's name, never a credential, in this tracked lane): every
//     row passes the organism's own names guard BEFORE it is appended — hooks/pre-commit BELT 3's gitleaks with
//     its config precedence (.gitleaks.local.toml, gitignored, holds the names; else .gitleaks.toml). A finding
//     refuses the row (nothing written, only the verdict printed — never the content). Where gitleaks is not
//     installed the guard is OFF and says so (the hook's own fail-open posture); BELT 3 stays the belt at commit.
//   · THE TRANSPORT LAW (claudegen.mjs:460): the gate runs at full-time (or on demand), ONE fresh-model call per
//     compiled axis note that has no verdict yet — a handful a day, never per turn.
//
// THE COMPILE (TIER 0), per axis of a study day D:
//   WINDOW  — forge_session.mjs's stamps: an axis runs from each declaration in its append-only
//             `axes_now_history` (every `axis x now`, re-declares included; ml1 F-5, row 777), else from the
//             first-`now` stamp `axes_now_at[x]` (a session written before the history), to its mark
//             (`axes_marked_at[x].at`, when it falls inside), or to the next declaration of ANOTHER axis, or to the
//             session's end, or now — from forge_session.json (the open session) and forge_sessions.jsonl (closed
//             ones). A return to an axis after another was declared opens a NEW window for it.
//   SCOPE   — G0's study session (study_scope.mjs:18): the open sitting's host_session_id, plus the sessions this
//             axis's previous note already used, plus any `--session` named for a back-fill. With no host bound
//             anywhere, the stamped concept is the scope, and the note SAYS so (a weaker scope).
//   WORDS   — lane `afferent` of the archive (his prompts "claude-code", the teacher's turns
//             "claude-code-teaching"), through exchanges.mjs; the BANK — lane `gaffer_grade_queue` (capture rows
//             of the concept/axis in the window, with their settled verdicts).
//   ITEMS   — his pehle-guess with its gut-word (the first gut-bearing answer) · each crack: the teacher's ```diff
//             block (- galat / + sahi, the crack marker, NOTES_DESIGN P4) with the answer that cracked and the
//             stuck-story after it · his hand-trace (an answer carrying two or more numbers he typed) · his Bolo
//             (the answer after the teacher asks for it) · the teacher's [T] layers by the skeleton markers
//             ([DUKAAN] [ASLI NAAM] [TECHNICAL LINE], teaching_bar.mjs:339-342) · each check (the LAST question
//             of a teaching turn, :345) and his answer · the bank receipts (asked · said · gut · latency · verdict).
//   TRAPS   — the cracks, the live corrections, then the capsule's traps — numbered T1…Tn; the cold reader maps
//             its seductive wrong answers onto these ids.
//   A note whose content AND day are unchanged since its live row (same content_sha, same day) is not appended again;
//   the same content asked for another day is RE-KEYED by a superseding row (row 883 (1)).
//
// THE COLD GATE (G-A with G-C, fate 50): ONE fresh-model reader given ONLY the rendered note: (1) answer the
//   axis strike; (2) name the three most seductive WRONG answers, each mapped to the trap of the note that
//   already names it; (3) say whether the note REBUILDS the idea or only reminds. PASS iff the strike is
//   answered from the note alone, all three wrong answers are DISTINCT traps of the note, and it rebuilds;
//   else FAIL and the note goes back to the compiler (a recompile supersedes it). `traps_named` = the traps
//   the reader named. The reader is models.mjs's role "cold_reader" through claudegen.mjs (a fresh `claude -p`
//   per call, no tools); STUBBED on a seat by the flag ARSENAL_COLD_READER=stub (or `--stub`), which writes
//   reader:"stub" — the rung witness refuses a stub outside --fixture. A read that cannot run (the role is
//   unresolved, claude -p refused, the window closed, the call failed, no JSON came back) writes a NAMED absence
//   row with its cause (forks row 774 (2)) — never silence: a note with no verdict and no reason is the mirror class.
//
// THE ANCHOR (fates 22 / 51): postmatch.mjs fires `fulltime --date <the day it closed>` right after the day is
//   closed (post_match/<date>.md written) — the archive's own `run` first, then the compile, then the gate.
//   On demand: `compile` (back-fill) and `gate`. The one-screen batch-glance for his ONE haan (G-D): `glance`.
//
// WHO ELSE COULD ACT ON THIS OUTPUT? daily_green.mjs clause 3 (registry emit_contract "note_blocks" →
//   compiled_notes.jsonl, no meter change) · the morning brief (L6: an asked-first strike from a gate-passed
//   note, C22) · the full-time skill (the glance, lane S) · a future re-teach / interview render (same source).
// CLI: node scripts/notes_compiler.mjs compile [--date D] [--concept c] [--axis x] [--session <id>]…
//        | gate [--date D] [--stub] [--again] | fulltime [--date D] [--stub] [--no-archive-run]
//        | glance [--date D] | status | born | selftest          (D = an IST day YYYY-MM-DD, default today)
//   born = the ledger's birth at its landing (forks row 787 (1)): created EMPTY iff absent, never truncated.
// ============================================================================
import { readFileSync, appendFileSync, existsSync, mkdirSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { tmpdir } from "node:os";
import { createHash, randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { archiveRoot, istDayKey } from "./archivist.mjs";
import { readLaneDays, exchanges, istDaysBetween, WORD_LANE, BANK_LANE } from "./exchanges.mjs";
import { readRows as readCorrectionRows, active as liveCorrections, matchesIn, LEDGER as CORRECTIONS } from "./notes_corrections.mjs";
import { loadCapsules } from "./rejirah.mjs";   // the capsules' reader — read only, capsules are immutable

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const STATE_DIR = join(ROOT, "dressing-room", "state");
export const LEDGER = join(STATE_DIR, "compiled_notes.jsonl");
export const VERSION = "1.0.0";
export const COMPILER = `notes_compiler.mjs@${VERSION}`;
export const READER_ROLE = "cold_reader";        // the models.mjs CLAUDE_ROLES row this gate asks for (LAW M)
export const STUB_ENV = "ARSENAL_COLD_READER";   // "stub" ⇒ the stubbed reader, reader:"stub" on the row
export const GITLEAKS_CONFIGS = Object.freeze([".gitleaks.local.toml", ".gitleaks.toml"]);   // hooks/pre-commit BELT 3's precedence
const AXES = "abcdefghi".split("");
const GUT_RE = /\b(knew|shaky|guessed)\b/i;
const DIFF_RE = /```diff[^\n]*\n([\s\S]*?)```/g;
const LAYER_RE = /^\s*(?:[-*>]\s*)?(?:\[|\*\*)?\s*(DUKAAN|ASLI NAAM|TECHNICAL LINE)\s*(?:\]|\*\*)?\s*[:—–-]?\s*(.*)$/i;
const LAYER_KIND = { "dukaan": "dukaan", "asli naam": "asli_naam", "technical line": "technical_line" };

const newId = (prefix, now) => `${prefix}-${now.getTime().toString(36)}-${randomBytes(3).toString("hex")}`;
const clip = (s, n) => { const t = String(s == null ? "" : s).replace(/\s+/g, " ").trim(); return t.length > n ? t.slice(0, n - 1) + "…" : t; };
const sha256 = (s) => createHash("sha256").update(String(s), "utf8").digest("hex");
const readJson = (p) => { try { return JSON.parse(readFileSync(p, "utf8")); } catch { return null; } };
const readJsonl = (p) => { if (!existsSync(p)) return []; const out = []; for (const l of readFileSync(p, "utf8").split(/\r?\n/)) { if (!l.trim()) continue; try { const o = JSON.parse(l); if (o && typeof o === "object") out.push(o); } catch { /* torn */ } } return out; };
export const istDay = (iso) => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? null : istDayKey(d); };
/** noteDay — the IST study day a row is ABOUT (row 883 (1): a row about a day carries that day): its `day`, else, for a row
 *  written before `day` existed, the IST day of its ts. Every day reader of the ledger keys by this, never by the clock alone. */
export const noteDay = (r) => (r && typeof r.day === "string" && r.day) || istDay(r && r.ts);
/** "YYYY-MM-DD HH:MM:SS IST" — the wall clock of an archive instant (IST is +05:30, no DST). */
export const istStampOf = (iso) => { const t = Date.parse(String(iso || "")); return Number.isFinite(t) ? new Date(t + 330 * 60000).toISOString().replace("T", " ").slice(0, 19) + " IST" : null; };
const todayIst = () => istDayKey(new Date());

// ---------------------------------------------------------------------------
// READ — the ledger (a torn line is skipped, never fatal)
// ---------------------------------------------------------------------------
/** readRows — every parseable row in ledger order. Absent ⇒ []. Throws only when the file EXISTS and cannot be read. */
export function readRows(path = LEDGER) {
  if (!existsSync(path)) return [];
  const out = [];
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    if (!line.trim()) continue;
    try { const o = JSON.parse(line); if (o && typeof o === "object" && !Array.isArray(o)) out.push(o); } catch { /* a torn line is skipped */ }
  }
  return out;
}
/** noteState — PURE: compiled rows, gate rows, the superseded set, the live notes, and each note's latest gate. */
export function noteState(rows) {
  const compiled = (rows || []).filter((r) => r && r.kind === "compiled" && typeof r.id === "string");
  const gates = (rows || []).filter((r) => r && r.kind === "cold_gate" && typeof r.of === "string");
  const superseded = new Set(compiled.map((r) => r.supersedes).filter((s) => typeof s === "string" && s));
  const live = compiled.filter((r) => !superseded.has(r.id));
  const lastGate = (id) => gates.filter((g) => g.of === id).at(-1) || null;
  return { compiled, gates, superseded, live, lastGate };
}
/** latestLive — the newest live compiled row of (concept, axis), or null. */
export const latestLive = (rows, concept, axis) => noteState(rows).live.filter((r) => r.concept === concept && r.axis === axis).at(-1) || null;

// ---------------------------------------------------------------------------
// APPEND — guarded (the carve-outs) and checked (read back), or ok:false
// ---------------------------------------------------------------------------
function appendChecked(path, row) {
  const line = JSON.stringify(row);
  try {
    mkdirSync(dirname(path), { recursive: true });
    const before = existsSync(path) ? readFileSync(path, "utf8") : "";
    appendFileSync(path, (before && !before.endsWith("\n") ? "\n" : "") + line + "\n", "utf8");
  } catch (e) {
    return { ok: false, why: `append failed (${String((e && e.message) || e).slice(0, 160)})` };
  }
  try {
    const back = readFileSync(path, "utf8").split(/\r?\n/).filter((l) => l.trim());
    if (back[back.length - 1] !== line) return { ok: false, why: "the row is not on disk after the append (read-back mismatch)" };
  } catch (e) {
    return { ok: false, why: `read-back failed (${String((e && e.message) || e).slice(0, 160)})` };
  }
  return { ok: true };
}
// BORN (forks row 787 (1), 17 Oct 2026) — every state file a landing gives birth to is BORN by its sole writer at the
// landing (an empty JSONL is lawful) and ADDED by pathspec, so the groundsman's `add -u` carries it from then on; a file
// nobody adds is a file the remote never sees. Exclusive create (flag "wx"): EMPTY, never truncates, and a ledger that
// already exists is never written — its rows are the record.
/** born — create the ledger EMPTY iff absent: {ok, op:"born"|"refused", path, why?}. */
export function born(path = LEDGER) {
  if (existsSync(path)) return { ok: false, op: "refused", path, why: "the ledger already exists — born never truncates and never writes a ledger that exists" };
  try { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, "", { encoding: "utf8", flag: "wx" }); }
  catch (e) { return { ok: false, op: "refused", path, why: `exclusive create failed (${clip((e && e.message) || e, 160)})` }; }
  let size = -1;
  try { size = readFileSync(path).length; } catch (e) { return { ok: false, op: "refused", path, why: `read-back failed (${clip((e && e.message) || e, 160)})` }; }
  return size === 0 ? { ok: true, op: "born", path } : { ok: false, op: "refused", path, why: `read-back: ${size} byte(s), not an empty ledger` };
}
/** runGitleaks — the organism's names guard over ONE row, through stdin; its output is never printed. */
function runGitleaks(text, config) {
  const r = spawnSync("gitleaks", ["stdin", "--no-banner", "--redact", ...(config ? ["--config", config] : [])], { input: text, encoding: "utf8", timeout: 60000, windowsHide: true });
  if (r.error && r.error.code === "ENOENT") return { ran: false, why: "gitleaks not found — the guard is OFF here; hooks/pre-commit BELT 3 stays the belt at commit" };
  if (r.error) return { ran: true, code: -1, why: clip(r.error.message, 120) };
  return { ran: true, code: r.status };
}
/** namesGuard — hooks/pre-commit BELT 3's guard over one row before it is appended: {ran, ok, why}. */
export function namesGuard(text, { root = ROOT, run = runGitleaks } = {}) {
  const config = GITLEAKS_CONFIGS.map((f) => join(root, f)).find((p) => existsSync(p)) || null;
  const r = run(String(text), config);
  if (!r || !r.ran) return { ran: false, ok: true, why: (r && r.why) || "the guard did not run" };
  const cfg = config ? basename(config) : "gitleaks defaults";
  return r.code === 0 ? { ran: true, ok: true, why: `clean (${cfg})` }
    : { ran: true, ok: false, why: r.code === 1 ? `a finding in the row (${cfg}) — the content is never printed` : `the guard failed (exit ${r.code}${r.why ? `: ${r.why}` : ""})` };
}
function guardedAppend(path, row, guard) {
  const g = guard(JSON.stringify(row));
  if (g && g.ran && !g.ok) return { ok: false, why: `names guard REFUSED the row: ${g.why} — nothing written`, guard: g };
  const w = appendChecked(path, row);
  return w.ok ? { ok: true, guard: g } : { ok: false, why: w.why, guard: g };
}
/** recordCompiled — a (re)compile is an APPEND naming what it supersedes; the older row is never touched. */
function recordCompiled(path, row, prev, guard) {
  return guardedAppend(path, row, guard);
}
/** recordGate — a verdict is its OWN row naming the note (`of`); the compiled row is never touched. */
function recordGate(path, row, guard) {
  return guardedAppend(path, row, guard);
}

// ---------------------------------------------------------------------------
// THE STAMPS — the axis windows (forge_session.mjs is their sole writer; read only)
// ---------------------------------------------------------------------------
/** declarationsOf — PURE. A session's axis declarations in time order: its append-only `axes_now_history`
 *  (forge_session.mjs, every `axis x now`, re-declares included — ml1 F-5, row 777) when it has one, else the
 *  first-`now` stamps `axes_now_at` (a session written before the history). Malformed entries are dropped. */
export function declarationsOf(s) {
  const t = (x) => Date.parse(x);
  const hist = (s && Array.isArray(s.axes_now_history) ? s.axes_now_history : [])
    .filter((h) => h && typeof h === "object" && AXES.includes(h.axis) && Number.isFinite(t(h.at))).map((h) => [h.axis, h.at]);
  const firsts = s && s.axes_now_at && typeof s.axes_now_at === "object" && !Array.isArray(s.axes_now_at)
    ? Object.entries(s.axes_now_at).filter(([a, at]) => AXES.includes(a) && Number.isFinite(t(at))) : [];
  return (hist.length ? hist : firsts).slice().sort((p, q) => t(p[1]) - t(q[1]));
}
/** axisWindows — every declared axis window, from the open session and the closed ones. A window opens at a
 *  declaration (consecutive re-declares of the SAME axis continue it) and ends at its axis's mark when the mark
 *  falls inside it, else at the next declaration of another axis, else at the session's end, else open (null).
 *  A return to an axis after another was declared is a NEW window of that axis. */
export function axisWindows({ stateDir = STATE_DIR } = {}) {
  const out = [];
  const t = (x) => Date.parse(x);
  const take = (s, origin, endedAt) => {
    if (!s || typeof s !== "object" || !s.concept) return;
    const decl = declarationsOf(s);
    const opens = decl.filter((d, i) => i === 0 || decl[i - 1][0] !== d[0]);
    opens.forEach(([axis, from], i) => {
      const next = opens[i + 1] ? opens[i + 1][1] : null;
      const m = s.axes_marked_at && s.axes_marked_at[axis] && Number.isFinite(t(s.axes_marked_at[axis].at)) ? s.axes_marked_at[axis].at : null;
      const mark = m && t(m) >= t(from) && (!next || t(m) <= t(next)) ? m : null;
      const ends = [mark, next, endedAt].filter((x) => x && Number.isFinite(t(x))).sort((p, q) => t(p) - t(q));
      out.push({ concept: String(s.concept).trim().toLowerCase(), axis, from, to: ends[0] || null, origin,
        how: mark ? ((s.axes_done || []).includes(axis) ? "done" : (s.axes_deferred || []).includes(axis) ? "defer" : "marked") : next ? "moved on" : endedAt ? "session ended" : "open" });
    });
  };
  const live = readJson(join(stateDir, "forge_session.json"));
  if (live) take(live, "forge_session.json", live.ended_at || live.closed_at || null);
  for (const r of readJsonl(join(stateDir, "forge_sessions.jsonl"))) take(r, "forge_sessions.jsonl", r.ended_at || r.updated_at || null);
  const seen = new Set();   // the same session can sit in both files: one window per (concept, axis, from)
  return out.filter((w) => { const k = `${w.concept}|${w.axis}|${w.from}`; if (seen.has(k)) return false; seen.add(k); return true; });
}
/** studyScope — G0's host (the open sitting) ∪ the sessions the axis's previous note used ∪ named extras. */
export function studyScope({ stateDir = STATE_DIR, prev = null, extra = [] } = {}) {
  const out = new Set();
  const s = readJson(join(stateDir, "sitting.json"));
  if (s && typeof s.host_session_id === "string" && s.host_session_id) out.add(s.host_session_id);
  for (const x of (prev && prev.note && prev.note.window && Array.isArray(prev.note.window.sessions) ? prev.note.window.sessions : [])) if (typeof x === "string" && x) out.add(x);
  for (const x of extra || []) if (typeof x === "string" && x.trim()) out.add(x.trim());
  return [...out];
}

// ---------------------------------------------------------------------------
// THE ITEMS — TIER 0 extraction, one author per item
// ---------------------------------------------------------------------------
const lastQuestion = (text) => {
  const parts = String(text || "").split(/\n+|(?<=[?.!])\s+/).map((x) => x.trim()).filter(Boolean);
  for (let i = parts.length - 1; i >= 0; i--) if (parts[i].includes("?")) return parts[i].replace(/^\[EK CHECK\]\s*/i, "");   // the slot's marker is not the question
  return null;
};
const diffBlocks = (text) => {
  const out = [];
  for (const m of String(text || "").matchAll(DIFF_RE)) {
    const lines = m[1].split(/\r?\n/);
    const galat = lines.filter((l) => /^-(?!--)/.test(l)).map((l) => l.slice(1).trim()).filter(Boolean);
    const sahi = lines.filter((l) => /^\+(?!\+\+)/.test(l)).map((l) => l.slice(1).trim()).filter(Boolean);
    if (galat.length || sahi.length) out.push({ galat, sahi });
  }
  return out;
};
const layersOf = (text) => {
  const out = [];
  for (const line of String(text || "").replace(DIFF_RE, "").split(/\r?\n/)) {
    const m = LAYER_RE.exec(line);
    if (m && m[2].trim()) out.push({ kind: LAYER_KIND[m[1].toLowerCase().replace(/\s+/g, " ")], text: m[2].trim() });
  }
  return out;
};
const numbersIn = (text) => (String(text || "").match(/\d+(?:\.\d+)?/g) || []).length;   // the numbers he TYPED — every occurrence counts
// the skeleton's canonical check ending (teaching_bar.mjs:346: check_q → end "samajh aaya — haan ya nahi"): a crack turn
// that ends on it asked a CHECK, so his reply is an answer; any other crack turn asked for the stuck-story
const endsOnCheck = (text) => /haan\s*(?:ya|\/)\s*nahi\s*\??\s*$/i.test(String(text || "").replace(DIFF_RE, "").trim());
/** nItem — ONE of his archive records, verbatim, with its archive timestamp and rid (G-B). */
const nItem = (x, kind, extra = {}) => ({ mark: "N", kind, at: x.at, rid: x.rid, text: x.text, ...extra });
/** tItem — ONE of the teacher's records. */
const tItem = (x, kind, extra = {}) => ({ mark: "T", kind, at: x.at, rid: x.rid, ...extra });

/** buildNote — PURE. One axis note from its word stream, bank, capsule and the live corrections (read FIRST).
 *  @param {{concept:string, axis:string, ex:any[], bank:any[], capsule:any, corrections:any[], window:any}} p */
export function buildNote({ concept, axis, ex = [], bank = [], capsule = null, corrections = [], window = null }) {
  const items = [], traps = [], gaps = [];
  let seenGut = false;
  for (let i = 0; i < ex.length; i++) {
    const x = ex[i], prev = ex[i - 1] || null, next = ex[i + 1] || null;
    if (x.role === "teacher") {
      for (const d of diffBlocks(x.text)) {
        items.push(tItem(x, "crack", { galat: d.galat, sahi: d.sahi }));
        traps.push({ from: "crack", bait: d.galat.join(" / ") || "(no - line)", truth: d.sahi.join(" / ") || "(no + line)", rid: x.rid, at: x.at });
      }
      for (const l of layersOf(x.text)) items.push(tItem(x, l.kind, { text: l.text }));
      const q = next && next.role === "him" ? lastQuestion(x.text.replace(DIFF_RE, "")) : null;
      if (q) items.push(tItem(x, "check", { text: q }));
      continue;
    }
    const gut = (GUT_RE.exec(x.text) || [])[1];
    const crackedNext = next && next.role === "teacher" && diffBlocks(next.text).length > 0;
    const afterCrack = prev && prev.role === "teacher" && diffBlocks(prev.text).length > 0 && !endsOnCheck(prev.text);
    const askedBolo = prev && prev.role === "teacher" && /\bbolo\b/i.test(prev.text);
    const asked = prev && prev.role === "teacher" && !!lastQuestion(prev.text);
    // his FIRST gut-bearing answer is the pehle-guess even when it is the one that cracked (it then says so)
    const kind = gut && !seenGut ? "pehle_guess" : crackedNext ? "cracked" : afterCrack ? "stuck" : askedBolo ? "bolo" : numbersIn(x.text) >= 2 ? "trace" : asked ? "answer" : null;
    if (gut) seenGut = true;
    if (kind) items.push(nItem(x, kind, { ...(gut ? { gut: gut.toLowerCase() } : {}), ...(kind === "pehle_guess" && crackedNext ? { cracked: true } : {}) }));
  }
  // THE BANK — receipts in the timeline (a capture row and the verdict that settled it)
  const receipts = (bank || []).map((b) => ({ kind: "bank", at: b.at, rid: b.rid, type: b.type || null, gut: b.gut || null, asked: b.asked || null, said: b.said || null,
    latency_ms: Number.isFinite(b.latency_ms) ? b.latency_ms : null, probe: b.probe || null, register: b.register || null, verdict: b.verdict || null }));
  // THE CAPSULE — immutable; its axis strike and weld, and its traps
  const fl = capsule && Array.isArray(capsule.faultLines) ? capsule.faultLines.find((f) => f && String(f.axis || "").toLowerCase() === axis) : null;
  const sharp = receipts.find((r) => r.register !== "interview" && r.asked && !/\bbolo\b/i.test(r.asked));
  const lastCheck = items.filter((i) => i.kind === "check").at(-1);
  const strike = fl && fl.strike ? { text: fl.strike, from: "capsule" } : sharp ? { text: sharp.asked, from: "bank" } : lastCheck ? { text: lastCheck.text, from: "teacher check" } : { text: null, from: null };
  for (const c of corrections || []) traps.push({ from: "correction", correction: c.id, bait: c.claim, truth: c.correct, source: c.source, taught_at: c.taught_at });
  for (const t of capsule && Array.isArray(capsule.traps) ? capsule.traps : []) {
    if (typeof t === "string") traps.push({ from: "capsule", bait: t, truth: null });
    else if (t && (t.bait || t.wrong || t.truth)) traps.push({ from: "capsule", bait: t.bait || t.wrong || "", wrong: t.wrong || null, truth: t.truth || null });
  }
  traps.forEach((t, i) => { t.id = `T${i + 1}`; });
  // CORRECTIONS, APPLIED: every served text that states a corrected claim is flagged (the render prints the marker)
  const flag = (o, ...keys) => { const hit = new Set(); for (const k of keys) for (const c of matchesIn(Array.isArray(o[k]) ? o[k].join(" ") : o[k], corrections)) hit.add(c.id); if (hit.size) o.corrected = [...hit]; return o; };
  for (const it of items) flag(it, "text", "galat", "sahi");
  for (const r of receipts) flag(r, "asked", "said");
  for (const t of traps) if (t.from !== "correction") flag(t, "bait", "wrong", "truth");
  const strikeOut = flag({ ...strike }, "text");
  const weld = fl && fl.weld ? flag({ text: fl.weld }, "text") : null;
  // GAPS — what the compile could not find, named (never filled in)
  if (!items.some((i) => i.kind === "pehle_guess")) gaps.push("no pehle-guess with a gut-word");
  if (!items.some((i) => i.kind === "crack")) gaps.push("no crack (no ```diff block in the teacher's turns)");
  if (!items.some((i) => i.kind === "trace")) gaps.push("no hand-trace (no answer with numbers he typed)");
  if (!items.some((i) => i.kind === "bolo")) gaps.push("no Bolo");
  if (!items.some((i) => ["dukaan", "asli_naam", "technical_line"].includes(i.kind))) gaps.push("no [T] skeleton layer marked in the teacher's turns");
  if (!receipts.length) gaps.push("nothing banked in the window");
  if (!receipts.some((r) => r.register === "interview")) gaps.push("no interview line banked");
  if (!capsule) gaps.push(`no capsule for ${concept} (the strike comes from the ${strike.from || "nowhere"})`);
  if (!strike.text) gaps.push("NO STRIKE — the cold reader has no question to answer");
  return { v: 1, concept, axis, title: fl && fl.title ? fl.title : null, strike: strikeOut, weld, window, items, bank: receipts, traps,
    corrections: (corrections || []).map((c) => ({ id: c.id, claim: c.claim, correct: c.correct, source: c.source, taught_at: c.taught_at })), gaps };
}

// ---------------------------------------------------------------------------
// THE RENDER — one source, the block (SAMJHAO_MERGED §4's shape); every line one author
// ---------------------------------------------------------------------------
const one = (s) => String(s == null ? "" : s).replace(/\r?\n+/g, " ⏎ ").trim();
const LABEL = { pehle_guess: "PEHLE GUESS", cracked: "MAIN ATKA KAHAN (the answer that cracked)", stuck: "MAIN ATKA KAHAN (stuck-story)", trace: "MAINE KHUD CHALAYA (hand-trace)",
  bolo: "AB MERI SAMAJH (Bolo)", answer: "his answer", crack: "CRACK", dukaan: "DUKAAN", asli_naam: "ASLI NAAM", technical_line: "TECHNICAL LINE", check: "EK CHECK" };
const GLANCE_LABEL = { pehle_guess: "PEHLE GUESS", crack: "CRACK", stuck: "MAIN ATKA KAHAN", trace: "MAINE KHUD CHALAYA", bolo: "BOLO" };
const corrMark = (o, note) => (o && Array.isArray(o.corrected) && o.corrected.length
  ? o.corrected.map((id) => `⟦CORRECTED ${id} → ${(note.traps.find((t) => t.correction === id) || {}).id || "?"}⟧ `).join("") : "");
/** renderNote — the note as text: what the glance shows and the ONLY thing the cold reader is given. */
export function renderNote(note) {
  const L = [];
  const w = note.window || {};
  L.push(`NOTE · ${note.concept} · axis ${note.axis}${note.title ? ` — ${one(note.title)}` : ""} · compiled by code (${COMPILER}) · scope ${w.scope || "?"}`);
  L.push(`STRIKE${note.strike && note.strike.from ? ` (from the ${note.strike.from})` : ""}: ${corrMark(note.strike, note)}${one(note.strike && note.strike.text) || "— none —"}`);
  if (note.weld) L.push(`WELD (the capsule's defended answer): ${corrMark(note.weld, note)}${one(note.weld.text)}`);
  const timeline = [...note.items.map((i) => ({ ...i, _t: i.at })), ...note.bank.map((b) => ({ ...b, _t: b.at }))].sort((a, b) => String(a._t).localeCompare(String(b._t)));
  for (const it of timeline) {
    if (it.kind === "bank") {
      L.push(`BANK · ${istStampOf(it.at) || "?"} · ${it.register === "interview" ? "interview line" : it.probe || "banked answer"}${it.gut ? ` · gut ${it.gut}` : ""}${it.latency_ms !== null ? ` · ${(it.latency_ms / 1000).toFixed(1)} s` : ""} · asked: ${corrMark(it, note)}${one(it.asked) || "—"} · he said: ${one(it.said) || "—"} · verdict: ${it.verdict || "not judged yet"}`);
    } else if (it.mark === "N") {
      L.push(`[N ${istStampOf(it.at) || "????-??-?? ??:??:?? IST"} · ${String(it.rid || "").slice(-8)}] ${LABEL[it.kind] || it.kind}${it.cracked ? " (it cracked)" : ""}${it.gut ? ` · gut ${it.gut}` : ""}: ${corrMark(it, note)}${one(it.text)}`);
    } else {
      const body = it.kind === "crack" ? `galat: ${one(it.galat.join(" / ")) || "—"} | sahi: ${one(it.sahi.join(" / ")) || "—"}` : one(it.text);
      L.push(`[T ${istStampOf(it.at) || "?"} · ${String(it.rid || "").slice(-8)}] ${LABEL[it.kind] || it.kind}: ${corrMark(it, note)}${body}`);
    }
  }
  L.push("TRAPS (the seductive wrong answers this note already names):");
  for (const t of note.traps) {
    if (t.from === "correction") L.push(`  ${t.id} · ⟦CORRECTED ${t.correction} → ${t.id}⟧ WRONG: ${one(t.bait)} → RIGHT: ${one(t.truth)} (${one(t.source)}; taught ${t.taught_at})`);
    else L.push(`  ${t.id} · ${t.from} · ${corrMark(t, note)}bait: ${one(t.bait)}${t.wrong ? ` · why wrong: ${one(t.wrong)}` : ""}${t.truth ? ` → truth: ${one(t.truth)}` : ""}`);
  }
  if (note.gaps.length) L.push(`GAPS: ${note.gaps.join(" · ")}`);
  return L;
}

// ---------------------------------------------------------------------------
// THE COMPILE — one day, every axis studied on it
// ---------------------------------------------------------------------------
const dayBounds = (day) => { const a = Date.parse(`${day}T00:00:00+05:30`); return [a, a + 86400000 - 1]; };
/** compileDay — append one compiled row per axis studied on `date` whose content changed.
 *  @returns {{ok:boolean, date:string, results:any[], why?:string, guard?:any}} */
export function compileDay({ date = todayIst(), stateDir = STATE_DIR, path = null, root = archiveRoot(), concept = null, axis = null, sessions = [],
  correctionsPath = null, capsulesDir = null, now = () => new Date(), guard = (t) => namesGuard(t) } = {}) {
  const ledger = path || join(stateDir, "compiled_notes.jsonl");
  // 1. THE CORRECTIONS — FIRST. An unreadable lane refuses the compile: a corrected claim must never be served as truth.
  let corrRows;
  try { corrRows = readCorrectionRows(correctionsPath || (stateDir === STATE_DIR ? CORRECTIONS : join(stateDir, "notes_corrections.jsonl"))); }
  catch (e) { return { ok: false, date, results: [], why: `the corrections lane exists and cannot be read (${clip(e && e.message, 120)}) — nothing compiled` }; }
  let rows;
  try { rows = readRows(ledger); } catch (e) { return { ok: false, date, results: [], why: `compiled_notes.jsonl exists and cannot be read (${clip(e && e.message, 120)}) — nothing compiled` }; }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date))) return { ok: false, date, results: [], why: `not an IST day: ${date}` };
  const [d0, d1] = dayBounds(date);
  const groups = new Map();
  for (const w of axisWindows({ stateDir })) {
    if ((concept && w.concept !== String(concept).toLowerCase()) || (axis && w.axis !== String(axis).toLowerCase())) continue;
    const end = w.to ? Date.parse(w.to) : now().getTime();
    if (Date.parse(w.from) > d1 || end < d0) continue;   // the window never touched day D
    const k = `${w.concept}|${w.axis}`;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(w);
  }
  const capsules = loadCapsules(capsulesDir || join(stateDir, "capsules"));
  const results = [];
  let ok = true, lastGuard = null;
  for (const [k, wins] of groups) {
    const [c, a] = k.split("|");
    const prev = latestLive(rows, c, a);
    const scope = studyScope({ stateDir, prev, extra: sessions });
    const nowIso = now().toISOString();
    const days = [...new Set(wins.flatMap((w) => istDaysBetween(w.from, w.to || nowIso)))];
    const words = readLaneDays(WORD_LANE, days, { root });
    const byRid = new Map();
    for (const w of wins) for (const x of exchanges(words.records, { from: w.from, to: w.to || nowIso, ...(scope.length ? { sessions: scope } : { concept: c }) })) byRid.set(x.rid, x);
    const ex = [...byRid.values()].sort((p, q) => p.at.localeCompare(q.at));
    if (!ex.some((x) => istDay(x.at) === date)) { results.push({ concept: c, axis: a, op: "skipped", why: `no archived word of this axis on ${date} (archive ${root}${words.missing.length ? `; ${words.missing.length} day file(s) absent` : ""})` }); continue; }
    if (words.unreadable.length) { ok = false; results.push({ concept: c, axis: a, op: "refused", why: `an archive day file is unreadable (${words.unreadable[0].day}: ${words.unreadable[0].why}) — nothing compiled` }); continue; }
    // THE BANK — capture rows of this concept/axis in the windows, with the verdict that settled each
    const bankRecs = readLaneDays(BANK_LANE, days, { root }).records;
    const inWin = (t) => wins.some((w) => Date.parse(t) >= Date.parse(w.from) && Date.parse(t) <= Date.parse(w.to || nowIso));
    const settled = new Map(bankRecs.map((r) => r.payload).filter((p) => p && p.kind === "settled" && p.of).map((p) => [p.of, p]));
    const bank = bankRecs.filter((r) => r.payload && r.payload.kind === "capture" && String(r.payload.concept || "").toLowerCase() === c && String(r.payload.axis || "").toLowerCase() === a && inWin(r.ts_utc || r.payload.ts))
      .map((r) => { const p = r.payload, s = settled.get(p.id); return { rid: r.rid, at: r.ts_utc || p.ts, type: p.type, gut: p.gut, asked: p.asked, said: p.spoken, latency_ms: p.latency_ms, probe: p.probe, register: p.register, verdict: s ? (s.verdict || s.pass || "settled") : null }; });
    const capsule = capsules.find((x) => String(x.id || "").toLowerCase() === c || String(x.title || "").toLowerCase() === c) || null;
    const window = { windows: wins.map((w) => ({ from: w.from, to: w.to, origin: w.origin, how: w.how })), sessions: scope, scope: scope.length ? "G0 host" : "concept stamp (no host bound — a weaker scope)", records: ex.length };
    const note = buildNote({ concept: c, axis: a, ex, bank, capsule, corrections: liveCorrections(corrRows, { concept: c, axis: a }), window });
    const sources = [...new Set([...ex.map((x) => x.rid), ...bank.map((b) => b.rid)].filter((x) => typeof x === "string" && x))];
    if (!sources.length) { results.push({ concept: c, axis: a, op: "skipped", why: "no archive record id to cite — a note without sources is never written" }); continue; }
    const content_sha = sha256(JSON.stringify({ compiler: COMPILER, note, sources }));
    if (prev && prev.content_sha === content_sha && noteDay(prev) === date) { results.push({ concept: c, axis: a, op: "unchanged", id: prev.id }); continue; }
    const t = now();
    const row = { v: 1, kind: "compiled", id: newId("n", t), ts: t.toISOString(), day: date, concept: c, axis: a, compiler: COMPILER, sources, note, content_sha, ...(prev ? { supersedes: prev.id } : {}) };
    const w = recordCompiled(ledger, row, prev, guard);
    lastGuard = w.guard || lastGuard;
    if (!w.ok) { ok = false; results.push({ concept: c, axis: a, op: "refused", why: w.why }); continue; }
    rows.push(row);
    results.push({ concept: c, axis: a, op: prev ? "recompiled" : "compiled", id: row.id, supersedes: prev ? prev.id : null, sources: sources.length, traps: note.traps.length, gaps: note.gaps.length });
  }
  return { ok, date, results, guard: lastGuard };
}

// ---------------------------------------------------------------------------
// THE COLD GATE
// ---------------------------------------------------------------------------
/** verdictOf — PURE. The reader's reply against the note: PASS iff answered from the note alone, three DISTINCT
 *  seductive wrong answers each already a trap of the note, and the note rebuilds. */
export function verdictOf(note, reply) {
  const ids = new Map((note && note.traps ? note.traps : []).map((t) => [t.id, t]));
  const r = reply && typeof reply === "object" ? reply : {};
  const answered = typeof r.answer === "string" && r.answer.trim() !== "";
  const fromNote = r.answer_from_note === true, rebuild = r.rebuild === true;
  const wrong = (Array.isArray(r.wrong) ? r.wrong : []).slice(0, 3).map((x) => ({ text: clip(x && x.text, 300), trap: x && typeof x.trap === "string" && x.trap.trim() ? x.trap.trim() : null }));
  const inNote = (w) => !!w.text && !!w.trap && ids.has(w.trap);
  const covered = wrong.length === 3 && wrong.every(inNote) && new Set(wrong.map((w) => w.trap)).size === 3;
  const missing = wrong.filter((w) => !inNote(w)).map((w) => w.text || "(empty)");
  if (wrong.length < 3) missing.push(`(the reader named ${wrong.length} of the three seductive wrong answers)`);
  const pass = answered && fromNote && rebuild && covered;
  const why = pass ? "the strike answered from the note alone · all three seductive wrong answers are traps of the note · it rebuilds"
    : [!answered && "the strike was not answered", answered && !fromNote && "the note alone was not enough to answer the strike", !rebuild && "the note only reminds — it does not rebuild (G-C)",
      !covered && (missing.length ? `a seductive wrong answer is missing from the note's traps: ${missing.map((m) => clip(m, 80)).join(" | ")}` : "two wrong answers named the same trap")].filter(Boolean).join(" · ");
  return { verdict: pass ? "pass" : "fail", traps_named: wrong.filter(inNote).map((w) => `${w.trap} · ${clip(ids.get(w.trap).bait, 80)}`), wrong, missing, why, rebuild, answer_from_note: fromNote };
}
/** rightModelOf — the note's own right model (the capsule's weld, else the last crack's sahi, else the last
 *  technical line, else his Bolo): what a reader with ONLY the note could answer from. */
const rightModelOf = (note) => {
  if (note.weld && note.weld.text) return note.weld.text;
  const crack = note.items.filter((i) => i.kind === "crack" && i.sahi.length).at(-1);
  if (crack) return crack.sahi.join(" / ");
  const tl = note.items.filter((i) => i.kind === "technical_line").at(-1);
  if (tl) return tl.text;
  const bolo = note.items.filter((i) => i.kind === "bolo").at(-1);
  return bolo ? bolo.text : "";
};
/** stubReader — the SEAT's reader (ARSENAL_COLD_READER=stub): mechanical, model-free. It answers with the note's
 *  own right model and names the note's first three traps; a note with fewer than three traps FAILS even stubbed. */
export function stubReader(note) {
  const t = note.traps || [], ans = rightModelOf(note);
  return { answer: ans, answer_from_note: !!ans, rebuild: note.items.some((i) => i.mark === "N") && note.items.some((i) => i.mark === "T"),
    wrong: [0, 1, 2].map((i) => (t[i] ? { text: t[i].bait, trap: t[i].id } : { text: "(the stub found no further trap in the note)", trap: null })) };
}
export const readerPrompt = (note) => [
  "You are a COLD READER. You have never seen this learner or his lessons. Below is ONE compiled study note; read ONLY the note.",
  "Return ONE JSON object and nothing else, with exactly these keys:",
  '  "answer": your answer to the STRIKE question, in two to four sentences, using only what the note teaches;',
  '  "answer_from_note": true if the note alone was enough to answer it, false if you needed knowledge the note does not carry;',
  '  "wrong": the THREE most seductive WRONG answers to the STRIKE. Produce them first from your own sense of where learners break,',
  '           THEN for each give "trap": the id (T1, T2, …) of the trap in the note that already names that wrong answer, or null if none does;',
  '  "rebuild": true if this note would REBUILD the idea for someone who has never seen it, false if it would only REMIND someone who already knows it.',
  'Shape: {"answer":"…","answer_from_note":true,"wrong":[{"text":"…","trap":"T1"},{"text":"…","trap":null},{"text":"…","trap":"T3"}],"rebuild":true}',
  "",
  "THE NOTE:",
  ...renderNote(note),
].join("\n");
const parseReply = (text) => {
  const s = String(text || ""), a = s.indexOf("{"), b = s.lastIndexOf("}");
  if (a < 0 || b <= a) return null;
  try { const o = JSON.parse(s.slice(a, b + 1)); return o && typeof o === "object" ? o : null; } catch { return null; }
};
/** liveReader — models.mjs's role through claudegen.mjs (a fresh `claude -p`, no tools).
 *  {ok, reply, reader, role} | {ok:false, cause, why, reader} — the cause is one of ABSENT_CAUSES. */
export const ABSENT_CAUSES = Object.freeze(["role-unresolved", "claude-refused", "window-closed", "call-failed", "no-reply-json", "day-unmatched"]);
export async function liveReader(note, { resolve = null, gen = null, timeoutMs = 600000 } = {}) {
  const res = resolve || (await import("./models.mjs")).resolveClaudeRole;
  const role = res(READER_ROLE);
  if (!role || !role.model) return { ok: false, cause: "role-unresolved", reader: `role:${READER_ROLE}/unresolved`, why: `models.mjs has no "${READER_ROLE}" role in CLAUDE_ROLES (LAW M: no model literal outside it) — nothing judged` };
  const reader = `role:${READER_ROLE}/${role.model}`;
  const rec = { role: READER_ROLE, model: role.model, effort: role.effort || null, via: role.via || null };   // row 774 (2): the row records role, model, effort and via
  const g = gen || (await import("./claudegen.mjs")).claudeGen;
  const r = g(readerPrompt(note), role.model, timeoutMs, role.effort ? ["--effort", role.effort] : []);
  if (!r || !r.ok) {
    const err = clip(r && (r.error || r.text), 160) || "no reply";
    const cause = r && r.limit_hit ? "window-closed" : /REFUSED/.test(err) ? "claude-refused" : "call-failed";
    return { ok: false, cause, reader, role: rec, why: `the cold reader's call failed (${err}) — nothing judged` };
  }
  const reply = parseReply(r.text);
  if (!reply) return { ok: false, cause: "no-reply-json", reader, role: rec, why: "the cold reader returned no JSON object — nothing judged" };
  return { ok: true, reply, reader, role: rec };
}
/** gateDay — ONE gate per live note of `date` that has no verdict yet (or every live note with `again`). */
export async function gateDay({ date = todayIst(), stateDir = STATE_DIR, path = null, stub = false, again = false, expect = [], reader = null, now = () => new Date(), guard = (t) => namesGuard(t) } = {}) {
  const ledger = path || join(stateDir, "compiled_notes.jsonl");
  let rows;
  try { rows = readRows(ledger); } catch (e) { return { ok: false, date, results: [], why: `compiled_notes.jsonl cannot be read (${clip(e && e.message, 120)})` }; }
  const st = noteState(rows);
  // an ABSENT row is not a verdict: the note stays un-judged and the next gate reads it again
  const targets = st.live.filter((n) => noteDay(n) === date && (again || !st.gates.some((g) => g.of === n.id && g.verdict !== "absent")));
  const results = [];
  let ok = true;
  for (const n of targets) {
    const r = stub ? { ok: true, reply: stubReader(n.note), reader: "stub" } : await (reader || liveReader)(n.note);
    if (!r.ok) {
      // ROW 774 (2): a cold read that cannot run (role unresolved, claude -p refused, window closed) writes a NAMED absence
      // row with its cause — never silence: a note with no verdict and no reason is the mirror class.
      ok = false;
      const t = now();
      const cause = ABSENT_CAUSES.includes(r.cause) ? r.cause : "call-failed";
      const row = { v: 1, kind: "cold_gate", id: newId("g", t), of: n.id, ts: t.toISOString(), day: noteDay(n), verdict: "absent", traps_named: [], reader: r.reader || `role:${READER_ROLE}/unresolved`, ...(r.role || { role: READER_ROLE }), cause, why: clip(r.why, 300) };
      const w = recordGate(ledger, row, guard);
      results.push(w.ok ? { of: n.id, concept: n.concept, axis: n.axis, op: "absent", id: row.id, cause, why: r.why }
        : { of: n.id, concept: n.concept, axis: n.axis, op: "refused", why: `${r.why} · the absence row itself was not written: ${w.why}` });
      continue;
    }
    const v = verdictOf(n.note, r.reply);
    const t = now();
    const row = { v: 1, kind: "cold_gate", id: newId("g", t), of: n.id, ts: t.toISOString(), day: noteDay(n), verdict: v.verdict, traps_named: v.traps_named, reader: r.reader,
      ...(r.role || {}),
      answer_from_note: v.answer_from_note, rebuild: v.rebuild, answer: clip(r.reply.answer, 600), wrong: v.wrong, missing: v.missing, why: v.why };
    const w = recordGate(ledger, row, guard);
    if (!w.ok) { ok = false; results.push({ of: n.id, concept: n.concept, axis: n.axis, op: "refused", why: w.why }); continue; }
    results.push({ of: n.id, concept: n.concept, axis: n.axis, op: "gated", id: row.id, verdict: v.verdict, traps: v.traps_named.length, reader: r.reader, why: v.why });
  }
  // ROW 883 (2): THE GATE NEVER ENDS SILENT. A note the day's compile wrote or kept (`expect`) that the day key above did not
  // reach gets a NAMED absent row, cause day-unmatched, so a key drift reads RED by name, never as 0 / 0 / 0 / 0.
  for (const id of expect) {
    const n = st.live.find((x) => x.id === id);
    if (!n || targets.includes(n) || st.gates.some((g) => g.of === id && g.verdict !== "absent")) continue;
    ok = false;
    const t = now(), why = `the compile for ${date} wrote or kept this note, and the gate's day key (${noteDay(n)}) did not reach it`;
    const row = { v: 1, kind: "cold_gate", id: newId("g", t), of: id, ts: t.toISOString(), day: noteDay(n), verdict: "absent", traps_named: [], reader: `role:${READER_ROLE}/not-reached`, role: READER_ROLE, cause: "day-unmatched", why };
    const w = recordGate(ledger, row, guard);
    results.push(w.ok ? { of: id, concept: n.concept, axis: n.axis, op: "absent", id: row.id, cause: "day-unmatched", why }
      : { of: id, concept: n.concept, axis: n.axis, op: "refused", why: `${why} · the absence row itself was not written: ${w.why}` });
  }
  return { ok, date, results };
}

// ---------------------------------------------------------------------------
// THE GLANCE — the day's compiled blocks on one screen, for his ONE haan (G-D)
// ---------------------------------------------------------------------------
export function glanceLines({ date = todayIst(), rows = [] } = {}) {
  const st = noteState(rows);
  const live = st.live.filter((n) => noteDay(n) === date);
  const verdicts = live.map((n) => st.lastGate(n.id));
  const L = [`NOTES · ${date} IST · ${live.length} axis note(s) compiled by code · cold gate: ${verdicts.filter((g) => g && g.verdict === "pass").length} pass · ${verdicts.filter((g) => g && g.verdict === "fail").length} fail · ${verdicts.filter((g) => g && g.verdict === "absent").length} absent (could not run, named) · ${verdicts.filter((g) => !g).length} not gated`];
  const hhmm = (iso) => (istStampOf(iso) || "?").slice(11, 16);
  live.forEach((n, i) => {
    const g = verdicts[i], note = n.note;
    L.push(`── ${n.concept} · axis ${n.axis}${note.title ? ` — ${clip(note.title, 40)}` : ""} · gate ${g ? `${g.verdict.toUpperCase()}${g.reader === "stub" ? " (stub)" : ""}` : "not run"} · traps ${note.traps.map((t) => t.id).join(" ") || "none"} · compiled ${hhmm(n.ts)} IST ──`);
    L.push(`  STRIKE  ${clip(note.strike && note.strike.text, 110) || "— none —"}`);
    const shown = note.items.filter((x) => ["pehle_guess", "crack", "stuck", "trace", "bolo"].includes(x.kind));
    for (const it of shown.slice(0, 8)) {
      const body = it.kind === "crack" ? `galat ${clip(it.galat.join(" / "), 45)} → sahi ${clip(it.sahi.join(" / "), 55)}` : clip(it.text, 100);
      L.push(`  [${it.mark} ${hhmm(it.at)}] ${GLANCE_LABEL[it.kind]}${it.cracked ? " (cracked)" : ""}${it.gut ? ` (${it.gut})` : ""}${it.corrected ? " ⟦CORRECTED⟧" : ""}: ${body}`);
    }
    if (shown.length > 8) L.push(`  … +${shown.length - 8} more in the note`);
    const line = note.bank.filter((b) => b.register === "interview").at(-1);
    if (line) L.push(`  LINE    ${clip(line.said, 110)}${line.corrected ? " ⟦CORRECTED⟧" : ""}`);
    L.push(`  TRAPS  ${note.traps.slice(0, 4).map((t) => `${t.id} ${clip(t.bait, 36)}`).join(" · ")}${note.traps.length > 4 ? ` · +${note.traps.length - 4}` : ""}`);
    if (g && (g.verdict === "fail" || g.verdict === "absent")) L.push(`  GATE   ${g.verdict === "absent" ? `ABSENT (${g.cause || "?"}) ` : ""}${clip(g.why, 140)}`);
  });
  if (!live.length) L.push("  (no axis note compiled for this day — `compile --date` back-fills; a day he did not study has none)");
  L.push("ONE haan for the day's notes (G-D) — the full-time skill asks it; nothing else from him.");
  return L;
}

// ---------------------------------------------------------------------------
// THE ANCHOR — full-time: the archive's own run, the compile, the gate
// ---------------------------------------------------------------------------
/** fullTime — the archive's run, the compile, the gate. `compile` and `gate` are injected only by this file's selftest (row 883 (2)'s plant). */
export async function fullTime({ date = todayIst(), stub = false, archiveRun = true, compile = compileDay, gate = gateDay } = {}) {
  const lines = [];
  if (archiveRun) {
    const r = spawnSync(process.execPath, [join(HERE, "archivist.mjs"), "run"], { cwd: ROOT, encoding: "utf8", timeout: 300000, windowsHide: true });
    const last = `${r.stdout || ""}${r.stderr || ""}`.split(/\r?\n/).filter(Boolean).at(-1) || "";
    lines.push(r.status === 0 ? `archive caught up (archivist run: ${clip(last, 100)})` : `ARCHIVE NOT CAUGHT UP (archivist run exit ${r.status}: ${clip(last, 120)}) — compiling from what the archive holds`);
  }
  const c = compile({ date });
  // ROW 883 (2): the gate is told which notes this compile wrote or kept, so a note its day key misses is named absent, never silent
  const expect = (c.results || []).filter((r) => r.id && ["compiled", "recompiled", "unchanged"].includes(r.op)).map((r) => r.id);
  const g = c.ok || c.results.length ? await gate({ date, stub, expect }) : { ok: false, results: [], why: "no compile" };
  return { ok: c.ok && g.ok, compile: c, gate: g, lines };
}
const summary = (date, c, g, stub) => {
  const n = (op) => c.results.filter((r) => r.op === op).length;
  const gated = (g.results || []).filter((r) => r.op === "gated");
  return `notes_compiler: ${date} IST · compiled ${n("compiled") + n("recompiled")} (${n("recompiled")} superseding) · unchanged ${n("unchanged")} · refused ${n("refused")}`
    + ` · gate ${gated.filter((r) => r.verdict === "pass").length} pass / ${gated.filter((r) => r.verdict === "fail").length} fail / ${(g.results || []).filter((r) => r.op === "absent").length} absent (named) / ${(g.results || []).filter((r) => r.op !== "gated" && r.op !== "absent").length} not run (reader ${stub ? "stub" : `role:${READER_ROLE}`})`
    + ` · names guard ${c.guard ? (c.guard.ran ? "ran" : "OFF") : "not reached"}`;
};

// ---------------------------------------------------------------------------
// SELFTEST — hermetic: a temp archive written by archivist's OWN writer, temp state, injected readers
// ---------------------------------------------------------------------------
async function selftest() {
  let pass = 0, fail = 0;
  const assert = (name, cond, detail = "") => { if (cond) { pass++; console.log(`  ok   ${name}`); } else { fail++; console.log(`  FAIL ${name}${detail ? `\n         ${detail}` : ""}`); } };
  console.log("=== NOTES COMPILER SELFTEST — the compiled note, its corrections and its cold gate (rung L1) ===\n");
  const { runArchive, initArchive } = await import("./archivist.mjs");
  const { add: addCorrection } = await import("./notes_corrections.mjs");
  const tmp = mkdtempSync(join(tmpdir(), "arsenal-notes-test-"));
  const bytes = (p) => (existsSync(p) ? readFileSync(p, "utf8") : "");
  const NOGUARD = () => ({ ran: false, ok: true, why: "selftest: the guard is tested on its own below" });
  try {
    const arc = join(tmp, "archive"), repo = join(tmp, "repo"), st = join(tmp, "state"), lane = join(repo, "dressing-room", "state", "afferent.jsonl");
    const bankLane = join(repo, "dressing-room", "state", "gaffer_grade_queue.jsonl"), L = join(st, "compiled_notes.jsonl"), CL = join(st, "notes_corrections.jsonl");
    mkdirSync(join(repo, "dressing-room", "state"), { recursive: true }); mkdirSync(st, { recursive: true });
    initArchive({ root: arc, repo, quiet: true, warn: () => {} });
    const H = "f1c7e000-0000-4000-8000-0000000000aa", E = "f1c7e000-0000-4000-8000-0000000000ee";
    const at = (m) => new Date(Date.UTC(2026, 9, 6, 4, 0, 0) + m * 60000).toISOString();   // 6 Oct 2026, 09:30 IST onwards (m = minutes, fractions kept)
    let ev = 0;
    const said = (m, text, session = H) => ({ event_id: `e${++ev}`, modality: "code", source: "claude-code", surface: "claude-code", session_id: session, text, tier: "private", moment: { forge_step: 3, forge_concept: "tokenization" }, v: 3, ts: at(m) });
    const taught = (m, text) => ({ ...said(m, text), source: "claude-code-teaching" });
    const words = [
      taught(1, "[POSITION] tokenization > axis a > token\n[DUKAAN] Kirana pe atta 1 kg ke packet mein bikta hai — model text ko aise hi packets mein todta hai.\n[ASLI NAAM] `token`: text ka chhota tukda jo model ginta hai.\n[TECHNICAL LINE] A token is the unit of text a model reads and predicts.\n[EK CHECK] 'tokenization' word kitne tokens banega?\npehle gut-word: knew · shaky · guessed"),
      said(2, "shaky — 1 token, kyunki ek hi word hai"),
      taught(3, "```diff\n- ek word = ek token\n+ ek word kai tokens mein toot sakta hai: token + ization\n```\nKahan atke? Apne shabdon mein batao."),
      said(4, "maine socha har word dictionary ki ek entry hai, phir subword dekha toh woh model toot gaya"),
      said(5, "architect, run the fleet", E),
      taught(6, "Ab haath se: 'unbelievable' ke tukde gino — kitne? Aur letters kitne?"),
      said(7, "un + believ + able = 3 tokens, 12 letters"),
      taught(8, "[TECHNICAL LINE] BPE at inference is greedy longest-match over the vocabulary.\nSamajh aaya — haan ya nahi?"),
      said(9, "haan"),
      taught(10, "Bolo — axis a apne shabdon mein, poora."),
      said(11, "token woh tukda hai jo model ginta hai; ek word ek ya zyada tokens ho sakta hai — ₹ jaisa symbol bhi apna token"),
    ];
    writeFileSync(lane, words.map((r) => JSON.stringify(r)).join("\n") + "\n");
    const bankRows = [
      { v: 2, kind: "capture", id: "voice_rep:tokenization:a:1", ts: at(9.5), day: "2026-10-06", type: "voice_rep", ref: "tokenization:a", concept: "tokenization", axis: "a", gut: "shaky", asked: "'tokenization' word kitne tokens banega?", spoken: "2 tokens: token + ization", latency_ms: 42000, probe: null, register: null, surface: "code" },
      { v: 2, kind: "capture", id: "voice_rep:tokenization:a:2", ts: at(12), day: "2026-10-06", type: "voice_rep", ref: "tokenization:a", concept: "tokenization", axis: "a", gut: "knew", asked: "the English line?", spoken: "A token is the unit of text a model reads.", latency_ms: null, probe: null, register: "interview", surface: "code" },
      { v: 2, kind: "settled", of: "voice_rep:tokenization:a:1", ts: at(13), day: "2026-10-06", verdict: "held", concept: "tokenization", axis: "a" },
    ];
    writeFileSync(bankLane, bankRows.map((r) => JSON.stringify(r)).join("\n") + "\n");
    const ar = runArchive({ root: arc, repo, quiet: true, warn: () => {} });
    assert("FIXTURE — archivist's OWN writer archived the seeded capture lanes into a temp bag (no archive record is hand-written)",
      ar && ar.ok !== false && existsSync(join(arc, "data", "afferent", "2026", "10", "06.jsonl")), JSON.stringify(ar).slice(0, 160));
    // the pacer's and the sitting's own file shapes (forge_session.mjs:199-235 blank(); sitting.mjs:728-731) — fixture copies in a temp state dir
    writeFileSync(join(st, "forge_session.json"), JSON.stringify({ concept: "tokenization", started_at: at(0), updated_at: at(12), step: 3, axes_done: ["a"], axes_deferred: [],
      axes_now_at: { a: at(0.5) }, axes_marked_at: { a: { at: at(12.5), step: 3, jirah_before: 0 } }, current_axis: null }));
    writeFileSync(join(st, "sitting.json"), JSON.stringify({ id: "sit_x", opened_at: at(0), closed_at: null, host_session_id: H }));
    const bpe = { concept: "tokenization", claim: "BPE at inference = greedy longest-match", match: ["greedy longest-match", "greedy longest match"],
      correct: "Greedy longest-match is WordPiece's inference; BPE replays its learned merges in the order they were learned.", source: "selftest fixture", taught: "2026-09-24" };
    assert("CORRECTIONS LANE — the BPE row through its owner's door (notes_corrections.mjs add)", addCorrection(bpe, { path: CL, now: new Date(at(0)) }).ok === true);
    const capsule = { id: "tokenization", title: "Tokenization", faultLines: [{ axis: "a", title: "what a token is", strike: "A token is what, exactly — and why is it not a word?", weld: "A token is the subword unit the tokenizer emits." }],
      traps: [{ bait: "one word is one token", wrong: "subwords", truth: "a word can be several tokens" }, { bait: "BPE ka inference?", wrong: "—", truth: "BPE at inference uses greedy longest-match over the vocabulary" }] };
    const capDir = join(st, "capsules"); mkdirSync(capDir); writeFileSync(join(capDir, "tokenization.json"), JSON.stringify(capsule));
    const T = (m) => () => new Date(at(m));
    const base = { stateDir: st, path: L, root: arc, correctionsPath: CL, guard: NOGUARD };

    // ── COMPILE ─────────────────────────────────────────────────────────────
    const c1 = compileDay({ ...base, date: "2026-10-06", now: T(14) });
    const r1 = readRows(L), n1 = r1[0];
    assert("COMPILE — one compiled row for the axis studied on D: v 1, kind compiled, its own id, ts, concept, axis, compiler, sources[], note, content_sha",
      c1.ok && r1.length === 1 && n1.v === 1 && n1.kind === "compiled" && /^n-/.test(n1.id) && n1.ts === at(14) && n1.concept === "tokenization" && n1.axis === "a"
      && n1.compiler === COMPILER && Array.isArray(n1.sources) && n1.sources.length > 0 && n1.note && /^[0-9a-f]{64}$/.test(n1.content_sha), JSON.stringify(c1).slice(0, 300));
    assert("A COMPILED ROW NEVER CARRIES A VERDICT (no verdict, no traps_named on it — the gate appends its own row)", !("verdict" in n1) && !("traps_named" in n1));
    const arcRecs = readLaneDays(WORD_LANE, ["2026-10-06"], { root: arc }).records, bankRecs = readLaneDays(BANK_LANE, ["2026-10-06"], { root: arc }).records;
    const recOf = new Map([...arcRecs, ...bankRecs].map((r) => [r.rid, r]));
    assert("SOURCES ARE ARCHIVE RECORD IDS — every one resolves to a record of the bag, and the engineering session's prompt is not among them",
      n1.sources.every((s) => recOf.has(s)) && !n1.sources.some((s) => /fleet/.test(String(recOf.get(s).payload.text || ""))));
    const N = n1.note.items.filter((i) => i.mark === "N"), Tt = n1.note.items.filter((i) => i.mark === "T");
    assert("[N] AND [T] NEVER MIXED — every [N] item is one of HIS records, every [T] item one of the TEACHER's (by the record's own provenance)",
      N.length > 0 && Tt.length > 0 && N.every((i) => recOf.get(i.rid).payload.source === "claude-code") && Tt.every((i) => recOf.get(i.rid).payload.source === "claude-code-teaching"));
    const R1 = renderNote(n1.note);
    assert("EVERY [N] LINE CARRIES ITS ARCHIVE TIMESTAMP — each [N] item's `at` is its record's ts_utc, and its rendered line opens with that wall clock",
      N.every((i) => i.at === recOf.get(i.rid).ts_utc) && R1.filter((l) => l.startsWith("[N")).length === N.length
      && R1.filter((l) => l.startsWith("[N")).every((l) => /^\[N \d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} IST · /.test(l)));
    const kinds = (k) => n1.note.items.filter((i) => i.kind === k);
    assert("EXTRACTION — his pehle-guess WITH its gut-word (and that it cracked), the crack (- galat / + sahi from the diff block), the stuck-story after it",
      kinds("pehle_guess").length === 1 && kinds("pehle_guess")[0].gut === "shaky" && kinds("pehle_guess")[0].cracked === true && kinds("crack").length === 1 && kinds("crack")[0].galat[0] === "ek word = ek token"
      && /token \+ ization/.test(kinds("crack")[0].sahi[0]) && kinds("stuck").length === 1 && /maine socha/.test(kinds("stuck")[0].text), JSON.stringify(n1.note.items.map((i) => i.kind)));
    assert("EXTRACTION — his hand-trace (the numbers he typed), his Bolo verbatim (₹ kept byte-for-byte), each check (its slot marker dropped) and his answer",
      kinds("trace").length === 1 && /3 tokens, 12 letters/.test(kinds("trace")[0].text) && kinds("bolo").length === 1 && kinds("bolo")[0].text.includes("₹")
      && kinds("check").length >= 2 && kinds("check")[0].text === "'tokenization' word kitne tokens banega?" && kinds("answer").some((i) => i.text === "haan"));
    const afterCheck = buildNote({ concept: "x", axis: "a", ex: [
      { role: "teacher", at: at(1), rid: "r1", text: "```diff\n- a\n+ b\n```\nSamajh aaya — haan ya nahi?" }, { role: "him", at: at(2), rid: "r2", text: "haan" },
      { role: "teacher", at: at(3), rid: "r3", text: "Ek aur: kyun?" }, { role: "him", at: at(4), rid: "r4", text: "kyunki c" },
      { role: "teacher", at: at(5), rid: "r5", text: "```diff\n- c\n+ d\n```\nKahan atke?" }, { role: "him", at: at(6), rid: "r6", text: "maine socha c, phir d" }] });
    assert("AFTER A CRACK — his reply is the stuck-story only when the crack turn asked for it; a crack turn ending on the canonical check (\"haan ya nahi\") got an ANSWER",
      afterCheck.items.filter((i) => i.mark === "N").map((i) => i.kind).join() === "answer,cracked,stuck", afterCheck.items.filter((i) => i.mark === "N").map((i) => i.kind).join());
    assert("EXTRACTION — the teacher's [T] layers by the skeleton markers (DUKAAN · ASLI NAAM · TECHNICAL LINE)",
      kinds("dukaan").length === 1 && kinds("asli_naam").length === 1 && kinds("technical_line").length === 2);
    assert("THE BANK — receipts: asked, what he said, gut, latency, and the settled verdict; the interview line is named",
      n1.note.bank.length === 2 && n1.note.bank[0].said === "2 tokens: token + ization" && n1.note.bank[0].gut === "shaky" && n1.note.bank[0].latency_ms === 42000
      && n1.note.bank[0].verdict === "held" && n1.note.bank[1].register === "interview" && R1.some((l) => /^BANK · .* interview line/.test(l)));
    assert("STRIKE AND TRAPS — the capsule's axis strike; the traps are the crack, then the live correction, then the capsule's, numbered T1…",
      n1.note.strike.from === "capsule" && n1.note.traps.map((t) => t.from).join() === "crack,correction,capsule,capsule" && n1.note.traps.map((t) => t.id).join() === "T1,T2,T3,T4");
    const claimLines = R1.filter((l) => /greedy longest[- ]match/i.test(l));
    assert("CORRECTIONS READ FIRST — every rendered line that states the corrected claim (the teacher's old line, the capsule's trap) carries ⟦CORRECTED <id>⟧, never served as truth",
      claimLines.length >= 3 && claimLines.every((l) => l.includes("⟦CORRECTED ")) && n1.note.traps.some((t) => t.from === "correction" && t.correction), claimLines.join("\n"));

    // ── IDEMPOTENT, then RECOMPILE SUPERSEDES ────────────────────────────────
    const before = bytes(L);
    const c2 = compileDay({ ...base, date: "2026-10-06", now: T(15) });
    assert("IDEMPOTENT — the same sources under the same compiler append nothing", c2.ok && c2.results[0].op === "unchanged" && bytes(L) === before);
    writeFileSync(lane, words.concat([said(11.5, "aur ek baat: space bhi token ka hissa ho sakta hai")]).map((r) => JSON.stringify(r)).join("\n") + "\n");
    runArchive({ root: arc, repo, quiet: true, warn: () => {} });
    const c3 = compileDay({ ...base, date: "2026-10-06", now: T(16) });
    const r3 = readRows(L), n3 = r3.at(-1);
    assert("A RECOMPILE SUPERSEDES, NEVER REWRITES — a new compiled row names the old one; the old row stays byte-identical on the ledger and leaves the live set",
      c3.ok && r3.length === 2 && bytes(L).startsWith(before) && n3.supersedes === n1.id && n3.id !== n1.id && noteState(r3).live.map((r) => r.id).join() === n3.id, JSON.stringify(c3.results));

    // ── THE GATE (stub), and the verdict law ─────────────────────────────────
    const preGate = bytes(L);
    const g1 = await gateDay({ stateDir: st, path: L, date: "2026-10-06", stub: true, now: T(17), guard: NOGUARD });
    const r4 = readRows(L), gate = r4.at(-1);
    assert("THE GATE APPENDS ITS OWN ROW — kind cold_gate naming the live note, verdict, traps_named, reader stub; every compiled row byte-identical",
      g1.ok && r4.length === 3 && gate.kind === "cold_gate" && gate.of === n3.id && gate.verdict === "pass" && gate.reader === "stub" && gate.traps_named.length === 3
      && bytes(L).startsWith(preGate) && r4.filter((r) => r.kind === "compiled").every((r) => !("verdict" in r) && !("traps_named" in r)), JSON.stringify(g1.results));
    const g2 = await gateDay({ stateDir: st, path: L, date: "2026-10-06", stub: true, now: T(18), guard: NOGUARD });
    assert("ONE GATE PER NOTE — a note with a verdict is not gated again (the transport law: never per turn)", g2.ok && g2.results.length === 0 && readRows(L).length === 3);
    const allIn = { answer: "a token is a subword unit", answer_from_note: true, rebuild: true, wrong: [{ text: "one word one token", trap: "T1" }, { text: "greedy longest-match", trap: "T2" }, { text: "one word is one token", trap: "T3" }] };
    assert("VERDICT — PASS when the strike is answered from the note and all three seductive wrong answers are DISTINCT traps of it", verdictOf(n3.note, allIn).verdict === "pass");
    const oneOut = { ...allIn, wrong: [allIn.wrong[0], allIn.wrong[1], { text: "tokens are characters", trap: null }] };
    assert("VERDICT — a seductive wrong answer MISSING from the note's traps is a FAIL, named in `missing` (the note goes back to the compiler)",
      verdictOf(n3.note, oneOut).verdict === "fail" && verdictOf(n3.note, oneOut).missing.includes("tokens are characters"));
    assert("VERDICT — a trap id the note does not have, the same trap twice, an answer the note could not carry, a note that only reminds: each a FAIL",
      verdictOf(n3.note, { ...allIn, wrong: [allIn.wrong[0], allIn.wrong[1], { text: "x", trap: "T9" }] }).verdict === "fail"
      && verdictOf(n3.note, { ...allIn, wrong: [allIn.wrong[0], allIn.wrong[0], allIn.wrong[1]] }).verdict === "fail"
      && verdictOf(n3.note, { ...allIn, answer_from_note: false }).verdict === "fail" && verdictOf(n3.note, { ...allIn, rebuild: false }).verdict === "fail");
    assert("THE STUB FAILS A NOTE WITH FEWER THAN THREE TRAPS — even the seat's reader cannot pass what the note does not name",
      verdictOf({ ...n3.note, traps: n3.note.traps.slice(0, 2) }, stubReader({ ...n3.note, traps: n3.note.traps.slice(0, 2) })).verdict === "fail");

    // ── THE LIVE READER: models.mjs's role or nothing ────────────────────────
    const L2 = join(tmp, "live.jsonl");
    writeFileSync(L2, JSON.stringify(n1) + "\n");
    const pre2 = bytes(L2);
    const noRole = await gateDay({ path: L2, stateDir: st, date: "2026-10-06", now: T(18), reader: (n) => liveReader(n, { resolve: () => null, gen: () => { throw new Error("must not be called"); } }), guard: NOGUARD });
    const ab = readRows(L2).at(-1);
    assert("NO ROLE, A NAMED ABSENCE (row 774 (2)) — without a cold_reader role the gate writes ONE absent row with its cause, never a pass or fail and never silence",
      noRole.ok === false && noRole.results[0].op === "absent" && readRows(L2).length === 2 && bytes(L2).startsWith(pre2)
      && ab.kind === "cold_gate" && ab.of === n1.id && ab.verdict === "absent" && ab.cause === "role-unresolved" && ab.role === "cold_reader"
      && ab.reader === "role:cold_reader/unresolved" && /cold_reader/.test(ab.why) && Array.isArray(ab.traps_named) && ab.traps_named.length === 0);
    assert("AN ABSENCE IS NOT A VERDICT — the glance names it ABSENT with its cause, and the note is gated again by the next run",
      glanceLines({ date: "2026-10-06", rows: readRows(L2) }).some((l) => /gate ABSENT · /.test(l)) && /1 absent \(could not run, named\)/.test(glanceLines({ date: "2026-10-06", rows: readRows(L2) })[0])
      && glanceLines({ date: "2026-10-06", rows: readRows(L2) }).some((l) => /GATE {3}ABSENT \(role-unresolved\)/.test(l)));
    const roleOk = (role) => ({ role, model: "model-from-the-role", effort: "high", via: "roster" });
    const Lw = join(tmp, "window.jsonl"); writeFileSync(Lw, JSON.stringify(n1) + "\n");
    await gateDay({ path: Lw, stateDir: st, date: "2026-10-06", now: T(18), guard: NOGUARD, reader: (n) => liveReader(n, { resolve: roleOk, gen: () => ({ ok: false, limit_hit: true, error: "usage limit reached" }) }) });
    await gateDay({ path: Lw, stateDir: st, date: "2026-10-06", now: T(18), guard: NOGUARD, reader: (n) => liveReader(n, { resolve: roleOk, gen: () => ({ ok: false, limit_hit: false, error: "REFUSED — ANTHROPIC_API_KEY set (subscription only, ever)" }) }) });
    await gateDay({ path: Lw, stateDir: st, date: "2026-10-06", now: T(18), guard: NOGUARD, reader: (n) => liveReader(n, { resolve: roleOk, gen: () => ({ ok: true, text: "no json here" }) }) });
    const causes = readRows(Lw).filter((r) => r.kind === "cold_gate").map((r) => r.cause);
    assert("EVERY CAUSE IS NAMED — window closed, claude -p refused, no JSON: three absent rows, each with its cause and the role's model, effort and via",
      causes.join(",") === "window-closed,claude-refused,no-reply-json"
      && readRows(Lw).filter((r) => r.kind === "cold_gate").every((r) => r.verdict === "absent" && r.reader === "role:cold_reader/model-from-the-role" && r.model === "model-from-the-role" && r.effort === "high" && r.via === "roster"));
    let sent = null;
    const live = await gateDay({ path: L2, stateDir: st, date: "2026-10-06", now: T(19), guard: NOGUARD,
      reader: (n) => liveReader(n, { resolve: (role) => ({ role, model: "model-from-the-role", effort: "high" }), gen: (prompt, model, ms, extra) => { sent = { prompt, model, extra }; return { ok: true, text: "```json\n" + JSON.stringify(allIn) + "\n```" }; } }) });
    const lg = readRows(L2).at(-1);
    assert("THE LIVE READER — the role's model and effort reach the transport, the prompt carries ONLY the rendered note, the row names the role's reader",
      live.ok && lg.kind === "cold_gate" && lg.reader === "role:cold_reader/model-from-the-role" && sent && sent.model === "model-from-the-role" && sent.extra.join(" ") === "--effort high"
      && lg.role === "cold_reader" && lg.model === "model-from-the-role" && lg.effort === "high" && lg.via === null && lg.of === n1.id
      && sent.prompt.includes(renderNote(n1.note)[0]) && !sent.prompt.includes(n1.id));

    // ── THE APPEND LAWS: checked, and guarded ────────────────────────────────
    writeFileSync(join(tmp, "blocker"), "a file, not a directory");
    const bad = compileDay({ ...base, path: join(tmp, "blocker", "compiled_notes.jsonl"), date: "2026-10-06", now: T(20) });
    assert("A FAILED APPEND IS ok:false, LOUD — never a bare catch that reports ok", bad.ok === false && bad.results[0].op === "refused" && /append failed/.test(bad.results[0].why));
    const L3 = join(tmp, "guarded.jsonl");
    const refused = compileDay({ ...base, path: L3, date: "2026-10-06", now: T(21), guard: (text) => namesGuard(text, { root: tmp, run: () => ({ ran: true, code: 1 }) }) });
    assert("THE NAMES GUARD REFUSES — a finding by the organism's guard writes NOTHING and never prints the content",
      refused.ok === false && refused.results[0].op === "refused" && /names guard REFUSED/.test(refused.results[0].why) && !existsSync(L3));
    const off = namesGuard("x", { root: tmp, run: () => ({ ran: false, why: "gitleaks not found" }) });
    writeFileSync(join(tmp, ".gitleaks.local.toml"), "# fixture"); writeFileSync(join(tmp, ".gitleaks.toml"), "# fixture");
    let cfgSeen = null; namesGuard("x", { root: tmp, run: (t, cfg) => { cfgSeen = cfg; return { ran: true, code: 0 }; } });
    assert("THE NAMES GUARD — OFF says so when gitleaks is absent; when present it runs with BELT 3's precedence (.gitleaks.local.toml first)",
      off.ran === false && off.ok === true && /not found/.test(off.why) && cfgSeen === join(tmp, ".gitleaks.local.toml"));

    // ── THE WINDOWS READ THE HISTORY (ml1 F-5, row 777) ──────────────────────
    const wst = join(tmp, "win-state"); mkdirSync(wst);
    writeFileSync(join(wst, "forge_session.json"), JSON.stringify({ concept: "embeddings", started_at: at(0), updated_at: at(40), step: 3, axes_done: [], axes_deferred: [], axes_marked_at: {},
      axes_now_at: { a: at(1), b: at(10) }, axes_now_history: [{ axis: "a", at: at(1) }, { axis: "a", at: at(5) }, { axis: "b", at: at(10) }, { axis: "a", at: at(20) }, { axis: "x", at: at(25) }, { axis: "b", at: "junk" }] }));
    const hw = axisWindows({ stateDir: wst }).map((w) => `${w.axis} ${w.from === at(1) ? 1 : w.from === at(10) ? 10 : w.from === at(20) ? 20 : "?"}->${w.to === at(10) ? 10 : w.to === at(20) ? 20 : w.to === null ? "open" : "?"} ${w.how}`);
    assert("A RETURN TO AN AXIS IS ITS OWN WINDOW — a re-declare continues, another axis ends it, a later return opens a new one; junk entries are dropped",
      hw.join(" | ") === "a 1->10 moved on | b 10->20 moved on | a 20->open open", hw.join(" | "));
    writeFileSync(join(wst, "forge_session.json"), JSON.stringify({ concept: "embeddings", started_at: at(0), updated_at: at(40), step: 3, axes_done: ["a"], axes_deferred: [],
      axes_marked_at: { a: { at: at(8), step: 3, jirah_before: 0 } }, axes_now_at: { a: at(1), b: at(10) } }));
    const fw = axisWindows({ stateDir: wst }).map((w) => `${w.axis} ${w.to === at(8) ? 8 : w.to === null ? "open" : "?"} ${w.how}`);
    assert("NO HISTORY ⇒ THE FIRST-NOW STAMPS, AS BEFORE — a session written before the history keeps its windows (the mark ends a)",
      fw.join(" | ") === "a 8 done | b open open", fw.join(" | "));

    // ── WHAT IS NEVER COMPILED ───────────────────────────────────────────────
    const L4 = join(tmp, "other-day.jsonl");
    const other = compileDay({ ...base, path: L4, date: "2026-10-07", now: T(22) });
    assert("A DAY HE DID NOT STUDY GETS NO NOTE (the window never touched it)", other.ok && other.results.length === 0 && !existsSync(L4));
    const empty = join(tmp, "empty-archive"); initArchive({ root: empty, repo, quiet: true, warn: () => {} });
    const L5 = join(tmp, "no-words.jsonl");
    const none = compileDay({ ...base, path: L5, root: empty, date: "2026-10-06", now: T(23) });
    assert("NO ARCHIVED WORDS, NO NOTE — nothing is fabricated from the stamps alone", none.ok && none.results[0].op === "skipped" && !existsSync(L5));
    mkdirSync(join(tmp, "corr-as-dir"));
    const noCorr = compileDay({ ...base, path: join(tmp, "x.jsonl"), correctionsPath: join(tmp, "corr-as-dir"), date: "2026-10-06", now: T(24) });
    assert("CORRECTIONS UNREADABLE ⇒ NO COMPILE — they are read FIRST, and a compile that cannot read them refuses", noCorr.ok === false && /corrections lane/.test(noCorr.why) && !existsSync(join(tmp, "x.jsonl")));

    // ── BORN (forks row 787 (1)) — the ledger's birth at its landing, planted both ways ──────────────────────
    const LB = join(tmp, "born", "compiled_notes.jsonl");
    const b1 = born(LB);
    assert("BORN — an absent ledger is born EMPTY (0 bytes) by its sole writer, and says so", b1.ok && b1.op === "born" && existsSync(LB) && readFileSync(LB).length === 0);
    const b2 = born(LB);
    assert("BORN — a ledger that exists (even empty) is REFUSED, never written again", b2.ok === false && b2.op === "refused" && /already exists/.test(b2.why) && readFileSync(LB).length === 0);
    const LR = join(tmp, "born-rows.jsonl"); writeFileSync(LR, JSON.stringify({ v: 1, kind: "compiled", id: "n-x" }) + "\n");
    const shaR = sha256(readFileSync(LR, "utf8")), b3 = born(LR);
    assert("BORN NEVER TRUNCATES — a ledger holding a row is refused and stays byte-identical", b3.ok === false && b3.op === "refused" && sha256(readFileSync(LR, "utf8")) === shaR && readRows(LR).length === 1);

    // ── ROW 883: A ROW ABOUT A DAY CARRIES THAT DAY, AND THE GATE NEVER ENDS SILENT ──
    const lateNow = () => new Date("2026-10-06T21:26:43.434Z"), LD = join(tmp, "day.jsonl");   // 7 Oct 02:56 IST: a compile for 6 Oct run after IST midnight (the 13 Nov case)
    const late = compileDay({ ...base, path: LD, date: "2026-10-06", now: lateNow }), nd = readRows(LD)[0];
    const gd = await gateDay({ stateDir: st, path: LD, date: "2026-10-06", stub: true, now: lateNow, guard: NOGUARD, expect: [nd.id] });
    assert("ROW 883 — a compile for D run after IST midnight carries day D: the gate gates it on D with no absent row beside it, its gate row and the glance read D, never D+1",
      late.ok && nd.day === "2026-10-06" && istDay(nd.ts) === "2026-10-07" && noteDay(nd) === "2026-10-06" && gd.ok && gd.results.length === 1 && gd.results[0].op === "gated"
      && readRows(LD).at(-1).day === "2026-10-06" && /1 axis note\(s\)/.test(glanceLines({ date: "2026-10-06", rows: readRows(LD) })[0]) && /0 axis note\(s\)/.test(glanceLines({ date: "2026-10-07", rows: readRows(LD) })[0]),
      JSON.stringify(gd.results));
    const legacy = { ...nd }; delete legacy.day;
    const LG = join(tmp, "legacy.jsonl"); writeFileSync(LG, JSON.stringify(legacy) + "\n");
    const preLG = bytes(LG), rk = compileDay({ ...base, path: LG, date: "2026-10-06", now: T(25) }), rkRows = readRows(LG);
    assert("ROW 883 — a row with no day keys by the IST day of its ts; unchanged means content AND day, so the same note asked for its study day is RE-KEYED by a superseding row, the old row byte-identical",
      noteDay(legacy) === "2026-10-07" && rk.ok && rk.results[0].op === "recompiled" && rkRows.length === 2 && bytes(LG).startsWith(preLG)
      && rkRows[1].supersedes === legacy.id && rkRows[1].day === "2026-10-06" && rkRows[1].content_sha === legacy.content_sha, JSON.stringify(rk.results));
    const preNs = bytes(LG);
    const ns = await fullTime({ date: "2026-10-08", stub: true, archiveRun: false, compile: () => compileDay({ ...base, path: LG, date: "2026-10-06", now: T(26) }),
      gate: (o) => gateDay({ ...o, stateDir: st, path: LG, now: T(26), guard: NOGUARD }) });
    const nsRow = readRows(LG).at(-1);
    assert("ROW 883 (2) — THE GATE NEVER ENDS SILENT: a note full-time's compile kept that the gate's day key did not reach gets ONE named absent row (cause day-unmatched), never 0 / 0 / 0 / 0",
      ns.ok === false && ns.compile.results[0].op === "unchanged" && ns.gate.results.length === 1 && ns.gate.results[0].op === "absent" && bytes(LG).startsWith(preNs) && readRows(LG).length === 3
      && nsRow.kind === "cold_gate" && nsRow.verdict === "absent" && nsRow.cause === "day-unmatched" && nsRow.of === rkRows[1].id && nsRow.day === "2026-10-06", JSON.stringify(ns.gate.results));

    // ── THE RUNG WITNESS'S CLASS A over the ledger this selftest wrote ───────
    const all = readRows(L), ids = all.map((r) => r.id), comp = all.filter((r) => r.kind === "compiled"), gates = all.filter((r) => r.kind === "cold_gate");
    assert("CLASS A — no id repeats; no compiled row carries a verdict; every gate names a note compiled at or before it",
      new Set(ids).size === ids.length && ids.every((x) => typeof x === "string" && x) && comp.every((x) => !("verdict" in x) && !("traps_named" in x))
      && gates.every((g) => comp.some((c) => c.id === g.of && Date.parse(c.ts) <= Date.parse(g.ts))));
    const gl = glanceLines({ date: "2026-10-06", rows: all });
    assert("THE GLANCE — the day's live blocks on one screen: one header, one block per live note with its gate and traps, ONE haan line",
      gl.length <= 40 && /1 axis note\(s\)/.test(gl[0]) && gl.some((l) => /── tokenization · axis a .* gate PASS \(stub\) · traps T1 T2 T3 T4/.test(l)) && /ONE haan/.test(gl.at(-1))
      && gl.some((l) => /\] BOLO: /.test(l)) && gl.some((l) => /\] PEHLE GUESS \(cracked\) \(shaky\): /.test(l)) && gl.some((l) => /^  LINE /.test(l)));
  } catch (e) { fail++; console.log(`  CRASH the selftest threw — ${String((e && e.message) || e).slice(0, 200)} (a crash is never a pass)`); }
  finally { rmSync(tmp, { recursive: true, force: true }); }
  console.log(`\nnotes_compiler selftest: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
const flag = (argv, k) => { const i = argv.indexOf(k); return i >= 0 ? (argv[i + 1] ?? "") : null; };
const flags = (argv, k) => argv.flatMap((a, i) => (a === k && i + 1 < argv.length ? [argv[i + 1]] : []));
async function main() {
  const [mode, ...rest] = process.argv.slice(2);
  const date = flag(rest, "--date") || todayIst();
  const stub = rest.includes("--stub") || String(process.env[STUB_ENV] || "").toLowerCase() === "stub";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { console.error(`notes_compiler: --date is an IST day YYYY-MM-DD (${date})`); process.exitCode = 2; return; }
  const say = (r) => { const line = `  ${r.concept}/${r.axis} ${r.op}${r.id ? ` ${r.id}` : ""}${r.supersedes ? ` (supersedes ${r.supersedes})` : ""}${r.verdict ? ` · ${r.verdict.toUpperCase()}` : ""}${r.cause ? ` · ABSENT (${r.cause})` : ""}${r.why ? ` — ${r.why}` : ""}`; (r.op === "refused" || r.op === "not-run" || r.op === "absent" ? console.error : console.log)(line); };
  switch (mode) {
    case "compile": {
      const c = compileDay({ date, concept: flag(rest, "--concept"), axis: flag(rest, "--axis"), sessions: flags(rest, "--session") });
      if (c.why) console.error(`notes_compiler: NOTHING COMPILED — ${c.why}`);
      c.results.forEach(say);
      console.log(summary(date, c, { results: [] }, stub).replace(/ · gate .*? \(reader [^)]*\)/, ""));
      if (!c.ok) process.exitCode = 1;
      break;
    }
    case "gate": {
      const g = await gateDay({ date, stub, again: rest.includes("--again") });
      if (g.why) console.error(`notes_compiler: NOTHING GATED — ${g.why}`);
      g.results.forEach(say);
      console.log(`notes_compiler: gate ${date} IST · ${g.results.filter((r) => r.op === "gated").length} gated (${g.results.filter((r) => r.verdict === "pass").length} pass) · ${g.results.filter((r) => r.op === "absent").length} absent (named) · ${g.results.filter((r) => r.op !== "gated" && r.op !== "absent").length} not run · reader ${stub ? "stub" : `role:${READER_ROLE}`}`);
      if (!g.ok) process.exitCode = 1;
      break;
    }
    case "fulltime": {
      const f = await fullTime({ date, stub, archiveRun: !rest.includes("--no-archive-run") });
      for (const l of f.lines) (/NOT CAUGHT UP/.test(l) ? console.error : console.log)(`  ${l}`);
      if (f.compile.why) console.error(`notes_compiler: NOTHING COMPILED — ${f.compile.why}`);
      f.compile.results.forEach(say); (f.gate.results || []).forEach(say);
      console.log(summary(date, f.compile, f.gate, stub));
      console.log(`  glance: node scripts/notes_compiler.mjs glance --date ${date}`);
      if (!f.ok) process.exitCode = 1;
      break;
    }
    case "glance": {
      let rows; try { rows = readRows(); } catch (e) { console.error(`notes_compiler: the ledger cannot be read (${clip(e && e.message, 120)})`); process.exitCode = 1; break; }
      for (const l of glanceLines({ date, rows })) console.log(l);
      break;
    }
    case "status": {
      let rows; try { rows = readRows(); } catch (e) { console.error(`notes_compiler: the ledger cannot be read (${clip(e && e.message, 120)})`); process.exitCode = 1; break; }
      const s = noteState(rows);
      console.log(`notes_compiler: ${s.compiled.length} compiled row(s) · ${s.live.length} live · ${s.superseded.size} superseded · ${s.gates.length} gate row(s) · ${s.live.filter((n) => (s.lastGate(n.id) || {}).verdict === "pass").length} live note(s) gate-passed · ${COMPILER}`);
      break;
    }
    case "born": {
      const b = born();
      if (b.ok) console.log(`notes_compiler: born ${b.path} (0 bytes) — add it by pathspec in the landing commit (forks row 787 (1))`);
      else { console.error(`notes_compiler: born REFUSED — ${b.why} (${b.path})`); process.exitCode = 1; }
      break;
    }
    case "selftest": await selftest(); break;
    default:
      console.log("notes_compiler: compile [--date D] [--concept c] [--axis x] [--session <id>]… | gate [--date D] [--stub] [--again] | fulltime [--date D] [--stub] [--no-archive-run] | glance [--date D] | status | born | selftest   (D = IST day; ARSENAL_COLD_READER=stub stubs the reader)");
      if (mode) process.exitCode = 2;
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
