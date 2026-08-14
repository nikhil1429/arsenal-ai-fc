#!/usr/bin/env node
// ============================================================================
// archivist.mjs · ARSENAL AI FC — THE ARCHIVE (Day-One spec, sealed 14 Aug 2026)
// ----------------------------------------------------------------------------
// WHAT: the SOLE WRITER of $ARSENAL_ARCHIVE — the permanent, self-describing,
//   application-independent record of Nikhil Panwar. It TAILS the organism's
//   append-only lanes (every *.jsonl under dressing-room/), wraps each row into
//   a provenance-carrying, hash-chained record (ARCHIVE__DAY_ONE_SPEC.md §5),
//   and appends it to an IST-day file inside a BagIt bag that opens in 2046
//   without this repo, without Node, and without any code at all.
//
// WHY A TAILING ORGAN AND NOT A WRITE INSIDE THE THALAMUS (spec §3): the capture
//   nerve must never bite. afferent.jsonl is the WRITE-AHEAD LOG (hot, fast,
//   never blocks); this is the durable store. Hashing, chaining and fsync happen
//   off the hot path; if this organ dies, nothing else in the organism breaks;
//   and because it tails, it can backfill all existing history on first run.
//   CONSEQUENCE, and it is the reason `run` is on 15 minutes: anything lost from
//   the WAL before it is archived is lost forever.
//
// THE EIGHT LAWS THIS FILE IMPLEMENTS (spec §2 — canon, do not "improve"):
//   1. ONE DOOR — every byte enters through the thalamus; this reads what landed.
//   2. THE RAW IS SACRED — no pass edits, summarises-in-place, deletes or
//      reorders. `payload` is the original row, byte-for-byte (§5.4). Nothing in
//      this file writes to dressing-room/ at all.
//   3. NOTHING IS REJECTED AT THE DOOR — a line that will not parse is
//      QUARANTINED with its raw bytes, never dropped. Filtering is the READER's.
//   4. EVERY RECORD CARRIES ITS PROVENANCE — who · when · where · which thread ·
//      which surface · which schema version. Content is recoverable; context is not.
//   5. BELIEF IS DATA — reserved: `derived_from` + `agent` are on every record so
//      the first derived FACT cannot be written without naming its source.
//   6. THE ARCHIVE HAS VITAL SIGNS — `vitals` (counts, fill rates, silence) and
//      `verify` (fixity) write health/ rows. An archive that cannot report its
//      own health is a hypothesis.
//   7. RETENTION IS A DECISION — `tier` is stamped at write time, defaults to
//      "private", and is only ever RELAXED by the writer's explicit act.
//   8. STRUCTURE IS DISPOSABLE — the checkpoint file, the seq counters and the
//      whole derived/ tree can be deleted and rebuilt from data/ (`verify` and
//      laneHead() both re-derive from the records themselves).
//
// SINGLE WRITER: this organ owns $ARSENAL_ARCHIVE and nothing else. It is
//   READ-ONLY on dressing-room/ — including its own selftest.
//
// MODES: init · run · backfill · verify [--month YYYY-MM] · vitals · seal · rebuild <lane> · lanes · tripwire · status · selftest
//
// TIME (spec §4): three separate clock facts, all irrecoverable if skipped —
//   ts_utc (the instant) · ts_local + tz (the WALL CLOCK: "he wrote this at 3am"
//   is different information from the UTC instant, and it is the single most
//   behaviourally informative field in the archive for a man whose sleep is
//   inverted) · seq (the only total order that survives four surfaces whose
//   clocks disagree). DAY FILES ARE PARTITIONED ON THE IST DAY, NEVER UTC — he
//   routinely works to 2-3 AM IST and a UTC partition splits one working night
//   across two files. The bag says so in bag-info.txt, README.md and v1.json,
//   because a future reader who assumes UTC is wrong about every late night.
//
// NOTE ON THE SPEC'S OWN ARITHMETIC (§11 test 6): the spec writes
//   "2026-08-14T02:30:00+05:30 (i.e. 20:30Z on the 13th)". 02:30 − 5:30 = 21:00Z
//   on the 13th, not 20:30Z. The REQUIREMENT is unambiguous and is what is tested
//   here (that instant lands in 2026/08/14.jsonl); the parenthetical is a slip
//   and is corrected here rather than copied forward.
// ============================================================================
import {
  existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync,
  openSync, readSync, writeSync, fsyncSync, closeSync, renameSync, rmSync, mkdtempSync,
} from "node:fs";
import { join, dirname, basename, resolve, relative, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createHash, randomBytes } from "node:crypto";
import { homedir, tmpdir } from "node:os";
import { spawnSync } from "node:child_process";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const ZONE = "Asia/Kolkata";
const SCHEMA_V = 1;
const CAPTURE_ROOT = "dressing-room";          // where the organism's lanes live
const MAX_BATCH_BYTES = 64 * 1024 * 1024;      // per source file, per run
const VITALS_WINDOW_DAYS = 45;                 // vitals reads a window, not 20 years
const MOMENT_STALE_MS = 6 * 60 * 60 * 1000;    // see stampMoment()

// THE ARCHIVE ROOT is an env var and its default is OUTSIDE the repo, because in
// twenty years `arsenal-ai-fc` will not exist. The app writes to the archive; the
// app does not own the archive.
const archiveRoot = () => resolve(process.env.ARSENAL_ARCHIVE || join(homedir(), "CyborgArchive"));

// ── CANONICAL BYTES (spec §5.1) ──────────────────────────────────────────────
// JCS-style: keys sorted by UTF-16 code unit, no insignificant whitespace, UTF-8.
// JSON.stringify's number and string rules ARE the JCS rules (both are ES6), so
// this is a sort + a concat and nothing more clever. Deliberately not a library:
// a 2046 reader must be able to re-implement it from this function in an hour.
export const canon = (v) => {
  if (v === undefined) return undefined;
  if (v === null || typeof v !== "object") return JSON.stringify(v);
  if (Array.isArray(v)) return "[" + v.map((x) => canon(x) ?? "null").join(",") + "]";
  const keys = Object.keys(v).filter((k) => v[k] !== undefined).sort();
  return "{" + keys.map((k) => JSON.stringify(k) + ":" + canon(v[k])).join(",") + "}";
};
export const sha256Hex = (s) => createHash("sha256").update(Buffer.from(s, "utf8")).digest("hex");

// ── ULID (spec §5: sortable, distributed-safe) ───────────────────────────────
// Crockford base32, 10 chars of 48-bit millisecond time + 16 chars of randomness.
const B32 = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
export const ulid = (ms = Date.now()) => {
  let t = "", n = Math.max(0, Math.floor(ms));
  for (let i = 0; i < 10; i++) { t = B32[n % 32] + t; n = Math.floor(n / 32); }
  const r = randomBytes(16);
  let s = "";
  for (let i = 0; i < 16; i++) s += B32[r[i] % 32];
  return t + s;
};

// ── IST, DERIVED NOT ASSUMED ─────────────────────────────────────────────────
// India has had no DST since 1945 and +05:30 is a safe constant TODAY — but the
// offset is read from the platform's tz database FOR THE INSTANT IN QUESTION, so
// a zone-rule change (or a record from a year with different rules) is honoured
// instead of silently mis-stamped. Falls back to +05:30 if ICU is unavailable.
export function zoneOffsetMinutes(d, zone = ZONE) {
  try {
    const dtf = new Intl.DateTimeFormat("en-US", {
      timeZone: zone, hour12: false,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
    const p = {};
    for (const part of dtf.formatToParts(d)) if (part.type !== "literal") p[part.type] = part.value;
    const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second);
    return Math.round((asUTC - (d.getTime() - d.getMilliseconds())) / 60000);
  } catch { return 330; }
}

// The wall clock WITH its offset, plus the day key the archive partitions on.
export function istStamp(d, zone = ZONE) {
  const off = zoneOffsetMinutes(d, zone);
  const sign = off < 0 ? "-" : "+";
  const abs = Math.abs(off);
  const hh = String(Math.floor(abs / 60)).padStart(2, "0");
  const mm = String(abs % 60).padStart(2, "0");
  const local = new Date(d.getTime() + off * 60000).toISOString().replace("Z", `${sign}${hh}:${mm}`);
  return { local, tz: zone, day: local.slice(0, 10), offset_minutes: off };
}
export const istDayKey = (d) => istStamp(d).day;

// ── THE SOURCE LANES ─────────────────────────────────────────────────────────
// DISCOVERED, never a closed list (spec §7.1): every *.jsonl under dressing-room/
// is a lane, including rolled month files and .1 rotations. A hardcoded roll is
// how a lane born next month gets archived by nobody and nothing says so.
// MUST_COVER is a REPORT, not a filter — the spec names twelve lanes that have to
// be covered, so `lanes` says out loud which of them are present and which have
// never existed on this machine (three had not, on the day this was written).
const MUST_COVER = [
  "afferent", "episodes", "reps_log", "rejirah_log", "brain_ledger", "teaching_audit",
  "harvest_log", "gate_tune_ledger", "brain_outcomes", "bootroom_log", "gemini_quality",
  "salience_ledger",
];

// THE ONE EXCLUSION, and it is EXPLICIT AND REPORTED, never silent (measured on
// the first live run: 40 MB + 16 MB + 3.2 MB across three copies — more than half
// the entire capture tree). recall_index.jsonl is the semantic recall INDEX: his
// words, already archived verbatim in the afferent and episodes lanes, plus the
// embedding vectors for them.
// It fails the spec's own governing test (§1): "if we skip this today, can a 2035
// model recover it from what we DID store?" — yes, trivially, by re-embedding the
// text. And §9 rules embeddings out of scope by name, for the reason that decides
// it: changing the embedding model requires re-embedding the whole corpus, so
// vectors written today are thrown away later BY DESIGN. LAW 8: structure is
// disposable; if something can only exist in the projection it belongs in the raw
// — and every word in this file already is in the raw.
// This is a READER-side judgement made once, out loud, at the writer. If he ever
// rules the other way it is one line: delete the lane from this set.
const EXCLUDED_LANES = new Map([
  ["recall_index", "the semantic recall INDEX — his words are already archived verbatim in `afferent`/`episodes`, and the vectors are disposable by construction (spec §1 governing test + §9 + LAW 8). ~60 MB across 3 copies."],
]);
const baseLane = (lane) => (lane.includes("__") ? lane.slice(lane.indexOf("__") + 2) : lane);
const isExcluded = (lane) => EXCLUDED_LANES.get(baseLane(lane)) || null;
const JSONL_RE = /\.jsonl(\.\d+)?$/;
// A month roll (afferent.2026-07.jsonl) and a size rotation (brain_ledger.jsonl.1)
// are the SAME stream, non-overlapping, and collapse into one lane on purpose.
export const laneOf = (file) => basename(file).replace(JSONL_RE, "").replace(/\.\d{4}-\d{2}$/, "");

// THE VAULT TRAP, found on the first live `lanes` run (14 Aug 2026). Discovery
// found 81 files, and among them FIVE afferent.jsonl — the live one, its July
// roll, and three inside dressing-room/vault_*/ snapshot folders. Those vaults are
// point-in-time COPIES of the same lanes, so folding them into `afferent` would
// have archived thousands of rows twice and made every count of "his afferents"
// quietly wrong forever — the exact class of failure this archive exists to stop,
// committed by the archive itself on day one.
// The fix is NOT to skip them (LAW 3: the writer never rejects). A snapshot is
// its own stream, so it gets its own lane name and keeps its provenance:
// dressing-room/vault_preseason_2026-07-14/state/afferent.jsonl
//   → lane "vault_preseason_2026-07-14__afferent"
// state/ and hippocampus/ are the two canonical homes the spec names by hand
// (§6 lists data/afferent/ and data/episodes/), so they stay unprefixed; every
// other directory under dressing-room/ scopes its lanes, now and in the future.
const SCOPE_EXEMPT = new Set(["state", "hippocampus"]);
const safeLane = (s) => s.replace(/[^A-Za-z0-9._-]/g, "_");
export function laneFor(rel) {
  const parts = rel.split("/");                       // dressing-room/<scope>/…/file.jsonl
  const base = laneOf(parts[parts.length - 1]);
  const scope = parts.length >= 3 ? parts[1] : null;
  return safeLane(!scope || SCOPE_EXEMPT.has(scope) ? base : `${scope}__${base}`);
}

export function discoverSources(root = ROOT) {
  const out = [];
  const walk = (dir) => {
    let entries = [];
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const p = join(dir, e.name);
      if (e.isDirectory()) { walk(p); continue; }
      if (!e.isFile() || !JSONL_RE.test(e.name)) continue;
      const rel = relative(root, p).split(sep).join("/");
      out.push({ rel, abs: p, lane: laneFor(rel) });
    }
  };
  walk(join(root, CAPTURE_ROOT));
  out.sort((a, b) => a.rel.localeCompare(b.rel));
  return out;
}

// ── THE MOMENT (spec §5.3) — the state that overwrites itself ────────────────
// sprint.json, the forge session and readiness.json are OVERWRITTEN as the
// organism runs. The words survive; the STATE does not. Read defensively, never
// throw, a missing value is null, and a missing moment never blocks a write.
export function currentMoment(root = ROOT) {
  const rd = (p) => { try { return JSON.parse(readFileSync(join(root, p), "utf8")); } catch { return null; } };
  const m = { sprint_task: null, forge_step: null, forge_concept: null, readiness: null, focus_app: null, cwd: basename(resolve(root)) };
  const s = rd("dressing-room/state/sprint.json");
  const cur = s && s.progress && s.progress.current;
  if (cur) m.sprint_task = [cur.id, cur.task].filter(Boolean).join(" ") || null;
  const f = rd("dressing-room/state/forge_session.json");
  if (f && f.concept && !f.closed_at) { m.forge_step = Number.isFinite(f.step) ? f.step : null; m.forge_concept = f.concept; }
  const r = rd("dressing-room/state/readiness.json");
  if (r && r.verdict) m.readiness = { verdict: r.verdict, day: r.day || null };
  // focus_app stays NULL on purpose. No local file knows the CURRENT focus app —
  // timeaudit.json holds a DAY AGGREGATE ("claude.exe 270m"), and stamping a day
  // total onto a moment would be a lie of exactly the kind this archive exists to
  // prevent. A surface that really knows its focus app (an activitywatch row)
  // carries it in its own payload, and stampMoment() below prefers that.
  return m;
}

// A row that stamped its OWN moment at write time is authoritative — the hook
// does this since v3. Otherwise the archivist's live read is an APPROXIMATION at
// archive time (≤15 min late), which is honest for a fresh row and a fiction for
// an old one, so it is refused past MOMENT_STALE_MS and for every backfilled row.
function stampMoment(payload, tsUtc, now, live, moment) {
  if (payload && typeof payload === "object" && payload.moment && typeof payload.moment === "object") return payload.moment;
  if (!live) return null;
  if (tsUtc && now.getTime() - tsUtc.getTime() > MOMENT_STALE_MS) return null;
  return moment;
}

// ── THE RECORD (spec §5) ─────────────────────────────────────────────────────
// FIELD ORDER IS FIXED so a diff of two archives is readable by a human. Keys are
// inserted here in the spec's order and never re-sorted on write (canon() sorts
// only for the HASH, never for the bytes on disk).
const TS_KEYS = ["ts_utc", "ts", "at", "time", "timestamp", "created_at", "when", "date", "generated_at", "updated_at"];
export function pickTs(payload) {
  if (!payload || typeof payload !== "object") return null;
  for (const k of TS_KEYS) {
    const v = payload[k];
    if (v === undefined || v === null) continue;
    let d = null;
    if (typeof v === "number" && Number.isFinite(v)) d = new Date(v > 1e11 ? v : v * 1000);
    else if (typeof v === "string" && v.length >= 8) d = new Date(v);
    if (!d || Number.isNaN(d.getTime())) continue;
    const y = d.getUTCFullYear();
    if (y < 1990 || y > 2100) continue;              // a parse that lands in 1970 is a non-parse
    return d;
  }
  return null;
}

const TIERS = new Set(["public", "personal", "private", "sealed"]);

export function buildRecord({ lane, payload, now, backfilled, moment, seq, prevSha }) {
  const tsUtc = pickTs(payload);
  const clock = tsUtc ? istStamp(tsUtc) : null;
  const p = payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {};
  const declaredTier = typeof p.tier === "string" && TIERS.has(p.tier) ? p.tier : null;
  const rec = {
    // ── IDENTITY & INTEGRITY ──
    rid: ulid((tsUtc || now).getTime()),
    sha256: null,
    prev_sha256: prevSha ?? null,
    seq,
    v: SCHEMA_V,
    // ── TIME (§4) ──
    ts_utc: tsUtc ? tsUtc.toISOString() : null,
    ts_local: clock ? clock.local : null,
    tz: clock ? clock.tz : null,
    recorded_at: now.toISOString(),
    valid_from: null,
    valid_to: null,
    // ── PROVENANCE (LAW 4) ──
    lane,
    surface: typeof p.surface === "string" ? p.surface : "system",
    source: typeof p.source === "string" ? p.source : lane,
    modality: typeof p.modality === "string" ? p.modality : null,
    session_id: typeof p.session_id === "string" ? p.session_id : null,
    event_id: typeof p.event_id === "string" ? p.event_id : (typeof p.id === "string" ? p.id : null),
    // ── SENSITIVITY (LAW 7) ──
    tier: declaredTier || "private",
    // ── THE MOMENT'S STATE (§5.3) ──
    moment: moment ?? null,
    // ── THE PAYLOAD — EXACT BYTES, NEVER NORMALISED (§5.4) ──
    payload,
    // ── DERIVATION (LAW 2 / LAW 5) — reserved, null on every raw record ──
    derived_from: null,
    agent: null,
    // ── BACKFILL HONESTY (§8) ──
    backfilled: !!backfilled,
  };
  // The hash covers the canonical bytes of the record EXCLUDING sha256 and
  // prev_sha256 (§5.1). Excluding the chain link is deliberate: it makes sha256 a
  // STABLE CITATION ID that survives re-chaining, and the chain is verified by the
  // LINKS themselves (a broken link and a seq gap are both reported by `verify`).
  const { sha256: _s, prev_sha256: _p, ...body } = rec;
  rec.sha256 = sha256Hex(canon(body));
  return rec;
}

