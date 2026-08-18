#!/usr/bin/env node
// ============================================================================
// outbox.mjs · ARSENAL AI FC — LOAD ZERO, BLOCK 3: OUTBOX + RELAY (19 Aug 2026)
//   SOLE WRITER of dressing-room/state/outbox.jsonl (gitignored — state, not code).
//   Writes NOTHING else. It is the ONE ROAD TO HIM.
// ----------------------------------------------------------------------------
// THE DISEASE (LOAD_ZERO §1): the organism has many producers and NO SINGLE ROAD TO HIM.
//   Work gets made and then falls somewhere — a file, a card, an agenda row — and HE is the
//   one who has to go find it, remember it and close it. Measured 19 Aug on the 30 enabled
//   brain jobs by their own `surface.kind`: code 17 · job_input 6 · human_file 4 · media 2 ·
//   sheet 1. Only ONE of those (sheet) actually pushes. `prepare_on_request` — the samjhao
//   material he asked for BY VOICE on 18 Aug — is `surface.kind: "code"`, and its only reader
//   is `sitting.mjs open`. He asked on one surface; the answer landed on another; he never
//   saw it and asked again twenty minutes later.
//
// THE PATTERN: the TRANSACTIONAL OUTBOX. A producer NEVER delivers. It appends one row to one
//   durable ledger and forgets. A separate RELAY is the only thing that reaches him: it puts
//   the row on whichever surface he touches NEXT and REMOVES IT FROM THE OTHERS. Here that
//   removal is not a second action — delivery is a single stamp taken under the ledger lock,
//   legal only from `pending`, so the instant one surface takes a row it is gone from every
//   other surface's queue. One road, one delivery, no duplicates.
//
// WHY `ingest` EXISTS, said plainly: the purist form of this pattern has every producer call
//   `post` in the same breath as it writes. That would be 20+ call sites inside a 6,900-line
//   brain.mjs, and a producer that FORGETS to call is exactly the silent hole this block is
//   here to close. brain.mjs already keeps a durable record of every run it makes
//   (brain_ledger.jsonl), so this organ INGESTS from it: one site, retroactive on the first
//   run, and impossible for a producer to forget. `post` stays open as the door for any organ
//   that produces outside that ledger. His law, 19 Aug: fix the CLASS, never the instance.
//
// THE DEAD-MAN'S SWITCH, built with BLOCK 9's correction already applied (his 19 Aug ruling
//   that a naive liveness check scored 3 false positives out of 3 and would itself have become
//   a card generator): a pending row is NOT automatically a defect. It is only a defect if the
//   relay RAN and skipped it. So every relay run records a `sweep` even when it delivers
//   nothing, and the findings split three ways:
//     RED  outbox-undelivered — pending past deadline AND a sweep happened after it was posted
//                               (the relay ran, the row is still sitting: a real defect)
//     RED  relay-never        — rows exist and NO sweep has EVER run (the relay is unwired)
//     INFO outbox-waiting     — pending, but no sweep since it was posted. He simply has not
//                               opened a surface yet. NOT a defect, and never a card.
// NEVER: a producer delivering for itself - a second writer of outbox.jsonl - the same row
//   delivered on two surfaces - a pending row silently aged out - a card minted from here.
// LEDGER ROWS: {ev, id|of, ts, produced_by, kind, subject, body_ref, idempotency_key, priority,
//   requires_decision, why_code_cannot_decide, close_ref, via, surface, n}
// CLI: node scripts/outbox.mjs post --produced-by <organ> --kind <k> --subject "..."
//        [--body-ref <path>] [--priority <n>] [--close-ref <ref>] [--key <k>]
//        [--requires-decision --why-code-cannot-decide "..."] [--json]
//      | ingest [--days n] [--json]      (brain_ledger.jsonl -> rows, idempotent)
//      | pending [--json] | relay --surface <s> [--max n] [--json] | ack <id>
//      | status | selftest
// ============================================================================
import { readFileSync, appendFileSync, existsSync, mkdirSync, statSync, rmSync, writeFileSync, mkdtempSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const SELF = fileURLToPath(import.meta.url);
const __dirname = dirname(SELF);
const ROOT = join(__dirname, "..");
const STATE_DIR = join(ROOT, "dressing-room", "state");
export const OUTBOX_LEDGER = process.env.ARSENAL_OUTBOX_LEDGER || join(STATE_DIR, "outbox.jsonl");
export const BRAIN_LEDGER = process.env.ARSENAL_BRAIN_LEDGER || join(STATE_DIR, "brain_ledger.jsonl");
export const BRAIN_CONFIG = process.env.ARSENAL_BRAIN_CONFIG || join(STATE_DIR, "brain_config.json");

// the surfaces he actually touches. A row is delivered to exactly ONE of them — whichever he
// reaches first — and is gone from the rest the moment it is stamped.
export const SURFACES = ["code", "dugout", "gemini", "ntfy", "sheet"];
// `resolved` is his standing ask (LOAD_ZERO §BLOCK 3): issue kya tha -> kya kiya -> kyun -> asar.
export const KINDS = ["material", "resolved", "finding", "ask", "reminder"];
// a brain job's OWN declared surface.kind. `job_input` feeds another JOB, not him — that job
// posts if what IT makes is for him. Everything else ends up in front of him somehow.
export const NOT_FOR_HIM = ["job_input"];
const DEFAULT_DEADLINE_H = 12;
const DEFAULT_MAX_PER_SWEEP = 3;                                 // L7: he is never handed a list

const clip = (s, n = 300) => String(s == null ? "" : s).replace(/\s+/g, " ").trim().slice(0, n);
const newId = (now) => `o${now.getTime().toString(36)}${Math.floor(Math.random() * 1296).toString(36).padStart(2, "0")}`;
export const readRows = (p = OUTBOX_LEDGER) => { try { if (!existsSync(p)) return []; return readFileSync(p, "utf8").split("\n").filter((l) => l.trim()).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean); } catch { return []; } };
export const keyOf = (producedBy, kind, subject) => createHash("sha1").update(`${producedBy} ${kind} ${clip(subject, 300).toLowerCase()}`).digest("hex").slice(0, 12);

