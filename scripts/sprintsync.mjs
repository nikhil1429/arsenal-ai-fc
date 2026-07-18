#!/usr/bin/env node
// ============================================================================
// sprintsync.mjs · ARSENAL AI FC — LIVE SPRINT SYNC (working-memory)
// ----------------------------------------------------------------------------
// WHAT: pulls the captain's REAL position from his live Google Sheet (the Sprint
//   Board, CSV export — the sheet is link-shared so no auth) and refreshes the
//   `progress` block of sprint.json: what's Done, what's In Progress (his current
//   task), and what's next. So the session-agnostic kickoff always shows his TRUE
//   position without any manual mirroring. Automates the FRICTION, not the baking.
// SINGLE WRITER of sprint.json's `progress` block (preserves the rest of the file).
// CONFIG: dressing-room/state/sprint_config.json (gitignored) → { sheet_id, gid }
//   or env ARSENAL_SPRINT_SHEET / ARSENAL_SPRINT_GID. Absent → graceful no-op.
// MODES: sync (default) · selftest
// ============================================================================
import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE = join(__dirname, "..", "dressing-room", "state");
const SPRINT = join(STATE, "sprint.json");
const CFG = join(STATE, "sprint_config.json");

const readJson = (p) => { try { if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")); } catch {} return null; };
function writeAtomic(path, obj) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = path + ".tmp";
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
  sprint.progress = progress;
  writeAtomic(SPRINT, sprint);
  console.log(`sprintsync: synced — current ${progress.current.id} ${progress.current.task} (${progress.current.status}) · ${progress.done.length} done · next ${progress.next_up.length}`);
  return { ok: true, progress };
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
  const passed = checks.every(Boolean);
  console.log(passed ? "\nALL CHECKS PASSED" : "\nSELFTEST FAILED");
  return passed;
}

async function main() {
  const mode = (process.argv[2] || "sync").toLowerCase();
  if (mode === "selftest") { process.exit(selftest() ? 0 : 1); }
  await sync();
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
export { sync, boardToProgress, parseCSV, resolveCfg };