const payloadSha = (payload) => sha256Hex(canon(payload));

// ── THE TREE ─────────────────────────────────────────────────────────────────
// THE ONE PLACE THIS DEVIATES FROM THE SPEC'S WRITTEN TREE, and it is a
// correctness fix, not a preference. §6 draws the checkpoint as
// `data/_checkpoints.json`. But BagIt says a bag is COMPLETE only if every file
// under the payload directory appears in manifest-sha256.txt — and the checkpoint
// changes every 15 minutes. So the spec's layout forces a permanent choice
// between two broken bags: list it (and the manifest is wrong within 15 minutes
// of every seal, so the copy on the external disk fails validation) or omit it
// (and the bag is incomplete forever). Either way the validator cries wolf about
// the one file in data/ that is NOT the record.
// The archive's own LAW 8 settles it: the checkpoint and the lock are the
// WRITER'S disposable state — delete them and `laneHead()` re-derives everything
// from the records. Disposable state does not belong inside the sacred payload
// directory. They move to _writer/, which is a tag directory, covered by the
// TAGMANIFEST, where a file that legitimately changes belongs.
// Migration is automatic and one-way; the old path is read once if the new one
// is absent, so an archive created before this change loses nothing.
const P = (root) => ({
  root,
  data: join(root, "data"),
  health: join(root, "health"),
  schema: join(root, "SCHEMA"),
  lexicon: join(root, "LEXICON"),
  derived: join(root, "derived"),
  writer: join(root, "_writer"),
  checkpoints: join(root, "_writer", "checkpoints.json"),
  checkpointsLegacy: join(root, "data", "_checkpoints.json"),
  lock: join(root, "_writer", "lock.json"),
});
const dayFile = (root, lane, dayKey) => {
  const [y, m, d] = dayKey.split("-");
  return join(P(root).data, lane, y, m, `${d}.jsonl`);
};

const readJsonSafe = (p, fb = null) => { try { return JSON.parse(readFileSync(p, "utf8")); } catch { return fb; } };
function writeAtomic(p, text) {
  mkdirSync(dirname(p), { recursive: true });
  const tmp = p + ".tmp";
  const fd = openSync(tmp, "w");
  try { writeSync(fd, text); fsyncSync(fd); } finally { closeSync(fd); }
  renameSync(tmp, p);
}
function appendLines(p, lines) {
  if (!lines.length) return;
  mkdirSync(dirname(p), { recursive: true });
  const fd = openSync(p, "a");                       // O_APPEND — one write() per record
  try { for (const l of lines) writeSync(fd, l + "\n"); fsyncSync(fd); } finally { closeSync(fd); }
}
const appendHealth = (root, kind, row) => {
  const now = new Date();
  appendLines(join(P(root).health, `${kind}-${istStamp(now).day.slice(0, 7)}.jsonl`), [JSON.stringify(row)]);
};

// Every day file of a lane, oldest first (YYYY/MM/DD sorts lexically = chronologically).
function laneDayFiles(root, lane) {
  const base = join(P(root).data, lane);
  const out = [];
  const walk = (d) => {
    let es = [];
    try { es = readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of es.sort((a, b) => a.name.localeCompare(b.name))) {
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.isFile() && e.name.endsWith(".jsonl")) out.push(p);
    }
  };
  walk(base);
  return out;
}
const archivedLanes = (root) => {
  try { return readdirSync(P(root).data, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort(); }
  catch { return []; }
};
function* laneRecords(root, lane) {
  for (const f of laneDayFiles(root, lane)) {
    const lines = readFileSync(f, "utf8").split("\n");
    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i];
      if (!raw.trim()) continue;
      let rec = null;
      try { rec = JSON.parse(raw); } catch { yield { file: f, line: i + 1, raw, rec: null }; continue; }
      yield { file: f, line: i + 1, raw, rec };
    }
  }
}
// LAW 8 in code: the seq counter and the chain head are DERIVED from the records,
// never trusted from the checkpoint alone. Deleting _checkpoints.json costs a
// rescan and nothing else.
export function laneHead(root, lane) {
  let best = null;
  for (const { rec } of laneRecords(root, lane)) {
    if (!rec || !Number.isFinite(rec.seq)) continue;
    if (!best || rec.seq > best.seq) best = { seq: rec.seq, sha256: rec.sha256 };
  }
  return best || { seq: 0, sha256: null };
}

// ── THE LOCK, AND THE SCAR THAT PUT IT HERE ──────────────────────────────────
// Caught by the chain, four hours after the archive was created (14 Aug 2026):
//   ! seq-gap · brain_ledger · seq 6005 · -1 record(s) missing between 6005 and 6005
// TWO records with seq 6005, IDENTICAL payloads, recorded_at 119 ms apart. The
// scheduled ArsenalFC-Archivist (every 15 min) and a manual `run` overlapped:
// both read the same checkpoint, both computed head+1, both appended. One organ
// is a SINGLE WRITER by design; nothing stopped it being two PROCESSES.
// This is the whole argument for the chain in one incident — the damage was
// invisible in the data (a duplicate row and a bad counter look like ordinary
// records) and the chain named it, by lane, by seq, within seconds.
// openSync(…, "wx") is atomic on Windows and POSIX: whoever creates the file
// wins. A second run EXITS 0 and says so — a scheduled organ that reports failure
// because another copy of itself was already working teaches everyone to ignore
// its exit code. A lock older than STALE_LOCK_MS is a crashed run, not a live
// one; it is taken over and the takeover is journalled, never silent.
const LOCK_STALE_MS = 10 * 60 * 1000;
function takeLock(root, mode) {
  const p = P(root).lock;
  mkdirSync(dirname(p), { recursive: true });
  const mine = JSON.stringify({ pid: process.pid, mode, at: new Date().toISOString() });
  try {
    const fd = openSync(p, "wx");
    try { writeSync(fd, mine); fsyncSync(fd); } finally { closeSync(fd); }
    return { ok: true, release: () => { try { rmSync(p, { force: true }); } catch { /* nothing to do */ } } };
  } catch (e) {
    if (e && e.code !== "EEXIST") throw e;
    const held = readJsonSafe(p, {});
    const age = Date.now() - Date.parse(held.at || 0);
    if (!(age >= 0 && age < LOCK_STALE_MS)) {
      appendHealth(root, "quarantine", { kind: "stale-lock-taken", at: new Date().toISOString(), held_by: held, age_ms: age, note: "a previous archivist died holding the lock; taken over. Its inflight claim (if any) is deduped by the normal recovery path." });
      writeAtomic(p, mine);
      return { ok: true, release: () => { try { rmSync(p, { force: true }); } catch { /* nothing to do */ } } };
    }
    return { ok: false, held, release: () => {} };
  }
}

// ── CHECKPOINTS ──────────────────────────────────────────────────────────────
const emptyCkpt = () => ({ v: 1, updated_at: null, files: {}, lanes: {} });
function loadCkpt(root) {
  const p = P(root);
  if (existsSync(p.checkpoints)) return readJsonSafe(p.checkpoints, emptyCkpt());
  // one-way migration off the spec's data/_checkpoints.json (see P() above)
  if (existsSync(p.checkpointsLegacy)) {
    const c = readJsonSafe(p.checkpointsLegacy, emptyCkpt());
    mkdirSync(p.writer, { recursive: true });
    writeAtomic(p.checkpoints, JSON.stringify(c, null, 2) + "\n");
    rmSync(p.checkpointsLegacy, { force: true });
    appendHealth(root, "fixity", { kind: "checkpoint-moved", at: new Date().toISOString(), from: "data/_checkpoints.json", to: "_writer/checkpoints.json", why: "a file that changes every 15 minutes cannot live inside a BagIt payload directory — the bag would fail validation between seals. LAW 8: the checkpoint is disposable writer state, re-derivable from the records." });
  }
  return readJsonSafe(p.checkpoints, emptyCkpt());
}
const saveCkpt = (root, c) => { c.updated_at = new Date().toISOString(); writeAtomic(P(root).checkpoints, JSON.stringify(c, null, 2) + "\n"); };

// ── READING A SOURCE LANE ────────────────────────────────────────────────────
// Bytes after the LAST newline are an INCOMPLETE APPEND — a power cut mid-write.
// They are never parsed and never consumed (the offset stops at the last \n), so
// when the writer finishes the line it is archived normally: zero data loss. The
// partial is reported ONCE into health/quarantine-*.jsonl, deduped by its own
// hash, so a stuck writer does not print a quarantine row every 15 minutes.
function readNew(abs, offset) {
  const size = statSync(abs).size;
  let from = offset, rotated = false;
  if (size < from) { from = 0; rotated = true; }     // truncated or rotated under us
  if (size === from) return { lines: [], partial: null, endOffset: from, rotated, size };
  const want = Math.min(size - from, MAX_BATCH_BYTES);
  const buf = Buffer.alloc(want);
  const fd = openSync(abs, "r");
  try { readSync(fd, buf, 0, want, from); } finally { closeSync(fd); }
  const lastNl = buf.lastIndexOf(0x0a);
  const complete = lastNl >= 0 ? buf.subarray(0, lastNl + 1) : Buffer.alloc(0);
  const tail = lastNl >= 0 ? buf.subarray(lastNl + 1) : buf;
  const lines = [];
  let start = 0;
  for (let i = 0; i < complete.length; i++) {
    if (complete[i] !== 0x0a) continue;
    const end = i > start && complete[i - 1] === 0x0d ? i - 1 : i;   // tolerate CRLF
    lines.push({ raw: complete.subarray(start, end).toString("utf8"), at: from + start });
    start = i + 1;
  }
  return {
    lines, endOffset: from + complete.length, rotated, size,
    partial: tail.length ? { bytes: tail.length, at: from + complete.length, text: tail.toString("utf8") } : null,
  };
}

// ── RUN / BACKFILL ───────────────────────────────────────────────────────────
// CRASH SAFETY, two-phase. Before a single byte is appended, the checkpoint
// records an INFLIGHT marker naming the byte range and the exact day files the
// batch will touch. If the machine dies mid-append, the next run sees the marker
// and dedupes THAT BATCH ONLY against THOSE FILES — bounded work, exact result,
// and no need to hold a hash of the whole archive in memory. A clean run never
// pays for it: the marker is cleared in the same fsync'd write that advances the
// offset. Occurrence counting (not a plain Set) is what keeps two legitimately
// byte-identical rows both archived — LAW 3 forbids the writer to lose either.
function recoverySkipper(root, days, lane) {
  const have = new Map();
  for (const d of days) {
    const f = dayFile(root, lane, d);
    if (!existsSync(f)) continue;
    for (const line of readFileSync(f, "utf8").split("\n")) {
      if (!line.trim()) continue;
      let rec = null; try { rec = JSON.parse(line); } catch { continue; }
      const k = payloadSha(rec.payload);
      have.set(k, (have.get(k) || 0) + 1);
    }
  }
  return (payload) => {
    const k = payloadSha(payload);
    const n = have.get(k) || 0;
    if (n > 0) { have.set(k, n - 1); return true; }
    return false;
  };
}

function archiveOne(root, src, ckpt, opts) {
  const { force = false, live = true, moment = null, now = new Date(), log = () => {} } = opts;
  const cf = ckpt.files[src.rel] || { lane: src.lane, offset: 0, lines: 0, first_seen: now.toISOString(), inflight: null, partial_sha: null };
  if (force) { cf.offset = 0; cf.inflight = null; }
  const firstSight = !ckpt.files[src.rel];
  // ANYTHING ALREADY ON DISK WHEN THE ARCHIVIST FIRST SEES A FILE IS BACKFILL.
  // The alternative — calling ten months of history "live" because `run` happened
  // to be the mode that found it — is exactly the unmarked backfill §8 calls a lie
  // about provenance, and a 2035 analysis would silently trust it.
  const backfilled = force || firstSight ? true : !live;

  const r = readNew(src.abs, cf.offset);
  if (r.rotated) appendHealth(root, "quarantine", { kind: "source-rotated", at: now.toISOString(), path: src.rel, was_offset: cf.offset, size: r.size, note: "source shrank under the checkpoint — re-read from 0; dedupe protects the archive" });
  if (r.partial) {
    const psha = sha256Hex(r.partial.text);
    if (cf.partial_sha !== psha) {
      appendHealth(root, "quarantine", { kind: "partial-tail", at: now.toISOString(), path: src.rel, at_offset: r.partial.at, bytes: r.partial.bytes, bytes_sha256: psha, raw: r.partial.text, note: "incomplete append — NOT consumed; it is archived normally when the writer finishes the line" });
      cf.partial_sha = psha;
    }
  } else cf.partial_sha = null;

  // 1. parse the batch fully in memory and compute each row's IST day
  const staged = [];
  for (const l of r.lines) {
    if (!l.raw.trim()) continue;
    let payload;
    try { payload = JSON.parse(l.raw); }
    catch {
      // LAW 3: never dropped. The raw bytes are preserved in the quarantine lane.
      appendHealth(root, "quarantine", { kind: "unparseable-line", at: now.toISOString(), path: src.rel, at_offset: l.at, bytes_sha256: sha256Hex(l.raw), raw: l.raw });
      continue;
    }
    const ts = pickTs(payload);
    staged.push({ payload, day: istDayKey(ts || now) });
  }
  if (!staged.length) {
    cf.offset = r.endOffset;
    cf.inflight = null;
    ckpt.files[src.rel] = cf;
    return { lane: src.lane, added: 0, skipped: 0, quarantined: 0 };
  }

  // 2. crash recovery: dedupe this batch against the day files it claimed last time
  const recovering = !!(cf.inflight && Array.isArray(cf.inflight.days));
  let skip = () => false;
  if (recovering) skip = recoverySkipper(root, cf.inflight.days, src.lane);

  // 3. claim the range + the day files BEFORE writing anything
  const days = [...new Set(staged.map((s) => s.day))];
  cf.inflight = { from: cf.offset, to: r.endOffset, days, claimed_at: now.toISOString() };
  ckpt.files[src.rel] = cf;
  saveCkpt(root, ckpt);

  // 4. build + append, in source order, one open per day file.
  // THE COUNTER IS RE-DERIVED FROM THE RECORDS after a crash, never trusted from
  // the checkpoint: the crash is precisely the case where records reached disk and
  // ckpt.lanes did not, so a stale counter would mint DUPLICATE seq numbers and
  // break the chain at the exact moment the chain matters. LAW 8 in one line —
  // the checkpoint is a projection; the records are the truth.
  const head = recovering ? null : ckpt.lanes[src.lane];
  let cursor = head && Number.isFinite(head.seq) ? { seq: head.seq, sha256: head.sha256 } : laneHead(root, src.lane);
  const byFile = new Map();
  let added = 0, skipped = 0;
  for (const s of staged) {
    if (skip(s.payload)) { skipped++; continue; }
    const rec = buildRecord({
      lane: src.lane, payload: s.payload, now, backfilled,
      moment: stampMoment(s.payload, pickTs(s.payload), now, !backfilled, moment),
      seq: cursor.seq + 1, prevSha: cursor.sha256,
    });
    cursor = { seq: rec.seq, sha256: rec.sha256 };
    const f = dayFile(root, src.lane, s.day);
    if (!byFile.has(f)) byFile.set(f, []);
    byFile.get(f).push(JSON.stringify(rec));
    added++;
  }
  for (const [f, lines] of byFile) appendLines(f, lines);

  // 5. clear the claim and advance — the batch is on disk and fsync'd
  cf.offset = r.endOffset;
  cf.lines = (cf.lines || 0) + added;
  cf.last_run_at = now.toISOString();
  cf.inflight = null;
  ckpt.files[src.rel] = cf;
  ckpt.lanes[src.lane] = { seq: cursor.seq, sha256: cursor.sha256, updated_at: now.toISOString() };
  saveCkpt(root, ckpt);
  if (added || skipped) log(`  ${src.rel} → ${src.lane}: +${added}${skipped ? ` (${skipped} already archived)` : ""}`);
  return { lane: src.lane, added, skipped };
}

