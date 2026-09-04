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
// MODES: sync (default) · set-start <YYYY-MM-DD> · floor <concept> · selftest
//   floor — A4 (4 Sep 2026): writes progress.current_floor, HIS override of the
//   derived syllabus floor. It never writes `done`, and `sync` preserves it.
// ============================================================================
import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { preCyborg } from "./registry.mjs";
import { loadCapsules } from "./rejirah.mjs";   // the capsules have ONE loader, and it is their owner's   // W0-B — THE SYLLABUS FLOOR: one predicate, one owner
import { swallow } from "./swallow.mjs";       // Block 7 — every fs-guarding silent catch is declared
import { join, dirname } from "node:path";
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
  // A4 — `progress` is rebuilt WHOLESALE from the sheet every sync, so anything this
  // organ owns and the sheet does not must be carried across by hand or it dies at the
  // next fetch. `current_floor` is his override; a nightly sync silently discarding it
  // would put him back on the sheet's topic by morning with nothing to show why.
  if (sprint.progress && sprint.progress.current_floor) progress.current_floor = sprint.progress.current_floor;
  // FRESHNESS STAMP (audit #107, 5 Aug 2026). sprint.json is the spine of FOUR
  // readers — the SessionStart brief, the forge nudge, the teaching contract's
  // link-back line, and setpiece's drills. It carried NO timestamp, so a dead Sheet
  // and a synced one were indistinguishable and every reader trusted it equally.
  // (The tell was already on disk: `progress.done` omits `tokenization`, which has
  // been a locked, tempered capsule since 15 Jun.) The brief age-tags this exactly
  // the way it already age-tags working_set.json, so a stale spine is VISIBLE rather
  // than silently believed.
  progress.synced_at = now.toISOString();
  // W0-B — label the done-claims the GAME-ON epoch disqualifies, and ask him for the one
  // edit only he can make. `done` itself is left exactly as the sheet wrote it.
  const preDone = preRestartDone(progress.done, loadCapsuleHeads());
  if (preDone.length) {
    progress.done_pre_restart = preDone;
    progress.done_pre_restart_note = "GAME ON (30 Aug 2026) — yeh sheet ke apne shabd hain aur waise hi rakhe hain; lekin in topics ko tumne dobara khola tha, to organism inhe proof nahi maanta.";
    cardTheSheetEdit(preDone);
  }
  sprint.progress = progress;
  writeAtomic(SPRINT, sprint);
  console.log(`sprintsync: synced — current ${progress.current.id} ${progress.current.task} (${progress.current.status}) · ${progress.done.length} done · next ${progress.next_up.length}`);
  return { ok: true, progress };
}

// ── W0-B (2 Sep 2026) · THE SYLLABUS FLOOR AT THE SHEET (SD-01) ──────────────────
// His live Sheet still marks Embeddings, Inference & sampling and Context window DONE,
// because it was true when he ticked them — and on 30 Aug he re-opened exactly those as
// UNLEARNED. So every router downstream reads "three concepts proven" off a sheet canon
// has overruled, and drives him to the fourth.
//
// THE SHEET IS HIS AND THIS CODE DOES NOT TOUCH IT, and it does not fake the mirror
// either: `done` keeps saying exactly what the sheet says, because that is what `done`
// means. What is added is a LABEL — which of those claims the epoch disqualifies — plus
// ONE card asking him for the one edit only he can make. A floor that silently rewrote his
// own record would be the organism deciding what he has learned, which is his call alone.
//
// NO LIST OF CONCEPT NAMES: the disqualified set is derived from the capsules themselves
// (a pre-epoch lock with no re-lock), so it needs no maintenance the day he locks a fifth.
function preRestartDone(done, capsules) {
  const stale = (capsules || []).filter((c) => { try { return preCyborg(c); } catch { return false; } }).map((c) => String(c.id || "").toLowerCase()).filter(Boolean);
  if (!stale.length) return [];
  return (done || []).filter((d) => stale.some((id) => new RegExp(`\\b${id}\\b`, "i").test(String(d))));
}
// The capsules are READ THROUGH THEIR OWNER (rejirah.mjs loadCapsules), not with a private
// reader. Two reasons, and the second is a gate: one loader means one definition of "a
// capsule", and every fs call on a computed path is a permanent blind spot in xray's
// per-organ budget — a private copy here cost this organ one, and the ratchet caught it.
const loadCapsuleHeads = (dir = join(STATE, "capsules")) => loadCapsules(dir);
// ONE card, at an anchor he already hits, in plain words — no ids, no filenames as the
// subject (his 28-Aug correction). Keyed, so it mints once and not once per sync.
function cardTheSheetEdit(names) {
  if (!names.length) return { minted: false };
  const line = `Sheet pe ${names.length} topic abhi bhi DONE dikh rahe hain (${names.join(", ")}), lekin 30 August ko tumne unhe dobara kholá tha. Sheet mein unka tick hata do — tab tak organism unhe proof nahi maanta, sirf record.`;
  try {
    execFileSync(process.execPath, [join(__dirname, "captains_call.mjs"), "file", "--line", line, "--key", "sprint:pre-restart-done"], { encoding: "utf8", timeout: 15000 });
    return { minted: true, line };
  } catch (e) { swallow("the card is a nudge; a failed mint never blocks the sync", e); return { minted: false, line }; }
}

