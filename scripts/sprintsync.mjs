#!/usr/bin/env node
// ============================================================================
// sprintsync.mjs · ARSENAL AI FC — LIVE SPRINT SYNC (working-memory)
// ----------------------------------------------------------------------------
// WHAT: pulls the captain's REAL position from his live Google Sheet (the Sprint
//   Board, CSV export — the sheet is link-shared so no auth) and refreshes the
//   `progress` block of sprint.json: what's Done, what's In Progress (his current
//   task), and what's next. So the session-agnostic kickoff always shows his TRUE
//   position without any manual mirroring. Automates the FRICTION, not the baking.
// SOLE WRITER of sprint.json — the WHOLE file (ownership widened from the
//   `progress` block by the architect's Q-8 ruling, 25 Aug 2026: the file had a
//   declared writer for `progress` and NO legal writer for anything else, so his
//   order "reset all of the dates" had no path that wasn't a hand edit).
//   `sync` still touches only `progress`; `set-start` is the owner's path to the
//   one other movable value. Everything still goes through writeAtomic.
// CONFIG: dressing-room/state/sprint_config.json (gitignored) → { sheet_id, gid }
//   or env ARSENAL_SPRINT_SHEET / ARSENAL_SPRINT_GID. Absent → graceful no-op.
// MODES: sync (default) · set-start <YYYY-MM-DD> · selftest
// ============================================================================
import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync, mkdtempSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE = join(__dirname, "..", "dressing-room", "state");
const SPRINT = join(STATE, "sprint.json");
const CFG = join(STATE, "sprint_config.json");