export function runArchive(opts = {}) {
  const root = opts.root || archiveRoot();
  const repo = opts.repo || ROOT;
  const live = opts.live !== false;
  const force = !!opts.force;
  const log = opts.quiet ? () => {} : console.log;
  if (!existsSync(P(root).data)) { log(`archivist: no archive at ${root} — run \`archivist.mjs init\` first`); return { ok: false, reason: "no-archive" }; }
  const lock = takeLock(root, force ? "backfill" : "run");
  if (!lock.ok) {
    log(`archivist: another archivist is already running (pid ${lock.held.pid}, since ${lock.held.at}) — standing down. The next tick picks up the tail.`);
    return { ok: true, added: 0, skipped: 0, lanes: [], stood_down: true };
  }
  try {
  const now = new Date();
  const ckpt = loadCkpt(root);
  const moment = currentMoment(repo);
  const sources = discoverSources(repo);
  let added = 0, skipped = 0;
  const lanes = new Set();
  log(`archivist ${force ? "backfill" : "run"} · ${sources.length} source file(s) · archive ${root}`);
  const excluded = new Set();
  for (const src of sources) {
    const why = isExcluded(src.lane);
    if (why) { excluded.add(src.lane); continue; }   // named below — never a silent skip
    try {
      const r = archiveOne(root, src, ckpt, { force, live, moment, now, log });
      added += r.added; skipped += r.skipped;
      if (r.added) lanes.add(r.lane);
    } catch (e) {
      appendHealth(root, "quarantine", { kind: "lane-error", at: now.toISOString(), path: src.rel, error: String(e && e.message || e) });
      log(`  ! ${src.rel}: ${e && e.message}`);
    }
  }
  saveCkpt(root, ckpt);
  log(`archivist: ${added} record(s) archived across ${lanes.size} lane(s)${skipped ? `, ${skipped} already present` : ""}`);
  // NO SILENT CAPS. A lane the writer declined to archive is named with its
  // reason on EVERY run — an exclusion nobody can see reads as "we archived
  // everything", which is the same lie as an unmarked backfill.
  // Grouped by base lane rather than one line per copy: this prints every 15
  // minutes forever, and four near-identical paragraphs per run would roll the
  // organ's log past its own 2 MB limit inside a week and bury real output.
  const byReason = new Map();
  for (const l of excluded) {
    const b = baseLane(l);
    if (!byReason.has(b)) byReason.set(b, []);
    byReason.get(b).push(l);
  }
  for (const [b, ls] of byReason) log(`  — NOT ARCHIVED · ${b} ×${ls.length}: ${EXCLUDED_LANES.get(b)}`);
  return { ok: true, added, skipped, lanes: [...lanes], excluded: [...excluded] };
  } finally { lock.release(); }
}

// ── REBUILD ONE LANE (the only sanctioned repair) ────────────────────────────
// A detector with no repair path leaves him with a permanent red, and a check
// that is always red is a check everyone learns to scroll past. So there is
// exactly ONE repair, and it is deliberately the blunt one: drop a lane's
// archived records and re-derive them from the sources they came from.
//
// IT REFUSES UNLESS EVERY SOURCE FILE IS STILL ON DISK. That guard is the whole
// safety argument: if the sources are present, nothing is lost by re-deriving
// (LAW 8 — structure is disposable, and seq/prev/rid are structure). The moment
// a source has rolled away, the archive is the only copy and this becomes a
// DELETE. Then the break stays, and it stays visible, which is correct.
//
// What a rebuild costs, stated because it is a real loss: every record gets a new
// rid and recorded_at, and the whole lane becomes backfilled:true — after a
// rebuild the lane IS a backfill and saying otherwise would be the §8 lie. The
// payloads, their timestamps and their provenance are byte-identical.
// Both the drop and the result are journalled to health/, so a rebuild can never
// be a silent rewrite of the permanent record.
export function rebuildLane(lane, opts = {}) {
  const root = opts.root || archiveRoot();
  const repo = opts.repo || ROOT;
  const log = opts.quiet ? () => {} : console.log;
  const lock = takeLock(root, "rebuild");
  if (!lock.ok) { log(`archivist rebuild: another archivist holds the lock (pid ${lock.held.pid}) — not touching the archive.`); return { ok: false, reason: "locked" }; }
  try {
    const sources = discoverSources(repo).filter((s) => s.lane === lane);
    if (!sources.length) { log(`archivist rebuild: no source file feeds lane '${lane}' — REFUSED. The archive would be the only copy, so dropping it is a DELETE, not a rebuild.`); return { ok: false, reason: "no-source" }; }
    const before = [...laneRecords(root, lane)].length;
    const now = new Date();
    appendHealth(root, "fixity", { kind: "rebuild-start", at: now.toISOString(), lane, dropping_records: before, from_sources: sources.map((s) => s.rel), why: opts.why || "unspecified — a rebuild without a reason is a rewrite" });
    rmSync(join(P(root).data, lane), { recursive: true, force: true });
    const ckpt = loadCkpt(root);
    for (const s of sources) delete ckpt.files[s.rel];
    delete ckpt.lanes[lane];
    saveCkpt(root, ckpt);
    let added = 0;
    for (const s of sources) added += archiveOne(root, s, ckpt, { force: true, live: false, moment: null, now, log: () => {} }).added;
    saveCkpt(root, ckpt);
    const v = verifyArchive({ root, lane, quiet: true });
    appendHealth(root, "fixity", { kind: "rebuild-done", at: new Date().toISOString(), lane, dropped: before, rebuilt: added, chain_ok: v.ok, breaks: v.breaks.length });
    log(`archivist rebuild · ${lane}: ${before} record(s) dropped, ${added} re-derived from ${sources.length} source file(s) — chain ${v.ok ? "INTACT" : `STILL BROKEN (${v.breaks.length})`}`);
    log(`  every record in this lane is now backfilled:true, with a new rid and recorded_at. Payloads, timestamps and provenance are byte-identical. Journalled to health/fixity-*.jsonl.`);
    return { ok: v.ok, dropped: before, rebuilt: added };
  } finally { lock.release(); }
}

// ── VERIFY (fixity + the chain) ──────────────────────────────────────────────
// Recompute every hash, walk every chain. THE ORDER IS seq, NOT file position: a
// batch can legitimately append to an earlier IST day than the record before it
// (a late-arriving row, a backfill), so a file-order walk would report breaks
// that are not there. seq is the total order — that is what it is for (§4.3).
export function verifyArchive(opts = {}) {
  const root = opts.root || archiveRoot();
  const month = opts.month || null;
  const log = opts.quiet ? () => {} : console.log;
  const lanes = opts.lane ? [opts.lane] : archivedLanes(root);
  const report = { at: new Date().toISOString(), month, lanes: [], records: 0, breaks: [] };
  for (const lane of lanes) {
    const rows = [];
    for (const r of laneRecords(root, lane)) {
      if (month && !r.file.split(sep).join("/").includes(`/${lane}/${month.replace("-", "/")}/`)) continue;
      if (!r.rec) { report.breaks.push({ lane, kind: "unparseable-record", file: r.file, line: r.line }); continue; }
      rows.push(r);
    }
    rows.sort((a, b) => (a.rec.seq ?? 0) - (b.rec.seq ?? 0));
    let prev = null;
    let hashBad = 0, linkBad = 0, seqBad = 0;
    for (const r of rows) {
      const rec = r.rec;
      const { sha256: stored, prev_sha256: link, ...body } = rec;
      const recomputed = sha256Hex(canon(body));
      if (recomputed !== stored) {
        hashBad++;
        report.breaks.push({ lane, kind: "hash-mismatch", rid: rec.rid, seq: rec.seq, file: r.file, line: r.line, stored, recomputed });
      }
      if (prev === null) {
        // a partial verify (--month) legitimately starts mid-chain; only a FULL
        // walk may assert that the first record is the genesis one.
        if (!month && (rec.seq !== 1 || link !== null)) {
          seqBad++;
          report.breaks.push({ lane, kind: "chain-start", rid: rec.rid, seq: rec.seq, file: r.file, line: r.line, note: `lane starts at seq ${rec.seq} with prev_sha256 ${link === null ? "null" : "set"} — expected seq 1 / null` });
        }
      } else {
        if (rec.seq !== prev.seq + 1) {
          seqBad++;
          report.breaks.push({ lane, kind: "seq-gap", rid: rec.rid, seq: rec.seq, after: prev.seq, file: r.file, line: r.line, note: `${rec.seq - prev.seq - 1} record(s) missing between seq ${prev.seq} and ${rec.seq}` });
        }
        if (link !== prev.sha256) {
          linkBad++;
          report.breaks.push({ lane, kind: "chain-break", rid: rec.rid, seq: rec.seq, file: r.file, line: r.line, expected_prev: prev.sha256, found_prev: link });
        }
      }
      prev = rec;
    }
    report.records += rows.length;
    report.lanes.push({ lane, records: rows.length, hash_mismatch: hashBad, chain_break: linkBad, seq_gap: seqBad, head_seq: prev ? prev.seq : 0 });
  }
  report.ok = report.breaks.length === 0;
  if (existsSync(P(root).root)) appendHealth(root, "fixity", report);
  log(`archivist verify${month ? ` (${month})` : ""}: ${report.records} record(s) across ${report.lanes.length} lane(s) — ${report.ok ? "ALL CHAINS INTACT" : `${report.breaks.length} BREAK(S)`}`);
  for (const b of report.breaks.slice(0, 20)) log(`  ! ${b.kind} · ${b.lane} · seq ${b.seq ?? "?"} · rid ${b.rid || "-"} · ${b.file ? relative(root, b.file) : ""}${b.note ? ` · ${b.note}` : ""}`);
  if (report.breaks.length > 20) log(`  … ${report.breaks.length - 20} more`);
  return report;
}

// ── VITALS (LAW 6) — pure arithmetic, zero LLM ───────────────────────────────
export function silenceVerdict(dayCounts, todayKey, opts = {}) {
  const activeNeeded = opts.activeDaysNeeded ?? 14;
  const redAfter = opts.silentDaysRed ?? 3;
  const days = [...dayCounts.entries()].filter(([, n]) => n > 0).map(([d]) => d).sort();
  const active = days.length;
  const last = days.length ? days[days.length - 1] : null;
  const silent = last ? Math.round((Date.parse(todayKey) - Date.parse(last)) / 86400000) : null;
  if (!last) return { state: "empty", active_days: 0, last_day: null, silent_days: null };
  if (active < activeNeeded) return { state: "young", active_days: active, last_day: last, silent_days: silent, note: `only ${active} day(s) of history — too young to call silence` };
  if (silent >= redAfter) return { state: "RED-silent", active_days: active, last_day: last, silent_days: silent, note: `${active} day(s) of rows, then ${silent} day(s) of nothing` };
  return { state: "ok", active_days: active, last_day: last, silent_days: silent };
}

const FILL_FIELDS = ["ts_utc", "ts_local", "session_id", "event_id", "modality", "moment", "surface"];

export function vitalsArchive(opts = {}) {
  const root = opts.root || archiveRoot();
  const log = opts.quiet ? () => {} : console.log;
  const now = opts.now || new Date();
  const todayKey = istStamp(now).day;
  const windowStart = istStamp(new Date(now.getTime() - VITALS_WINDOW_DAYS * 86400000)).day;
  const out = { at: now.toISOString(), day: todayKey, window_days: VITALS_WINDOW_DAYS, lanes: [], reds: [] };
  for (const lane of archivedLanes(root)) {
    const counts = new Map();
    const fill = Object.fromEntries(FILL_FIELDS.map((f) => [f, 0]));
    let total = 0, inWindow = 0, backfilled = 0;
    const tiers = {};
    for (const f of laneDayFiles(root, lane)) {
      const parts = relative(P(root).data, f).split(sep);        // lane/YYYY/MM/DD.jsonl
      const day = `${parts[1]}-${parts[2]}-${parts[3].replace(".jsonl", "")}`;
      const lines = readFileSync(f, "utf8").split("\n").filter((l) => l.trim());
      total += lines.length;
      counts.set(day, (counts.get(day) || 0) + lines.length);
      if (day < windowStart) continue;
      inWindow += lines.length;
      for (const l of lines) {
        let rec = null; try { rec = JSON.parse(l); } catch { continue; }
        for (const k of FILL_FIELDS) if (rec[k] !== null && rec[k] !== undefined) fill[k]++;
        if (rec.backfilled) backfilled++;
        tiers[rec.tier || "?"] = (tiers[rec.tier || "?"] || 0) + 1;
      }
    }
    const pct = (n) => (inWindow ? Math.round((n / inWindow) * 1000) / 10 : null);
    const sil = silenceVerdict(counts, todayKey);
    const row = {
      lane, records: total, in_window: inWindow, days_with_rows: [...counts.keys()].length,
      backfilled_in_window: backfilled, tiers,
      fill_pct: Object.fromEntries(FILL_FIELDS.map((f) => [f, pct(fill[f])])),
      silence: sil,
    };
    out.lanes.push(row);
    if (sil.state === "RED-silent") out.reds.push(`${lane}: ${sil.note}`);
  }
  out.ok = out.reds.length === 0;
  appendHealth(root, "vitals", out);
  log(`archivist vitals · ${out.lanes.length} lane(s) · ${out.lanes.reduce((a, l) => a + l.records, 0)} record(s) total`);
  for (const l of out.lanes) {
    log(`  ${l.silence.state === "RED-silent" ? "RED " : "ok  "} ${l.lane.padEnd(20)} ${String(l.records).padStart(7)} rec · ${String(l.days_with_rows).padStart(3)} day(s) · last ${l.silence.last_day || "-"} · ts_local ${l.fill_pct.ts_local ?? "-"}% · session_id ${l.fill_pct.session_id ?? "-"}%`);
  }
  if (out.reds.length) { log("\n  SILENT LANES (LAW 6 — a lane that stopped and nobody noticed):"); for (const r of out.reds) log(`   · ${r}`); }
  return out;
}

// ── SEAL (BagIt) ─────────────────────────────────────────────────────────────
// A BagIt bag is the archival standard for "a folder that copies to any machine
// and can prove it arrived intact". manifest-sha256.txt covers data/ (the
// payload); tagmanifest-sha256.txt covers everything else, so the SCHEMA and the
// LEXICON — the interpretation key, §10 — are as fixity-protected as the records.
function walkFiles(dir, base = dir, out = []) {
  let es = [];
  try { es = readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of es.sort((a, b) => a.name.localeCompare(b.name))) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walkFiles(p, base, out);
    else if (e.isFile()) out.push(p);
  }
  return out;
}
const fileSha = (p) => createHash("sha256").update(readFileSync(p)).digest("hex");
const bagPath = (root, p) => relative(root, p).split(sep).join("/");

export function sealArchive(opts = {}) {
  const root = opts.root || archiveRoot();
  const log = opts.quiet ? () => {} : console.log;
  // SEAL TAKES THE LOCK; verify and vitals deliberately do NOT. A manifest hashed
  // while a run is appending is a manifest that is wrong the moment it is written
  // — the one failure a bag validator would then report forever. verify/vitals
  // only read, and reading a prefix of an append-only file is always consistent,
  // so a fixity check must never be blocked by a run that happens to overlap it.
  const lock = takeLock(root, "seal");
  if (!lock.ok) { log(`archivist seal: an archivist is mid-run (pid ${lock.held.pid}) — not sealing a moving tree. The weekly seal will catch it.`); return { sealed: false }; }
  try {
  const payload = walkFiles(P(root).data).filter((f) => !f.endsWith(".tmp"));
  const oxum = payload.reduce((a, f) => ({ bytes: a.bytes + statSync(f).size, n: a.n + 1 }), { bytes: 0, n: 0 });
  writeFileSync(join(root, "manifest-sha256.txt"), payload.map((f) => `${fileSha(f)}  ${bagPath(root, f)}`).join("\n") + (payload.length ? "\n" : ""), "utf8");

  // bag-info.txt is regenerated on every seal so Payload-Oxum and Bag-Size are
  // TRUE at seal time. Bagging-Date is the date of THIS seal — BagIt's own
  // definition — and the archive's own birth date lives in External-Description.
  writeFileSync(join(root, "bag-info.txt"), bagInfo(root, oxum), "utf8");

  const tagFiles = [
    join(root, "bagit.txt"), join(root, "bag-info.txt"), join(root, "manifest-sha256.txt"), join(root, "README.md"),
    ...walkFiles(P(root).schema), ...walkFiles(P(root).lexicon), ...walkFiles(P(root).health), ...walkFiles(P(root).derived), ...walkFiles(P(root).writer),
  ].filter((f) => existsSync(f) && !f.endsWith(".tmp"));
  writeFileSync(join(root, "tagmanifest-sha256.txt"), tagFiles.map((f) => `${fileSha(f)}  ${bagPath(root, f)}`).join("\n") + "\n", "utf8");

  log(`archivist seal: ${payload.length} payload file(s), ${(oxum.bytes / 1024).toFixed(1)} KB · ${tagFiles.length} tag file(s) — the bag is valid and ready to copy`);
  log(`  3-2-1 (spec §12): this is copy 1. One disk is one copy — that is not a backup, it is a second point of failure.`);
  return { payload: payload.length, bytes: oxum.bytes, tags: tagFiles.length, sealed: true };
  } finally { lock.release(); }
}

// ── INIT ─────────────────────────────────────────────────────────────────────
// THE REPO GUARD (spec §7.5): the archive may never live inside a git work tree.
// One accidental `git add -A` on a PUBLIC repo is irreversible — forks, clones
// and GitHub's dangling-commit cache mean a later delete is not an erase.
export function repoGuard(dir) {
  let d = resolve(dir);
  for (;;) {
    if (existsSync(join(d, ".git"))) return { ok: false, why: `${d} is a git work tree (.git found there)` };
    const up = dirname(d);
    if (up === d) return { ok: true };
    d = up;
  }
}