// ── A4 (4 Sep 2026) · THE SYLLABUS FLOOR AS A VALUE, NOT A LABEL ─────────────
// W0-B taught this file to LABEL the sheet's disqualified done-claims. It never told
// anyone WHERE TO START. So every router downstream kept reading `progress.current`
// — the sheet's In-Progress row, "1-04 Hallucinations" — and drove him to a NEW topic
// while the four he re-opened on 30 August sat unproven and unqueued. Measured this
// morning: the SessionStart brief said "LEARNING NOW: 1-04 Hallucinations" on a
// machine whose open forge session was tokenization at step 3.
//
// THE FLOOR IS DERIVED, NEVER A LIST. `derivedFloor` walks the capsules the epoch
// disqualifies and takes the LOWEST `num` — which is his own stated order
// (tokenization 01 → embeddings 02 → inference 03 → context 04 → then the sheet's
// next) without a single concept name in this file. The day he re-locks tokenization
// the floor moves to embeddings by itself; the day all four are re-locked the floor is
// null and the sheet's own current takes over again, with no code change and nothing
// to remember. `floor <concept>` is HIS override for the one case the derivation
// cannot know: a day he wants a different order.
//
// IT NEVER TOUCHES `done`. Same law as W0-B: the sheet is his record and this organ
// does not rewrite it. The floor is a separate field beside it.
/** derivedFloor — the first topic the GAME-ON epoch left unproven, by capsule number.
 *  @returns {{id:string,num:string,title:string}|null} null once nothing is disqualified */
export function derivedFloor(capsules) {
  const stale = (capsules || []).filter((c) => { try { return preCyborg(c); } catch { return false; } });
  if (!stale.length) return null;
  const key = (c) => { const n = Number(String(c.num || "").replace(/[^0-9]/g, "")); return Number.isFinite(n) ? n : Number.MAX_SAFE_INTEGER; };
  const first = stale.slice().sort((a, b) => key(a) - key(b) || String(a.id).localeCompare(String(b.id)))[0];
  return { id: String(first.id || "").toLowerCase(), num: String(first.num || ""), title: String(first.title || first.id || "") };
}
/** applyFloor — PURE: object in, verdict out, no fs (the shape applyStart uses, and
 *  for the same reason — sprint.json's path stays a literal const so xray resolves it). */
export function applyFloor(sprint, concept, capsules, now = new Date()) {
  const want = String(concept || "").trim().toLowerCase();
  if (!want) return { ok: false, why: "no-concept" };
  if (!sprint || !sprint.progress) return { ok: false, why: "no-file" };
  const known = (capsules || []).some((c) => String(c.id || "").toLowerCase() === want);
  // A floor naming a concept with no capsule is not refused — he may put the floor on a
  // topic he has never locked — but it IS labelled, so a typo is visible rather than
  // silently becoming the thing every router points at for four days.
  const progress = { ...sprint.progress, current_floor: { concept: want, set_at: nowISO(now), by: "his word (sprintsync floor)", has_capsule: known } };
  return { ok: true, why: "set", sprint: { ...sprint, progress } };
}
const nowISO = (now) => now.toISOString();

