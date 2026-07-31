#!/usr/bin/env node
// ============================================================================
// scripts/course.mjs · ARSENAL AI FC — THE COURSE POSITION TRACKER
// ----------------------------------------------------------------------------
// WHAT:  Sole writer of dressing-room/state/course.json — WHICH chapter of a video
//   course the captain is standing on, what every chapter is called, where it starts,
//   and which ones are already covered. Deterministic · zero-LLM · zero-network ·
//   zero-dependency · empty-safe.
//
// WHY (1 Aug 2026, the actual scar): his Python anchor is a ~5-hour YouTube course
//   (Dave Ebbelaar, "Python for AI & Agents"), and sprint.json has carried it as
//   `playlist_anchor` — a bare string — the whole time. Nothing in this organism knew
//   one fact about it: not the chapter he is on, not what the next chapter covers,
//   not how much is left. Every organ that plans his day has been planning around a
//   five-hour hole and calling it a plan.
//   Two attempts to close that hole from OUTSIDE both failed on this machine today:
//   Gemini could not watch the video, and yt-dlp is not installed (Python 3.14.6 is;
//   yt-dlp is not). So v1 fetches NOTHING. It reads a chapter list the captain PASTES.
//   That is the honest capability, and it is stated in the open rather than papered
//   over with a network call that does not exist here.
//
// THE ONE LAW OF THIS ORGAN — NEVER INVENT A CHAPTER.
//   A tracker that hallucinates chapters is worse than the hole it replaced: he would
//   plan a day against a syllabus that does not exist. So:
//     · only an explicit `Chapter N: Title` header creates a chapter;
//     · gaps are preserved verbatim — an input with 1, 2, 5 stores 1, 2, 5 and never
//       manufactures 3 and 4 to make the list look tidy;
//     · a paste that yields ZERO chapters is a LOUD refusal that writes nothing, not
//       an empty course silently overwriting a real one.
//   The deliberately-omitted feature is the reason for that last rule: a bare
//   `MM:SS <text>` line is NOT accepted as a chapter, because a 5-hour transcript is
//   thousands of such lines and that fallback would coin ~4,000 chapters out of the
//   body text. Refusing with instructions beats guessing at scale.
//
// RE-INGEST IS ADDITIVE, NEVER A RESET (the data-loss scar this file refuses to earn):
//   the same course id merges by chapter number — titles/timestamps from the new paste
//   win, `covered`/`covered_at`/`current` from the old state SURVIVE. Chapters the new
//   paste does not mention are CARRIED OVER untouched, because the realistic action is
//   pasting the first 40 chapters today and a partial list next week; a strict
//   "the paste is the truth" merge would silently delete progress he actually earned.
//   A DIFFERENT course id is a different course: it replaces, and the CLI says so loudly.
//
// TOPIC-AGNOSTIC ON PURPOSE: nothing here knows the word "Python". The state shape
//   carries any course — the Anthropic Prompt-Engineering course (sprint 1-06, 9 ch)
//   lands in the same file with zero code change.
//
// STATE (dressing-room/state/course.json), single writer, atomic temp→rename:
//   { version, course: { id, title, source_url|null, ingested_at },
//     chapters: [ { n, title, start_seconds|null, covered, covered_at|null } ],
//     current: n|null, current_at: ISO|null, updated_at }
//   `current_at` is ADDITIVE to the agreed shape and load-bearing: `updated_at` is
//   clobbered by the next `done`, so without it the answer to "when did he reach this
//   chapter" is destroyed by the very next command. Consumers may ignore it.
//   `course: null` + `chapters: []` is the honest empty envelope — a consumer never
//   has to special-case a missing file.
//
// HOOK-SAFE: `status` and `json` never throw and always exit 0. A course tracker must
//   never be able to block the captain's prompt. `at`/`done`/`ingest` are interactive
//   and DO exit non-zero — a refusal he cannot see is a refusal that did not happen.
//
// CLI: ingest <file> | at <n> | done <n> | status | json | selftest
// ============================================================================

import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync, rmSync, statSync } from "node:fs";
import { join, dirname, basename, extname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "dressing-room", "state");
const STATE     = join(STATE_DIR, "course.json");

const STATE_VERSION = 1;
const MAX_TITLE = 120;          // a mis-parse must not drag a whole transcript line into a title

// ---------------------------------------------------------------------------
// PURE CORE — every mutation below is a pure function of (state, input, now).
// Nothing here opens a file, reads a clock, or touches the network, so the
// selftest proves the real engine on fixtures instead of proving a mock.
// ---------------------------------------------------------------------------

