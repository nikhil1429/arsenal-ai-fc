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
//      | brief [--max n]                  (LOAD ZERO BLOCK 6: relay to `code` AND render it, at
//                                          the SessionStart anchor — the stamp and the seeing are
//                                          one event. Silent when there is nothing.)
//      | status | selftest
// ============================================================================
import { readFileSync, appendFileSync, existsSync, mkdirSync, statSync, rmSync, writeFileSync, mkdtempSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
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
// ── LOAD ZERO, AFTER BLOCK 6 (19 Aug 2026) — THE LANES BRAIN_CONFIG DOES NOT DECLARE ──────────
// `ingest` walks brain_ledger.jsonl and asks brain_config which jobs produce FOR HIM. A lane in the
// ledger that brain_config has never heard of was silently DROPPED — and the BLOCK 6 entry recorded
// that as an open gap ("ns_*/dmn_* lanes have no outbox door"). Measured properly, the gap is not
// what it looked like: all 15 such lanes are consumed by ANOTHER ORGAN, none writes a file he reads.
//   dmn_rollout · dmn_counter          → dmn.mjs · physio.mjs · council.mjs
//   ns_probe_bank · ns_distractors ·   → nightshift.mjs · dugout.mjs · thalamus.mjs · gaffer_brain.mjs
//     ns_pre_answers · ns_grade_probes
//   cortex_wake · cortex_consolidate   → cortex.mjs · council.mjs
//   thalamus_adjudicator               → thalamus.mjs
//   council_chair                      → council.mjs
//   gaffer_judge · gaffer_verify       → gaffer_brain.mjs (they reach him AS THE CONVERSATION, not as a file)
//   mission_m03                        → scout.mjs (the mission lane has its own road and its own cards)
//   haiku_pulse                        → RETIRED (commit 4f94805)
// So giving them a road would put internal plumbing on the one surface that is supposed to carry
// only what he needs — the opposite of L7. They stay out, BY DECLARATION rather than by accident,
// and the suite names any ledger lane that is neither in brain_config nor here: a new lane may not
// slip past the road unexamined, which is the one thing this list cannot notice about itself.
export const LANES_NOT_IN_CONFIG = Object.freeze({
  dmn_rollout: "feeds dmn.mjs / physio.mjs / council.mjs — the default-mode rollout, never a file he opens",
  dmn_counter: "feeds dmn.mjs / council.mjs — the counter behind the rollout",
  ns_probe_bank: "feeds nightshift.mjs / dugout.mjs — he meets it AS a scrimmage, and dugout stamps its consumption",
  ns_distractors: "feeds nightshift.mjs / dugout.mjs — he meets it inside get_rejirah, which stamps its consumption",
  ns_pre_answers: "feeds thalamus.mjs / dugout.mjs — pre-answers for the mouth, never read as a file",
  ns_grade_probes: "feeds nightshift.mjs — the shift grades its own probes",
  cortex_wake: "feeds cortex.mjs / council.mjs — a wake is machinery, not a message",
  cortex_consolidate: "feeds cortex.mjs / nightshift.mjs — consolidation is internal",
  thalamus_adjudicator: "feeds thalamus.mjs — the bus adjudicates its own signals",
  council_chair: "feeds council.mjs — the council's own chair turn",
  gaffer_judge: "feeds gaffer_brain.mjs — it reaches him AS the conversation, which is a surface the relay does not own",
  gaffer_verify: "feeds gaffer_brain.mjs / scout.mjs — same: the Gaffer's own reasoning inside a sitting",
  mission_m03: "feeds scout.mjs — the mission lane carries its own returns and its own cards",
  haiku_pulse: "RETIRED on purpose (commit 4f94805) — 98% of 32,480 tok/pulse was boot tax",
  selfknowledge: "feeds dugout.mjs get_organism, which stamps its consumption directly",
});
const DEFAULT_DEADLINE_H = 12;
const DEFAULT_MAX_PER_SWEEP = 3;                                 // L7: he is never handed a list

const clip = (s, n = 300) => String(s == null ? "" : s).replace(/\s+/g, " ").trim().slice(0, n);
const newId = (now) => `o${now.getTime().toString(36)}${Math.floor(Math.random() * 1296).toString(36).padStart(2, "0")}`;
export const readRows = (p = OUTBOX_LEDGER) => { try { if (!existsSync(p)) return []; return readFileSync(p, "utf8").split("\n").filter((l) => l.trim()).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean); } catch { return []; } };
export const keyOf = (producedBy, kind, subject) => createHash("sha1").update(`${producedBy} ${kind} ${clip(subject, 300).toLowerCase()}`).digest("hex").slice(0, 12);