// set-start — the owner's path for moving sprint.json's `start`, HIS order only.
// (23 Aug 2026: "see at the sprint file, reset all of the dates in it. i am
// starting now." · confirmed 25 Aug: "let's start from today" — Q-8.) Moving
// `start` re-bases what "week N" resolves to in every consumer, so the old value
// is LAYERED into start_history (Law 9), never lost. sprints[].dates stay as the
// xlsx parse wrote them — they are the June plan's record, not live arithmetic.
// applyStart — the PURE core: object in, verdict out, NO fs. The shell below keeps
// sprint.json's path a LITERAL const, so xray can resolve every sink (the first
// version passed a path parameter and made this organ 5 sites blinder — the
// suite's non-increasing ratchet caught it in S5-PRE's reading, 25 Aug 2026).
function applyStart(sprint, dateStr, now = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr || "") || isNaN(Date.parse(dateStr))) return { ok: false, why: "bad-date" };
  if (!sprint || !sprint.start) return { ok: false, why: "no-file" };
  if (sprint.start === dateStr) return { ok: true, why: "noop" };
  return {
    ok: true, why: "moved", prev: sprint.start,
    sprint: { ...sprint, start: dateStr, start_history: [...(sprint.start_history || []), { start: sprint.start, superseded: now.toISOString(), by: "captain's order (Q-8, architect-ruled 25 Aug 2026)" }] },
  };
}

function setStart(dateStr) {
  const r = applyStart(readJson(SPRINT), dateStr);
  if (r.why === "bad-date") console.log(`sprintsync: set-start needs a real YYYY-MM-DD (got "${dateStr}") — nothing written.`);
  else if (r.why === "no-file") console.log("sprintsync: sprint.json missing or has no start — nothing written.");
  else if (r.why === "noop") console.log(`sprintsync: start already ${dateStr} — nothing to do.`);
  else { writeAtomic(SPRINT, r.sprint); console.log(`sprintsync: start → ${dateStr} (was ${r.prev}; old value layered into start_history)`); }
  return r;
}

function setFloor(concept) {
  const caps = loadCapsuleHeads();
  const r = applyFloor(readJson(SPRINT), concept, caps);
  if (r.why === "no-concept") { const d = derivedFloor(caps); console.log(`sprintsync: floor <concept> — kaunsa topic? Abhi khud se nikla hua floor: ${d ? d.id : "koi nahi (saare capsule dobara lock ho chuke hain — sheet ka apna current chalega)"}`); return r; }
  if (r.why === "no-file") { console.log("sprintsync: sprint.json missing or has no progress block — nothing written."); return r; }
  writeAtomic(SPRINT, r.sprint);
  console.log(`sprintsync: floor → ${r.sprint.progress.current_floor.concept}${r.sprint.progress.current_floor.has_capsule ? "" : " (⚠ is naam ka koi capsule nahi mila — spelling dekh lo)"} · sheet ka \`done\` chhua tak nahi gaya`);
  return r;
}