// Idempotence is the load-bearing property here, not prettiness — capture.mjs paid
// for that lesson with duplicated reps when normText was non-idempotent. The course
// id is derived from the title, and `ingest` matches on it: if slug(slug(x)) !== slug(x)
// then re-ingesting the SAME course would read as a NEW course and wipe his progress.
const slug = (s) => String(s || "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "")
  .slice(0, 60)
  .replace(/^-+|-+$/g, "");

const shortTitle = (s, max = 46) => {
  const t = String(s || "").replace(/\s+/g, " ").trim();
  return t.length > max ? t.slice(0, max - 1) + "…" : t;
};

// h:mm:ss / mm:ss → seconds. Bounded on purpose: "12:75" is not a timestamp, it is a
// score line or a version string, and accepting it would put a fake start time on a
// real chapter. Only the FIRST component is unbounded (a "90:12" mm:ss stamp is legal).
function parseTimestamp(raw) {
  const m = /^(?:(\d{1,3}):)?(\d{1,3}):(\d{2})$/.exec(String(raw || "").trim());
  if (!m) return null;
  const h = m[1] === undefined ? 0 : Number(m[1]);
  const mm = Number(m[2]);
  const ss = Number(m[3]);
  if (ss > 59) return null;
  if (m[1] !== undefined && mm > 59) return null;
  return h * 3600 + mm * 60 + ss;
}

// A stamp at the START of a line: "00:04:31 first thing we need", "[0:12] hey". This is
// the shape of every transcript body line and of a YouTube description chapter list.
function headStamp(line) {
  const s = String(line || "");
  const m = /^\s*[[(]?\s*((?:\d{1,3}:)?\d{1,3}:\d{2})\s*[\])]?\s*[-–—|:]?\s*/.exec(s);
  if (!m) return null;
  const seconds = parseTimestamp(m[1]);
  if (seconds === null) return null;
  return { seconds, rest: s.slice(m[0].length) };
}

// A stamp at the END of a header: "Chapter 12: Running Python Code   1:02:03".
// THE SEPARATOR RULE IS NOT COSMETIC: a bare `\d+:\d\d` at the end of a title matches
// real titles too — "Chapter 5: Python 3:10 vs 3:11" would lose its tail and gain a
// 191-second start time. So a tail stamp counts only when it is bracketed, or fenced
// off by 2+ spaces or a dash — i.e. when it was formatted as a column, not as prose.
function tailStamp(line) {
  const s = String(line || "");
  const m = /(?:\s{2,}|\s*[[(]|\s+[-–—|]\s+)((?:\d{1,3}:)?\d{1,3}:\d{2})\s*[\])]?\s*$/.exec(s);
  if (!m) return null;
  const seconds = parseTimestamp(m[1]);
  if (seconds === null) return null;
  return { seconds, rest: s.slice(0, m.index) };
}

// The ONLY thing that creates a chapter. Tolerant about decoration (a leading bullet,
// a leading stamp, ":" vs "-" vs nothing as the separator), strict about the word.
// "Chapters: 84 total" does not match — `chapter` must be followed by the number.
const CHAPTER_RE = /^\s*(?:[-*•]\s*|\d{1,3}[).]\s+)?chapter\s*#?\s*(\d{1,4})\s*(?:[:.)\]\-–—]\s*|\s+)?(.*)$/i;

function parseChapterHeader(line) {
  let s = String(line || "");
  let stamp = null;
  const head = headStamp(s);
  if (head) { stamp = head.seconds; s = head.rest; }
  const m = CHAPTER_RE.exec(s);
  if (!m) return null;
  let title = String(m[2] || "").trim();
  const tail = tailStamp(title);
  if (tail) { if (stamp === null) stamp = tail.seconds; title = tail.rest; }
  title = title.replace(/\s+/g, " ").trim().slice(0, MAX_TITLE).trim();
  const n = Number(m[1]);
  if (!Number.isInteger(n) || n < 1) return null;
  // An empty title is named after its own number rather than left blank: that is
  // labelling what IS in the input, not inventing a chapter that is not.
  return { n, title: title || `Chapter ${n}`, start_seconds: stamp };
}

// Preamble directives — the only way the captain names the course itself. Read ONLY
// from the lines above the first chapter header, so a transcript sentence that happens
// to start "Title: ..." three hours in cannot rename his course.
function directive(preamble, names) {
  for (const line of preamble) {
    const m = /^\s*([A-Za-z][A-Za-z_ ]{1,19})\s*[:=]\s*(.+?)\s*$/.exec(String(line || ""));
    if (!m) continue;
    const key = m[1].toLowerCase().replace(/[_\s]+/g, " ").trim();
    if (names.includes(key)) return m[2].trim();
  }
  return null;
}