export function initArchive(opts = {}) {
  const root = opts.root || archiveRoot();
  const log = opts.quiet ? () => {} : console.log;
  const guard = repoGuard(root);
  if (!guard.ok) {
    log(`archivist init REFUSED: ${guard.why}`);
    log("  The archive must be application-independent and OUTSIDE the repo (spec §6/§7.5).");
    log("  Set $ARSENAL_ARCHIVE to a path with no .git above it, e.g. %USERPROFILE%\\CyborgArchive");
    return { ok: false, reason: "inside-git", why: guard.why };
  }
  const p = P(root);
  for (const d of [root, p.data, p.health, p.schema, p.lexicon, p.derived, p.writer]) mkdirSync(d, { recursive: true });

  // BagIt declaration — two lines, fixed by the standard.
  writeFileSync(join(root, "bagit.txt"), "BagIt-Version: 1.0\nTag-File-Character-Encoding: UTF-8\n", "utf8");
  if (!existsSync(join(root, "bag-info.txt"))) writeFileSync(join(root, "bag-info.txt"), bagInfo(root, { bytes: 0, n: 0 }), "utf8");
  writeFileSync(join(root, "README.md"), README_MD(), "utf8");
  writeFileSync(join(p.derived, "README.md"), DERIVED_MD(), "utf8");

  // THE SCHEMA IS WRITTEN ONCE AND NEVER MIGRATED (spec §6). If v1.json exists
  // and differs from what this code would write, that is a SHAPE CHANGE and it
  // needs a v2 — so it is reported loudly and the file is left exactly as it is.
  const schemaPath = join(p.schema, `v${SCHEMA_V}.json`);
  const schemaText = JSON.stringify(RECORD_SCHEMA, null, 2) + "\n";
  if (!existsSync(schemaPath)) writeFileSync(schemaPath, schemaText, "utf8");
  else if (readFileSync(schemaPath, "utf8") !== schemaText) log(`  ! SCHEMA/v${SCHEMA_V}.json on disk DIFFERS from this build. Records are never migrated — add v${SCHEMA_V + 1}.json and let readers handle both. Left untouched.`);
  if (!existsSync(join(p.schema, "CHANGELOG.md"))) writeFileSync(join(p.schema, "CHANGELOG.md"), SCHEMA_CHANGELOG(), "utf8");

  // THE LEXICON is seeded once and then only ever APPENDED to. LAW 2 applied to
  // language: never edit a term in place — retire it and add the new one.
  const terms = join(p.lexicon, "terms.jsonl");
  let seeded = 0;
  if (!existsSync(terms)) { appendLines(terms, LEXICON_SEED.map((t) => JSON.stringify(t))); seeded = LEXICON_SEED.length; }
  if (!existsSync(join(p.lexicon, "CHANGELOG.md"))) writeFileSync(join(p.lexicon, "CHANGELOG.md"), LEXICON_CHANGELOG(), "utf8");
  // THROUGH loadCkpt, NEVER a bare write — and this line cost a doubled archive.
  // It read `if (!existsSync(p.checkpoints)) saveCkpt(root, emptyCkpt())`, so on
  // the first init after the checkpoint moved to _writer/, init wrote an EMPTY
  // checkpoint at the new path; loadCkpt then found that file present, skipped the
  // migration entirely, and the next `run` re-archived all 33,249 records as
  // backfill. Every chain still verified — they were appended in seq order — which
  // is the point worth keeping: A VALID CHAIN IS NOT A CORRECT ARCHIVE. Only the
  // COUNT gave it away, which is exactly what LAW 6's vital signs are for.
  // loadCkpt owns the migration, so init must ask it rather than guess.
  const ck = loadCkpt(root);
  if (!existsSync(p.checkpoints)) saveCkpt(root, ck);

  log(`archivist init: ${root}`);
  log(`  bagit.txt · bag-info.txt · README.md · SCHEMA/v${SCHEMA_V}.json · LEXICON/terms.jsonl${seeded ? ` (${seeded} terms seeded)` : " (kept)"} · data/ · health/ · derived/`);
  log(`  day partition: IST (${ZONE}) — stated in bag-info.txt, README.md and the schema, because a reader who assumes UTC is wrong about every late night.`);
  return { ok: true, root, seeded };
}

// ── LANES / STATUS ───────────────────────────────────────────────────────────
function lanesReport(opts = {}) {
  const root = opts.root || archiveRoot();
  const repo = opts.repo || ROOT;
  const sources = discoverSources(repo);
  const ckpt = loadCkpt(root);
  const byLane = new Map();
  for (const s of sources) {
    if (!byLane.has(s.lane)) byLane.set(s.lane, []);
    byLane.get(s.lane).push(s);
  }
  console.log(`archivist lanes · ${sources.length} source file(s) → ${byLane.size} lane(s) · archive ${root}`);
  for (const [lane, files] of [...byLane].sort()) {
    const why = isExcluded(lane);
    if (why) { console.log(`  ✗ ${lane.padEnd(34)} NOT ARCHIVED — ${why}`); continue; }
    const arch = existsSync(join(P(root).data, lane));
    const head = arch ? (ckpt.lanes[lane] || laneHead(root, lane)) : { seq: 0 };
    console.log(`  ${arch ? "●" : "○"} ${lane.padEnd(34)} seq ${String(head.seq || 0).padStart(7)} · ${files.length} file(s): ${files.map((f) => f.rel.replace("dressing-room/", "")).join(", ")}`);
  }

  // SEEN AND NOT A LANE. dressing-room/archive/incidents-*/ holds pre-cleanup
  // .bak copies (e.g. afferent.jsonl.pre-decontam.bak) — a decontamination
  // REMOVED rows, so those files hold rows the live lane no longer has. They are
  // not *.jsonl and are therefore not discovered; that is scope discipline, not a
  // judgement that they are worthless. Named here so the decision is visible and
  // his to make, rather than a silence nobody ever notices.
  const baks = [];
  const walkBak = (d) => { let es = []; try { es = readdirSync(d, { withFileTypes: true }); } catch { return; } for (const e of es) { const p = join(d, e.name); if (e.isDirectory()) walkBak(p); else if (/\.jsonl[^/\\]*\.bak$/.test(e.name)) baks.push({ p, size: statSync(p).size }); } };
  walkBak(join(repo, CAPTURE_ROOT));
  if (baks.length) {
    console.log(`\n  SEEN, NOT ARCHIVED (not *.jsonl, so not a lane — say the word and they become one):`);
    for (const b of baks) console.log(`   · ${relative(repo, b.p).split(sep).join("/")} (${(b.size / 1024 / 1024).toFixed(1)} MB)`);
  }
  // A COLLISION is two DIFFERENT directories feeding one lane. Same-directory
  // multiples are the intended collapse (a month roll and a .1 rotation are one
  // stream); two directories are two streams sharing a name, and merging them
  // would silently interleave unrelated history. state/ and hippocampus/ share no
  // basename today — this exists so the day they do, it is said out loud.
  const collisions = [];
  for (const [lane, files] of byLane) {
    const dirs = new Set(files.map((f) => dirname(f.rel)));
    if (dirs.size > 1) collisions.push(`${lane} ← ${[...dirs].join(" + ")}`);
  }
  if (collisions.length) {
    console.log(`\n  ! LANE COLLISION — two directories feeding one lane (their history would interleave):`);
    for (const c of collisions) console.log(`   · ${c}`);
  }

  const missing = MUST_COVER.filter((l) => !byLane.has(l));
  if (missing.length) {
    console.log(`\n  NAMED BY THE SPEC, NOT PRESENT ON THIS MACHINE (absence is not a zero — they are archived the day they appear):`);
    for (const m of missing) console.log(`   · ${m}.jsonl`);
  }
  return { lanes: byLane.size, sources: sources.length, missing };
}

function status(opts = {}) {
  const root = opts.root || archiveRoot();
  if (!existsSync(root)) { console.log(`archivist: NO ARCHIVE at ${root} — run \`node scripts/archivist.mjs init\``); return; }
  const ckpt = loadCkpt(root);
  const lanes = archivedLanes(root);
  let recs = 0;
  for (const l of lanes) recs += (ckpt.lanes[l] && ckpt.lanes[l].seq) || laneHead(root, l).seq;
  const inflight = Object.entries(ckpt.files).filter(([, f]) => f.inflight);
  console.log(`THE ARCHIVE · ${root}`);
  console.log(`  ${recs} record(s) · ${lanes.length} lane(s) · checkpoint updated ${ckpt.updated_at || "never"}`);
  console.log(`  sealed: ${existsSync(join(root, "manifest-sha256.txt")) ? "yes (manifest-sha256.txt present)" : "NO — run `seal` before copying to the disk"}`);
  if (inflight.length) console.log(`  ! ${inflight.length} INFLIGHT claim(s) — the last run did not finish; the next run dedupes them: ${inflight.map(([k]) => k).join(", ")}`);
  const q = existsSync(P(root).health) ? readdirSync(P(root).health).filter((f) => f.startsWith("quarantine-")) : [];
  if (q.length) console.log(`  quarantine files: ${q.join(", ")} (raw bytes preserved — LAW 3, nothing is ever dropped)`);
}

// ── THE COMMIT TRIPWIRE (spec §7.5) ──────────────────────────────────────────
// The repo is PUBLIC and one accidental push is irreversible — forks, clones and
// GitHub's dangling-commit cache mean a later delete is not an erase.
//
// THE SPEC ASKS FOR "any staged file under an archive path or matching *.jsonl
// from the capture tree". Taken literally the second half BREAKS THIS REPO: six
// capture-tree lanes are tracked on purpose (afferent.2026-07, audit_ledger,
// bootroom_log, gate_tune_ledger, recital_audit, reps_log — `git ls-files
// "dressing-room/**/*.jsonl"`), so a blanket refusal would red every ordinary
// commit and the hook would be uninstalled within a day. A tripwire people
// disable protects nothing.
// What the clause is FOR is stopping a lane being published for the FIRST time by
// accident, so that is the rule: an already-tracked lane keeps working, and a
// capture-tree .jsonl that git has never seen before cannot be added without a
// deliberate override. Plus an absolute refusal on anything that looks like the
// archive itself.
// OVERRIDE, deliberately awkward and deliberately documented:
//   ARSENAL_ALLOW_NEW_LANE=1 git commit …
export function tripwire(opts = {}) {
  const repo = opts.repo || ROOT;
  const log = opts.quiet ? () => {} : console.log;
  const staged = opts.staged || (() => {
    const r = spawnSync("git", ["diff", "--cached", "--name-only"], { cwd: repo, encoding: "utf8" });
    return String(r.stdout || "").split("\n").map((s) => s.trim()).filter(Boolean);
  })();
  // HEAD, NOT `git ls-files` — AND THIS IS A SCAR, caught by live-firing the
  // tripwire the minute after it was installed (14 Aug 2026). `git ls-files`
  // reads the INDEX, and `git add -f dressing-room/state/afferent.jsonl` puts the
  // file IN the index, so by the time the pre-commit hook asks "has git ever
  // tracked this?" the answer had already become yes — BECAUSE OF THE VERY ACT
  // BEING CHECKED. The whole bus (1,506 rows of his words) went into a real
  // commit while the tripwire printed "nothing that may not be published".
  // Undone locally, nothing pushed. `git ls-tree HEAD` asks what was tracked
  // BEFORE this commit, which is the question.
  // The unit tests passed throughout: they INJECTED `tracked`, so they never
  // exercised the derivation that was wrong. A test that mocks the thing that
  // breaks is a test of the mock — hence the live-fire case in the selftest,
  // which builds a real repo and runs the real hook.
  // A repo with no commits at all fails ls-tree; the empty set is the safe
  // direction (everything reads as new, everything is refused).
  const tracked = opts.tracked || (() => {
    const r = spawnSync("git", ["ls-tree", "-r", "--name-only", "HEAD"], { cwd: repo, encoding: "utf8" });
    return new Set(String(r.stdout || "").split("\n").map((s) => s.trim()).filter(Boolean));
  })();
  const BAG_FILES = new Set(["bagit.txt", "bag-info.txt", "manifest-sha256.txt", "tagmanifest-sha256.txt"]);
  const blocks = [];
  for (const f of staged) {
    const parts = f.split("/");
    if (BAG_FILES.has(parts[parts.length - 1])) {
      blocks.push([f, "this is a BagIt bag file — THE ARCHIVE IS BEING COMMITTED. It lives outside the repo for exactly this reason (spec §6)."]);
      continue;
    }
    // an ancestor holding bagit.txt means the file sits inside a bag
    for (let i = parts.length - 1; i > 0; i--) {
      if (existsSync(join(repo, ...parts.slice(0, i), "bagit.txt"))) { blocks.push([f, `sits inside a BagIt bag (${parts.slice(0, i).join("/")}/bagit.txt) — that is the permanent archive and it may never enter a public repo.`]); break; }
    }
    if (/^dressing-room\/.*\.jsonl(\.\d+)?$/.test(f) && !tracked.has(f)) {
      blocks.push([f, "a NEW capture lane. His words, his moments, his body — never published by accident. If this one really is public data: ARSENAL_ALLOW_NEW_LANE=1 git commit …"]);
    }
    if (/oura_(secrets|tokens)\.json$/.test(f)) blocks.push([f, "LIVE CREDENTIALS. Never, under any override."]);
  }
  const hardOnly = blocks.filter(([, why]) => /CREDENTIALS|BagIt bag/.test(why));
  const allowed = process.env.ARSENAL_ALLOW_NEW_LANE === "1";
  const fatal = allowed ? hardOnly : blocks;
  if (!fatal.length) { log(`tripwire: ${staged.length} staged path(s), nothing that may not be published.`); return { ok: true, blocks: [] }; }
  log("\n  ✗ COMMIT REFUSED — the repo is PUBLIC and a push cannot be taken back:\n");
  for (const [f, why] of fatal) log(`    ${f}\n      ${why}\n`);
  log("  Unstage them (git restore --staged <path>) and commit again.\n");
  return { ok: false, blocks: fatal };
}

// ── A MINIMAL JSON-SCHEMA VALIDATOR ──────────────────────────────────────────
// No dependency, on purpose: a 2046 reader gets a schema they can check with
// anything, and this repo gets a test (§11.12) that does not rot when a package
// does. Supports the subset v1.json uses: type · enum · const · required ·
// properties · additionalProperties · items · minimum · minLength · pattern.
export function validate(schema, value, path = "$", errs = []) {
  const typeOf = (v) => v === null ? "null" : Array.isArray(v) ? "array" : typeof v === "number" ? (Number.isInteger(v) ? "integer" : "number") : typeof v;
  if (schema.type) {
    const want = Array.isArray(schema.type) ? schema.type : [schema.type];
    const got = typeOf(value);
    const ok = want.includes(got) || (got === "integer" && want.includes("number"));
    if (!ok) { errs.push(`${path}: expected ${want.join("|")}, got ${got}`); return errs; }
  }
  if (schema.enum && !schema.enum.some((e) => e === value)) errs.push(`${path}: ${JSON.stringify(value)} not in enum [${schema.enum.join(", ")}]`);
  if ("const" in schema && value !== schema.const) errs.push(`${path}: expected const ${JSON.stringify(schema.const)}`);
  if (typeof value === "string") {
    if (schema.minLength !== undefined && value.length < schema.minLength) errs.push(`${path}: shorter than ${schema.minLength}`);
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) errs.push(`${path}: does not match /${schema.pattern}/`);
  }
  if (typeof value === "number" && schema.minimum !== undefined && value < schema.minimum) errs.push(`${path}: below minimum ${schema.minimum}`);
  if (Array.isArray(value) && schema.items) for (let i = 0; i < value.length; i++) validate(schema.items, value[i], `${path}[${i}]`, errs);
  if (value && typeof value === "object" && !Array.isArray(value)) {
    for (const r of schema.required || []) if (!(r in value)) errs.push(`${path}: missing required field "${r}"`);
    for (const [k, sub] of Object.entries(schema.properties || {})) if (k in value) validate(sub, value[k], `${path}.${k}`, errs);
    if (schema.additionalProperties === false) {
      for (const k of Object.keys(value)) if (!(schema.properties || {})[k]) errs.push(`${path}: unexpected field "${k}" (additionalProperties:false)`);
    }
  }
  return errs;
}

