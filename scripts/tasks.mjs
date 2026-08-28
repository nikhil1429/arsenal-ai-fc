#!/usr/bin/env node
// ============================================================================
// tasks.mjs · ARSENAL AI FC — LOAD ZERO, BLOCK 1: TASK + IDEMPOTENCY (19 Aug 2026)
//   SOLE WRITER of dressing-room/state/tasks.jsonl (gitignored — state, not code).
//   Writes NOTHING else: a task's work is an EXISTING owner's CLI, run as a child.
// ----------------------------------------------------------------------------
// THE BUG THIS EXISTS FOR (measured 18-19 Aug 2026, LOAD_ZERO APPENDIX B).
//   His ask "samjhao ke liye taiyaar karo" went through the act lane as a `job`, and
//   `brain.mjs run prepare_on_request` was called DIRECTLY — fire-and-forget RPC:
//     - act amsyyse9mkm failed at the door (`job needs args.job`), so he asked again
//     - prepare_on_request then ran THREE times in four minutes — 21,777 + 22,954 +
//       22,676 tokens = ~67,400 tokens — all three OVERWRITING one 5.4 KB file
//     - in his words, twenty minutes later: "But why is it not done because it's been
//       20 minutes already." and "is the script ready because it's been 20 minutes
//       since I told you." There was no object to ask about. Nothing had an id.
//   A call is not a task. A call has no id, no state, no memory that it already ran,
//   and nothing to point at while it runs.
//
// THE RULE: *every ask becomes a durable, addressable, queryable object — given back in
//   the same turn — and the same ask never executes twice.*
//   - IDEMPOTENCY KEY — sha1(kind + subject + args). Same ask => same key => the FIRST
//     task is returned with its state/receipt and nothing new runs. This is an equality
//     check on the WHOLE ask, NOT keyword routing (LOAD_ZERO BLOCK 5): no branch is ever
//     taken on which words he used — two different wordings simply make two keys, and
//     the door above (acts.mjs) is what normalises his speech.
//   - A FAILED task frees its key — a retry is a new task, never a silent replay.
//   - THE STATE MACHINE is enforced in code: queued -> running -> done|failed.
//     `claim` is legal ONLY from queued, taken under the ledger lock, and a second claim
//     is REFUSED (exit non-zero). That refusal is the runtime assertion the ratchet
//     names: an idempotency key may never be executed twice.
//     (delivered -> closed arrive with LOAD_ZERO BLOCK 3/4 — the outbox owns delivery.)
//   - THE LEDGER IS APPEND-ONLY EVENTS — create, replay, claim, progress, finish, fail.
//     The task object is the FOLD of its rows, never a mutated record. A replay is
//     itself a row, so "he fired it 3x, it ran once" is provable from the file.
//   - ASKED IS ANSWERED IN THE SAME TURN — `run` creates (or replays), spawns the owner
//     DETACHED, and returns the id immediately. The turn never blocks for 600 s.
// NEVER: a second writer of tasks.jsonl - work spawned for him outside this organ -
//   a task marked done without its owner's receipt - a hand-edited ledger.
// LEDGER ROWS: {ev, id|of, ts, key, kind, subject, args, door, by, ttl_h, runner, pid,
//   note, receipt, error, ms}
// CLI: node scripts/tasks.mjs create --kind <k> --subject <s> [--args '<json>'] [--key k]
//        [--door d] [--by who] [--ttl <hours>] [--json]
//      | run --kind <k> --subject <s> [...]      (create-or-replay, then detach the owner)
//      | status <id> [--json] | list [--all] [--days n] [--json]
//      | claim <id> [--runner n] | progress <id> --note "..." | finish <id> [--receipt "..."]
//      | fail <id> --why "..." | _exec <id>      (the detached executor — internal)
//      | selftest
// ============================================================================
import { readFileSync, appendFileSync, existsSync, mkdirSync, statSync, rmSync, writeFileSync, mkdtempSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { subjectsOf } from "./registry.mjs";   // S10 — task kinds are ROWS now, never literals

const SELF = fileURLToPath(import.meta.url);
const __dirname = dirname(SELF);
const ROOT = join(__dirname, "..");
const STATE_DIR = join(ROOT, "dressing-room", "state");
export const TASKS_LEDGER = process.env.ARSENAL_TASKS_LEDGER || join(STATE_DIR, "tasks.jsonl");

// S10 migration #5: the kind list is a REGISTRY ROW (task_kinds) — a new durable-
// execution kind is a ROW ADD + a RUNNER below, never a copy of this organ. The
// selftest bites the invariant both ways: every declared kind has a runner.
export const KINDS = subjectsOf("task_kinds");                  // a kind exists only with a RUNNER, or as a declared INTERACTIVE kind
export const STATES = ["queued", "running", "done", "failed"];
export const LEGAL = { claim: ["queued"], progress: ["running"], finish: ["running"], fail: ["queued", "running"] };
const DEFAULT_TTL_H = 24;                                       // the idempotency window: the same ask inside it is a replay

// -- THE RUNNER TABLE — a kind is an EXISTING owner's CLI, never work this organ invented --
// `--task <id>` is how the owner reports progress back (it shells out to this CLI; it never
// writes the ledger itself — the SOLE WRITER law holds through the child boundary).
// `keyArgs` DECLARES which args change the work and may therefore enter the idempotency key.
// For `job` the subject IS the whole ask, so nothing from args enters it (see idempotencyKey).
//
// TWO SHAPES OF TASK (LOAD ZERO BLOCK 2, 19 Aug 2026). A kind is either SPAWNED — it names an
// owner CLI this organ runs as a child — or INTERACTIVE: nothing to spawn, because the work is
// HIM answering. A samjhao is a sitting, not a job; it still needs a task for the two things the
// task layer gives it — a durable id it can be resumed by on ANY surface (§4-E) and an
// idempotency key, so "samjhao tokenization" asked twice RESUMES one session instead of starting
// a second. `run` refuses to spawn an interactive kind and `execTask` refuses to execute one.
export const RUNNERS = {
  job: {
    organ: "brain.mjs", timeoutMs: 600000, keyArgs: [],
    argv: (t) => ["run", t.subject, "--by", t.by || "captain", ...(t.args && t.args.act ? ["--act", String(t.args.act)] : []), "--task", t.id],
  },
  samjhao: { interactive: true, keyArgs: [] },   // driven by samjhao.mjs from HIS answers — no organ spawns it
};

const clip = (s, n = 300) => String(s == null ? "" : s).replace(/\s+/g, " ").trim().slice(0, n);
const newId = (now) => `t${now.getTime().toString(36)}${Math.floor(Math.random() * 1296).toString(36).padStart(2, "0")}`;
const stableJson = (o) => { if (o == null || typeof o !== "object") return JSON.stringify(o ?? null); if (Array.isArray(o)) return `[${o.map(stableJson).join(",")}]`; return `{${Object.keys(o).sort().map((k) => `${JSON.stringify(k)}:${stableJson(o[k])}`).join(",")}}`; };

export function readRows(p = TASKS_LEDGER) {
  try {
    if (!existsSync(p)) return [];
    return readFileSync(p, "utf8").split("\n").filter((l) => l.trim()).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  } catch { return []; }
}

/**
 * the idempotency key — the ASK hashed, never a word matched (see header)
 *
 * WHAT COUNTS AS "THE SAME ASK" — measured live 19 Aug 2026, during this block's own build.
 * The first version hashed the WHOLE args object, and the identical ask arriving through two
 * doors split into two tasks: `tasks.mjs run --subject prepare_on_request` (args `{}`) against
 * the act lane's `--args {"job":"prepare_on_request","act":"amsz3vaiyof"}`. Same ask, same job,
 * two keys, two runs — this block's entire purpose defeated by one carrier field. (Only brain's
 * older tick lock stopped the second spend, which is luck, not a guarantee.)
 * That is his 19 Aug law broken in one field: *"i can say the same thing in different ways in
 * different words in different tones anywhere in the entire organism."* Which door asked, which
 * act id carried it, a job name that merely repeats the subject — none of these change the WORK,
 * so none of them may change the key. A field enters the key ONLY when its kind DECLARES that it
 * changes the work (`RUNNERS[kind].keyArgs`). An ALLOWLIST, never a blocklist: the next carrier
 * field added anywhere in the organism cannot silently split a key again.
 */
export function idempotencyKey(kind, subject, args = {}) {
  const declared = (RUNNERS[kind] && RUNNERS[kind].keyArgs) || [];
  const work = {};
  for (const k of declared) if (args && args[k] !== undefined) work[k] = args[k];
  return createHash("sha1").update(`${kind} ${clip(subject, 300).toLowerCase()} ${stableJson(work)}`).digest("hex").slice(0, 12);
}

/** the task object is the FOLD of its event rows — never a mutated record */
export function foldTasks(rows) {
  const byId = new Map();
  for (const r of rows || []) {
    if (!r || !r.ev) continue;
    if (r.ev === "create") {
      byId.set(r.id, { id: r.id, key: r.key, kind: r.kind, subject: r.subject, args: r.args || {}, door: r.door || null, by: r.by || null, ttl_h: r.ttl_h ?? DEFAULT_TTL_H, created_at: r.ts, state: "queued", claimed_at: null, runner: null, pid: null, progress: [], replays: 0, finished_at: null, receipt: null, error: null, ms: null });
      continue;
    }
    const t = byId.get(r.of);
    if (!t) continue;
    if (r.ev === "replay") { t.replays += 1; }
    else if (r.ev === "claim") { t.state = "running"; t.claimed_at = r.ts; t.runner = r.runner || null; t.pid = r.pid ?? null; }
    else if (r.ev === "progress") { t.progress.push({ ts: r.ts, note: r.note }); }
    else if (r.ev === "finish") { t.state = "done"; t.finished_at = r.ts; t.receipt = r.receipt || null; t.ms = r.ms ?? null; }
    else if (r.ev === "fail") { t.state = "failed"; t.finished_at = r.ts; t.error = r.error || null; t.ms = r.ms ?? null; }
  }
  return byId;
}
export const taskOf = (id, rows = readRows()) => foldTasks(rows).get(id) || null;

// -- the ledger lock: a create/claim is read-then-append, so it must be ONE critical section --
// Same idiom as capture.mjs's writer lock (a lock we cannot take is stepped over rather than
// blocking the captain), with one difference that matters: `claim` re-reads INSIDE the lock, so
// the second claimant sees `running` and is refused. That is the whole idempotency guarantee.
const lockPathOf = (p) => `${p}.lock.tmp`;
const sleepSync = (ms) => { try { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); } catch { /* no SAB -> skip the nap, the try-loop still bounds itself */ } };
function withLedgerLock(fn, deps = {}) {
  if (deps.append) return fn();                                 // injected sink (selftest / caller-owned rows) — no file, no lock
  const path = deps.ledger || TASKS_LEDGER, lock = lockPathOf(path);
  try { mkdirSync(dirname(path), { recursive: true }); } catch { /* exists */ }
  const started = Date.now();
  let held = false, tries = 0;
  while (!held && ++tries <= 600) {
    try { writeFileSync(lock, JSON.stringify({ pid: process.pid, at: Date.now() }), { flag: "wx" }); held = true; }
    catch (e) {
      if (!e || e.code !== "EEXIST") return fn();                // cannot lock at all -> run unlocked rather than lose the ask
      let ageMs; try { ageMs = Date.now() - statSync(lock).mtimeMs; } catch { continue; }
      if (ageMs > 30000 || Date.now() - started > 5000) { try { rmSync(lock, { force: true }); } catch { /* someone broke it first */ } continue; }
      sleepSync(25);
    }
  }
  if (!held) return fn();
  try { return fn(); } finally { try { rmSync(lock, { force: true }); } catch { /* best effort */ } }
}
function appendRow(row, deps = {}) {
  if (deps.append) return deps.append(row);
  const path = deps.ledger || TASKS_LEDGER;
  try { mkdirSync(dirname(path), { recursive: true }); appendFileSync(path, JSON.stringify(row) + "\n"); return true; } catch { return false; }
}
const rowsOf = (deps) => (deps.rows ? deps.rows : readRows(deps.ledger || TASKS_LEDGER));