const readJson = (p) => { try { if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")); } catch {} return null; };
function writeAtomic(path, obj) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = path + "." + process.pid + ".tmp";   // per-pid: two live writers must never share one temp name (same scar capture.mjs:319 fixed)
  writeFileSync(tmp, JSON.stringify(obj, null, 2) + "\n");
  renameSync(tmp, path);
}

// minimal RFC-4180 CSV parser (handles quoted fields + embedded commas/newlines)
function parseCSV(text) {
  const rows = []; let row = [], field = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; }
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

// board CSV → { done:[], current:{}, next_up:[] }
function boardToProgress(csvText, dateStr) {
  const rows = parseCSV(csvText).filter(r => r.some(c => (c || "").trim()));
  if (!rows.length) return null;
  const head = rows[0].map(h => (h || "").trim().toLowerCase());
  const ix = (name) => head.findIndex(h => h.includes(name));
  const cID = ix("id"), cTask = ix("task"), cStatus = ix("status");
  if (cID < 0 || cTask < 0 || cStatus < 0) return null;
  const norm = (s) => (s || "").trim().toLowerCase();
  const data = rows.slice(1).map(r => ({ id: (r[cID] || "").trim(), task: (r[cTask] || "").trim(), status: norm(r[cStatus]) }))
    .filter(r => /^\d/.test(r.id));
  const done = data.filter(r => r.status === "done").map(r => `${r.id} ${r.task}`);
  const inProg = data.find(r => r.status.includes("progress"));
  // current = the In-Progress row, else the first not-done row
  const curRow = inProg || data.find(r => r.status !== "done");
  const curIdx = curRow ? data.indexOf(curRow) : -1;
  const next_up = curIdx >= 0 ? data.slice(curIdx + 1).filter(r => r.status !== "done").slice(0, 3).map(r => `${r.id} ${r.task}`) : [];
  return {
    synced_from_live: `${dateStr} (auto — CSV export of the live sheet)`,
    done, current: curRow ? { id: curRow.id, task: curRow.task, status: inProg ? "in_progress" : "to_do" } : null,
    next_up,
  };
}

function resolveCfg(env = process.env) {
  const c = readJson(CFG) || {};
  const id = env.ARSENAL_SPRINT_SHEET || c.sheet_id;
  const gid = env.ARSENAL_SPRINT_GID || c.gid || "0";
  return id ? { id, gid } : null;
}

async function sync({ fetchFn = fetch, now = new Date() } = {}) {
  const cfg = resolveCfg();
  if (!cfg) { console.log("sprintsync: no sheet configured (sprint_config.json / env) — no-op."); return { ok: false, why: "no-config" }; }
  const url = `https://docs.google.com/spreadsheets/d/${cfg.id}/export?format=csv&gid=${cfg.gid}`;
  let csv;
  try {
    const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 20000);
    const r = await fetchFn(url, { redirect: "follow", signal: ctrl.signal });   // 307 → signed googleusercontent URL, followed
    clearTimeout(t);
    if (!r.ok) { console.log(`sprintsync: fetch ${r.status} — keeping existing sprint.json`); return { ok: false, why: "http-" + r.status }; }
    csv = await r.text();
  } catch (e) { console.log(`sprintsync: fetch failed (${String(e.message).slice(0, 60)}) — keeping existing sprint.json`); return { ok: false, why: "fetch" }; }
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const progress = boardToProgress(csv, dateStr);
  if (!progress || !progress.current) { console.log("sprintsync: could not parse a current task — keeping existing sprint.json"); return { ok: false, why: "parse" }; }
  const sprint = readJson(SPRINT) || {};
  // preserve captain-authored fields on current (track/stream/subtopics/mode) by id
  const prev = (sprint.progress && sprint.progress.current) || {};
  if (prev.id === progress.current.id) progress.current = { ...prev, ...progress.current };
  if (sprint.progress && sprint.progress.examiner_daily) progress.examiner_daily = sprint.progress.examiner_daily;
  // FRESHNESS STAMP (audit #107, 5 Aug 2026). sprint.json is the spine of FOUR
  // readers — the SessionStart brief, the forge nudge, the teaching contract's
  // link-back line, and setpiece's drills. It carried NO timestamp, so a dead Sheet
  // and a synced one were indistinguishable and every reader trusted it equally.
  // (The tell was already on disk: `progress.done` omits `tokenization`, which has
  // been a locked, tempered capsule since 15 Jun.) The brief age-tags this exactly
  // the way it already age-tags working_set.json, so a stale spine is VISIBLE rather
  // than silently believed.
  progress.synced_at = now.toISOString();
  sprint.progress = progress;
  writeAtomic(SPRINT, sprint);
  console.log(`sprintsync: synced — current ${progress.current.id} ${progress.current.task} (${progress.current.status}) · ${progress.done.length} done · next ${progress.next_up.length}`);
  return { ok: true, progress };
}

// set-start — the owner's path for moving sprint.json's `start`, HIS order only.
// (23 Aug 2026: "see at the sprint file, reset all of the dates in it. i am
// starting now." · confirmed 25 Aug: "let's start from today" — Q-8.) Moving
// `start` re-bases what "week N" resolves to in every consumer, so the old value
// is LAYERED into start_history (Law 9), never lost. sprints[].dates stay as the
// xlsx parse wrote them — they are the June plan's record, not live arithmetic.
function setStart(dateStr, { now = new Date(), path = SPRINT } = {}) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr || "") || isNaN(Date.parse(dateStr))) {
    console.log(`sprintsync: set-start needs a real YYYY-MM-DD (got "${dateStr}") — nothing written.`);
    return { ok: false, why: "bad-date" };
  }
  const sprint = readJson(path);
  if (!sprint || !sprint.start) { console.log("sprintsync: sprint.json missing or has no start — nothing written."); return { ok: false, why: "no-file" }; }
  if (sprint.start === dateStr) { console.log(`sprintsync: start already ${dateStr} — nothing to do.`); return { ok: true, why: "noop" }; }
  sprint.start_history = [...(sprint.start_history || []), { start: sprint.start, superseded: now.toISOString(), by: "captain's order (Q-8, architect-ruled 25 Aug 2026)" }];
  sprint.start = dateStr;
  writeAtomic(path, sprint);
  console.log(`sprintsync: start → ${dateStr} (was ${sprint.start_history[sprint.start_history.length - 1].start}; old value layered into start_history)`);
  return { ok: true, start: dateStr };
}