// ── THE SCHEMA ───────────────────────────────────────────────────────────────
const NULLABLE_STR = { type: ["string", "null"] };
const RECORD_SCHEMA = {
  $schema: "http://json-schema.org/draft-07/schema#",
  $id: "https://arsenal-ai-fc.invalid/archive/SCHEMA/v1.json",
  title: "Arsenal Archive Record v1",
  description:
    "One line of JSON in a .jsonl file under data/<lane>/<YYYY>/<MM>/<DD>.jsonl. " +
    "THE DAY IN THAT PATH IS THE IST (Asia/Kolkata) DAY, NEVER THE UTC DAY — the subject " +
    "routinely works until 2-3 AM IST and a UTC partition would split one working night " +
    "across two files. Field order on disk is fixed (the order below) so a human diff of " +
    "two archives is readable. sha256 covers the canonical (JCS-style: keys sorted, no " +
    "insignificant whitespace, UTF-8) serialisation of this record EXCLUDING sha256 and " +
    "prev_sha256. prev_sha256 is the sha256 of the previous record IN THIS LANE, ordered " +
    "by seq; the first record of a lane has null. Nulls are honest: a null ts_utc means " +
    "the source row carried no parseable timestamp and recorded_at is the only clock.",
  type: "object",
  additionalProperties: false,
  required: ["rid", "sha256", "prev_sha256", "seq", "v", "ts_utc", "ts_local", "tz", "recorded_at",
    "valid_from", "valid_to", "lane", "surface", "source", "modality", "session_id", "event_id",
    "tier", "moment", "payload", "derived_from", "agent", "backfilled"],
  properties: {
    rid: { type: "string", minLength: 26, description: "ULID — sortable, distributed-safe record id" },
    sha256: { type: "string", pattern: "^[0-9a-f]{64}$" },
    prev_sha256: { type: ["string", "null"], pattern: "^[0-9a-f]{64}$" },
    seq: { type: "integer", minimum: 1, description: "monotonic per lane, assigned by the archivist. Timestamps collide; this is the only total order that survives multiple surfaces." },
    v: { type: "integer", const: 1, description: "SCHEMA VERSION of this record. Records are NEVER migrated — a new shape is a new version and readers handle all versions." },
    ts_utc: { ...NULLABLE_STR, description: "the instant, ISO-8601 UTC. null when the source row carried no parseable timestamp." },
    ts_local: { ...NULLABLE_STR, description: "the WALL CLOCK with offset. Never store only UTC: 'he wrote this at 3am' is different information from the UTC instant." },
    tz: { ...NULLABLE_STR, description: "the zone NAME (offsets change when he travels; the name preserves intent)" },
    recorded_at: { type: "string", description: "when the ARCHIVE learned it" },
    valid_from: { ...NULLABLE_STR, description: "RESERVED (spec §4.5). Unused on raw records; REQUIRED on derived FACT records." },
    valid_to: { ...NULLABLE_STR, description: "RESERVED (spec §4.5)" },
    lane: { type: "string", description: "which stream (the source .jsonl's name, month-rolls collapsed)" },
    surface: { type: "string", description: "which BODY: claude-code | gaffer-voice | activitywatch | phone-note | glasses | tv | system" },
    source: { type: "string", description: "sub-source within the surface" },
    modality: { ...NULLABLE_STR, description: "code | voice | context | pulse | bus | gemini | vision" },
    session_id: { ...NULLABLE_STR, description: "THE THREAD — which conversation this turn belongs to" },
    event_id: { ...NULLABLE_STR, description: "the producing surface's own id, if present" },
    tier: { type: "string", enum: ["public", "personal", "private", "sealed"], description: "DEFAULT private. Only ever RELAXED by an explicit act — never tightened retroactively, because you cannot un-see." },
    moment: {
      type: ["object", "null"],
      description: "the state that overwrites itself, stamped at write time. null on backfilled records and on rows older than 6h at archive time — a reconstructed moment would be a lie.",
      properties: {
        sprint_task: { type: ["string", "null"] },
        forge_step: { type: ["integer", "null"] },
        forge_concept: { type: ["string", "null"] },
        readiness: { type: ["object", "string", "null"] },
        focus_app: { type: ["string", "null"] },
        cwd: { type: ["string", "null"] },
      },
    },
    payload: { description: "THE ORIGINAL ROW, VERBATIM. Never Unicode-normalised, trimmed, lowercased or 'fixed' — every one of those is irreversible. Normalisation is a READ-time operation." },
    derived_from: { type: ["array", "null"], items: { type: "string" }, description: "source rid(s) — only on derived records (LAW 2 / LAW 5)" },
    agent: { type: ["object", "null"], description: "{ model, model_version, prompt_sha256, effort, at } — only on derived records" },
    backfilled: { type: "boolean", description: "true = imported from history; seq and the prev chain are ARCHIVE order, NOT original write order. Never lie about this." },
  },
};

// ── THE DOCUMENTS THE BAG CARRIES ────────────────────────────────────────────
function bagInfo(root, oxum) {
  const now = new Date();
  return [
    "Source-Organization: Arsenal AI FC (personal)",
    "Contact-Name: Nikhil Panwar",
    "External-Identifier: arsenal-ai-fc/cyborg-archive",
    "External-Description: The permanent, self-describing record of one person's words, work and physiology. Raw and append-only. Every derived thing is a NEW record that points at the raw; nothing here is ever edited, summarised in place, reordered or deleted.",
    "Bagging-Date: " + istStamp(now).day,
    "Bag-Software-Agent: arsenal-ai-fc/scripts/archivist.mjs (Node " + process.version + ")",
    "Payload-Oxum: " + oxum.bytes + "." + oxum.n,
    "Bag-Size: " + (oxum.bytes / 1024 / 1024).toFixed(2) + " MB",
    // §4.4 — the manifest MUST state this, or a future reader assumes UTC and is
    // wrong about every late-night session in the archive.
    "Arsenal-Day-Partition: Asia/Kolkata (IST). data/<lane>/<YYYY>/<MM>/<DD>.jsonl is the LOCAL day, not the UTC day.",
    "Arsenal-Record-Schema: SCHEMA/v1.json",
    "Arsenal-Interpretation-Key: LEXICON/terms.jsonl",
    "",
  ].join("\n");
}

function README_MD() {
  return `# THE ARCHIVE — the permanent record of Nikhil Panwar

*Written for a human (or a model) opening this folder years from now, possibly with no
access to the software that made it. You need nothing but this file to read what is here.*

## What this is

Every line in \`data/\` is one thing that happened: something he typed, said, was taught,
or something his body or his machine reported. It is **raw and append-only**. Nothing in
here has ever been edited, summarised in place, reordered or deleted, and nothing ever
should be.

## How to read it in one minute

Files are **JSON Lines** (\`.jsonl\`): one JSON object per line, UTF-8, newline-separated.

    data/<lane>/<YYYY>/<MM>/<DD>.jsonl

- **lane** = which stream it came from (\`afferent\` = his typed and spoken turns;
  \`episodes\` = his durable memory; \`reps_log\` = study repetitions; and so on).
- **The date in the path is the INDIAN day (Asia/Kolkata, UTC+05:30), not the UTC day.**
  This matters: he routinely worked until 2-3 AM local time, and partitioning on UTC
  would split a single working night across two files and destroy the shape of his day.

Every record carries its own shape (\`v\`) and its own provenance. The machine-readable
schema, field by field, is \`SCHEMA/v1.json\`. Records are **never migrated**: if the shape
ever changed, a new version was added and both live side by side forever.

## The three clocks, and why there are three

- \`ts_utc\` — the instant.
- \`ts_local\` + \`tz\` — the **wall clock**. "He wrote this at 3am" is different
  information from the UTC instant, and for this person it is the single most
  behaviourally informative field in the archive.
- \`seq\` — a monotonic counter per lane. Timestamps collide, and records arrived from
  several devices whose clocks disagreed. \`seq\` is the only total order that survives.

## How to prove nothing was altered

Each record has \`sha256\`, the hash of its own canonical bytes, and \`prev_sha256\`, the
hash of the record before it **in the same lane** (ordered by \`seq\`). That makes each
lane tamper-evident *as a sequence*: no record can be altered, removed or reordered
without breaking the chain.

To check a single record by hand:

1. take the record, remove the \`sha256\` and \`prev_sha256\` fields;
2. serialise what remains with **keys sorted** and **no whitespace** (JCS-style, UTF-8);
3. SHA-256 that. It must equal the stored \`sha256\`.

Then walk the lane in \`seq\` order: every record's \`prev_sha256\` must equal the previous
record's \`sha256\`, \`seq\` must be contiguous from 1, and the first record's
\`prev_sha256\` is \`null\`.

\`health/fixity-*.jsonl\` records every time that verification was actually run, and what
it found. **Bit rot is real and silent** — a drive in a drawer degrades and nothing tells
you. That is why those runs exist.

## The folders

| Folder | What it is |
|---|---|
| \`data/\` | **Sacred.** The raw record. Never edit, never delete, never reorder. |
| \`SCHEMA/\` | The record shape, machine-readable, plus a changelog of every shape change. |
| \`LEXICON/\` | **The dictionary of his private language.** Read this before interpreting anything. |
| \`health/\` | Vital signs: record counts, field-fill rates, silence detection, fixity runs, quarantine. |
| \`derived/\` | **Disposable.** Anything in here can be deleted and rebuilt from \`data/\`. Nothing here is truth. |
| \`_writer/\` | The writing program's own bookkeeping (how far it had read, a run lock). Also disposable — it can be deleted and re-derived from \`data/\`, and it is kept out of \`data/\` precisely because it changes constantly and \`data/\` must not. |

## Read the LEXICON before you interpret anything

This archive is written in a private language — a football club used as an operating
system for one person's life. "Jirah" is not a word you can look up. "The Gaffer" is not
a person. A word like *bolo* carries a specific, load-bearing meaning here.

\`LEXICON/terms.jsonl\` is the dictionary, one term per line, each with the date it was
first seen and the canon file it was quoted from. **Without it an analysis of this
archive will not fail loudly — it will be quietly wrong**, because the data is intact and
the interpretation key is gone. Archival science calls this Representation Information.

## Sensitivity

Every record has a \`tier\`: \`public\`, \`personal\`, \`private\` or \`sealed\`. **The default is
\`private\`.** The rule the archive was built on: a tier may be relaxed by a deliberate act,
never tightened retroactively — because you cannot un-see. Treat anything unmarked as
private, and treat \`sealed\` as a request from the person in these records.

## BagIt

This folder is a [BagIt](https://datatracker.ietf.org/doc/html/rfc8493) bag:
\`bagit.txt\`, \`bag-info.txt\`, \`manifest-sha256.txt\` (every file in \`data/\`) and
\`tagmanifest-sha256.txt\` (everything else, including the schema and the lexicon). Any
BagIt tool from any decade can validate it without knowing anything about this project.

## Three copies

One disk is one copy, and one copy is not a backup. The standard is **3-2-1**: three
copies, on two different kinds of media, one of them kept somewhere else.

---

*Written by \`scripts/archivist.mjs\` in the arsenal-ai-fc repository. That repository will
not exist forever. This folder is designed to outlive it — that is the whole point.*
`;
}

const DERIVED_MD = () => `# derived/ — EVERYTHING IN HERE IS DISPOSABLE

Drop it and rebuild from \`../data/\`. **Nothing here is truth.**

Indexes, embeddings, tables, projections, summaries: all of it is a convenience for
whatever tooling exists at the time, and all of it goes stale. Embedding models change
and the whole corpus has to be re-embedded; table schemas encode the questions someone
was asking that year.

The law (LAW 8): **if something can only exist in the projection, it belongs in the raw.**
If you find yourself unable to rebuild a fact in here from \`data/\`, that is a bug in the
capture, not a reason to preserve this folder.
`;

const SCHEMA_CHANGELOG = () => `# SCHEMA CHANGELOG

Every shape change: WHAT, WHEN (IST), and WHY.

**Records are NEVER migrated.** A new shape gets a new version file (\`v2.json\`) and
readers handle all versions. A migration rewrites history, and rewritten history cannot
be told apart from tampering.

## v1 — ${istStamp(new Date()).day} (IST)

First shape. Built from ARCHIVE__DAY_ONE_SPEC.md §5, sealed 14 August 2026.

Fields: \`rid · sha256 · prev_sha256 · seq · v · ts_utc · ts_local · tz · recorded_at ·
valid_from · valid_to · lane · surface · source · modality · session_id · event_id · tier ·
moment · payload · derived_from · agent · backfilled\`.

Notes that a future reader will want:

- \`valid_from\` / \`valid_to\` are RESERVED and always null on raw records. They exist from
  day one so that the first DERIVED fact ever written cannot be written without them.
- \`derived_from\` / \`agent\` are likewise reserved: an interpretation is stored as a dated,
  attributed, falsifiable claim, never as a state file that overwrites itself.
- \`moment\` is null on backfilled records by design. The state it names (which task was
  live, which forge step) is overwritten as the system runs and is NOT recoverable after
  the fact — so it is stamped at write time or left null, never reconstructed.
`;

const LEXICON_CHANGELOG = () => `# LEXICON CHANGELOG

**Never edit a term in place — retire it and add the new one** (LAW 2 applied to language).

A term's meaning drifting is normal and is itself data. Overwriting the old definition
destroys the evidence that it drifted, and a later reader then applies today's meaning to
a record written under the old one.

## Seed — ${istStamp(new Date()).day} (IST)

Seeded from the canon files in the arsenal-ai-fc repository: \`CLAUDE.md\`,
\`learning-layer/PROJECT_OS.md\`, \`learning-layer/FORGE_SPEC.md\`,
\`learning-layer/HOW_HE_LEARNS.md\`, \`ARCHIVE__DAY_ONE_SPEC.md\` and the script headers.
Definitions are QUOTED or closely paraphrased from those files, never invented — each
record names its \`source\`.
`;