// -- CREATE — or REPLAY the ask that is already alive -------------------------
export function create(spec = {}, deps = {}) {
  const now = deps.now || new Date();
  const kind = String(spec.kind || "").trim().toLowerCase();
  const subject = clip(spec.subject, 300);
  if (!KINDS.includes(kind)) return { ok: false, why: `unknown kind "${spec.kind}" (${KINDS.join("|")}) — a kind exists only with a runner` };
  if (!RUNNERS[kind] || (!RUNNERS[kind].organ && RUNNERS[kind].interactive !== true)) return { ok: false, why: `kind "${kind}" is DECLARED in the registry row task_kinds but has NO RUNNER here — build the runner before adding the row (a declared-but-unbuilt kind must refuse, never crash)` };
  if (!subject) return { ok: false, why: `${kind} needs --subject (what the work is on)` };
  const args = spec.args && typeof spec.args === "object" ? spec.args : {};
  const ttlH = Number.isFinite(Number(spec.ttlH)) && Number(spec.ttlH) > 0 ? Number(spec.ttlH) : DEFAULT_TTL_H;
  const key = spec.key ? String(spec.key) : idempotencyKey(kind, subject, args);
  return withLedgerLock(() => {
    // THE WINDOW BELONGS TO THE TASK, NEVER TO THE RE-ASKER (measured in this block's own
    // selftest, 19 Aug 2026). Read as `ttlH` (the new spec's), a caller could pass
    // `--ttl 0.0001` and force a duplicate run — idempotency defeated by an argument. The
    // stored task declared its own window on its create row; that is the one that governs.
    const live = [...foldTasks(rowsOf(deps)).values()]
      .filter((t) => t.key === key && t.state !== "failed" && now.getTime() - Date.parse(t.created_at) < (t.ttl_h ?? DEFAULT_TTL_H) * 3600000)
      .slice(-1)[0];
    if (live) {                                                  // THE 3x FIX: the ask already exists — hand back the same object
      appendRow({ ev: "replay", of: live.id, ts: now.toISOString(), key, door: spec.door || null }, deps);
      return { ok: true, replay: true, task: foldTasks(rowsOf(deps)).get(live.id) || live, why: `same ask is already ${live.state} as ${live.id} — nothing ran twice` };
    }
    const id = newId(now);
    const row = { ev: "create", id, ts: now.toISOString(), key, kind, subject, args, door: spec.door || null, by: spec.by || null, ttl_h: ttlH };
    appendRow(row, deps);
    return { ok: true, replay: false, task: foldTasks([row]).get(id) };
  }, deps);
}

