#!/usr/bin/env node
// ============================================================================
// spool.mjs · ARSENAL AI FC — THE WRITE-AHEAD SPOOL (rung S8, 28 Aug 2026)
//   SOLE WRITER of dressing-room/state/spool.db — a NEW LANE, on node:sqlite.
// ----------------------------------------------------------------------------
// THE DEFECT THIS EXISTS FOR, in the capture nerve's own words (hooks/afferent-post.mjs):
//
//     const t = setTimeout(() => ctrl.abort(), 250);
//     await fetch(THALAMUS + "/afferent", { … signal: ctrl.signal });
//     } catch { /* thalamus down or slow → the session never notices */ }
//
//   The session never notices — AND NEITHER DOES ANYTHING ELSE. If the thalamus is down,
//   or merely slower than 250ms, HIS WORDS ARE GONE. Nothing was written anywhere first.
//   That is Q-11 (ruled 25 Aug 2026: the 250ms hook timeout + the 07:00 task start), and
//   the second half is worse than the first: the thalamus task starts at 07:00, so every
//   turn he takes before then had no listener at all. Not "arrived late" — never existed.
//
// THE FIX, and it is the whole rung: LOCAL ROW FIRST, THEN POST.
//   The nerve writes the event here before it tries the network. A POST that succeeds marks
//   the row delivered. A POST that fails, times out, or finds nothing listening leaves the
//   row PENDING, and the thalamus drains pending rows when it boots. Daemon death stops
//   being data loss and becomes latency — which is exactly what §10-C's S8 row asks for.
//
// AT-LEAST-ONCE, NOT EXACTLY-ONCE, ON PURPOSE. A crash between "POST succeeded" and "row
//   marked delivered" replays that row on the next drain. Trying to make the WRITER
//   exactly-once needs a distributed transaction it cannot have; making the CONSUMER
//   idempotent needs one column it already has. So the contract is: this side delivers AT
//   LEAST once, keyed by `event_id`, and thalamus.ingest() refuses an `event_id` it has
//   already written. Duplicates are cheap; a lost turn of his is not.
//
// WHY node:sqlite AND NOT ANOTHER .jsonl. A hook is a process that can be killed mid-write
//   at any instant, and two hooks can fire at once (UserPromptSubmit and Stop share this
//   nerve). An append to a text file has no atomicity across a crash — a torn line is
//   exactly the class S11 already owns. SQLite gives a durable single-row commit for
//   ~2.25ms measured on this machine, inside a hook that already budgets 250ms for the
//   network. §10-G's `better-sqlite3` fallback is NOT needed: node:sqlite loads flag-free
//   on the live Node 22.14.0 (measured 28 Aug — DatabaseSync/StatementSync/constants).
//
// ⛔ WHAT THIS IS NOT, and the rung's FORBIDDEN line says so: it MIGRATES NOTHING. Every
//   existing state file stays exactly the .json/.jsonl it is (L9 — new lanes only).
//   `spool.db` is a lane that did not exist before this file.
//
// THIS ORGAN NEVER BITES THE EDITOR. Every export swallows its own failure and returns a
//   falsey/empty result: a spool that cannot open must degrade to the OLD behaviour (POST
//   and hope), never to a hook that throws inside his editor. `available()` says which.
//
// WHO ELSE ACTS ON THIS: hooks/afferent-post.mjs (writes ahead, marks delivered) ·
//   thalamus.mjs (drains on boot, idempotent on event_id) · organism_test.mjs (the suite).
// CLI: node scripts/spool.mjs [status|drain|selftest]
// ============================================================================
import { mkdirSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SELF = fileURLToPath(import.meta.url);
const __dirname = dirname(SELF);
const ROOT = join(__dirname, "..");
const STATE_DIR = join(ROOT, "dressing-room", "state");
export const SPOOL_DB = process.env.ARSENAL_SPOOL_DB || join(STATE_DIR, "spool.db");
export const THALAMUS = process.env.ARSENAL_THALAMUS || "http://127.0.0.1:4113";

// STATES. A closed set, like the gate's CONSUMPTION_KINDS — a caller cannot invent a new
// one without editing this line. `pending` is the only state a drain acts on.
export const SPOOL_STATES = Object.freeze(["pending", "delivered"]);

// RETENTION. Delivered rows are kept for a while rather than deleted on the spot, because a
// delivered row is the ONLY local evidence that a turn of his ever existed if the thalamus
// then loses it — and Q-13's retention question is a registry row at S10, not a guess here.
// 7 days is a WINDOW in the §5.4 sense (a guard, never a budget); `vacuum` is the only path
// that removes anything, it only ever removes `delivered`, and it must be asked for.
export const RETAIN_DELIVERED_MS = 7 * 86400000;

let _db = null, _tried = false, _why = null;

// open() — lazy, once per process, never throws. A hook process opens it, writes one row and
// exits, so "once per process" is one open per turn (~19ms measured, cold).
function open(path = SPOOL_DB) {
  if (_db || _tried) return _db;
  _tried = true;
  try {
    // node:sqlite is EXPERIMENTAL on Node 22 and prints a warning to stderr on import. A
    // UserPromptSubmit hook's STDOUT is injected into his prompt (see the nerve's LAWS), so
    // stdout must stay clean — stderr is not injected, and the nerve exits 0 regardless.
    const { DatabaseSync } = require_sqlite();
    if (!DatabaseSync) { _why = "node:sqlite unavailable on this runtime"; return null; }
    try { mkdirSync(dirname(path), { recursive: true }); } catch { /* exists */ }
    const db = new DatabaseSync(path);
    // WAL: a reader (the thalamus draining) and a writer (a hook mid-turn) must not block
    // each other. busy_timeout is the second half — two hooks CAN fire at once.
    try { db.exec("PRAGMA journal_mode = WAL"); db.exec("PRAGMA busy_timeout = 2000"); } catch { /* older build: the default journal still commits */ }
    db.exec(`CREATE TABLE IF NOT EXISTS spool (
      event_id   TEXT PRIMARY KEY,
      payload    TEXT NOT NULL,
      state      TEXT NOT NULL,
      created_ms INTEGER NOT NULL,
      posted_ms  INTEGER,
      attempts   INTEGER NOT NULL DEFAULT 0,
      last_error TEXT
    )`);
    db.exec("CREATE INDEX IF NOT EXISTS spool_state_ix ON spool(state, created_ms)");
    _db = db;
    return _db;
  } catch (e) { _why = String((e && e.message) || e).slice(0, 160); return null; }
}
// node:sqlite is imported through a guarded require so a runtime without it degrades to
// "unavailable" instead of an unhandled module-resolution throw inside a live hook.
function require_sqlite() {
  try { return globalThis.process.getBuiltinModule ? globalThis.process.getBuiltinModule("node:sqlite") : {}; }
  catch { return {}; }
}

export function available(path = SPOOL_DB) { return !!open(path); }
export function unavailableWhy() { return _why; }
// TEST SEAM — a selftest points the module at a tmp file and re-opens.
export function _reset() { try { if (_db) _db.close(); } catch { /* already gone */ } _db = null; _tried = false; _why = null; }

// write(evt) → { ok, event_id, duplicate } — THE WRITE-AHEAD. Called by the nerve BEFORE the
// POST. `INSERT OR IGNORE` makes a replayed event_id a no-op rather than an error, so the
// nerve never has to know whether it has seen this event before.
export function write(evt, { path = SPOOL_DB, now = Date.now() } = {}) {
  const db = open(path);
  if (!db) return { ok: false, why: _why };
  const id = evt && evt.event_id;
  if (!id || typeof id !== "string") return { ok: false, why: "an event without an event_id cannot be spooled — event_id IS the dedup key the consumer refuses on" };
  try {
    const r = db.prepare("INSERT OR IGNORE INTO spool(event_id,payload,state,created_ms) VALUES(?,?,?,?)")
      .run(id, JSON.stringify(evt), "pending", now);
    return { ok: true, event_id: id, duplicate: r.changes === 0 };
  } catch (e) { return { ok: false, why: String((e && e.message) || e).slice(0, 160) }; }
}

export function markDelivered(id, { path = SPOOL_DB, now = Date.now() } = {}) {
  const db = open(path);
  if (!db) return false;
  try { return db.prepare("UPDATE spool SET state='delivered', posted_ms=? WHERE event_id=?").run(now, id).changes > 0; }
  catch { return false; }
}
export function markAttempt(id, why, { path = SPOOL_DB } = {}) {
  const db = open(path);
  if (!db) return false;
  try { return db.prepare("UPDATE spool SET attempts = attempts + 1, last_error = ? WHERE event_id = ?").run(String(why || "").slice(0, 200), id).changes > 0; }
  catch { return false; }
}
// pending(limit) → the rows a drain must deliver, OLDEST FIRST. Order is the contract: his
// turns replay into the bus in the order he took them, or the thread reads backwards.
export function pending({ path = SPOOL_DB, limit = 5000 } = {}) {
  const db = open(path);
  if (!db) return [];
  try {
    return db.prepare("SELECT event_id, payload, attempts FROM spool WHERE state='pending' ORDER BY created_ms ASC LIMIT ?").all(limit)
      .map((r) => { try { return { event_id: r.event_id, attempts: r.attempts, evt: JSON.parse(r.payload) }; } catch { return null; } })
      .filter(Boolean);
  } catch { return []; }
}
export function stats({ path = SPOOL_DB } = {}) {
  const db = open(path);
  if (!db) return { available: false, why: _why, pending: 0, delivered: 0 };
  try {
    const row = db.prepare("SELECT (SELECT COUNT(*) FROM spool WHERE state='pending') AS pending, (SELECT COUNT(*) FROM spool WHERE state='delivered') AS delivered, (SELECT MIN(created_ms) FROM spool WHERE state='pending') AS oldest_pending_ms").get();
    return { available: true, pending: row.pending || 0, delivered: row.delivered || 0, oldest_pending_ms: row.oldest_pending_ms || null, db: path };
  } catch (e) { return { available: false, why: String((e && e.message) || e).slice(0, 160), pending: 0, delivered: 0 }; }
}
// vacuum() — the ONLY path that removes anything, and it only ever removes DELIVERED rows
// older than the window. A pending row is never touched by it, at any age: an undelivered
// turn of his is not garbage, it is the thing this organ exists to hold.
export function vacuum({ path = SPOOL_DB, now = Date.now(), retain_ms = RETAIN_DELIVERED_MS } = {}) {
  const db = open(path);
  if (!db) return { ok: false, removed: 0 };
  try { return { ok: true, removed: db.prepare("DELETE FROM spool WHERE state='delivered' AND posted_ms IS NOT NULL AND posted_ms < ?").run(now - retain_ms).changes }; }
  catch { return { ok: false, removed: 0 }; }
}

// drain({post}) → { attempted, delivered, failed } — replays every pending row through
// `post`, oldest first, and STOPS AT THE FIRST FAILURE. Stopping is deliberate: the usual
// cause of a failure is "the consumer is not there", and hammering the rest of the backlog
// at a dead port wastes the boot and scrambles nothing useful. The next drain resumes.
export async function drain({ post = defaultPost, path = SPOOL_DB, limit = 5000, now = () => Date.now() } = {}) {
  const rows = pending({ path, limit });
  const out = { attempted: 0, delivered: 0, failed: 0, stopped_early: false };
  for (const r of rows) {
    out.attempted++;
    let ok = false, why = null;
    try { ok = await post(r.evt); } catch (e) { why = String((e && e.message) || e).slice(0, 160); }
    if (ok) { markDelivered(r.event_id, { path, now: now() }); out.delivered++; }
    else { markAttempt(r.event_id, why || "consumer refused or unreachable", { path }); out.failed++; out.stopped_early = true; break; }
  }
  return out;
}
export async function defaultPost(evt, { url = THALAMUS + "/afferent", timeout_ms = 4000 } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout_ms);
  try {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(evt), signal: ctrl.signal });
    return res.ok;
  } finally { clearTimeout(t); }
}