// -- the ledger lock (same idiom as tasks.mjs: a lock we cannot take is stepped over) --------
const sleepSync = (ms) => { try { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); } catch { /* no SAB */ } };
function withLock(fn, deps = {}) {
  if (deps.append) return fn();
  const path = deps.ledger || OUTBOX_LEDGER, lock = `${path}.lock.tmp`;
  try { mkdirSync(dirname(path), { recursive: true }); } catch { /* exists */ }
  const started = Date.now(); let held = false, tries = 0;
  while (!held && ++tries <= 600) {
    try { writeFileSync(lock, JSON.stringify({ pid: process.pid, at: Date.now() }), { flag: "wx" }); held = true; }
    catch (e) {
      if (!e || e.code !== "EEXIST") return fn();
      let age; try { age = Date.now() - statSync(lock).mtimeMs; } catch { continue; }
      if (age > 30000 || Date.now() - started > 5000) { try { rmSync(lock, { force: true }); } catch { /* raced */ } continue; }
      sleepSync(25);
    }
  }
  if (!held) return fn();
  try { return fn(); } finally { try { rmSync(lock, { force: true }); } catch { /* best effort */ } }
}
function appendRow(row, deps = {}) {
  if (deps.append) return deps.append(row);
  const path = deps.ledger || OUTBOX_LEDGER;
  try { mkdirSync(dirname(path), { recursive: true }); appendFileSync(path, JSON.stringify(row) + "\n"); return true; } catch { return false; }
}
const rowsOf = (deps) => (deps.rows ? deps.rows : readRows(deps.ledger || OUTBOX_LEDGER));

/** the row is the FOLD of its events — post, then at most one deliver, then at most one ack */
export function fold(rows) {
  const by = new Map();
  for (const r of rows || []) {
    if (!r || !r.ev) continue;
    if (r.ev === "post") { if (!by.has(r.id)) by.set(r.id, { id: r.id, produced_by: r.produced_by, kind: r.kind, subject: r.subject, body_ref: r.body_ref || null, idempotency_key: r.idempotency_key, priority: r.priority ?? 50, requires_decision: !!r.requires_decision, why_code_cannot_decide: r.why_code_cannot_decide || null, close_ref: r.close_ref || null, created_at: r.ts, delivered_at: null, delivered_via: null, acked_at: null }); continue; }
    if (r.ev === "sweep") continue;
    const o = by.get(r.of); if (!o) continue;
    if (r.ev === "deliver") { o.delivered_at = r.ts; o.delivered_via = r.via || null; }
    else if (r.ev === "ack") o.acked_at = r.ts;
  }
  return by;
}
export const sweeps = (rows) => (rows || []).filter((r) => r && r.ev === "sweep");
export const pending = (rows = readRows()) => [...fold(rows).values()].filter((o) => !o.delivered_at)
  .sort((a, b) => (b.priority - a.priority) || String(a.created_at).localeCompare(String(b.created_at)));