// ── THE LEXICON SEED (spec §10) ──────────────────────────────────────────────
// The least obvious and highest-value Day-1 artifact. Over twenty years the thing
// that fails is not corruption and not format — it is MEANING DRIFT. The
// dictionary for this archive's private language exists in exactly two places:
// his head, and code that will one day be deleted.
// DEFINITIONS ARE QUOTED FROM CANON, NEVER INVENTED. Where a definition is a
// paraphrase it is a paraphrase of the named source and of nothing else.
const SEEN = "2026-08-14";
const T = (term, definition, source, first_seen = SEEN) => ({ term, definition, first_seen, status: "live", version: 1, source });
const LEXICON_SEED = [
  // ── THE METHOD ──
  T("Bolo", "'Nikhil ke apne words — whole concept. Claude invent NAHI karta.' The sacred out-loud answer: the concept in his own spoken words, which the machine may never write for him.", "learning-layer/FORGE_SPEC.md §capsule schema"),
  T("Jirah", "Cross-examination. 'Claude = skeptical interviewer. Har axis pe ek sharp Q + traps.' The step where a claimed understanding is attacked rather than accepted.", "learning-layer/PROJECT_OS.md THE METHOD step 9"),
  T("Re-Jirah", "The cold re-examination of an already-locked concept, ~3 days / ~2 weeks / ~6 weeks later. 'Decayed axis → re-weld.' FSRS owns WHEN a concept returns; Re-Jirah owns WHICH AXES and HOW HARD.", "learning-layer/PROJECT_OS.md step 11 · scripts/rejirah.mjs header"),
  T("forge", "The 12-step study pipeline that produces one 9-axis concept capsule. A session is paced by scripts/forge_session.mjs; a concept is 'locked' when the capsule closes.", "learning-layer/PROJECT_OS.md THE METHOD (steps 0-11)"),
  T("capsule", "The immutable JSON artifact of one forged concept: bolo, weld, deep, mechanism, hook, why, traps, threeWays, interviewLines, doubts, bridges, and 9 faultLines (axes a-i). 'IMMUTABLE means never RE-EMIT, not never write.'", "learning-layer/FORGE_SPEC.md §5 · CLAUDE.md"),
  T("gist", "The GitHub gist holding the master copy of a capsule. dressing-room/state/capsules/ is a read-only MIRROR of it; mirror.mjs is that mirror's sole writer.", "CLAUDE.md · scripts/mirror.mjs header"),
  T("weld", "'defended answer (quick recall-trigger)' — the per-axis answer he defended under Jirah, always visible, never hidden behind a click.", "learning-layer/FORGE_SPEC.md §capsule schema"),
  T("deep", "'CAPSULE-LEVEL re-learn... hook/mechanism se FULLER. Verbatim-faithful from threads/Bolo.' Per-axis it is 'PER-AXIS re-learn... Layers ON TOP of weld — replace NAHI.'", "learning-layer/FORGE_SPEC.md §capsule schema"),
  T("mechanism", "'Nikhil ke locked words mein, crisp' — how the thing actually works, in his own locked wording.", "learning-layer/FORGE_SPEC.md §capsule schema"),
  T("hook", "'business cliffhanger (definition nahi)' — the opening that makes the concept matter, never a definition.", "learning-layer/FORGE_SPEC.md §capsule schema"),
  T("why", "'one line — build + interview relevance.'", "learning-layer/FORGE_SPEC.md §capsule schema"),
  T("traps", "'{ bait: seductive wrong (quoted), wrong: kyun galat, truth: correction }' — at least 2 per capsule. The plausible wrong answers, quoted so they can be recognised later.", "learning-layer/FORGE_SPEC.md §capsule schema"),
  T("threeWays", "'{ ceo, junior, skeptic }' — axis-i's 3-nazariye: the same concept explained to three different audiences.", "learning-layer/FORGE_SPEC.md §capsule schema"),
  T("interviewLines", "'tight English line, cold bol-ne layak' — the sentences he must be able to say cold, in an interview.", "learning-layer/FORGE_SPEC.md §capsule schema"),
  T("gut-word", "'knew | shaky | guessed, jawab se PEHLE, baad mein re-grade nahi. Gut-word nahi → rep nahi.' His confidence, committed BEFORE the answer and never re-graded after. This is the calibration measurement.", "learning-layer/PROJECT_OS.md:256"),
  T("axis", "One of the 9 fault lines a concept is broken along: a=kya+analogy, b=kyun/first-principles, c=mechanism, d=math+range, e=limits/failure-modes, f=tradeoffs, g=FinOps-spot, h=scale/cost, i=3-ways.", "dressing-room/state/concepts.json axes map"),
  T("the 9 axes", "The fixed a-i decomposition every concept capsule is tested along. '9 axes (a..i), status from Jirah only.' 17 concepts x 9 axes is the FLOOR, never negotiable down.", "learning-layer/FORGE_SPEC.md:117 · PROJECT_OS.md:286"),
  T("the 12 steps", "THE METHOD, steps 0-11: 0 time-box, ... 9 Jirah, 10 doubt capture, 11 Re-Jirah. The order is re-injected into every turn by a hook, because prose read once drowns after 40 turns.", "learning-layer/PROJECT_OS.md THE METHOD"),
  T("Pehle-Guess", "The guess demanded BEFORE the teaching starts. One of only four legal question-moments in a session.", "CLAUDE.md · learning-layer/PROJECT_OS.md"),
  T("crack-map", "DARAAR-MAP — the 9 axes shown up front as 'a visible finish line' at the start of a concept.", "learning-layer/PROJECT_OS.md:396"),
  T("cold-reader standard", "The quality bar for a captured doubt: ATOMIC (one confusion) + SUBJECT explicitly named + ANSWER-HIDDEN + a RICH confusion-journey (maine-socha-X-phir-Y) + no near-duplicate, so cold-Nikhil 6-12 months later can recognise WHERE he was stuck.", "learning-layer/FORGE_SPEC.md §3"),
  T("successive relearning", "The criterion a Re-Jirah round reports at close: every due axis held cold at least once. It is REPORTED, never enforced as a block.", "scripts/rejirah.mjs header"),
  T("doubt", "'EVERY genuine knowledge stuck-point, Nikhil ke shabd.' Mandatory, dual-purpose interview bank; never buried inside a weld. Curriculum/planning/status questions are never doubts.", "learning-layer/FORGE_SPEC.md:118"),
  T("bridges", "Dependency neighbours of a concept (>= 2 per capsule), each carrying a cold-reader-standard question.", "learning-layer/FORGE_SPEC.md:119"),
  T("rep", "One repetition: a question, his gut-word, and whether he got it right. 'No gut-word, no rep.' Banked as it happens, never at the end of a day.", "CLAUDE.md · scripts/capture.mjs"),
  T("the Visualization Contract", "Every concept gets ONE widget and THE WIDGET IS THE LESSON. His own ruling, 1 Aug 2026: '11 point yes visuals are important for my adhd pi brain.' Not demoted, not re-opened.", "learning-layer/HOW_HE_LEARNS.md · CLAUDE.md"),
  T("the four question-moments", "The only questions the method allows: Pehle-Guess, widget guess-gates, ONE sharp check-question across steps 3-6, and Jirah. Anything else is a quiz-dump, which canon forbids.", "CLAUDE.md"),

  // ── THE ORGANS ──
  T("Goalkeeper", "The Oura readiness coach. A DATA-ANALYST, NOT A PRESCRIBER: it interprets Oura data only, never comments on medication, and sustained concerning physiology raises a DOCTOR-REFERRAL flag.", "CLAUDE.md §The Goalkeeper — medical boundary"),
  T("Manager", "The capstone roster agent (Dugout #1). It only ever PROPOSES — it never auto-acts.", "CLAUDE.md build order #4"),
  T("Gaffer", "The voice surface of the same organism, under the same laws. Reads his locked capsules back to him verbatim, and is graded by the machine on the recital.", "THE_GAFFER.md · CLAUDE.md"),
  T("Nemesis", "The signal-source agent that tracks his weaknesses (weaknesses.json).", "CLAUDE.md §4 signal-source agents"),
  T("Scout", "The missions desk: it writes the internet-research missions Gemini runs, and ingests what comes back. HE fires them; the machine never does.", "CLAUDE.md §THE OUTWARD LOOP"),
  T("Distiller", "The organ that maintains the live working set from the bus.", "scripts/distiller.mjs header"),
  T("Doubtminer", "The organ that mines captured doubts into the lexicon of his confusions.", "scripts/doubtminer.mjs header"),
  T("Thalamus", "THE ONE DOOR. The local HTTP door (127.0.0.1:4113/afferent) every captured byte enters through. It binds loopback only — opening it to the network is a security regression.", "ARCHIVE__DAY_ONE_SPEC.md §3 · scripts/thalamus.mjs"),
  T("Hippocampus", "His durable memory: episodes, identity facts, the consolidated who_he_is. Sole writer of identity_facts.pending.jsonl.", "CLAUDE.md · scripts/hippocampus.mjs"),
  T("DMN", "The default mode network — the organism's background thinking pass, which runs when he is not there.", "scripts/dmn.mjs header"),
  T("Cortex", "The deep-answer organ: rare, expensive, high-thinking passes over the working memory.", "scripts/cortex.mjs header"),
  T("Watchman", "The night organ that asks 'did the organ that was supposed to produce output today produce any?' It files REDs; it does not repair.", "scripts/watchman.mjs header"),
  T("Boot Room", "The genome organ: it files ONE mutation proposal a week, with evidence, predicted effect and a revert plan. Nothing mutates without his word.", "scripts/bootroom.mjs · .claude/skills/genome"),
  T("Scoreboard", "The organ that scores the organism's own predictions — the claim-tracking lane, sole writer of brain_outcomes.jsonl.", "CLAUDE.md owners-only writes · scripts/scoreboard.mjs"),
  T("Mirror", "The sole writer of dressing-room/state/capsules/. It re-fetches the master gist every morning and on every forge lock-close, and snapshots to capsule_backups/.", "CLAUDE.md · scripts/mirror.mjs"),
  T("Archivist", "The sole writer of $ARSENAL_ARCHIVE. It tails the organism's append-only lanes and writes the permanent, hash-chained, IST-partitioned record. It never writes to dressing-room/.", "scripts/archivist.mjs header · ARCHIVE__DAY_ONE_SPEC.md §7.1"),
  T("Conductor", "The organ that runs the morning and evening chains in order, so scheduled organs do not race each other.", "scripts/conductor.mjs header"),
  T("Examiner", "The day's-end retrieval test on the day's concept — retrieval practice, not a full mock.", "SessionStart kickoff · scripts/examiner.mjs"),

  // ── THE CLUB ──
  T("dugout", "The local web surface (localhost:4114) where he signs, scrimmages and talks to the organism.", "package.json dugout scripts"),
  T("dressing room", "dressing-room/ — where the organism's live state lives: the JSON state bus, the hippocampus, the missions.", "CLAUDE.md"),
  T("matchday", "The morning kickoff ritual: sensory pass, the sheet, today's drills, the wall.", ".claude/skills/matchday"),
  T("full-time", "The 30-second evening close: HIT/MISS, one signal, the KAL-line, throw-in routing.", ".claude/skills/full-time"),
  T("kickoff", "The SessionStart brief — what the organism tells a fresh session about where he is, read from state and never from chat.", "scripts/learnstate.mjs brief"),
  T("throw-in", "The in-day router that picks up loose balls (things noticed mid-day) and routes them.", "scripts/throwin.mjs header"),
  T("captain's call", "His ADHD-PI ruling, 7 Aug 2026: reports are MACHINE-face; anything needing HIS word becomes ONE one-line card dealt at an anchor he already hits. He answers haan/na/baad.", "CLAUDE.md §THE CAPTAIN'S CALL"),
  T("the anchor law", "'If a thing needs the captain, it rides an anchor; if it cannot ride an anchor, it does not need the captain.' Never hand him a report to read, a list of asks, or a command to remember.", "CLAUDE.md §THE CAPTAIN'S CALL"),
  T("the wall", "The generated wallpaper/dashboard surface (viz.mjs) — the organism's state as a picture on his screen.", "scripts/viz.mjs · package.json wall"),
  T("SEASON", "dressing-room/SEASON.md — postmatch's logbook. Claude fills 100%, he writes zero.", "CLAUDE.md §THE OUTWARD LOOP"),
  T("the captain", "Nikhil. Human captain #14 of the club the system is themed as.", "CLAUDE.md"),

  // ── THE LAWS ──
  T("layering, never replace", "When changing an engine, freeze the old one verbatim (e.g. analyzeLegacy) in the same file; the new one is the plan of record. Both stay in the codebase.", "CLAUDE.md §Non-negotiable principles"),
  T("unrun system = hypothesis", "Nothing is 'done' until it has actually run. Write the test, RUN it, show the output.", "CLAUDE.md §Non-negotiable principles"),
  T("single writer", "One organ owns each state file and is the only thing that writes it. The one deliberate exception is brain_ledger.jsonl, a documented shared append lane.", "CLAUDE.md"),
  T("owners-only writes", "Never hand-edit a state file. Find its owner by grepping the script headers, which declare it.", "CLAUDE.md §Owners-only writes"),
  T("AI proposes, code validates, human approves", "The LLM is used only for semantic/unbounded tasks; deterministic code does math, thresholds and validation. Amended 14 Aug 2026 by the five autonomy laws: approve the CLASS, never the CASE.", "CLAUDE.md · memory/artifact-organ-diagnosis.md"),
  T("drift", "A measured break of a teaching-contract rule (scope cut, wrong language, quiz-dump, level mismatch). Self-reported in the turn it happens, and it counts the moment it is filed.", "CLAUDE.md §DRIFT IS SELF-REPORTED"),
  T("auto-hit", "A drift that counts itself without asking him — 'the guard is VISIBILITY + REVERSIBILITY, not a gate'; unhit-auto walks any count back.", "CLAUDE.md §DRIFT IS SELF-REPORTED"),
  T("teaching contract", "The drift-ranked rules for HOW to teach him, re-injected every turn by a hook because rules delivered once drown after 40 turns.", ".claude/settings.json · scripts/teaching_contract.mjs"),
  T("the Opus Principle", "Deep reasoning must read the RAW, not a pre-digested summary of it. Violating it is what killed the predecessor project's cascade.", "memory/artifact-organ-diagnosis.md · JARVIS Bible v4"),
  T("anti-self-deception machine", "What the organism actually is, under the football costume: every mechanism (gut-word before the answer, cold Re-Jirah, 'unrun = hypothesis', dated corrections) attacks the gap between what he thinks he knows and what he knows.", "memory/artifact-organ-diagnosis.md"),

  // ── THIS SPEC ──
  T("lane", "One stream of records, named after the source .jsonl it came from (month-rolls and .N rotations collapse into the same lane). The unit the hash chain and the seq counter are per.", "ARCHIVE__DAY_ONE_SPEC.md §5"),
  T("surface", "Which BODY a record came from: claude-code, gaffer-voice, activitywatch, phone-note, glasses, tv, system. 'What he said out loud' and 'what he typed' are different acts.", "ARCHIVE__DAY_ONE_SPEC.md §5 · hooks/afferent-post.mjs"),
  T("tier", "Sensitivity, stamped at write time: public | personal | private | sealed. Defaults to private, only ever relaxed by an explicit act, never tightened retroactively — you cannot un-see.", "ARCHIVE__DAY_ONE_SPEC.md LAW 7"),
  T("moment", "The state that overwrites itself, stamped onto a record at write time: which sprint task was live, which forge step, the last readiness verdict, the working directory. Not recoverable afterwards.", "ARCHIVE__DAY_ONE_SPEC.md §5.3"),
  T("chain", "prev_sha256 — each record carries the hash of the previous record in its own lane, so the lane is tamper-evident as a sequence. This is what git does.", "ARCHIVE__DAY_ONE_SPEC.md §5.2"),
  T("fixity", "The practice of re-checking stored hashes to detect silent corruption (bit rot). health/fixity-*.jsonl records when it ran and what it found.", "ARCHIVE__DAY_ONE_SPEC.md §7.1 · §12"),
  T("backfilled", "true = the record was imported from history rather than tailed live, so its seq and prev chain are ARCHIVE order, not original write order. An unmarked backfill is a lie about provenance.", "ARCHIVE__DAY_ONE_SPEC.md §8"),
  T("derived", "Any record produced by interpreting other records. It is a NEW record that POINTS at the raw (derived_from, agent) and never replaces it.", "ARCHIVE__DAY_ONE_SPEC.md LAW 2 / LAW 5"),
  T("the write-ahead log", "afferent.jsonl and the other live lanes: hot, fast, never blocks. The archive is the durable store behind it — which is why the archivist runs often, because anything lost from the WAL before it is archived is lost forever.", "ARCHIVE__DAY_ONE_SPEC.md §3"),
  T("Representation Information", "The OAIS archival term for the interpretation key a future reader needs — here, the LEXICON. Without it an analysis does not fail loudly, it is quietly wrong.", "ARCHIVE__DAY_ONE_SPEC.md §10"),
  T("3-2-1", "The archival storage standard: 3 copies, on 2 different media types, 1 kept off-site. One disk is one copy, and one copy is not a backup.", "ARCHIVE__DAY_ONE_SPEC.md §12"),
];