function selftest() {
  const checks = [];
  const assert = (n, c) => { checks.push(!!c); console.log(`  ${c ? "✓" : "✗"} ${n}`); };
  const csv = 'ID,Sprint,Stream / Epic,Task,Sub-topics,Priority,Est Hrs,Status,Date Done,Notes\n'
    + '1-01,Sprint 1,Foundations,Embeddings (finish),"vectors, cosine",P0,8,Done,21/06/2026,\n'
    + '1-02,Sprint 1,Foundations,Inference & sampling,"temperature, top-p",P0,6,Done,24/06/2026,\n'
    + '1-04,Sprint 1,Foundations,Hallucinations,"causes, detection",P0,6,In Progress,,\n'
    + '1-05,Sprint 1,Courses,Anthropic: API Fundamentals,"messages, params",P0,4,To Do,,Colab\n'
    + '1-07,Sprint 1,Python,Python basics (start),"syntax vs JS",P0,16,To Do,,Biggest rock\n';
  const p = boardToProgress(csv, "2026-07-18");
  assert("parses the In-Progress row as CURRENT", p.current.id === "1-04" && p.current.status === "in_progress");
  assert("collects the Done rows", p.done.length === 2 && p.done[0].includes("1-01"));
  assert("next_up = the To-Do rows after current, in order", p.next_up[0].includes("1-05") && p.next_up[1].includes("1-07"));
  // CSV parser: embedded commas inside quotes survive
  const rows = parseCSV('a,"b,c",d\n1,2,3');
  assert("CSV parser keeps quoted commas as one field", rows[0].length === 3 && rows[0][1] === "b,c");
  // no In-Progress → first not-done is current
  const p2 = boardToProgress('ID,Task,Status\n1-01,X,Done\n1-02,Y,To Do\n', "2026-07-18");
  assert("no In-Progress → first not-done row is current", p2.current.id === "1-02" && p2.current.status === "to_do");
  // graceful: junk CSV → null (never a crash / never wipes sprint.json)
  assert("unparseable board → null (keeps existing file)", boardToProgress("garbage\nno,headers,here", "x") === null || boardToProgress("", "x") === null);
  // set-start (Q-8): on a TEMP file, never the live one — moves start, layers the
  // old value (Law 9), refuses junk, and a no-op leaves the file byte-identical.
  {
    const dir = mkdtempSync(join(tmpdir(), "sprintsync-"));
    const tf = join(dir, "sprint.json");
    writeFileSync(tf, JSON.stringify({ start: "2026-06-20", progress: {} }));
    const r1 = setStart("2026-08-25", { path: tf, now: new Date("2026-08-25T05:00:00Z") });
    const after = JSON.parse(readFileSync(tf, "utf8"));
    assert("set-start moves start and layers the old value into start_history",
      r1.ok && after.start === "2026-08-25" && after.start_history.length === 1 && after.start_history[0].start === "2026-06-20");
    const before = readFileSync(tf, "utf8");
    assert("set-start to the same date is a no-op (file untouched)",
      setStart("2026-08-25", { path: tf }).why === "noop" && readFileSync(tf, "utf8") === before);
    assert("set-start refuses a junk date and writes nothing",
      setStart("25-08-2026", { path: tf }).ok === false && readFileSync(tf, "utf8") === before);
  }
  const passed = checks.every(Boolean);
  console.log(passed ? "\nALL CHECKS PASSED" : "\nSELFTEST FAILED");
  return passed;
}

async function main() {
  const mode = (process.argv[2] || "sync").toLowerCase();
  if (mode === "selftest") { process.exit(selftest() ? 0 : 1); }
  if (mode === "set-start") { process.exit(setStart(process.argv[3]).ok ? 0 : 1); }
  await sync();
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
export { sync, boardToProgress, parseCSV, resolveCfg };