/** post — a producer's ONLY move. It never delivers; it appends and forgets. */
export function post(spec = {}, deps = {}) {
  const now = deps.now || new Date();
  const producedBy = clip(spec.producedBy, 80);
  const kind = String(spec.kind || "material").toLowerCase();
  const subject = clip(spec.subject, 300);
  if (!producedBy) return { ok: false, why: "post needs --produced-by (which organ made this) — an unattributable row cannot be closed or explained" };
  if (!KINDS.includes(kind)) return { ok: false, why: `unknown kind "${kind}" (${KINDS.join("|")})` };
  if (!subject) return { ok: false, why: "post needs --subject (what he is being told, in one line)" };
  // BLOCK 6 lands the DECISION GATE; the field is carried from day one so the gate has something
  // to enforce and so a row that ASKS him for something already has to say why code could not decide.
  if (spec.requiresDecision && !clip(spec.whyCodeCannotDecide, 10)) return { ok: false, why: "a row that requires HIS decision must carry --why-code-cannot-decide (BLOCK 6's gate; if code can decide it, code decides it and this row reports the DECISION instead)" };
  const key = spec.key ? String(spec.key) : keyOf(producedBy, kind, subject);
  return withLock(() => {
    const rows = rowsOf(deps);
    const dup = [...fold(rows).values()].find((o) => o.idempotency_key === key && !o.acked_at);
    if (dup) return { ok: true, duplicate: true, row: dup, why: `the same thing is already on the road as ${dup.id} (${dup.delivered_at ? "delivered " + dup.delivered_via : "pending"}) — he is told once, not twice` };
    const id = newId(now);
    const row = { ev: "post", id, ts: now.toISOString(), produced_by: producedBy, kind, subject, body_ref: spec.bodyRef || null, idempotency_key: key, priority: Number.isFinite(Number(spec.priority)) ? Number(spec.priority) : 50, requires_decision: !!spec.requiresDecision, why_code_cannot_decide: spec.whyCodeCannotDecide || null, close_ref: spec.closeRef || null };
    appendRow(row, deps);
    return { ok: true, duplicate: false, row: fold([row]).get(id) };
  }, deps);
}

/**
 * relay — THE ONLY THING THAT REACHES HIM. Stamps `deliver` under the lock, so the row is gone
 * from every other surface in the same instant. Records a `sweep` even when it delivers nothing,
 * which is what makes "did the relay run" answerable (see the dead-man's switch in the header).
 */
export function relay(surface, deps = {}, max = DEFAULT_MAX_PER_SWEEP) {
  const now = deps.now || new Date();
  const s = String(surface || "").toLowerCase();
  if (!SURFACES.includes(s)) return { ok: false, why: `unknown surface "${surface}" (${SURFACES.join("|")})` };
  return withLock(() => {
    const queue = pending(rowsOf(deps));
    const take = queue.slice(0, Math.max(0, Number(max) || DEFAULT_MAX_PER_SWEEP));
    for (const o of take) appendRow({ ev: "deliver", of: o.id, ts: now.toISOString(), via: s }, deps);
    appendRow({ ev: "sweep", ts: now.toISOString(), surface: s, n: take.length }, deps);
    return { ok: true, surface: s, delivered: take, held_back: Math.max(0, queue.length - take.length) };
  }, deps);
}

export function ack(id, deps = {}) {
  const now = deps.now || new Date();
  return withLock(() => {
    const o = fold(rowsOf(deps)).get(id);
    if (!o) return { ok: false, why: `no outbox row ${id}` };
    if (o.acked_at) return { ok: false, why: `row ${id} already acked at ${o.acked_at}` };
    appendRow({ ev: "ack", of: id, ts: now.toISOString() }, deps);
    return { ok: true, row: fold(rowsOf(deps)).get(id) };
  }, deps);
}