function selftest() {
  const checks = [];
  const assert = (n, c) => { checks.push(!!c); console.log(`  ${c ? "✓" : "✗"} ${n}`); };
  // ── W0-B · THE SYLLABUS FLOOR AT THE SHEET (2 Sep 2026 — SD-01) ─────────────────
  {
    const done = ["1-01 Embeddings (finish)", "1-02 Inference & sampling", "1-04 Hallucinations"];
    const caps = [{ id: "embeddings", lockedOn: "2026-06-21" }, { id: "inference", lockedOn: "2026-06-24" },
                  { id: "hallucinations", lockedOn: "2026-09-10" }];
    const pre = preRestartDone(done, caps);
    assert("W0-B FLOOR — a sheet claim naming a PRE-restart capsule is disqualified; one locked AFTER the epoch is not",
      pre.length === 2 && pre.every(d => /Embeddings|Inference/.test(d)) && !pre.some(d => /Hallucinations/.test(d)));
    assert("W0-B FLOOR — the disqualified set is derived from the CAPSULES, never a list of names: no capsules ⇒ nothing disqualified",
      preRestartDone(done, []).length === 0);
    assert("W0-B FLOOR — a re-locked capsule leaves the disqualified set by itself, with no code change",
      preRestartDone(done, [{ id: "embeddings", lockedOn: "2026-06-21", relockedOn: "2026-09-05" }]).length === 0);
    assert("W0-B FLOOR — HIS SHEET IS NOT REWRITTEN: `done` is untouched and the verdict rides a separate labelled field",
      (() => { const src = readFileSync(fileURLToPath(import.meta.url), "utf8");
        const sync = src.slice(src.indexOf("progress.synced_at = now.toISOString();"), src.indexOf("writeAtomic(SPRINT, sprint);"));
        return /done_pre_restart/.test(sync) && !/progress\.done\s*=/.test(sync); })());
  }
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
  // set-start (Q-8): the PURE core on plain objects — no fs, no temp files, and
  // the live file provably untouchable from here (applyStart cannot write).
  {
    const r1 = applyStart({ start: "2026-06-20", progress: {} }, "2026-08-25", new Date("2026-08-25T05:00:00Z"));
    assert("set-start moves start and layers the old value into start_history",
      r1.ok && r1.sprint.start === "2026-08-25" && r1.sprint.start_history.length === 1 && r1.sprint.start_history[0].start === "2026-06-20");
    assert("set-start to the same date is a no-op (nothing to write)",
      applyStart({ start: "2026-08-25" }, "2026-08-25").why === "noop");
    assert("set-start refuses a junk date and writes nothing",
      applyStart({ start: "2026-06-20" }, "25-08-2026").ok === false && applyStart(null, "2026-08-25").why === "no-file");
  }
  // ── A4 (4 Sep 2026) · THE FLOOR ────────────────────────────────────────────
  {
    const FOUR = [{ id: "tokenization", num: "01", lockedOn: "2026-06-15" }, { id: "embeddings", num: "02", lockedOn: "2026-06-21" },
                  { id: "inference", num: "03", lockedOn: "2026-06-24" }, { id: "context", num: "04", lockedOn: "2026-06-28" }];
    assert("A4 FLOOR — derived from the capsules by NUMBER, so it is exactly his stated order with no concept name in this file",
      derivedFloor(FOUR).id === "tokenization" && derivedFloor(FOUR).num === "01");
    assert("A4 FLOOR — re-locking the first topic moves the floor to the next by itself; no code change, nothing to remember",
      derivedFloor([{ ...FOUR[0], relockedOn: "2026-09-05" }, ...FOUR.slice(1)]).id === "embeddings");
    assert("A4 FLOOR — once every capsule is proven again the floor is NULL and the sheet's own current takes back over",
      derivedFloor(FOUR.map((c) => ({ ...c, relockedOn: "2026-09-05" }))) === null && derivedFloor([]) === null);
    assert("A4 FLOOR — the capsules arriving out of order changes nothing (the number decides, not the array)",
      derivedFloor([FOUR[3], FOUR[1], FOUR[0]]).id === "tokenization");
    assert("A4 FLOOR — HIS override writes current_floor and does NOT touch `done` (same law as W0-B: the sheet is his record)",
      (() => { const sp = { progress: { done: ["1-01 Embeddings"], current: { id: "1-04" } } };
               const r = applyFloor(sp, "Embeddings", FOUR, new Date("2026-09-04T05:00:00Z"));
               return r.ok && r.sprint.progress.current_floor.concept === "embeddings" && r.sprint.progress.current_floor.has_capsule === true
                 && JSON.stringify(r.sprint.progress.done) === JSON.stringify(sp.progress.done); })());
    assert("A4 FLOOR — a floor naming a concept with no capsule is KEPT but LABELLED, so a typo is visible instead of silently steering four days",
      applyFloor({ progress: {} }, "tokenizaton", FOUR).sprint.progress.current_floor.has_capsule === false);
    assert("A4 FLOOR — an empty concept and a missing progress block both write nothing",
      applyFloor({ progress: {} }, "  ", FOUR).ok === false && applyFloor({}, "embeddings", FOUR).why === "no-file");
    assert("A4 FLOOR — a nightly `sync` PRESERVES the floor: progress is rebuilt from the sheet, so an un-carried field dies at the next fetch",
      (() => { const src = readFileSync(fileURLToPath(import.meta.url), "utf8");
               const syncBody = src.slice(src.indexOf("const prev = (sprint.progress && sprint.progress.current) || {};"), src.indexOf("writeAtomic(SPRINT, sprint);"));
               return /current_floor/.test(syncBody) && !/progress\.done\s*=/.test(syncBody); })());
  }
  const passed = checks.every(Boolean);
  console.log(passed ? "\nALL CHECKS PASSED" : "\nSELFTEST FAILED");
  return passed;
}

async function main() {
  const mode = (process.argv[2] || "sync").toLowerCase();
  if (mode === "selftest") { process.exit(selftest() ? 0 : 1); }
  if (mode === "set-start") { process.exit(setStart(process.argv[3]).ok ? 0 : 1); }
  if (mode === "floor") { process.exit(setFloor(process.argv[3]).ok ? 0 : 1); }
  await sync();
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
export { sync, boardToProgress, parseCSV, resolveCfg, preRestartDone, loadCapsuleHeads };