// text → { ok, course, chapters, stats } · NEVER throws, NEVER invents.
function parseCourse(text, opts = {}) {
  const lines = String(text || "").split(/\r?\n/);

  const heads = [];
  for (let i = 0; i < lines.length; i++) {
    const h = parseChapterHeader(lines[i]);
    if (h) heads.push({ ...h, line: i });
  }
  if (!heads.length) {
    return {
      ok: false,
      why: "no `Chapter N: Title` line found — nothing was written. v1 reads chapter HEADERS only; "
         + "a bare `MM:SS text` transcript line is deliberately not treated as a chapter (a 5h transcript would coin thousands).",
      course: null, chapters: [], stats: { headers: 0 },
    };
  }

  // A chapter with no stamp on its own header takes the FIRST stamp of the transcript
  // that follows it, before the next header. That timestamp is IN the input — it is
  // where the chapter demonstrably starts speaking — so this is reading, not guessing.
  for (let k = 0; k < heads.length; k++) {
    if (heads[k].start_seconds !== null) continue;
    const end = k + 1 < heads.length ? heads[k + 1].line : lines.length;
    for (let i = heads[k].line + 1; i < end; i++) {
      const s = headStamp(lines[i]);
      if (s) { heads[k].start_seconds = s.seconds; break; }
    }
  }

  // Fold by number. His paste will very often carry a table of contents AND the body,
  // so the same chapter appears twice: first title wins, and a later occurrence is
  // allowed to FILL a missing timestamp but never to overwrite one.
  const byN = new Map();
  for (const h of heads) {
    const prev = byN.get(h.n);
    if (!prev) byN.set(h.n, { n: h.n, title: h.title, start_seconds: h.start_seconds });
    else if (prev.start_seconds === null && h.start_seconds !== null) prev.start_seconds = h.start_seconds;
  }
  const chapters = [...byN.values()].sort((a, b) => a.n - b.n);

  const preamble = lines.slice(0, heads[0].line);
  const title = directive(preamble, ["title", "course", "course title"]) || opts.title || "Untitled course";
  const rawUrl = directive(preamble, ["url", "source", "source url", "link", "playlist"]);
  const source_url = rawUrl && /^https?:\/\//i.test(rawUrl) ? rawUrl : null;   // never store a guess
  const id = slug(directive(preamble, ["id", "course id"]) || title) || "course";

  return {
    ok: true,
    course: { id, title: String(title).replace(/\s+/g, " ").trim().slice(0, MAX_TITLE), source_url },
    chapters,
    stats: {
      headers: heads.length,
      chapters: chapters.length,
      duplicate_headers: heads.length - chapters.length,
      no_timestamp: chapters.filter((c) => c.start_seconds === null).length,
    },
  };
}

function emptyState() {
  return { version: STATE_VERSION, course: null, chapters: [], current: null, current_at: null, updated_at: null };
}

// Defensive coercion of whatever is on disk. A hand-edited or half-written course.json
// must degrade into a usable state rather than crash a status line printed on a hook.
function normalize(j) {
  const byN = new Map();
  for (const c of (Array.isArray(j && j.chapters) ? j.chapters : [])) {
    if (!c || !Number.isInteger(c.n) || c.n < 1 || byN.has(c.n)) continue;
    byN.set(c.n, {
      n: c.n,
      title: typeof c.title === "string" && c.title.trim() ? c.title : `Chapter ${c.n}`,
      start_seconds: Number.isInteger(c.start_seconds) && c.start_seconds >= 0 ? c.start_seconds : null,
      covered: c.covered === true,
      covered_at: c.covered === true && typeof c.covered_at === "string" ? c.covered_at : null,
    });
  }
  const chapters = [...byN.values()].sort((a, b) => a.n - b.n);
  const co = j && j.course && typeof j.course === "object" ? j.course : null;
  const course = co && (co.id || co.title) ? {
    id: slug(co.id || co.title) || "course",
    title: typeof co.title === "string" && co.title.trim() ? co.title : String(co.id || "Untitled course"),
    source_url: typeof co.source_url === "string" && /^https?:\/\//i.test(co.source_url) ? co.source_url : null,
    ingested_at: typeof co.ingested_at === "string" ? co.ingested_at : null,
  } : null;
  const current = Number.isInteger(j && j.current) && chapters.some((c) => c.n === j.current) ? j.current : null;
  return {
    version: STATE_VERSION,
    course,
    chapters,
    current,
    current_at: current !== null && typeof j.current_at === "string" ? j.current_at : null,
    updated_at: typeof (j && j.updated_at) === "string" ? j.updated_at : null,
  };
}