// ── SELFTEST (spec §11 — all thirteen acceptance tests) ──────────────────────
// HERMETIC: every test runs in a temp archive + a temp fake repo. This organ is
// READ-ONLY on dressing-room/ and its own test must prove that, not assume it.
function selftest() {
  let pass = 0, fail = 0;
  const ok = (name, cond, detail) => {
    if (cond) { pass++; console.log(`  ok   ${name}`); }
    else { fail++; console.log(`  FAIL ${name}${detail ? `\n         ${detail}` : ""}`); }
  };
  const tmp = mkdtempSync(join(tmpdir(), "arsenal-archive-test-"));
  const arc = join(tmp, "archive");
  const repo = join(tmp, "repo");
  const lane = join(repo, CAPTURE_ROOT, "state", "afferent.jsonl");
  mkdirSync(dirname(lane), { recursive: true });
  const row = (i, extra = {}) => JSON.stringify({ event_id: `e${i}`, modality: "code", source: "claude-code", surface: "claude-code", session_id: "sess-test", text: `line ${i}`, ts: new Date(Date.UTC(2026, 7, 14, 4, 0, i)).toISOString(), v: 2, ...extra });
  const seed = (n, from = 0) => { const fd = openSync(lane, "a"); try { for (let i = from; i < from + n; i++) writeSync(fd, row(i) + "\n"); } finally { closeSync(fd); } };
  const A = { root: arc, repo, quiet: true };

  try {
    console.log("=== ARCHIVIST SELFTEST — the 13 acceptance tests (ARCHIVE__DAY_ONE_SPEC.md §11) ===\n");

    // ── 10. REPO SAFETY (run first: init must refuse before anything exists) ──
    const inRepo = join(tmp, "fakerepo", "archive");
    mkdirSync(join(tmp, "fakerepo", ".git"), { recursive: true });
    const refused = initArchive({ root: inRepo, quiet: true });
    ok("10. REPO SAFETY · init REFUSES to create the archive inside a git work tree", refused.ok === false && refused.reason === "inside-git" && !existsSync(inRepo));
    ok("10b. …and the guard walks UP, not just at the root (a child dir of a repo is still in the repo)", repoGuard(join(tmp, "fakerepo", "a", "b")).ok === false);
    ok("10c. …while a path with no .git above it is allowed", repoGuard(arc).ok === true);

    const init = initArchive(A);
    ok("INIT · the tree, the bag files, the schema and the lexicon all land", init.ok
      && existsSync(join(arc, "bagit.txt")) && existsSync(join(arc, "bag-info.txt"))
      && existsSync(join(arc, "SCHEMA", "v1.json")) && existsSync(join(arc, "LEXICON", "terms.jsonl"))
      && existsSync(join(arc, "derived", "README.md")) && existsSync(join(arc, "data")));
    ok("INIT · bag-info.txt states the IST day-partition out loud (§4.4 — a reader who assumes UTC is wrong about every late night)",
      /Arsenal-Day-Partition: Asia\/Kolkata/.test(readFileSync(join(arc, "bag-info.txt"), "utf8")));
    ok("INIT · is idempotent and never re-seeds the lexicon (LAW 2: language is layered, not overwritten)",
      initArchive(A).seeded === 0 && readFileSync(join(arc, "LEXICON", "terms.jsonl"), "utf8").split("\n").filter(Boolean).length === LEXICON_SEED.length);

    // ── 1. CHAIN INTEGRITY ──
    seed(100);
    const r1 = runArchive(A);
    ok("1. CHAIN INTEGRITY · 100 records archived and `verify` passes", r1.added === 100 && verifyArchive({ root: arc, quiet: true }).ok);

    // ── 4. IDEMPOTENCY ──
    const r2 = runArchive(A);
    const countAll = () => [...laneRecords(arc, "afferent")].length;
    ok("4. IDEMPOTENCY · a second `run` on the same input adds nothing (0 duplicates)", r2.added === 0 && countAll() === 100);
    // THE DOUBLING SCAR (14 Aug 2026). `init` used to write an EMPTY checkpoint
    // whenever the file was absent, which on the first init after the checkpoint
    // moved directories meant the migration never ran and the NEXT run re-archived
    // the entire archive as backfill — 33,249 records, duplicated, every chain
    // still verifying perfectly. A valid chain is not a correct archive. Only the
    // count said so, and only because someone read it.
    initArchive(A);
    const afterInit = runArchive(A);
    ok("4b. IDEMPOTENCY · re-running `init` over a LIVE archive does not lose the checkpoint (the doubling scar: a valid chain is not a correct archive)",
      afterInit.added === 0 && countAll() === 100, `init lost the read position and re-archived ${afterInit.added} record(s)`);

    // ── 6. IST DAY BOUNDARY ──
    // 02:30+05:30 on the 14th is 21:00Z on the 13th. A UTC partition files it
    // under the 13th and silently destroys the shape of a night he worked through.
    appendLines(lane, [JSON.stringify({ event_id: "late", source: "claude-code", surface: "claude-code", text: "3am", ts: "2026-08-14T02:30:00+05:30" })]);
    runArchive(A);
    const d14 = join(arc, "data", "afferent", "2026", "08", "14.jsonl");
    const d13 = join(arc, "data", "afferent", "2026", "08", "13.jsonl");
    ok("6. IST DAY BOUNDARY · 2026-08-14T02:30+05:30 (= 21:00Z on the 13th) lands in 2026/08/14.jsonl, not the 13th",
      existsSync(d14) && readFileSync(d14, "utf8").includes('"3am"') && (!existsSync(d13) || !readFileSync(d13, "utf8").includes('"3am"')));

    // ── 7. NO NORMALISATION ──
    const exotic = "  नमस्ते  🙏\r\n\ttrailing  ";
    appendLines(lane, [JSON.stringify({ event_id: "exotic", source: "claude-code", surface: "claude-code", text: exotic, ts: "2026-08-14T05:00:00Z" })]);
    runArchive(A);
    const exoticRec = [...laneRecords(arc, "afferent")].map((r) => r.rec).find((r) => r && r.payload && r.payload.event_id === "exotic");
    ok("7. NO NORMALISATION · a payload with Devanagari, an emoji, CRLF and padding round-trips BYTE-IDENTICAL",
      !!exoticRec && exoticRec.payload.text === exotic);

    // ── 9. TIER DEFAULT ──
    const tiers = new Set([...laneRecords(arc, "afferent")].map((r) => r.rec && r.rec.tier));
    ok("9. TIER DEFAULT · every record with no declared tier is 'private', never anything looser", tiers.size === 1 && tiers.has("private"));
    appendLines(lane, [JSON.stringify({ event_id: "pub", source: "x", tier: "public", text: "declared", ts: "2026-08-14T05:01:00Z" })]);
    appendLines(lane, [JSON.stringify({ event_id: "junk", source: "x", tier: "wide-open", text: "junk tier", ts: "2026-08-14T05:02:00Z" })]);
    runArchive(A);
    const byEvent = (e) => [...laneRecords(arc, "afferent")].map((r) => r.rec).find((r) => r && r.payload && r.payload.event_id === e);
    ok("9b. TIER · a writer's EXPLICIT relaxation is honoured; an unknown tier value falls back to private, never through",
      byEvent("pub").tier === "public" && byEvent("junk").tier === "private");

    // ── 8. BACKFILL HONESTY ──
    // Everything present when the archivist FIRST sees a file is backfill: calling
    // ten months of history "live" is the unmarked backfill §8 names as a lie.
    const lane2 = join(repo, CAPTURE_ROOT, "state", "reps_log.jsonl");
    appendLines(lane2, [0, 1, 2].map((i) => JSON.stringify({ concept: "embeddings", axis: "a", gut: "shaky", ts: `2026-08-1${i}T06:00:00Z` })));
    runArchive(A);
    const reps = [...laneRecords(arc, "reps_log")].map((r) => r.rec);
    ok("8. BACKFILL HONESTY · history already on disk when the archivist first sees a lane is marked backfilled:true",
      reps.length === 3 && reps.every((r) => r.backfilled === true));
    appendLines(lane2, [JSON.stringify({ concept: "embeddings", axis: "b", gut: "knew", ts: new Date().toISOString() })]);
    runArchive(A);
    const repsAfter = [...laneRecords(arc, "reps_log")].map((r) => r.rec);
    ok("8b. …and the row that arrives AFTER the archivist is watching is backfilled:false — no live record lies either",
      repsAfter.length === 4 && repsAfter[3].backfilled === false);
    ok("8c. …a backfilled record carries NO moment (a reconstructed moment would be a fiction, §5.3)",
      reps.every((r) => r.moment === null) && repsAfter[3].moment !== null && repsAfter[3].moment.cwd === "repo");

    // ── 12. SCHEMA VALIDITY ──
    const schema = JSON.parse(readFileSync(join(arc, "SCHEMA", "v1.json"), "utf8"));
    const errs = [];
    for (const l of archivedLanes(arc)) for (const { rec } of laneRecords(arc, l)) {
      if (!rec) { errs.push(`${l}: an unparseable line reached data/ — that is a defect, not a schema miss`); continue; }
      errs.push(...validate(schema, rec, `${l}#${rec.seq}`));
    }
    ok("12. SCHEMA VALIDITY · every written record validates against SCHEMA/v1.json", errs.length === 0, errs.slice(0, 5).join("\n         "));

    // ── 5. CRASH SAFETY ──
    const before = countAll();
    const fd = openSync(lane, "a");
    try { writeSync(fd, '{"event_id":"halfwritten","text":"power cut mid-w'); } finally { closeSync(fd); }
    const rPartial = runArchive(A);
    const qFiles = readdirSync(join(arc, "health")).filter((f) => f.startsWith("quarantine-"));
    const qRows = qFiles.flatMap((f) => readFileSync(join(arc, "health", f), "utf8").split("\n").filter(Boolean).map(JSON.parse));
    ok("5. CRASH SAFETY · a line truncated mid-write is DETECTED and quarantined with its raw bytes, and nothing is lost",
      rPartial.added === 0 && qRows.some((q) => q.kind === "partial-tail" && q.raw.includes("power cut mid-w")) && countAll() === before);
    runArchive(A);
    ok("5b. …and it is reported ONCE, not every 15 minutes (a stuck writer must not spam the health lane)",
      readdirSync(join(arc, "health")).filter((f) => f.startsWith("quarantine-")).flatMap((f) => readFileSync(join(arc, "health", f), "utf8").split("\n").filter(Boolean).map(JSON.parse)).filter((q) => q.kind === "partial-tail").length === 1);
    // finish the line the way the real writer would have, and it must archive normally
    appendLines(lane, ['rite","ts":"2026-08-14T05:05:00Z"}']);                 // the writer finishes its line
    const rFinished = runArchive(A);
    ok("5c. …when the writer finishes the line, it is archived normally — ZERO data loss from a power cut",
      rFinished.added === 1 && byEvent("halfwritten") && byEvent("halfwritten").payload.text.includes("power cut mid-write"));

    // LAW 3 — an unparseable COMPLETE line is quarantined, never dropped
    appendLines(lane, ["{this is not json at all}"]);
    runArchive(A);
    const qNow = readdirSync(join(arc, "health")).filter((f) => f.startsWith("quarantine-")).flatMap((f) => readFileSync(join(arc, "health", f), "utf8").split("\n").filter(Boolean).map(JSON.parse));
    ok("LAW 3 · an unparseable line is QUARANTINED with its raw bytes, never rejected at the door",
      qNow.some((q) => q.kind === "unparseable-line" && q.raw === "{this is not json at all}"));

    // ── crash recovery: the inflight claim ──
    const ck = loadCkpt(arc);
    const cf = ck.files["dressing-room/state/afferent.jsonl"];
    const rewound = cf.offset;
    seed(5, 500);
    runArchive(A);                                   // writes 5 records cleanly
    const ck2 = loadCkpt(arc);
    ck2.files["dressing-room/state/afferent.jsonl"].offset = rewound;
    ck2.files["dressing-room/state/afferent.jsonl"].inflight = { from: rewound, to: cf.offset, days: ["2026-08-14"], claimed_at: new Date().toISOString() };
    saveCkpt(arc, ck2);                              // simulate: died after appending, before advancing
    const nAfter = countAll();
    const rRecover = runArchive(A);
    ok("CRASH RECOVERY · a run that died between the append and the checkpoint re-reads its batch and writes ZERO duplicates",
      rRecover.added === 0 && rRecover.skipped === 5 && countAll() === nAfter);
    ok("CRASH RECOVERY · …and the chain is still intact afterwards", verifyArchive({ root: arc, quiet: true }).ok);

    // ── THE LOCK (the 14 Aug duplicate-seq scar) ──
    // Two archivists ran 119 ms apart — the 15-minute task and a manual run — and
    // both assigned seq 6005 to the same brain_ledger row. The chain caught it;
    // nothing else could have, because a duplicate row and a bad counter look
    // exactly like ordinary records.
    const held = takeLock(arc, "test-holder");
    ok("LOCK · a second archivist STANDS DOWN rather than double-assigning seq (the 14 Aug duplicate-seq scar)",
      held.ok === true && runArchive({ ...A }).stood_down === true);
    ok("LOCK · …and it stands down with SUCCESS, not failure — a scheduled organ that reports red because another copy of itself was working teaches everyone to ignore its exit code",
      runArchive({ ...A }).ok === true);
    ok("LOCK · seal refuses to hash a moving tree while a run holds the lock", sealArchive({ root: arc, quiet: true }).sealed === false);
    ok("LOCK · verify is deliberately NOT blocked — reading a prefix of an append-only file is always consistent, and a fixity check must never be startable-only-sometimes",
      verifyArchive({ root: arc, quiet: true }).ok === true);
    held.release();
    ok("LOCK · released, and the next run proceeds normally", runArchive({ ...A }).stood_down === undefined);
    // a lock older than 10 minutes is a CRASHED run, not a live one
    writeAtomic(P(arc).lock, JSON.stringify({ pid: 999999, mode: "run", at: new Date(Date.now() - 3600000).toISOString() }));
    const afterStale = runArchive({ ...A });
    ok("LOCK · a STALE lock (a crashed run) is taken over, and the takeover is journalled — never a silent seizure",
      afterStale.stood_down === undefined
      && readdirSync(join(arc, "health")).filter((f) => f.startsWith("quarantine-")).flatMap((f) => readFileSync(join(arc, "health", f), "utf8").split("\n").filter(Boolean).map(JSON.parse)).some((q) => q.kind === "stale-lock-taken"));

    // ── REBUILD — the only sanctioned repair ──
    const beforeRb = [...laneRecords(arc, "reps_log")].length;
    const rb = rebuildLane("reps_log", { root: arc, repo, quiet: true, why: "selftest" });
    ok("REBUILD · a lane is dropped and re-derived from its sources, and the chain verifies afterwards",
      rb.ok === true && rb.dropped === beforeRb && rb.rebuilt === beforeRb);
    ok("REBUILD · after a rebuild the whole lane reads backfilled:true — it IS a backfill, and saying otherwise would be the §8 lie",
      [...laneRecords(arc, "reps_log")].every(({ rec }) => rec && rec.backfilled === true));
    ok("REBUILD · it REFUSES a lane with no source on disk — the archive would be the only copy, so dropping it is a DELETE",
      rebuildLane("no_such_lane_anywhere", { root: arc, repo, quiet: true }).reason === "no-source");
    ok("REBUILD · both the drop and the result are journalled to health/fixity-*.jsonl (a rebuild may never be a silent rewrite)",
      readdirSync(join(arc, "health")).filter((f) => f.startsWith("fixity-")).flatMap((f) => readFileSync(join(arc, "health", f), "utf8").split("\n").filter(Boolean).map(JSON.parse)).filter((r) => r.kind === "rebuild-start" || r.kind === "rebuild-done").length === 2);

    // ── 2. TAMPER DETECTION ──
    const tamperFile = join(arc, "data", "afferent", "2026", "08", "14.jsonl");
    const lines = readFileSync(tamperFile, "utf8").split("\n").filter(Boolean);
    const mid = Math.floor(lines.length / 2);
    const victim = JSON.parse(lines[mid]);
    const tampered = { ...victim, payload: { ...victim.payload, text: "ALTERED" } };
    const saved = lines.slice();
    lines[mid] = JSON.stringify(tampered);
    writeFileSync(tamperFile, lines.join("\n") + "\n", "utf8");
    const v2 = verifyArchive({ root: arc, quiet: true });
    ok("2. TAMPER DETECTION · one altered byte in a middle record is caught, and `verify` NAMES that exact record",
      !v2.ok && v2.breaks.some((b) => b.kind === "hash-mismatch" && b.rid === victim.rid && b.seq === victim.seq),
      JSON.stringify(v2.breaks.slice(0, 2)));

    // ── 3. DELETION DETECTION ──
    const gapped = saved.slice(); gapped.splice(mid, 1);
    writeFileSync(tamperFile, gapped.join("\n") + "\n", "utf8");
    const v3 = verifyArchive({ root: arc, quiet: true });
    ok("3. DELETION DETECTION · a removed middle record breaks the chain AND leaves a seq gap — both reported",
      !v3.ok && v3.breaks.some((b) => b.kind === "chain-break") && v3.breaks.some((b) => b.kind === "seq-gap"),
      JSON.stringify(v3.breaks.slice(0, 2)));
    writeFileSync(tamperFile, saved.join("\n") + "\n", "utf8");
    ok("3b. …and the restored file verifies clean again (the detector is not simply always-red)", verifyArchive({ root: arc, quiet: true }).ok);
    ok("FIXITY · every verification run is journalled to health/fixity-*.jsonl (LAW 6: a check nobody records is a hypothesis)",
      readdirSync(join(arc, "health")).some((f) => f.startsWith("fixity-")));

    // ── 11. VITALS: SILENCE DETECTION ──
    const counts = new Map();
    for (let i = 0; i < 14; i++) counts.set(`2026-07-${String(10 + i).padStart(2, "0")}`, 5);
    const sil = silenceVerdict(counts, "2026-07-26");
    ok("11. VITALS SILENCE · a lane with 14 days of rows and then 3 days of zero is flagged RED",
      sil.state === "RED-silent" && sil.active_days === 14 && sil.silent_days === 3, JSON.stringify(sil));
    ok("11b. …a lane with 14 days of rows and 2 days of silence is NOT flagged (the threshold is a threshold)",
      silenceVerdict(counts, "2026-07-25").state === "ok");
    ok("11c. …and a YOUNG lane is never called silent — too little history to judge is an answer, not a red",
      silenceVerdict(new Map([["2026-07-10", 3]]), "2026-08-01").state === "young");
    const vit = vitalsArchive({ root: arc, quiet: true });
    ok("11d. VITALS · runs over the real archive, counts every lane, and journals to health/vitals-*.jsonl",
      vit.lanes.length >= 2 && vit.lanes.every((l) => l.records > 0) && readdirSync(join(arc, "health")).some((f) => f.startsWith("vitals-")));
    ok("11e. VITALS · fill rates are real percentages, not a guess (ts_local is 100% on a lane whose rows all carry ts)",
      vit.lanes.find((l) => l.lane === "afferent").fill_pct.ts_local === 100);

    // ── SEAL ──
    const sealed = sealArchive({ root: arc, quiet: true });
    const man = readFileSync(join(arc, "manifest-sha256.txt"), "utf8").trim().split("\n");
    const tag = readFileSync(join(arc, "tagmanifest-sha256.txt"), "utf8").trim().split("\n");
    ok("SEAL · manifest-sha256.txt covers every payload file and the checksums are real",
      man.length === sealed.payload && man.every((l) => /^[0-9a-f]{64} {2}data\//.test(l))
      && man.every((l) => { const [h, p] = l.split("  "); return fileSha(join(arc, p)) === h; }));
    ok("SEAL · tagmanifest covers the SCHEMA and the LEXICON — the interpretation key is fixity-protected too",
      tag.some((l) => l.endsWith("SCHEMA/v1.json")) && tag.some((l) => l.endsWith("LEXICON/terms.jsonl")) && tag.some((l) => l.endsWith("bagit.txt")));
    ok("SEAL · Payload-Oxum is regenerated and TRUE at seal time (a stale oxum is a bag that fails validation)",
      new RegExp(`Payload-Oxum: ${sealed.bytes}\\.${sealed.payload}`).test(readFileSync(join(arc, "bag-info.txt"), "utf8")));
    // BAGIT COMPLETENESS — the law behind the one place this deviates from §6's
    // written tree. A bag is complete only if EVERY file under data/ is in the
    // manifest, so nothing that legitimately changes between seals may live
    // there: the checkpoint used to, and it changes every 15 minutes, which would
    // have made the copy on his external disk fail validation permanently.
    const manifested = new Set(man.map((l) => l.split("  ")[1]));
    const onDisk = walkFiles(join(arc, "data")).map((f) => relative(arc, f).split(sep).join("/"));
    ok("SEAL · BAGIT COMPLETENESS — every file under data/ is in manifest-sha256.txt, and nothing mutable lives there",
      onDisk.every((f) => manifested.has(f)), onDisk.filter((f) => !manifested.has(f)).join(", "));
    ok("SEAL · the writer's own mutable state is OUTSIDE the payload and covered by the TAGmanifest instead",
      existsSync(P(arc).checkpoints) && !existsSync(P(arc).checkpointsLegacy) && tag.some((l) => l.endsWith("_writer/checkpoints.json")));

    // ── THE LEXICON (spec §10) ──
    const terms = readFileSync(join(arc, "LEXICON", "terms.jsonl"), "utf8").split("\n").filter(Boolean).map(JSON.parse);
    const need = ["Bolo", "Jirah", "Re-Jirah", "gut-word", "capsule", "the anchor law", "tier", "backfilled", "chain", "fixity"];
    ok(`LEXICON · ${terms.length} terms seeded, every one carrying term + definition + first_seen + status + version + source`,
      terms.length >= 70 && terms.every((t) => t.term && t.definition && t.first_seen && t.status && t.version && t.source));
    ok("LEXICON · the load-bearing private words are all in the dictionary (without them a 2035 read is quietly wrong)",
      need.every((n) => terms.some((t) => t.term === n)), need.filter((n) => !terms.some((t) => t.term === n)).join(", "));

    // ── CANONICALISATION + THE HASH ──
    ok("CANON · key order does not change the hash (JCS: sorted keys, no insignificant whitespace)",
      sha256Hex(canon({ b: 1, a: { d: 2, c: [3, "x"] } })) === sha256Hex(canon({ a: { c: [3, "x"], d: 2 }, b: 1 })));
    ok("CANON · a single changed byte anywhere changes the hash", sha256Hex(canon({ a: "x" })) !== sha256Hex(canon({ a: "y" })));
    ok("HASH · sha256 excludes sha256 and prev_sha256, so a record's id survives re-chaining (§5.1: a stable citation id)",
      (() => {
        // Compared on ONE record with its chain link swapped — NOT on two records
        // built from the same inputs, which is what this test said first and which
        // can never pass: `rid` is a ULID and carries 16 random chars, so two
        // records built identically differ in the hashed body by design.
        const rec = buildRecord({ lane: "t", payload: { a: 1 }, now: new Date("2026-08-14T04:00:00Z"), backfilled: false, moment: null, seq: 5, prevSha: "a".repeat(64) });
        const relinked = { ...rec, prev_sha256: "b".repeat(64) };
        const { sha256: _s, prev_sha256: _p, ...body } = relinked;
        return sha256Hex(canon(body)) === rec.sha256;
      })());
    ok("SEQ · the total order is per LANE and starts at 1 (§4.3 — timestamps collide, seq does not)",
      [...laneRecords(arc, "reps_log")].map((r) => r.rec.seq).join(",") === "1,2,3,4");

    // ── HERMETICITY: this organ never writes to dressing-room/ ──
    const stateSnap = (d) => readdirSync(d).map((f) => { const s = statSync(join(d, f)); return `${f}:${s.size}:${s.mtimeMs}`; }).join("|");
    const liveState = join(ROOT, "dressing-room", "state");
    const snapBefore = existsSync(liveState) ? stateSnap(liveState) : "";
    runArchive({ root: arc, repo, quiet: true });
    verifyArchive({ root: arc, quiet: true });
    ok("HERMETIC · the archivist is READ-ONLY on dressing-room/ — the live state is byte-identical after a run",
      !snapBefore || snapBefore === stateSnap(liveState));

    // ── TWO LAWS THIS ORGAN OWNS, HELD STATICALLY ────────────────────────────
    // These read OTHER files, which normally makes them organism_test.mjs's job —
    // and they were written there first. They live here instead for two reasons.
    // (1) OWNERSHIP: the archive's shape and its single-writer rule are defined by
    // this organ's own spec (§5.3, §3), so the writer that defines a law is the
    // right one to assert it. (2) MEASURED COST: xray.mjs holds a per-organ
    // ratchet — "no EXISTING organ may get blinder" — and adding two dynamic
    // readFileSync sites to organism_test.mjs took it 104 → 110 unresolved sinks
    // and turned that net red. A NEW organ brings its own sinks and is reported,
    // never failed. Both laws still run inside `npm test`; only their address moved.

    // LAW DRIFT — one law, two writers. §5.3's `moment` is stamped in TWO places:
    // hooks/afferent-post.mjs writes it at capture time (authoritative — the state
    // has not moved yet) and this organ fills it for rows that arrived without one.
    // The hook deliberately imports nothing (an import graph is a way for a capture
    // nerve to start biting), so the code is DUPLICATED, and duplication is where
    // shapes drift. If one side gains a field, half the archive carries it and half
    // never will — records are never migrated. Keys are read from each file's own
    // literal, so a field legitimately added to both needs no edit here.
    const momentKeys = (file) => {
      const src = readFileSync(join(ROOT, file), "utf8");
      const m = src.match(/const m = \{([^}]*)\};/);
      return m ? m[1].split(",").map((s) => s.trim().split(":")[0].trim()).filter(Boolean).sort().join(",") : null;
    };
    const hookKeys = momentKeys("hooks/afferent-post.mjs");
    const archKeys = momentKeys("scripts/archivist.mjs");
    ok("MOMENT SHAPE · the capture nerve and the archivist stamp the SAME `moment` fields (§5.3 — two writers, one shape)",
      !!hookKeys && hookKeys === archKeys, `hook: ${hookKeys}\n         archivist: ${archKeys}`);

    // SINGLE WRITER — the archive's whole integrity argument (per-lane seq + the
    // sha256 chain) assumes exactly one process appends. A second writer would not
    // corrupt a file; it would produce a chain that VERIFIES while being wrong
    // about the order of his life, which is worse.
    const others = readdirSync(join(ROOT, "scripts")).filter((f) => f.endsWith(".mjs") && f !== "archivist.mjs"
      && /ARSENAL_ARCHIVE|CyborgArchive/.test(readFileSync(join(ROOT, "scripts", f), "utf8")));
    ok("SINGLE WRITER · no other organ even knows where the archive lives (a second appender breaks seq and the chain)",
      others.length === 0, others.join(", "));

    // ── THE COMMIT TRIPWIRE (§7.5) ──
    const twTracked = new Set(["dressing-room/state/reps_log.jsonl", "scripts/archivist.mjs"]);
    const tw = (staged) => tripwire({ repo: ROOT, quiet: true, staged, tracked: twTracked });
    ok("TRIPWIRE · an ALREADY-TRACKED capture lane still commits (a hook that reds every commit gets uninstalled, and then protects nothing)",
      tw(["dressing-room/state/reps_log.jsonl", "scripts/archivist.mjs"]).ok === true);
    ok("TRIPWIRE · a NEW capture lane is REFUSED — his words are never published for the first time by accident",
      tw(["dressing-room/state/afferent.jsonl"]).ok === false);
    ok("TRIPWIRE · a BagIt bag file is refused outright (the archive lives outside the repo, spec §6)",
      tw(["CyborgArchive/bagit.txt"]).ok === false && tw(["somewhere/manifest-sha256.txt"]).ok === false);
    ok("TRIPWIRE · live credentials are refused under ANY override",
      (() => { process.env.ARSENAL_ALLOW_NEW_LANE = "1"; const a = tw(["scripts/oura_tokens.json"]).ok; const b = tw(["dressing-room/state/afferent.jsonl"]).ok; delete process.env.ARSENAL_ALLOW_NEW_LANE; return a === false && b === true; })(),
      "the override must free a new LANE and never a credential");
    ok("TRIPWIRE · an ordinary code commit passes untouched", tw(["scripts/archivist.mjs", "README.md"]).ok === true);

    // ── LIVE FIRE: a REAL repo, a REAL `git add`, the REAL hook ──────────────
    // The five assertions above inject `staged` and `tracked`, and they ALL
    // PASSED on a tripwire that let the entire bus into a commit — the bug was in
    // the derivation of `tracked`, which injection replaces. A test that mocks
    // the part that breaks is a test of the mock. This one mocks nothing: it
    // builds a git repo, commits one ordinary file, stages a brand-new capture
    // lane with `git add -f` exactly as a careless hand would, and asks the
    // installed hook. It goes red the moment the tripwire is wrong in the way it
    // was actually wrong.
    const g = join(tmp, "livefire");
    mkdirSync(join(g, "dressing-room", "state"), { recursive: true });
    mkdirSync(join(g, "scripts"), { recursive: true });
    const git = (...a) => spawnSync("git", a, { cwd: g, encoding: "utf8", timeout: 30000 });
    writeFileSync(join(g, ".gitignore"), "dressing-room/state/*.jsonl\n", "utf8");
    writeFileSync(join(g, "scripts", "thing.mjs"), "// ordinary code\n", "utf8");
    writeFileSync(join(g, "dressing-room", "state", "reps_log.jsonl"), '{"a":1}\n', "utf8");
    git("init", "-q");
    git("config", "user.email", "t@t"); git("config", "user.name", "t"); git("config", "commit.gpgsign", "false");
    git("add", "scripts/thing.mjs", ".gitignore");
    git("add", "-f", "dressing-room/state/reps_log.jsonl");        // this lane IS tracked on purpose
    git("commit", "-q", "-m", "base");
    writeFileSync(join(g, "dressing-room", "state", "afferent.jsonl"), '{"text":"his words"}\n', "utf8");
    writeFileSync(join(g, "scripts", "thing.mjs"), "// ordinary code, edited\n", "utf8");
    git("add", "-f", "dressing-room/state/afferent.jsonl", "scripts/thing.mjs");
    const live = tripwire({ repo: g, quiet: true });
    ok("TRIPWIRE LIVE-FIRE · a NEVER-COMMITTED capture lane, staged with `git add -f`, is REFUSED — the exact case that got through on 14 Aug",
      live.ok === false && live.blocks.some(([f]) => f === "dressing-room/state/afferent.jsonl"),
      `tripwire said ok=${live.ok}. \`git ls-files\` reads the INDEX, so staging the file is what made it look tracked. It must ask HEAD.`);
    ok("TRIPWIRE LIVE-FIRE · …and it did NOT red the already-committed lane or the ordinary code beside it",
      !live.blocks.some(([f]) => /reps_log|thing\.mjs/.test(f)));
    git("restore", "--staged", "dressing-room/state/afferent.jsonl");
    const live2 = tripwire({ repo: g, quiet: true });
    ok("TRIPWIRE LIVE-FIRE · unstaging the lane clears it — the refusal is about THIS commit, not a permanent lock",
      live2.ok === true);

    // ── 13. THE HOOK IS STILL SAFE ──
    const hookRes = hookProbe();
    ok("13. HOOK SAFETY · the extended afferent-post.mjs exits 0 and writes 0 bytes to stdout (its stdout would be injected into his prompt)",
      hookRes.code === 0 && hookRes.stdout === "", `exit ${hookRes.code}, stdout ${JSON.stringify(hookRes.stdout).slice(0, 120)}`);
    ok("13b. HOOK · it POSTs the new fields — ts_local + tz + tier + moment — alongside everything v2 already carried",
      !!hookRes.body && typeof hookRes.body.ts_local === "string" && hookRes.body.tz === ZONE
      && hookRes.body.tier === "private" && hookRes.body.moment && typeof hookRes.body.moment === "object" && hookRes.body.v === 3,
      JSON.stringify(hookRes.body || {}).slice(0, 300));
    ok("13c. HOOK · ts_local is the SAME INSTANT as ts, in wall-clock form (not a second clock that can drift)",
      !!hookRes.body && Math.abs(Date.parse(hookRes.body.ts_local) - Date.parse(hookRes.body.ts)) < 1000);
    ok("13d. HOOK · every missing hook field degrades to null and NOTHING throws (a capture nerve must never bite)",
      !!hookRes.bare && hookRes.bareCode === 0 && hookRes.bare.session_id === null && hookRes.bare.transcript_path === null && hookRes.bare.moment !== undefined);
    ok("13e. HOOK · the Supabase key that went to the bus unscrubbed on 14 Aug 2026 is now REDACTED, and his words around it SURVIVE",
      !!hookRes.secret && !/sb_publishable_[A-Za-z0-9]/.test(hookRes.secret.text) && /REDACTED/.test(hookRes.secret.text)
      && hookRes.secret.text.includes("supabase se connect") && Array.isArray(hookRes.secret.redactions) && hookRes.secret.redactions.length >= 1,
      JSON.stringify(hookRes.secret || {}).slice(0, 300));

    console.log(`\narchivist selftest: ${pass} passed, ${fail} failed`);
    return fail === 0 ? 0 : 1;
  } finally {
    try { rmSync(tmp, { recursive: true, force: true }); } catch { /* windows file locks */ }
  }
}