// -- the state machine — every transition legal-checked, claim under the lock --
function transition(ev, id, extra, deps = {}) {
  const now = deps.now || new Date();
  return withLedgerLock(() => {
    const t = foldTasks(rowsOf(deps)).get(id);
    if (!t) return { ok: false, why: `no task ${id}` };
    if (!LEGAL[ev].includes(t.state)) return { ok: false, why: `task ${id} is ${t.state} — ${ev} is legal only from ${LEGAL[ev].join("|")}${ev === "claim" ? " (an idempotency key may never be executed twice)" : ""}`, task: t };
    const row = { ev, of: id, ts: now.toISOString(), ...extra };
    appendRow(row, deps);
    return { ok: true, task: foldTasks(rowsOf(deps)).get(id) || t, row };
  }, deps);
}
export const claim = (id, deps = {}, runner = null) => transition("claim", id, { runner, pid: process.pid }, deps);
export const progress = (id, note, deps = {}) => transition("progress", id, { note: clip(note, 300) }, deps);
export const finish = (id, receipt, deps = {}, ms = null) => transition("finish", id, { receipt: clip(receipt, 300), ms }, deps);
export const fail = (id, error, deps = {}, ms = null) => transition("fail", id, { error: clip(error, 300), ms }, deps);

// -- EXEC — claim, run the owner as a child, finish or fail. Never twice for one id --
export function execTask(id, deps = {}) {
  const c = claim(id, deps, deps.runnerName || "tasks.mjs _exec");
  if (!c.ok) return { ok: false, why: c.why };                   // already claimed => this process does NOTHING. The guarantee.
  const t = c.task, r = RUNNERS[t.kind];
  if (!r) { fail(id, `no runner for kind "${t.kind}"`, deps); return { ok: false, why: `no runner for kind "${t.kind}"` }; }
  if (r.interactive) { return { ok: false, why: `task ${id} is kind "${t.kind}", which is INTERACTIVE — its work is HIM answering, so nothing may execute it on his behalf`, task: t }; }
  const argv = r.argv(t).map(String);
  const t0 = Date.now();
  const out = deps.exec
    ? deps.exec(r.organ, argv, t)
    : (() => {
        const p = spawnSync(process.execPath, [join(__dirname, r.organ), ...argv], { encoding: "utf8", timeout: r.timeoutMs || 600000, windowsHide: true, env: { ...process.env, ARSENAL_ORGAN: "1" } });
        const timedOut = p.status === null && p.signal;
        return { ok: p.status === 0, out: String(p.stdout || ""), err: timedOut ? `${r.organ} ${argv[0]} timed out after ${Math.round((r.timeoutMs || 600000) / 1000)} s (${p.signal})` : String(p.stderr || ""), status: p.status };
      })();
  const ms = Date.now() - t0;
  const receipt = clip((out.out || "").trim() || (out.err || "").trim(), 300);
  const done = out.ok ? finish(id, receipt, deps, ms) : fail(id, receipt || `exit ${out.status}`, deps, ms);
  // THE OWNER MAY HAVE ALREADY SPOKEN (measured live 19 Aug 2026). brain exits 0 when its tick lock
  // skipped the run, so `finish` above stamped the SKIP MESSAGE as a receipt and the task read
  // "done" having produced nothing — fake-done, which LAW A forbids. brain now fails its own task
  // in that case, `finish` is legally refused, and the LEDGER is the truth. Read the final state
  // back instead of trusting this process's view of the exit code.
  const final = done.task || taskOf(id, rowsOf(deps));
  return { ok: final ? final.state === "done" : !!out.ok, task: final, receipt, ms };
}