// ── SELFTEST — a tmp database, never the live lane; every check can fail ──────────────────
async function selftest() {
  let pass = 0, fail = 0;
  const assert = (name, cond) => { if (cond) pass++; else fail++; console.log(`  ${cond ? "✓" : "✗"} ${name}`); };
  const tmp = join(process.env.TEMP || process.env.TMP || ".", `spool_selftest_${process.pid}.db`);
  const clean = () => { for (const s of ["", "-wal", "-shm"]) { try { rmSync(tmp + s, { force: true }); } catch { /* best effort */ } } };
  clean(); _reset();
  const T0 = 1756000000000;
  const evt = (id, text = "his words") => ({ event_id: id, modality: "code", source: "claude-code", text, ts: new Date(T0).toISOString() });

  assert("AVAILABLE — node:sqlite opens the lane on this runtime (if this fails the nerve degrades to POST-and-hope, and says so, but never throws)",
    available(tmp) === true);

  const w1 = write(evt("e1"), { path: tmp, now: T0 });
  assert("WRITE-AHEAD — one row lands PENDING before anything is posted; that is the whole rung",
    w1.ok === true && w1.duplicate === false && stats({ path: tmp }).pending === 1);
  assert("AT-LEAST-ONCE — the same event_id written twice is a NO-OP, never an error and never a second row (a replaying nerve must not need to remember)",
    write(evt("e1"), { path: tmp, now: T0 + 5 }).duplicate === true && stats({ path: tmp }).pending === 1);
  assert("NO KEY, NO SPOOL — an event without an event_id is REFUSED with a reason, because event_id IS the key the consumer dedups on",
    write({ modality: "code", text: "no id" }, { path: tmp }).ok === false);

  write(evt("e2"), { path: tmp, now: T0 + 10 });
  write(evt("e3"), { path: tmp, now: T0 + 20 });
  assert("ORDER IS THE CONTRACT — pending replays OLDEST FIRST, or his thread reads backwards",
    pending({ path: tmp }).map((r) => r.event_id).join() === "e1,e2,e3");

  const seen = [];
  const d1 = await drain({ post: async (e) => { seen.push(e.event_id); return true; }, path: tmp, now: () => T0 + 100 });
  assert("DRAIN — every pending row is delivered in order, and the spool empties",
    d1.delivered === 3 && d1.failed === 0 && seen.join() === "e1,e2,e3" && stats({ path: tmp }).pending === 0 && stats({ path: tmp }).delivered === 3);
  assert("DRAINED ROWS ARE NOT DELETED — a delivered row survives as the local evidence that the turn existed (retention is a window, and only `vacuum` removes anything)",
    stats({ path: tmp }).delivered === 3);

  write(evt("e4"), { path: tmp, now: T0 + 200 });
  write(evt("e5"), { path: tmp, now: T0 + 300 });
  const tried = [];
  const d2 = await drain({ post: async (e) => { tried.push(e.event_id); return false; }, path: tmp });
  assert("A DEAD CONSUMER LOSES NOTHING — the drain stops at the first failure, the row STAYS pending, and nothing is dropped",
    d2.delivered === 0 && d2.failed === 1 && d2.stopped_early === true && tried.join() === "e4" && stats({ path: tmp }).pending === 2);
  assert("...and the failure is RECORDED on the row (attempts + last_error), so a permanently-stuck row can be found rather than guessed at",
    pending({ path: tmp })[0].attempts === 1);
  const d3 = await drain({ post: async () => true, path: tmp, now: () => T0 + 400 });
  assert("...and the very next drain delivers exactly those two, in order — daemon death was LATENCY, not loss",
    d3.delivered === 2 && stats({ path: tmp }).pending === 0);

  assert("A THROWING CONSUMER IS A FAILURE, NOT A CRASH — the drain catches it, keeps the row and moves on to the next boot",
    (await (async () => { write(evt("e6"), { path: tmp, now: T0 + 500 }); const r = await drain({ post: async () => { throw new Error("connect ECONNREFUSED"); }, path: tmp }); return r.failed === 1 && stats({ path: tmp }).pending === 1; })()));
  await drain({ post: async () => true, path: tmp, now: () => T0 + 600 });

  const before = stats({ path: tmp }).delivered;
  assert("VACUUM — removes ONLY delivered rows past the window, and NEVER a pending one at any age (an undelivered turn of his is not garbage)",
    (() => { write(evt("keep_me"), { path: tmp, now: T0 }); const v = vacuum({ path: tmp, now: T0 + 8 * 86400000 }); const s = stats({ path: tmp }); return v.removed === before && s.pending === 1 && s.delivered === 0; })());

  assert("NEVER BITES — every export degrades to a falsey result on an unopenable path instead of throwing into the live editor",
    (() => { _reset(); const bad = join(tmp, "not-a-directory", "x.db"); const w = write(evt("x"), { path: bad }); const s = stats({ path: bad }); return w.ok === false && s.available === false && pending({ path: bad }).length === 0; })());
  _reset();

  assert("THE LANE IS NEW — this organ names only spool.db, and touches no existing state file (the rung's FORBIDDEN line: new lanes only, L9)",
    /spool\.db/.test(SPOOL_DB) && !/afferent|reps_log|brain_ledger|workspace/.test(SPOOL_DB));

  clean();
  console.log(`\nspool selftest: ${pass} passed, ${fail} failed`);
  return fail === 0;
}