// Drives the REAL hook against a REAL local listener — the same shape the live
// commit 3fcce43 was proven with. A hook tested only by READING it is a hypothesis.
//
// WHY A CHILD SCRIPT AND NOT spawnSync FROM HERE: the listener and the hook must
// run concurrently. spawnSync blocks this process's event loop, so a server in
// THIS process could not answer the POST it is being sent — the hook would hit
// its own 250 ms timeout, swallow the failure (by design), and the probe would
// "pass" having measured nothing. The whole exchange therefore happens inside one
// async child that owns both ends and prints the result as JSON.
function hookProbe() {
  const hook = join(ROOT, "hooks", "afferent-post.mjs");
  if (!existsSync(hook)) return { code: 1, stdout: "", body: null };
  const dir = mkdtempSync(join(tmpdir(), "arsenal-hookprobe-"));
  const probe = join(dir, "probe.mjs");
  writeFileSync(probe, `
import http from "node:http";
import { spawn } from "node:child_process";
const HOOK = ${JSON.stringify(hook)}, CWD = ${JSON.stringify(ROOT)};
const rows = [];
const srv = http.createServer((req, res) => {
  let b = ""; req.on("data", (c) => (b += c));
  req.on("end", () => { try { rows.push(JSON.parse(b)); } catch { rows.push({ unparseable: b }); } res.writeHead(200, { "Content-Type": "application/json" }); res.end("{}"); });
});
await new Promise((r) => srv.listen(0, "127.0.0.1", r));
const env = { ...process.env, ARSENAL_THALAMUS: "http://127.0.0.1:" + srv.address().port };
delete env.ARSENAL_ORGAN;                      // the human's env, never an organ's
const fire = (payload) => new Promise((done) => {
  const p = spawn(process.execPath, [HOOK], { cwd: CWD, env });
  let out = "", err = "";
  p.stdout.on("data", (d) => (out += d));
  p.stderr.on("data", (d) => (err += d));
  p.on("close", (code) => done({ code, out, err }));
  p.stdin.end(JSON.stringify(payload));
});
const r1 = await fire({ hook_event_name: "UserPromptSubmit", prompt: "archivist hook probe - kya haal hai", session_id: "probe-sess", cwd: CWD, transcript_path: "C:/x/y.jsonl" });
const r2 = await fire({ hook_event_name: "UserPromptSubmit", prompt: "archivist hook probe - bare payload with nothing else" });
const r3 = await fire({ hook_event_name: "UserPromptSubmit", prompt: "supabase se connect kar raha hoon, key sb_publishable_AbCdEf0123456789xyz hai, ab aage kya karun", session_id: "probe-sess" });
await new Promise((r) => setTimeout(r, 250));
console.log(JSON.stringify({ r1, r2, r3, rows }));
srv.close();
process.exit(0);
`, "utf8");
  const r = spawnSync(process.execPath, [probe], { encoding: "utf8", timeout: 40000, cwd: ROOT });
  let j = null;
  try { j = JSON.parse(String(r.stdout || "").trim().split("\n").pop()); } catch { /* below */ }
  try { rmSync(dir, { recursive: true, force: true }); } catch { /* windows locks */ }
  if (!j) return { code: r.status ?? 1, stdout: String(r.stdout || ""), body: null, probe_failed: String(r.stderr || "").slice(0, 400) };
  const rows = j.rows || [];
  return {
    code: j.r1.code, stdout: j.r1.out || "",
    body: rows.find((x) => x.session_id === "probe-sess" && /kya haal hai/.test(x.text || "")) || null,
    bare: rows.find((x) => /bare payload/.test(x.text || "")) || null,
    bareCode: j.r2.code,
    secret: rows.find((x) => /supabase se connect/.test(x.text || "")) || null,
    secretCode: j.r3.code,
  };
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
function main() {
  const mode = (process.argv[2] || "status").toLowerCase();
  const arg = (flag) => { const i = process.argv.indexOf(flag); return i > 0 ? process.argv[i + 1] : null; };
  switch (mode) {
    case "init": return process.exit(initArchive().ok ? 0 : 1);
    case "run": return process.exit(runArchive().ok ? 0 : 1);
    case "backfill": return process.exit(runArchive({ force: true }).ok ? 0 : 1);
    case "verify": return process.exit(verifyArchive({ month: arg("--month") }).ok ? 0 : 1);
    // VITALS EXITS 0 EVEN ON A RED. Task Scheduler's Last Result is what
    // /organism-doctor reads to decide whether an ORGAN is alive, so "the organ
    // ran and found a silent lane" must not look like "the organ is broken" —
    // that conflation is how a real red gets ignored. The RED is on stdout and in
    // health/vitals-*.jsonl. `verify` is the opposite case and DOES exit 1: a
    // fixity break is corruption in the permanent record and must be loud.
    case "vitals": { vitalsArchive(); return process.exit(0); }
    case "seal": { sealArchive(); return process.exit(0); }
    case "rebuild": {
      const lane = process.argv[3];
      if (!lane) { console.log('archivist rebuild <lane> --why "<the reason>"   (drops a lane and re-derives it from source — refuses if any source is gone)'); return process.exit(1); }
      return process.exit(rebuildLane(lane, { why: arg("--why") }).ok ? 0 : 1);
    }
    case "lanes": { lanesReport(); return process.exit(0); }
    case "tripwire": return process.exit(tripwire().ok ? 0 : 1);
    case "status": { status(); return process.exit(0); }
    case "selftest": return process.exit(selftest());
    default:
      console.log("archivist: init | run | backfill | verify [--month YYYY-MM] | vitals | seal | rebuild <lane> | lanes | tripwire | status | selftest");
      return process.exit(1);
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