// prev + parsed → next. Additive by contract (see the header): progress survives.
function mergeCourse(prev, parsed, now = new Date()) {
  if (!parsed || !parsed.ok) return { ok: false, why: (parsed && parsed.why) || "nothing parsed", state: prev };
  const ts = now.toISOString();
  const had = !!(prev && prev.course && prev.course.id);
  const same = had && prev.course.id === parsed.course.id;

  const byN = new Map();
  if (same) for (const c of prev.chapters) byN.set(c.n, { ...c });
  const carried = [], added = [], updated = [];
  const fresh = new Set(parsed.chapters.map((c) => c.n));
  for (const n of byN.keys()) if (!fresh.has(n)) carried.push(n);

  for (const c of parsed.chapters) {
    const old = byN.get(c.n);
    if (old) updated.push(c.n); else added.push(c.n);
    byN.set(c.n, {
      n: c.n,
      title: c.title,
      // a paste without timestamps must not ERASE stamps an earlier paste supplied
      start_seconds: c.start_seconds !== null ? c.start_seconds : (old ? old.start_seconds : null),
      covered: old ? old.covered === true : false,
      covered_at: old && old.covered === true ? (old.covered_at || null) : null,
    });
  }
  const chapters = [...byN.values()].sort((a, b) => a.n - b.n);
  const current = same && prev.current !== null && chapters.some((c) => c.n === prev.current) ? prev.current : null;

  return {
    ok: true,
    replaced: had && !same,
    same_course: same,
    added, updated, carried,
    state: {
      version: STATE_VERSION,
      course: {
        id: parsed.course.id,
        title: parsed.course.title,
        // an update that omits the URL keeps the one he already gave us
        source_url: parsed.course.source_url !== null ? parsed.course.source_url : (same ? prev.course.source_url : null),
        ingested_at: same && prev.course.ingested_at ? prev.course.ingested_at : ts,
      },
      chapters,
      current,
      current_at: current !== null ? (prev.current_at || null) : null,
      updated_at: ts,
    },
  };
}

function markCurrent(state, n, now = new Date()) {
  if (!state || !state.course) return { ok: false, why: "no course ingested yet — run `course.mjs ingest <file>` first", state };
  if (!Number.isInteger(n) || n < 1) return { ok: false, why: `chapter must be a positive integer (got ${n})`, state };
  if (!state.chapters.some((c) => c.n === n)) {
    return { ok: false, why: `no chapter ${n} in "${state.course.title}" — ${state.chapters.length} chapter(s) ingested. Nothing was invented.`, state };
  }
  const ts = now.toISOString();
  return { ok: true, state: { ...state, current: n, current_at: ts, updated_at: ts } };
}

function markDone(state, n, now = new Date()) {
  if (!state || !state.course) return { ok: false, why: "no course ingested yet — run `course.mjs ingest <file>` first", state };
  if (!Number.isInteger(n) || n < 1) return { ok: false, why: `chapter must be a positive integer (got ${n})`, state };
  const target = state.chapters.find((c) => c.n === n);
  if (!target) {
    return { ok: false, why: `no chapter ${n} in "${state.course.title}" — ${state.chapters.length} chapter(s) ingested. Nothing was invented.`, state };
  }
  const ts = now.toISOString();
  return {
    ok: true,
    already: target.covered === true,
    // covered_at is FIRST-wins: it answers "when did he first cover this", and a second
    // `done` (a re-watch, a fat-fingered repeat) must not rewrite that history.
    state: {
      ...state,
      chapters: state.chapters.map((c) => c.n === n ? { ...c, covered: true, covered_at: c.covered === true && c.covered_at ? c.covered_at : ts } : c),
      updated_at: ts,
    },
  };
}

// One compact line. Empty is a first-class answer, not an error.
function statusLine(state) {
  if (!state || !state.course || !Array.isArray(state.chapters) || !state.chapters.length) {
    return "course: nothing ingested yet — `node scripts/course.mjs ingest <file>` with a pasted chapter list";
  }
  const total = state.chapters.length;
  const done = state.chapters.filter((c) => c.covered).length;
  const cur = state.current !== null ? state.chapters.find((c) => c.n === state.current) : null;
  const name = shortTitle(state.course.title, 40);
  if (!cur) return `${name}: not started — ${total} chapters (${done} done)`;
  // The numerator is the chapter's OWN number, not its index: that is the label he sees
  // on screen, and gaps in a partial paste must not silently renumber his position.
  return `${name}: chapter ${cur.n}/${total} — ${shortTitle(cur.title, 48)} (${done} done)`;
}

// ---------------------------------------------------------------------------
// DISK — the only untested layer, kept thin and always guarded.
// ---------------------------------------------------------------------------

function loadState(path = STATE) {
  try {
    if (!existsSync(path)) return { ok: true, fresh: true, state: emptyState() };
    const raw = readFileSync(path, "utf8");
    if (!raw.trim()) return { ok: true, fresh: true, state: emptyState() };
    const j = JSON.parse(raw);
    if (!j || typeof j !== "object" || !Array.isArray(j.chapters)) {
      return { ok: false, why: "course.json exists but is not a course state (no chapters array)", state: emptyState() };
    }
    return { ok: true, fresh: false, state: normalize(j) };
  } catch (e) {
    return { ok: false, why: `course.json unreadable (${(e && e.message) || e})`, state: emptyState() };
  }
}