// -- the owners this organ closes THROUGH (never around) — it writes only outbox.jsonl ------
function owner(organ, argv, deps = {}) {
  if (deps.exec) return deps.exec(organ, argv);
  const r = spawnSync(process.execPath, [join(__dirname, organ), ...argv.map(String)], { encoding: "utf8", timeout: 60000, windowsHide: true, env: { ...process.env, ARSENAL_ORGAN: "1" } });
  return { ok: r.status === 0, out: String(r.stdout || ""), err: String(r.stderr || ""), status: r.status };
}

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

// -- LOAD ZERO BLOCK 4: CLOSE — delivery closes the originating ask, from ANY door -----------
// THE BUG (19 Aug 2026, 00:00): the organism could answer an ask and still not CLOSE it, because
// the only thing that could mark an agenda row done was `sitting.mjs closeSitting()`, and only for
// rows THAT sitting had served. So a Gaffer-born ask could never be closed by the Gaffer, and a
// dugout reopen re-served a row the organism had already answered — he was asked the same thing
// twice by a system that had already done the work.
// THE RULE: the relay's `delivered` stamp is what closes the originating ask. One road in, one
// road out. Every close goes THROUGH the ref's owner CLI — this organ writes only outbox.jsonl.
// A scheme that does NOT close says so out loud rather than pretending: an act's close IS its
// receipt (append-only, it already exists), and a card is answered by HIM (haan/na/baad) — handing
// him a card is not answering it, and auto-closing one would silently drop a decision he owns.
export const CLOSERS = {
  agenda: { organ: "sitting.mjs", argv: (id) => ["agenda", "done", id, "--by", "outbox"] },
  task: { organ: "tasks.mjs", argv: (id) => ["finish", id, "--receipt", "delivered to him by the relay"] },
  act: { closes: false, why: "an act's close IS its receipt — acts.jsonl is append-only and the receipt already exists" },
  card: { closes: false, why: "a card is ANSWERED by him (haan/na/baad); delivering it is not answering it" },
};
export const CLOSE_SCHEMES = Object.keys(CLOSERS);
export const parseCloseRef = (ref) => { const m = /^([a-z]+):(.+)$/.exec(String(ref || "").trim()); return m && CLOSERS[m[1]] ? { scheme: m[1], id: m[2] } : null; };