// -- INGEST — brain's own durable ledger becomes outbox rows (see header for why) -------------
export function forHimJobs(cfg) {
  const jobs = (cfg && Array.isArray(cfg.jobs) ? cfg.jobs : []).filter((j) => j && j.enabled !== false);
  const m = new Map();
  for (const j of jobs) {
    const kind = (j.surface && j.surface.kind) || null;
    m.set(j.id, { forHim: !NOT_FOR_HIM.includes(String(kind)), surface_kind: kind, out: j.out || j.id, priority: j.priority || 50 });
  }
  return m;
}
export function ingest(deps = {}, days = 3) {
  const now = deps.now || new Date();
  let cfg = deps.cfg;
  if (cfg === undefined) { try { cfg = JSON.parse(readFileSync(deps.brainConfig || BRAIN_CONFIG, "utf8")); } catch { cfg = null; } }
  if (!cfg) return { ok: false, why: "brain_config.json unreadable — cannot tell which jobs produce FOR HIM" };
  const meta = forHimJobs(cfg);
  let lines = deps.brainRows;
  if (lines === undefined) { try { lines = readFileSync(deps.brainLedger || BRAIN_LEDGER, "utf8").split("\n").filter((l) => l.trim()).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean); } catch { lines = []; } }
  const since = now.getTime() - days * 86400000;
  const runs = lines.filter((r) => r && r.ok && r.job && Date.parse(r.ts || "") >= since);
  const made = [];
  for (const r of runs) {
    const m = meta.get(r.job);
    if (!m || !m.forHim) continue;                                // job_input feeds a JOB, not him
    const day = String(r.ts).slice(0, 10);
    const res = post({ producedBy: `brain:${r.job}`, kind: "material", subject: `${r.job} — ${day} ka taiyaar material`, bodyRef: `brain_out/${m.out}/${day}.md`, priority: m.priority, key: keyOf(`brain:${r.job}`, "material", day), closeRef: r.act ? `act:${r.act}` : null }, deps);
    if (res.ok && !res.duplicate) made.push(res.row.id);
  }
  return { ok: true, scanned: runs.length, posted: made.length, ids: made, for_him_jobs: [...meta.values()].filter((m) => m.forHim).length, not_for_him: [...meta.values()].filter((m) => !m.forHim).length };
}

// -- the board + THE DEAD-MAN'S SWITCH ---------------------------------------
export function stats(rows = readRows(), now = Date.now(), deadlineH = DEFAULT_DEADLINE_H) {
  const all = [...fold(rows).values()];
  const sw = sweeps(rows);
  const lastSweep = sw.length ? Date.parse(sw[sw.length - 1].ts) : null;
  const pend = all.filter((o) => !o.delivered_at);
  // A row is only a DEFECT if the relay RAN AFTER it was posted and still left it sitting.
  // (BLOCK 9's ruling, applied here: silence with an explanation is not a finding.)
  const sweptSince = (o) => sw.some((x) => Date.parse(x.ts) > Date.parse(o.created_at));
  const overdue = pend.filter((o) => now - Date.parse(o.created_at) > deadlineH * 3600000);
  return {
    n: all.length, pending: pend.length, delivered: all.filter((o) => o.delivered_at).length, acked: all.filter((o) => o.acked_at).length,
    sweeps: sw.length, last_sweep_at: lastSweep ? new Date(lastSweep).toISOString() : null,
    undelivered_defect: overdue.filter(sweptSince).map((o) => ({ id: o.id, produced_by: o.produced_by, subject: o.subject })),
    waiting: overdue.filter((o) => !sweptSince(o)).map((o) => ({ id: o.id, produced_by: o.produced_by, subject: o.subject })),
    by_surface: sw.reduce((a, x) => { a[x.surface] = (a[x.surface] || 0) + (x.n || 0); return a; }, {}),
  };
}
export const boardLine = (s = stats()) => `outbox ${s.n} - pending ${s.pending} - delivered ${s.delivered} - acked ${s.acked} - sweeps ${s.sweeps}${Object.keys(s.by_surface).length ? ` - via ${Object.entries(s.by_surface).map(([k, v]) => `${k}:${v}`).join(" ")}` : ""}`;
export function findings(s = stats()) {
  const F = [];
  if (s.undelivered_defect.length) F.push({ id: "outbox-undelivered", level: "RED", finding: `${s.undelivered_defect.length} row(s) made FOR HIM sat undelivered while the relay ran past them — ${s.undelivered_defect.slice(0, 3).map((o) => `${o.id} ${o.produced_by}: ${clip(o.subject, 60)}`).join(" - ")}`, evidence: "`node scripts/outbox.mjs pending` — the relay swept after these were posted and did not take them" });
  if (s.n && !s.sweeps) F.push({ id: "relay-never", level: "RED", finding: `the outbox holds ${s.n} row(s) and the relay has NEVER run — everything made for him is sitting in a file`, evidence: "`node scripts/outbox.mjs relay --surface code` — wire the relay into a surface he touches" });
  if (s.waiting.length) F.push({ id: "outbox-waiting", level: "INFO", finding: `${s.waiting.length} row(s) waiting — he has not opened a surface since they were posted (this is NOT a defect and never becomes a card)`, evidence: "`node scripts/outbox.mjs pending`" });
  if (s.n) F.push({ id: "outbox-daily", level: "INFO", finding: boardLine(s), evidence: "`node scripts/outbox.mjs status`" });
  return F;
}