/** run — create-or-replay, then DETACH the owner. Returns the id in the SAME turn. */
export function run(spec = {}, deps = {}) {
  const c = create(spec, deps);
  if (!c.ok) return c;
  if (c.replay) return c;                                        // already alive or already done — nothing is spawned
  if ((RUNNERS[c.task.kind] || {}).interactive) return { ...c, spawned: false, why: `kind "${c.task.kind}" is INTERACTIVE — the task is the durable handle; the work is HIM answering, so nothing is spawned` };
  if (deps.spawn === false) return c;                            // the caller drives execTask itself
  try {
    const child = (deps.spawnFn || spawn)(process.execPath, [SELF, "_exec", c.task.id], { detached: true, stdio: "ignore", windowsHide: true, env: { ...process.env, ARSENAL_ORGAN: "1" } });
    if (child && child.unref) child.unref();
    return { ...c, spawned: true };
  } catch (e) {
    const f = fail(c.task.id, `could not spawn the runner: ${e && e.message}`, deps);
    return { ok: false, why: `could not spawn the runner: ${e && e.message}`, task: f.task };
  }
}

// -- the board (state week - watchman) ---------------------------------------
export function stats(days = 7, rows = readRows(), now = Date.now()) {
  const since = now - days * 86400000;
  const all = [...foldTasks(rows).values()].filter((t) => Date.parse(t.created_at || "") >= since);
  const by = (s) => all.filter((t) => t.state === s).length;
  const replays = all.reduce((n, t) => n + (t.replays || 0), 0);
  const stuck = all.filter((t) => t.state === "running" && now - Date.parse(t.claimed_at || t.created_at) > 2 * ((RUNNERS[t.kind] || {}).timeoutMs || 600000));
  const staleFailed = all.filter((t) => t.state === "failed" && now - Date.parse(t.finished_at || t.created_at) > 24 * 3600000 && !all.some((x) => x.key === t.key && x.state === "done" && Date.parse(x.created_at) > Date.parse(t.created_at)));
  return { days, n: all.length, queued: by("queued"), running: by("running"), done: by("done"), failed: by("failed"), replays, stuck: stuck.map((t) => ({ id: t.id, kind: t.kind, subject: t.subject, claimed_at: t.claimed_at })), stale_failed: staleFailed.map((t) => ({ id: t.id, kind: t.kind, subject: t.subject, error: t.error })), last: all.slice(-1)[0] || null };
}
export const boardLine = (s = stats()) => `tasks ${s.n} - done ${s.done} - running ${s.running} - queued ${s.queued} - failed ${s.failed} - replayed ${s.replays} (runs saved)`;
export function findings(s = stats(7)) {
  const F = [];
  if (s.stuck.length) F.push({ id: "task-stuck", level: "RED", finding: `${s.stuck.length} task(s) claimed and never finished past twice their own timeout — ${s.stuck.slice(0, 3).map((t) => `${t.id} ${t.kind}:${t.subject}`).join(" - ")}`, evidence: "`node scripts/tasks.mjs list` — a runner died mid-flight; the key stays held until the task fails" });
  if (s.stale_failed.length) F.push({ id: "task-failed", level: "RED", finding: `${s.stale_failed.length} task(s) failed and were never retried in 24 h — ${s.stale_failed.slice(0, 3).map((t) => `${t.id} ${t.kind}:${t.subject} (${clip(t.error, 60)})`).join(" - ")}`, evidence: "`node scripts/tasks.mjs status <id>` names the owner's own error" });
  if (s.n) F.push({ id: "tasks-daily", level: "INFO", finding: `${boardLine(s)} (${s.days} d)`, evidence: `\`node scripts/tasks.mjs list --days ${s.days}\`` });
  return F;
}