/** fire the close for one delivered row, through the ref's OWNER. Never writes another organ's file. */
export function closeFor(row, deps = {}) {
  const ref = parseCloseRef(row && row.close_ref);
  if (!ref) return { ok: false, why: row && row.close_ref ? `close_ref "${row.close_ref}" names no known scheme (${CLOSE_SCHEMES.join("|")})` : "no close_ref on this row" };
  const c = CLOSERS[ref.scheme];
  if (c.closes === false) return { ok: true, closed: false, scheme: ref.scheme, why: c.why };
  const r = owner(c.organ, c.argv(ref.id), deps);
  const said = clip((r.out || r.err || "").trim(), 200);
  // a close that FAILED must say why, out loud. Silence here would be the same disease one level
  // down: the organism thinks it closed the ask, the owner says otherwise, and nobody hears it.
  return { ok: !!r.ok, closed: !!r.ok, scheme: ref.scheme, id: ref.id, said, why: r.ok ? null : `${c.organ} refused to close ${ref.scheme}:${ref.id} — ${said || "exit " + r.status}` };
}

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
  // LOAD ZERO BLOCK 4 — THE RATCHET: no ask may be created without a CLOSE PATH. A row that asks
  // him for something and cannot be closed is precisely the thing that becomes a card he has to
  // remember. `material` may carry a close_ref; an `ask`/`reminder` MUST.
  if (spec.closeRef && !parseCloseRef(spec.closeRef)) return { ok: false, why: `close_ref "${spec.closeRef}" names no known scheme — use ${CLOSE_SCHEMES.map((x) => x + ":<id>").join(" | ")}` };
  if ((kind === "ask" || kind === "reminder") && !spec.closeRef) return { ok: false, why: `a "${kind}" row must carry --close-ref (${CLOSE_SCHEMES.map((x) => x + ":<id>").join(" | ")}) — an ask with no close path is how a thing ends up living in his memory` };
  const key = spec.key ? String(spec.key) : keyOf(producedBy, kind, subject);
  return withLock(() => {
    const rows = rowsOf(deps);
    const dup = [...fold(rows).values()].find((o) => o.idempotency_key === key && !o.acked_at);
    if (dup) return { ok: true, duplicate: true, row: dup, why: `the same thing is already on the road as ${dup.id} (${dup.delivered_at ? "delivered " + dup.delivered_via : "pending"}) — he is told once, not twice` };
    const id = newId(now);
    const row = { ev: "post", id, ts: now.toISOString(), produced_by: producedBy, kind, subject, body_ref: spec.bodyRef || null, idempotency_key: key, priority: (spec.priority !== null && spec.priority !== undefined && spec.priority !== true && Number.isFinite(Number(spec.priority))) ? Number(spec.priority) : 50, requires_decision: !!spec.requiresDecision, why_code_cannot_decide: spec.whyCodeCannotDecide || null, close_ref: spec.closeRef || null };
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
    for (const o of take) {
      appendRow({ ev: "deliver", of: o.id, ts: now.toISOString(), via: s }, deps);
      // BLOCK 4: the delivered stamp IS the close. Fired here, from the one road, so an ask born
      // at ANY door closes — the Gaffer's included. A scheme that does not close says why.
      const c = closeFor(o, deps);
      o.closed = c.ok && c.closed !== false ? { scheme: c.scheme, id: c.id } : null;
      o.close_note = c.ok ? (c.closed === false ? c.why : null) : c.why;
    }
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
    !post({ producedBy: "o", kind: "ask", subject: "kaunsa chuno?", requiresDecision: true, closeRef: "card:c99" }, deps).ok
    && post({ producedBy: "o", kind: "ask", subject: "kaunsa chuno?", requiresDecision: true, whyCodeCannotDecide: "dono legal hain, farak sirf uski marzi ka hai", closeRef: "card:c99" }, deps).ok);
  // BLOCK 4 · THE RATCHET: no ask may be created without a CLOSE PATH.
  assert("BLOCK 4 · an `ask` with NO close_ref is refused — an ask that cannot be closed is how a thing ends up living in his memory",
    !post({ producedBy: "o", kind: "ask", subject: "bina raaste ka sawaal" }, deps).ok);
  assert("BLOCK 4 · a close_ref naming an unknown scheme is refused at the door", !post({ producedBy: "o", kind: "material", subject: "x", closeRef: "telepathy:9" }, deps).ok);

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

  // BLOCK 4 · DELIVERY CLOSES THE ASK, FROM ANY DOOR — the 19 Aug 00:00 repeat, killed.
  const crows = []; const ccalls = [];
  const cdeps = { rows: crows, append: (r) => { crows.push(r); return true; }, now,
    exec: (organ, argv) => { ccalls.push({ organ, argv }); return { ok: true, out: `${organ} ok` }; } };
  post({ producedBy: "gaffer", kind: "material", subject: "uska poocha hua kaam ho gaya", closeRef: "agenda:agmsyysuqy" }, cdeps);
  const cr = relay("code", cdeps);
  assert("BLOCK 4 · the relay's DELIVERED stamp closes the originating ask THROUGH ITS OWNER (sitting.mjs agenda done) — an ask born at the Gaffer is now closable by the Gaffer",
    cr.ok && ccalls.length === 1 && ccalls[0].organ === "sitting.mjs" && ccalls[0].argv.slice(0, 3).join(" ") === "agenda done agmsyysuqy", JSON.stringify(ccalls));
  const trows = []; const tcalls = [];
  const tdeps = { rows: trows, append: (r) => { trows.push(r); return true; }, now, exec: (organ, argv) => { tcalls.push({ organ, argv }); return { ok: true, out: "ok" }; } };
  post({ producedBy: "brain:x", kind: "material", subject: "task ka output", closeRef: "task:tABC" }, tdeps);
  relay("code", tdeps);
  assert("BLOCK 4 · a task-backed ask closes through tasks.mjs, not by this organ writing anything", tcalls.length === 1 && tcalls[0].organ === "tasks.mjs" && tcalls[0].argv[0] === "finish");
  const nrows = []; const ncalls = [];
  const ndeps = { rows: nrows, append: (r) => { nrows.push(r); return true; }, now, exec: (organ, argv) => { ncalls.push({ organ, argv }); return { ok: true, out: "ok" }; } };
  post({ producedBy: "x", kind: "ask", subject: "haan ya na?", requiresDecision: true, whyCodeCannotDecide: "uski marzi", closeRef: "card:c71" }, ndeps);
  const nr = relay("code", ndeps);
  assert("BLOCK 4 · a scheme that does NOT close says so out loud — a CARD is answered by HIM, and delivering it is not answering it (auto-closing would silently drop a decision he owns)",
    ncalls.length === 0 && nr.delivered[0].closed === null && /answered by/i.test(nr.delivered[0].close_note || ""), JSON.stringify(nr.delivered[0] && nr.delivered[0].close_note));

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
  // LOAD ZERO BLOCK 6 (19 Aug 2026) — THE ROAD GETS TRAFFIC. Measured that morning: `relay` had
  // NEVER been called by anything in production — every call site was this CLI, the selftest, or
  // organism_test. The road was built and nobody drove on it (22 rows posted, 6 delivered, and
  // those 6 by a hand-run proof). A gate taught to see the road would have seen an empty one after
  // the 14-day window aged those 6 out, and the cards would have come straight back.
  // WHY A SEPARATE VERB AND NOT `relay --surface code`: the relay stamp only MEANS "he was shown
  // it" if the thing that stamps it is the thing that renders it. This verb is the renderer — it
  // delivers and prints in the same breath, at the SessionStart anchor (turn_hook `start`), so the
  // stamp and the seeing are the same event. Silent when there is nothing, per L7.
  else if (mode === "brief") {
    const r = relay("code", {}, Number(flag("max", DEFAULT_MAX_PER_SWEEP)) || DEFAULT_MAX_PER_SWEEP);
    if (r.ok && r.delivered.length) {                               // silent otherwise: no road news is not news
      console.log(`📮 OUTBOX (${r.delivered.length} naya${r.held_back ? ` · ${r.held_back} aur rukka hai` : ""}) — jo ban chuka tha aur tum tak nahi pahuncha tha:`);
      // close_note is shown only when a close was ATTEMPTED and had something to say. A `material`
      // or `finding` row carries no close_ref by design, and printing "no close_ref on this row"
      // beside every line hands him the plumbing instead of the news.
      r.delivered.forEach((o) => console.log(`  · ${clip(o.subject, 110)}${o.body_ref ? `  → ${o.body_ref}` : ""}${o.close_ref && o.close_note ? `  [${clip(o.close_note, 40)}]` : ""}`));
    }
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
  else console.log(`outbox: post --produced-by <o> --kind <k> --subject "..." [--body-ref p --priority n --close-ref r --requires-decision --why-code-cannot-decide "..."] | ingest [--days n] | relay --surface ${SURFACES.join("|")} [--max n] | brief [--max n] | pending | ack <id> | status | selftest`);
}