// ── THE ENTRYPOINT GUARD (S6-F · F-06) — importing this module runs NOTHING ───────────────
const INVOKED_DIRECTLY = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
const verb = process.argv[2] || "status";
if (!INVOKED_DIRECTLY) { /* imported for its exports — run NOTHING */ }
else if (verb === "selftest") { selftest().then((ok) => process.exit(ok ? 0 : 1)); }
else if (verb === "drain") {
  drain({}).then((r) => { console.log(`spool: drain — ${r.delivered} delivered · ${r.failed} failed${r.stopped_early ? " (stopped at the first failure; the rest stay pending)" : ""}`); process.exit(0); });
} else if (verb === "vacuum") {
  const v = vacuum({});
  console.log(`spool: vacuum — ${v.removed} delivered row(s) past the ${RETAIN_DELIVERED_MS / 86400000}d window removed; pending rows are never touched`);
} else {
  const s = stats({});
  if (!s.available) console.log(`spool: UNAVAILABLE — ${s.why}. The capture nerve degrades to POST-and-hope (the pre-S8 behaviour); it never throws.`);
  else console.log(`spool: ${s.pending} pending · ${s.delivered} delivered${s.oldest_pending_ms ? ` · oldest pending ${new Date(s.oldest_pending_ms).toISOString().slice(0, 16)}Z` : ""} · ${s.db}`);
}