// -- SELFTEST ----------------------------------------------------------------
let pass = 0, failed = 0;
const assert = (name, cond, extra = "") => { if (cond) { pass++; console.log(`  ok   ${name}`); } else { failed++; console.log(`  FAIL ${name}${extra ? ` — ${extra}` : ""}`); } };

function selftest() {
  console.log("outbox.mjs selftest — LOAD ZERO BLOCK 3 (OUTBOX + RELAY: one road to him)\n");
  const now = new Date("2026-08-19T04:00:00Z");
  const rows = [];
  const deps = { rows, append: (r) => { rows.push(r); return true; }, now };

  const p1 = post({ producedBy: "brain:prepare_on_request", kind: "material", subject: "samjhao material taiyaar", bodyRef: "brain_out/prepare_on_request/2026-08-19.md", priority: 80 }, deps);
  assert("a producer POSTS and forgets — it never delivers (the transactional outbox)", p1.ok && !p1.duplicate && p1.row.id && !p1.row.delivered_at);
  assert("a row with no producer is refused (an unattributable row cannot be closed or explained)", !post({ kind: "material", subject: "x" }, deps).ok);
  assert("a row with no subject is refused", !post({ producedBy: "x", subject: "  " }, deps).ok);
  const dup = post({ producedBy: "brain:prepare_on_request", kind: "material", subject: "samjhao material taiyaar" }, deps);
  assert("the SAME thing posted twice is ONE row — he is told once, not twice", dup.ok && dup.duplicate && dup.row.id === p1.row.id);
  assert("a row that REQUIRES HIS DECISION must say why code could not decide it (BLOCK 6's gate, carried from day one)",
    !post({ producedBy: "o", kind: "ask", subject: "kaunsa chuno?", requiresDecision: true }, deps).ok
    && post({ producedBy: "o", kind: "ask", subject: "kaunsa chuno?", requiresDecision: true, whyCodeCannotDecide: "dono legal hain, farak sirf uski marzi ka hai" }, deps).ok);

  post({ producedBy: "watchman", kind: "resolved", subject: "issue: brain daemon gira tha -> kiya: watchdog ne uthaya -> kyun: VBS cloak -> asar: 6/6", priority: 90 }, deps);
  const q = pending(rows);
  assert("`resolved` is a first-class kind — his standing ask (issue -> kya kiya -> kyun -> asar) rides the same road", q.some((o) => o.kind === "resolved"));
  assert("the queue is priority-first, then oldest-first", q[0].priority === 90 && q[1].priority === 80);

  // THE RELAY — one surface takes it, and it vanishes from the others in the same instant
  const r1 = relay("code", deps, 2);
  assert("the relay delivers to the surface he touched, bounded (L7: he is never handed a list) and says what it held back",
    r1.ok && r1.delivered.length === 2 && r1.held_back === 1);
  const afterCode = pending(rows);
  assert("REMOVED FROM THE OTHERS: what `code` took is gone from every other surface's queue in the same stamp",
    afterCode.length === 1 && !afterCode.some((o) => r1.delivered.some((d) => d.id === o.id)));
  const r2 = relay("dugout", deps, 5);
  assert("...so the next surface gets only what is LEFT — exactly once, never a duplicate", r2.delivered.length === 1 && pending(rows).length === 0);
  assert("an unknown surface is refused", !relay("telepathy", deps).ok);
  const r3 = relay("ntfy", deps);
  assert("a relay run with NOTHING to deliver still records a SWEEP — that is what makes 'did the relay run' answerable", r3.ok && r3.delivered.length === 0 && sweeps(rows).length === 3);

  const one = fold(rows).get(p1.row.id);
  assert("a delivered row carries WHEN and VIA — the stamp BLOCK 4 will use to close the originating ask", !!one.delivered_at && one.delivered_via === "code");
  assert("ack is once and only once", ack(p1.row.id, deps).ok && !ack(p1.row.id, deps).ok);

  // THE DEAD-MAN'S SWITCH, with BLOCK 9's correction applied
  const t0 = Date.parse("2026-08-19T04:00:00Z");
  const waitRows = [{ ev: "post", id: "oWAIT", ts: "2026-08-18T00:00:00Z", produced_by: "brain:diary", kind: "material", subject: "kal ka diary", idempotency_key: "k1", priority: 50 }];
  const fw = findings(stats(waitRows, t0));
  assert("BLOCK 9's LESSON APPLIED: a row pending while he simply has not opened a surface is INFO, never RED and never a card",
    fw.some((f) => f.id === "outbox-waiting" && f.level === "INFO") && !fw.some((f) => f.level === "RED" && f.id === "outbox-undelivered"), JSON.stringify(fw.map((f) => f.id + ":" + f.level)));
  const defectRows = waitRows.concat([{ ev: "sweep", ts: "2026-08-18T12:00:00Z", surface: "code", n: 0 }]);
  const fd = findings(stats(defectRows, t0));
  assert("...but a row the relay RAN PAST is a real defect — RED outbox-undelivered", fd.some((f) => f.id === "outbox-undelivered" && f.level === "RED"));
  assert("rows exist and the relay has NEVER run ⇒ RED relay-never (the road is unwired)", findings(stats(waitRows, t0)).concat(findings(stats([{ ev: "post", id: "oX", ts: "2026-08-19T03:00:00Z", produced_by: "p", kind: "material", subject: "s", idempotency_key: "k2" }], t0))).some((f) => f.id === "relay-never" && f.level === "RED"));

  // INGEST — brain's own ledger becomes rows; job_input feeds a JOB, not him
  const cfg = { jobs: [
    { id: "prepare_on_request", enabled: true, out: "prepare_on_request", priority: 80, surface: { kind: "code" } },
    { id: "doubt_clusters", enabled: true, out: "doubt_clusters", priority: 60, surface: { kind: "human_file" } },
    { id: "midday_digest", enabled: true, out: "midday_digest", priority: 40, surface: { kind: "job_input" } },
  ] };
  const brainRows = [
    { ts: "2026-08-19T02:00:00Z", job: "prepare_on_request", ok: true, act: "amsz3vaiyof" },
    { ts: "2026-08-19T02:30:00Z", job: "doubt_clusters", ok: true },
    { ts: "2026-08-19T02:40:00Z", job: "midday_digest", ok: true },
    { ts: "2026-08-19T02:50:00Z", job: "doubt_clusters", ok: false },
  ];
  const irows = []; const ideps = { rows: irows, append: (r) => { irows.push(r); return true; }, now, cfg, brainRows };
  const ing = ingest(ideps, 3);
  assert("INGEST turns brain's own durable ledger into outbox rows — one site, retroactive, impossible for a producer to forget",
    ing.ok && ing.posted === 2, JSON.stringify(ing));
  assert("...and `job_input` is NOT for him — it feeds another JOB, which posts if what IT makes is his",
    !irows.some((r) => r.ev === "post" && /midday_digest/.test(r.produced_by || "")));
  assert("...a FAILED run posts nothing (there is no material to deliver)", irows.filter((r) => r.ev === "post" && /doubt_clusters/.test(r.produced_by || "")).length === 1);
  assert("...the row points at the artifact and carries the act that asked for it (BLOCK 4's close_ref)",
    irows.some((r) => r.ev === "post" && r.body_ref === "brain_out/prepare_on_request/2026-08-19.md" && r.close_ref === "act:amsz3vaiyof"));
  const again = ingest(ideps, 3);
  assert("INGEST IS IDEMPOTENT — running it on every surface touch posts nothing new", again.ok && again.posted === 0);

  // a real file, and hermeticity
  const dir = mkdtempSync(join(tmpdir(), "arsenal_outbox_"));
  const ledger = join(dir, "outbox.jsonl");
  post({ producedBy: "samjhao", kind: "material", subject: "tokenization unit 1 tayyar" }, { ledger, now });
  const got = relay("code", { ledger, now });
  assert("on a REAL ledger file (lock + fold) the road works end to end", got.ok && got.delivered.length === 1 && pending(readRows(ledger)).length === 0);
  assert("HERMETICITY — the selftest wrote only into tmpdir, never onto the state bus",
    !readRows(join(STATE_DIR, "outbox.jsonl")).some((r) => r.produced_by === "samjhao" && /tokenization unit 1/.test(r.subject || "")));
  try { rmSync(dir, { recursive: true, force: true }); } catch { /* tmp */ }

  console.log(`\noutbox: ${pass} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}

// -- CLI ----------------------------------------------------------------------
const flag = (n, d = null) => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] !== undefined && !String(process.argv[i + 1]).startsWith("--") ? process.argv[i + 1] : (i > 0 ? true : d); };
const has = (n) => process.argv.includes(`--${n}`);
const fmt = (o) => `${o.id} · ${o.produced_by} · [${o.kind}] ${clip(o.subject, 100)}${o.body_ref ? ` · ${o.body_ref}` : ""}${o.delivered_at ? ` · delivered ${o.delivered_via}` : " · PENDING"}`;

if (process.argv[1] && process.argv[1].endsWith("outbox.mjs")) {
  const mode = process.argv[2] || "status";
  if (mode === "selftest") selftest();
  else if (mode === "post") {
    const r = post({ producedBy: flag("produced-by"), kind: flag("kind") || "material", subject: flag("subject"), bodyRef: flag("body-ref"), priority: flag("priority"), closeRef: flag("close-ref"), key: flag("key"), requiresDecision: has("requires-decision"), whyCodeCannotDecide: flag("why-code-cannot-decide") });
    if (!r.ok) { console.log(has("json") ? JSON.stringify({ ok: false, why: r.why }) : `outbox: ${r.why}`); process.exit(1); }
    console.log(has("json") ? JSON.stringify({ ok: true, id: r.row.id, duplicate: !!r.duplicate }) : `outbox: ${r.duplicate ? "already on the road" : "posted"} ${fmt(r.row)}`);
  }
  else if (mode === "ingest") {
    const r = ingest({}, Number(flag("days", 3)) || 3);
    if (!r.ok) { console.log(`outbox: ${r.why}`); process.exit(1); }
    console.log(has("json") ? JSON.stringify(r) : `outbox: ingest — ${r.scanned} brain run(s) scanned, ${r.posted} new row(s) on the road (${r.for_him_jobs} job(s) produce FOR HIM, ${r.not_for_him} feed another job)`);
  }
  else if (mode === "relay") {
    const r = relay(flag("surface"), {}, Number(flag("max", DEFAULT_MAX_PER_SWEEP)) || DEFAULT_MAX_PER_SWEEP);
    if (!r.ok) { console.log(`outbox: ${r.why}`); process.exit(1); }
    if (has("json")) console.log(JSON.stringify(r));
    else if (!r.delivered.length) console.log(`outbox: ${r.surface} — kuch naya nahi (sweep recorded)`);
    else { console.log(`outbox: ${r.surface} — ${r.delivered.length} naya${r.held_back ? ` (${r.held_back} aur rukka hai)` : ""}`); r.delivered.forEach((o) => console.log(`  · ${clip(o.subject, 120)}${o.body_ref ? `  → ${o.body_ref}` : ""}`)); }
  }
  else if (mode === "pending") {
    const q = pending();
    if (has("json")) console.log(JSON.stringify(q));
    else { console.log(`${q.length} pending`); q.forEach((o) => console.log(`  ${fmt(o)}`)); }
  }
  else if (mode === "ack") { const r = ack(process.argv[3]); console.log(r.ok ? `outbox: ok ${fmt(r.row)}` : `outbox: ${r.why}`); process.exit(r.ok ? 0 : 1); }
  else if (mode === "status") {
    const s = stats();
    console.log(boardLine(s));
    findings(s).forEach((f) => console.log(`  ${f.level} ${f.id} — ${f.finding}`));
  }
  else console.log(`outbox: post --produced-by <o> --kind <k> --subject "..." [--body-ref p --priority n --close-ref r --requires-decision --why-code-cannot-decide "..."] | ingest [--days n] | relay --surface ${SURFACES.join("|")} [--max n] | pending | ack <id> | status | selftest`);
}