// -- SELFTEST -----------------------------------------------------------------
let pass = 0, failed = 0;
const assert = (name, cond, extra = "") => { if (cond) { pass++; console.log(`  ok   ${name}`); } else { failed++; console.log(`  FAIL ${name}${extra ? ` — ${extra}` : ""}`); } };

function selftest() {
  console.log("tasks.mjs selftest — LOAD ZERO BLOCK 1 (TASK + IDEMPOTENCY)\n");
  const now = new Date("2026-08-19T02:00:00Z");

  // 1. in-memory: the key, the fold, the state machine
  const rows = [];
  const deps = { rows, append: (r) => { rows.push(r); return true; }, now };
  const k1 = idempotencyKey("job", "prepare_on_request", { job: "prepare_on_request", act: "aXXX" });
  const k2 = idempotencyKey("job", "prepare_on_request", { job: "prepare_on_request", act: "aYYY" });
  assert("the idempotency key is the ASK, not the asking — two different act ids give ONE key", k1 === k2, `${k1} vs ${k2}`);
  assert("...and a different subject gives a different key", k1 !== idempotencyKey("job", "diary", {}));
  // THE LIVE BUG OF 19 AUG (see idempotencyKey's header): the SAME ask arriving bare from the CLI
  // and dressed by the act lane produced two keys and two runs. His law — he may say the same thing
  // any way, anywhere — is held by an ALLOWLIST: only args a kind DECLARES as work enter the key.
  assert("THE SAME ASK THROUGH ANY DOOR IS ONE KEY: bare args, act-lane args and a job field that merely repeats the subject all agree",
    idempotencyKey("job", "prepare_on_request", {}) === k1
    && idempotencyKey("job", "prepare_on_request", { job: "prepare_on_request", act: "amsz3vaiyof" }) === k1
    && idempotencyKey("job", "prepare_on_request", { door: "gaffer", by: "captain", text: "samjhao ke liye taiyaar karo" }) === k1,
    `${k1} / ${idempotencyKey("job", "prepare_on_request", {})} / ${idempotencyKey("job", "prepare_on_request", { job: "prepare_on_request", act: "x" })}`);
  assert("...and that is an ALLOWLIST — a kind declares which args are work, so no carrier field can ever split a key again", Array.isArray(RUNNERS.job.keyArgs) && RUNNERS.job.keyArgs.length === 0);

  const c1 = create({ kind: "job", subject: "prepare_on_request", args: { job: "prepare_on_request", act: "a1" }, door: "gaffer", by: "captain" }, deps);
  assert("create returns a durable id in the same call (queued)", c1.ok && !c1.replay && /^t/.test(c1.task.id) && c1.task.state === "queued", String(c1.why || ""));
  const c2 = create({ kind: "job", subject: "prepare_on_request", args: { job: "prepare_on_request", act: "a2" }, door: "ball" }, deps);
  const c3 = create({ kind: "job", subject: "prepare_on_request", args: { job: "prepare_on_request", act: "a3" }, door: "code" }, deps);
  assert("THE 18 AUG FAILURE: the same ask fired 3x makes ONE task — the 2nd and 3rd REPLAY it, from any door", c2.replay && c3.replay && c2.task.id === c1.task.id && c3.task.id === c1.task.id, `${c2.task && c2.task.id} / ${c3.task && c3.task.id}`);
  assert("...and each replay is its own ledger row, so 'fired 3x, ran once' is provable from the file", rows.filter((r) => r.ev === "replay").length === 2 && rows.filter((r) => r.ev === "create").length === 1);
  assert("an unknown kind is refused at the door (a kind exists only with a runner)", !create({ kind: "invent", subject: "x" }, deps).ok);
  assert("a kind with no subject is refused", !create({ kind: "job", subject: "  " }, deps).ok);

  const id = c1.task.id;
  assert("progress is illegal before the task is claimed (queued is not running)", !progress(id, "half way", deps).ok);
  const cl1 = claim(id, deps, "runner-A");
  assert("claim moves queued -> running", cl1.ok && cl1.task.state === "running");
  const cl2 = claim(id, deps, "runner-B");
  assert("THE RUNTIME ASSERTION: a SECOND claim is REFUSED — an idempotency key may never be executed twice", !cl2.ok && /never be executed twice/.test(cl2.why), String(cl2.why || ""));
  assert("progress is legal while running and folds onto the task", progress(id, "brain: 1 of 3 agenda rows", deps).ok && taskOf(id, rows).progress.length === 1);
  assert("finish moves running -> done and carries the owner's receipt", finish(id, "brain: prepare_on_request OK (24,266 tok)", deps, 240000).ok && taskOf(id, rows).state === "done");
  assert("finish is illegal twice (done is terminal)", !finish(id, "again", deps).ok);
  const c4 = create({ kind: "job", subject: "prepare_on_request", args: { job: "prepare_on_request" }, door: "gaffer" }, deps);
  assert("a DONE task still replays inside its window — he gets the RECEIPT, not a second spend", c4.replay && c4.task.id === id && /OK \(24,266 tok\)/.test(c4.task.receipt || ""));
  const wrows = [];
  const wdeps = { rows: wrows, append: (r) => { wrows.push(r); return true; }, now };
  const w1 = create({ kind: "job", subject: "night_coach", args: {}, ttlH: 1 }, wdeps);
  const wSame = create({ kind: "job", subject: "night_coach", args: {}, ttlH: 1 }, { ...wdeps, now: new Date(now.getTime() + 59 * 60000) });
  assert("inside the task's own window the ask replays", wSame.replay && wSame.task.id === w1.task.id);
  const wLate = create({ kind: "job", subject: "night_coach", args: {}, ttlH: 1 }, { ...wdeps, now: new Date(now.getTime() + 61 * 60000) });
  assert("...but the window EXPIRES — an ask past its ttl is a NEW task, never an eternal replay", !wLate.replay && wLate.task.id !== w1.task.id);
  const wForce = create({ kind: "job", subject: "night_coach", args: {}, ttlH: 0.000001 }, { ...wdeps, now: new Date(now.getTime() + 62 * 60000) });
  assert("THE WINDOW BELONGS TO THE TASK: a re-asker passing a tiny --ttl CANNOT force a duplicate run", wForce.replay && wForce.task.id === wLate.task.id, JSON.stringify(wForce.task && wForce.task.id));

  const frows = [];
  const fdeps = { rows: frows, append: (r) => { frows.push(r); return true; }, now };
  const f1 = create({ kind: "job", subject: "diary", args: {} }, fdeps);
  claim(f1.task.id, fdeps);
  fail(f1.task.id, "brain: FAILED (limit hit)", fdeps, 1200);
  const f2 = create({ kind: "job", subject: "diary", args: {} }, fdeps);
  assert("a FAILED task frees its key — a retry is a NEW task, never a silent replay of the failure", !f2.replay && f2.task.id !== f1.task.id);

  // 2. a REAL ledger file: fold, lock, and the owner run through execTask
  const dir = mkdtempSync(join(tmpdir(), "arsenal_tasks_"));
  const ledger = join(dir, "tasks.jsonl");
  const real = { ledger, now };
  const r1 = create({ kind: "job", subject: "prepare_on_request", args: { job: "prepare_on_request", act: "a9" }, door: "gaffer", by: "captain" }, real);
  const r2 = create({ kind: "job", subject: "prepare_on_request", args: { job: "prepare_on_request", act: "a10" }, door: "gaffer", by: "captain" }, real);
  assert("on a REAL ledger file (lock + fold, no injected sink) the same ask still replays", r1.ok && r2.replay && r2.task.id === r1.task.id);
  const calls = [];
  const ex = execTask(r1.task.id, { ...real, exec: (organ, argv) => { calls.push({ organ, argv }); return { ok: true, out: "brain: prepare_on_request OK (24,266 tok) -> brain_out/prepare_on_request/2026-08-19.md", status: 0 }; } });
  assert("execTask runs the kind's OWNER CLI — brain.mjs run <subject> --by captain --act <act> --task <id> (no new writer, no invented work)",
    ex.ok && calls.length === 1 && calls[0].organ === "brain.mjs" && calls[0].argv.join(" ") === `run prepare_on_request --by captain --act a9 --task ${r1.task.id}`, JSON.stringify(calls[0] || {}));
  assert("...and the owner's RECEIPT is what marks it done (never 'done' without a receipt)", taskOf(r1.task.id, readRows(ledger)).state === "done" && /24,266 tok/.test(taskOf(r1.task.id, readRows(ledger)).receipt || ""));
  const ex2 = execTask(r1.task.id, { ...real, exec: () => { calls.push({ second: true }); return { ok: true, out: "ran again" }; } });
  assert("A SECOND EXECUTOR ON THE SAME ID SPENDS NOTHING — refused at the claim, the owner is never called", !ex2.ok && calls.length === 1, JSON.stringify(calls));
  // NO-FAKE-DONE ACROSS THE OWNER BOUNDARY (the second live bug of 19 Aug). brain exits 0 when its
  // tick lock skipped the run; the lane must report the LEDGER's truth, not the exit code.
  const sk = create({ kind: "job", subject: "night_coach", args: { n: 1 } }, real);
  const skex = execTask(sk.task.id, { ...real, exec: (organ, argv, t) => { fail(t.id, "brain: tick locked (another tick is running) — nothing ran, the ask is still open", real); return { ok: true, out: "brain: tick locked — 'run' skipped so it can't double-run the job", status: 0 }; } });
  assert("NO-FAKE-DONE: an owner that exits 0 WITHOUT doing the work fails its own task, and the lane reports failed — never 'done' with the skip message as its receipt",
    !skex.ok && skex.task && skex.task.state === "failed" && /nothing ran/.test(skex.task.error || ""), JSON.stringify(skex.task && { s: skex.task.state, e: skex.task.error }));
  const skRetry = create({ kind: "job", subject: "night_coach", args: { n: 1 } }, real);
  assert("...and because it failed, the ask is still OPEN — the retry is a new task, not a replay of a run that never happened", !skRetry.replay && skRetry.task.id !== sk.task.id);

  const rr = run({ kind: "job", subject: "prepare_on_request", args: { job: "prepare_on_request" } }, { ...real, spawnFn: () => { throw new Error("spawn must not happen on a replay"); } });
  assert("run() on an ask that already ran REPLAYS — it never spawns a second owner", rr.replay && rr.task.id === r1.task.id);
  let spawned = 0;
  const rr2 = run({ kind: "job", subject: "dugout_digest", args: {} }, { ...real, spawnFn: () => { spawned++; return { unref() {} }; } });
  assert("run() on a NEW ask returns the id in the SAME turn and detaches the owner (the turn never blocks 600 s)", rr2.ok && !rr2.replay && rr2.spawned && spawned === 1 && rr2.task.state === "queued");

  // 3. cross-PROCESS: real processes, one ask
  const ledger2 = join(dir, "cross.jsonl");
  const cli = (...a) => spawnSync(process.execPath, [SELF, ...a], { encoding: "utf8", env: { ...process.env, ARSENAL_TASKS_LEDGER: ledger2 }, windowsHide: true });
  const p1 = cli("create", "--kind", "job", "--subject", "prepare_on_request", "--door", "gaffer", "--json");
  const p2 = cli("create", "--kind", "job", "--subject", "prepare_on_request", "--door", "ball", "--json");
  const p3 = cli("create", "--kind", "job", "--subject", "prepare_on_request", "--door", "code", "--json");
  let j1 = {}, j2 = {}, j3 = {};
  try { j1 = JSON.parse(p1.stdout); j2 = JSON.parse(p2.stdout); j3 = JSON.parse(p3.stdout); } catch { /* asserted below */ }
  assert("THE DoD REPLAY, ACROSS THREE REAL PROCESSES: 3 fires -> 1 task id -> 3 identical receipts",
    !!j1.id && j1.id === j2.id && j1.id === j3.id && j1.replay === false && j2.replay === true && j3.replay === true, `${p1.stdout}${p2.stdout}${p3.stdout}${p1.stderr}`);
  const q1 = cli("claim", j1.id), q2 = cli("claim", j1.id);
  assert("...and across processes the SECOND claim EXITS NON-ZERO (the ratchet's runtime assertion)", q1.status === 0 && q2.status !== 0 && /never be executed twice/.test(q2.stdout + q2.stderr), `${q1.status}/${q2.status} ${q2.stdout}`);
  const st = cli("status", j1.id, "--json");
  let sj = {};
  try { sj = JSON.parse(st.stdout); } catch { /* asserted */ }
  assert("status <id> answers 'is it running?' in one line — the object he could not point at on 18 Aug", sj.state === "running" && sj.replays === 2, st.stdout);

  // 4. hermeticity + the board
  assert("HERMETICITY — the selftest wrote only into tmpdir, never onto the state bus",
    !readRows(join(STATE_DIR, "tasks.jsonl")).some((r) => r.args && r.args.act === "a9"));
  const s = stats(7, readRows(ledger), Date.parse("2026-08-19T02:05:00Z"));
  assert("the board line names the runs the lane SAVED (replayed), not just the runs it made", /replayed 2 \(runs saved\)/.test(boardLine(s)), boardLine(s));
  const stuckRows = readRows(ledger).concat([{ ev: "create", id: "tSTUCK", ts: "2026-08-19T00:00:00Z", key: "k", kind: "job", subject: "hung", args: {} }, { ev: "claim", of: "tSTUCK", ts: "2026-08-19T00:00:00Z" }]);
  assert("a runner that died mid-flight is a NAMED RED (task-stuck), never a silently held key",
    findings(stats(7, stuckRows, Date.parse("2026-08-19T02:00:00Z"))).some((f) => f.id === "task-stuck" && f.level === "RED"));
  assert("every KIND is either SPAWNED (names an owner CLI) or declared INTERACTIVE — a kind that is neither is work this organ invented",
    KINDS.every((k) => RUNNERS[k] && (RUNNERS[k].organ || RUNNERS[k].interactive === true)));
  const inter = create({ kind: "samjhao", subject: "tokenization" }, real);
  const interRun = run({ kind: "samjhao", subject: "embeddings" }, { ...real, spawnFn: () => { throw new Error("an interactive kind must never be spawned"); } });
  assert("an INTERACTIVE kind gets its durable id and its key, and NOTHING is spawned for it (the work is HIM answering)",
    inter.ok && inter.task.state === "queued" && interRun.ok && interRun.spawned === false && /INTERACTIVE/.test(interRun.why || ""), JSON.stringify(interRun.why || ""));
  assert("...and no executor may run it on his behalf — execTask refuses an interactive kind",
    !execTask(inter.task.id, { ...real, exec: () => { throw new Error("must not reach the owner"); } }).ok);
  const interAgain = create({ kind: "samjhao", subject: "tokenization" }, real);
  assert("...and asking for the SAME samjhao again RESUMES the one session instead of starting a second (§4-E)", interAgain.replay && interAgain.task.id === inter.task.id);
  try { rmSync(dir, { recursive: true, force: true }); } catch { /* tmp */ }

  console.log(`\ntasks: ${pass} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}

// -- CLI ----------------------------------------------------------------------
const flag = (n, d = null) => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : (i > 0 ? true : d); };
const has = (n) => process.argv.includes(`--${n}`);
const fmt = (t) => `${t.id} - ${t.kind}:${t.subject} - ${t.state}${t.replays ? ` - replayed ${t.replays}x` : ""}${t.receipt ? ` - ${clip(t.receipt, 120)}` : ""}${t.error ? ` - FAILED ${clip(t.error, 120)}` : ""}`;

if (process.argv[1] && process.argv[1].endsWith("tasks.mjs")) {
  const mode = process.argv[2] || "list";
  if (mode === "selftest") selftest();
  else if (mode === "create" || mode === "run") {
    let args = {};
    try { args = flag("args") && flag("args") !== true ? JSON.parse(flag("args")) : {}; } catch { console.log("tasks: --args is not JSON"); process.exit(1); }
    const spec = { kind: flag("kind"), subject: flag("subject"), args, key: flag("key") || null, door: flag("door") || "cli", by: flag("by") || null, ttlH: flag("ttl") ? Number(flag("ttl")) : undefined };
    const r = mode === "run" ? run(spec) : create(spec);
    if (!r.ok) { console.log(has("json") ? JSON.stringify({ ok: false, why: r.why }) : `tasks: FAILED ${r.why}`); process.exit(1); }
    if (has("json")) console.log(JSON.stringify({ ok: true, id: r.task.id, replay: !!r.replay, state: r.task.state, receipt: r.task.receipt || null, why: r.why || null }));
    else console.log(r.replay ? `tasks: REPLAY ${fmt(r.task)}  (${r.why})` : `tasks: ok ${fmt(r.task)}${r.spawned ? " - runner detached" : ""}`);
  }
  else if (mode === "_exec") { const r = execTask(process.argv[3]); process.exit(r.ok ? 0 : 1); }
  else if (mode === "status") {
    const t = taskOf(process.argv[3]);
    if (!t) { console.log(`tasks: no task ${process.argv[3]}`); process.exit(1); }
    console.log(has("json") ? JSON.stringify(t) : `${fmt(t)}${t.progress.length ? `\n  ${t.progress.map((p) => `- ${p.note}`).join("\n  ")}` : ""}`);
  }
  else if (["claim", "progress", "finish", "fail"].includes(mode)) {
    const id = process.argv[3];
    const r = mode === "claim" ? claim(id, {}, flag("runner") || null)
      : mode === "progress" ? progress(id, flag("note") || "")
        : mode === "finish" ? finish(id, flag("receipt") || "")
          : fail(id, flag("why") || "unstated");
    console.log(r.ok ? `tasks: ok ${mode} ${fmt(r.task)}` : `tasks: FAILED ${r.why}`);
    process.exit(r.ok ? 0 : 1);
  }
  else if (mode === "list") {
    const days = Number(flag("days", 7)) || 7;
    const all = [...foldTasks(readRows()).values()].filter((t) => Date.now() - Date.parse(t.created_at || "") < days * 86400000);
    const show = has("all") ? all : all.filter((t) => t.state === "queued" || t.state === "running");
    if (has("json")) console.log(JSON.stringify({ board: boardLine(stats(days)), tasks: show }));
    else {
      console.log(boardLine(stats(days)));
      show.forEach((t) => console.log(`  ${fmt(t)}`));
      if (!show.length) console.log(has("all") ? `  (none in ${days} d)` : "  (nothing open — `--all` for the finished ones)");
    }
  }
  else console.log("tasks: create|run --kind <k> --subject <s> [--args json --key k --door d --by w --ttl h --json] | status <id> | list [--all --days n] | claim|progress|finish|fail <id> | selftest");
}