// atomic: temp → rename. Temp is unique per process AND per call — capture.mjs's scar:
// a fixed `path + ".tmp"` lets two live writers rename each other's half-written file.
let tmpSeq = 0;
function writeAtomic(path, obj) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.${process.pid}.${++tmpSeq}.${Date.now().toString(36)}.tmp`;
  try {
    writeFileSync(tmp, JSON.stringify(obj, null, 2) + "\n");
    renameSync(tmp, path);
  } catch (e) {
    try { rmSync(tmp, { force: true }); } catch { /* best-effort; the throw below is the truth */ }
    throw e;
  }
}

// ---------------------------------------------------------------------------
// SELFTEST — fixtures only. The real course.json is never opened for writing, and
// that claim is MEASURED below (DISK-FREE), not asserted in a comment.
// ---------------------------------------------------------------------------

// existence + size + mtime of the live state file, so "the pure core never wrote"
// is a fact this test can prove instead of a promise it makes.
function diskSig(path = STATE) {
  try {
    if (!existsSync(path)) return "absent";
    const s = statSync(path);
    return `${s.size}:${s.mtimeMs}`;
  } catch { return "unreadable"; }
}

function selftest() {
  let pass = 0, fail = 0;
  const assert = (d, c) => { if (c) { pass++; console.log("  ✓ " + d); } else { fail++; console.log("  ✗ " + d); } };
  const SIG_BEFORE = diskSig();
  const T0 = new Date("2026-08-01T10:00:00Z");
  const T1 = new Date("2026-08-01T11:00:00Z");
  const T2 = new Date("2026-08-02T09:00:00Z");
  const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  // A realistic paste: preamble directives, ":" and "-" separators, a body-derived
  // start time, a header-column start time, a chapter with no timestamp anywhere,
  // and a GAP (3 → 12) that must survive untouched.
  const PASTE = [
    "Python for AI & Agents — Full Beginner Course",
    "Title: Python for AI & Agents — Full Beginner Course",
    "URL: https://www.youtube.com/playlist?list=PL-Y17yukoyy0SupAJSPQYg_Lvre9Kt9EG",
    "",
    "Chapter 1: Introduction",
    "00:00:00 hey everyone welcome to the course",
    "00:00:12 we are going to build agents in python",
    "",
    "Chapter 2: Installing Python",
    "[00:04:31] first thing we need is python itself",
    "00:04:55 go to python.org and download the installer",
    "",
    "Chapter 3 - Your First Script",
    "no timestamps in this stretch at all, he pasted a summary",
    "",
    "Chapter 12: Running Python Code   1:02:03",
    "1:02:10 there are three ways to run a script",
  ].join("\n");

  const p = parseCourse(PASTE);
  assert("REALISTIC PASTE — 4 chapters parsed from a mixed dump", p.ok && p.chapters.length === 4);
  assert("NEVER INVENT — the 3→12 gap survives; 4..11 are not manufactured",
    eq(p.chapters.map((c) => c.n), [1, 2, 3, 12]));
  assert("titles read clean across ':' and '-' separators",
    p.chapters[0].title === "Introduction" && p.chapters[2].title === "Your First Script");
  assert("a chapter's start time comes from the first transcript stamp under it (0 is a real value, not falsy-null)",
    p.chapters[0].start_seconds === 0 && p.chapters[1].start_seconds === 271);
  assert("a stamp in the header COLUMN wins over the body line below it",
    p.chapters[3].start_seconds === 3723);
  assert("no timestamp anywhere ⇒ null, never a fabricated 0", p.chapters[2].start_seconds === null);
  assert("transcript body lines are ignored — they are not chapters", p.stats.headers === 4);
  assert("preamble directives name the course; the url is captured verbatim",
    p.course.title === "Python for AI & Agents — Full Beginner Course"
    && p.course.id === "python-for-ai-agents-full-beginner-course"
    && /^https:\/\/www\.youtube\.com\/playlist/.test(p.course.source_url));

  // ---- parsing edge cases the regexes exist to survive ----
  assert("timestamp bounds: mm:ss, h:mm:ss parse; ss>59 and junk are refused",
    parseTimestamp("0:12") === 12 && parseTimestamp("1:02:03") === 3723
    && parseTimestamp("90:12") === 5412 && parseTimestamp("12:75") === null && parseTimestamp("abc") === null);
  assert("SEPARATOR RULE — a version-like tail in a title is NOT eaten as a timestamp",
    (() => { const h = parseChapterHeader("Chapter 5: Python 3:10 vs 3:11"); return h.title === "Python 3:10 vs 3:11" && h.start_seconds === null; })());
  assert("a leading stamp on the header itself is read (YouTube description form)",
    parseChapterHeader("00:04:31 Chapter 2: Installing Python").start_seconds === 271);
  assert("decoration tolerated: bullets, '#', bare-space separator",
    parseChapterHeader("- Chapter #7 Modules").n === 7 && parseChapterHeader("- Chapter #7 Modules").title === "Modules");
  assert("an empty title is labelled by its own number, never left blank",
    parseChapterHeader("Chapter 9:").title === "Chapter 9");
  assert("'Chapters: 84 total' is not a chapter, and mid-sentence 'chapter 3' is not either",
    parseChapterHeader("Chapters: 84 total") === null && parseChapterHeader("and in chapter 3 we saw") === null);
  assert("SLUG IS IDEMPOTENT — a non-idempotent id would read a re-ingest as a NEW course and wipe progress",
    ["Python for AI & Agents — Full Beginner Course", "-python-", "  A  B  ", "!!!"].every((s) => slug(s) === slug(slug(s))));

  // ---- malformed input writes NOTHING ----
  assert("MALFORMED — empty text is refused loudly, no state produced",
    parseCourse("").ok === false && /no `Chapter N: Title`/.test(parseCourse("").why));
  assert("MALFORMED — prose with no chapter headers is refused", parseCourse("just some notes I took, nothing structured").ok === false);
  assert("THE DANGEROUS ONE — a pure transcript dump coins ZERO chapters (never thousands)",
    parseCourse(["00:00:01 hello and welcome", "00:00:05 today we install python", "00:12:44 now the venv"].join("\n")).ok === false);
  assert("a refused parse cannot reach the state at all (merge rejects it)",
    mergeCourse(emptyState(), parseCourse("garbage"), T0).ok === false);

  // ---- merge into a fresh state ----
  const m0 = mergeCourse(emptyState(), p, T0);
  const s0 = m0.state;
  assert("fresh merge: 4 chapters, nothing covered, nothing current",
    m0.ok && s0.chapters.length === 4 && s0.current === null && s0.chapters.every((c) => c.covered === false && c.covered_at === null));
  assert("state shape is the agreed envelope (version/course/chapters/current/updated_at)",
    s0.version === 1 && s0.course.ingested_at === T0.toISOString() && s0.updated_at === T0.toISOString()
    && eq(Object.keys(s0), ["version", "course", "chapters", "current", "current_at", "updated_at"]));

  // ---- at / done transitions ----
  const a1 = markCurrent(s0, 2, T1);
  assert("`at 2` sets current and records its own ts", a1.ok && a1.state.current === 2 && a1.state.current_at === T1.toISOString());
  const d1 = markDone(markDone(a1.state, 1, T1).state, 2, T1);
  assert("`done` marks covered + covered_at, and the count is right",
    d1.ok && d1.state.chapters.filter((c) => c.covered).length === 2 && d1.state.chapters[0].covered_at === T1.toISOString());
  const d2 = markDone(d1.state, 2, T2);
  assert("`done` twice is idempotent — covered_at keeps the FIRST time he covered it",
    d2.ok && d2.already === true && d2.state.chapters.find((c) => c.n === 2).covered_at === T1.toISOString());
  assert("`at`/`done` refuse a chapter that does not exist and change NOTHING",
    markCurrent(d1.state, 99, T2).ok === false && markDone(d1.state, 99, T2).ok === false
    && eq(markCurrent(d1.state, 99, T2).state, d1.state) && /Nothing was invented/.test(markCurrent(d1.state, 99, T2).why));
  assert("`at`/`done` refuse junk input (0, negative, non-integer)",
    [0, -3, 2.5, NaN, "2"].every((n) => markCurrent(d1.state, n, T2).ok === false && markDone(d1.state, n, T2).ok === false));
  assert("`at`/`done` on an empty state refuse instead of fabricating a course",
    markCurrent(emptyState(), 1, T2).ok === false && /no course ingested/.test(markDone(emptyState(), 1, T2).why));

  // ---- idempotent re-ingest ----
  const r1 = mergeCourse(d2.state, parseCourse(PASTE), T2);
  assert("RE-INGEST is idempotent — same course, still 4 chapters, no duplicates",
    r1.ok && r1.same_course === true && r1.state.chapters.length === 4 && eq(r1.state.chapters.map((c) => c.n), [1, 2, 3, 12]));
  assert("RE-INGEST preserves progress: covered marks, covered_at, and current all survive",
    r1.state.chapters.filter((c) => c.covered).length === 2
    && r1.state.chapters.find((c) => c.n === 2).covered_at === T1.toISOString()
    && r1.state.current === 2 && r1.state.current_at === T1.toISOString());
  assert("RE-INGEST keeps the original ingested_at but moves updated_at",
    r1.state.course.ingested_at === T0.toISOString() && r1.state.updated_at === T2.toISOString());

  // a PARTIAL re-paste is the realistic action, and it must not delete his progress
  const partial = mergeCourse(r1.state, parseCourse("Title: Python for AI & Agents — Full Beginner Course\nChapter 1: Introduction (revised)"), T2);
  assert("PARTIAL re-paste CARRIES OVER the chapters it does not mention (progress is never silently deleted)",
    partial.state.chapters.length === 4 && eq(partial.carried, [2, 3, 12])
    && partial.state.chapters.filter((c) => c.covered).length === 2);
  assert("…and the mentioned chapter is updated, without erasing a timestamp the earlier paste supplied",
    partial.state.chapters[0].title === "Introduction (revised)" && partial.state.chapters[0].start_seconds === 0);

  const grown = mergeCourse(r1.state, parseCourse(PASTE + "\n\nChapter 13: Virtual Environments\n1:15:00 venvs keep projects apart"), T2);
  assert("an EXTENDED paste adds only what is new (5 chapters, 1 added, 4 updated)",
    grown.state.chapters.length === 5 && eq(grown.added, [13]) && grown.updated.length === 4
    && grown.state.chapters.find((c) => c.n === 13).start_seconds === 4500);

  // a table of contents + the body = the same chapter twice in one paste
  const dup = parseCourse(["Title: Dup Test", "Chapter 1: Intro", "Chapter 2: Setup", "", "Chapter 1: Intro", "00:01:00 body line"].join("\n"));
  assert("a chapter listed twice in one paste folds into ONE, and the later occurrence may FILL a missing stamp",
    dup.chapters.length === 2 && dup.stats.duplicate_headers === 1 && dup.chapters[0].start_seconds === 60);

  // a DIFFERENT course is a different course — replaces, and says so
  const other = mergeCourse(r1.state, parseCourse("Title: Anthropic Prompt Engineering\nChapter 1: Basic prompt structure"), T2);
  assert("a DIFFERENT course id replaces (progress not carried across) and the swap is reported",
    other.replaced === true && other.same_course === false && other.state.chapters.length === 1
    && other.state.chapters.every((c) => c.covered === false) && other.state.current === null);
  assert("TOPIC-AGNOSTIC — nothing in the engine knows the word 'python'",
    other.state.course.id === "anthropic-prompt-engineering");

  // ---- status line ----
  assert("STATUS on empty state is a first-class answer, not an error",
    /nothing ingested yet/.test(statusLine(emptyState())) && /nothing ingested yet/.test(statusLine(null)));
  assert("STATUS before he starts says so", /not started — 4 chapters \(0 done\)/.test(statusLine(s0)));
  assert("STATUS is the one compact line: chapter n/total — title (done)",
    statusLine(d2.state) === "Python for AI & Agents — Full Beginner …: chapter 2/4 — Installing Python (2 done)");
  assert("STATUS never throws on a mangled state", (() => { try { statusLine({ course: {}, chapters: null }); return true; } catch { return false; } })());

  // ---- normalize: a hand-mangled file degrades, never crashes ----
  const norm = normalize({ course: { title: "X" }, chapters: [{ n: 2, title: "b" }, { n: 2, title: "dupe" }, { n: "x" }, null, { n: 1, covered: true, covered_at: "2026-08-01T00:00:00Z" }], current: 9 });
  assert("normalize drops junk rows, de-dupes by n, sorts, and forgets a current that no longer exists",
    norm.chapters.length === 2 && norm.chapters[0].n === 1 && norm.current === null && norm.chapters[0].covered === true);
  assert("normalize invents a title for a row that lost one, and never a chapter", norm.chapters[0].title === "Chapter 1");

  // ---- THE DISK-FREE CLAIM, MEASURED ----
  assert("PURE CORE IS DISK-FREE — the live course.json was not created, touched or resized by any of the above",
    diskSig() === SIG_BEFORE);
  assert("…and no orphan temp was left beside it", !existsSync(`${STATE}.tmp`));

  console.log(`\ncourse selftest: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const fmtStamp = (s) => s === null ? "--:--" : `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

function main() {
  const cmd = (process.argv[2] || "").toLowerCase();

  // HOOK PATHS FIRST — these two can be read by any organ and must never throw.
  if (cmd === "status") {
    try { console.log(statusLine(loadState().state)); } catch { /* silence is the contract */ }
    process.exit(0);
  }
  if (cmd === "json") {
    try { console.log(JSON.stringify(loadState().state, null, 2)); } catch { console.log(JSON.stringify(emptyState(), null, 2)); }
    process.exit(0);
  }
  if (cmd === "selftest") return selftest();

  if (cmd === "ingest") {
    const fileArg = process.argv[3];
    let text, srcName = null;
    if (fileArg) {
      if (!existsSync(fileArg)) { console.error(`course: file not found: ${fileArg}`); process.exit(1); }
      try { text = readFileSync(fileArg, "utf8"); } catch (e) { console.error(`course: could not read ${fileArg} (${(e && e.code) || e})`); process.exit(1); }
      srcName = basename(fileArg, extname(fileArg)).replace(/[_-]+/g, " ").trim();
    } else if (!process.stdin.isTTY) {
      try { text = readFileSync(0, "utf8"); } catch { console.error("course: could not read piped input"); process.exit(1); }
    } else {
      console.error("course: paste the chapter list into a file first.\n  node scripts/course.mjs ingest chapters.txt");
      process.exit(1);
    }

    const cur = loadState();
    // REFUSE, DO NOT OVERWRITE. An unreadable course.json may still hold weeks of
    // covered marks; blowing it away to "recover" would be the data loss this organ
    // is written to avoid. He moves it aside himself, deliberately.
    if (!cur.ok) {
      console.error(`course: ${cur.why} — refusing to overwrite progress I cannot read.`);
      console.error(`course:   move ${STATE} aside yourself, then re-run this ingest.`);
      process.exit(1);
    }

    const parsed = parseCourse(text, { title: srcName || undefined });
    if (!parsed.ok) {
      console.error(`course: NOTHING WAS WRITTEN — ${parsed.why}`);
      console.error("course:   expected lines like `Chapter 12: Running Python Code` (a leading or column timestamp is optional).");
      process.exit(1);
    }
    const m = mergeCourse(cur.state, parsed, new Date());
    try { writeAtomic(STATE, m.state); }
    catch (e) {
      console.error(`course: FAILED to write — nothing changed (${(e && e.code) || "error"}: ${(e && e.message) || e}).`);
      process.exit(1);
    }
    console.log(`course: ingested "${m.state.course.title}" · ${m.state.chapters.length} chapters (${m.added.length} new, ${m.updated.length} updated, ${m.carried.length} carried over) → ${STATE}`);
    if (m.replaced) console.log("course: ⚠ this is a DIFFERENT course than the one stored — the previous course's progress is gone from this file.");
    if (parsed.stats.no_timestamp) console.log(`course: ⚠ ${parsed.stats.no_timestamp} chapter(s) have no start timestamp in your paste (stored as null, never guessed).`);
    if (parsed.stats.duplicate_headers) console.log(`course: ${parsed.stats.duplicate_headers} duplicate header(s) folded (a table of contents plus the body reads as one chapter).`);
    console.log(`  ${statusLine(m.state)}`);
    process.exit(0);
  }

  if (cmd === "at" || cmd === "done") {
    const n = Number(process.argv[3]);
    const cur = loadState();
    if (!cur.ok) { console.error(`course: ${cur.why} — refusing to write over a state I cannot read.`); process.exit(1); }
    const res = cmd === "at" ? markCurrent(cur.state, n, new Date()) : markDone(cur.state, n, new Date());
    if (!res.ok) { console.error(`course: ${res.why}`); process.exit(1); }
    try { writeAtomic(STATE, res.state); }
    catch (e) { console.error(`course: FAILED to write — nothing changed (${(e && e.code) || "error"}).`); process.exit(1); }
    const ch = res.state.chapters.find((c) => c.n === n);
    console.log(cmd === "at"
      ? `course: now on chapter ${n} — ${ch.title} @ ${fmtStamp(ch.start_seconds)}`
      : `course: chapter ${n} covered${res.already ? " (already was — covered_at kept)" : ""} — ${ch.title}`);
    console.log(`  ${statusLine(res.state)}`);
    process.exit(0);
  }

  console.log([
    "THE COURSE POSITION TRACKER — which chapter of a video course he is on",
    "  node scripts/course.mjs ingest <file>   read a pasted chapter list (`Chapter N: Title`); additive, never resets progress",
    "  node scripts/course.mjs at <n>          mark the chapter he is on now",
    "  node scripts/course.mjs done <n>        mark chapter n covered",
    "  node scripts/course.mjs status          one compact line",
    "  node scripts/course.mjs json            full state for other organs",
    "  node scripts/course.mjs selftest        fixtures only; never writes state",
  ].join("\n"));
  process.exit(0);
}

// Windows-safe entry guard (argv[1] normalised to a file:// URL, like capture.mjs)
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

export { parseCourse, parseChapterHeader, parseTimestamp, mergeCourse, markCurrent, markDone, statusLine, loadState, normalize, emptyState, slug };
